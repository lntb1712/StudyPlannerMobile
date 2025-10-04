import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { MessagingRequestDTO } from "../../domain/entities/MessagingDTO/MessagingRequestDTO";
import { MessagingResponseDTO } from "../../domain/entities/MessagingDTO/MessagingResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";
import { AccountManagementResponseDTO } from "../../domain/entities/AccountManagementDTO/AccountManagementResponseDTO";

interface MessagingState {
  messages: MessagingResponseDTO[]; // Global for list; overridden by conversation
  selectedMessage: MessagingResponseDTO | null;
  relationships: AccountManagementResponseDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagingState = {
  messages: [],
  selectedMessage: null,
  relationships: [],
  loading: false,
  error: null,
};

// 🟢 Get conversation (overrides global messages)
export const getConversation = createAsyncThunk(
  "messaging/getConversation",
  async (
    { senderId, receiverId }: { senderId: string; receiverId: string },
    { rejectWithValue }
  ) => {
    try {
      const rawResponse = await http.get(
        `/Messaging/GetConversation?senderId=${senderId}&receiverId=${receiverId}`
      );
      const apiResponse = ApiResponse.fromJson<MessagingResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được cuộc trò chuyện"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getConversation error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

export const getRelationship = createAsyncThunk(
  "messaging/getRelationship",
  async (
    { userId }: { userId: string; },
    { rejectWithValue }
  ) => {
    try {
      const rawResponse = await http.get(
        `/Messaging/GetAllRelationship?userId=${userId}`
      );
      const apiResponse = ApiResponse.fromJson<AccountManagementResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được mối quan hệ"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getRelationship error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Get all messages by user (for list previews)
export const getMessages = createAsyncThunk(
  "messaging/getMessages",
  async (userId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Messaging/GetAllMessagesByUser?userId=${userId}`);
      const apiResponse = ApiResponse.fromJson<MessagingResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Không lấy được danh sách tin nhắn của người dùng");
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getMessages error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Send message (appends to global; chat refetches for accuracy)
export const sendMessage = createAsyncThunk(
  "messaging/sendMessage",
  async (payload: MessagingRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Messaging/SendMessage", payload);
      const apiResponse = ApiResponse.fromJson<MessagingResponseDTO>(
        rawResponse,
        (data) => data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Gửi tin nhắn thất bại");
      }

      return apiResponse.data;
    } catch (error: any) {
      console.error("sendMessage error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Mark as read
export const markAsRead = createAsyncThunk(
  "messaging/markAsRead",
  async (messageId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put(`/Messaging/MarkAsRead?messageId=${messageId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Đánh dấu đã đọc thất bại");
      }

      return messageId;
    } catch (error: any) {
      console.error("markAsRead error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete message
export const deleteMessage = createAsyncThunk(
  "messaging/deleteMessage",
  async (messageId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(`/Messaging/DeleteMessage?messageId=${messageId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa tin nhắn thất bại");
      }

      return messageId;
    } catch (error: any) {
      console.error("deleteMessage error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const messagingSlice = createSlice({
  name: "messaging",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMessage: (state, action: PayloadAction<MessagingResponseDTO | null>) => {
      state.selectedMessage = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.selectedMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get conversation (overrides messages for chat)
      .addCase(getConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = (action.payload || []).filter((m) => m && m.MessageId > 0);
        state.error = null;
      })
      .addCase(getConversation.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy cuộc trò chuyện thất bại";
      })

      // Get relationship
      .addCase(getRelationship.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRelationship.fulfilled, (state, action) => {
        state.loading = false;
        state.relationships = action.payload || [];
        state.error = null;
      })
      .addCase(getRelationship.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy mối quan hệ thất bại";
      })

      // Get messages (for list)
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = (action.payload || []).filter((m) => m && m.MessageId > 0);
        state.error = null;
      })
      .addCase(getMessages.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách tin nhắn của người dùng thất bại";
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.messages.push(action.payload);
        }
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Gửi tin nhắn thất bại";
      })

      // Mark as read
      .addCase(markAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const messageId = action.payload;
        state.messages = state.messages.map((m) =>
          m.MessageId === messageId ? { ...m, IsRead: true } : m
        );
        state.error = null;
      })
      .addCase(markAsRead.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Đánh dấu đã đọc thất bại";
      })

      // Delete message
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const messageId = action.payload;
        state.messages = state.messages.filter((m) => m.MessageId !== messageId);
        if (state.selectedMessage?.MessageId === messageId) {
          state.selectedMessage = null;
        }
        state.error = null;
      })
      .addCase(deleteMessage.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa tin nhắn thất bại";
      });
  },
});

export const { clearError, setSelectedMessage, clearMessages } = messagingSlice.actions;
export default messagingSlice.reducer;