// AssignmentSlice
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { AssignmentRequestDTO } from "../../domain/entities/AssignmentDTO/AssignmentRequestDTO";
import { AssignmentResponseDTO } from "../../domain/entities/AssignmentDTO/AssignmentResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";

interface AssignmentState {
  assignments: AssignmentResponseDTO[];
  selectedAssignment: AssignmentResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: AssignmentState = {
  assignments: [],
  selectedAssignment: null,
  loading: false,
  error: null,
};

// 🟢 Get assignments by teacher
export const getAssignmentsByTeacher = createAsyncThunk(
  "assignment/getAssignmentsByTeacher",
  async (
    { teacherId, classId }: { teacherId: string; classId: string },
    { rejectWithValue }
  ) => {
    try {
              console.log(teacherId);
        console.log(classId);
      const rawResponse = await http.get(
        `/Assignment/GetAllAssignmentByTeacherAsync?teacherId=${teacherId}&classId=${classId}`
      );
      const apiResponse = ApiResponse.fromJson<AssignmentResponseDTO[]>(
        rawResponse,
        (data) => data || []
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(
          apiResponse.message || "Không lấy được danh sách bài tập của giáo viên"
        );
      }

      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getAssignmentsByTeacher error:", error);
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);


// 🟢 Get assignments by class
export const getAssignmentsByClass = createAsyncThunk(
  "assignment/getAssignmentsByClass", 
  async (classId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Assignment/GetAllAssignmentByClassAsync?classId=${classId}`);
      const apiResponse = ApiResponse.fromJson<AssignmentResponseDTO[]>(
        rawResponse,
        (data) => data || []  // ✅ Fallback về [] nếu data null/undefined
      );

      // Chỉ reject nếu không success (bỏ check data null/array để tránh rejected khi empty)
      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Không lấy được danh sách bài tập của lớp");
      }

      // Trả về data (luôn là array, có thể empty)
      return apiResponse.data || [];
    } catch (error: any) {
      console.error("getAssignmentsByClass error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Add assignment
export const addAssignment = createAsyncThunk(
  "assignment/addAssignment",
  async (payload: AssignmentRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Assignment/AddAssignment", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Chỉ expect success boolean, fallback true nếu invalid
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Thêm bài tập thất bại");
      }

      // ✅ Không return data, chỉ return payload để identify sau (nếu cần local update)
      return payload;
    } catch (error: any) {
      console.error("addAssignment error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Update assignment
export const updateAssignment = createAsyncThunk(
  "assignment/updateAssignment",
  async (payload: AssignmentRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.put("/Assignment/UpdateAssignment", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Chỉ expect success boolean, fallback true nếu invalid
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Cập nhật bài tập thất bại");
      }

      // ✅ Không return data, chỉ return payload để identify sau (nếu cần local update)
      return payload;
    } catch (error: any) {
      console.error("updateAssignment error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Delete assignment
export const deleteAssignment = createAsyncThunk(
  "assignment/deleteAssignment",
  async (assignmentId: number, { rejectWithValue }) => {
    try {
      const rawResponse = await http.delete(`/Assignment/DeleteAssigment?assignmentId=${assignmentId}`);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => !!data  // ✅ Fallback true nếu success (boolean loose)
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xóa bài tập thất bại");
      }

      return assignmentId;
    } catch (error: any) {
      console.error("deleteAssignment error:", error); // ✅ Debug log
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedAssignment: (state, action: PayloadAction<AssignmentResponseDTO | null>) => {
      state.selectedAssignment = action.payload;
    },
    clearAssignments: (state) => {
      state.assignments = [];
      state.selectedAssignment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get assignments by teacher
      .addCase(getAssignmentsByTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignmentsByTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = (action.payload || []).filter((a) => a && a.AssignmentId > 0); // ✅ Luôn array
        state.error = null;
      })
      .addCase(getAssignmentsByTeacher.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách bài tập của giáo viên thất bại";
      })

      // Get assignments by class
      .addCase(getAssignmentsByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignmentsByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = (action.payload || []).filter((a) => a && a.AssignmentId > 0); // ✅ Luôn array
        state.error = null;
      })
      .addCase(getAssignmentsByClass.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lấy danh sách bài tập của lớp thất bại";
      })

      // Add assignment
      .addCase(addAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // ✅ Không push local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(addAssignment.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Thêm bài tập thất bại";
      })

      // Update assignment
      .addCase(updateAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // ✅ Không update local vì backend không trả data đầy đủ (chỉ boolean success)
        // Reload list ở component sau success để sync
      })
      .addCase(updateAssignment.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật bài tập thất bại";
      })

      // Delete assignment
      .addCase(deleteAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.assignments = state.assignments.filter(
          (a) => a.AssignmentId !== action.payload
        );
        if (state.selectedAssignment?.AssignmentId === action.payload) {
          state.selectedAssignment = null;
        }
        state.error = null;
      })
      .addCase(deleteAssignment.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xóa bài tập thất bại";
      });
  },
});

export const { clearError, setSelectedAssignment, clearAssignments } =
  assignmentSlice.actions;
export default assignmentSlice.reducer;