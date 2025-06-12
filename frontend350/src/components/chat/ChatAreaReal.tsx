import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { ChatMessage, defaultChatMessages } from "@/data/ChatMessages";
import { handleChatOperation } from "@/api/ChatApiReal";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { useTablesContent } from "@/context/DataProviderReal";

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

  // useEffect(() => {
  //   // Load chat history on mount
  //   (async () => {
  //     try {
  //       const history = await loadChatHistory();
  //       setMessages(history);
  //     } catch (error) {
  //       console.error("Error loading chat history:", error);
  //     }
  //   })();
  // }, []);

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

    // Add loading bot message
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

      // Remove loading message and add actual response
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));
      setMessages((prev) => [...prev, botMessage]);

      // Start typing effect
      setTimeout(() => {
        startTypingEffect(botMessage.id, botMessage.text);
      }, 300);
    } catch {
      // Remove loading message and show error
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));

      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        text: "Sorry, I encountered an error while processing your request. Please make sure you're logged in and try again.",
        sender: "bot",
        timestamp: new Date(),
        displayedText:
          "Sorry, I encountered an error while processing your request. Please make sure you're logged in and try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`w-full h-full ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className={`p-4 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              AI Finance Assistant
            </h2>
            {selectedTable && (
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  theme === "dark"
                    ? "bg-blue-600 text-blue-100"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                Context: Table {selectedTable}
              </div>
            )}
          </div>
          {!isAuthenticated() && (
            <div
              className={`text-xs mt-2 ${
                theme === "dark" ? "text-yellow-400" : "text-yellow-600"
              }`}
            >
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
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : theme === "dark"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div className="text-sm">
                    {renderMessageContent(message.displayedText || "")}
                    {message.isTyping && (
                      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-gray-400 animate-pulse"></span>
                    )}
                  </div>

                  {/* Show tool information if available */}
                  {message.agentData?.tools_called &&
                    message.agentData.tools_called.length > 0 &&
                    !message.isTyping && (
                      <div
                        className={`text-xs mt-2 p-2 rounded border-l-2 ${
                          theme === "dark"
                            ? "bg-gray-600 border-blue-400 text-gray-300"
                            : "bg-gray-100 border-blue-500 text-gray-600"
                        }`}
                      >
                        <div className="font-medium mb-1">Tools Used:</div>
                        {message.agentData.tools_called.map((tool, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-current rounded-full"></span>
                            <span>{tool.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  <div
                    className={`text-xs mt-1 text-right ${
                      message.sender === "user"
                        ? "text-blue-200"
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
              ? "border-gray-700 bg-gray-700"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <form
            ref={formRef}
            onSubmit={handleSendMessage}
            className="flex gap-2 items-end"
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isAuthenticated()
                  ? "Ask me about your finances, expenses, or table data..."
                  : "Please log in to chat..."
              }
              disabled={!isAuthenticated() || isLoading}
              rows={inputRows}
              className={`flex-1 p-3 rounded-lg resize-none ${
                theme === "dark"
                  ? "bg-gray-600 text-white placeholder-gray-400"
                  : "bg-white text-gray-800 placeholder-gray-500"
              } border ${
                theme === "dark" ? "border-gray-600" : "border-gray-300"
              } focus:outline-none focus:ring-2 ${
                theme === "dark" ? "focus:ring-blue-500" : "focus:ring-blue-400"
              } overflow-y-auto max-h-32 ${
                !isAuthenticated() || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              disabled={
                !isAuthenticated() || isLoading || inputValue.trim() === ""
              }
              className={`px-4 py-2 rounded-lg font-medium h-fit ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } focus:outline-none focus:ring-2 ${
                theme === "dark" ? "focus:ring-blue-500" : "focus:ring-blue-400"
              } disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
