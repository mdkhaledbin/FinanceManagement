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
import { SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import { registerUser, loginUser } from "../../api/AuthApi";
import { useUser } from "@/context/AuthProvider";

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
        // Validation: check passwords match
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
        await loginUser({
          username: formData.username,
          password: formData.password,
        });
      }

      await refreshUser();
      // Redirect after login/signup
      router.push("/chat");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "An unexpected error occurred";
      console.log(err);

      setError(errorMessage);
    }
  };

  const cardClasses = clsx(
    "w-full max-w-md rounded-2xl shadow-xl transition-colors",
    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
  );
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const secondaryTextColor =
    theme === "dark" ? "text-gray-400" : "text-gray-600";
  const inputClasses =
    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "";
  const buttonClasses = clsx(
    "w-full font-semibold py-3 rounded-lg",
    theme === "dark"
      ? "bg-blue-500 hover:bg-blue-600"
      : "bg-blue-600 hover:bg-blue-700",
    "text-white"
  );

  return (
    <div
      className={clsx(
        "min-h-screen flex items-center justify-center p-4 transition-colors duration-300",
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-gray-100 to-blue-50"
      )}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className={clsx(
            theme === "dark"
              ? "text-yellow-400 border-gray-700 hover:bg-gray-800"
              : "text-blue-600 border-gray-300 hover:bg-gray-200"
          )}
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <Card className={cardClasses}>
        <CardHeader className="text-center">
          <CardTitle className={clsx("text-3xl font-bold", textColor)}>
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className={secondaryTextColor}>
            {isSignUp ? "Join FinBot today!" : "Sign in to continue to FinBot"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {error && (
            <div
              className={clsx(
                "flex items-center gap-2 p-3 rounded-lg text-sm",
                theme === "dark"
                  ? "bg-red-900/20 text-red-300"
                  : "bg-red-50 text-red-700"
              )}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className={textColor}>
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
              />
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="email" className={textColor}>
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
                />
              </div>
            )}

            <div>
              <Label htmlFor="password" className={textColor}>
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
              />
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="password2" className={textColor}>
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
                />
              </div>
            )}

            {/* {!isSignUp && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, rememberMe: !!checked }))
                  }
                />
                <Label
                  htmlFor="remember"
                  className={clsx("text-sm", secondaryTextColor)}
                >
                  Remember me
                </Label>
              </div>
            )} */}

            <Button type="submit" className={buttonClasses}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <p className={clsx("text-center text-sm", secondaryTextColor)}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className={clsx(
                "font-semibold hover:underline",
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              )}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
