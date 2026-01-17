import { useEffect, useState } from "react";
import api from "../../services/api";
import { Trash2, ExternalLink, Store, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminSellers() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        role: "seller", // Fixed as seller
        shopName: ""
    });

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = () => {
        setLoading(true);
        api.get("/admin/sellers")
            .then((res) => setSellers(res.data))
            .catch((err) => toast.error("Failed to load sellers"))
            .finally(() => setLoading(false));
    };

    const deleteSeller = async (id) => {
        if (!window.confirm("Are you sure? This will delete the seller and their products.")) return;
        try {
            await api.delete(`/admin/sellers/${id}`);
            toast.success("Seller deleted successfully");
            setSellers(sellers.filter((s) => s.userId._id !== id));
        } catch (err) {
            toast.error("Failed to delete seller");
        }
    };

    const handleAddSeller = async (e) => {
        e.preventDefault();

        // Validation: Verify mobile number is exactly 10 digits
        if (!/^\d{10}$/.test(formData.mobile)) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }

        try {
            await api.post("/admin/users", formData);
            toast.success("Seller created successfully");
            setShowModal(false);
            setFormData({ name: "", mobile: "", role: "seller", shopName: "" });
            loadSellers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create seller");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage seller accounts</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center gap-2"
                    >
                        <Store size={18} />
                        Add Seller
                    </button>
                    {/* Filter and Search hidden on small screens if needed, but keeping logic consistent */}
                </div>
            </div>

            {/* Search Bar Row */}
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search sellers..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                </div>
                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                    <Filter size={20} />
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading sellers...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Shop Details</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Contact Info</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Joined Date</th>
                                    <th className="px-4 py-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sellers.map((seller) => (
                                    <tr key={seller._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold mr-3">
                                                    <Store size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{seller.shopName || "Unnamed Shop"}</div>
                                                    <Link
                                                        to={`/buyer/seller/${seller.userId?._id}`}
                                                        className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5"
                                                    >
                                                        View Shop Front <ExternalLink size={10} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                {seller.userId?.mobile || "N/A"}
                                            </div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                ID: {seller.userId?._id}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(seller.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => deleteSeller(seller.userId?._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Seller Details & Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sellers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-500 text-sm">
                                            No sellers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Seller Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Seller</h2>
                        <form onSubmit={handleAddSeller} className="space-y-4">

                            {/* Role is hidden/fixed */}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Name</label>
                                <input
                                    type="text"
                                    required // Mandatory for sellers here
                                    value={formData.shopName}
                                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={formData.mobile}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow digits
                                        if (/^\d*$/.test(value)) {
                                            setFormData({ ...formData, mobile: value });
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-500/30"
                                >
                                    Create Seller
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
