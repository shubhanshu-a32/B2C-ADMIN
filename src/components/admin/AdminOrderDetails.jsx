import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Package, User, MapPin, Truck, Calendar, DollarSign, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/admin/orders/${id}`);
                setOrder(res.data);
            } catch (err) {
                toast.error("Failed to load order details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading details...</div>;
    if (!order) return <div className="p-10 text-center text-red-500">Order not found.</div>;

    const steps = [
        { status: 'Placed', date: order.createdAt, active: true },
        { status: 'Confirmed', date: order.updatedAt, active: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus?.toLowerCase()) || !!order.deliveryPartner },
        { status: 'Shipped', date: null, active: ['shipped', 'delivered'].includes(order.orderStatus?.toLowerCase()) },
        { status: 'Delivered', date: null, active: order.orderStatus?.toLowerCase() === 'delivered' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Order #{order._id.slice(-6).toUpperCase()}
                        <span className={`text-sm px-2 py-0.5 rounded-full ${order.orderStatus === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                            }`}>
                            {(() => {
                                const status = (order.orderStatus || 'Pending').toLowerCase();
                                if (['shipped', 'delivered', 'cancelled'].includes(status)) return (status.charAt(0).toUpperCase() + status.slice(1));
                                return order.deliveryPartner ? 'Confirmed' : 'Placed';
                            })()}
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    {/* Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Package size={20} className="text-blue-500" />
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                                            {/* Placeholder for image */}
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{item.product?.title || "Product"}</div>
                                            <div className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price || 0}</div>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        ₹{(item.quantity * (item.price || 0)).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-gray-500">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">₹{order.totalAmount?.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Timeline (Conceptual) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Order Status</h2>
                        <div className="relative flex justify-between">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 -translate-y-1/2 rounded-full"></div>
                            {steps.map((step, i) => (
                                <div key={i} className="flex flex-col items-center bg-white dark:bg-gray-800 px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step.active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-300'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${step.active ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {step.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">

                    {/* Customer */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <User size={20} className="text-purple-500" />
                            Customer
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Name</label>
                                <div className="font-medium dark:text-gray-200">{order.buyer?.fullName || "Guest"}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Contact</label>
                                <div className="font-medium dark:text-gray-200">{order.buyer?.mobile || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Address</label>
                                <div className="font-medium dark:text-gray-200 text-sm">
                                    {order.address?.fullAddress || "No address provided"}
                                    {order.address?.city && `, ${order.address.city}`}
                                    {order.address?.pincode && ` - ${order.address.pincode}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seller */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Store size={20} className="text-orange-500" />
                            Seller
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Shop Name</label>
                                <div className="font-medium dark:text-gray-200">{order.sellerId?.shopName || "Unknown Shop"}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Contact</label>
                                <div className="font-medium dark:text-gray-200">{order.sellerId?.mobile || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Partner */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Truck size={20} className="text-green-500" />
                            Delivery Partner
                        </h2>
                        {order.deliveryPartner ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Name</label>
                                    <div className="font-medium dark:text-gray-200">{order.deliveryPartner.fullName}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Contact</label>
                                    <div className="font-medium dark:text-gray-200">{order.deliveryPartner.mobile}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">Not assigned yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
