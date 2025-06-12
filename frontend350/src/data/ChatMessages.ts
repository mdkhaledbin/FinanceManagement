// Type definition for a chat message
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isTyping?: boolean;
  displayedText?: string;
  agentData?: {
    response: string;
    tools_called: Array<{
      name: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: Record<string, any>;
    }>;
    streaming_info?: {
      tool_operations: Array<{
        step: number;
        tool_name: string;
        tool_type: string;
        operation: string;
        status: string;
        timestamp: string;
      }>;
      status: string;
    };
  };
}

// Default chat messages
export const defaultChatMessages: ChatMessage[] = [
  {
    id: "1",
    text: "Hello! How can I help you today?",
    displayedText: "Hello! How can I help you today?",
    sender: "bot",
    timestamp: new Date()
  },
  {
    id: "2",
    text: "I’d like to see the latest table updates.",
    displayedText: "I’d like to see the latest table updates.",
    sender: "user",
    timestamp: new Date()
  },
  {
    id: "3",
    text: "Sure! Here are the most recent table updates:",
    displayedText: "Sure! Here are the most recent table updates:",
    sender: "bot",
    timestamp: new Date()
  }
];
