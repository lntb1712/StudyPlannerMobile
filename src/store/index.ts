import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import scheduleReducer from './slices/scheduleSlice';
import teacherClassReducer from './slices/teacherClassSlice';
import validateReducer from './slices/validationSlice';
import permissionReducer from './slices/permissionsSlice';
import reminderReducer from './slices/ReminderSlice';
import assignmentReducer from './slices/assignmentSlice';
import assignmentDetailReducer from './slices/assignmentDetailSlice';
import notificationReducer from './slices/notificationSlice';
import messagingReducer from './slices/messagingSlice';
import taskManagementReducer from './slices/taskManagementSlice';                                                             

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer,
    teacherClass: teacherClassReducer,
    validateSlice: validateReducer,
    permissions: permissionReducer, // ✅ key chính xác
    reminderSlice: reminderReducer,
    assignmentSlice: assignmentReducer,
    assignmentDetailSlice: assignmentDetailReducer,
    notificationSlice: notificationReducer,
    messagingSlice: messagingReducer,
    taskManagementSlice: taskManagementReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
