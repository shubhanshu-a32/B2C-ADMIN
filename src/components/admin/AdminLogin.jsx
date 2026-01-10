import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import { Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const { theme, toggleTheme } = useThemeStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { email, password };

            console.log("Sending Login Payload:", payload);
            const res = await api.post("/admin/login", payload);
            const { accessToken, refreshToken, admin } = res.data;

            login({ ...admin, role: "admin" }, accessToken, refreshToken);

            toast.success("Welcome back, Admin!");
            navigate("/admin");
        } catch (err) {
            console.error("Login Error Details:", err.response);
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden font-sans">

            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none transition-colors duration-500 bg-gradient-to-br from-gray-800 to-black" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>



            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md shadow-lg hover:scale-110 transition z-50 text-gray-800 dark:text-yellow-400"
            >
                {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            <div className="w-full max-w-md mx-4 bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Admin Portal
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Secure access for administrators only
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all dark:text-white"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg bg-black hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 transform transition-all duration-200 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Login to Dashboard"}
                    </button>

                    <div className="flex dark:text-white items-center justify-center">
                        Ketalog Admin
                    </div>
                </form>
            </div>
        </div>
    )
}