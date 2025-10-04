import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { NotificationRequestDTO } from "../../domain/entities/NotificationDTO/NotificationRequestDTO";
import { NotificationResponseDTO } from "../../domain/entities/NotificationDTO/NotificationResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";

interface NotificationState {
  notifications: NotificationResponseDTO[];
  selectedNotification: NotificationResponseDTO | null;
  unreadCount: number;
  loading: boolean;  // Có thể tách thành object { get: boolean, add: boolean, ... } nếu cần
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  selectedNotification: null,
  unreadCount: 0,
  loading: false,
  error: null,
};

// Helper: Map RequestDTO sang ResponseDTO (giả sử NotificationId được generate client-side hoặc từ payload)
const mapToResponseDTO = (request: NotificationRequestDTO): NotificationResponseDTO => ({
  NotificationId: request.NotificationId || Date.now(),  // Fallback nếu backend không generate
  UserName: request.UserName,
  Title: request.Title,
  Content: request.Content,
  Type: request.Type,
  IsRead: request.IsRead || false,
  CreatedAt: new Date().toISOString(),  // Hoặc từ payload nếu có
  FullName: '',  // Default, fetch full nếu cần
  // Thêm fields khác nếu DTO có
});

// Helper: Calculate unread count from notifications
const calculateUnreadCount = (notifications: NotificationResponseDTO[]): number => {
  return notifications.filter(n => !n.IsRead).length;
};

// 🟢 Get all notifications by user
export const getAllNotifications = createAsyncThunk(
  "notification/getAllNotifications",
  async (userName: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Notification/GetAllNotification?userName=${userName}`);
      const apiResponse = ApiResponse.fromJson<NotificationResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được danh sách thông báo"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getAllNotifications error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Add notification
export const addNotification = createAsyncThunk(
  "notification/addNotification",
  async (payload: NotificationRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Notification/AddNotification", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Thêm thông báo thất bại");
      }

      // Trả về mapped payload để dùng cho local update
      return mapToResponseDTO(payload);
    } catch (error: any) {
      console.error("addNotification error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Update notification
export const updateNotification = createAsyncThunk(
  "notification/updateNotification",
  async (payload: NotificationRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put("/Notification/UpdateNotification", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Cập nhật thông báo thất bại");
      }

      // Trả về mapped payload để dùng cho local update
      return mapToResponseDTO(payload);
    } catch (error: any) {
      console.error("updateNotification error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete notification
export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(`/Notification/DeleteNotification?notificationId=${notificationId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa thông báo thất bại");
      }

      return notificationId;
    } catch (error: any) {
      console.error("deleteNotification error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedNotification: (state, action: PayloadAction<NotificationResponseDTO | null>) => {
      state.selectedNotification = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.selectedNotification = null;
      state.unreadCount = 0;
    },
    // Thêm reducer để clear selected nếu cần
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all notifications
      .addCase(getAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = (action.payload || []).filter((n) => n && n.NotificationId > 0);
        state.unreadCount = calculateUnreadCount(state.notifications);
        state.error = null;
      })
      .addCase(getAllNotifications.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách thông báo thất bại";
      })

      // Add notification (optimistic update)
      .addCase(addNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNotification.fulfilled, (state, action: PayloadAction<NotificationResponseDTO>) => {
        state.loading = false;
        state.notifications.unshift(action.payload);  // Add to front for newest first
        state.unreadCount = calculateUnreadCount(state.notifications);
        state.error = null;
        // Optional: Nếu muốn sync full, dispatch getAllNotifications() ở component sau
      })
      .addCase(addNotification.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Thêm thông báo thất bại";
      })

      // Update notification (local update)
      .addCase(updateNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotification.fulfilled, (state, action: PayloadAction<NotificationResponseDTO>) => {
        state.loading = false;
        const index = state.notifications.findIndex(n => n.NotificationId === action.payload.NotificationId);
        if (index !== -1) {
          state.notifications[index] = action.payload;  // Update in place
        } else {
          // Fallback: Add nếu không tìm thấy (edge case)
          state.notifications.push(action.payload);
        }
        // Nếu selected, update luôn
        if (state.selectedNotification?.NotificationId === action.payload.NotificationId) {
          state.selectedNotification = action.payload;
        }
        state.unreadCount = calculateUnreadCount(state.notifications);
        state.error = null;
        // Optional: Refetch nếu backend data không full
      })
      .addCase(updateNotification.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật thông báo thất bại";
      })

      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.notifications = state.notifications.filter(
          (n) => n.NotificationId !== action.payload
        );
        if (state.selectedNotification?.NotificationId === action.payload) {
          state.selectedNotification = null;
        }
        state.unreadCount = calculateUnreadCount(state.notifications);
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa thông báo thất bại";
      });
  },
});

export const { 
  clearError, 
  setSelectedNotification, 
  clearNotifications, 
  clearSelectedNotification 
} = notificationSlice.actions;

export default notificationSlice.reducer;