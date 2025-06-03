"use client";

import { useState } from "react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SunIcon, MoonIcon } from "lucide-react";
import { ThemeProvider, useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import { DataProvider } from "@/context/DataProvider";
import { SelectedTableProvider } from "@/context/SelectedTableProvider";

const SignInForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Form submitted", { isSignUp, theme });
    setTimeout(() => setLoading(false), 2000);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetEmailSent(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetEmailSent(false);
      setResetEmail("");
    }, 2500);
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
                • Smart budget tracking<br />
                • Conversational chatbot for finance help<br />
                • Real-time analytics & personalized insights<br />
                • Cross-device sync & AI reminders<br />
                • Military-grade data protection
              </PopoverContent>
            </Popover>
          )}
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
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
                className={clsx(
                  "w-full font-semibold py-3 rounded-lg",
                  theme === "dark"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {resetEmailSent ? "Email Sent!" : "Send Reset Link"}
              </Button>
              <p
                className={clsx(
                  "text-center text-sm",
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
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
              {isSignUp && (
                <div>
                  <Label
                    htmlFor="name"
                    className={clsx(
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    required
                    className={clsx(
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : ""
                    )}
                  />
                </div>
              )}
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
                  type="email"
                  required
                  className={clsx(
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : ""
                  )}
                />
              </div>
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
                  type="password"
                  required
                  className={clsx(
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : ""
                  )}
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
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
                    onClick={() => setShowForgotPassword(true)}
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
              {isSignUp
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className={clsx(
                  "font-semibold hover:underline",
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                )}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SignInPage = () => (
  <ThemeProvider>
    <DataProvider>
      <SelectedTableProvider>
        <SignInForm />
      </SelectedTableProvider>
    </DataProvider>
  </ThemeProvider>
);

export default SignInPage;
