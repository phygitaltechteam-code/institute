import { api } from "@/utils/axios"

export const addFees = async (data: any, role: string) => {
    const url = role === "ADMIN" ? `/admin/fees/collect` : `/teacher/fees/collect`;
    const response = await api.post(url, data);
    return response;
}

export const addFeesFollowup = async (payload: any, role: string) => {
    console.log(role)
    try {
            const response = role === "ADMIN" ? api.post('/admin/fees/followups', payload) : api.post('/teacher/fees/followups', payload);
        return response;
    } catch (error) {
        console.log(error);
    }
}