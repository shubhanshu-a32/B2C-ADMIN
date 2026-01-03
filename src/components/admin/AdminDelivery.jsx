import { useEffect, useState } from "react";
import api from "../../services/api";
import { Truck, User, Phone, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDelivery() {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", mobile: "", pincode: "" });

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/delivery-partners");
            setPartners(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load delivery partners");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/delivery-partners", formData);
            toast.success("Delivery Partner created");
            setShowModal(false);
            setFormData({ name: "", mobile: "", pincode: "" });
            loadPartners();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create partner");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Delivery Partner?")) return;
        try {
            await api.delete(`/admin/delivery-partners/${id}`);
            toast.success("Delivery Partner deleted");
            loadPartners();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete partner");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Truck className="text-blue-600" size={32} />
                        Delivery Boys
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage delivery partners and pincodes</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                >
                    <Plus size={20} />
                    Add Partner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map(partner => (
                    <div key={partner._id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{partner.fullName || partner.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Phone size={14} />
                                {partner.mobile}
                            </div>
                            {partner.pincode && (
                                <div className="text-xs text-gray-400 mt-1">PIN: {partner.pincode}</div>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(partner._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Partner"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {loading && <div className="text-center py-10 text-gray-500">Loading partners...</div>}
            {!loading && partners.length === 0 && (
                <div className="text-center py-10 text-gray-500">No delivery partners found. Add one to get started.</div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Delivery Partner</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile</label>
                                <input
                                    required
                                    maxLength={10}
                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pincode</label>
                                <input
                                    required
                                    maxLength={6}
                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
