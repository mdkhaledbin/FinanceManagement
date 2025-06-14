// import { TableDataType } from "@/data/table";
// import { JsonTableItem, TableData, TableRow } from "@/data/TableContent";
// import { ChatMessage, defaultChatMessages } from "@/data/ChatMessages"; // Assuming you have this interface defined somewhere
// import { TableDataAction } from "@/reducers/TableReducer";
// import { JsonTableAction } from "@/reducers/TableContentReducer";

// interface TableUpdateOperation {
//   operationType: "UPDATE_TABLES" | "UPDATE_TABLE_CONTENTS";
//   action: {
//     type: string;
//     payload: TableDataAction["payload"] | JsonTableAction["payload"];
//   };
// }

// interface SendPromptResponse {
//   botMessage: ChatMessage;
//   tableUpdates?: TableUpdateOperation[];
// }

// // Fetching chat history
// export async function loadChatHistory(): Promise<ChatMessage[]> {
//   try {
//     const response = await fetch("/api/dummy-chat/messages"); // Dummy URL REAL NEEDED
//     const messages: ChatMessage[] = await response.json();
//     return messages;
//   } catch {
//     // console.error("Failed to load chat history:", error);
//     // throw error;
//     return defaultChatMessages;
//   }
// }

// // Sending a prompt
// export async function sendPrompt(
//   userMessage: ChatMessage,
//   dispatchTablesData: React.Dispatch<TableDataAction>,
//   dispatchtablesContent: React.Dispatch<JsonTableAction>
// ): Promise<{ botMessage: ChatMessage; tableUpdates?: TableUpdateOperation[] }> {
//   try {
//     const response = await fetch("/api/dummy-chat/send", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ userMessage }),
//     });

//     const { botMessage, tableUpdates }: SendPromptResponse =
//       await response.json();

//     // Process table updates if they exist
//     if (tableUpdates && Array.isArray(tableUpdates)) {
//       tableUpdates.forEach((update) => {
//         switch (update.operationType) {
//           case "UPDATE_TABLES": {
//             const { type, payload } = update.action;
//             // Dispatch action with correct payload based on type
//             switch (type) {
//               case "SET_TABLES":
//                 dispatchTablesData({
//                   type,
//                   payload: payload as TableDataType[],
//                 });
//                 break;

//               case "ADD_TABLE":
//                 dispatchTablesData({
//                   type,
//                   payload: payload as {
//                     id: number;
//                     table_name: string;
//                     description: string;
//                   },
//                 });
//                 break;

//               case "EDIT":
//                 dispatchTablesData({
//                   type,
//                   payload: payload as { id: number; table_name: string },
//                 });
//                 break;

//               case "DELETE":
//                 dispatchTablesData({
//                   type,
//                   payload: payload as { id: number },
//                 });
//                 break;

//               case "SHARE":
//                 dispatchTablesData({
//                   type,
//                   payload: payload as { id: number },
//                 });
//                 break;

//               default:
//                 console.warn("Unknown table action type:", type);
//             }
//             break;
//           }

//           case "UPDATE_TABLE_CONTENTS": {
//             const { type, payload } = update.action;
//             switch (type) {
//               case "SET_TABLES":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as JsonTableItem[],
//                 });
//                 break;

//               case "ADD_TABLE":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as { id: number; data: TableData },
//                 });
//                 break;

//               case "ADD_ROW":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as { tableId: number; row: TableRow },
//                 });
//                 break;

//               case "EDIT_ROW":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as {
//                     tableId: number;
//                     rowId: number | string;
//                     newRow: Partial<TableRow>;
//                   },
//                 });
//                 break;

//               case "DELETE_ROW":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as {
//                     tableId: number;
//                     rowId: number | string;
//                   },
//                 });
//                 break;

//               case "EDIT_TABLE_HEADERS":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as { tableId: number; headers: string[] },
//                 });
//                 break;

//               case "DELETE_TABLE":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as { tableId: number },
//                 });
//                 break;

//               case "ADD_COLUMN":
//                 dispatchtablesContent({
//                   type,
//                   payload: payload as { tableId: number; header: string },
//                 });
//                 break;

//               default:
//                 console.warn("Unknown json table action type:", type);
//             }
//             break;
//           }

//           default:
//             console.warn(
//               "Unknown table update operation:",
//               update.operationType
//             );
//         }
//       });
//     }

//     return {
//       botMessage,
//     };
//   } catch (error) {
//     console.error("Failed to send message:", error);
//     // Add error message to UI
//     return {
//       botMessage: {
//         id: Date.now().toString(),
//         text: "Sorry, something went wrong. Please try again.",
//         sender: "bot",
//         timestamp: new Date(),
//         isTyping: false,
//       },
//     };
//   }
// }
