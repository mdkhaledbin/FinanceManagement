import React from 'react';
import Navbar from "@/components/landingPageComponents/Nabvar";
import Hero from "@/components/landingPageComponents/Hero";
import Features from "@/components/landingPageComponents/Features";
import Benefits from "@/components/landingPageComponents/Benefits";
import CTA from "@/components/landingPageComponents/CTA";
import Footer from "@/components/landingPageComponents/Footer";


const HomePage = () => {
  return (
    <main className="min-h-screen bg-white text-gray-800 font-sans antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Benefits />
      <CTA />
      <Footer />
    </main>
  );
};

export default HomePage;
