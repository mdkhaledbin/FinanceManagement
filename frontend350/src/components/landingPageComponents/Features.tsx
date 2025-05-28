import React from 'react';
import { TrendingUp, BookOpen, MessageSquare, Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import clsx from 'clsx';

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
  const { theme } = useTheme();

  return (
    <section id="features" className={clsx(
      "py-16 md:py-24 transition-colors duration-300",
      theme === 'dark' ? "bg-gray-800" : "bg-white"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className={clsx(
            "text-3xl md:text-4xl font-bold mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>Key Features</h2>
          <p className={clsx(
            "text-lg max-w-2xl mx-auto",
            theme === 'dark' ? "text-gray-300" : "text-gray-600"
          )}>Discover the powerful tools FinBot offers to simplify your financial life.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className={clsx(
              "p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center",
              theme === 'dark' ? "bg-gray-700" : "bg-gray-50"
            )}>
              <feature.icon className={clsx(
                "w-12 h-12 mb-6",
                theme === 'dark' ? "text-blue-400" : "text-blue-600"
              )} strokeWidth={1.5} />
              <h3 className={clsx(
                "text-xl font-semibold mb-3",
                theme === 'dark' ? "text-gray-100" : "text-gray-800"
              )}>{feature.title}</h3>
              <p className={clsx(
                "leading-relaxed text-sm",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;