/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SunIcon, MoonIcon, HomeIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import { registerUser, loginUser } from "../../api/AuthApi";
import { useUser } from "@/context/AuthProvider";
import { motion } from "framer-motion";

type FormData = {
  username: string;
  email: string;
  password: string;
  password2: string;
  rememberMe: boolean;
};

const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    password2: "",
    rememberMe: false,
  });

  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { refreshUser } = useUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setError("");
    setFormData({
      username: "",
      email: "",
      password: "",
      password2: "",
      rememberMe: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        if (formData.password !== formData.password2) {
          setError("Passwords do not match");
          return;
        }

        await registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
        });
      } else {
        const result = await loginUser({
          username: formData.username,
          password: formData.password,
        });
        if (!result.success) {
          setError(result.error || "Invalid username or password");
          return;
        }
      }

      await refreshUser();
      router.push("/chat");
    } catch (err: any) {
      // fallback for unexpected errors
      setError("An unexpected error occurred. Please try again.");
    }
  };

  // Enhanced gradient color scheme
  const cardClasses = clsx(
    "w-[90%] max-w-[500px] rounded-xl shadow-2xl transition-all duration-300 border",
    theme === "dark"
      ? "bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90 border-gray-700 backdrop-blur-sm"
      : "bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95 border-gray-200/80 backdrop-blur-sm"
  );

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800";
  const secondaryTextColor =
    theme === "dark" ? "text-gray-400" : "text-gray-600";
  const gradientText = clsx(
    "bg-clip-text text-transparent font-bold",
    theme === "dark"
      ? "bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400"
      : "bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500"
  );

  const inputClasses = clsx(
    "transition-all duration-300",
    theme === "dark"
      ? "bg-gray-700/40 border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50"
      : "bg-white/80 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30",
    "placeholder-gray-500/60"
  );

  const buttonClasses = clsx(
    "w-full font-semibold py-3 rounded-lg transition-all duration-300 group",
    theme === "dark"
      ? "bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 hover:from-blue-700 hover:via-teal-600 hover:to-emerald-600"
      : "bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 hover:from-blue-600 hover:via-teal-500 hover:to-emerald-500",
    "text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.99]",
    "relative overflow-hidden"
  );

  return (
    <div
      className={clsx(
        "min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden",
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-gray-50 via-blue-50/70 to-gray-50"
      )}
    >
      {/* Animated gradient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-emerald-400/20 blur-3xl animate-float opacity-70"></div>
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-teal-400/20 to-blue-400/20 blur-3xl animate-float-delay opacity-70"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-3xl animate-float-delay-2 opacity-60"></div>
      </div>

      {/* Glowing orb decoration */}
      <div className="fixed top-1/4 left-1/4 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slow"></div>
      <div className="fixed bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-teal-500/10 blur-3xl animate-pulse-slow-delay"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 z-20"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/")}
          className={clsx(
            "rounded-full backdrop-blur-sm",
            theme === "dark"
              ? "bg-gray-800/50 text-blue-400 border-gray-700 hover:bg-gray-700/60"
              : "bg-white/70 text-blue-600 border-gray-300 hover:bg-gray-200/70"
          )}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="sr-only">Go to Home</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-4 right-4 z-20"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className={clsx(
            "rounded-full backdrop-blur-sm",
            theme === "dark"
              ? "bg-gray-800/50 text-blue-400 border-gray-700 hover:bg-gray-700/60"
              : "bg-white/70 text-blue-600 border-gray-300 hover:bg-gray-200/70"
          )}
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full flex justify-center z-10"
      >
        <Card className={cardClasses}>
          <CardHeader className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <CardTitle
                className={clsx("text-3xl font-bold mb-2", gradientText)}
              >
                {isSignUp ? "Create an Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className={clsx("text-sm", secondaryTextColor)}>
                {isSignUp
                  ? "Join FinBot today and take control of your finances"
                  : "Sign in to continue your financial journey"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "flex items-center gap-2 p-3 rounded-lg text-sm border backdrop-blur-sm",
                  theme === "dark"
                    ? "bg-red-900/30 text-red-300 border-red-800/50"
                    : "bg-red-50 text-red-700 border-red-200"
                )}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-1"
              >
                <Label
                  htmlFor="username"
                  className={clsx("text-sm font-medium", textColor)}
                >
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Enter your username"
                />
              </motion.div>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-1"
                >
                  <Label
                    htmlFor="email"
                    className={clsx("text-sm font-medium", textColor)}
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter your email"
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-1"
              >
                <Label
                  htmlFor="password"
                  className={clsx("text-sm font-medium", textColor)}
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="Enter your password"
                />
              </motion.div>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-1"
                >
                  <Label
                    htmlFor="password2"
                    className={clsx("text-sm font-medium", textColor)}
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="password2"
                    name="password2"
                    type="password"
                    required
                    value={formData.password2}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Confirm your password"
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="pt-2"
              >
                <Button type="submit" className={buttonClasses}>
                  <span className="relative z-10">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </span>
                  <span
                    className={clsx(
                      "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                      theme === "dark"
                        ? "from-white to-white"
                        : "from-white to-white"
                    )}
                  ></span>
                </Button>
              </motion.div>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className={clsx("text-center text-sm", secondaryTextColor)}
            >
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className={clsx(
                  "font-medium hover:underline transition-colors duration-300",
                  theme === "dark"
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-500"
                )}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add this to your global CSS or styles */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 12s ease-in-out infinite 3s;
        }
        .animate-float-delay-2 {
          animation: float 12s ease-in-out infinite 6s;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slow-delay {
          animation: pulse-slow 8s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
