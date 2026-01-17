import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import { Store, MapPin, Phone, User, ShoppingBag, ArrowLeft, Sun, Moon, Star, Heart, ShoppingCart, TrendingUp } from "lucide-react";
import useThemeStore from "../../store/themeStore";
import KetalogLogo from "../../assets/logo/Ketalog_Logo.jpeg";

export default function SellerShopView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme, toggleTheme } = useThemeStore();

    const fromProductId = location.state?.fromProduct;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await api.get(`/admin/sellers/${id}`);
                // Flatten the response: Merge user, profile, AND ORDERS data
                const { user, profile, orders } = profileRes.data;
                setSeller({ ...user, ...profile, orders }); // Store orders in seller object for stats

                const productsRes = await api.get(`/products?seller=${id}`);
                const pData = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.data || []);
                setProducts(pData);
            } catch (err) {
                // Silent catch
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-gray-800 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-800 rounded"></div>
            </div>
        </div>
    );

    if (!seller) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500">Shop not found.</div>;

    const mapLink = seller.lat && seller.lng
        ? `https://www.google.com/maps?q=${seller.lat},${seller.lng}`
        : seller.address
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.address)}`
            : null;

    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-[#1a1c23] text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Custom Navbar (Preserved from my design) */}
            <nav className="h-16 border-b border-gray-800 bg-[#1a1c23] px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {fromProductId ? (
                        <Link
                            to={`/buyer/product/${fromProductId}`}
                            className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium">Back to Product</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <img src={KetalogLogo} alt="Ketalog" className="h-10 w-auto rounded-md object-contain" />
                        <span className="text-xl font-bold tracking-wide text-white">KETALOG</span>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-yellow-400 transition"
                >
                    {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </nav>

            <main className="w-full mx-auto p-4 md:p-6 space-y-6">

                {/* Shop Banner Card - Integrated User's Hero structure into Dark Theme */}
                <div className="bg-[#1f2937] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative">
                    {/* Gradient Background */}
                    <div className="h-24 md:h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        {/* Abstract Circles (User Code) */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                <path fill="white" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.4,82.2,23.1,70.8,34.3C59.4,45.5,47.9,54.2,35.6,60.7C23.3,67.2,10.2,71.5,-2.1,75.1C-14.4,78.7,-25.9,81.6,-36.7,76.5C-47.5,71.4,-57.6,58.3,-65.4,45C-73.2,31.7,-78.7,18.2,-81.2,3.8C-83.7,-10.6,-83.2,-25.9,-75.6,-38.5C-68,-51.1,-53.3,-61,-38.9,-68C-24.5,-75,-10.4,-79.1,2.8,-83.9C16,-88.7,30.5,-94.1,44.7,-76.4Z" transform="translate(100 100)" />
                            </svg>
                        </div>
                    </div>

                    <div className="px-4 pb-6 md:px-8 md:pb-6 relative">
                        <div className="flex flex-col md:flex-row items-start gap-4 -mt-10">
                            {/* Avatar */}
                            <div className="h-20 w-20 rounded-2xl bg-[#1f2937] p-1 shadow-md border-4 border-[#1f2937] overflow-hidden">
                                {seller.profilePicture ? (
                                    <img
                                        src={seller.profilePicture}
                                        alt={seller.shopName}
                                        className="h-full w-full object-cover rounded-xl"
                                    />
                                ) : (
                                    <div className="h-full w-full rounded-xl bg-[#2d3748] flex items-center justify-center text-blue-500">
                                        <Store size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 pt-2 md:pt-14">
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{seller.shopName}</h1>

                                {/* Info Pills - Row 1 */}
                                <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-2">
                                    <div className="flex items-center gap-1.5 bg-[#374151] px-3 py-1 rounded-full">
                                        <User size={14} />
                                        <span>{seller.ownerName || "Unknown Owner"}</span>
                                    </div>
                                    {seller.address && (
                                        <div className="flex items-center gap-1.5 bg-[#374151] px-3 py-1 rounded-full">
                                            <MapPin size={14} />
                                            <span className="max-w-xs truncate">{seller.address} - {seller.pincode}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Pills - Row 2 (Extra Data) */}
                                <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                                    {seller.email && (
                                        <div className="flex items-center gap-1.5 bg-[#374151] px-3 py-1 rounded-full border border-gray-700">
                                            <span className="text-xs text-gray-500">Email:</span>
                                            <span className="select-all text-gray-300">{seller.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 bg-[#374151] px-3 py-1 rounded-full border border-gray-700">
                                        <span className="text-xs text-gray-500">Joined:</span>
                                        <span className="text-gray-300">
                                            {new Date(seller.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 md:pt-14 flex flex-col md:items-end gap-4 w-full md:w-auto mt-4 md:mt-0 self-end md:self-auto pb-1">

                                {/* Contact Buttons */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    {(seller.businessPhone || seller.mobile) && (
                                        <a href={`tel:${seller.businessPhone || seller.mobile}`} className="flex-1 w-full md:w-auto justify-center px-6 py-3 border-2 border-green-500 hover:bg-green-500/10 rounded-xl text-green-500 hover:text-green-400 transition flex items-center gap-2 font-bold shadow-sm">
                                            <Phone size={20} />
                                            <span>{seller.businessPhone || seller.mobile}</span>
                                        </a>
                                    )}

                                    {mapLink && (
                                        <a href={mapLink} target="_blank" rel="noreferrer" className="flex-1 w-full md:w-auto justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition flex items-center gap-2 font-bold shadow-lg shadow-blue-500/20">
                                            <MapPin size={20} />
                                            <span>Locate Shop</span>
                                        </a>
                                    )}
                                </div>

                                {/* Address Box (Explicit Visibility) */}
                                {(seller.address || seller.pincode) && (
                                    <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 max-w-sm text-center md:text-right backdrop-blur-sm">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-center md:justify-end gap-1">
                                            <MapPin size={10} /> Shop Address
                                        </div>
                                        <p className="text-gray-200 text-sm leading-snug">
                                            {seller.address || "No Address Provided"}
                                            {seller.pincode && <span className="block text-gray-400 text-xs mt-0.5">Pincode: {seller.pincode}</span>}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <ShoppingBag className="text-blue-500" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products ({products.length})</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map(product => (
                            <div key={product._id} className="bg-white dark:bg-[#1f2937] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition group hover:shadow-xl block">
                                {/* Image Placeholder */}
                                <div className="h-48 bg-gray-100 dark:bg-[#374151] flex items-center justify-center relative">
                                    {product.images && (product.images[0]?.url || product.images[0]) ? (
                                        <img
                                            src={product.images[0].url || product.images[0]}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-gray-400 flex flex-col items-center">
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="text-gray-900 dark:text-white font-semibold truncate mb-1">{product.title}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                            {product.rating || "0.0"} <Star size={10} fill="currentColor" />
                                        </span>
                                        <span className="text-gray-500 text-xs">({product.reviews?.length || 0})</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 mb-4">{product.description || product.category?.name}</p>
                                    <hr className="border-gray-200 dark:border-gray-700 mb-4" />

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">₹{product.price}</span>
                                    </div>
                                </div>

                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-[#1f2937] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <ShoppingBag size={48} className="mx-auto text-gray-400 mb-3" />
                                <p>No products available in this shop.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
