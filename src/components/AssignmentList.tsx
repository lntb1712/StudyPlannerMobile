// src/components/AssignmentList.tsx
import React from "react";
import { FlatList, View, Text, RefreshControl } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AssignmentResponseDTO } from "../domain/entities/AssignmentDTO/AssignmentResponseDTO";
import AssignmentItem from "./AssignmentItem";
import { AssignmentDetailResponseDTO } from "../domain/entities/AssignmentDetailDTO/AssignmentDetailResponseDTO";

interface AssignmentListProps {
  assignments: AssignmentResponseDTO[];
  userId: string;
  isTeacher: boolean;
  canManageDetail: boolean;
  isReadonlyForAssignment: boolean;
  detailLoading: boolean;
  onRefresh: () => void;
  assignmentLoading: boolean;
  onEditAssignment: (assignment: AssignmentResponseDTO) => void;
  onDeleteAssignment: (assignment: AssignmentResponseDTO) => void;
  onSubmitDetail: (assignmentId: number) => void;
  onEditDetail: (detail: AssignmentDetailResponseDTO) => void;
  isOverdue: (deadlineStr: string) => boolean;
  onViewAllDetails?: (assignmentId: number) => void;
  getStudentDetail?: (assignmentId: number) => AssignmentDetailResponseDTO | undefined;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  userId,
  isTeacher,
  canManageDetail,
  isReadonlyForAssignment,
  detailLoading,
  onRefresh,
  assignmentLoading,
  onEditAssignment,
  onDeleteAssignment,
  onSubmitDetail,
  onEditDetail,
  isOverdue,
  onViewAllDetails,
  getStudentDetail,
}) => {
  return (
    <FlatList
      data={assignments.filter((item) => item?.AssignmentId !== undefined)}
      keyExtractor={(item) => item.AssignmentId.toString()}
      renderItem={({ item }) => (
        <AssignmentItem
          item={item}
          userId={userId}
          isTeacher={isTeacher}
          canManageDetail={canManageDetail}
          isReadonlyForAssignment={isReadonlyForAssignment}
          detailLoading={detailLoading}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onSubmitDetail={onSubmitDetail}
          onEditDetail={onEditDetail}
          isOverdue={isOverdue}
          onViewAllDetails={onViewAllDetails}
          getStudentDetail={getStudentDetail}
        />
      )}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      refreshControl={
        <RefreshControl
          refreshing={assignmentLoading}
          onRefresh={onRefresh}
          colors={["#3B82F6"]}
          tintColor="#3B82F6"
        />
      }
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
          <Icon name="book-outline" size={80} color="#D1D5DB" />
          <Text style={{ marginTop: 16, fontSize: 18, color: '#6B7280', textAlign: 'center', fontWeight: '500' }}>
            Chưa có bài tập nào
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
            Kéo xuống để làm mới hoặc tạo bài tập mới
          </Text>
        </View>
      }
    />
  );
};

export default AssignmentList;