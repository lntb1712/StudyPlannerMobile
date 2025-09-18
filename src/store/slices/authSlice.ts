import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { http } from '../../api/http';
import { LoginResponseDTO } from '../../domain/entities/LoginDTO/LoginResponseDTO';
import { LoginRequestDTO } from '../../domain/entities/LoginDTO/LoginRequestDTO';
import { ApiResponse } from '../../domain/value-objects/ApiResponse';

interface AuthState {
  user: LoginResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequestDTO, { rejectWithValue }) => {
    try {
      const rawResponse = await http.post('/Login/Authentication', payload);
      console.log('API Response:', rawResponse); // Debug
      const apiResponse = ApiResponse.fromJson<LoginResponseDTO>(rawResponse, (data) =>
        LoginResponseDTO.fromJson(data)
      );

      if (!apiResponse.isSuccess() || !apiResponse.data) {
        return rejectWithValue(apiResponse.message || 'Đăng nhập thất bại');
      }

      const dto = apiResponse.data;
      return {
        username: dto.username,
        groupId: dto.groupId,
        token: dto.token,
      };
    } catch (error: any) {
      console.error('Login Error:', error); // Debug
      return rejectWithValue(error.message || 'Lỗi không xác định');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponseDTO>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || 'Đăng nhập thất bại';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;