import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";
import { ScheduleRequestDTO } from "../../domain/entities/ScheduleDTO/ScheduleRequestDTO";
import { ScheduleResponseDTO } from "../../domain/entities/ScheduleDTO/ScheduleResponseDTO";

interface ScheduleState {
  schedules: ScheduleResponseDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedules: [],
  loading: false,
  error: null,
};

// 📌 Lấy tất cả lịch theo studentId
export const fetchSchedules = createAsyncThunk(
  "schedule/fetchAll",
  async (studentId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(
        `/Schedule/GetAllSchedules?studentId=${studentId}`
      );
      const apiResponse = ApiResponse.fromJson<ScheduleResponseDTO[]>(
        rawResponse,
        (data) => data
      );
      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || "Không lấy được lịch");
      }
      return apiResponse.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 📌 Tạo mới lịch
export const createSchedule = createAsyncThunk(
  "schedule/create",
  async (payload: ScheduleRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Schedule/CreateSchedule", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(rawResponse, (d) => d);
      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Tạo lịch thất bại");
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 📌 Cập nhật lịch
export const updateSchedule = createAsyncThunk(
  "schedule/update",
  async (
    { scheduleId, payload }: { scheduleId: number; payload: ScheduleRequestDTO },
    { rejectWithValue }
  ) => {
    try {
      const rawResponse = await http.put(
        `/Schedule/UpdateSchedule?scheduleId=${scheduleId}`,
        payload
      );
      const apiResponse = ApiResponse.fromJson<boolean>(rawResponse, (d) => d);
      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Cập nhật lịch thất bại");
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 📌 Xóa lịch
export const deleteSchedule = createAsyncThunk(
  "schedule/delete",
  async (scheduleId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(
        `/Schedule/DeleteSchedule?scheduleId=${scheduleId}`
      );
      const apiResponse = ApiResponse.fromJson<boolean>(rawResponse, (d) => d);
      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa lịch thất bại");
      }
      return scheduleId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchSchedules.fulfilled,
        (state, action: PayloadAction<ScheduleResponseDTO[]>) => {
          state.loading = false;
          state.schedules = action.payload;
        }
      )
      .addCase(fetchSchedules.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createSchedule.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSchedule.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // update
      .addCase(updateSchedule.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateSchedule.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // delete
      .addCase(deleteSchedule.fulfilled, (state, action: PayloadAction<number>) => {
        state.schedules = state.schedules.filter(
          (s) => s.ScheduleId !== action.payload
        );
      });
  },
});

export default scheduleSlice.reducer;
