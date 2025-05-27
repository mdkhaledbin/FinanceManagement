import React from 'react';
import { TrendingUp, BookOpen, MessageSquare, Bell } from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Finance Management',
    description: 'Track income, expenses, and savings with our intuitive tools, giving you a clear overview of your financial health.',
  },
  {
    icon: BookOpen,
    title: 'Personal Bookkeeping',
    description: 'Users maintain personal financial records effortlessly, ensuring accuracy and ease of access to your data.',
  },
  {
    icon: MessageSquare,
    title: 'CRUD Operations via Chatbot',
    description: 'Add, edit, or delete your financial data simply by chatting with FinBot, making management quick and conversational.',
  },
  {
    icon: Bell,
    title: 'Reminder System',
    description: 'Set intelligent reminders for due payments, bill cycles, and budgeting goals so you never miss a thing.',
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover the powerful tools FinBot offers to simplify your financial life.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
              <feature.icon className="w-12 h-12 text-blue-600 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;