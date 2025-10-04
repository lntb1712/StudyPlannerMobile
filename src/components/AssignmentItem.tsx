// src/components/AssignmentItem.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AssignmentResponseDTO } from "../domain/entities/AssignmentDTO/AssignmentResponseDTO";
import { AssignmentDetailResponseDTO } from "../domain/entities/AssignmentDetailDTO/AssignmentDetailResponseDTO";

interface Props {
  item: AssignmentResponseDTO;
  userId: string;
  isTeacher: boolean;
  canManageDetail: boolean;
  isReadonlyForAssignment: boolean;
  detailLoading: boolean;
  onEditAssignment: (assignment: AssignmentResponseDTO) => void;
  onDeleteAssignment: (assignment: AssignmentResponseDTO) => void;
  onSubmitDetail: (assignmentId: number) => void;
  onEditDetail: (detail: AssignmentDetailResponseDTO) => void;
  isOverdue: (deadlineStr: string) => boolean;
  onViewAllDetails?: (assignmentId: number) => void;
  getStudentDetail?: (
    assignmentId: number
  ) => AssignmentDetailResponseDTO | undefined;
}

const AssignmentItem: React.FC<Props> = ({
  item,
  userId,
  isTeacher,
  canManageDetail,
  isReadonlyForAssignment,
  detailLoading,
  onEditAssignment,
  onDeleteAssignment,
  onSubmitDetail,
  onEditDetail,
  isOverdue,
  onViewAllDetails,
  getStudentDetail,
}) => {
  const detail = getStudentDetail
    ? getStudentDetail(item.AssignmentId)
    : undefined;
  const isSubmitted = !!detail;
  const grade = detail?.Grade?.toString();
  const isOwn = item.TeacherId.toString() === userId;
  const showSubmit =
    !isTeacher && !isOverdue(item.Deadline || "") && !isSubmitted;
  const canEditSubmission = !isTeacher && isSubmitted && !grade && !isOverdue(item.Deadline || "");

  return (
    <View className="mb-4 p-4 bg-white rounded-xl shadow-md">
      {/* Assignment Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{item.Title}</Text>
          <Text className="text-sm text-gray-600 mt-1">{item.Description}</Text>
          <Text className="text-xs text-gray-500 mt-2">
            Hạn chót: {item.Deadline}
            {isOverdue(item.Deadline || "") && (
              <Text className="text-red-500 ml-1"> (Quá hạn)</Text>
            )}
          </Text>
        </View>
        {isTeacher && onViewAllDetails && (
          <TouchableOpacity
            onPress={() => onViewAllDetails(item.AssignmentId)}
            className="ml-3 p-2"
          >
            <Icon name="eye-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-between items-center">
        {!isReadonlyForAssignment && (
          <TouchableOpacity
            onPress={() => onEditAssignment(item)}
            className="flex-row items-center px-4 py-2 bg-blue-100 rounded-lg"
          >
            <Icon name="create-outline" size={16} color="#3B82F6" />
            <Text className="text-blue-600 font-medium">Sửa</Text>
          </TouchableOpacity>
        )}
        {isTeacher && (
          <TouchableOpacity
            onPress={() => onDeleteAssignment(item)}
            className="flex-row items-center px-4 py-2 bg-red-100 rounded-lg"
          >
            <Icon name="trash-outline" size={16} color="#EF4444" />
            <Text className="text-red-600 font-medium">Xóa</Text>
          </TouchableOpacity>
        )}
        {!isTeacher && (
          <>
            {showSubmit ? (
              <TouchableOpacity
                onPress={() => onSubmitDetail(item.AssignmentId)}
                className="px-6 py-3 bg-green-500 rounded-lg"
                disabled={detailLoading}
              >
                <Text className="text-white font-semibold">
                  {detailLoading ? "Đang tải..." : "Nộp bài"}
                </Text>
              </TouchableOpacity>
            ) : (
              isSubmitted && (
                <View className="flex-row items-center space-x-4">
                  <View className="flex-row items-center">
                    <Icon
                      name={grade ? "checkmark-circle" : "time-outline"}
                      size={16}
                      color={grade ? "#10B981" : "#F59E0B"}
                    />
                    <Text
                      className={`ml-1 font-medium ${grade ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {grade ? `Điểm: ${grade}` : "Chờ điểm"}
                    </Text>
                  </View>
                  {canEditSubmission && (
                    <TouchableOpacity
                      onPress={() => onSubmitDetail(item.AssignmentId)}
                      className="px-4 py-2 bg-yellow-100 rounded-lg"
                      disabled={detailLoading}
                    >
                      <Text className="text-yellow-800 font-medium">
                        Chỉnh sửa bài nộp
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AssignmentItem;