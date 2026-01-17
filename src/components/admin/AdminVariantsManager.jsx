import { useState, useEffect } from "react";
import api from "../../services/api";
import { Layers, Edit2, Trash2, Tag, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminVariantsManager() {
    const [variants, setVariants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVariants = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get("/admin/variants");
            setVariants(data);
        } catch (error) {
            console.error("Failed to fetch variants", error);
            // toast.error("Failed to fetch variants"); // Optional: prevent spam on load
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVariants();
    }, []);

    const deleteVariant = async (id) => {
        if (window.confirm("Are you sure you want to delete this variant?")) {
            try {
                await api.delete(`/admin/variants/${id}`);
                toast.success("Variant deleted");
                fetchVariants();
            } catch (error) {
                toast.error("Failed to delete variant");
            }
        }
    };

    const handleEditVariant = async (variant) => {
        const newName = window.prompt("Enter new variant name:", variant.name || variant.title || "");
        if (newName && newName !== (variant.name || variant.title)) {
            try {
                await api.put(`/admin/variants/${variant._id}`, { name: newName, title: newName });
                toast.success("Variant updated");
                fetchVariants();
            } catch (error) {
                toast.error("Failed to update variant");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Layers className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        Variant Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 sm:ml-14">
                        Manage global product specifications and variant types.
                    </p>
                </div>
                {/* Optional: Add 'Create Variant' button here if backend supports standalone creation */}
            </div>

            {/* Search/Filter Bar (Visual Placeholder for consistency) */}
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search variants... (Client-side search to be implemented)"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        disabled // Disabled until implemented
                    />
                </div>
                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                    <Filter size={20} />
                </button>
            </div>

            {/* Content Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mb-3"></div>
                        <p>Loading variants...</p>
                    </div>
                ) : variants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Layers size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">No variants found</p>
                        <p className="text-sm mt-1">Variants usually come from product specifications.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variant Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linked Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price (₹)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {variants.map((variant) => (
                                    <tr key={variant._id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                            {variant.name || variant.title || "Unnamed Variant"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {variant.product ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Tag size={14} className="text-gray-400" />
                                                    <span className="line-clamp-1 max-w-[200px]">{variant.product.title}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No Product Linked</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {variant.price ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    ₹{variant.price}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditVariant(variant)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit Name"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteVariant(variant._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Variant"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
