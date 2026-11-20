// /admin/teachers

import { api } from "@/utils/axios"
import toast from "react-hot-toast"

const buildFacultyPayload = (facultyData: any) => {
    const mobile = facultyData?.mobile || facultyData?.phoneNumber || facultyData?.phone;
    const numericSalary = Number(String(facultyData?.salary || '').replace(/[^0-9.-]/g, ''));

    const payload: Record<string, any> = {
        fullname: facultyData?.name || facultyData?.fullname || facultyData?.fullName,
        username: mobile,
        email: facultyData?.email,
        password: facultyData?.password,
        phoneNumber: mobile,
        address: facultyData?.address,
        subject: facultyData?.subject,
        salary: Number.isFinite(numericSalary) ? numericSalary : facultyData?.salary,
        role: facultyData?.role || 'TEACHER',
    };

    // File documents
    if (facultyData?.adharcard instanceof File) payload.adharcard = facultyData.adharcard;
    if (facultyData?.panproof instanceof File) payload.panproof = facultyData.panproof;
    if (facultyData?.addressProof instanceof File) payload.addressProof = facultyData.addressProof;

    if (facultyData?.emergencyContact || facultyData?.enam || facultyData?.relationship) {
        payload.emergencyContact = facultyData?.emergencyContact || facultyData?.enam;
        payload.relationship = facultyData?.relationship;
    }

    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
};


export const addFaculty = async (facultyData: any) => {
    console.log('Adding faculty with data:', facultyData);

    try {
        const payload = buildFacultyPayload(facultyData);
        const hasFiles = Object.values(facultyData || {}).some((value) => value instanceof File);

        if (!hasFiles) {
            return await api.post('/admin/teachers', payload);
        }

        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        return await api.post('/admin/teachers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Faculty add failed:', { message, details, payload: buildFacultyPayload(facultyData) });
        toast.error(`Failed to add faculty: ${message}`);
        throw error;
    }
}

export const getFaculty = async () => {
    try {
        const response = await api.get('/admin/teachers');
        console.log('Fetched faculty data:', response.data);
        return response.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch faculty:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch faculty: ${message}`);
        throw error;
    }
};

export const getFacultyById = async (id: string) => {
    try {
        const response = await api.get(`/admin/teachers/${id}`);
        console.log('Fetched faculty data:', response.data);
        return response.data;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to fetch faculty:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to fetch faculty: ${message}`);
        throw error;
    }
}

export const deleteFaculty = async (id: string) => {
    try {
        const response = await api.delete(`/admin/teachers/${id}`);
        console.log('Deleted faculty:', response.data);
        return response.data;
    }
    catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        console.error('Failed to delete faculty:', { message, details: error?.response?.data?.errors });
        toast.error(`Failed to delete faculty: ${message}`);
        throw error;
    }
}

export const editFaculty = async (facultyData: any) => {
    console.log('Editing faculty with data:', facultyData);

    try {
        const payload = buildFacultyPayload(facultyData);
        const hasFiles = Object.values(facultyData || {}).some((value) => value instanceof File);

        if (!hasFiles) {
            return await api.put(`/admin/teachers/${facultyData.id}`, payload);
        }
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        return await api.put(`/admin/teachers/${facultyData.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Unknown error';
        const details = error?.response?.data?.errors;
        console.error('Faculty edit failed:', { message, details, payload: buildFacultyPayload(facultyData) });
        toast.error(`Failed to edit faculty: ${message}`);
        throw error;
    }
}

