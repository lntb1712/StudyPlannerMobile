// Cập nhật cho src/screens/HomeScreen.tsx
// Thay đổi handleReminderPress để navigate đến RemindersScreen
// (Giả sử đã thêm "Reminders": undefined vào RootStackParamList trong navigation/types.ts)
// Và thêm <Stack.Screen name="Reminders" component={RemindersScreen} /> vào navigator.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState, AppDispatch } from "../store";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatInTimeZone } from "date-fns-tz";
import { vi } from "date-fns/locale";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { createSchedule, updateSchedule, fetchSchedules } from "../store/slices/scheduleSlice";
import { ScheduleResponseDTO } from "../domain/entities/ScheduleDTO/ScheduleResponseDTO";
import { fetchTeachersByClassId } from "../store/slices/teacherClassSlice";
import { TeacherClassResponseDTO } from "../domain/entities/TeacherClassDTO/TeacherClassResponseDTO";
import DropDownPicker from "react-native-dropdown-picker";
import {
  validateForm,
  clearErrors,
  selectValidationErrors,
  selectIsFormValid,
  selectIsSubmitting,
  setSubmitting,
} from "../store/slices/validationSlice";
import {
  makeSelectHasPermission,
  selectIsAdmin,
} from "../store/slices/permissionsSlice";

