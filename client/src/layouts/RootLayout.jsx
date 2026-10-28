import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { QuickCartDrawer } from '../components/QuickCartDrawer';

export const RootLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-urban-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <QuickCartDrawer />
      <Footer />
    </div>
  );
};
