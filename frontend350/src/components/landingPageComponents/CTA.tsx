import React from "react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";

const CTA = () => {
  const { theme } = useTheme();

  return (
    <section
      id="cta"
      className={clsx(
        "py-20 md:py-28 transition-colors duration-300",
        theme === "dark"
          ? "bg-gray-800"
          : "bg-gradient-to-r from-blue-600 to-indigo-700",
        theme === "dark" ? "text-white" : "text-white"
      )}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={clsx("text-3xl md:text-4xl lg:text-5xl font-bold mb-6")}>
          Get Started Today – Take control of your finances with FinBot
        </h2>
        <p
          className={clsx(
            "text-lg md:text-xl mb-10 max-w-2xl mx-auto",
            theme === "dark" ? "text-gray-300" : "text-blue-100"
          )}
        >
          Join thousands of users who are managing their money smarter with
          FinBot. Sign up now and experience the future of personal finance.
        </p>
        <a
          href="/chat/"
          className={clsx(
            "px-10 py-4 rounded-lg transition-colors font-semibold text-xl shadow-md hover:shadow-lg",
            theme === "dark"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white text-blue-600 hover:bg-gray-100"
          )}
        >
          Get Started
        </a>
      </div>
    </section>
  );
};

export default CTA;
