import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { Users, ShoppingBag, IndianRupee, TrendingUp, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats, Analytics, and Lists for "Recent Activity"
                const [statsRes, analyticsRes, ordersRes, sellersRes, buyersRes] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/analytics"),
                    api.get("/admin/orders"),
                    api.get("/admin/sellers"),
                    api.get("/admin/users") // Buyers
                ]);



                // --- Build Recent Activity Feed ---
                let activities = [];

                // 1. Recent Orders
                if (Array.isArray(ordersRes.data)) {
                    ordersRes.data.forEach(o => {
                        activities.push({
                            type: 'order',
                            date: o.createdAt,
                            message: `New order from ${o.buyer?.fullName || 'Guest'} (₹${o.totalAmount})`
                        });
                    });
                }

                // 2. Recent Sellers
                if (Array.isArray(sellersRes.data)) {
                    sellersRes.data.forEach(s => {
                        activities.push({
                            type: 'seller',
                            date: s.createdAt, // Or s.userId.createdAt
                            message: `New seller registered: ${s.shopName || 'Unknown Shop'}`
                        });
                    });
                }

                // 3. Recent Buyers
                if (Array.isArray(buyersRes.data)) {
                    buyersRes.data.forEach(u => {
                        activities.push({
                            type: 'buyer',
                            date: u.createdAt,
                            message: `New buyer joined: ${u.fullName || 'User'}`
                        });
                    });
                }

                // Sort by Date Descending
                activities.sort((a, b) => new Date(b.date) - new Date(a.date));

                // Calculate Total Commission from Analytics Data
                let calculatedCommission = 0;
                if (Array.isArray(analyticsRes.data)) {
                    calculatedCommission = analyticsRes.data.reduce((sum, record) => {
                        const platformComm = record.platformCommission || 0;

                        // Calculate Delivery Commission: Shipping Charge - Delivery Partner Fee
                        // Ensure values are numbers and non-negative
                        const shipping = Number(record.orderId?.shippingCharge) || 0;
                        const partnerFee = Number(record.deliveryPartnerFee) || 0;
                        const deliveryComm = Math.max(0, shipping - partnerFee);

                        return sum + platformComm + deliveryComm;
                    }, 0);
                }

                setStats({
                    ...statsRes.data,
                    totalCommission: calculatedCommission,
                    recentActivity: activities // Add computed activity list
                });

            } catch (err) {
                toast.error("Failed to load dashboard stats");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    );

    if (!stats) return <div className="text-center text-red-500 mt-10">Failed to load dashboard data.</div>;

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-2 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );



    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Welcome back, Admin</p>
                </div>

            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
                    icon={IndianRupee}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Total Commission"
                    value={`₹${stats.totalCommission?.toLocaleString() || 0}`}
                    icon={IndianRupee}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders || 0}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Sellers"
                    value={stats.revenueBySeller?.length || 0}
                    icon={Users}
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue by Seller Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Top Performing Sellers</h2>
                        <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Orders</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.revenueBySeller?.slice(0, 5).map((s) => (
                                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center group cursor-pointer" onClick={() => navigate(`/buyer/seller/${s._id}`)}>
                                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] mr-2 shadow-sm group-hover:scale-110 transition-transform">
                                                    {s.sellerName ? s.sellerName.substring(0, 2).toUpperCase() : "??"}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs block group-hover:text-blue-600 transition-colors">
                                                        {s.sellerName || "Unknown Seller"}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">View Shop</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                {s.orders} orders
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white text-xs">
                                            ₹{s.total.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Active</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.revenueBySeller || stats.revenueBySeller.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-6 text-gray-500 text-sm">No sales data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity (Moved Here) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col h-full">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Recent Activity</h2>
                    <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        {stats.recentActivity?.slice(0, 8).map((activity, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${activity.type === 'order' ? 'bg-blue-500' :
                                        activity.type === 'seller' ? 'bg-purple-500' :
                                            'bg-green-500'
                                        }`}></div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-tight">
                                        {activity.message}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {new Date(activity.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                            <p className="text-gray-500 text-xs">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-purple-500" />
                    Sales by Category
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2 rounded-l-lg">Category</th>
                                <th className="px-4 py-2 text-center">Items Sold</th>
                                <th className="px-4 py-2 text-right rounded-r-lg">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.ordersByCategory?.length > 0 ? (
                                stats.ordersByCategory.map((cat, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                            {cat._id || "Uncategorized"}
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-300">
                                            {cat.count}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-green-600 dark:text-green-400">
                                            ₹{cat.revenue?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                                        No category data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
