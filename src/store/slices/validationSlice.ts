// src/store/slices/validationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
// Types for validation errors
export interface ValidationErrors {
  subject?: string;
  startTime?: string;
  endTime?: string;
  selectedTeacher?: string;
  general?: string;
}

export interface ValidationState {
  errors: ValidationErrors;
  isValid: boolean;
  isSubmitting: boolean;
}

// Initial state
const initialState: ValidationState = {
  errors: {},
  isValid: false,
  isSubmitting: false,
};

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    // Clear all errors
    clearErrors: (state) => {
      state.errors = {};
      state.isValid = false;
    },

    // Set specific field error
    setFieldError: (
      state,
      action: PayloadAction<{ field: keyof ValidationErrors; message: string }>
    ) => {
      const { field, message } = action.payload;
      state.errors[field] = message;
      state.isValid = false;
    },

    // Clear specific field error
    clearFieldError: (state, action: PayloadAction<keyof ValidationErrors>) => {
      const field = action.payload;
      delete state.errors[field];
      // Recheck validity if needed
      state.isValid = Object.keys(state.errors).length === 0;
    },

    // Validate form based on current values (called before submit)
    validateForm: (
      state,
      action: PayloadAction<{
        subject: string;
        startTime: string;
        endTime: string;
        selectedTeacher: string | null;
        classId: string;
      }>
    ) => {
      const { subject, startTime, endTime, selectedTeacher, classId } = action.payload;
      const newErrors: ValidationErrors = {};

      // Validate subject
      if (!subject.trim()) {
        newErrors.subject = 'Môn học không được để trống.';
      }

      // Validate startTime
      let startDate: Date | null = null;
      if (!startTime) {
        newErrors.startTime = 'Giờ bắt đầu không được để trống.';
      } else {
        // Basic format check (you can enhance with date-fns)
        startDate = new Date(startTime.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
        if (isNaN(startDate.getTime())) {
          newErrors.startTime = 'Định dạng giờ bắt đầu không hợp lệ.';
        }
      }

      // Validate endTime
      if (!endTime) {
        newErrors.endTime = 'Giờ kết thúc không được để trống.';
      } else {
        const endDate = new Date(endTime.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
        if (isNaN(endDate.getTime())) {
          newErrors.endTime = 'Định dạng giờ kết thúc không hợp lệ.';
        } else if (startTime && startDate && endDate <= startDate) {
          newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
        }
      }

      // Validate selectedTeacher
      if (!selectedTeacher) {
        newErrors.selectedTeacher = 'Vui lòng chọn giáo viên.';
      }

      // Validate classId
      if (!classId) {
        newErrors.general = 'Không có thông tin lớp học.';
      }

      state.errors = newErrors;
      state.isValid = Object.keys(newErrors).length === 0;
    },

    // Set submitting state
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
  },
});

// Actions
export const {
  clearErrors,
  setFieldError,
  clearFieldError,
  validateForm,
  setSubmitting,
} = validationSlice.actions;

// Selectors - Fixed to handle undefined validation
export const selectValidationErrors = (state: RootState) => state.validateSlice.errors;
export const selectIsFormValid = (state: RootState) => state.validateSlice.isValid;
export const selectIsSubmitting = (state: RootState) => state.validateSlice.isSubmitting;


// Reducer
export default validationSlice.reducer;