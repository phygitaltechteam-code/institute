import {Role} from '@prisma/client';
import prisma from '../client';
import readline from 'readline';
import {encryptPassword} from '../utils/index';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

const main = async () => {
    try {
        console.log('=== User Registration CLI ===\n');

        // 1. Choose Role
        console.log('Select Role:');
        console.log('1. SUPERADMIN');
        console.log('2. ADMIN');
        console.log('3. TEACHER');
        console.log('4. STUDENT');

        let roleInput = '';
        let role: Role = Role.STUDENT;

        while (true) {
            roleInput = await askQuestion('Enter choice (1-4): ');
            if (roleInput === '1') {
                role = Role.SUPERADMIN;
                break;
            } else if (roleInput === '2') {
                role = Role.ADMIN;
                break;
            } else if (roleInput === '3') {
                role = Role.TEACHER;
                break;
            } else if (roleInput === '4') {
                role = Role.STUDENT;
                break;
            }
            console.log('Invalid choice. Please enter a number between 1 and 4.');
        }

        console.log(`\nRegistering user with role: ${role}\n`);

        // 2. Base User Information
        const username = (await askQuestion('Enter Username: ')).trim();
        const fullname = (await askQuestion('Enter Full Name: ')).trim();
        const email = (await askQuestion('Enter Email: ')).trim();
        const password = await askQuestion('Enter Password: ');
        const phoneNumber = (await askQuestion('Enter Phone Number: ')).trim();
        const secondaryPhoneNumberInput = (
            await askQuestion('Enter Secondary Phone Number (optional): ')
        ).trim();
        const secondaryPhoneNumber = secondaryPhoneNumberInput || null;

        if (!username || !fullname || !email || !password || !phoneNumber) {
            console.error(
                'Error: Username, Full Name, Email, Password, and Phone Number are required.',
            );
            rl.close();
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{username}, {email}, {phoneNumber}],
            },
        });

        if (existingUser) {
            console.error(
                'Error: A user already exists with this username, email, or phone number.',
            );
            rl.close();
            return;
        }

        // Variables for profiles
        let city = '';
        let state = '';
        let country = '';
        let pincode = '';
        let address = '';
        let logo: string | null = null;
        let tagLine: string | null = null;
        let pin: string | null = null;
        let gst: string | null = null;
        let adminId = ''; // Custom code for ADMIN, or DB ID for TEACHER/STUDENT

        // Teacher specific fields
        let subject: string | null = null;
        let salary: number | null = null;
        let adharcard: string | null = null;
        let addressProof: string | null = null;
        let panproof: string | null = null;
        let emergencyContact: string | null = null;
        let Relationship: string | null = null;
        let emergencyContactNumber: string | null = null;

        // 3. For ADMIN, TEACHER, STUDENT, collect profile fields
        if (role !== Role.SUPERADMIN) {
            console.log('\n--- Profile Information ---');
            if (role === Role.TEACHER) {
                address = (await askQuestion('Enter Address: ')).trim();
                if (!address) {
                    console.error('Error: Address is required.');
                    rl.close();
                    return;
                }
                subject = (await askQuestion('Enter Subject (optional): ')).trim() || null;
                const salaryInput = (await askQuestion('Enter Salary (optional): ')).trim();
                salary = salaryInput ? parseFloat(salaryInput) : null;
                adharcard = (await askQuestion('Enter Aadhar Card (optional): ')).trim() || null;
                addressProof =
                    (await askQuestion('Enter Address Proof URL/details (optional): ')).trim() ||
                    null;
                panproof =
                    (await askQuestion('Enter PAN Proof URL/details (optional): ')).trim() || null;
                emergencyContact =
                    (await askQuestion('Enter Emergency Contact Name (optional): ')).trim() || null;
                Relationship =
                    (
                        await askQuestion('Enter Relationship with Emergency Contact (optional): ')
                    ).trim() || null;
                emergencyContactNumber =
                    (await askQuestion('Enter Emergency Contact Number (optional): ')).trim() ||
                    null;
            } else {
                city = (await askQuestion('Enter City: ')).trim();
                state = (await askQuestion('Enter State: ')).trim();
                country = (await askQuestion('Enter Country: ')).trim();
                pincode = (await askQuestion('Enter Pincode: ')).trim();
                address = (await askQuestion('Enter Address: ')).trim();
                logo = (await askQuestion('Enter Logo URL (optional): ')).trim() || null;
                tagLine = (await askQuestion('Enter Tag Line (optional): ')).trim() || null;
                pin = (await askQuestion('Enter PIN (optional): ')).trim() || null;
                gst = (await askQuestion('Enter GST (optional): ')).trim() || null;

                if (!city || !state || !country || !pincode || !address) {
                    console.error(
                        'Error: City, State, Country, Pincode, and Address are required.',
                    );
                    rl.close();
                    return;
                }
            }

            if (role === Role.ADMIN) {
                adminId = (
                    await askQuestion('Enter Custom Admin/Institute ID (e.g. ADM-101): ')
                ).trim();
                if (!adminId) {
                    console.error('Error: Admin/Institute ID is required.');
                    rl.close();
                    return;
                }
            } else {
                // For TEACHER and STUDENT, we need to link to an Admin's database ID
                console.log('\nFetching active Admin/Institute accounts from database...');
                const admins = await prisma.admin.findMany({
                    include: {
                        user: {
                            select: {
                                fullname: true,
                            },
                        },
                    },
                });

                if (admins.length === 0) {
                    console.error('\nError: No Admin/Institute accounts found in the database.');
                    console.error(
                        'Please create an Admin account first before adding Teachers or Students.',
                    );
                    rl.close();
                    return;
                }

                console.log('\nAvailable Admin/Institute accounts:');
                admins.forEach((adm, idx) => {
                    console.log(
                        `[${idx + 1}] Name: ${adm.user.fullname} | AdminCode: ${adm.adminId} | ID: ${adm.id}`,
                    );
                });

                while (true) {
                    const adminChoice = (
                        await askQuestion(
                            `Select Admin (1-${admins.length}) or enter custom Admin DB ID: `,
                        )
                    ).trim();
                    const choiceIdx = parseInt(adminChoice, 10) - 1;

                    if (choiceIdx >= 0 && choiceIdx < admins.length) {
                        adminId = admins[choiceIdx].id;
                        break;
                    } else {
                        // Check if it is a valid UUID of an existing admin
                        const customAdmin = await prisma.admin.findUnique({
                            where: {id: adminChoice},
                        });
                        if (customAdmin) {
                            adminId = customAdmin.id;
                            break;
                        }
                    }
                    console.log(
                        'Invalid choice. Please enter a valid index number or a valid Admin DB ID.',
                    );
                }
            }
        }

        // Encrypt password
        const hashedPassword = await encryptPassword(password);

        // 4. Create in Database
        console.log('\nCreating user in database...');
        await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username,
                    fullname,
                    email,
                    password: hashedPassword,
                    phoneNumber,
                    secondaryPhoneNumber,
                    role,
                    isVerified: true,
                    isActive: true,
                },
            });

            if (role === Role.ADMIN) {
                await tx.admin.create({
                    data: {
                        userId: newUser.id,
                        city,
                        state,
                        logo,
                        tagLine,
                        pin,
                        gst,
                        country,
                        pincode,
                        address,
                        adminId,
                    },
                });
            } else if (role === Role.TEACHER) {
                await tx.teacher.create({
                    data: {
                        userId: newUser.id,
                        subject,
                        salary,
                        adharcard,
                        addressProof,
                        panproof,
                        emergencyContact,
                        Relationship,
                        emergencyContactNumber,
                        address,
                        adminId,
                    },
                });
            } else if (role === Role.STUDENT) {
                await tx.student.create({
                    data: {
                        userId: newUser.id,
                        city,
                        state,
                        logo,
                        tagLine,
                        pin,
                        gst,
                        country,
                        pincode,
                        address,
                        adminId,
                    },
                });
            }
        });

        console.log(`\nSuccess! Registered ${role} user: ${username} (Full Name: ${fullname})`);
    } catch (err) {
        console.error('An error occurred during registration:', err);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
};

main();
