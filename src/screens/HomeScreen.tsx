import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, isToday, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { vi } from 'date-fns/locale';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Home">;


// Interfaces
interface DateItemProps {
  date: string;
  day: string;
  isActive?: boolean;
  onPress: () => void;
}

interface Task {
  title: string;
  time: string;
  icon: string;
}

interface Event {
  title: string;
  date: Date;
  avatars: string[];
  startTime: string;
  endTime: string;
  color?: string;
}

interface User {
  username?: string;
}

// Danh sách công việc (tasks)
const tasks: Task[] = [
  {
    title: 'Làm căn cước công dân tại UBND phường',
    time: '08:00 - 10:00',
    icon: 'https://img.icons8.com/color/48/id-verified.png',
  },
  {
    title: 'Nộp hồ sơ xin việc tại công ty ABC',
    time: '14:00 - 16:00',
    icon: 'https://img.icons8.com/color/48/briefcase.png',
  },
];
// Danh sách sự kiện (events)
const events: Event[] = [
  {
    title: 'Họp với anh Nam (Trưởng phòng)',
    date: new Date(2025, 8, 17),
    avatars: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
    ],
    startTime: '09:00',
    endTime: '10:00',
    color: '#34C759',
  },
  {
    title: 'Thi thử chứng chỉ tiếng Anh',
    date: new Date(2025, 8, 17),
    avatars: [
      'https://randomuser.me/api/portraits/men/21.jpg',
      'https://randomuser.me/api/portraits/women/52.jpg',
    ],
    startTime: '13:30',
    endTime: '15:00',
    color: '#FF3B30',
  },
  {
    title: 'Họp nhóm dự án Study Planner',
    date: new Date(2025, 8, 18),
    avatars: ['https://randomuser.me/api/portraits/men/18.jpg'],
    startTime: '19:00',
    endTime: '20:30',
    color: '#007AFF',
  },
];

// Colors
const colors = {
  pinkPrimary: '#EC4899',
  slateDark: '#1E293B',
  slateLight: '#64748B',
  slateMedium: '#475569',
  pinkBg: '#F472B6',
  purplePrimary: '#A855F7',
  pinkLight: '#FBCFE8',
  blue400: '#60A5FA',
  purple400: '#A78BFA',
  white: '#FFFFFF',
  calendarBg: '#F1F5F9',
  border: '#E5E7EB',
};

// Generate dynamic dates for the current week
const generateWeekDates = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date: format(date, 'dd'),
      day: format(date, 'EEE', { locale: vi }),
      fullDate: date,
      isActive: isToday(date),
    };
  });
};

