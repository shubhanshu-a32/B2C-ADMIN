import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Package, Search, Calendar, User, Store, Trash2, Truck, CheckCircle, Bell, Eye, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminOrders(props) {
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [selectedSeller, setSelectedSeller] = useState(null);
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
            toast.error("Failed to fetch delivery partners");
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
            toast.error("Failed to delete order");
        }
    };

    const openAssignModal = async (orderId) => {
        setSelectedOrderId(orderId);
        try {
            // 1. Find the order locally
            const order = orders.find(o => o._id === orderId);
            if (!order) {
                toast.error("Order not found locally");
                return;
            }

            // 2. Fetch Seller Profile to get Pincode
            // Check if sellerId is populated object or just ID
            let sellerId = order.sellerId;
            // Extract ID if it's an object
            if (sellerId && typeof sellerId === 'object') {
                sellerId = sellerId._id || sellerId.id;
            }

            if (!sellerId) {
                toast.error("Seller ID missing on order");
                return;
            }



            // 2. Use Seller Pincode from Order (Optimized: Backend now provides this)
            const sellerPincode = order.sellerId?.pincode;

            // Set Selected Seller from order data directly
            // Backend provides populated sellerId with ShopName etc.
            // We might lack full profile but that's okay for basic display or we use what's there.
            setSelectedSeller(order.sellerId);

            // 3. Fetch Delivery Partners (Filter by Pincode Server-Side)
            try {
                const queryParams = sellerPincode ? { pincode: sellerPincode } : {};
                const res = await api.get("/admin/delivery-partners", { params: queryParams });

                setPartners(res.data);

                if (sellerPincode) {
                    if (res.data.length === 0) {
                        toast("No delivery partners found for PIN: " + sellerPincode, { icon: '⚠️' });
                    } else {
                        // Optional: Success toast or just show list
                    }
                } else {
                    toast("Seller has no Pincode. Showing all partners.", { icon: 'ℹ️' });
                }

                setShowAssignModal(true);

            } catch (partnerErr) {
                toast.error("Failed to load delivery partners");
            }

        } catch (err) {
            // Console error removed
            toast.error("An error occurred opening the modal");
        }
    };

    // --- SHARED HELPER: Generate WhatsApp Content Frontend-Side (Strict Backend Sync) ---
    const getWhatsAppContent = (order, partner, useNewFormat = false) => {
        if (!order || !partner) return { pickupMsg: "", sellerMsg: "", pMobile: "", sMobile: "" };

        // 1. Resolve Partner Mobile (Explicitly)
        const partnerMobileRaw = partner.mobile || partner.userId?.mobile;

        // 2. Resolve Seller Info (Explicitly)
        const sellerUser = order.sellerId || {};
        // Backend overrides: Profile > User
        const sellerMobileRaw = sellerUser.profile?.businessPhone || sellerUser.profile?.whatsappNumber || sellerUser.mobile || sellerUser.profile?.mobile;
        // Fallback or "N/A" only for display usage, but keep raw for check
        const sMobile = sellerMobileRaw || "N/A";
        const pMobile = partnerMobileRaw || "N/A";

        const pName = partner.fullName || partner.userId?.fullName || "Partner";
        const shopName = sellerUser.shopName || sellerUser.ownerName || "Unknown Shop";
        const sAddress = sellerUser.profile?.address || sellerUser.address || "Address not set";

        // Google Maps Link
        let mapLink = "";
        if (sellerUser.lat && sellerUser.lng) {
            mapLink = ` https://www.google.com/maps?q=${sellerUser.lat},${sellerUser.lng}`;
        } else if (sAddress && sAddress !== "Address not set") {
            const cleanAddr = sAddress.replace(/\s+/g, '+');
            mapLink = ` https://www.google.com/maps/search/?api=1&query=${cleanAddr}`;
        }

        // 3. Buyer Address (Strict Backend Cleaning Logic)
        let buyerAddressStr = "Address not provided";
        if (order.address) {
            const cleanStr = (s) => s ? String(s).replace(/\bundefined\b/gi, "").replace(/\bnull\b/gi, "").trim() : "";
            const city = cleanStr(order.address.city);
            const pincode = cleanStr(order.address.pincode);
            let fullAddr = cleanStr(order.address.fullAddress);
            // Regex cleanups from backend
            fullAddr = fullAddr.replace(/,\s*,/g, ",").replace(/,\s*-/g, " -").replace(/^,\s*/, "").replace(/,\s*$/, "");

            if (fullAddr && fullAddr.length > 5) {
                buyerAddressStr = fullAddr;
            } else {
                const parts = [fullAddr, city, pincode].filter(p => p);
                if (parts.length > 0) buyerAddressStr = parts.join(", ");
            }
            buyerAddressStr = buyerAddressStr.replace(/\bundefined\b/gi, "").replace(/\s\s+/g, " ").trim();
        }

        // 4. Order Details
        const orderDetails = order.items?.map((item, idx) =>
            `${idx + 1}. ${item.product?.title || "Unknown Product"} x ${item.quantity} (₹${item.price || 0})`
        ).join("\n") || "";

        const extraDetails = `Total: ₹${order.totalAmount}\nPayment: ${order.paymentMode || 'COD'}\nOrder ID: ${order._id}`;
        const buyerName = order.buyer?.fullName || "Guest/Unknown";
        const buyerMobile = order.buyer?.mobile || "N/A";

        // 5. Construct Messages (Strict Backend Match)

        // Message TO Partner (pickupMsg)
        // Backend: "Mobile: ${sellerMobileDisplay}\nAddress: ${sellerAddressDisplay}\nLocation: ${mapLink}"
        // Note: Backend has space after "Location:"
        const pickupMsg = `Hello ${pName},\nNew Order Assigned!\n\nORDER ID: ${order._id}\n\nPICKUP FROM:\nShop: ${shopName}\nMobile: ${sMobile}\nAddress: ${sAddress}\nLocation: ${mapLink}\n\nDELIVER TO:\nBuyer: ${buyerName}\nMobile: ${buyerMobile}\nAddress: ${buyerAddressStr}\n\nITEMS:\n${orderDetails}\n\n${extraDetails}\n\nPlease proceed immediately.`;

        // Message TO Seller (sellerMsg)
        let sellerMsg;
        if (useNewFormat) {
            sellerMsg = `Hello seller ${shopName},\ndelivery partner is assigned ${pName}, ${pMobile} to deliver ${orderDetails} to ${buyerName}, ${buyerMobile}, ${buyerAddressStr}. So, please ready the above product to give it to delivery partner.\nThank You!!`;
        } else {
            // Backend: "Hello ${sellerUser.shopName || "Seller"},\nDelivery Partner ${partner.fullName} (${partner.mobile}) is assigned and coming to take the product:\n\n${orderDetails}\n\nTo deliver to Buyer: ${buyerName}\nMobile: ${buyerMobile}\nAddress: ${buyerAddressStr}\n\n${extraDetails}"
            sellerMsg = `Hello ${shopName},\nDelivery Partner ${pName} (${pMobile}) is assigned and coming to take the product:\n\n${orderDetails}\n\nTo deliver to Buyer: ${buyerName}\nMobile: ${buyerMobile}\nAddress: ${buyerAddressStr}\n\n${extraDetails}`;
        }

        return { pickupMsg, sellerMsg, pMobile, sMobile };
    };

    // Helper to format mobile
    const formatMobile = (num) => {
        if (!num) return "";
        let cleaned = String(num).replace(/\D/g, '');
        if (cleaned.length === 10) return '91' + cleaned;
        return cleaned;
    };


    const assignPartner = async (partnerIdInput) => {
        // Pre-open windows to bypass popup blockers
        const partnerWindow = window.open('', '_blank');
        const sellerWindow = window.open('', '_blank');

        if (partnerWindow) partnerWindow.document.write("<h3>Generating WhatsApp Link...</h3><p>Please wait...</p>");
        if (sellerWindow) sellerWindow.document.write("<h3>Generating WhatsApp Link...</h3><p>Please wait...</p>");

        // Normalization: Handle if partnerIdInput is an object or string
        const partnerId = (typeof partnerIdInput === 'object' && partnerIdInput !== null)
            ? (partnerIdInput._id || partnerIdInput.userId?._id || partnerIdInput.userId)
            : partnerIdInput;

        // --- OPTIMISTIC UI ---
        try {
            let selectedOrder = orders.find(o => o._id === selectedOrderId);
            if (!selectedOrder) throw new Error("Order not found");

            // Resolve Partner
            const selectedPartner = partners.find(p => p._id === partnerId || p.userId?._id === partnerId || p.userId === partnerId);
            if (!selectedPartner) throw new Error("Partner not found locally");

            // --- FETCH OVERRIDE IF DATA MISSING ---
            // If Seller Mobile is missing, fetch full seller details
            let sellerUser = selectedOrder.sellerId || {};
            const sellerHasMobile = sellerUser.profile?.businessPhone || sellerUser.profile?.whatsappNumber || sellerUser.mobile || sellerUser.profile?.mobile;

            if (!sellerHasMobile && sellerUser._id) {
                try {
                    const sellerRes = await api.get(`/admin/sellers/${sellerUser._id}`);
                    // Merge fetched data into a temporary object structure that getWhatsAppContent expects
                    const fullSeller = {
                        ...sellerUser,
                        ...sellerRes.data.user,
                        profile: sellerRes.data.profile
                    };
                    // Create a new order object with enriched seller
                    selectedOrder = { ...selectedOrder, sellerId: fullSeller };
                } catch (fetchErr) {
                    // Minimal fallback
                }
            }
            // --------------------------------------

            // --- PINCODE MISMATCH GUARD ---
            const sellerPincode = String(selectedOrder.sellerId?.pincode || "").trim();
            const partnerPincode = String(selectedPartner.pincode || "").trim();

            if (sellerPincode && partnerPincode && sellerPincode !== partnerPincode) {
                const msg = `PINCODE MISMATCH!\n\nSeller: ${sellerPincode}\nPartner: ${partnerPincode}\n\nThe system will likely REJECT this assignment.`;
                if (partnerWindow) partnerWindow.document.body.innerHTML = `<h3>Blocked</h3><p>${msg.replace(/\n/g, '<br/>')}</p>`;
                if (sellerWindow) sellerWindow.document.body.innerHTML = `<h3>Blocked</h3><p>${msg.replace(/\n/g, '<br/>')}</p>`;
                toast.error(msg);
                throw new Error("Pincode Mismatch Blocked");
            }
            // -----------------------------

            // Generate Content
            const { pickupMsg, sellerMsg, pMobile, sMobile } = getWhatsAppContent(selectedOrder, selectedPartner);

            // Redirect Optimistically
            const safePartnerMobile = formatMobile(pMobile);
            if (safePartnerMobile && pickupMsg) {
                if (partnerWindow) partnerWindow.location.href = `https://api.whatsapp.com/send?phone=${safePartnerMobile}&text=${encodeURIComponent(pickupMsg)}`;
            } else {
                if (partnerWindow) partnerWindow.document.body.innerHTML = `<h3>Error</h3><p>Missing Mobile (Partner: ${pMobile})</p>`;
            }

            const safeSellerMobile = formatMobile(sMobile);
            if (safeSellerMobile && sellerMsg) {
                if (sellerWindow) sellerWindow.location.href = `https://api.whatsapp.com/send?phone=${safeSellerMobile}&text=${encodeURIComponent(sellerMsg)}`;
            } else {
                if (sellerWindow) sellerWindow.document.body.innerHTML = `<h3>Error</h3><p>Missing Mobile (Seller: ${sMobile})</p>`;
            }

            // Close Modal & Show Success
            setShowAssignModal(false);
            toast.success("Opening WhatsApps...");

            // Background API
            const res = await api.post(`/admin/orders/${selectedOrderId}/assign`, { partnerId });

            // Safe Optimistic Update (Preserving Populated Data)
            if (res.data.order) {
                setOrders(prev => prev.map(o => {
                    if (o._id === selectedOrderId) {
                        return {
                            ...res.data.order,
                            items: o.items,     // Preserve populated items
                            buyer: o.buyer,     // Preserve populated buyer
                            sellerId: o.sellerId // Preserve populated seller
                        };
                    }
                    return o;
                }));
            }

            toast.success("Order assigned in system!");
            // fetchOrders(); // Optional, but keeping it as backup sync

        } catch (err) {
            const errMsg = err.message || err.response?.data?.message || "Sys-Assign Failed";

            if (errMsg !== "Pincode Mismatch Blocked") {
                if (partnerWindow) partnerWindow.document.body.innerHTML = `<h3>Error</h3><p>${errMsg}</p>`;
                if (sellerWindow) sellerWindow.document.body.innerHTML = `<h3>Error</h3><p>${errMsg}</p>`;
            }
            toast.error(errMsg);
        }
    };

    const unassignPartner = async (orderId) => {
        try {
            // Optimistic UI Update: assume success and update local state immediately
            // But better to wait for response to ensure backend sync? User wants explicit change.
            // Let's call API then update state.

            const res = await api.post(`/admin/orders/${orderId}/assign`, { partnerId: null });

            // Backend returns { message, order }
            if (res.data.order) {
                // Update local state but PRESERVE populated fields (items, buyer, sellerId)
                // because backend returns unpopulated order on unassign.
                setOrders(prev => prev.map(o => {
                    if (o._id === orderId) {
                        return {
                            ...res.data.order, // New status/etc
                            items: o.items,    // Keep populated items
                            buyer: o.buyer,    // Keep populated buyer
                            sellerId: o.sellerId, // Keep populated seller
                            deliveryPartner: null // Explicitly null
                        };
                    }
                    return o;
                }));
            } else {
                // Manual fallback
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryPartner: null } : o));
            }

            toast.success("Delivery Partner Unassigned!");
            // fetchOrders(); // Optional if we trust the local update, but good for consistency
        } catch (err) {
            toast.error("Failed to unassign partner");
            fetchOrders(); // Revert on error
        }
    };

    const notifySeller = async (order) => {
        if (!order.deliveryPartner) {
            toast.error("No partner assigned yet");
            return;
        }

        let partnerId = order.deliveryPartner;
        if (typeof partnerId === 'object' && partnerId !== null) {
            partnerId = partnerId._id || partnerId.userId?._id || partnerId.userId || partnerId;
        }

        // Pre-open windows
        // const partnerWindow = window.open('', '_blank'); // Notify only Seller
        const sellerWindow = window.open('', '_blank');

        // if (partnerWindow) partnerWindow.document.write("<h3>Generating WhatsApp Link...</h3><p>Please wait...</p>");
        if (sellerWindow) sellerWindow.document.write("<h3>Generating WhatsApp Link...</h3><p>Please wait...</p>");

        try {
            // --- DATA ENRICHMENT ---
            // 1. Enrich Seller
            let enrichedOrder = { ...order };
            const sellerUser = enrichedOrder.sellerId || {};
            const sellerHasMobile = sellerUser.profile?.businessPhone || sellerUser.profile?.whatsappNumber || sellerUser.mobile || sellerUser.profile?.mobile;

            if (!sellerHasMobile && sellerUser._id) {
                try {
                    const sellerRes = await api.get(`/admin/sellers/${sellerUser._id}`);
                    const fullSeller = { ...sellerUser, ...sellerRes.data.user, profile: sellerRes.data.profile };
                    enrichedOrder.sellerId = fullSeller;
                } catch (e) { }
            }

            // 2. Enrich Partner (if missing details)
            // 'order.deliveryPartner' might be just ID in some views
            let partnerObj = typeof order.deliveryPartner === 'object' ? order.deliveryPartner : { _id: order.deliveryPartner };
            // If partner object lacks mobile, fetch it? Partner API might not be exposed as single GET easily?
            // Usually partners are loaded in 'partners' list.
            const knownPartner = partners.find(p => p._id === partnerId || p.userId?._id === partnerId || p.userId === partnerId);
            if (knownPartner) {
                partnerObj = knownPartner;
            } else if (!partnerObj.mobile) {
                // If we don't have it in list and order obj is thin, we rely on Backend Assign Response or try to fetch?
                // 'assign' re-returns data.
            }
            // -----------------------

            // Helper Generation
            const { pickupMsg, sellerMsg, pMobile, sMobile } = getWhatsAppContent(enrichedOrder, partnerObj, true);

            // 1. Trigger Backend Assignment (Re-Notify)
            // We do this to ensure backend sync, but we use Frontend generated content if valid.
            const res = await api.post(`/admin/orders/${order._id}/assign`, { partnerId });

            // Backend returns messages too. We can prefer Backend msg if available (to be super safe) OR use our Enriched Frontend msg.
            // Let's use Frontend enriched msg for consistency with 'assignPartner',
            // BUT fallback to Backend response if frontend failed to generate good links.

            // let finalPickupMsg = pickupMsg; // Not sending to partner
            let finalSellerMsg = sellerMsg;
            // let finalPartnerMobile = pMobile || res.data.partnerMobile;
            let finalSellerMobile = sMobile || res.data.sellerMobile;

            /* 
            // Redirect Partner Window - REMOVED for Notify Seller Bell Icon
            const safePartnerMobile = formatMobile(finalPartnerMobile);
            if (safePartnerMobile && finalPickupMsg) {
                const partnerUrl = `https://api.whatsapp.com/send?phone=${safePartnerMobile}&text=${encodeURIComponent(finalPickupMsg)}`;
                if (partnerWindow) partnerWindow.location.href = partnerUrl;
            } else {
                if (partnerWindow) {
                    partnerWindow.document.body.innerHTML = `
                        <h3>Could not generate Partner WhatsApp Link</h3>
                        <p>Missing Mobile.</p>
                    `;
                }
            } 
            */

            // Redirect Seller Window
            const safeSellerMobile = formatMobile(finalSellerMobile);
            if (safeSellerMobile && finalSellerMsg) {
                const sellerUrl = `https://api.whatsapp.com/send?phone=${safeSellerMobile}&text=${encodeURIComponent(finalSellerMsg)}`;
                if (sellerWindow) sellerWindow.location.href = sellerUrl;
            } else {
                if (sellerWindow) {
                    sellerWindow.document.body.innerHTML = `
                        <h3>Could not generate Seller WhatsApp Link</h3>
                        <p>Missing Mobile.</p>
                    `;
                }
            }

            toast.success("Notifications resent and WhatsApps opened!");

        } catch (err) {
            const errMsg = err.response?.data?.message || "Failed to notify backend";

            // if (partnerWindow) partnerWindow.document.body.innerHTML = `<h3>Error</h3><p>${errMsg}</p>`;
            if (sellerWindow) sellerWindow.document.body.innerHTML = `<h3>Error</h3><p>${errMsg}</p>`;

            toast.error(errMsg);
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

    const filteredOrders = useMemo(() => {
        return (Array.isArray(orders) ? orders : []).filter(order => {
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
    }, [orders, props.isCompletedView, searchTerm]);



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
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Products</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Seller</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order Complete</th>
                                {props.isCompletedView && <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Delivery Partner</th>}
                                <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                                {!props.isCompletedView && <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>}
                                {props.isCompletedView && <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Delete</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={props.isCompletedView ? "7" : "8"} className="text-center py-8 text-gray-500 text-sm">Loading orders...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={props.isCompletedView ? "7" : "8"} className="text-center py-8 text-gray-500 text-sm">No orders found.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() => setViewOrder(order)}
                                    >
                                        <td
                                            className="px-4 py-3 whitespace-nowrap group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewOrder(order);
                                            }}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                {order.items?.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className={`text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-blue-600 transition-colors`}>
                                                        <Package size={12} className="text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{item.product?.title || "Product"}</span>
                                                        <span className="text-[10px] text-gray-500">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium pl-5">
                                                        +{order.items.length - 2} more...
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-gray-400 pl-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click details
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1">Ref: {order._id?.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                        {order.buyer?.fullName || "Guest Checkin"}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">{order.buyer?.mobile}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Store size={14} className="text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                                    {order.sellerId?.shopName || "Unknown Shop"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white text-xs">
                                                ₹{order.totalAmount?.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge order={order} />
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            {(order.orderStatus || '').toLowerCase() === 'delivered' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle size={12} />
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
                                                    className={`p-1.5 rounded-lg transition-colors border ${!order.deliveryPartner
                                                        ? 'text-gray-300 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-200 dark:border-gray-700'
                                                        }`}
                                                    title={!order.deliveryPartner ? "Assign Partner First" : "Mark as Delivered"}
                                                >
                                                    <div className="w-3.5 h-3.5 rounded-sm border-2 border-current"></div>
                                                </button>
                                            )}
                                        </td>
                                        {props.isCompletedView && (
                                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm("Are you sure to reassign the delivery partner?")) {
                                                                        unassignPartner(order._id);
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors group"
                                                                title="Click to Unassign/Reassign"
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
                                                <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    ₹{viewOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Charges</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                    {(() => {
                                                        const subtotal = viewOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                                                        const total = viewOrder.totalAmount || 0;
                                                        const shipping = total - subtotal;
                                                        return shipping > 0 ? `₹${shipping.toLocaleString()}` : "Free";
                                                    })()}
                                                </td>
                                            </tr>
                                            <tr className="border-t border-gray-100 dark:border-gray-700">
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