import Header from "../components/Header";
import DateSection from "../components/DateSection";
import ScheduleSection from "../components/ScheduleSection";
import { format, parse, getDay, isValid } from "date-fns";
import { useNavigation } from "@react-navigation/native";  // Thêm import này

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const colors = {
  pinkPrimary: "#EC4899",
  pinkBg: "#F472B6",
  white: "#FFFFFF",
};

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AuthNav>();  // Thêm navigation hook
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'create' | 'update' | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponseDTO | null>(null);

  const auth = useSelector((state: RootState) => state.auth);
  const teacherClassState = useSelector((state: RootState) => state.teacherClass);
  const { teachers: availableTeachers = [], loading: teachersLoading = false } =
    teacherClassState || {};

  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherClassResponseDTO | null>(null);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [teacherItems, setTeacherItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const classId = auth.user?.classId || "";
  const TIMEZONE = "Asia/Ho_Chi_Minh";

  // Permissions: Sử dụng multiple useSelector cho từng perm cụ thể (vì navItems fixed và ít)
  const isAdmin = useSelector(selectIsAdmin);
  const hasSchedulePermission = useSelector(makeSelectHasPermission('ucSchedule'));
  const hasAssignmentPermission = useSelector(makeSelectHasPermission('ucAssignment'));
  const canCreateOrUpdate = isAdmin || hasSchedulePermission;
  const isReadonlyMode = !canCreateOrUpdate; // Nếu không có quyền full, thì readonly

  // Validation
  const errors = useSelector(selectValidationErrors, shallowEqual);
  const isFormValid = useSelector(selectIsFormValid);
  const isSubmitting = useSelector(selectIsSubmitting) as boolean;

  // Sidebar nav items (similar to Vue)
  const navItems = [
    { name: "Hồ sơ", icon: "person-outline", route: "Profile" }, // No perm, always show
    { name: "Cài đặt", icon: "settings-outline", route: "Settings" }, // No perm, always show
    { name: "Quản lý bài tập", icon: "book-outline", route: "Assignment", perm: "ucAssignment" }
  ];

  // Filtered nav items based on permissions (sử dụng useMemo với deps perms)
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (!item.perm) return true; // Public items
      // Check dựa trên selector value đã lấy từ useSelector
      if (item.perm === 'ucAssignment') {
        return isAdmin || hasAssignmentPermission;
      }
      return true; // Default cho các perm khác nếu cần mở rộng
    });
  }, [isAdmin, hasAssignmentPermission]);

  const clearForm = useCallback(() => {
    setSubject("");
    setStartTime("");
    setEndTime("");
    setSelectedTeacher(null);
    setSelectedTeacherId(null);
    dispatch(clearErrors());
  }, [dispatch]);

  // Cập nhật: Navigate đến RemindersScreen thay vì mở modal schedule
  const handleReminderPress = useCallback(() => {
    navigation.navigate("Reminders");
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    // TODO: Implement notification logic
    Alert.alert("Thông báo", "Chức năng thông báo sẽ được thêm sau.");
  }, []);

  useEffect(() => {
    if (classId && !teachersLoading) {
      dispatch(fetchTeachersByClassId(classId));
    }
  }, [dispatch, classId]);

  useEffect(() => {
    if (availableTeachers.length > 0) {
      setTeacherItems(
        availableTeachers.map((t) => ({
          label: t.TeacherName,
          value: t.TeacherId,
        }))
      );
    }
  }, [availableTeachers]);

  useEffect(() => {
    const teacher = availableTeachers.find(
      (t) => t.TeacherId === selectedTeacherId
    );
    if (teacher) {
      setSelectedTeacher(teacher);
      if (!subject) {
        setSubject(teacher.Subject || "");
      }
    }
  }, [selectedTeacherId, availableTeachers, subject]);

  const handleEventPress = useCallback((event: ScheduleResponseDTO) => {
    if (isReadonlyMode) {
      Alert.alert("Không có quyền", "Bạn chỉ có quyền xem lịch trình.");
      return;
    }
    setSelectedSchedule(event);
    const parseDateTime = (value?: string) => {
      if (!value) return null;
      try {
        const parsed = parse(value, "dd/MM/yyyy HH:mm:ss", new Date());
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const start = parseDateTime(event.StartTime);
    if (start) {
      const dateStr = format(selectedDate, "dd/MM/yyyy");
      const timeStr = format(start, "HH:mm");
      setStartTime(`${dateStr} ${timeStr}:00`); // Add seconds for format
    }

    const end = parseDateTime(event.EndTime);
    if (end) {
      const dateStr = format(selectedDate, "dd/MM/yyyy");
      const timeStr = format(end, "HH:mm");
      setEndTime(`${dateStr} ${timeStr}:00`);
    }

    setSubject(event.Subject || "");
    setSelectedTeacherId(event.TeacherId || null);
    setMode('update');
    setModalVisible(true);
    dispatch(clearErrors());
  }, [selectedDate, isReadonlyMode, dispatch]);

  const handleSubmit = useCallback(() => {
    if (isReadonlyMode) {
      Alert.alert("Không có quyền", "Bạn không có quyền thực hiện thao tác này.");
      return;
    }

    // Validate form using slice
    dispatch(validateForm({
      subject,
      startTime,
      endTime,
      selectedTeacher: selectedTeacher?.TeacherId || null,
      classId,
    }));

    if (!isFormValid) {
      // Errors are already set in store, will be displayed
      Alert.alert("Lỗi", "Vui lòng sửa các lỗi dưới đây.");
      return;
    }

    const startParsed = parse(startTime, "dd/MM/yyyy HH:mm:ss", new Date());
    if (!isValid(startParsed)) {
      Alert.alert("Lỗi", "Định dạng thời gian không hợp lệ.");
      return;
    }

    const dayOfWeek = getDay(startParsed);

    const payload = {
      ScheduleId: mode === 'update' ? selectedSchedule!.ScheduleId : 0,
      StudentId: auth.user?.username || "",
      ClassId: classId,
      TeacherId: selectedTeacher!.TeacherId,
      Subject: subject,
      DayOfWeek: dayOfWeek,
      StartTime: startTime,
      EndTime: endTime,
      StatusId: 1,
      CreatedAt: mode === 'create' ? format(new Date(), "dd/MM/yyyy HH:mm:ss") : selectedSchedule!.CreatedAt,
      UpdatedAt: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    };

    dispatch(setSubmitting(true));

    let promise;
    if (mode === 'create') {
      promise = dispatch(createSchedule(payload));
    } else {
      promise = dispatch(updateSchedule({
        scheduleId: selectedSchedule!.ScheduleId,
        payload
      }));
    }

    promise.unwrap()
      .then(() => {
        if (auth.user?.username) {
          dispatch(fetchSchedules(auth.user.username));
        }
        setModalVisible(false);
        clearForm();
      })
      .catch((err: any) => {
        Alert.alert("Lỗi", err || "Thao tác thất bại. Vui lòng thử lại.");
      })
      .finally(() => {
        dispatch(setSubmitting(false));
      });
  }, [dispatch, mode, selectedSchedule, auth.user, classId, subject, selectedTeacher, startTime, endTime, clearForm, isReadonlyMode, isFormValid]);

  // Disable nút FAB nếu không có quyền
  const fabOnPress = useCallback(() => {
    if (isReadonlyMode) {
      Alert.alert("Không có quyền", "Bạn chỉ có quyền xem lịch trình.");
      return;
    }
    clearForm();
    setMode('create');
    setSelectedSchedule(null);
    setModalVisible(true);
  }, [clearForm, isReadonlyMode]);

  // Modal title and submit text
  const modalTitle = mode === 'create' ? 'Tạo lịch mới' : 'Cập nhật lịch';
  const submitText = mode === 'create' ? 'Tạo' : 'Cập nhật';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="p-4">
            <Header
              onOpenSidebar={() => setSidebarVisible(true)}
              onReminderPress={handleReminderPress}  // Đã cập nhật
              onNotificationPress={handleNotificationPress}
            />
            <DateSection
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            <ScheduleSection
              selectedDate={selectedDate}
              onEventPress={handleEventPress}
            />
          </View>
        </ScrollView>

        {/* FAB: Disable nếu không có quyền */}
        <TouchableOpacity
          className={`absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg ${canCreateOrUpdate ? 'bg-pink-500' : 'bg-gray-400'}`}
          activeOpacity={0.8}
          onPress={fabOnPress}
          disabled={!canCreateOrUpdate}
        >
          <Icon name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Modal for Create/Update: Disable nếu readonly */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <View className="bg-white rounded-2xl p-5">
          <Text className="text-lg font-bold mb-4">
            {isReadonlyMode ? 'Xem lịch trình' : modalTitle}
          </Text>

          <Text className="text-sm font-medium mb-1">Chọn giáo viên:</Text>
          <DropDownPicker
            open={teacherDropdownOpen}
            value={selectedTeacherId}
            items={teacherItems}
            setOpen={setTeacherDropdownOpen}
            setValue={setSelectedTeacherId}
            setItems={setTeacherItems}
            placeholder="Chọn giáo viên"
            loading={teachersLoading}
            disabled={isReadonlyMode}
            style={{
              borderColor: isReadonlyMode ? "#D1D5DB" : "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: isReadonlyMode ? "#F9FAFB" : "#FFFFFF",
            }}
            dropDownContainerStyle={{
              borderColor: "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
            }}
            textStyle={{
              fontSize: 14,
              color: isReadonlyMode ? "#9CA3AF" : "#1E293B",
            }}
          />
          {errors.selectedTeacher && (
            <Text className="text-red-500 text-xs mb-2">{errors.selectedTeacher}</Text>
          )}

          <Text className="text-sm font-medium mb-1">Môn học:</Text>
          <TextInput
            placeholder="Môn học"
            value={subject}
            onChangeText={!isReadonlyMode ? setSubject : undefined}
            editable={!isReadonlyMode}
            className={`border rounded-lg px-3 py-2 mb-2 ${isReadonlyMode ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          />
          {errors.subject && <Text className="text-red-500 text-xs mb-2">{errors.subject}</Text>}

          <Text className="text-sm font-medium mb-1">Mã lớp học:</Text>
          <TextInput
            value={classId}
            editable={false}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-gray-100"
          />
          {errors.general && <Text className="text-red-500 text-xs mb-2">{errors.general}</Text>}

          <Text className="text-sm font-medium mb-1">Giờ bắt đầu:</Text>
          <TouchableOpacity
            onPress={!isReadonlyMode ? () => setStartTimePickerVisible(true) : undefined}
            disabled={isReadonlyMode}
            className={`border rounded-lg px-3 py-2 mb-2 ${isReadonlyMode ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-base ${isReadonlyMode ? 'text-slate-500' : 'text-slate-800'}`}>
              {startTime ? startTime : "Chọn ngày giờ bắt đầu"}
            </Text>
          </TouchableOpacity>
          {errors.startTime && <Text className="text-red-500 text-xs mb-2">{errors.startTime}</Text>}

          <Text className="text-sm font-medium mb-1">Giờ kết thúc:</Text>
          <TouchableOpacity
            onPress={!isReadonlyMode ? () => setEndTimePickerVisible(true) : undefined}
            disabled={isReadonlyMode}
            className={`border rounded-lg px-3 py-2 mb-3 ${isReadonlyMode ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-base ${isReadonlyMode ? 'text-slate-500' : 'text-slate-800'}`}>
              {endTime ? endTime : "Chọn ngày giờ kết thúc"}
            </Text>
          </TouchableOpacity>
          {errors.endTime && <Text className="text-red-500 text-xs mb-2">{errors.endTime}</Text>}

          {!isReadonlyMode && (
            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-pink-500 p-3 rounded-xl mt-3"
              disabled={isSubmitting}
            >
              <Text className="text-center text-white font-semibold">
                {isSubmitting ? 'Đang xử lý...' : submitText}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mt-2"
            onPress={() => {
              setModalVisible(false);
              clearForm();
            }}
          >
            <Text className="text-center text-slate-500">
              {isReadonlyMode ? 'Đóng' : 'Hủy'}
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isStartTimePickerVisible}
          mode="datetime"
          onConfirm={(date) => {
            const uiString = formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
            setStartTime(uiString);
            setStartTimePickerVisible(false);
          }}
          onCancel={() => setStartTimePickerVisible(false)}
        />

        <DateTimePickerModal
          isVisible={isEndTimePickerVisible}
          mode="datetime"
          onConfirm={(date) => {
            const uiString = formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
            setEndTime(uiString);
            setEndTimePickerVisible(false);
          }}
          onCancel={() => setEndTimePickerVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;