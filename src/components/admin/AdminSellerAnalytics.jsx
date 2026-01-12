import { useEffect, useState } from "react";
import api from "../../services/api";
import { TrendingUp, Search, RefreshCcw, User, Store, X, Trash2, CheckCircle, Circle, DollarSign, Truck, Calendar, CheckSquare, Square, FileText, Sheet } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSellerAnalytics() {
    // State stores SellerAnalytics records
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter States
    const [filterType, setFilterType] = useState('all_time'); // 'date', 'week', 'month', 'all_time'

    // Initialize selectedDate with Local Date (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
    });

    // viewOrder now stores the ENTIRE analytics record for context
    const [viewRecord, setViewRecord] = useState(null);

    useEffect(() => {
        // When filter changes, we just ensure data is there. The filtering happens in render.
        // We always fetch 'all' now to ensure client-side filtering works robustly.
        if (analyticsData.length === 0) fetchAnalytics(false);

        const interval = setInterval(() => {
            fetchAnalytics(false, true); // Polling fetch
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []); // Only mount

    const fetchAnalytics = async (isManual = false, isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            // Fetch ALL data and filter client-side to ensure accuracy regardless of backend timezone/logic
            const res = await api.get("/admin/analytics", { params: {} });
            console.log("Fetching Analytics (Client Side Filtering Mode)");

            if (Array.isArray(res.data)) {
                // Map Backend Status (COMPLETED/PENDING) to Frontend Boolean
                const data = res.data.map(item => ({
                    ...item,
                    // If backend sends 'COMPLETED', it's true. Fallback to existing boolean logic if mixed.
                    isPlatformCommissionPaid: item.platformCommissionStatus === 'COMPLETED' || item.isPlatformCommissionPaid === true,
                    isDeliveryCommissionPaid: item.deliveryPartnerFeeStatus === 'COMPLETED' || item.isDeliveryCommissionPaid === true
                }));
                // Sort by createdAt desc locally (robust sort)
                data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.orderId?.createdAt || 0);
                    const dateB = new Date(b.createdAt || b.orderId?.createdAt || 0);
                    return dateB - dateA;
                });
                setAnalyticsData(data);
                if (isManual) toast.success("Analytics Refreshed");
            } else {
                console.error("Unexpected response format:", res.data);
                if (!isPolling) {
                    setAnalyticsData([]);
                    toast.error("Received invalid data from server");
                }
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            if (!isPolling) toast.error("Failed to fetch analytics data");
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const deleteAnalytics = async (id) => {
        if (!window.confirm("Are you sure you want to delete this analytics record? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/analytics/${id}`);
            setAnalyticsData(prev => prev.filter(item => item._id !== id));
            toast.success("Record deleted successfully");
        } catch (err) {
            console.error("Delete Error:", err);
            toast.error("Failed to delete record");
        }
    };

    // Toggle Payment Status
    const togglePaymentStatus = async (recordId, type) => {
        const item = analyticsData.find(i => i._id === recordId);
        if (!item) return;

        // Determine field names
        const booleanField = type === 'platform' ? 'isPlatformCommissionPaid' : 'isDeliveryCommissionPaid';
        const backendField = type === 'platform' ? 'platformCommissionStatus' : 'deliveryPartnerFeeStatus';

        const newValue = !item[booleanField]; // Toggle current boolean state
        const statusString = newValue ? 'COMPLETED' : 'PENDING';

        // 1. Optimistic Update
        setAnalyticsData(prev => prev.map(r => {
            if (r._id === recordId) {
                return { ...r, [booleanField]: newValue, [backendField]: statusString };
            }
            return r;
        }));

        try {
            // 2. Send to Backend
            // Payload: { platformCommissionStatus: "COMPLETED" } etc.
            await api.put(`/admin/analytics/${recordId}`, {
                [backendField]: statusString
            });
            toast.success("Status updated");
        } catch (err) {
            console.error("Update Status Error:", err);
            toast.error("Failed to update status on server");
            // Revert on error
            setAnalyticsData(prev => prev.map(r => {
                if (r._id === recordId) {
                    return { ...r, [booleanField]: !newValue, [backendField]: !newValue ? 'COMPLETED' : 'PENDING' };
                }
                return r;
            }));
        }
    };

    // Helper to extract commission string from nested order items
    const getCommissionString = (order) => {
        if (!order || !order.items || !Array.isArray(order.items)) return "0%";
        const uniqueComms = [];
        order.items.forEach(item => {
            if (!item) return;
            const comm = item.commission || item.product?.commission || 0;
            if (!uniqueComms.includes(comm)) uniqueComms.push(comm);
        });
        return uniqueComms.join(", ") + "%";
    };

    const isDateInFilter = (dateStr, type, referenceDateStr) => {
        if (!dateStr || !referenceDateStr) return false;
        const d = new Date(dateStr); // Record Date (UTC)

        // Check for invalid date
        if (isNaN(d.getTime())) return false;

        if (type === 'date') {
            // Compare YYYY-MM-DD in browser's locale (which matches User's perspective)
            const localYMD = d.toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD
            return localYMD === referenceDateStr;
        }

        if (type === 'week') {
            const [y, m, day] = referenceDateStr.split('-').map(Number);
            const refDate = new Date(y, m - 1, day); // Local 00:00

            const currentDay = refDate.getDay(); // 0-6
            const startOfWeek = new Date(refDate);
            startOfWeek.setDate(refDate.getDate() - currentDay);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return d >= startOfWeek && d <= endOfWeek;
        }

        if (type === 'month') {
            const [y, m] = referenceDateStr.split('-').map(Number);
            return d.getFullYear() === y && (d.getMonth() + 1) === m;
        }

        return true;
    };

    const filteredAnalytics = analyticsData.filter(record => {
        if (!record) return false;
        const orderId = record.orderId ? (record.orderId._id || "") : "";
        const shopName = record.sellerId ? (record.sellerId.shopName || "") : "";
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = (
            orderId.toLowerCase().includes(searchLower) ||
            shopName.toLowerCase().includes(searchLower)
        );

        if (!matchesSearch) return false;

        // DATE FILTER (Client Side Logic)
        if (filterType === 'all_time') return true;

        // Use record.createdAt or fallback to order.createdAt
        // This handles cases where SellerAnalytics records might miss 'createdAt' due to backend bugs
        const recordDate = record.createdAt || (record.orderId ? record.orderId.createdAt : null);

        return isDateInFilter(recordDate, filterType, selectedDate);
    });

    const downloadReport = async (type) => {
        try {
            const params = {
                filter: filterType,
                date: selectedDate,
                search: searchTerm
            };

            const response = await api.get(`/admin/analytics/download/${type}`, {
                params,
                responseType: 'blob' // Important for file download
            });

            // Create a link to download the file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics_${filterType}_${selectedDate}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`${type === 'excel' ? 'Excel' : 'PDF'} downloaded successfully`);
        } catch (err) {
            console.error("Download Error:", err);
            toast.error("Failed to download report");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="text-blue-600" size={32} />
                        Seller Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage earnings, verify payments, and track commissions.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    {/* Date Picker - Always Visible, Left of Filters */}
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            max={new Date().toISOString().split('T')[0]} // Disable future dates
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                if (filterType === 'all_time') setFilterType('date'); // Auto-switch
                            }}
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white h-full w-full sm:w-auto"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>

                    <div className="flex flex-wrap items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        {['date', 'week', 'month', 'all_time'].map((type) => (
                            <button
                                key={type}
                                onClick={() => {
                                    setFilterType(type);
                                    if (['date', 'week', 'month'].includes(type)) {
                                        const d = new Date();
                                        const offset = d.getTimezoneOffset() * 60000;
                                        const today = (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
                                        setSelectedDate(today);
                                    }
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterType === type
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {type === 'all_time' ? 'All' : type === 'date' ? 'Today' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadReport('excel')}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-xl transition-colors text-sm font-medium"
                            title="Download Excel"
                        >
                            <Sheet size={18} />
                            <span>Excel</span>
                        </button>
                        <button
                            onClick={() => downloadReport('pdf')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl transition-colors text-sm font-medium"
                            title="Download PDF"
                        >
                            <FileText size={18} />
                            <span>PDF</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => fetchAnalytics(true)}
                            className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                        </button>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Seller</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Total Value</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Comm. %</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Comm. Amt</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Seller Pay</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Delivery Chg</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Partner Pay</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-right">Del. Comm.</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="text-center py-10 text-gray-500">Loading analytics...</td>
                                </tr>
                            ) : filteredAnalytics.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="text-center py-10 text-gray-500">No data found.</td>
                                </tr>
                            ) : (
                                filteredAnalytics.map((record) => {
                                    if (!record || !record.orderId) return null;
                                    const order = record.orderId;
                                    const seller = record.sellerId;
                                    const commString = record.totalCommissionPercentage ? `${record.totalCommissionPercentage}%` : getCommissionString(order);

                                    const shipping = Number(order.shippingCharge) || 0;
                                    const delComm = Math.max(0, shipping - (record.deliveryPartnerFee || 0));

                                    return (
                                        <tr
                                            key={record._id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {(order._id || "").slice(-6).toUpperCase()}
                                            </td>
                                            <td
                                                className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                                onClick={() => setViewRecord(record)}
                                                title="Click to view details"
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    {order.items?.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="text-sm text-gray-900 dark:text-white">
                                                            {item.product?.title || "Product"} <span className="text-gray-500">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 2 && (
                                                        <div className="text-xs text-blue-600">+ {order.items.length - 2} more</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                                onClick={() => setViewRecord(record)}
                                                title="Click to view details"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Store size={16} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {seller?.shopName || "Unknown"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                                ₹{order.totalAmount?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                                                {commString}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                                                <span className="text-green-600">₹{record.platformCommission?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <button
                                                    onClick={() => togglePaymentStatus(record._id, 'platform')}
                                                    className="focus:outline-none"
                                                    title={record.isPlatformCommissionPaid ? "Mark as Unpaid" : "Mark as Paid"}
                                                >
                                                    {record.isPlatformCommissionPaid ? (
                                                        <CheckSquare size={18} className="text-green-600 fill-green-100" />
                                                    ) : (
                                                        <Square size={18} className="text-gray-300 hover:text-green-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                                                ₹{record.sellerEarning?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                                                ₹{(order.shippingCharge || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                                                ₹{record.deliveryPartnerFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                                                <span className="text-green-600">₹{delComm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <button
                                                    onClick={() => togglePaymentStatus(record._id, 'delivery')}
                                                    className="focus:outline-none"
                                                    title={record.isDeliveryCommissionPaid ? "Mark as Unpaid" : "Mark as Paid"}
                                                >
                                                    {record.isDeliveryCommissionPaid ? (
                                                        <CheckSquare size={18} className="text-green-600 fill-green-100" />
                                                    ) : (
                                                        <Square size={18} className="text-gray-300 hover:text-green-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => deleteAnalytics(record._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {viewRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewRecord(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Details</h3>
                                <div className="text-xs text-gray-500 mt-0.5">ID: {viewRecord.orderId._id}</div>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {/* Stats Grid - Customers/Sellers */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {/* Buyer */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-gray-500 shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {viewRecord.orderId.buyer?.fullName || (typeof viewRecord.orderId.buyer === 'string' ? "ID: " + viewRecord.orderId.buyer.slice(-6) : "Guest")}
                                            </div>
                                            <div className="text-sm text-gray-500">{viewRecord.orderId.buyer?.mobile || ""}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seller */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Seller</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-gray-500 shadow-sm">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {viewRecord.sellerId?.shopName || "Unknown Shop"}
                                            </div>
                                            <div className="text-sm text-gray-500">{viewRecord.sellerId?.mobile || ""}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="mb-6 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <DollarSign size={14} /> Financial Breakdown
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Commission ({viewRecord.totalCommissionPercentage ? viewRecord.totalCommissionPercentage + '%' : getCommissionString(viewRecord.orderId)})</div>
                                        <div className="text-green-600 font-bold">₹{viewRecord.platformCommission?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Seller Pay</div>
                                        <div className="text-blue-600 font-bold">₹{viewRecord.sellerEarning?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Delivery Partner Pay</div>
                                        <div className="text-gray-700 dark:text-gray-200 font-bold">₹{viewRecord.deliveryPartnerFee?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Shipping Charges</div>
                                        <div className="text-gray-700 dark:text-gray-200 font-bold">₹{viewRecord.orderId.shippingCharge?.toLocaleString() || "0"}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Delivery Comm.</div>
                                        <div className="text-green-600 font-bold">
                                            ₹{Math.max(0, (Number(viewRecord.orderId.shippingCharge) || 0) - (viewRecord.deliveryPartnerFee || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                                        <div className="text-blue-500 dark:text-blue-400 text-xs mb-1">Total Value</div>
                                        <div className="text-gray-900 dark:text-white font-bold">₹{viewRecord.orderId.totalAmount?.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>


                            {/* Products */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Products Ordered</h4>
                                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Product</th>
                                                <th className="px-4 py-3 font-medium text-center">Qty</th>
                                                <th className="px-4 py-3 font-medium text-right">Price</th>
                                                <th className="px-4 py-3 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {viewRecord.orderId.items?.map((item, idx) => (
                                                <tr key={idx} className="bg-white dark:bg-gray-800">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900 dark:text-white">{item.product?.title || "Product"}</div>
                                                        <div className="text-xs text-gray-500">{item.product?.category}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">x{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">₹{item.price}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">₹{item.price * item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    ₹{viewRecord.orderId.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Charges</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    {(() => {
                                                        const subtotal = viewRecord.orderId.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                                                        const total = viewRecord.orderId.totalAmount || 0;
                                                        const shipping = total - subtotal;
                                                        return shipping > 0 ? `₹${shipping.toLocaleString()}` : "Free";
                                                    })()}
                                                </td>
                                            </tr>
                                            <tr className="border-t border-gray-100 dark:border-gray-700">
                                                <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">Total Amount</td>
                                                <td className="px-4 py-3 text-right font-bold text-blue-600 text-base">₹{viewRecord.orderId.totalAmount?.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
