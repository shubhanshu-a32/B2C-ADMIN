import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Package, Search, Calendar, User, Store, Trash2, Truck, CheckCircle, Bell, DollarSign, Eye, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminOrders(props) {
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [viewOrder, setViewOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchOrders();
        fetchPartners(); // Fetch partners to resolve IDs if backend doesn't populate

        // Poll for new orders every 10 seconds
        const interval = setInterval(() => {
            fetchOrders(false, true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await api.get("/admin/delivery-partners");
            setPartners(res.data);
        } catch (err) {
            console.error("Failed to fetch partners", err);
        }
    };

    const fetchOrders = async (isManual = false, isPolling = false) => {
        if (!isPolling) setLoading(true);
        try {
            const res = await api.get("/admin/orders"); // Matches backend route: router.get("/orders", ...) mounted at /api/admin

            // If polling, check if we have new orders
            if (isPolling) {
                setOrders(prev => {
                    if (res.data.length > prev.length) {
                        const newCount = res.data.length - prev.length;
                        toast.success(`${newCount} new order${newCount > 1 ? 's' : ''} received!`, {
                            icon: '🔔',
                            duration: 5000
                        });
                        // Play a sound if we wanted to
                    }
                    return res.data;
                });
            } else {
                setOrders(res.data);
                if (isManual) toast.success("Orders updated");
            }
        } catch (err) {
            console.error(err);
            if (!isPolling) toast.error("Failed to fetch orders");
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const deleteOrder = async (id) => {
        if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/orders/${id}`);
            setOrders(orders.filter(order => order._id !== id));
            toast.success("Order deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete order");
        }
    };

    const openAssignModal = async (orderId) => {
        setSelectedOrderId(orderId);
        try {
            const res = await api.get("/admin/delivery-partners");
            setPartners(res.data);
            setShowAssignModal(true);
        } catch (err) {
            toast.error("Failed to load delivery partners");
        }
    };

    const assignPartner = async (partnerId) => {
        try {
            // 1. Assign in Backend
            await api.post(`/admin/orders/${selectedOrderId}/assign`, { partnerId });

            // 2. Open WhatsApp (Frontend-side fallback/confirmation)
            // We need order and partner details. 
            // Note: address details depend on what `getAllOrders` returned.
            // If address is missing in frontend state, the message will be limited.
            // WARNING: Browsers may block multiple pop-ups. The first one is usually allowed.
            const order = orders.find(o => o._id === selectedOrderId);

            // FIX: partnerId passed is the User ID, but partners array has Profile objects.
            const partner = partners.find(p => (p.userId?._id || p.userId) === partnerId);

            if (order && partner) {
                // 1. Partner Message
                const pickupMsg = `Hello ${partner.fullName},\nNew Order Assigned!\n\nPICKUP FROM:\nShop: ${order.sellerId?.shopName || "Seller"}\n\nDELIVER TO:\nBuyer: ${order.buyer?.fullName || "Customer"}\nMobile: ${order.buyer?.mobile}\n\nPlease proceed immediately.`;
                const partnerUrl = `https://wa.me/${partner.mobile}?text=${encodeURIComponent(pickupMsg)}`;
                window.open(partnerUrl, '_blank');

                // 2. Seller Message (Opened after slight delay to avoid popup blocking, but browser might still block)
                if (order.sellerId?.mobile) {
                    const sellerMsg = `Hello ${order.sellerId.shopName},\nOrder #${order._id.slice(-6).toUpperCase()} Assigned.\n\nDelivery Partner working on it:\nName: ${partner.fullName}\nMobile: ${partner.mobile}`;
                    const sellerUrl = `https://wa.me/${order.sellerId.mobile}?text=${encodeURIComponent(sellerMsg)}`;

                    setTimeout(() => {
                        window.open(sellerUrl, '_blank');
                    }, 500);
                } else {
                    console.warn("Seller mobile not found. Ensure /orders API populates sellerId mobile.");
                }
            }

            toast.success("Order assigned! WhatsApp tabs opened.");
            setShowAssignModal(false);
            fetchOrders();
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign order");
        }
    };

    const unassignPartner = async (orderId) => {
        if (!window.confirm("Are you sure you want to unassign the delivery partner?")) return;
        try {
            await api.post(`/admin/orders/${orderId}/assign`, { partnerId: null });
            toast.success("Delivery partner unassigned");
            fetchOrders();
        } catch (err) {
            console.error(err);
            toast.error("Failed to unassign partner");
        }
    };

    const notifySeller = async (order) => {
        let currentPartners = partners;

        // Fetch partners if not loaded or if we can't find the current one (just to be safe)
        if (currentPartners.length === 0) {
            try {
                const res = await api.get("/admin/delivery-partners");
                setPartners(res.data);
                currentPartners = res.data;
            } catch (err) {
                console.error("Failed to fetch partners for notification", err);
            }
        }

        const partner = order.deliveryPartner;
        let partnerDetails = partner;

        // If it's an ID, look it up
        if (typeof partner === 'string') {
            partnerDetails = currentPartners.find(p => (p.userId?._id || p.userId) === partner);
        }

        try {
            const pid = partnerDetails?.userId?._id || partnerDetails?.userId || partnerDetails?._id || partner;
            await api.post(`/admin/orders/${order._id}/assign`, { partnerId: pid });
            toast.success("Backend notified");

            let sellerMobile = order.sellerId?.mobile;

            if (!sellerMobile && order.sellerId?._id) {
                try {
                    const sellerRes = await api.get(`/admin/sellers/${order.sellerId._id}`);
                    sellerMobile = sellerRes.data.user?.mobile || sellerRes.data.profile?.businessPhone;
                } catch (e) {
                    console.error("Failed to fetch seller mobile", e);
                }
            }

            if (sellerMobile && partnerDetails) {
                const productDetails = order.items?.map(item => `${item.quantity} x ${item.product?.title || "Product"}`).join(", ");
                const buyerAddress = order.address ? `${order.address.fullAddress || ""}, ${order.address.city || ""}, ${order.address.pincode || ""}` : "Address not provided";

                const sellerMsg = `Hello seller ${order.sellerId.shopName} delivery partner assigned ${partnerDetails.fullName || "Partner"}, ${partnerDetails.mobile} is reaching you to deliver ${productDetails} to ${order.buyer?.fullName || "Buyer"}, ${buyerAddress}`;

                const sellerUrl = `https://wa.me/${sellerMobile}?text=${encodeURIComponent(sellerMsg)}`;
                window.open(sellerUrl, '_blank');
                toast.success("WhatsApp opened");
            } else {
                console.log("Missing Info:", { sellerMobile, partnerDetails });
                toast.error("Missing seller mobile or partner details");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to notify backend");
        }
    };

    const getDisplayStatus = (order) => {
        const status = (order.orderStatus || 'Pending').toLowerCase();

        if (['shipped', 'delivered', 'cancelled'].includes(status)) {
            return status;
        }
        if (order.deliveryPartner) {
            return 'confirmed';
        } else {
            return 'placed';
        }
    };

    const markAsDelivered = async (orderId) => {
        if (!window.confirm("Mark this order as Delivered? This means the buyer has received the product.")) return;
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: 'delivered' });
            toast.success("Order marked as Delivered");
            fetchOrders();
        } catch (err) {
            console.error(err);
            try {
                await api.put(`/admin/orders/${orderId}`, { orderStatus: 'delivered' });
                toast.success("Order marked as Delivered");
                fetchOrders();
            } catch (e) {
                toast.error("Failed to update status");
            }
        }
    };

    const StatusBadge = ({ order }) => {
        const displayStatus = getDisplayStatus(order);

        const colors = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            placed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };

        const displayText = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[displayStatus] || "bg-gray-100 text-gray-800"}`}>
                {displayText}
            </span>
        );
    };

    const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
        // filter by status based on view
        const isDelivered = (order.orderStatus || '').toLowerCase() === 'delivered';

        if (props.isCompletedView) {
            // Completed View: Show ONLY delivered
            if (!isDelivered) return false;
        } else {
            // Main View: Show EVERYTHING ELSE (Active, Pending, etc.) EXCEPT delivered
            // User said "removed from the list", implies main list shouldn't have them.
            if (isDelivered) return false;
        }

        // Filter logic
        const matchesSearch = (order?._id?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order?.buyer?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order?.sellerId?.shopName || "").toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        {props.isCompletedView ? "Completed Orders" : "Orders Received"}
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-2">
                            {filteredOrders.length}
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {props.isCompletedView ? "View history of completed orders." : "Track and manage all customer orders. Auto-refreshing."}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => fetchOrders(true)}
                        className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl transition-colors"
                        title="Refresh Orders"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-refresh-cw ${loading ? 'animate-spin' : ''}`}>
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M8 16H3v5" />
                        </svg>
                    </button>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search ID, Buyer, or Seller..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Products</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Seller</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order Complete</th>
                                {props.isCompletedView && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Delivery Partner</th>}
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                                {!props.isCompletedView && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>}
                                {props.isCompletedView && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Delete</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={props.isCompletedView ? "7" : "8"} className="text-center py-10 text-gray-500">Loading orders...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={props.isCompletedView ? "7" : "8"} className="text-center py-10 text-gray-500">No orders found.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className={props.isCompletedView
                                            ? ""
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        }
                                        onClick={() => !props.isCompletedView && navigate(`/admin/order/${order._id}`)}
                                    >
                                        <td
                                            className={`px-6 py-4 whitespace-nowrap ${props.isCompletedView ? 'cursor-pointer group' : ''}`}
                                            onClick={(e) => {
                                                if (props.isCompletedView) {
                                                    e.stopPropagation();
                                                    setViewOrder(order);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {order.items?.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className={`text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 ${props.isCompletedView ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
                                                        <Package size={14} className="text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{item.product?.title || "Product"}</span>
                                                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pl-6">
                                                        +{order.items.length - 2} more...
                                                    </div>
                                                )}
                                                {props.isCompletedView && (
                                                    <div className="text-[10px] text-gray-400 pl-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Click for details
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Ref: {order._id?.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {order.buyer?.fullName || "Guest Checkin"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{order.buyer?.mobile}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Store size={16} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {order.sellerId?.shopName || "Unknown Shop"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                                <DollarSign size={14} className="text-gray-400" />
                                                ₹{order.totalAmount?.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge order={order} />
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            {(order.orderStatus || '').toLowerCase() === 'delivered' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle size={14} />
                                                    Done
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!order.deliveryPartner) {
                                                            toast.error("Please assign a Delivery Partner first!");
                                                            return;
                                                        }
                                                        markAsDelivered(order._id);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors border ${!order.deliveryPartner
                                                        ? 'text-gray-300 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-200 dark:border-gray-700'
                                                        }`}
                                                    title={!order.deliveryPartner ? "Assign Partner First" : "Mark as Delivered"}
                                                >
                                                    <div className="w-4 h-4 rounded-sm border-2 border-current"></div>
                                                </button>
                                            )}
                                        </td>
                                        {props.isCompletedView && (
                                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                {(() => {
                                                    const partnerData = order.deliveryPartner;
                                                    let displayPartner = null;

                                                    // 1. Try to find the full partner object from our fetched list
                                                    if (partnerData) {
                                                        const partnerId = typeof partnerData === 'string'
                                                            ? partnerData
                                                            : (partnerData._id || partnerData.userId?._id || partnerData.userId); // Handle nested userId or direct _id

                                                        if (partnerId) {
                                                            const idStr = partnerId.toString();
                                                            displayPartner = partners.find(p =>
                                                                (p._id && p._id.toString() === idStr) ||
                                                                (p.userId && (p.userId._id || p.userId).toString() === idStr)
                                                            );
                                                        }
                                                    }

                                                    // 2. Fallback: Use the data on the order object itself if lookup failed
                                                    if (!displayPartner && typeof partnerData === 'object') {
                                                        displayPartner = partnerData;
                                                    }

                                                    // 3. Extract Display Info
                                                    if (displayPartner) {
                                                        // Prioritize 'name' (from DeliveryPartner model) over 'fullName' (potentially from User model which might be an ID)
                                                        const name = displayPartner.name || displayPartner.fullName || displayPartner.userId?.name || displayPartner.userId?.fullName;
                                                        const mobile = displayPartner.mobile || displayPartner.userId?.mobile;

                                                        if (name) {
                                                            const modalData = { ...displayPartner, fullName: name, mobile: mobile };
                                                            return (
                                                                <div
                                                                    className="text-xs text-left bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all group"
                                                                    onClick={() => setSelectedPartner(modalData)}
                                                                >
                                                                    <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">{name}</div>
                                                                    {mobile && <div className="text-gray-500 text-[10px] sm:text-xs">{mobile}</div>}
                                                                </div>
                                                            );
                                                        }
                                                    }

                                                    return <span className="text-xs text-gray-400 italic">Unassigned</span>;
                                                })()}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                                                    <Calendar size={14} />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-400 pl-6">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        {!props.isCompletedView ? (
                                            <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-3">
                                                    {/* Delivery Assignment Block */}
                                                    <div className={`flex items-center justify-center p-1.5 rounded-lg border ${order.deliveryPartner ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                                                        {order.deliveryPartner ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); unassignPartner(order._id); }}
                                                                className="flex items-center gap-2 px-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors group"
                                                                title="Unassign Delivery Partner"
                                                            >
                                                                <CheckCircle size={18} className="text-green-600 dark:text-green-400 group-hover:text-red-500 transition-colors" />
                                                                <span className="text-xs font-medium text-green-700 dark:text-green-300 group-hover:text-red-600 transition-colors">Assigned</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openAssignModal(order._id); }}
                                                                className="flex items-center gap-2 px-2 py-1 text-blue-600 hover:text-blue-700 transition-colors"
                                                                title="Assign Delivery Partner"
                                                            >
                                                                <Truck size={18} />
                                                                <span className="text-xs font-medium">Assign</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {order.deliveryPartner && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); notifySeller(order); }}
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/50"
                                                            title="Notify Seller on WhatsApp"
                                                        >
                                                            <Bell size={18} />
                                                        </button>
                                                    )}

                                                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteOrder(order._id); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        ) : (
                                            <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteOrder(order._id); }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Partner Details Modal */}
            {selectedPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Partner Details</h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                                        <div className="text-base font-medium text-gray-900 dark:text-white">{selectedPartner.fullName}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <div className="w-6 h-6 flex items-center justify-center rounded border border-current text-[10px] font-bold">Ph</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Mobile Number</div>
                                        <div className="text-base font-medium text-gray-900 dark:text-white">{selectedPartner.mobile}</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedPartner(null)}
                                className="mt-8 w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {viewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewOrder(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Details</h3>
                                <div className="text-xs text-gray-500 mt-0.5">ID: {viewOrder._id}</div>
                            </div>
                            <button onClick={() => setViewOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {/* Buyer */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-gray-500 shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{viewOrder.buyer?.fullName || "Guest"}</div>
                                            <div className="text-sm text-gray-500">{viewOrder.buyer?.mobile}</div>
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
                                            <div className="font-semibold text-gray-900 dark:text-white">{viewOrder.sellerId?.shopName || "Unknown Shop"}</div>
                                            <div className="text-sm text-gray-500">{viewOrder.sellerId?.mobile || "No Mobile"}</div>
                                        </div>
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
                                            {viewOrder.items?.map((item, idx) => (
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
                                                <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">Total Amount</td>
                                                <td className="px-4 py-3 text-right font-bold text-blue-600 text-base">₹{viewOrder.totalAmount?.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* Modal Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign Delivery Partner</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {partners.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No delivery partners found.</p>
                            ) : (
                                partners.map(partner => (
                                    <button
                                        key={partner._id}
                                        onClick={() => assignPartner(partner.userId?._id || partner.userId || partner._id)}
                                        className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                                    >
                                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">{partner.fullName}</div>
                                        <div className="text-sm text-gray-500">{partner.mobile}</div>
                                        {partner.pincode && <div className="text-xs text-gray-400">PIN: {partner.pincode}</div>}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
