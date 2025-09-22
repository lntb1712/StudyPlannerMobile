// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState, AppDispatch } from "../store";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import {
  parse,
  isValid,
  format,
  addDays,
  isToday,
  startOfWeek,
  addWeeks,
  subWeeks,
  getDay,
} from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { vi } from "date-fns/locale";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { createSchedule, fetchSchedules, updateSchedule } from "../store/slices/scheduleSlice";
import { ScheduleResponseDTO } from "../domain/entities/ScheduleDTO/ScheduleResponseDTO";
import { fetchTeachersByClassId } from "../store/slices/teacherClassSlice";
import { TeacherClassResponseDTO } from "../domain/entities/TeacherClassDTO/TeacherClassResponseDTO";
import DropDownPicker from "react-native-dropdown-picker";

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const colors = {
  pinkPrimary: "#EC4899",
  slateDark: "#1E293B",
  slateLight: "#64748B",
  slateMedium: "#475569",
  pinkBg: "#F472B6",
  purplePrimary: "#A855F7",
  pinkLight: "#FBCFE8",
  blue400: "#60A5FA",
  purple400: "#A78BFA",
  white: "#FFFFFF",
};

// Generate dynamic dates for the current week
const generateWeekDates = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date: format(date, "dd"),
      day: format(date, "EEE", { locale: vi }),
      fullDate: date,
      isActive: isToday(date),
    };
  });
};

// Generate 24 hours slots
const generateTimeSlots = () => {
  const times: string[] = [];
  for (let i = 0; i < 24; i++) {
    times.push(`${i.toString().padStart(2, "0")}:00`);
  }
  return times;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getEventPositionAndHeight = (
  startTime: string,
  endTime: string,
  slotHeight: number
) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;

  const top = (startMinutes / 60) * slotHeight;
  const height = (duration / 60) * slotHeight;

  return { top, height };
};

