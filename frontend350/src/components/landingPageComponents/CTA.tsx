import React from 'react';

const CTA = () => {
  return (
    <section id="cta" className="py-20 md:py-28 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Get Started Today – Take control of your finances with FinBot
        </h2>
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Join thousands of users who are managing their money smarter with FinBot. Sign up now and experience the future of personal finance.
        </p>
        <a 
          href="#" 
          className="bg-white text-blue-600 px-10 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-xl shadow-md hover:shadow-lg"
        >
          Get Started
        </a>
      </div>
    </section>
  );
};

export default CTA;