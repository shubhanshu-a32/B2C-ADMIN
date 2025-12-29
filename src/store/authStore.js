import { create } from "zustand";

const useAuthStore = create((set) => ({
    user: (() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    })() || null,
    accessToken: localStorage.getItem("accessToken") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    isAuthenticated: !!localStorage.getItem("accessToken"),

    login: (user, accessToken, refreshToken) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },
}));

export default useAuthStore;
