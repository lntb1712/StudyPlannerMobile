// src/components/DateItem.tsx
import React from "react";
import { TouchableOpacity, Text } from "react-native";

type DateItemProps = {
  date: string;
  day: string;
  isActive?: boolean;
  onPress: () => void;
};

const DateItem: React.FC<DateItemProps> = ({ date, day, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center mr-4 w-16 rounded-xl p-2 ${isActive ? "bg-pink-100" : ""}`}
    >
      <Text
        className={`text-lg font-semibold ${isActive ? "text-pink-500 font-bold text-xl" : "text-slate-800"}`}
      >
        {date}
      </Text>
      <Text
        className={`text-sm ${isActive ? "text-pink-500 font-medium" : "text-slate-500"}`}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

export default DateItem;