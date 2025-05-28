'use client';
import React from 'react';
import { useTheme } from '@/context/ThemeProvider';
import clsx from 'clsx';

const primaryButtonStyleLight = "bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg";
const primaryButtonStyleDark = "bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg";

export default function Hero() {
  const { theme } = useTheme();

  return (
    <section className={clsx(
      "pt-32 pb-16 md:pt-40 md:pb-24 transition-colors duration-300",
      theme === 'dark' ? "bg-gray-800" : "bg-gradient-to-br from-blue-50 to-indigo-100"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1 className={clsx(
            "text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            Manage Your Finances with Ease
          </h1>
          <p className={clsx(
            "text-lg md:text-xl mb-10 max-w-xl mx-auto md:mx-0",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            Experience intuitive finance tracking and seamless bookkeeping with FinBot. Our chat integration makes managing your money simpler than ever.
          </p>
          <a href="#cta" className={theme === 'dark' ? primaryButtonStyleDark : primaryButtonStyleLight}>Get Started</a>
        </div>
        <div className="flex justify-center">
          <img 
            src="/Hero.png" 
            alt="FinBot App UI Mockup" 
            className="rounded-xl shadow-2xl max-w-sm md:max-w-md lg:max-w-lg transform transition-transform duration-500 hover:scale-105" 
          />
        </div>
      </div>
    </section>
  );
}
