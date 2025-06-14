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
          Ready to Experience the Future of Data Management?
        </h2>
        <p
          className={clsx(
            "text-lg md:text-xl mb-8 max-w-3xl mx-auto",
            theme === "dark" ? "text-gray-300" : "text-blue-100"
          )}
        >
          Join the revolution in data management. Speak naturally in Bengali or
          English, collaborate in real-time, and reduce manual work by 80%. Your
          data has never been this accessible.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <div
            className={clsx(
              "text-sm px-4 py-2 rounded-full",
              theme === "dark" ? "bg-gray-700" : "bg-white/20"
            )}
          >
            🎤 Voice Commands: "আমি আজকে ১০০ টাকা খরচ করেছি"
          </div>
          <div
            className={clsx(
              "text-sm px-4 py-2 rounded-full",
              theme === "dark" ? "bg-gray-700" : "bg-white/20"
            )}
          >
            🤝 Real-time Collaboration
          </div>
          <div
            className={clsx(
              "text-sm px-4 py-2 rounded-full",
              theme === "dark" ? "bg-gray-700" : "bg-white/20"
            )}
          >
            🧠 AI-Powered Intelligence
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/chat/"
            className={clsx(
              "px-10 py-4 rounded-lg transition-colors font-semibold text-xl shadow-md hover:shadow-lg",
              theme === "dark"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-white text-blue-600 hover:bg-gray-100"
            )}
          >
            🎤 Try Voice Chat Now
          </a>
          <a
            href="/signin"
            className={clsx(
              "px-10 py-4 rounded-lg border-2 transition-colors font-semibold text-xl",
              theme === "dark"
                ? "border-gray-400 text-gray-300 hover:bg-gray-700"
                : "border-white text-white hover:bg-white/10"
            )}
          >
            Get Started Free
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
