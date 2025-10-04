import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { AssignmentDetailResponseDTO } from "../../domain/entities/AssignmentDetailDTO/AssignmentDetailResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";

interface AssignmentDetailState {
  assignmentDetails: AssignmentDetailResponseDTO[];
  selectedAssignmentDetail: AssignmentDetailResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: AssignmentDetailState = {
  assignmentDetails: [],
  selectedAssignmentDetail: null,
  loading: false,
  error: null,
};

// 🟢 Get assignment details by assignment
export const getAssignmentDetailsByAssignment = createAsyncThunk(
  "assignmentDetail/getAssignmentDetailsByAssignment",
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(
        `/AssignmentDetail/GetAllByAssignmentAsync?assignMentId=${assignmentId}`
      );
      const apiResponse = ApiResponse.fromJson<AssignmentDetailResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được danh sách chi tiết bài tập"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getAssignmentDetailsByAssignment error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Get assignment detail by student
export const getAssignmentDetailByStudent = createAsyncThunk(
  "assignmentDetail/getAssignmentDetailByStudent",
  async (
    { assignmentId, studentId }: { assignmentId: number; studentId: string },
    { rejectWithValue }
  ) => {
    try {
      const rawResponse = await http.get(
        `/AssignmentDetail/GetByStudentAsync?assignmentId=${assignmentId}&studentId=${studentId}`
      );
      const apiResponse = ApiResponse.fromJson<AssignmentDetailResponseDTO>(
        rawResponse,
        (data) => (data as AssignmentDetailResponseDTO) || null
      );

      if (!apiResponse.isSuccess() || !apiResponse.data?.AssignmentId) {
        return rejectWithValue(
          apiResponse.message ||
            "Không lấy được thông tin chi tiết bài tập của học sinh"
        );
      }

      return apiResponse.data;
    } catch (error: any) {
      console.error("getAssignmentDetailByStudent error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Add assignment detail (multipart/form-data)
export const addAssignmentDetail = createAsyncThunk(
  "assignmentDetail/addAssignmentDetail",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post(
        "/AssignmentDetail/AddAssignmentDetail",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Thêm chi tiết bài tập thất bại"
        );
      }

      return true;
    } catch (error: any) {
      console.error("addAssignmentDetail error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Update assignment detail (multipart/form-data)
export const updateAssignmentDetail = createAsyncThunk(
  "assignmentDetail/updateAssignmentDetail",
  async (payload: FormData, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put(
        "/AssignmentDetail/UpdateAssignmentDetail",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Cập nhật chi tiết bài tập thất bại"
        );
      }

      return true;
    } catch (error: any) {
      console.error("updateAssignmentDetail error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete assignment detail
export const deleteAssignmentDetail = createAsyncThunk(
  "assignmentDetail/deleteAssignmentDetail",
  async (
    { assignmentId, studentId }: { assignmentId: number; studentId: string },
    { rejectWithValue }
  ) => {
    try {
      const rawResponse = await http.delete(
        `/AssignmentDetail/DeleteAssignmentDetail?assignmentId=${assignmentId}&studentId=${studentId}`
      );
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Xóa chi tiết bài tập thất bại"
        );
      }

      return { assignmentId, studentId };
    } catch (error: any) {
      console.error("deleteAssignmentDetail error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const assignmentDetailSlice = createSlice({
  name: "assignmentDetail",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedAssignmentDetail: (
      state,
      action: PayloadAction<AssignmentDetailResponseDTO | null>
    ) => {
      state.selectedAssignmentDetail = action.payload;
    },
    clearAssignmentDetails: (state) => {
      state.assignmentDetails = [];
      state.selectedAssignmentDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get assignment details by assignment
      .addCase(getAssignmentDetailsByAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignmentDetailsByAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.assignmentDetails = (action.payload || []).filter(
          (d) => d && d.AssignmentId > 0
        );
        state.error = null;
      })
      .addCase(
        getAssignmentDetailsByAssignment.rejected,
        (state, action: any) => {
          state.loading = false;
          state.error =
            action.payload || "Lấy danh sách chi tiết bài tập thất bại";
        }
      )

      // Get assignment detail by student
      .addCase(getAssignmentDetailByStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignmentDetailByStudent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.AssignmentId > 0) {
          state.selectedAssignmentDetail = action.payload;
        }
        state.error = null;
      })
      .addCase(getAssignmentDetailByStudent.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload ||
          "Lấy thông tin chi tiết bài tập của học sinh thất bại";
      })

      // Add assignment detail
      .addCase(addAssignmentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAssignmentDetail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(addAssignmentDetail.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Thêm chi tiết bài tập thất bại";
      })

      // Update assignment detail
      .addCase(updateAssignmentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignmentDetail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateAssignmentDetail.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật chi tiết bài tập thất bại";
      })

      // Delete assignment detail
      .addCase(deleteAssignmentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteAssignmentDetail.fulfilled,
        (
          state,
          action: PayloadAction<{ assignmentId: number; studentId: string }>
        ) => {
          state.loading = false;
          state.assignmentDetails = state.assignmentDetails.filter(
            (d) =>
              !(
                d.AssignmentId === action.payload.assignmentId &&
                d.StudentId === action.payload.studentId
              )
          );
          if (
            state.selectedAssignmentDetail?.AssignmentId ===
              action.payload.assignmentId &&
            state.selectedAssignmentDetail?.StudentId === action.payload.studentId
          ) {
            state.selectedAssignmentDetail = null;
          }
          state.error = null;
        }
      )
      .addCase(deleteAssignmentDetail.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa chi tiết bài tập thất bại";
      });
  },
});

export const {
  clearError,
  setSelectedAssignmentDetail,
  clearAssignmentDetails,
} = assignmentDetailSlice.actions;
export default assignmentDetailSlice.reducer;
