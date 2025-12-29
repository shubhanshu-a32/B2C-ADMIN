import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Store, Tags, BarChart3, LogOut, Search, Bell, Moon, Sun } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import Logo from '../../assets/logo/Ketalog_Logo.jpeg';

export default function AdminLayout() {
    const location = useLocation();
    const logout = useAuthStore((s) => s.logout);
    const { theme, toggleTheme } = useThemeStore();

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/users", label: "Users", icon: Users },
        { path: "/admin/sellers", label: "Sellers", icon: Store },
        { path: "/admin/categories", label: "Categories", icon: Tags },
        { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { path: "/admin/profile", label: "Profile", icon: Users },
    ];

    const isActive = (path) => {
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
            {/* Top Navbar: Branding + Actions */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-6 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center h-16">

                {/* Brand / Logo Section */}
                <div className="flex items-center gap-3">
                    <Link to="/admin" className="flex items-center gap-3">
                        <img src={Logo} alt="Ketalog Logo" className="h-10 w-auto rounded object-contain" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                            KETALOG
                        </span>
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-lg transition font-medium"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Navigation Links Only (No Branding) */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-20 overflow-y-auto">
                    <nav className="flex-1 py-6 px-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                      ${active
                                            ? "bg-blue-600 text-white shadow-blue-500/30 shadow-lg translate-x-1"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <Icon size={20} className={active ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors"} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6 md:p-8 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}