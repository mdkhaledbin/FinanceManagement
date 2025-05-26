// File: frontend/src/components/Footer.tsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="py-10 bg-gray-800 text-center">
      <p className="text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} FinBot. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;