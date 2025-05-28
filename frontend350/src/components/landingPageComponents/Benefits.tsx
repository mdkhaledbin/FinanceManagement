import React from 'react';
import { CheckCircle, Zap, Smartphone, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import clsx from 'clsx';

const benefits = [
  {
    icon: CheckCircle,
    title: 'User-Friendly Experience',
    description: 'Navigate your finances with an intuitive interface designed for clarity and ease of use.',
  },
  {
    icon: Zap,
    title: 'Efficiency',
    description: 'Manage your money faster and smarter with streamlined processes and quick chatbot interactions.',
  },
  {
    icon: Smartphone,
    title: 'Accessibility',
    description: 'Access FinBot anytime, anywhere, on any device, keeping your financial data at your fingertips.',
  },
  {
    icon: ShieldCheck,
    title: 'Versatility',
    description: 'A comprehensive suite of tools to handle all aspects of your personal finance and bookkeeping needs.',
  },
];

const Benefits = () => {
  const { theme } = useTheme();

  return (
    <section id="why-us" className={clsx(
      "py-16 md:py-24 transition-colors duration-300",
      theme === 'dark' ? "bg-gray-900" : "bg-blue-50"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className={clsx(
            "text-3xl md:text-4xl font-bold mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>Why Choose Us</h2>
          <p className={clsx(
            "text-lg max-w-2xl mx-auto",
            theme === 'dark' ? "text-gray-300" : "text-gray-600"
          )}>FinBot is built with your needs in mind, offering a superior financial management experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {benefits.map((value) => (
            <div key={value.title} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <value.icon className={clsx(
                  "w-8 h-8 mt-1",
                  theme === 'dark' ? "text-blue-400" : "text-blue-600"
                )} strokeWidth={2} />
              </div>
              <div>
                <h3 className={clsx(
                  "text-xl font-semibold mb-2",
                  theme === 'dark' ? "text-gray-100" : "text-gray-800"
                )}>{value.title}</h3>
                <p className={clsx(
                  "leading-relaxed",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
