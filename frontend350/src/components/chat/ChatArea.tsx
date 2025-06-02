import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // Modern, clean dark theme
import { ChatMessage } from "@/data/ChatMessages";


const ChatArea = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      displayedText: "Hello! How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up typing effect on unmount
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

  const renderMessageContent = (text: string) => {
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    let match;
    while ((match = codeRegex.exec(text)) !== null) {
      const [fullMatch, lang, code] = match;
      const index = match.index;

      // Add text before the code block
      if (index > lastIndex) {
        const beforeCode = text.substring(lastIndex, index);
        parts.push(
          <div key={lastIndex} className="whitespace-pre-wrap">
            {beforeCode}
          </div>
        );
      }

      // Syntax-highlighted code block
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

    // Add any remaining text after the last code block
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
    const baseSpeed = 20; // Base speed in ms per character
    const minSpeed = 10; // Minimum speed in ms
    const maxSpeed = 40; // Maximum speed in ms

    // Calculate speed based on message length (longer messages type faster)
    const speed = Math.max(
      minSpeed,
      Math.min(maxSpeed, baseSpeed - fullText.length / 10)
    );

    // Clear any existing interval
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim() === "") return;

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

    // Add temporary bot message with typing indicator
    const botResponses = [
      "I understand what you're saying.",
      "That's an interesting point!",
      "Let me think about that...",
      "Thanks for sharing that with me.",
      "Can you tell me more about that?",
      "I'm here to help with any questions you have.",
      `Here's the data you requested along with some additional information:

\`\`\`json
{
  "user": {
    "id": "usr_12345",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en-US"
    }
  },
  "status": "active",
  "last_login": "2023-11-15T08:30:45Z",
  "account_type": "premium"
}
\`\`\`

Let me know if you'd like me to explain any part of this data or if you need it in a different format.`,
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Odit eum animi temporibus ad sunt asperiores, iste accusamus, magni quo suscipit fuga modi, ipsa dolores doloremque ullam error. Porro, reprehenderit voluptate. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi ullam nemo, quidem illum, asperiores explicabo esse velit fugit, quaerat repellat ratione tempora! Odio, neque? Accusamus exercitationem beatae temporibus quas sed. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti ea, labore assumenda magnam distinctio voluptas hic, dolore ipsum recusandae sunt a animi ut quod maiores nisi ducimus saepe facere exercitationem? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsum tempora perferendis quia praesentium aperiam expedita voluptatem odio magnam enim hic, facere similique quis cum ut maxime quod laboriosam consequuntur vitae. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ducimus quidem earum ipsam perspiciatis excepturi velit possimus voluptate blanditiis porro eum sint, atque consequuntur cum iure tenetur nostrum repellendus? Amet, inventore. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Beatae iste magni iure labore quasi atque veritatis, repellat unde odio consectetur, ducimus hic quae nobis. Quis rem distinctio a quae modi!",
    ];

    const botMessageText =
      botResponses[Math.floor(Math.random() * botResponses.length)];
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: botMessageText,
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
      displayedText: "",
    };

    setMessages((prev) => [...prev, botMessage]);

    // Start typing effect after a short delay
    setTimeout(() => {
      startTypingEffect(botMessage.id, botMessageText);
    }, 500);
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
        {/* Chat header */}
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

        {/* Chat messages area */}
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

        {/* Chat input */}
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
