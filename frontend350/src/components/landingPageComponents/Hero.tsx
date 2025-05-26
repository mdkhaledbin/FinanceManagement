'use client';
import React from 'react';

const primaryButtonStyle = "bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Manage Your Finances with Ease
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl mx-auto md:mx-0">
            Experience intuitive finance tracking and seamless bookkeeping with FinBot. Our chat integration makes managing your money simpler than ever.
          </p>
          <a href="#cta" className={primaryButtonStyle}>Get Started</a>
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
