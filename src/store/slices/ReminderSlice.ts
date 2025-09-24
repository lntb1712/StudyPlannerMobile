// ReminderSlice
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { ReminderRequestDTO } from "../../domain/entities/ReminderDTO/ReminderRequestDTO";
import { ReminderResponseDTO } from "../../domain/entities/ReminderDTO/ReminderResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";

interface ReminderState {
  reminders: ReminderResponseDTO[];
  selectedReminder: ReminderResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReminderState = {
  reminders: [],
  selectedReminder: null,
  loading: false,
  error: null,
};

// 🟢 Get reminders by parent or student ID
export const getRemindersByUser = createAsyncThunk(
  "reminder/getRemindersByUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Reminder/GetReminderByParentOrStudent?parentOrStudentId=${userId}`);
      const apiResponse = ApiResponse.fromJson<ReminderResponseDTO[]>(
        rawResponse,
        (data) => data || []  // ✅ Fallback về [] nếu data null/undefined
      );

      // Chỉ reject nếu không success (bỏ check data null/array để tránh rejected khi empty)
      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Không lấy được danh sách nhắc nhở");
      }

      // Trả về data (luôn là array, có thể empty)
      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getRemindersByUser error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Get reminder by ID
export const getReminderById = createAsyncThunk(
  "reminder/getReminderById",
  async (reminderId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Reminder/GetReminderById?reminderId=${reminderId}`);
      const apiResponse = ApiResponse.fromJson<ReminderResponseDTO>(
        rawResponse,
        (data) => data as ReminderResponseDTO || null  // ✅ Fallback null nếu invalid
      );

      if (!apiResponse.isSuccess() || !apiResponse.data || !apiResponse.data.ReminderId) {
        return rejectWithValue(apiResponse.message || "Không lấy được thông tin nhắc nhở");
      }

      return apiResponse.data;
    } catch (error: any) {
      console.error("getReminderById error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Add reminder
export const addReminder = createAsyncThunk(
  "reminder/addReminder",
  async (payload: ReminderRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Reminder/AddReminder", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Chỉ expect success boolean, fallback true nếu invalid
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Thêm nhắc nhở thất bại");
      }

      // ✅ Không return data, chỉ return payload để identify sau (nếu cần local update)
      return payload;
    } catch (error: any) {
      console.error("addReminder error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Update reminder
export const updateReminder = createAsyncThunk(
  "reminder/updateReminder",
  async (payload: ReminderRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put("/Reminder/UpdateReminder", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Chỉ expect success boolean, fallback true nếu invalid
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Cập nhật nhắc nhở thất bại");
      }

      // ✅ Không return data, chỉ return payload để identify sau (nếu cần local update)
      return payload;
    } catch (error: any) {
      console.error("updateReminder error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete reminder
export const deleteReminder = createAsyncThunk(
  "reminder/deleteReminder",
  async (reminderId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(`/Reminder/DeleteReminder?reminderId=${reminderId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Fallback true nếu success (boolean loose)
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa nhắc nhở thất bại");
      }

      return reminderId;
    } catch (error: any) {
      console.error("deleteReminder error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const reminderSlice = createSlice({
  name: "reminder",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedReminder: (state, action: PayloadAction<ReminderResponseDTO | null>) => {
      state.selectedReminder = action.payload;
    },
    clearReminders: (state) => {
      state.reminders = [];
      state.selectedReminder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get reminders by user
      .addCase(getRemindersByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRemindersByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.reminders = (action.payload || []).filter((r) => r && r.ReminderId > 0); // ✅ Luôn array
        state.error = null;
      })
      .addCase(getRemindersByUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách nhắc nhở thất bại";
      })

      // Get reminder by ID
      .addCase(getReminderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReminderById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.ReminderId > 0) {
          state.selectedReminder = action.payload;
        }
        state.error = null;
      })
      .addCase(getReminderById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy thông tin nhắc nhở thất bại";
      })

      // Add reminder
      .addCase(addReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // ✅ Không push local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(addReminder.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Thêm nhắc nhở thất bại";
      })

      // Update reminder
      .addCase(updateReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // ✅ Không update local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(updateReminder.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật nhắc nhở thất bại";
      })

      // Delete reminder
      .addCase(deleteReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.reminders = state.reminders.filter(
          (r) => r.ReminderId !== action.payload
        );
        if (state.selectedReminder?.ReminderId === action.payload) {
          state.selectedReminder = null;
        }
        state.error = null;
      })
      .addCase(deleteReminder.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa nhắc nhở thất bại";
      });
  },
});

export const { clearError, setSelectedReminder, clearReminders } =
  reminderSlice.actions;
export default reminderSlice.reducer;