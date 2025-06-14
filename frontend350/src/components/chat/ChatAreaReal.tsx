import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { ChatMessage, defaultChatMessages } from "@/data/ChatMessages";
import { handleChatOperation, chatApi } from "@/api/ChatApiReal";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { useTablesContent } from "@/context/DataProviderReal";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

// declare global {
//   interface Window {
//     SpeechRecognition: any;
//     webkitSpeechRecognition: any;
//   }
// }

const ChatArea = () => {
  const { theme } = useTheme();
  const { selectedTable } = useSelectedTable();
  const { refreshData } = useTablesContent();
  const [messages, setMessages] = useState<ChatMessage[]>(defaultChatMessages);
  const [inputValue, setInputValue] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    // Load chat history on mount
    (async () => {
      try {
        const response = await chatApi.loadChatHistory();
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    })();
  }, []);

  const isAuthenticated = () => {
    return !!localStorage.getItem("user");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const lineCount = e.target.value.split("\n").length;
    setInputRows(Math.min(Math.max(lineCount, 1), 5));
  };

  const renderMessageContent = (text: string) => {
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      const [fullMatch, lang, code] = match;
      const index = match.index;

      if (index > lastIndex) {
        const beforeCode = text.substring(lastIndex, index);
        parts.push(
          <div key={lastIndex} className="whitespace-pre-wrap">
            {beforeCode}
          </div>
        );
      }

      const highlightedCode = hljs.highlightAuto(
        code,
        lang ? [lang] : undefined
      ).value;

      parts.push(
        <pre
          key={index}
          className="rounded-lg overflow-auto p-3 bg-gray-900 text-white text-xs mt-2"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        ></pre>
      );

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      const afterCode = text.substring(lastIndex);
      parts.push(
        <div key={lastIndex} className="whitespace-pre-wrap">
          {afterCode}
        </div>
      );
    }

    return parts;
  };

  const startTypingEffect = (messageId: string, fullText: string) => {
    let currentIndex = 0;
    const baseSpeed = 15;
    const minSpeed = 8;
    const maxSpeed = 25;
    const speed = Math.max(
      minSpeed,
      Math.min(maxSpeed, baseSpeed - fullText.length / 20)
    );

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // Set initial state
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            displayedText: "",
            isTyping: true,
          };
        }
        return msg;
      })
    );

    typingIntervalRef.current = setInterval(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            const newDisplayedText = fullText.substring(0, currentIndex + 1);
            currentIndex++;
            if (currentIndex >= fullText.length && typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
              return {
                ...msg,
                displayedText: newDisplayedText,
                isTyping: false,
              };
            }
            return { ...msg, displayedText: newDisplayedText, isTyping: true };
          }
          return msg;
        })
      );

      scrollToBottom();
    }, speed);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim() === "" || isLoading) return;

    // Check authentication
    if (!isAuthenticated()) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Please log in to use the chat feature.",
        sender: "bot",
        timestamp: new Date(),
        displayedText: "Please log in to use the chat feature.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
      displayedText: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setInputRows(1);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "🤔 Thinking...",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
      displayedText: "🤔 Thinking...",
    };

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call the agent streaming endpoint with refreshData callback
      const botMessage = await handleChatOperation(
        userMessage,
        selectedTable?.toString(),
        refreshData
      );

      if (!botMessage) {
        throw new Error("No response received from the bot");
      }

      // Remove loading message and add bot message
      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (msg) => msg.id !== loadingMessage.id
        );
        return [...filteredMessages, botMessage];
      });

      // Start typing effect
      startTypingEffect(botMessage.id, botMessage.text);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      // Remove loading message and show error
      setMessages((prev) => {
        const filteredMessages = prev.filter(
          (msg) => msg.id !== loadingMessage.id
        );
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          text: "Sorry, I encountered an error while processing your request. Please try again.",
          sender: "bot",
          timestamp: new Date(),
          displayedText:
            "Sorry, I encountered an error while processing your request. Please try again.",
        };
        return [...filteredMessages, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Update input value when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleVoiceInput = () => {
    if (!isOnline) {
      alert("ভয়েস রেকগনিশন অফলাইন মোডে উপলব্ধ নয়।");
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      alert("আপনার ব্রাউজার ভয়েস রেকগনিশন সাপোর্ট করে না।");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({
        continuous: true,
        language: selectedLanguage,
      });
    }
  };

  const toggleLanguage = () => {
    setSelectedLanguage((prev) => (prev === "en-US" ? "bn-BD" : "en-US"));
    if (listening) {
      SpeechRecognition.stopListening();
    }
  };

  return (
    <div
      className={`w-full h-full transition-colors duration-500 ease-in-out ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      } z-2000`}
    >
      <div className="h-full flex flex-col pt-[8%] lg:pt-[17%] xl:pt-[13%]">
        {/* Header */}
        <div
          className={`p-4 border-b ${
            theme === "dark"
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-white"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-blue-600" : "bg-blue-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
              >
                AI Finance Assistant
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {selectedTable && (
                <div
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    theme === "dark"
                      ? "bg-blue-900/60 text-blue-100 border border-blue-800"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  Context: Table {selectedTable}
                </div>
              )}
              <button
                onClick={async () => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear the chat history?"
                    )
                  ) {
                    const response = await chatApi.clearChatHistory();
                    if (response.success) {
                      setMessages(defaultChatMessages);
                    }
                  }
                }}
                className={`p-2 rounded-lg transition-colors duration-500 ease-in-out ${
                  theme === "dark"
                    ? "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100/80 hover:bg-gray-200 text-gray-700"
                }`}
                aria-label="Clear chat history"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          {!isAuthenticated() && (
            <div
              className={`flex items-center text-xs mt-2 ${
                theme === "dark" ? "text-amber-400" : "text-amber-600"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                  clipRule="evenodd"
                />
              </svg>
              Please log in to use chat features
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                    message.sender === "user"
                      ? theme === "dark"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-gray-50 ring-2 ring-blue-500/30"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-400/30"
                      : theme === "dark"
                      ? "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-100 ring-2 ring-gray-700/30"
                      : "bg-gradient-to-r from-white to-gray-50 text-gray-800 ring-2 ring-gray-200/30"
                  } shadow-sm font-['Inter']`}
                >
                  <div className="text-lg">
                    {renderMessageContent(message.displayedText || "")}
                    {message.isTyping && (
                      <span className="ml-1 inline-flex space-x-1">
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></span>
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse delay-75"></span>
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse delay-150"></span>
                      </span>
                    )}
                  </div>

                  {/* Show tool information if available */}
                  {message.agentData?.tools_called &&
                    message.agentData.tools_called.length > 0 &&
                    !message.isTyping && (
                      <div
                        className={`text-xs mt-2 p-2 rounded ${
                          theme === "dark"
                            ? "bg-gray-700/50 text-gray-300 border-l-2 border-blue-500"
                            : "bg-gray-100 text-gray-700 border-l-2 border-blue-400"
                        }`}
                      >
                        <div className="font-medium mb-1 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Tools Used
                        </div>
                        {message.agentData.tools_called.map((tool, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 mt-1"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                theme === "dark" ? "bg-blue-400" : "bg-blue-500"
                              }`}
                            ></span>
                            <span className="font-mono">{tool.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  <div
                    className={`text-xs mt-1 text-right ${
                      message.sender === "user"
                        ? theme === "dark"
                          ? "text-blue-200"
                          : "text-blue-100"
                        : theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div
          className={`p-4 border-t ${
            theme === "dark"
              ? "border-gray-800 bg-gradient-to-t from-gray-900 to-gray-950"
              : "border-gray-200 bg-gradient-to-t from-white to-gray-50"
          } shadow-sm`}
        >
          {!isOnline && (
            <div
              className={`mb-3 p-2 text-sm rounded flex items-center ${
                theme === "dark"
                  ? "bg-gray-800 text-amber-300 border border-gray-700"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                {selectedLanguage === "en-US"
                  ? "You're currently offline. Some features may be limited."
                  : "আপনি বর্তমানে অফলাইন মোডে আছেন। কিছু ফিচার সীমিত থাকতে পারে।"}
              </span>
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={handleSendMessage}
            className="flex flex-col gap-3 mb-10"
          >
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAuthenticated()
                    ? selectedLanguage === "en-US"
                      ? "Ask me about your finances, expenses, or table data..."
                      : "আপনার আর্থিক বিষয়, খরচ, বা টেবিল ডেটা সম্পর্কে জিজ্ঞাসা করুন..."
                    : "Please log in to chat..."
                }
                disabled={!isAuthenticated() || isLoading}
                rows={inputRows}
                className={`flex-1 p-3 rounded-lg resize-none transition-all duration-500 ease-in-out font-['Inter'] ${
                  theme === "dark"
                    ? "bg-gray-800/50 text-gray-100 placeholder-gray-400 border-gray-700 focus:border-blue-500"
                    : "bg-white/80 text-gray-800 placeholder-gray-500 border-gray-300 focus:border-blue-400"
                } border focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "focus:ring-blue-500/30"
                    : "focus:ring-blue-400/30"
                } overflow-y-auto max-h-40 ${
                  !isAuthenticated() || isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                style={{ minHeight: "60px" }}
              />

              <div className="flex gap-2 mb-1 w-full sm:w-auto justify-end">
                {/* Language Toggle Button */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={`p-2 rounded-lg h-fit transition-colors duration-500 ease-in-out ${
                    theme === "dark"
                      ? "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
                      : "bg-gray-100/80 hover:bg-gray-200 text-gray-700"
                  }`}
                  aria-label="Toggle language"
                >
                  {selectedLanguage === "en-US" ? (
                    <span className="text-xs font-medium">বাংলা</span>
                  ) : (
                    <span className="text-xs font-medium">EN</span>
                  )}
                </button>

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={
                    !isOnline ||
                    !isAuthenticated() ||
                    !browserSupportsSpeechRecognition
                  }
                  className={`p-2 rounded-lg h-fit transition-colors duration-500 ease-in-out ${
                    theme === "dark"
                      ? listening
                        ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                        : "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
                      : listening
                      ? "bg-red-100 hover:bg-red-200 text-red-600"
                      : "bg-gray-100/80 hover:bg-gray-200 text-gray-700"
                  } ${
                    !isOnline ||
                    !isAuthenticated() ||
                    !browserSupportsSpeechRecognition
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  aria-label="Voice input"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <button
                  type="submit"
                  disabled={
                    !isAuthenticated() || isLoading || inputValue.trim() === ""
                  }
                  className={`p-2 rounded-lg h-fit transition-colors duration-500 ease-in-out ${
                    theme === "dark"
                      ? "bg-blue-600/90 hover:bg-blue-500 text-white"
                      : "bg-blue-500/90 hover:bg-blue-400 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                  aria-label="Send message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Disclaimer text */}
            <div
              className={`text-xs mt-1 pb-2 px-1 text-center ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <p>
                {selectedLanguage === "en-US"
                  ? "AI may produce inaccurate information. All content is protected by copyright."
                  : "AI ভুল তথ্য দিতে পারে। সমস্ত কন্টেন্ট কপিরাইট দ্বারা সুরক্ষিত।"}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
