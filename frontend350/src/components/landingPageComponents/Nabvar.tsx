import React from 'react';

const Navbar = () => {
  return (
    <nav className="w-full bg-white shadow-sm fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="text-3xl font-bold text-blue-600">FinBot</div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium">Features</a>
            <a href="#why-us" className="text-gray-600 hover:text-blue-600 font-medium">Why Us</a>
            <a href="#cta" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">Get Started</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;