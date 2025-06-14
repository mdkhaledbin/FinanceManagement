import React from "react";
import { Zap, Users, Mic, Shield, Globe, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";

const benefits = [
  {
    icon: Zap,
    title: "80% Faster Data Entry",
    description:
      "Voice commands and AI automation dramatically reduce manual work. What used to take hours now takes minutes with natural conversation.",
  },
  {
    icon: Mic,
    title: "Hands-Free Operation",
    description:
      "Complete data management without typing. Perfect for busy professionals, accessibility needs, or when your hands are occupied.",
  },
  {
    icon: Users,
    title: "Real-Time Collaboration",
    description:
      "Share tables instantly with family and friends. See changes in real-time with secure permission management and activity tracking.",
  },
  {
    icon: Globe,
    title: "Bengali & English Support",
    description:
      "Native support for both languages in voice, chat, and interface. Switch seamlessly between languages for the most natural experience.",
  },
  {
    icon: Shield,
    title: "Intelligent Data Security",
    description:
      "Advanced JWT authentication with database-level permissions. Your data is secure with comprehensive audit trails and access control.",
  },
  {
    icon: TrendingUp,
    title: "Unlimited Flexibility",
    description:
      "Dynamic table creation supports any data type - expenses, tasks, inventory, events. One platform for all your structured data needs.",
  },
];

const Benefits = () => {
  const { theme } = useTheme();

  return (
    <section
      id="why-us"
      className={clsx(
        "py-16 md:py-24 transition-colors duration-300",
        theme === "dark" ? "bg-gray-900" : "bg-blue-50"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={clsx(
              "text-3xl md:text-4xl font-bold mb-4",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            Why FinBot is Revolutionary
          </h2>
          <p
            className={clsx(
              "text-lg max-w-3xl mx-auto",
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            )}
          >
            Combining conversational AI, voice interfaces, and collaborative
            features with flexible API-driven data storage for the most
            intuitive data management experience ever created.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <benefit.icon
                  className={clsx(
                    "w-8 h-8 mt-1",
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  )}
                  strokeWidth={2}
                />
              </div>
              <div>
                <h3
                  className={clsx(
                    "text-xl font-semibold mb-2",
                    theme === "dark" ? "text-gray-100" : "text-gray-800"
                  )}
                >
                  {benefit.title}
                </h3>
                <p
                  className={clsx(
                    "leading-relaxed",
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
