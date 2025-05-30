export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface TableData {
  headers: string[];
  rows: TableRow[];
}

export interface JsonTableItem {
  id: number;
  data: TableData;
}

type JsonTableData = JsonTableItem[];

const jsonTableData: JsonTableData = [
  {
    id: 1,
    data: {
      headers: ["id", "title", "content", "user_id", "created_at"],
      rows: [
        {
          id: 1,
          title: "First Post",
          content: "Hello world!",
          user_id: 1,
          created_at: "2025-05-01T10:00:00Z",
        },
        {
          id: 2,
          title: "Second Post",
          content: "Another update",
          user_id: 1,
          created_at: "2025-05-01T10:30:00Z",
        },
      ],
    },
  },
  {
    id: 2,
    data: {
      headers: ["id", "post_id", "comment", "user_id", "created_at"],
      rows: [
        {
          id: 1,
          post_id: 1,
          comment: "Nice post!",
          user_id: 2,
          created_at: "2025-05-01T10:35:00Z",
        },
        {
          id: 2,
          post_id: 2,
          comment: "Thanks for sharing!",
          user_id: 3,
          created_at: "2025-05-01T10:40:00Z",
        },
      ],
    },
  },
  {
    id: 3,
    data: {
      headers: ["id", "user_id", "post_id"],
      rows: [
        { id: 1, user_id: 2, post_id: 1 },
        { id: 2, user_id: 3, post_id: 1 },
      ],
    },
  },
  {
    id: 4,
    data: {
      headers: ["id", "sender_id", "receiver_id", "message", "sent_at"],
      rows: [
        {
          id: 1,
          sender_id: 1,
          receiver_id: 2,
          message: "Hey!",
          sent_at: "2025-05-01T10:30:00Z",
        },
        {
          id: 2,
          sender_id: 2,
          receiver_id: 1,
          message: "Hi there!",
          sent_at: "2025-05-01T10:31:00Z",
        },
      ],
    },
  },
  {
    id: 5,
    data: {
      headers: ["id", "user_id", "bio", "profile_picture"],
      rows: [
        {
          id: 1,
          user_id: 1,
          bio: "I love coding",
          profile_picture: "pic1.jpg",
        },
      ],
    },
  },
  {
    id: 6,
    data: {
      headers: ["id", "user_id", "type", "content"],
      rows: [
        { id: 1, user_id: 2, type: "like", content: "Post liked by user" },
      ],
    },
  },
  {
    id: 7,
    data: {
      headers: ["id", "follower_id", "followed_id"],
      rows: [
        { id: 1, follower_id: 1, followed_id: 2 },
        { id: 2, follower_id: 2, followed_id: 3 },
      ],
    },
  },
  {
    id: 8,
    data: {
      headers: ["id", "user_id", "following_id"],
      rows: [{ id: 1, user_id: 4, following_id: 1 }],
    },
  },
  {
    id: 9,
    data: {
      headers: ["id", "user_id", "theme", "notifications_enabled"],
      rows: [{ id: 1, user_id: 1, theme: "dark", notifications_enabled: true }],
    },
  },
  {
    id: 10,
    data: {
      headers: ["id", "user_id", "file_name", "file_type"],
      rows: [
        { id: 1, user_id: 2, file_name: "profile.png", file_type: "image/png" },
      ],
    },
  },
  {
    id: 11,
    data: {
      headers: ["id", "user_id", "album_name"],
      rows: [{ id: 1, user_id: 3, album_name: "Vacation 2025" }],
    },
  },
  {
    id: 12,
    data: {
      headers: ["id", "tag_name"],
      rows: [
        { id: 1, tag_name: "travel" },
        { id: 2, tag_name: "coding" },
      ],
    },
  },
  {
    id: 13,
    data: {
      headers: ["id", "user_id", "mention_user_id", "context"],
      rows: [{ id: 1, user_id: 1, mention_user_id: 2, context: "Post #5" }],
    },
  },
  {
    id: 14,
    data: {
      headers: ["id", "user_id", "story_text", "created_at"],
      rows: [
        {
          id: 1,
          user_id: 2,
          story_text: "Check out my new project!",
          created_at: "2025-05-01T12:15:00Z",
        },
      ],
    },
  },
  {
    id: 15,
    data: {
      headers: ["id", "user_id", "reaction_type", "target_id"],
      rows: [{ id: 1, user_id: 3, reaction_type: "like", target_id: 5 }],
    },
  },
  {
    id: 16,
    data: {
      headers: ["id", "user_id", "viewed_item", "viewed_at"],
      rows: [
        {
          id: 1,
          user_id: 4,
          viewed_item: "post_10",
          viewed_at: "2025-05-01T12:35:00Z",
        },
      ],
    },
  },
  {
    id: 17,
    data: {
      headers: ["id", "user_id", "content_id", "shared_at"],
      rows: [
        { id: 1, user_id: 1, content_id: 2, shared_at: "2025-05-01T12:45:00Z" },
      ],
    },
  },
  {
    id: 18,
    data: {
      headers: ["id", "user_id", "item_type", "item_id"],
      rows: [{ id: 1, user_id: 2, item_type: "post", item_id: 4 }],
    },
  },
  {
    id: 19,
    data: {
      headers: ["id", "user_id", "plan", "subscribed_at"],
      rows: [
        {
          id: 1,
          user_id: 3,
          plan: "Premium",
          subscribed_at: "2025-05-01T13:00:00Z",
        },
      ],
    },
  },
  {
    id: 20,
    data: {
      headers: ["id", "user_id", "amount", "payment_date"],
      rows: [
        {
          id: 1,
          user_id: 4,
          amount: 29.99,
          payment_date: "2025-05-01T13:10:00Z",
        },
      ],
    },
  },
  {
    id: 21,
    data: {
      headers: ["id", "user_id", "total", "issued_at"],
      rows: [
        { id: 1, user_id: 1, total: 100.0, issued_at: "2025-05-01T13:20:00Z" },
      ],
    },
  },
  {
    id: 22,
    data: {
      headers: ["id", "user_id", "transaction_type", "amount", "status"],
      rows: [
        {
          id: 1,
          user_id: 2,
          transaction_type: "debit",
          amount: 49.99,
          status: "completed",
        },
      ],
    },
  },
  {
    id: 23,
    data: {
      headers: ["id", "user_id", "balance", "last_updated"],
      rows: [
        {
          id: 1,
          user_id: 3,
          balance: 150.75,
          last_updated: "2025-05-01T13:40:00Z",
        },
      ],
    },
  },
  {
    id: 24,
    data: {
      headers: ["id", "user_id", "notification", "archived_at"],
      rows: [
        {
          id: 1,
          user_id: 4,
          notification: "You have a new follower",
          archived_at: "2025-05-01T13:50:00Z",
        },
      ],
    },
  },
  {
    id: 25,
    data: {
      headers: ["id", "user_id", "action", "timestamp"],
      rows: [
        {
          id: 1,
          user_id: 1,
          action: "Login",
          timestamp: "2025-05-01T14:00:00Z",
        },
      ],
    },
  },
];

const getAllTableContents = () => {
  return jsonTableData;
};

export { getAllTableContents };