// Chia khung giờ: 00:00 → 23:00
const generateTimeSlots = () => {
  const times: string[] = [];
  for (let i = 0; i < 24; i++) {
    times.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return times;
};

// Chuyển HH:mm → phút trong ngày
const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Tính top và height của event block
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

// DateItem Component
const DateItem: React.FC<DateItemProps> = ({ date, day, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center mr-4 w-16 rounded-xl p-2 ${isActive ? 'bg-pink-100' : ''
        }`}
    >
      <Text
        className={`text-lg font-semibold ${isActive ? 'text-pink-500 font-bold text-xl' : 'text-slate-800'
          }`}
      >
        {date}
      </Text>
      <Text
        className={`text-sm ${isActive ? 'text-pink-500 font-medium' : 'text-slate-500'
          }`}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};
const FloatingButton: React.FC = () => {
  return (
    <TouchableOpacity
      className="absolute bottom-6 right-6 bg-pink-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      activeOpacity={0.8}
      onPress={() => {
        console.log('Tạo lịch mới');
      }}
    >
      <Icon name="add" size={32} color={colors.white} />
    </TouchableOpacity>
  );
};
// DateSection sửa điều kiện isActive

// DateSection Component
const DateSection: React.FC<{ selectedDate: Date; onDateSelect: (date: Date) => void }> = ({
  selectedDate,
  onDateSelect,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const dates = generateWeekDates(currentWeekStart);

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
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <TouchableOpacity onPress={handlePrevWeek}>
          <Icon name="chevron-back-outline" size={26} color={colors.slateMedium} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
          <Text className="text-lg font-semibold text-slate-800 uppercase width-[200px] text-center">
            {format(currentWeekStart, 'MMMM yyyy', { locale: vi })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextWeek}>
          <Icon name="chevron-forward-outline" size={26} color={colors.slateMedium} />
        </TouchableOpacity>
      </View>

      {/* ScrollView tuần */}
      <ScrollView
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

      {/* DatePicker Modal */}
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

// Header Component
// Thay trong HomeScreen.tsx

// Header Component
const Header: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const auth = useSelector((state: RootState) => state.auth);
  console.log(
    "Avatar URL:",
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      auth.user?.username || "User"
    )}&background=6366F1&color=fff`
  );

  return (
    <View className="flex-row items-center justify-between mb-4">
      {/* Logo + tên app */}

      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={onOpenSidebar}>
          <Icon name="menu-outline" size={30} color={colors.slateDark} />
        </TouchableOpacity>
        <Image
          source={require('../../assets/study_planner_logo.png')} // logo app
          className="w-10 h-10"
        />
        <Text className="text-2xl font-bold text-slate-800">Study Planner</Text>
      </View>

      {/* Nút menu + avatar */}
      <View className="flex-row items-center relative">

        <LinearGradient
          colors={[colors.blue400, colors.purple400, colors.pinkLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 40, height: 40, borderRadius: 16, padding: 2 }} // 🔥 dùng style thay vì className cho kích thước cố định
        >
          <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  auth.user?.username || 'User'
                )}&background=6366F1&color=fff`,
              }}
              style={{ width: '100%', height: '100%' }} // ✅ fill toàn bộ container
              resizeMode="cover"
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
          </View>
        </LinearGradient>

        <View className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full" />
      </View>
    </View>
  );
};

// SetScheduleButton Component
const SetScheduleButton: React.FC = () => {
  return (
    <LinearGradient
      colors={[colors.pinkPrimary, colors.pinkBg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="rounded-full my-4"
    >
      <TouchableOpacity className="py-4 px-8">
        <Text className="text-xl font-medium text-white text-center">Tạo lịch</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

// EventList Component
const ScheduleSection: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
  const timeSlots = generateTimeSlots();
  const slotHeight = 60;

  const filteredEvents = events.filter((event) =>
    isSameDay(event.date, selectedDate)
  );

  // Sắp xếp theo giờ bắt đầu
  filteredEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <View className="bg-white rounded-xl p-3">
      <Text className="text-lg font-semibold text-slate-800 mb-3">
        Lịch cho {format(selectedDate, 'dd MMMM yyyy', { locale: vi })}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="max-h-[45vh]">
        <View className="flex-row relative">
          {/* Cột giờ */}
          <View className="w-16 mr-2">
            {timeSlots.map((time, index) => (
              <View key={index} style={{ height: slotHeight }}>
                <Text className="text-sm text-slate-500">{time}</Text>
              </View>
            ))}
          </View>

          {/* Lưới timeline */}
          <View className="flex-1 border-l border-slate-200">
            {timeSlots.map((_, index) => (
              <View
                key={index}
                className="border-b border-slate-100"
                style={{ height: slotHeight }}
              />
            ))}
          </View>

          {/* Events */}
          <View className="absolute left-16 right-0 top-0 bottom-0">
            {filteredEvents.map((event, index) => {
              const { top, height } = getEventPositionAndHeight(
                event.startTime,
                event.endTime,
                slotHeight
              );

              return (
                <View
                  key={index}
                  className="absolute rounded-lg p-2 shadow-md"
                  style={{
                    top,
                    height: Math.max(height, 40),
                    left: 4,
                    right: 8,
                    backgroundColor: event.color || '#007AFF',
                  }}
                >
                  <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text className="text-xs text-white/80 mb-1">
                    {event.startTime} - {event.endTime}
                  </Text>
                  <View className="flex-row -space-x-1">
                    {event.avatars.map((avatar, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: avatar }}
                        className="w-4 h-4 rounded-full border border-white"
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Reminder Component
const Reminder: React.FC = () => {
  return (
    <View className="my-4">
      <Text className="text-lg font-semibold text-slate-800 mb-2">Nhắc nhở</Text>
      <Text className="text-sm text-slate-600">Đừng quên lịch cho ngày mai nhé!</Text>
    </View>
  );
};

// TaskCard Component
const TaskCard: React.FC<Task> = ({ title, time, icon }) => {
  return (
    <View className="bg-purple-500 rounded-xl p-3 flex-row items-center gap-3">
      <View className="w-12 h-12 flex-shrink-0">
        <Image source={{ uri: icon }} className="w-full h-full" resizeMode="contain" />
      </View>
      <View className="flex-1">
        <Text className="text-sm text-white mb-1">{title}</Text>
        <View className="flex-row items-center gap-2">
          <Image
            source={{ uri: 'https://img.icons8.com/color/48/calendar--v1.png' }}
            className="w-4 h-4"
          />
          <Text className="text-sm text-white">{time}</Text>
        </View>
      </View>
    </View>
  );
};

// TaskCards Component
const TaskCards: React.FC = () => {
  return (
    <View className="gap-3 my-4">
      {tasks.map((task, index) => (
        <TaskCard key={index} title={task.title} time={task.time} icon={task.icon} />
      ))}
    </View>
  );
};

// HomeScreen Component
const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigation = useNavigation<AuthNav>();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="p-4">
            <Header onOpenSidebar={() => setSidebarVisible(true)} />
            <DateSection selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            <ScheduleSection selectedDate={selectedDate} />
            <Reminder />
            <TaskCards />
          </View>
        </ScrollView>

        {/* Floating button */}
        <FloatingButton />
      </View>

      {/* Sidebar Modal giữ nguyên */}
      <Modal
        isVisible={sidebarVisible}
        onBackdropPress={() => setSidebarVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-start', alignItems: 'flex-start' }}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
      >
        <SafeAreaView className="bg-white w-[70%] h-full">
          {/* Header */}
          <View className="flex-row items-center px-5 py-4 border-b border-slate-200">
            <Image
              source={require('../../assets/study_planner_logo.png')}
              className="w-8 h-8 mr-2"
            />
            <Text className="text-xl font-bold text-slate-800">Study Planner</Text>
          </View>

          {/* Menu items */}
          <View className="flex-1 mt-4">
            <TouchableOpacity
              className="flex-row items-center px-5 py-3 rounded-r-full active:bg-slate-100"
              onPress={() => console.log('Hồ sơ')}
            >
              <Icon name="person-outline" size={24} color={colors.slateDark} />
              <Text className="ml-4 text-base text-slate-800">Hồ sơ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-5 py-3 rounded-r-full active:bg-slate-100"
              onPress={() => console.log('Cài đặt')}
            >
              <Icon name="settings-outline" size={24} color={colors.slateDark} />
              <Text className="ml-4 text-base text-slate-800">Cài đặt</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            className="flex-row items-center px-5 py-4 border-t border-slate-200"
            onPress={() => {
              dispatch(logout());
              setSidebarVisible(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }}
          >
            <Icon name="log-out-outline" size={24} color="#EA4335" />
            <Text className="ml-4 text-base text-red-500 font-medium">Đăng xuất</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>


    </SafeAreaView>
  );
};
export default HomeScreen;