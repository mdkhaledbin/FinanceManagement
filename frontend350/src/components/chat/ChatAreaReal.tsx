import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { ChatMessage, defaultChatMessages } from "@/data/ChatMessages";
import { sendPrompt, loadChatHistory } from "@/api/ChatApi";
import { useTablesContent, useTablesData } from "@/context/DataProviderReal";

const ChatArea = () => {
  const { theme } = useTheme();
  const { dispatchtablesContent } = useTablesContent();
  const { dispatchTablesData } = useTablesData();
  const [messages, setMessages] = useState<ChatMessage[]>(defaultChatMessages);
  const [inputValue, setInputValue] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load chat history on mount
    (async () => {
      try {
        const history = await loadChatHistory();
        setMessages(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    })();
  }, []);

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
    const baseSpeed = 20;
    const minSpeed = 10;
    const maxSpeed = 40;
    const speed = Math.max(
      minSpeed,
      Math.min(maxSpeed, baseSpeed - fullText.length / 10)
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

    if (inputValue.trim() === "") return;

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

    try {
      const { botMessage } = await sendPrompt(
        userMessage,
        dispatchTablesData,
        dispatchtablesContent
      );

      setMessages((prev) => [...prev, { ...botMessage, isTyping: true }]);

      // Start typing effect
      startTypingEffect(botMessage.id, botMessage.text);
    } catch (error) {
      console.error("Failed to send prompt:", error);

      const FailedMessage: ChatMessage = {
        id: Math.random().toString(),
        text: "Sorry, something went wrong. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        isTyping: false,
      };

      setMessages((prev) => [...prev, FailedMessage]);
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
          <h2
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Chat
          </h2>
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
              placeholder="Type a message..."
              rows={inputRows}
              className={`flex-1 p-3 rounded-lg resize-none ${
                theme === "dark"
                  ? "bg-gray-600 text-white placeholder-gray-400"
                  : "bg-white text-gray-800 placeholder-gray-500"
              } border ${
                theme === "dark" ? "border-gray-600" : "border-gray-300"
              } focus:outline-none focus:ring-2 ${
                theme === "dark" ? "focus:ring-blue-500" : "focus:ring-blue-400"
              } overflow-y-auto max-h-32`}
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-medium h-fit ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } focus:outline-none focus:ring-2 ${
                theme === "dark" ? "focus:ring-blue-500" : "focus:ring-blue-400"
              }`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
