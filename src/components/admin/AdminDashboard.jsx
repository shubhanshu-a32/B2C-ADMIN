import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { Users, ShoppingBag, DollarSign, TrendingUp, Package, ExternalLink } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/analytics")
                ]);

                console.log("Stats Response:", statsRes.data);

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
                    totalCommission: calculatedCommission
                });

            } catch (err) {
                console.error("Failed to load dashboard data", err);
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-500 font-medium">
                <TrendingUp size={14} className="mr-1" />
                <span>+12.5% from last month</span>
            </div>
        </div>
    );

    const handleDownloadReport = () => {
        if (!stats) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("Ketalog - Admin Report", 14, 20);

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        // Summary Stats
        doc.setFontSize(14);
        doc.text("Overview", 14, 40);

        const summaryData = [
            ["Total Revenue", `Rs ${stats.totalRevenue?.toLocaleString()}`],
            ["Total Commission", `Rs ${stats.totalCommission?.toLocaleString() || 0}`],
            ["Total Orders", stats.totalOrders?.toString()],
            ["Active Sellers", stats.revenueBySeller?.length?.toString()]
        ];

        doc.autoTable({
            startY: 45,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [66, 133, 244] }
        });

        // Sellers Table
        doc.text("Top Sellers Performance", 14, doc.lastAutoTable.finalY + 15);

        const sellerData = stats.revenueBySeller?.map(s => [
            s.sellerName || "Unknown",
            s._id || "N/A",
            s.orders,
            `Rs ${s.total?.toLocaleString()}`,
            "Active"
        ]) || [];

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Shop Name', 'Seller ID', 'Orders', 'Revenue', 'Status']],
            body: sellerData,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }
        });

        doc.save("admin_report.pdf");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, Admin</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:opacity-80 transition flex items-center gap-2"
                >
                    <Package size={16} />
                    Download Report
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
                    icon={DollarSign}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Total Commission"
                    value={`₹${stats.totalCommission?.toLocaleString() || 0}`}
                    icon={DollarSign}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue by Seller Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Performing Sellers</h2>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Orders</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.revenueBySeller?.map((s) => (
                                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center group cursor-pointer" onClick={() => navigate(`/buyer/seller/${s._id}`)}>
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3 shadow-sm group-hover:scale-110 transition-transform">
                                                    {s.sellerName ? s.sellerName.substring(0, 2).toUpperCase() : "??"}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm block group-hover:text-blue-600 transition-colors">
                                                        {s.sellerName || "Unknown Seller"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">View Shop</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                {s.orders} orders
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            ₹{s.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.revenueBySeller || stats.revenueBySeller.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">No sales data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity / Notifications Mock */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">New seller registration</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
