"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import Image from "next/image";

const images = [
  "unsplash_1.JPG",
  "unsplash_2.JPG",
  "unsplash_3.JPG",
  "unsplash_4.JPG",
  "unsplash_5.JPG",
  "unsplash_6.JPG"
];

const primaryButtonStyleLight =
  "bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg";
const primaryButtonStyleDark =
  "bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg";

export default function Hero() {
  const { theme } = useTheme();
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * images.length);
    setImageUrl(`/${images[randomIndex]}`); // ✅ Prefix with '/' for public folder
  }, []);

  return (
    <section
      className={clsx(
        "pt-32 pb-16 md:pt-40 md:pb-24 transition-colors duration-300",
        theme === "dark"
          ? "bg-gray-800"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1
            className={clsx(
              "text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            Manage Any Data with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Voice & AI
            </span>
          </h1>
          <p
            className={clsx(
              "text-lg md:text-xl mb-6 max-w-xl mx-auto md:mx-0",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}
          >
            Experience the future of data management with{" "}
            <strong>FinBot</strong> - an AI-powered platform that lets you
            manage any kind of data using natural chat, voice commands, and
            manual operations in both <strong>Bengali and English</strong>.
          </p>
          <div
            className={clsx(
              "mb-8 p-4 rounded-lg border-l-4 border-blue-500",
              theme === "dark" ? "bg-gray-700/50" : "bg-blue-50"
            )}
          >
            <p
              className={clsx(
                "text-sm font-medium",
                theme === "dark" ? "text-blue-300" : "text-blue-700"
              )}
            >
              🎤 "আমি আজকে ১০০ টাকা খরচ করেছি" → Instantly added to your expense table
            </p>
            <p
              className={clsx(
                "text-xs mt-1",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              Reduces manual work by <strong>80%+</strong> through voice and AI automation
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/chat/"
              className={
                theme === "dark"
                  ? primaryButtonStyleDark
                  : primaryButtonStyleLight
              }
            >
              🎤 Try Voice Chat
            </a>
            <a
              href="/signin"
              className={clsx(
                "px-8 py-3 rounded-lg border-2 transition-colors font-semibold text-lg text-center",
                theme === "dark"
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50"
              )}
            >
              Get Started Free
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="FinBot Voice & AI Data Management"
              width={500}
              height={400}
              className="rounded-xl shadow-2xl transform transition-transform duration-500 hover:scale-105"
              unoptimized // ✅ Correctly used inside the tag
            />
          )}
        </div>
      </div>
    </section>
  );
}
