import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Star, RotateCcw, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AccountLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Profile Overview', path: '/account', icon: User, end: true },
    { label: 'Order History', path: '/account/orders', icon: Package },
    { label: 'Saved Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Reviews & Ratings', path: '/account/reviews', icon: Star },
    { label: 'Returns & Exchanges', path: '/account/returns', icon: RotateCcw },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-urban-black">My Account</h1>
        <p className="text-xs text-urban-warm-grey mt-1">
          Welcome back, {user?.name || 'Customer'}. Manage your orders and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Account Sidebar Navigation */}
        <aside className="md:col-span-1 border border-urban-border bg-urban-light-grey/40 p-4 h-fit">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 text-xs font-medium uppercase tracking-editorial transition-colors ${
                      isActive
                        ? 'bg-urban-teal text-white'
                        : 'text-urban-black hover:bg-urban-border/50'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-medium uppercase tracking-editorial text-red-600 hover:bg-red-50 transition-colors mt-6 pt-3 border-t border-urban-border"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="md:col-span-3 border border-urban-border p-6 sm:p-8 bg-white min-h-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
