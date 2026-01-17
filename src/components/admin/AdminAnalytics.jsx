import { useEffect, useState } from "react";
import api from "../../services/api";
import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from "lucide-react";

export default function AdminAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/admin/stats")
            .then((res) => setStats(res.data))
            .catch((err) => {
                toast.error("Failed to load analytics");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!stats) return <div className="text-center p-8 text-gray-500">No data available</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed performance metrics</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-white whitespace-nowrap">7 Days</button>
                    <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition whitespace-nowrap">30 Days</button>
                    <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition whitespace-nowrap">All Time</button>
                </div>
            </div>

            {/* Category Performance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales by Category</h2>
                        <p className="text-sm text-gray-500">Performance across product verticals</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {stats.ordersByCategory?.length > 0 ? (
                        stats.ordersByCategory.map((cat, index) => {
                            // Calculate percentage (mock total for now if not available)
                            const max = Math.max(...stats.ordersByCategory.map(c => c.count));
                            const percent = (cat.count / max) * 100;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-700 dark:text-gray-300">{cat._id}</span>
                                        <div className="flex gap-4">
                                            <span className="text-gray-500">{cat.count} Orders</span>
                                            <span className="text-gray-900 dark:text-white font-bold">₹{cat.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'][index % 4]}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-400">No category data found.</div>
                    )}
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
                    <Calendar className="mb-4 opacity-80" size={24} />
                    <h3 className="text-lg font-semibold mb-1">Peak Sales Time</h3>
                    <p className="text-3xl font-bold">8:00 PM</p>
                    <p className="text-xs opacity-70 mt-2">Most activity happens in the evening</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Avg. Order Value</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₹{Math.round(stats.totalRevenue / (stats.totalOrders || 1)).toLocaleString()}
                    </p>
                    <div className="mt-4 flex items-center text-green-500 text-sm font-medium">
                        <TrendingUp size={16} className="mr-1" />
                        +5.2% vs last week
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Returns Rate</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">2.4%</p>
                    <div className="mt-4 flex items-center text-green-500 text-sm font-medium">
                        <TrendingUp size={16} className="mr-1" />
                        -0.8% decrease (Good)
                    </div>
                </div>
            </div>
        </div>
    );
}
