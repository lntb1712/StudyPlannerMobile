// src/screens/ScheduleScreen.tsx
// (Renamed from HomeScreen.tsx - this is the original schedule functionality)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal as NativeModal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState, AppDispatch } from "../store";
import Modal from "react-native-modal";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatInTimeZone } from "date-fns-tz";
import { vi } from "date-fns/locale";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { createSchedule, updateSchedule, fetchSchedules, deleteSchedule } from "../store/slices/scheduleSlice";
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
  makeSelectCanEdit,
  selectIsAdmin,
} from "../store/slices/permissionsSlice";

import Header from "../components/Header";
import DateSection from "../components/DateSection";
import ScheduleSection from "../components/ScheduleSection";
import { format, parse, getDay, isValid } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

// Task Management imports
import { getTasksByStudent, addTaskManagement, updateTaskManagement, deleteTaskManagement } from "../store/slices/taskManagementSlice";
import { TaskManagementResponseDTO } from "../domain/entities/TaskManagementDTO/TaskManagementResponseDTO";
import { TaskManagementRequestDTO } from "../domain/entities/TaskManagementDTO/TaskManagementRequestDTO";
import { Ionicons } from "@expo/vector-icons";




type AuthNav = NativeStackNavigationProp<RootStackParamList, "Schedule">; // Updated to "Schedule"

const colors = {
  pinkPrimary: "#EC4899",
  pinkBg: "#F472B6",
  white: "#FFFFFF",
};

const STATUS_OPTIONS = [
  { label: "Chưa bắt đầu", value: 1 },
  { label: "Đang thực hiện", value: 2 },
  { label: "Đã hoàn thành", value: 3 },
  { label: "Trễ", value: 4 },
];

const { width: screenWidth } = Dimensions.get("window");

const ScheduleScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AuthNav>();
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'create' | 'update' | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponseDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Task Management states
  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [taskMode, setTaskMode] = useState<'create' | 'update' | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskManagementResponseDTO | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isDueDatePickerVisible, setDueDatePickerVisible] = useState(false);
  const [taskStatusId, setTaskStatusId] = useState(1);
  const [isTaskStatusPickerVisible, setTaskStatusPickerVisible] = useState(false);
  const [taskStatusUpdateOnly, setTaskStatusUpdateOnly] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const auth = useSelector((state: RootState) => state.auth);
  const teacherClassState = useSelector((state: RootState) => state.teacherClass);
  const taskState = useSelector((state: RootState) => state.taskManagementSlice);
  const { teachers: availableTeachers = [], loading: teachersLoading = false } =
    teacherClassState || {};
  const { tasks: allTasks = [], loading: taskLoading = false, error: taskError } = taskState || {};

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
  const [statusId, setStatusId] = useState(1);
  const [isStatusPickerVisible, setStatusPickerVisible] = useState(false);
  const [statusUpdateOnly, setStatusUpdateOnly] = useState(false);

  const classId = auth.user?.classId || "";
  const studentId = auth.user?.username || "";
  const TIMEZONE = "Asia/Ho_Chi_Minh";

  // Permissions: Sử dụng multiple useSelector cho từng perm cụ thể (vì navItems fixed và ít)
  const isAdmin = useSelector(selectIsAdmin);
  const hasSchedulePermission = useSelector(makeSelectCanEdit('ucSchedule'));
  const hasTaskPermission = useSelector(makeSelectCanEdit('ucTaskManagement'));
  const canCreateOrUpdateSchedule = isAdmin || hasSchedulePermission;
  const canCreateOrUpdateTasks = isAdmin || hasTaskPermission;
  const isReadonlySchedule = !canCreateOrUpdateSchedule;
  const isReadonlyTask = !canCreateOrUpdateTasks;

  // Validation
  const errors = useSelector(selectValidationErrors, shallowEqual);
  const isFormValid = useSelector(selectIsFormValid);
  const isSubmitting = useSelector(selectIsSubmitting) as boolean;

  // Filtered tasks for selected date
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (!task.DueDate) return false;
      try {
        const due = parse(task.DueDate, "dd/MM/yyyy HH:mm:ss", new Date());
        if (!isValid(due)) return false;
        return format(due, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      } catch {
        return false;
      }
    });
  }, [allTasks, selectedDate]);

  const clearForm = useCallback(() => {
    setSubject("");
    setStartTime("");
    setEndTime("");
    setSelectedTeacher(null);
    setSelectedTeacherId(null);
    setStatusId(1);
    setStatusUpdateOnly(false);
    dispatch(clearErrors());
  }, [dispatch]);

  const clearTaskForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setTaskStatusId(1);
    setTaskStatusUpdateOnly(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (auth.user?.username) {
      const promises: Array<Promise<unknown>> = [dispatch(fetchSchedules(auth.user.username))];
      if (canCreateOrUpdateTasks) {
        promises.push(dispatch(getTasksByStudent(auth.user.username)));
      }
      Promise.all(promises).finally(() => {
        setRefreshing(false);
      });
    } else {
      setRefreshing(false);
    }
  }, [dispatch, auth.user?.username, canCreateOrUpdateTasks]);

  useEffect(() => {
    if (auth.user?.username) {
      dispatch(fetchSchedules(auth.user.username));
      if (canCreateOrUpdateTasks) {
        dispatch(getTasksByStudent(auth.user.username));
      }
    }
  }, [dispatch, auth.user?.username, canCreateOrUpdateTasks]);

  // Cập nhật: Navigate đến RemindersScreen thay vì mở modal schedule
  const handleReminderPress = useCallback(() => {
    navigation.navigate("Reminders");
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
  navigation.navigate("Notifications");
}, [navigation]);
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

  const getStatusLabel = (statusId: number) => {
    const status = STATUS_OPTIONS.find((s) => s.value === statusId);
    return status ? status.label : "Không xác định";
  };

  const handleEventPress = useCallback((event: ScheduleResponseDTO) => {
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
    setStatusId(event.StatusId || 1);
    setStatusUpdateOnly(isReadonlySchedule);
    setMode('update');
    setModalVisible(true);
    dispatch(clearErrors());
  }, [selectedDate, isReadonlySchedule, dispatch]);

  // Task Management handlers
  const handleTaskPress = useCallback((task: TaskManagementResponseDTO) => {
    setSelectedTask(task);
    const parseDateTime = (value?: string) => {
      if (!value) return null;
      try {
        const parsed = parse(value, "dd/MM/yyyy HH:mm:ss", new Date());
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const due = parseDateTime(task.DueDate);
    if (due) {
      setDueDate(format(due, "dd/MM/yyyy HH:mm:ss"));
    }

    setTitle(task.Title || "");
    setDescription(task.Description || "");
    setTaskStatusId(task.StatusId || 1);
    setTaskStatusUpdateOnly(isReadonlyTask);
    setTaskMode('update');
    setTaskModalVisible(true);
  }, [isReadonlyTask]);

const handleTaskDelete = useCallback(() => {
    if (!selectedTask) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa nhiệm vụ này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
               console.log(selectedTask.TaskId);
              await dispatch(deleteTaskManagement(selectedTask.TaskId)).unwrap();
              // ✅ Thêm log để debug
              console.log('Delete success, refetching tasks...');
              if (auth.user?.username) {
                await dispatch(getTasksByStudent(auth.user.username)).unwrap();
              }
              setTaskModalVisible(false);
              clearTaskForm();
              Alert.alert("Thành công", "Đã xóa nhiệm vụ.");
            } catch (err: any) {
              console.error('Delete error:', err); // ✅ Log error
              Alert.alert("Lỗi", err || "Xóa thất bại. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  }, [dispatch, selectedTask, auth.user?.username, clearTaskForm]);

  const handleTaskSubmit = useCallback(async () => {
    if (isReadonlyTask && !taskStatusUpdateOnly) {
      Alert.alert("Không có quyền", "Bạn không có quyền thao tác.");
      return;
    }

    const dueParsed = parse(dueDate, "dd/MM/yyyy HH:mm:ss", new Date());
    if (!isValid(dueParsed)) {
      Alert.alert("Lỗi", "Định dạng ngày giờ không hợp lệ.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Lỗi", "Tiêu đề không được để trống.");
      return;
    }

    const payload: TaskManagementRequestDTO = {
      TaskId: taskMode === 'update' ? selectedTask!.TaskId : 0,
      StudentId: studentId,
      Title: title.trim(),
      Description: description.trim(),
      DueDate: dueDate,
      StatusId: taskStatusId,
    };

    setTaskSubmitting(true);

    try {
      let promise;
      if (taskMode === 'create') {
        promise = dispatch(addTaskManagement(payload));
      } else {
        promise = dispatch(updateTaskManagement(payload));
      }

      await promise.unwrap();
      if (auth.user?.username) {
        dispatch(getTasksByStudent(auth.user.username));
      }
      setTaskModalVisible(false);
      clearTaskForm();
      Alert.alert(
        "Thành công",
        taskMode === "create" ? "Đã thêm nhiệm vụ." : "Đã cập nhật nhiệm vụ."
      );
    } catch (err: any) {
      Alert.alert("Lỗi", err || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setTaskSubmitting(false);
    }
  }, [dispatch, taskMode, selectedTask, studentId, title, description, dueDate, taskStatusId, clearTaskForm, isReadonlyTask, taskStatusUpdateOnly]);

  const fabTaskOnPress = useCallback(() => {
    if (isReadonlyTask) {
      Alert.alert("Không có quyền", "Bạn chỉ có quyền xem nhiệm vụ.");
      return;
    }
    clearTaskForm();
    setTaskMode('create');
    setSelectedTask(null);
    setTaskModalVisible(true);
  }, [clearTaskForm, isReadonlyTask]);

  const handleDelete = useCallback(() => {
    if (!selectedSchedule) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa lịch này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            dispatch(deleteSchedule(selectedSchedule.ScheduleId))
              .unwrap()
              .then(() => {
                if (auth.user?.username) {
                  dispatch(fetchSchedules(auth.user.username));
                }
                setModalVisible(false);
                clearForm();
                Alert.alert("Thành công", "Đã xóa lịch.");
              })
              .catch((err: any) => {
                Alert.alert("Lỗi", err || "Xóa thất bại. Vui lòng thử lại.");
              });
          },
        },
      ]
    );
  }, [dispatch, selectedSchedule, auth.user?.username, clearForm]);

  const handleSubmit = useCallback(() => {
    dispatch(clearErrors());

    if (isReadonlySchedule && !statusUpdateOnly) {
      Alert.alert("Không có quyền", "Bạn không có quyền thao tác.");
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
      StatusId: statusId,
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
        Alert.alert(
          "Thành công",
          mode === "create" ? "Đã thêm lịch." : "Đã cập nhật."
        );
      })
      .catch((err: any) => {
        dispatch(clearErrors());
        Alert.alert("Lỗi", err || "Thao tác thất bại. Vui lòng thử lại.");
      })
      .finally(() => {
        dispatch(setSubmitting(false));
      });
  }, [dispatch, mode, selectedSchedule, auth.user, classId, subject, selectedTeacher, startTime, endTime, clearForm, isReadonlySchedule, statusUpdateOnly, statusId, isFormValid]);

  // Disable nút FAB nếu không có quyền
  const fabOnPress = useCallback(() => {
    if (isReadonlySchedule) {
      Alert.alert("Không có quyền", "Bạn chỉ có quyền xem lịch trình.");
      return;
    }
    clearForm();
    setMode('create');
    setSelectedSchedule(null);
    setModalVisible(true);
  }, [clearForm, isReadonlySchedule]);

  // Modal title and submit text
  const modalTitle = mode === 'create' ? 'Tạo lịch mới' : (statusUpdateOnly ? 'Cập nhật trạng thái' : 'Cập nhật lịch');
  const submitText = mode === 'create' ? 'Tạo' : 'Cập nhật';

  const pickerReadonly = isReadonlySchedule && !statusUpdateOnly;
  const fieldReadonly = isReadonlySchedule && !statusUpdateOnly;

  const handleStatusPress = useCallback(() => {
    setStatusPickerVisible(true);
  }, []);

  const handleCloseStatusPicker = useCallback(() => {
    setStatusPickerVisible(false);
  }, []);

  const handleTaskStatusPress = useCallback(() => {
    setTaskStatusPickerVisible(true);
  }, []);

  const handleCloseTaskStatusPicker = useCallback(() => {
    setTaskStatusPickerVisible(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Fixed Header and DateSection */}
      <View className="p-4 bg-white">
        <Header
          onOpenSidebar={() => setSidebarVisible(true)}
          onReminderPress={handleReminderPress}  // Đã cập nhật
          onNotificationPress={handleNotificationPress}
        />
        <DateSection
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </View>

      {/* Scrollable ScheduleSection */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 100 : 20 }}
      >
        <ScheduleSection
          selectedDate={selectedDate}
          onEventPress={handleEventPress}
          onTaskPress={handleTaskPress}
          tasks={filteredTasks}
          refreshing={refreshing}
          onRefresh={onRefresh}
          canCreateOrUpdateSchedule={canCreateOrUpdateSchedule}
          canCreateOrUpdateTasks={canCreateOrUpdateTasks}
          onAddTaskPress={fabTaskOnPress}
        />
      </ScrollView>

      {/* FAB: Disable nếu không có quyền */}
      <TouchableOpacity
        className={`absolute bottom-6 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg ${canCreateOrUpdateSchedule ? 'bg-pink-500' : 'bg-gray-400'}`}
        activeOpacity={0.8}
        onPress={fabOnPress}
        disabled={!canCreateOrUpdateSchedule}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

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
            {isReadonlySchedule ? 'Xem lịch trình' : modalTitle}
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
            disabled={fieldReadonly}
            style={{
              borderColor: fieldReadonly ? "#D1D5DB" : "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: fieldReadonly ? "#F9FAFB" : "#FFFFFF",
            }}
            dropDownContainerStyle={{
              borderColor: "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
            }}
            textStyle={{
              fontSize: 14,
              color: fieldReadonly ? "#9CA3AF" : "#1E293B",
            }}
          />
          {errors.selectedTeacher && (
            <Text className="text-red-500 text-xs mb-2">{errors.selectedTeacher}</Text>
          )}

          <Text className="text-sm font-medium mb-1">Môn học:</Text>
          <TextInput
            placeholder="Môn học"
            value={subject}
            onChangeText={!fieldReadonly ? setSubject : undefined}
            editable={!fieldReadonly}
            className={`border rounded-lg px-3 py-2 mb-2 ${fieldReadonly ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
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
            onPress={!fieldReadonly ? () => setStartTimePickerVisible(true) : undefined}
            disabled={fieldReadonly}
            className={`border rounded-lg px-3 py-2 mb-2 ${fieldReadonly ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-base ${fieldReadonly ? 'text-slate-500' : 'text-slate-800'}`}>
              {startTime ? startTime : "Chọn ngày giờ bắt đầu"}
            </Text>
          </TouchableOpacity>
          {errors.startTime && <Text className="text-red-500 text-xs mb-2">{errors.startTime}</Text>}

          <Text className="text-sm font-medium mb-1">Giờ kết thúc:</Text>
          <TouchableOpacity
            onPress={!fieldReadonly ? () => setEndTimePickerVisible(true) : undefined}
            disabled={fieldReadonly}
            className={`border rounded-lg px-3 py-2 mb-3 ${fieldReadonly ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-base ${fieldReadonly ? 'text-slate-500' : 'text-slate-800'}`}>
              {endTime ? endTime : "Chọn ngày giờ kết thúc"}
            </Text>
          </TouchableOpacity>
          {errors.endTime && <Text className="text-red-500 text-xs mb-2">{errors.endTime}</Text>}

          {/* Status Picker Field - Only show in update mode */}
          {mode === 'update' && (
            <TouchableOpacity
              className={`flex-row items-center p-4 rounded-2xl shadow-sm shadow-black/5 border ${
                pickerReadonly ? "bg-gray-50 border-gray-300" : "bg-white border-gray-300"
              }`}
              onPress={pickerReadonly ? undefined : handleStatusPress}
              activeOpacity={0.7}
              disabled={pickerReadonly}
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color={pickerReadonly ? "#9CA3AF" : "#374151"}
              />
              <Text
                className={`ml-3 text-base ${
                  pickerReadonly ? "text-gray-500" : "text-gray-900"
                }`}
              >
                Trạng thái: {getStatusLabel(statusId)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Delete Button - Only show in update mode with permission */}
          {mode === 'update' && canCreateOrUpdateSchedule && (
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500 p-3 rounded-xl mt-3 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#FFF"  />
              <Text className="text-center text-white font-semibold">Xóa lịch</Text>
            </TouchableOpacity>
          )}

          {(!isReadonlySchedule || statusUpdateOnly) && (
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
              {isReadonlySchedule ? 'Đóng' : 'Hủy'}
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

        {/* Status Picker Modal - Only for update */}
        {mode === 'update' && (
          <NativeModal
            visible={isStatusPickerVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleCloseStatusPicker}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "flex-end",
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={handleCloseStatusPicker}
              />
              <View
                style={{
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  width: screenWidth,
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                  paddingBottom: insets.bottom + 20,
                  minHeight: 250,
                }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    Chọn trạng thái
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseStatusPicker}
                    className="p-2"
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={{ height: 200 }}>
                  <Picker
                    selectedValue={statusId}
                    onValueChange={(value: number) => {
                      setStatusId(value);
                      setStatusPickerVisible(false);
                    }}
                    style={{
                      height: 200,
                    }}
                    mode="dialog"
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <Picker.Item key={value} label={label} value={value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </NativeModal>
        )}
      </Modal>

      {/* Task Management Modal */}
      <Modal
        isVisible={isTaskModalVisible}
        onBackdropPress={() => {
          setTaskModalVisible(false);
          clearTaskForm();
        }}
      >
        <View className="bg-white rounded-2xl p-5">
          <Text className="text-lg font-bold mb-4">
            {isReadonlyTask ? 'Xem nhiệm vụ' : (taskMode === 'create' ? 'Tạo nhiệm vụ mới' : (taskStatusUpdateOnly ? 'Cập nhật trạng thái' : 'Cập nhật nhiệm vụ'))}
          </Text>

          <Text className="text-sm font-medium mb-1">Tiêu đề:</Text>
          <TextInput
            placeholder="Tiêu đề nhiệm vụ"
            value={title}
            onChangeText={!isReadonlyTask ? setTitle : undefined}
            editable={!isReadonlyTask}
            className={`border rounded-lg px-3 py-2 mb-2 ${isReadonlyTask ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          />

          <Text className="text-sm font-medium mb-1">Mô tả:</Text>
          <TextInput
            placeholder="Mô tả"
            value={description}
            onChangeText={!isReadonlyTask ? setDescription : undefined}
            editable={!isReadonlyTask}
            multiline
            numberOfLines={3}
            className={`border rounded-lg px-3 py-2 mb-3 ${isReadonlyTask ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          />

          <Text className="text-sm font-medium mb-1">Hạn chót:</Text>
          <TouchableOpacity
            onPress={!isReadonlyTask ? () => setDueDatePickerVisible(true) : undefined}
            disabled={isReadonlyTask}
            className={`border rounded-lg px-3 py-2 mb-3 ${isReadonlyTask ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'}`}
          >
            <Text className={`text-base ${isReadonlyTask ? 'text-slate-500' : 'text-slate-800'}`}>
              {dueDate ? dueDate : "Chọn ngày giờ hạn chót"}
            </Text>
          </TouchableOpacity>

          {/* Status Picker Field - Always show for tasks, but readonly if needed */}
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-2xl shadow-sm shadow-black/5 border ${
              isReadonlyTask ? "bg-gray-50 border-gray-300" : "bg-white border-gray-300"
            }`}
            onPress={isReadonlyTask ? undefined : handleTaskStatusPress}
            activeOpacity={0.7}
            disabled={isReadonlyTask}
          >
            <Ionicons
              name="flag-outline"
              size={20}
              color={isReadonlyTask ? "#9CA3AF" : "#374151"}
            />
            <Text
              className={`ml-3 text-base ${
                isReadonlyTask ? "text-gray-500" : "text-gray-900"
              }`}
            >
              Trạng thái: {getStatusLabel(taskStatusId)}
            </Text>
          </TouchableOpacity>

          {/* Delete Button - Only show in update mode with permission */}
          {taskMode === 'update' && canCreateOrUpdateTasks && (
            <TouchableOpacity
              onPress={handleTaskDelete}
              className="bg-red-500 p-3 rounded-xl mt-3 flex-row items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#FFF"  />
              <Text className="text-center text-white font-semibold">Xóa nhiệm vụ</Text>
            </TouchableOpacity>
          )}

          {(!isReadonlyTask || taskStatusUpdateOnly) && (
            <TouchableOpacity
              onPress={handleTaskSubmit}
              className="bg-pink-500 p-3 rounded-xl mt-3"
              disabled={taskSubmitting}
            >
              <Text className="text-center text-white font-semibold">
                {taskSubmitting ? 'Đang xử lý...' : (taskMode === 'create' ? 'Tạo' : 'Cập nhật')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mt-2"
            onPress={() => {
              setTaskModalVisible(false);
              clearTaskForm();
            }}
          >
            <Text className="text-center text-slate-500">
              {isReadonlyTask ? 'Đóng' : 'Hủy'}
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDueDatePickerVisible}
          mode="datetime"
          onConfirm={(date) => {
            const uiString = formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
            setDueDate(uiString);
            setDueDatePickerVisible(false);
          }}
          onCancel={() => setDueDatePickerVisible(false)}
        />

        {/* Task Status Picker Modal */}
        {taskMode && (
          <NativeModal
            visible={isTaskStatusPickerVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleCloseTaskStatusPicker}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "flex-end",
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={handleCloseTaskStatusPicker}
              />
              <View
                style={{
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  width: screenWidth,
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                  paddingBottom: insets.bottom + 20,
                  minHeight: 250,
                }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    Chọn trạng thái
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseTaskStatusPicker}
                    className="p-2"
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={{ height: 200 }}>
                  <Picker
                    selectedValue={taskStatusId}
                    onValueChange={(value: number) => {
                      setTaskStatusId(value);
                      setTaskStatusPickerVisible(false);
                    }}
                    style={{
                      height: 200,
                    }}
                    mode="dialog"
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <Picker.Item key={value} label={label} value={value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </NativeModal>
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default ScheduleScreen;