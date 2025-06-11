"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import Image from "next/image";

const primaryButtonStyleLight =
  "bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg";
const primaryButtonStyleDark =
  "bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg";

export default function Hero() {
  const { theme } = useTheme();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(
          "https://api.unsplash.com/photos/random?query=finance,money,transaction,bank&client_id=x9qDOaEYBlQkYuMWMg9UXQ-Lxm-242FO6qJFtXW1-M8"
        );
        const data = await res.json();
        setImageUrl(data.urls.regular);
      } catch (err) {
        console.error("Failed to fetch image from Unsplash:", err);
      }
    };

    fetchImage();
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
            Manage Your Finances with Ease
          </h1>
          <p
            className={clsx(
              "text-lg md:text-xl mb-10 max-w-xl mx-auto md:mx-0",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}
          >
            Experience intuitive finance tracking and seamless bookkeeping with
            FinBot. Our chat integration makes managing your money simpler than
            ever.
          </p>
          <a
            href="/chat/"
            className={
              theme === "dark"
                ? primaryButtonStyleDark
                : primaryButtonStyleLight
            }
          >
            Get Started
          </a>
        </div>
        <div className="flex justify-center">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="FinBot App UI Mockup"
              width={500}
              height={400}
              className="rounded-xl shadow-2xl transform transition-transform duration-500 hover:scale-105"
              unoptimized
            />
          )}
        </div>
      </div>
    </section>
  );
}
