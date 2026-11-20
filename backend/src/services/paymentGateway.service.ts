import crypto from 'crypto';
import axios from 'axios';
import httpStatus from 'http-status';
import prisma from '@client';
import {ApiError} from '@utils/index';
import feeService from './admin/fee.service';

/**
 * Razorpay Payment Links for student fees.
 *  - Staff create a link for a student's pending amount and share it (WhatsApp / copy).
 *  - When the student pays, Razorpay calls our webhook (or staff press "Check status");
 *    the payment is then recorded exactly once as a normal fee collection in the "Razorpay (Online)" account.
 *
 * Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 */
const RZP = 'https://api.razorpay.com/v1';
const ONLINE_ACCOUNT = 'Razorpay (Online)';

const keys = () => ({
    id: process.env.RAZORPAY_KEY_ID || '',
    secret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
});

const rzp = () => {
    const {id, secret} = keys();
    if (!id || !secret) {
        throw new ApiError(
            httpStatus.SERVICE_UNAVAILABLE,
            'Online payments are not set up yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env',
        );
    }
    return axios.create({baseURL: RZP, auth: {username: id, password: secret}, timeout: 15000});
};

const rzpError = (e: any): never => {
    const msg = e?.response?.data?.error?.description || e?.message || 'Payment gateway error';
    throw new ApiError(httpStatus.BAD_GATEWAY, `Razorpay: ${msg}`);
};

class PaymentGatewayService {
    isConfigured() {
        const {id, secret} = keys();
        return Boolean(id && secret);
    }

    async createLink(adminId: string, studentId: string, amountInput: number | undefined, createdBy?: string) {
        const student = await prisma.student.findFirst({
            where: {id: studentId, adminId},
            include: {user: {select: {fullname: true, phoneNumber: true, email: true}}},
        });
        if (!student) throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');

        const pending = Math.round(student.pendingFees ?? 0);
        const amount = Math.round(amountInput ?? pending);
        if (!(amount > 0)) throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be greater than 0');
        if (amount > pending) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Amount (₹${amount}) is more than the pending fee (₹${pending})`);
        }

        const client = rzp();
        const phone = (student.user.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const {data} = await client
            .post('/payment_links', {
                amount: amount * 100, // paise
                currency: 'INR',
                accept_partial: false,
                description: `Course fee – ${student.user.fullname}`.slice(0, 2048),
                reference_id: `MCN${Date.now()}`.slice(0, 40),
                expire_by: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60, // valid for 15 days
                customer: {
                    name: student.user.fullname,
                    ...(phone ? {contact: `+91${phone}`} : {}),
                    ...(student.user.email ? {email: student.user.email} : {}),
                },
                notify: {sms: false, email: false},
                reminder_enable: true,
                notes: {studentId, adminId},
            })
            .catch(rzpError);

        return prisma.paymentLink.create({
            data: {
                adminId,
                studentId,
                linkId: data.id,
                shortUrl: data.short_url,
                amount,
                status: data.status || 'created',
                createdBy: createdBy || null,
            },
        });
    }

    listLinks(adminId: string, studentId?: string) {
        return prisma.paymentLink.findMany({
            where: {adminId, ...(studentId ? {studentId} : {})},
            orderBy: {createdAt: 'desc'},
            take: 100,
        });
    }

    /** Pull the latest status from Razorpay (fallback when the webhook is not configured). */
    async syncLink(adminId: string, id: string) {
        const link = await prisma.paymentLink.findFirst({where: {id, adminId}});
        if (!link) throw new ApiError(httpStatus.NOT_FOUND, 'Payment link not found');
        if (link.status === 'paid') return link;

        const {data} = await rzp().get(`/payment_links/${link.linkId}`).catch(rzpError);
        if (data.status === 'paid') {
            const paymentId = data.payments?.[0]?.payment_id || null;
            await this.recordPaid(link.linkId, paymentId, Number(data.amount_paid) / 100);
        } else if (data.status !== link.status) {
            await prisma.paymentLink.update({where: {id: link.id}, data: {status: data.status}});
        }
        return prisma.paymentLink.findUnique({where: {id: link.id}});
    }

    async cancelLink(adminId: string, id: string) {
        const link = await prisma.paymentLink.findFirst({where: {id, adminId}});
        if (!link) throw new ApiError(httpStatus.NOT_FOUND, 'Payment link not found');
        if (link.status === 'paid') throw new ApiError(httpStatus.BAD_REQUEST, 'This link is already paid');
        await rzp().post(`/payment_links/${link.linkId}/cancel`).catch(rzpError);
        return prisma.paymentLink.update({where: {id: link.id}, data: {status: 'cancelled'}});
    }

    /** Records a paid link exactly once (safe if webhook and manual check race). */
    async recordPaid(linkId: string, paymentId: string | null, amountPaid: number) {
        const claimed = await prisma.paymentLink.updateMany({
            where: {linkId, status: {not: 'paid'}},
            data: {status: 'paid', paymentId},
        });
        if (claimed.count === 0) return; // already recorded

        const link = await prisma.paymentLink.findUnique({where: {linkId}});
        if (!link) return;
        try {
            const student = await prisma.student.findUnique({where: {id: link.studentId}});
            const amount = Math.min(Math.round(amountPaid || link.amount), Math.round(student?.pendingFees ?? 0));
            if (amount <= 0) return; // nothing left to adjust (dues already cleared manually)

            let account = await prisma.accounts.findFirst({where: {adminId: link.adminId, name: ONLINE_ACCOUNT}});
            if (!account) {
                account = await prisma.accounts.create({data: {adminId: link.adminId, name: ONLINE_ACCOUNT}});
            }
            const fee = await feeService.collectFee({studentId: link.studentId, amount, accountId: account.id} as any);
            await prisma.paymentLink.update({where: {linkId}, data: {feesCollectId: fee.id}});
        } catch (e) {
            // release the claim so a retry (webhook redelivery / Check status) can record it
            await prisma.paymentLink.update({where: {linkId}, data: {status: 'created'}});
            throw e;
        }
    }

    /** Razorpay webhook: verify signature on the raw body, then record payment_link.paid events. */
    async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined, body: any) {
        const {webhookSecret} = keys();
        if (!webhookSecret) throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Webhook secret not configured');
        const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody || '').digest('hex');
        const valid =
            Boolean(signature) &&
            expected.length === signature!.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature!));
        if (!valid) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook signature');

        if (body?.event === 'payment_link.paid') {
            const link = body.payload?.payment_link?.entity;
            const payment = body.payload?.payment?.entity;
            if (link?.id) await this.recordPaid(link.id, payment?.id ?? null, Number(link.amount_paid) / 100);
        }
        return {received: true};
    }

    /** Open (unpaid, unexpired) links for the student panel "Pay now" notifications. */
    openLinksForStudent(studentId: string) {
        return prisma.paymentLink.findMany({
            where: {
                studentId,
                status: {in: ['created', 'partially_paid']},
                createdAt: {gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)},
            },
            orderBy: {createdAt: 'desc'},
        });
    }
}

export default new PaymentGatewayService();