const DateItem: React.FC<{
  date: string;
  day: string;
  isActive?: boolean;
  onPress: () => void;
}> = ({ date, day, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center mr-4 w-16 rounded-xl p-2 ${isActive ? "bg-pink-100" : ""
        }`}
    >
      <Text
        className={`text-lg font-semibold ${isActive ? "text-pink-500 font-bold text-xl" : "text-slate-800"
          }`}
      >
        {date}
      </Text>
      <Text
        className={`text-sm ${isActive ? "text-pink-500 font-medium" : "text-slate-500"
          }`}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

import { Dimensions } from "react-native";

const DateSection: React.FC<{
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}> = ({ selectedDate, onDateSelect }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const dates = generateWeekDates(currentWeekStart);
  const ITEM_WIDTH = 64; // w-16
  const SCREEN_WIDTH = Dimensions.get("window").width;

  useEffect(() => {
    const index = dates.findIndex(
      (d) => d.fullDate.toDateString() === selectedDate.toDateString()
    );
    if (index !== -1 && scrollRef.current) {
      const scrollX = index * ITEM_WIDTH - SCREEN_WIDTH / 2 + ITEM_WIDTH / 2;
      scrollRef.current.scrollTo({ x: Math.max(scrollX, 0), animated: true });
    }
  }, [selectedDate, dates]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleConfirm = (date: Date) => {
    setDatePickerVisible(false);
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    onDateSelect(date);
  };

  return (
    <View className="my-2">
      <View className="flex-row justify-between items-center mb-2">
        <TouchableOpacity onPress={handlePrevWeek}>
          <Icon name="chevron-back-outline" size={26} color={colors.slateMedium} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
          <Text className="text-lg font-semibold text-slate-800 uppercase w-[200px] text-center">
            {format(currentWeekStart, "MMMM yyyy", { locale: vi })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextWeek}>
          <Icon
            name="chevron-forward-outline"
            size={26}
            color={colors.slateMedium}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {dates.map((item, index) => (
          <DateItem
            key={index}
            date={item.date}
            day={item.day}
            isActive={item.fullDate.toDateString() === selectedDate.toDateString()}
            onPress={() => onDateSelect(item.fullDate)}
          />
        ))}
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisible(false)}
        date={selectedDate}
        locale="vi"
      />
    </View>
  );
};


const Header: React.FC<{ onOpenSidebar: () => void; onReminderPress: () => void; onNotificationPress: () => void }> = ({ onOpenSidebar, onReminderPress, onNotificationPress }) => {
  const auth = useSelector((state: RootState) => state.auth);

  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={onOpenSidebar}>
          <Icon name="menu-outline" size={30} color={colors.slateDark} />
        </TouchableOpacity>
        <Image
          source={require("../../assets/study_planner_logo.png")}
          className="w-10 h-10"
        />
        <Text className="text-2xl font-bold text-slate-800">Study Planner</Text>
      </View>

      <View className="flex-row items-center gap-3 relative">
        {/* Reminder Icon */}
        <TouchableOpacity
          onPress={onReminderPress}
          className="bg-pink-500 w-10 h-10 rounded-full items-center justify-center shadow-lg"
          activeOpacity={0.8}
        >
          <Icon name="calendar-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Notification Bell Icon */}
        <TouchableOpacity
          onPress={onNotificationPress}
          className="relative"
          activeOpacity={0.8}
        >
          <Icon name="notifications-outline" size={24} color={colors.slateDark} />
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        </TouchableOpacity>

        {/* Avatar */}
        <LinearGradient
          colors={[colors.blue400, colors.purple400, colors.pinkLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 40, height: 40, borderRadius: 16, padding: 2 }}
        >
          <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  auth.user?.username || "User"
                )}&background=6366F1&color=fff`,
              }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const ScheduleSection: React.FC<{ 
  selectedDate: Date; 
  onEventPress: (event: ScheduleResponseDTO) => void;
}> = ({ selectedDate, onEventPress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { schedules, loading, error } = useSelector(
    (state: RootState) => state.schedule
  );
  const auth = useSelector((state: RootState) => state.auth);

  const timeSlots = generateTimeSlots();
  const slotHeight = 60;
  const TIMEZONE = "Asia/Ho_Chi_Minh";

  useEffect(() => {
    if (auth.user?.username) {
      dispatch(fetchSchedules(auth.user.username));
    }
  }, [dispatch, auth.user]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  const selectedDayOfWeek = getDay(selectedDate);
  const parseDateTime = (value?: string) => {
    if (!value) return null;

    try {
      const parsed = parse(value, "dd/MM/yyyy HH:mm:ss", new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleRefresh = () => {
    if (auth.user?.username) {
      dispatch(fetchSchedules(auth.user.username));
    }
  };
  const colors = ["#007AFF", "#34D399", "#F59E0B", "#EF4444", "#8B5CF6"];
  const filteredEvents = schedules.filter(
    (event) => (event.DayOfWeek || 0) === selectedDayOfWeek
  );

  filteredEvents.sort((a, b) => {
    const startA = parseDateTime(a.StartTime)?.getTime() ?? 0;
    const startB = parseDateTime(b.StartTime)?.getTime() ?? 0;
    return startA - startB;
  });

  return (
    <View className="bg-white rounded-xl p-3">
      <Text className="text-lg font-semibold text-slate-800 mb-3">
        Lịch cho {format(selectedDate, "dd MMMM yyyy", { locale: vi })}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="max-h-[60vh]"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <View className="flex-row relative">
          <View className="w-16 mr-2">
            {timeSlots.map((time, index) => (
              <View key={index} style={{ height: slotHeight }}>
                <Text className="text-sm text-slate-500">{time}</Text>
              </View>
            ))}
          </View>

          <View className="flex-1 border-l border-slate-200">
            {timeSlots.map((_, index) => (
              <View
                key={index}
                className="border-b border-slate-100"
                style={{ height: slotHeight }}
              />
            ))}
          </View>

          <View className="absolute left-16 right-0 top-0 bottom-0">
            {filteredEvents.map((event, index) => {
              const start = parseDateTime(event.StartTime);
              const end = parseDateTime(event.EndTime);

              const startHHmm = start ? format(start, "HH:mm") : "00:00";
              const endHHmm = end ? format(end, "HH:mm") : "00:00";

              const { top, height } = getEventPositionAndHeight(
                startHHmm,
                endHHmm,
                slotHeight
              );

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => onEventPress(event)}
                  style={{
                    position: "absolute",
                    top,
                    height: Math.max(height, 60),
                    left: 4,
                    right: 8,
                    backgroundColor: colors[index % colors.length],
                    borderRadius: 8,
                    padding: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    zIndex: 1,
                  }}
                >
                  <Text
                    className="text-sm font-semibold text-white"
                    numberOfLines={1}
                  >
                    {event.Subject || "Sự kiện"}
                  </Text>
                  <Text className="text-xs text-white/80 mb-1">
                    {start ? format(start, "HH:mm") : "??"} -{" "}
                    {end ? format(end, "HH:mm") : "??"}
                  </Text>
                  <Text className="text-xs text-white/90">
                    {event.TeacherName || ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigation = useNavigation<AuthNav>();
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
  const clearForm = useCallback(() => {
    setSubject("");
    setStartTime("");
    setEndTime("");
    setSelectedTeacher(null);
    setSelectedTeacherId(null);
  }, []);

const handleReminderPress = useCallback(() => {
    clearForm();
    setMode('create');
    setSelectedSchedule(null);
    setModalVisible(true);
  }, [clearForm]);

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
      setStartTime(`${dateStr} ${timeStr}`);
    }

    const end = parseDateTime(event.EndTime);
    if (end) {
      const dateStr = format(selectedDate, "dd/MM/yyyy");
      const timeStr = format(end, "HH:mm");
      setEndTime(`${dateStr} ${timeStr}`);
    }

    setSubject(event.Subject || "");
    setSelectedTeacherId(event.TeacherId || null);
    setMode('update');
    setModalVisible(true);
  }, [selectedDate]);

  const handleSubmit = useCallback(() => {
    if (!classId) {
      Alert.alert("Lỗi", "Không có thông tin lớp học.");
      return;
    }
    if (!subject || !selectedTeacher || !startTime || !endTime) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
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
      TeacherId: selectedTeacher.TeacherId,
      Subject: subject,
      DayOfWeek: dayOfWeek,
      StartTime: startTime,
      EndTime: endTime,
      StatusId: 1,
      CreatedAt: mode === 'create' ? format(new Date(), "dd/MM/yyyy HH:mm:ss") : selectedSchedule!.CreatedAt,
      UpdatedAt: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    };

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
      });
  }, [dispatch, mode, selectedSchedule, auth.user, classId, subject, selectedTeacher, startTime, endTime, clearForm]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="p-4">
            <Header 
              onOpenSidebar={() => setSidebarVisible(true)} 
              onReminderPress={handleReminderPress}
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

        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-pink-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          activeOpacity={0.8}
          onPress={() => {
            clearForm();
            setMode('create');
            setSelectedSchedule(null);
            setModalVisible(true);
          }}
        >
          <Icon name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={sidebarVisible}
        onBackdropPress={() => setSidebarVisible(false)}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        style={{ margin: 0 }} // full màn hình
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* Sidebar */}
          <SafeAreaView style={{ width: "70%", height: "100%", backgroundColor: "white" }}>
            <View className="flex-row items-center px-5 py-4 border-b border-slate-200">
              <Image
                source={require("../../assets/study_planner_logo.png")}
                className="w-8 h-8 mr-2"
              />
              <Text className="text-xl font-bold text-slate-800">Study Planner</Text>
            </View>

            <View className="flex-1 mt-4">
              <TouchableOpacity
                className="flex-row items-center px-5 py-3 rounded-r-full active:bg-slate-100"
                onPress={() => console.log("Hồ sơ")}
              >
                <Icon name="person-outline" size={24} color={colors.slateDark} />
                <Text className="ml-4 text-base text-slate-800">Hồ sơ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center px-5 py-3 rounded-r-full active:bg-slate-100"
                onPress={() => console.log("Cài đặt")}
              >
                <Icon name="settings-outline" size={24} color={colors.slateDark} />
                <Text className="ml-4 text-base text-slate-800">Cài đặt</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center px-5 py-4 border-t border-slate-200"
              onPress={async () => {
                try {
                  await dispatch(logout()).unwrap(); // chờ logout xong
                  setSidebarVisible(false);
                  navigation.replace("Login");
                } catch (err) {
                  console.error("Logout failed:", err);
                }
              }}

            >
              <Icon name="log-out-outline" size={24} color="#EA4335" />
              <Text className="ml-4 text-base text-red-500 font-medium">Đăng xuất</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* khoảng trống bên phải để bắt backdrop click */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSidebarVisible(false)} />
        </View>
      </Modal>


      {/* Modal for Create/Update */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <View className="bg-white rounded-2xl p-5">
          <Text className="text-lg font-bold mb-4">
            {mode === 'create' ? 'Tạo lịch mới' : 'Cập nhật lịch'}
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
            style={{
              borderColor: "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 12,
              backgroundColor: "#FFFFFF",
            }}
            dropDownContainerStyle={{
              borderColor: "#D1D5DB",
              borderWidth: 1,
              borderRadius: 8,
            }}
            textStyle={{
              fontSize: 14,
              color: "#1E293B",
            }}
          />
          <Text className="text-sm font-medium mb-1">Môn học:</Text>
          <TextInput
            placeholder="Môn học"
            value={subject}
            onChangeText={setSubject}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
          />

          <Text className="text-sm font-medium mb-1">Mã lớp học:</Text>
          <TextInput
            value={classId}
            editable={false}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-gray-100"
          />

          <Text className="text-sm font-medium mb-1">Giờ bắt đầu:</Text>
          <TouchableOpacity
            onPress={() => setStartTimePickerVisible(true)}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
          >
            <Text className="text-base text-slate-800">
              {startTime ? startTime : "Chọn ngày giờ bắt đầu"}
            </Text>
          </TouchableOpacity>

          <Text className="text-sm font-medium mb-1">Giờ kết thúc:</Text>
          <TouchableOpacity
            onPress={() => setEndTimePickerVisible(true)}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3 bg-white"
          >
            <Text className="text-base text-slate-800">
              {endTime ? endTime : "Chọn ngày giờ kết thúc"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-pink-500 p-3 rounded-xl mt-3"
          >
            <Text className="text-center text-white font-semibold">
              {mode === 'create' ? 'Tạo' : 'Cập nhật'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-2"
            onPress={() => {
              setModalVisible(false);
              clearForm();
            }}
          >
            <Text className="text-center text-slate-500">Hủy</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isStartTimePickerVisible}
          mode="datetime"
          onConfirm={(date) => {
            // Save UI string in dd/MM/yyyy HH:mm:ss
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