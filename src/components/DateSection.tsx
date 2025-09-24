// src/components/DateSection.tsx
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format, startOfWeek, addWeeks, subWeeks, addDays, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { Dimensions } from "react-native";
import DateItem from "./DateItem";

type DateSectionProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

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

const DateSection: React.FC<DateSectionProps> = ({ selectedDate, onDateSelect }) => {
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
          <Icon name="chevron-back-outline" size={26} color="#64748B" />
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
            color="#64748B"
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

export default DateSection;