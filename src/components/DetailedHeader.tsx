// src/components/DetailedHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface DetailedHeaderProps {
  classId?: string;
  className?: string;
  teacherId?: string;
  teacherName?: string;
  onBack: () => void;
}

const DetailedHeader: React.FC<DetailedHeaderProps> = ({
  classId,
  className,
  teacherId,
  teacherName,
  onBack,
}) => {
  const title = classId ? className : teacherName;

  return (
    <View className="bg-white p-4 border-b border-gray-200">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-4 p-2">
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">{title}</Text>
      </View>
    </View>
  );
};

export default DetailedHeader;