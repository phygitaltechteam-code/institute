import { api } from "@/utils/axios";


export const getDashboardStats = async () => {
    try {
        const response = await api.get('student/daily-tasks/stats');
        return response.data;
    } catch (error) {
        throw error;
    }
}