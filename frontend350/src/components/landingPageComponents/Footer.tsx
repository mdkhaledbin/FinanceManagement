import React from 'react';
import { useTheme } from '@/context/ThemeProvider';
import clsx from 'clsx';

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className={clsx(
      "py-10 text-center transition-colors duration-300",
      theme === 'dark' ? "bg-gray-900" : "bg-gray-800"
    )}>
      <p className={clsx(
        "text-sm",
        theme === 'dark' ? "text-gray-500" : "text-gray-400"
      )}>
        &copy; {new Date().getFullYear()} FinBot. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;