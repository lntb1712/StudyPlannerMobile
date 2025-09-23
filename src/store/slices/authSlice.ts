// Updated authSlice with new thunks for parent registration
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { http } from "../../api/http";
import { LoginRequestDTO } from "../../domain/entities/LoginDTO/LoginRequestDTO";
import { LoginResponseDTO } from "../../domain/entities/LoginDTO/LoginResponseDTO";
import { ApiResponse } from "../../domain/value-objects/ApiResponse";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountManagementResponseDTO } from "../../domain/entities/AccountManagementDTO/AccountManagementResponseDTO";
import { SendOTPRequestDTO } from "../../domain/entities/OTP/SendOTPRequestDTO";
import { VerifyOTPRequestDTO } from "../../domain/entities/OTP/VerifyOTPRequestDTO";
import { RegisterParentRequestDTO } from "../../domain/entities/RegisterDTO/RegisterParentRequestDTO";
import { setToken } from "./permissionsSlice";

// Unused imports removed: ca, da from date-fns/locale
interface AuthState {
  user: { username: string; groupId: string; token: string; classId?: string } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// 🟢 Login
export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginRequestDTO, { dispatch, rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Login/Authentication", payload);
      const apiResponse = ApiResponse.fromJson<LoginResponseDTO>(
        rawResponse,
        (data) => LoginResponseDTO.fromJson(data)
      );

      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || "Đăng nhập thất bại");
      }

      const dto = apiResponse.data;

      // ✅ Lưu token bằng AsyncStorage
      if (dto.token) {
        await AsyncStorage.setItem("token", dto.token);
         dispatch(setToken(dto.token));
      }

      // ✅ Fetch user information after successful auth
      const userInfoPromise = dispatch(getUserInformation(payload));
      let response: { ClassId: string };
      try {
        response = await userInfoPromise.unwrap();
      } catch (err) {
        return rejectWithValue("Không lấy được thông tin người dùng sau đăng nhập");
      }

      if (!response) {
        return rejectWithValue("Không lấy được thông tin người dùng sau đăng nhập");
      } else {
        // ✅ Lưu ClassId vào AsyncStorage nếu có
        if (response.ClassId) {
          await AsyncStorage.setItem("classId", response.ClassId);
        }
      }

      // ✅ Return combined data: user info + token
      return {
        username: dto.username,
        groupId: dto.groupId,
        token: dto.token,
        classId: response.ClassId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

export const getUserInformation = createAsyncThunk(
  "auth/getUserInformation",
  async (payload: LoginRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.get(`/Login/GetUserInformation?username=${payload.Username}`);
      const apiResponse = ApiResponse.fromJson<AccountManagementResponseDTO>(
        rawResponse,
        (data) => AccountManagementResponseDTO.fromJson(data)
      );

      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || "Không lấy được thông tin người dùng");
      }
      // ✅ Return only serializable plain object with needed data
      return { ClassId: apiResponse.data.ClassId || "" };
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Send OTP for parent registration
export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async (payload: SendOTPRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Login/SendOTP", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Gửi mã OTP thất bại");
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Verify OTP
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (payload: VerifyOTPRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Login/VerifyOTP", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Xác thực OTP thất bại");
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Register Parent Account
export const registerParent = createAsyncThunk(
  "auth/registerParent",
  async (payload: RegisterParentRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post("/Login/CreateParentAccount", payload);
      const apiResponse = ApiResponse.fromJson<boolean>(
        rawResponse,
        (data) => data
      );

      if (!apiResponse.isSuccess()) {
        return rejectWithValue(apiResponse.message || "Tạo tài khoản thất bại");
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || "Lỗi không xác định");
    }
  }
);

// 🟢 Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("classId"); // Also clear classId on logout
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{ username: string; groupId: string; token: string; classId?: string }>) => {
          state.loading = false;
          state.user = action.payload;
        }
      )
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Đăng nhập thất bại";
      })
      // getUserInformation cases (for standalone use, e.g., refresh)
      .addCase(getUserInformation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getUserInformation.fulfilled,
        (state, action: PayloadAction<{ ClassId: string }>) => {
          state.loading = false;
          if (state.user) {
            // Update classId
            state.user = { ...state.user, classId: action.payload.ClassId };
          }
        }
      )
      .addCase(getUserInformation.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Lỗi lấy thông tin người dùng";
      })
      // SendOTP cases
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOTP.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Gửi OTP thất bại";
      })
      // VerifyOTP cases
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyOTP.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Xác thực OTP thất bại";
      })
      // RegisterParent cases
      .addCase(registerParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerParent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerParent.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Tạo tài khoản thất bại";
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.loading = false;   // thêm dòng này để chắc chắn UI không treo loading
      });
  },
});

export default authSlice.reducer;