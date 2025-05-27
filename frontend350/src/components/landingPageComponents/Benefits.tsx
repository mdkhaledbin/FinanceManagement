import React from 'react';
import { CheckCircle, Zap, Smartphone, ShieldCheck } from 'lucide-react';

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
  return (
    <section id="why-us" className="py-16 md:py-24 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">FinBot is built with your needs in mind, offering a superior financial management experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {benefits.map((value) => (
            <div key={value.title} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <value.icon className="w-8 h-8 text-blue-600 mt-1" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
