import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";
import { TeacherClassResponseDTO } from "../../domain/entities/TeacherClassDTO/TeacherClassResponseDTO";

interface TeacherClassState {
  teachers: TeacherClassResponseDTO[];
  classes: TeacherClassResponseDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: TeacherClassState = {
  teachers: [],
  classes: [],
  loading: false,
  error: null,
};

// 📌 Lấy danh sách giáo viên theo ClassId
export const fetchTeachersByClassId = createAsyncThunk(
  "teacherClass/fetchByClassId",
  async (classId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(
        `/Class/${classId}/TeacherClass/GetTeacherByClassID?classId=${classId}`
      );
      const apiResponse = ApiResponse.fromJson<TeacherClassResponseDTO[]>(
        rawResponse,
        (data) => data
      );
      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || "Không lấy được danh sách giáo viên");
      }
      return apiResponse.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 📌 Lấy danh sách lớp theo TeacherId
export const fetchClassesByTeacherId = createAsyncThunk(
  "teacherClass/fetchByTeacherId",
  async (teacherId: string, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(
        `/TeacherClass/GetClassByTeacherID?teacherId=${teacherId}`
      );
      const apiResponse = ApiResponse.fromJson<TeacherClassResponseDTO[]>(
        rawResponse,
        (data) => data
      );
      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || "Không lấy được danh sách lớp học");
      }
      return apiResponse.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

const teacherClassSlice = createSlice({
  name: "teacherClass",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch by classId
      .addCase(fetchTeachersByClassId.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchTeachersByClassId.fulfilled,
        (state, action: PayloadAction<TeacherClassResponseDTO[]>) => {
          state.loading = false;
          state.teachers = action.payload;
        }
      )
      .addCase(fetchTeachersByClassId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetch by teacherId
      .addCase(fetchClassesByTeacherId.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchClassesByTeacherId.fulfilled,
        (state, action: PayloadAction<TeacherClassResponseDTO[]>) => {
          state.loading = false;
          state.classes = action.payload;
        }
      )
      .addCase(fetchClassesByTeacherId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default teacherClassSlice.reducer;