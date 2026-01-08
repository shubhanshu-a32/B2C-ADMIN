import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, User, Store, Package, LogOut, Sun, Moon, Truck, ChevronLeft, ChevronRight, CheckSquare, Menu, X, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Logo from '../../assets/logo/Ketalog_Logo.jpeg';
import { useState, useEffect } from 'react';

export default function AdminLayout() {
    const location = useLocation();
    const { logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    // Desktop collapse state
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Mobile sidebar open state
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/seller-analytics", label: "Seller Analytics", icon: TrendingUp },
        { path: "/admin/orders", label: "Orders Received", icon: Package },
        { path: "/admin/completed-orders", label: "Completed Orders", icon: CheckSquare },
        { path: "/admin/delivery", label: "Delivery Boys", icon: Truck },
        { path: "/admin/users", label: "Buyer Management", icon: Users },
        { path: "/admin/sellers", label: "Seller Management", icon: Store },
        { path: "/admin/categories", label: "Categories", icon: Store },
        { path: "/admin/profile", label: "Profile", icon: User },
    ];

    const isActive = (path) => {
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
            {/* Top Navbar */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center h-16">

                {/* Brand / Logo Section */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-2 -ml-2 mr-1 text-gray-600 dark:text-gray-300 md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <Menu size={24} />
                    </button>

                    <Link to="/admin" className="flex items-center gap-2 sm:gap-3">
                        <img src={Logo} alt="Ketalog Logo" className="h-8 sm:h-10 w-auto rounded object-contain" />
                        <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                            KETALOG
                        </span>
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-lg transition font-medium"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Mobile Backdrop */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                {/* Sidebar Navigation */}
                <aside
                    className={`
                        fixed md:relative z-50 h-[calc(100vh-64px)] md:h-auto
                        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col 
                        transition-all duration-300 ease-in-out
                        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                        w-64 shadow-xl md:shadow-none
                    `}
                >
                    {/* Toggle Button Inside Sidebar Header (Desktop Only) */}
                    <div className="hidden md:flex p-4 justify-end">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition"
                        >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                    </div>

                    {/* Mobile Close Button (Optional, can just click outside, but good for accessibility) */}
                    <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
                        <button onClick={() => setIsMobileOpen(false)} className="p-1 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // Check active using exact or startsWith logic
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    title={isCollapsed ? item.label : ""}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm whitespace-nowrap
                                    ${active
                                            ? "bg-blue-600 text-white shadow-blue-500/30 shadow-lg"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        }
                                    ${isCollapsed ? 'md:justify-center' : ''}
                                    `}
                                >
                                    <div className={`min-w-[20px] flex items-center ${isCollapsed ? 'md:justify-center' : ''}`}>
                                        <Icon size={20} className={active ? "text-white" : "text-gray-400 dark:text-gray-500 transition-colors"} />
                                    </div>

                                    {/* On mobile, always show label. On desktop, respect isCollapsed */}
                                    <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}