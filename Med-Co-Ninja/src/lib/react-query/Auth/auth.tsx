import { loginFaculty } from "@/lib/api/Auth/auth";
import { useMutation } from "@tanstack/react-query";
import { QUERY_KEYS } from "../queryKeys";

export const useCustomerLogin = () => {
    return useMutation({
        mutationFn: loginFaculty,
        onSuccess: (res) => {
            const tokenPayload = {
                accessToken: res.data?.accessToken,
                refreshToken: res.data?.refreshToken,
            };

            if (tokenPayload.accessToken) {
                localStorage.setItem(QUERY_KEYS.TOKEN, JSON.stringify(tokenPayload));
                localStorage.setItem(
                    QUERY_KEYS.FACULTY,
                    JSON.stringify(res.data?.user),
                );
            }
        },
        onError: (error: Error) => {
            console.error('Error during login:', error.message);
        },
    });
};
