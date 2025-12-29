import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useThemeStore from './store/themeStore';
import { Toaster } from 'react-hot-toast';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminSellers from './components/admin/AdminSellers';
import AdminCategories from './components/admin/AdminCategories';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminProfile from './components/admin/AdminProfile';
import SellerShopView from './components/admin/SellerShopView';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AdminLogin />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/sellers" element={<AdminSellers />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>

          {/* Seller Shop View - Outside AdminLayout for custom navbar */}
          <Route path="/buyer/seller/:id" element={<SellerShopView />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
