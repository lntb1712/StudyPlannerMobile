// src/components/AssignmentSelector.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { TeacherClassResponseDTO } from "../domain/entities/TeacherClassDTO/TeacherClassResponseDTO";

interface AssignmentSelectorProps {
  isTeacher: boolean;
  selectorList: TeacherClassResponseDTO[];
  onSelectClass: (classId: string, className: string) => void;
  onSelectTeacher: (teacherId: string, teacherName: string) => void;
  tcLoading: boolean;
}

const AssignmentSelector: React.FC<AssignmentSelectorProps> = ({
  isTeacher,
  selectorList,
  onSelectClass,
  onSelectTeacher,
  tcLoading,
}) => {
  const renderSelectorItem = ({ item, index }: { item: TeacherClassResponseDTO; index: number }) => {
    const key = isTeacher ? (item.ClassId?.toString() || index.toString()) : (item.TeacherId?.toString() || index.toString());
    return (
      <TouchableOpacity
        key={key} // Unique key
        className="bg-white p-4 rounded-2xl mb-3 shadow-md border border-gray-200 active:bg-gray-50"
        onPress={() => {
          if (isTeacher) {
            onSelectClass(item.ClassId?.toString() || '', `Lớp ${item.ClassId}`);
          } else {
            onSelectTeacher(item.TeacherId?.toString() || '', item.TeacherName || '');
          }
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Chọn ${isTeacher ? 'lớp' : 'giáo viên'} ${isTeacher ? `Lớp ${item.ClassId}` : item.TeacherName}`}
      >
        <View className="flex-row items-center">
          <View className={`w-14 h-14 rounded-full justify-center items-center mr-4 ${isTeacher ? 'bg-blue-500' : 'bg-green-500'}`}>
            <Icon name={isTeacher ? "school-outline" : "person-outline"} size={28} color="#FFF" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {isTeacher ? `Lớp ${item.ClassId}` : item.TeacherName}
            </Text>
            {isTeacher && (
              <Text className="text-sm text-gray-600 mt-1">
                {item.ClassId || `Lớp học ${item.ClassId}`}
              </Text>
            )}
          </View>
          <Icon name="chevron-forward" size={24} color="#D1D5DB" />
        </View>
      </TouchableOpacity>
    );
  };

  if (tcLoading) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 font-medium mt-4">Đang tải danh sách...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
        <Text className="text-2xl font-bold mb-2 text-gray-800">
          Chọn {isTeacher ? "lớp" : "giáo viên"}
        </Text>
        <Text className="text-sm text-gray-600">
          Chọn một lớp hoặc giáo viên để xem bài tập
        </Text>
      </View>
      <FlatList
        data={selectorList}
        renderItem={renderSelectorItem}
        keyExtractor={(item, index) =>
          (isTeacher ? (item.ClassId?.toString() || index.toString()) : (item.TeacherId?.toString() || index.toString()))
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-12 px-4">
            <Icon name="search-outline" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-gray-500 text-center text-lg font-medium">Chưa có lớp/giáo viên nào</Text>
            <Text className="mt-2 text-gray-400 text-center text-sm">Kéo để làm mới hoặc kiểm tra kết nối</Text>
          </View>
        }
      />
    </View>
  );
};

export default AssignmentSelector;