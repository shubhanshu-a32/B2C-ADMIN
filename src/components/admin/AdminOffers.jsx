import { useState, useEffect } from "react";
import api from "../../services/api";
import { Tag, Trash2, Plus, Ticket, IndianRupee, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { Layers } from "lucide-react";
export default function AdminOffers() {
    // Local State for Offers & Categories
    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);

    const fetchOffers = async () => {
        try {
            const { data } = await api.get("/admin/offers");
            setOffers(data);
        } catch (error) {
            // Optional error handling
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/categories");
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchCategories();
    }, []);

    const [formData, setFormData] = useState({
        provider: "KETALOG OFFER", // Default
        code: "",
        tagline: "",
        discountAmount: "",
        minCartAmount: "",
        expiryDate: "",
        selectedCategories: [] // Array of category IDs
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Enforce numeric input for amount fields
        if ((name === "discountAmount" || name === "minCartAmount") && value && !/^\d*$/.test(value)) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code || !formData.tagline || !formData.discountAmount) {
            toast.dismiss();
            toast.error("Please fill all required fields");
            return;
        }

        // Validate Min Cart Amount is at least 10 rupees greater than Discount
        if (formData.minCartAmount) {
            const discount = Number(formData.discountAmount);
            const minCart = Number(formData.minCartAmount);

            if (minCart < discount + 10) {
                toast.dismiss();
                toast.error(`Min Cart Value must be at least ₹${discount + 10} (Discount + ₹10)`);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const payload = {
                provider: formData.provider,
                code: formData.code,
                tagline: formData.tagline,
                conditionValue: Number(formData.discountAmount),
                active: true
            };

            // Add optional fields if provided
            if (formData.minCartAmount) {
                payload.minCartAmount = Number(formData.minCartAmount);
            }

            if (formData.expiryDate) {
                payload.expiryDate = formData.expiryDate;
            }
            if (formData.selectedCategories && formData.selectedCategories.length > 0) {
                payload.applicableCategories = formData.selectedCategories;
            }

            await api.post("/admin/offer", payload);
            toast.dismiss();
            toast.success("Offer Created Successfully!");

            // Reset form & refresh list
            setFormData({
                provider: "KETALOG OFFER",
                code: "",
                tagline: "",
                discountAmount: "",
                minCartAmount: "",

                expiryDate: "",
                selectedCategories: []
            });
            fetchOffers();
        } catch (error) {
            toast.dismiss();
            toast.error(error.response?.data?.message || "Failed to create offer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            // Find the offer to get current status
            const currentOffer = offers.find(o => o._id === id);
            if (!currentOffer) return;

            // Toggle the status by sending the opposite value
            await api.put(`/admin/offer/${id}`, {
                isActive: !currentOffer.isActive
            });
            toast.dismiss();
            toast.success("Status updated");
            fetchOffers();
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to update status");
        }
    };

    const deleteOffer = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this offer?")) {
            try {
                await api.delete(`/admin/offer/${id}`);
                toast.dismiss();
                toast.success("Offer deleted");
                fetchOffers();
            } catch (error) {
                toast.dismiss();
                toast.error("Failed to delete offer");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Ticket className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        Offers Management
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 sm:ml-14">
                        Manage discount codes and flat-rate offers for your customers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Section: Create Offer Form (4 Columns) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-4 sm:p-6 sticky top-24 transition-all hover:shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Plus size={18} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Offer</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* 1. Offer Provider */}
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Offer Provider
                                </label>
                                <div className="relative">
                                    <select
                                        name="provider"
                                        value={formData.provider}
                                        onChange={handleInputChange}
                                        className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-gray-800"
                                    >
                                        <option value="KETALOG OFFER">KETALOG OFFER</option>
                                        <option value="BANK OFFER">BANK OFFER</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Coupon Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Coupon Code
                                </label>
                                <div className="relative group focus-within:ring-2 focus-within:ring-blue-500 rounded-xl transition-all">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Tag size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="code"
                                        placeholder="e.g. SAVE100"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none transition-all uppercase font-mono font-bold tracking-wider placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 3. Offer Tagline */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Offer Tagline
                                </label>
                                <input
                                    type="text"
                                    name="tagline"
                                    placeholder="e.g. Flat ₹100 Off on Grocery"
                                    value={formData.tagline}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-400"
                                    required
                                />
                            </div>

                            {/* 4. Applicable Categories */}
                            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                                <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                    <Tag size={14} />
                                    Category Restrictions
                                </h3>
                                <div className="max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg p-3 space-y-2">
                                    {categories.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-2">No categories available</p>
                                    ) : (
                                        categories.map((category) => (
                                            <label key={category._id} className="flex items-center gap-2 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 p-1.5 rounded transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedCategories.includes(category._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                selectedCategories: [...prev.selectedCategories, category._id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                selectedCategories: prev.selectedCategories.filter(id => id !== category._id)
                                                            }));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                                />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{category.title || category.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                                    Leave unselected to apply to all categories (Selected: {formData.selectedCategories.length})
                                </p>
                            </div>



                            {/* 5. Offer Stats (Discount & Min Cart) */}
                            <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Ticket size={14} />
                                    Pricing Configuration
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Discount Amount */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                            Discount (₹) *
                                        </label>
                                        <div className="relative">
                                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="discountAmount"
                                                placeholder="100"
                                                value={formData.discountAmount}
                                                onChange={handleInputChange}
                                                className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-900"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Min Cart Amount */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                            Min Cart Value (₹)
                                        </label>
                                        <div className="relative">
                                            <ShoppingBag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="minCartAmount"
                                                placeholder="0 (Optional)"
                                                value={formData.minCartAmount}
                                                onChange={handleInputChange}
                                                className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-900 dark:text-white placeholder-gray-400"
                                            />
                                        </div>
                                        {formData.discountAmount && (
                                            <p className="text-[9px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                                Must be ≥ ₹{Number(formData.discountAmount) + 10} (Discount + ₹10)
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    The customer gets a flat discount of <span className="font-semibold text-gray-600 dark:text-gray-300">₹{formData.discountAmount || '0'}</span> on their order{formData.minCartAmount && <span> when cart value ≥ ₹{formData.minCartAmount}</span>}.
                                </p>
                            </div>

                            {/* 6. Validity Configuration (Expiry) */}
                            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                    <Tag size={14} />
                                    Validity Configuration
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Expiry Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 dark:text-white border border-blue-200 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-900 dark:text-white"
                                        />
                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Leave empty for no expiration</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                        Create Offer
                                    </>
                                )}
                            </button>
                        </form>
                    </div>



                </div>

                {/* Right Section: Current Offers List (8 Columns) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Campaigns</h3>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {offers.length} Live
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Updated just now
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/50 dark:bg-gray-700/20 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider / Offer ID</th>
                                        <th className="px-4 sm:px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                        <th className="px-4 sm:px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing Logic</th>
                                        <th className="px-4 sm:px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-4 sm:px-6 py-4 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {offers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                        <Ticket size={32} className="text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 dark:text-white font-medium">No offers currently active</p>
                                                        <p className="text-sm text-gray-500 mt-1">Create your first discount offer using the form.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        offers.map((offer, index) => (
                                            <tr key={offer._id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-200">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                            #{index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{offer.provider}</div>
                                                            <div className="text-[10px] text-gray-400 font-mono">ID: {offer._id.toString().slice(-6)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-mono font-bold px-2 py-1 rounded border border-dashed border-gray-600 dark:border-gray-400 tracking-wider">
                                                                {offer.code}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                                            {offer.tagline}
                                                        </div>
                                                        {/* Additional Details */}
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {offer.minCartAmount > 0 && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800">
                                                                    Min: ₹{offer.minCartAmount}
                                                                </span>
                                                            )}
                                                            {offer.usageLimitPerBuyer && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md border border-purple-200 dark:border-purple-800">
                                                                    Limit: {offer.usageLimitPerBuyer}x/user
                                                                </span>
                                                            )}
                                                            {offer.expiryDate && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-800">
                                                                    Expires: {new Date(offer.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                            {offer.applicableCategories && offer.applicableCategories.length > 0 && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-md border border-teal-200 dark:border-teal-800">
                                                                    {offer.applicableCategories.length} {offer.applicableCategories.length === 1 ? 'Category' : 'Categories'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                                            <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Discount</span>
                                                            <span className="text-sm font-bold text-green-700 dark:text-green-300">₹{offer.conditionValue || offer.discountAmount}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => toggleStatus(offer._id)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${offer.isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}
                                                    >
                                                        <span className="sr-only">Toggle status</span>
                                                        <span
                                                            className={`${offer.isActive ? 'translate-x-6' : 'translate-x-1'
                                                                } inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => deleteOffer(offer._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-60 group-hover:opacity-100"
                                                        title="Permanently Delete Offer"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
