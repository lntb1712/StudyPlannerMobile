// TaskManagementSlice
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { TaskManagementRequestDTO } from "../../domain/entities/TaskManagementDTO/TaskManagementRequestDTO";
import { TaskManagementResponseDTO } from "../../domain/entities/TaskManagementDTO/TaskManagementResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";

interface TaskManagementState {
  tasks: TaskManagementResponseDTO[];
  selectedTask: TaskManagementResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: TaskManagementState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
};

// 🟢 Get tasks by student
export const getTasksByStudent = createAsyncThunk(
  "taskManagement/getTasksByStudent",
  async (studentId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/TaskManagement/GetTaskManagementAsync?studentId=${studentId}`);
      const apiResponse = ApiResponse.fromJson<TaskManagementResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được danh sách nhiệm vụ của học sinh"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getTasksByStudent error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Add task
export const addTaskManagement = createAsyncThunk(
  "taskManagement/addTaskManagement",
  async (payload: TaskManagementRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/TaskManagement/AddTaskManagement", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Thêm nhiệm vụ thất bại");
      }

      return payload;
    } catch (error: any) {
      console.error("addTaskManagement error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Update task
export const updateTaskManagement = createAsyncThunk(
  "taskManagement/updateTaskManagement",
  async (payload: TaskManagementRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put("/TaskManagement/UpdateTaskManagement", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Cập nhật nhiệm vụ thất bại");
      }

      return payload;
    } catch (error: any) {
      console.error("updateTaskManagement error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete task
export const deleteTaskManagement = createAsyncThunk(
  "taskManagement/deleteTaskManagement",
  async (taskId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(`/TaskManagement/DeleteTaskManagement?taskId=${taskId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa nhiệm vụ thất bại");
      }

      return taskId;
    } catch (error: any) {
      console.error("deleteTaskManagement error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const taskManagementSlice = createSlice({
  name: "taskManagement",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTask: (state, action: PayloadAction<TaskManagementResponseDTO | null>) => {
      state.selectedTask = action.payload;
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.selectedTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get tasks by student
      .addCase(getTasksByStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTasksByStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = (action.payload || []).filter((t) => t && t.TaskId > 0);
        state.error = null;
      })
      .addCase(getTasksByStudent.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách nhiệm vụ của học sinh thất bại";
      })

      // Add task
      .addCase(addTaskManagement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTaskManagement.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Không push local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(addTaskManagement.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Thêm nhiệm vụ thất bại";
      })

      // Update task
      .addCase(updateTaskManagement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskManagement.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Không update local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(updateTaskManagement.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật nhiệm vụ thất bại";
      })

      // Delete task
      .addCase(deleteTaskManagement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTaskManagement.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.tasks = state.tasks.filter(
          (t) => t.TaskId !== action.payload
        );
        if (state.selectedTask?.TaskId === action.payload) {
          state.selectedTask = null;
        }
        state.error = null;
      })
      .addCase(deleteTaskManagement.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa nhiệm vụ thất bại";
      });
  },
});

export const { clearError, setSelectedTask, clearTasks } =
  taskManagementSlice.actions;
export default taskManagementSlice.reducer;