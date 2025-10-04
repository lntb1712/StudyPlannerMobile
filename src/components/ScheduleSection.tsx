// src/components/ScheduleSection.tsx
import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { ScheduleResponseDTO } from "../domain/entities/ScheduleDTO/ScheduleResponseDTO";
import { TaskManagementResponseDTO } from "../domain/entities/TaskManagementDTO/TaskManagementResponseDTO";
import { parse, isValid, format, getDay } from "date-fns";
import { vi } from "date-fns/locale";

type ScheduleSectionProps = {
  selectedDate: Date;
  onEventPress: (event: ScheduleResponseDTO) => void;
  onTaskPress: (task: TaskManagementResponseDTO) => void;
  tasks: TaskManagementResponseDTO[];
  refreshing: boolean;
  onRefresh: () => void;
  canCreateOrUpdateSchedule: boolean;
  canCreateOrUpdateTasks: boolean;
  onAddTaskPress: () => void;
};

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

const ScheduleSection: React.FC<ScheduleSectionProps> = ({ selectedDate, onEventPress, onTaskPress, tasks, refreshing, onRefresh, canCreateOrUpdateSchedule, canCreateOrUpdateTasks, onAddTaskPress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { schedules, error } = useSelector(
    (state: RootState) => state.schedule
  );
  const auth = useSelector((state: RootState) => state.auth);

  const timeSlots = generateTimeSlots();
  const slotHeight = 60;

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  const parseDateTime = (value?: string) => {
    if (!value) return null;

    try {
      const parsed = parse(value, "dd/MM/yyyy HH:mm:ss", new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const colors = ["#007AFF", "#34D399", "#F59E0B", "#EF4444", "#8B5CF6"];
  const selectedDayOfWeek = getDay(selectedDate);
  const filteredEvents = schedules.filter(
    (event) => (event.DayOfWeek || 0) === selectedDayOfWeek
  );

  filteredEvents.sort((a, b) => {
    const startA = parseDateTime(a.StartTime)?.getTime() ?? 0;
    const startB = parseDateTime(b.StartTime)?.getTime() ?? 0;
    return startA - startB;
  });

  return (
    <>
      <View className="bg-white rounded-xl p-3">
        <Text className="text-lg font-semibold text-slate-800 mb-3">
          Lịch cho {format(selectedDate, "dd MMMM yyyy", { locale: vi })}
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

      {/* Tasks Section - Only show if canCreateOrUpdateTasks */}
      {canCreateOrUpdateTasks && (
        <View className="mt-4 bg-white rounded-xl p-3">
          <Text className="text-lg font-semibold text-slate-800 mb-3">Nhiệm vụ hôm nay</Text>
          {tasks.length === 0 ? (
            <Text className="text-center text-slate-500 py-4">Không có nhiệm vụ nào</Text>
          ) : (
            tasks.map((task) => {
              const due = parseDateTime(task.DueDate);
              const dueTime = due ? format(due, "HH:mm") : "";
              return (
                <TouchableOpacity
                  key={task.TaskId}
                  activeOpacity={0.7}
                  onPress={() => onTaskPress(task)}
                  className="p-3 border border-slate-200 rounded-lg mb-2 bg-blue-50"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-800">{task.Title}</Text>
                      <Text className="text-sm text-slate-600 mb-1">{task.Description}</Text>
                      <Text className="text-xs text-slate-500">Hạn: {dueTime}</Text>
                    </View>
                    <View className="ml-2">
                      <Text className={`text-xs px-2 py-1 rounded-full ${task.StatusId === 3 ? 'bg-green-200 text-green-800' : task.StatusId === 4 ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                        {task.StatusName}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <TouchableOpacity
            onPress={onAddTaskPress}
            className="bg-blue-500 p-3 rounded-lg mt-2"
            activeOpacity={0.7}
          >
            <Text className="text-center text-white font-semibold">+ Thêm nhiệm vụ</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default ScheduleSection;