"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SunIcon, MoonIcon, AlertCircle } from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeProvider";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import { authApi } from "@/api/AuthApi";
import clsx from "clsx";
import { DataProvider } from "@/context/DataProvider";
import { SelectedTableProvider } from "@/context/SelectedTableProvider";

const SignInForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    rememberMe: false,
  });

  const { theme, toggleTheme } = useTheme();
  const { signIn, signUp, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/Chat");
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        // Sign Up
        if (!formData.username.trim()) {
          setError("Username is required");
          return;
        }

        if (formData.password !== formData.password2) {
          setError("Passwords do not match");
          return;
        }

        const result = await signUp(
          formData.username,
          formData.email,
          formData.password,
          formData.password2
        );

        if (result.success) {
          router.push("/Chat");
        } else {
          setError(result.error || "Sign up failed");
        }
      } else {
        // Sign In
        const result = await signIn(formData.username, formData.password);

        if (result.success) {
          router.push("/Chat");
        } else {
          setError(result.error || "Sign in failed");
        }
      }
    } catch (error) {
      console.error("❌ Form submission error:", error);
      setError("An unexpected error occurred during form submission");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!resetEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      const response = await authApi.resetPassword(resetEmail);

      if (response.success) {
        setResetEmailSent(true);
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmailSent(false);
          setResetEmail("");
        }, 3000);
      } else {
        setError(response.error || "Password reset failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

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

      <Card
        className={clsx(
          "w-full max-w-md rounded-2xl shadow-xl transition-colors",
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
        )}
      >
        <CardHeader className="text-center">
          <CardTitle
            className={clsx(
              "text-3xl font-bold",
              theme === "dark" ? "text-white" : "text-gray-800"
            )}
          >
            {showForgotPassword
              ? "Reset Password"
              : isSignUp
              ? "Create an Account"
              : "Welcome Back"}
          </CardTitle>

          <CardDescription
            className={clsx(
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            {showForgotPassword
              ? "Enter your email to reset your password"
              : isSignUp
              ? "Join FinBot today!"
              : "Sign in to continue to FinBot"}
          </CardDescription>

          {!showForgotPassword && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="link"
                  className={clsx(
                    "text-sm underline mt-2",
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  )}
                >
                  What can FinBot do?
                </Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm max-w-sm">
                • Smart budget tracking
                <br />
                • Conversational chatbot for finance help
                <br />
                • Real-time analytics & personalized insights
                <br />
                • Cross-device sync & AI reminders
                <br />• Military-grade data protection
              </PopoverContent>
            </Popover>
          )}
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div
              className={clsx(
                "flex items-center gap-2 p-3 rounded-lg",
                theme === "dark"
                  ? "bg-red-900/20 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              )}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {showForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div>
                <Label
                  htmlFor="reset-email"
                  className={clsx(
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={clsx(
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : ""
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className={clsx(
                  "w-full font-semibold py-3 rounded-lg",
                  theme === "dark"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {resetEmailSent
                  ? "Email Sent!"
                  : loading
                  ? "Sending..."
                  : "Send Reset Link"}
              </Button>
              <p
                className={clsx(
                  "text-center text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError("");
                  }}
                  className={clsx(
                    "font-semibold hover:underline",
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  )}
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username field - always show */}
              <div>
                <Label
                  htmlFor="username"
                  className={clsx(
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
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
                  className={clsx(
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : ""
                  )}
                />
              </div>

              {/* Email field - only for signup */}
              {isSignUp && (
                <div>
                  <Label
                    htmlFor="email"
                    className={clsx(
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    )}
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
                    className={clsx(
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : ""
                    )}
                  />
                </div>
              )}

              {/* Password field */}
              <div>
                <Label
                  htmlFor="password"
                  className={clsx(
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
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
                  className={clsx(
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : ""
                  )}
                />
              </div>

              {/* Confirm password - only for signup */}
              {isSignUp && (
                <div>
                  <Label
                    htmlFor="password2"
                    className={clsx(
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    )}
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
                    className={clsx(
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : ""
                    )}
                  />
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          rememberMe: !!checked,
                        }))
                      }
                    />
                    <Label
                      htmlFor="remember"
                      className={clsx(
                        "text-sm",
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                    }}
                    className={clsx(
                      "text-sm hover:underline",
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    )}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={clsx(
                  "w-full font-semibold py-3 rounded-lg",
                  theme === "dark"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
          )}

          {!showForgotPassword && (
            <p
              className={clsx(
                "text-center text-sm mt-6",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    password2: "",
                    rememberMe: false,
                  });
                }}
                className={clsx(
                  "font-semibold hover:underline",
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                )}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          )}

          {/* Demo Credentials Info */}
          {!showForgotPassword && (
            <div
              className={clsx(
                "mt-4 p-3 rounded-lg text-xs",
                theme === "dark"
                  ? "bg-gray-700/50 text-gray-400"
                  : "bg-gray-50 text-gray-600"
              )}
            >
              <strong>Demo Credentials:</strong>
              <br />
              Username: khaled
              <br />
              Password: Khaledd@55
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SignInPage = () => (
  <ThemeProvider>
    <AuthProvider>
      <DataProvider>
        <SelectedTableProvider>
          <SignInForm />
        </SelectedTableProvider>
      </DataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default SignInPage;
