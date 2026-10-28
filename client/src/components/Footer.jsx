import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { BRAND } from '../constants';

export const Footer = () => {
  return (
    <footer className="bg-urban-black text-urban-white pt-16 pb-12 border-t border-urban-border">
      {/* Brand Value Guarantees */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <Truck className="text-urban-biscuit" size={26} strokeWidth={1.5} />
            <div>
              <h4 className="text-xs uppercase tracking-editorial font-semibold">Complimentary Shipping</h4>
              <p className="text-xs text-urban-warm-grey-light mt-0.5">Air courier on all orders over ₹1,999</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <RefreshCw className="text-urban-biscuit" size={26} strokeWidth={1.5} />
            <div>
              <h4 className="text-xs uppercase tracking-editorial font-semibold">Seamless Returns</h4>
              <p className="text-xs text-urban-warm-grey-light mt-0.5">14-day door pickup inspection & exchange</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <ShieldCheck className="text-urban-biscuit" size={26} strokeWidth={1.5} />
            <div>
              <h4 className="text-xs uppercase tracking-editorial font-semibold">Authentic Craftsmanship</h4>
              <p className="text-xs text-urban-warm-grey-light mt-0.5">Finest virgin wools, silks, and calfskin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Directory + Brand Mark */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <span className="font-serif text-2xl font-bold tracking-widest text-white">
                {BRAND.name}
              </span>
            </Link>
            <p className="text-xs text-urban-warm-grey-light leading-relaxed max-w-xs">
              Everyday fashion. Refined for modern life. Architectural tailoring and timeless silhouettes.
            </p>
          </div>

          {/* Column 1: SHOP */}
          <div>
            <h5 className="text-xs uppercase tracking-widest text-urban-biscuit font-semibold mb-4">
              Shop
            </h5>
            <ul className="space-y-2.5 text-xs text-urban-warm-grey-light">
              <li><Link to="/shop?gender=men" className="hover:text-white transition-colors">Men</Link></li>
              <li><Link to="/shop?gender=women" className="hover:text-white transition-colors">Women</Link></li>
              <li><Link to="/shop?category=kids" className="hover:text-white transition-colors">Kids</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/offers" className="hover:text-white transition-colors">Offers</Link></li>
            </ul>
          </div>

          {/* Column 2: HELP */}
          <div>
            <h5 className="text-xs uppercase tracking-widest text-urban-biscuit font-semibold mb-4">
              Help
            </h5>
            <ul className="space-y-2.5 text-xs text-urban-warm-grey-light">
              <li><Link to="/account" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Consignment</Link></li>
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Shipping</Link></li>
              <li><Link to="/account/returns" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="/account/returns" className="hover:text-white transition-colors">Refunds</Link></li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div>
            <h5 className="text-xs uppercase tracking-widest text-urban-biscuit font-semibold mb-4">
              Company
            </h5>
            <ul className="space-y-2.5 text-xs text-urban-warm-grey-light">
              <li><span className="cursor-pointer hover:text-white transition-colors">About</span></li>
              <li><span className="cursor-pointer hover:text-white transition-colors">Privacy</span></li>
              <li><span className="cursor-pointer hover:text-white transition-colors">Terms</span></li>
              <li><span className="cursor-pointer hover:text-white transition-colors">Careers</span></li>
            </ul>
          </div>

          {/* Column 4: FOLLOW */}
          <div>
            <h5 className="text-xs uppercase tracking-widest text-urban-biscuit font-semibold mb-4">
              Follow
            </h5>
            <ul className="space-y-2.5 text-xs text-urban-warm-grey-light">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-urban-warm-grey-light">
        <p>© 2026 Urban Check Technologies Private Limited. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 tracking-[0.25em] uppercase text-[10px]">
          Curated in Milan & New Delhi
        </p>
      </div>
    </footer>
  );
};
