import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { BRAND, NAV_LINKS } from '../constants';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { SearchModal } from './SearchModal';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const toggleCartDrawer = useCartStore((state) => state.toggleDrawer);
  const wishlistCount = useWishlistStore((state) => state.getCount());
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-40 w-full transition-all duration-300">
        {/* 1. Announcement Bar */}
        <div className="bg-urban-black text-urban-biscuit text-[11px] py-2 px-4 text-center tracking-[0.2em] uppercase font-medium border-b border-white/10 transition-all">
          {BRAND.announcement}
        </div>

        {/* 2. Main Header */}
        <header
          className={`w-full transition-all duration-300 ${
            isScrolled
              ? 'bg-urban-white/95 backdrop-blur-md shadow-sm border-b border-urban-border'
              : 'bg-urban-white border-b border-urban-border/60'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Mobile: Hamburger Button */}
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 -ml-2 text-urban-black hover:text-urban-teal focus:outline-none"
                  aria-label="Toggle Mobile Navigation"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* Brand Logo */}
              <div className="flex-1 lg:flex-initial text-center lg:text-left">
                <Link to="/" className="inline-block group">
                  <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-urban-black group-hover:text-urban-teal transition-colors">
                    {BRAND.name}
                  </span>
                  <span className="block text-[8px] uppercase tracking-[0.35em] text-urban-warm-grey -mt-1 text-center">
                    Atelier
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-8">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    className={({ isActive }) =>
                      `text-xs uppercase tracking-editorial transition-colors ${
                        isActive && link.path === '/'
                          ? 'text-urban-teal font-semibold'
                          : 'text-urban-black hover:text-urban-teal'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              {/* Right Actions (Search, Wishlist, Cart, Account) */}
              <div className="flex items-center space-x-3 sm:space-x-5">
                {/* Search Modal Trigger */}
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="p-2 text-urban-black hover:text-urban-teal transition-colors"
                  aria-label="Search Catalog"
                  title="Search products..."
                >
                  <Search size={19} strokeWidth={1.5} />
                </button>

                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="hidden sm:block p-2 text-urban-black hover:text-urban-teal transition-colors relative"
                  aria-label="Saved items"
                >
                  <Heart size={19} strokeWidth={1.5} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 bg-urban-teal text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Account */}
                <Link
                  to={isAuthenticated ? '/account' : '/login'}
                  className="hidden sm:block p-2 text-urban-black hover:text-urban-teal transition-colors"
                  aria-label="Customer Account"
                >
                  <User size={19} strokeWidth={1.5} />
                </Link>

                {/* Shopping Bag / Cart */}
                <button
                  onClick={toggleCartDrawer}
                  className="p-2 text-urban-black hover:text-urban-teal transition-colors relative"
                  aria-label="Shopping Bag"
                >
                  <ShoppingBag size={19} strokeWidth={1.5} />
                  {totalCartItems > 0 && (
                    <span className="absolute top-1 right-1 bg-urban-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                      {totalCartItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Slide Drawer Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-urban-border bg-urban-white px-6 py-8 space-y-6 animate-fadeIn">
              <nav className="flex flex-col space-y-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm uppercase tracking-editorial text-urban-black hover:text-urban-teal font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-urban-border flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="flex items-center space-x-2 text-xs uppercase tracking-editorial text-urban-black text-left"
                >
                  <Search size={16} />
                  <span>Search Catalog</span>
                </button>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-xs uppercase tracking-editorial text-urban-black"
                >
                  <Heart size={16} />
                  <span>Wishlist ({wishlistCount})</span>
                </Link>
                <Link
                  to={isAuthenticated ? '/account' : '/login'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-xs uppercase tracking-editorial text-urban-black"
                >
                  <User size={16} />
                  <span>{isAuthenticated ? `Account: ${user?.name || 'Customer'}` : 'Sign In / Register'}</span>
                </Link>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};
