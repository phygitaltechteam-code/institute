import { api } from "@/utils/axios";
import toast from "react-hot-toast";

export interface AddCoursePayload {
    name: string;
}
export const addSubject = async (data: AddCoursePayload, role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.post("admin/subjects", data);
            return response;
        } else if (role === 'TEACHER') {
            const response = await api.post("teacher/subjects", data);
            return response;
        }
        throw new Error('Invalid role');
    } catch (error) {
        console.log("erorrrrr", error);
        toast.error("course not add");

        throw error;
    }
};


export const getSubjects = async (role?: string) => {
    try {
        if (role === 'ADMIN') {
            const response = await api.get("admin/subjects");
            return response;
        } else if (role === 'TEACHER') {
            const response = await api.get("teacher/subjects");
            return response.data;
        }
        throw new Error('Invalid role');
    } catch (error) {
        console.log("erorrrrr", error);
        toast.error("course not add");

        throw error;
    }
};