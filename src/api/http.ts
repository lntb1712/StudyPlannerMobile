import axios from "axios";

export const http = axios.create({
  baseURL: "https://studyplannerapi.onrender.com/api", // <-- bạn có thể đổi thành import.meta.env.VITE_API_URL
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor response: luôn trả về response.data, nếu lỗi thì trả về Error(message)
http.interceptors.response.use(
  (response: any) => response.data,
  (error: any) => {
    let message = "Unknown error";
    if (error.response) {
      // Lỗi từ server với phản hồi
      message =
        error.response.data?.Message ||
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Không nhận được phản hồi (mạng lỗi)
      message = "Network error: Unable to reach the server";
    } else {
      // Lỗi trong quá trình thiết lập request
      message = error.message || "Request setup error";
    }
    return Promise.reject(new Error(message));
  }
);
