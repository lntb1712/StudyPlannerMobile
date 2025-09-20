import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import scheduleReducer from "./slices/scheduleSlice"; // ✅ thêm dòng này
import teacherClassReducer from "./slices/teacherClassSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer, // ✅ add vào store
    teacherClass: teacherClassReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
