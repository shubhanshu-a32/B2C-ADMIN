import { useEffect, useState } from "react";
import api from "../../services/api";
import { Trash2, Plus, FolderPlus, ChevronRight, Hash, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms
    const [newCategory, setNewCategory] = useState("");
    const [selectedCatId, setSelectedCatId] = useState("");
    const [newSubCategory, setNewSubCategory] = useState("");
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = () => {
        api.get("/categories")
            .then((res) => setCategories(res.data))
            .catch((err) => toast.error("Failed to load categories"))
            .finally(() => setLoading(false));
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/categories", { name: newCategory });
            toast.success("Category created!");
            setNewCategory("");
            loadCategories();
        } catch (err) {
            toast.error("Failed to add category");
        }
    };

    const handleAddSubCategory = async (e) => {
        e.preventDefault();
        if (!selectedCatId) return toast.error("Select a category first");
        try {
            await api.post("/admin/categories/sub", { categoryId: selectedCatId, name: newSubCategory });
            toast.success("Subcategory added!");
            setNewSubCategory("");
            loadCategories();
        } catch (err) {
            toast.error("Failed to add subcategory");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category? All subcategories will also be deleted.")) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            toast.success("Category deleted");
            loadCategories();
        } catch (err) {
            toast.error("Failed to delete category");
        }
    };

    const handleDeleteSubCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
        try {
            await api.delete(`/admin/subcategories/${id}`);
            toast.success("Subcategory deleted");
            loadCategories();
        } catch (err) {
            toast.error("Failed to create category");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Organize product catalog structure</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Section */}
                <div className="space-y-6">
                    {/* Add Category Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <FolderPlus className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Parent Category</h3>
                                <p className="text-xs text-gray-500">Create a new top-level section</p>
                            </div>
                        </div>
                        <form onSubmit={handleAddCategory} className="flex gap-3">
                            <input
                                type="text"
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="e.g. Electronics"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                required
                            />
                            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30">
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>

                    {/* Add SubCategory Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Hash className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Subcategory</h3>
                                <p className="text-xs text-gray-500">Nest items under a parent</p>
                            </div>
                        </div>
                        <form onSubmit={handleAddSubCategory} className="space-y-4">
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-gray-700 dark:text-gray-300"
                                value={selectedCatId}
                                onChange={(e) => setSelectedCatId(e.target.value)}
                                required
                            >
                                <option value="">Select Parent Category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    placeholder="e.g. Smartphones"
                                    value={newSubCategory}
                                    onChange={(e) => setNewSubCategory(e.target.value)}
                                    required
                                />
                                <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-purple-500/30">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-fit">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Current Hierarchy</h3>

                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading structure...</div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map((cat) => (
                                <div key={cat._id} className="group border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-gray-50/50 dark:bg-gray-900/50">
                                    <div
                                        className="flex justify-between items-center mb-3 cursor-pointer select-none"
                                        onClick={() => toggleCategory(cat._id)}
                                    >
                                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            {expandedCategories[cat._id] ? (
                                                <ChevronDown size={18} className="text-blue-500" />
                                            ) : (
                                                <ChevronRight size={18} className="text-gray-400" />
                                            )}
                                            {cat.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700">
                                                {cat.subCategories?.length || 0} subs
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCategory(cat._id);
                                                }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Delete Category"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedCategories[cat._id] && (
                                        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2 animate-fade-in">
                                            {cat.subCategories?.length > 0 ? (
                                                cat.subCategories.map((sub) => (
                                                    <div key={sub._id} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 group/sub">
                                                        <div className="flex items-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></div>
                                                            {sub.name}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSubCategory(sub._id)}
                                                            className="p-1 opacity-0 group-hover/sub:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                                                            title="Delete Subcategory"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-gray-400 italic pl-6">No subcategories yet</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <div className="text-center py-8 text-gray-400">No categories defined.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
