// src/components/AssignmentDetailItem.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AssignmentDetailResponseDTO } from "../domain/entities/AssignmentDetailDTO/AssignmentDetailResponseDTO";

interface AssignmentDetailItemProps {
  detail: AssignmentDetailResponseDTO;
  isOwn: boolean;
  showSubmit: boolean;
  assignmentId: number;
  canManageDetail: boolean;
  onSubmitDetail: (assignmentId: number, isOwn: boolean) => void;
  onEditDetail: (detail: AssignmentDetailResponseDTO) => void;
}

const AssignmentDetailItem: React.FC<AssignmentDetailItemProps> = ({
  detail,
  isOwn,
  showSubmit,
  assignmentId,
  canManageDetail,
  onSubmitDetail,
  onEditDetail,
}) => {
  const getStatusColor = (status: string) => {
    if (status === "Chưa nộp") return "#EF4444";
    if (status === "Đã nộp") return "#10B981";
    if (status === "Đã chấm") return "#3B82F6";
    return "#6B7280";
  };

  return (
    <View
      style={{
        marginBottom: 12,
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: isOwn ? "#10B981" : "#E5E7EB",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#E5E7EB",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}>
            <Icon name="person-circle-outline" size={24} color="#6B7280" />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937" }}>
              {detail.StudentName || "Không xác định"}
            </Text>
            {isOwn && (
              <Text style={{ fontSize: 12, color: "#10B981", fontWeight: "500" }}>
                Bài của bạn
              </Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: detail.Grade ? "#059669" : "#6B7280",
            }}
          >
            Điểm: {detail.Grade || "Chưa chấm"}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: getStatusColor(detail.StatusName || "Chưa nộp"),
              fontWeight: "500",
              marginTop: 2,
            }}
          >
            {detail.StatusName || "Chưa nộp"}
          </Text>
        </View>
      </View>
      {showSubmit && (
        <TouchableOpacity
          onPress={() => onSubmitDetail(assignmentId, true)}
          style={{
            marginTop: 8,
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: "#D1FAE5",
            borderRadius: 8,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#10B981",
          }}
          accessibilityLabel="Nộp bài"
        >
          <Text style={{ color: "#065F46", fontWeight: "600", fontSize: 14 }}>
            Nộp bài ngay
          </Text>
        </TouchableOpacity>
      )}
      {(canManageDetail || isOwn) && (
        <TouchableOpacity
          onPress={() => onEditDetail(detail)}
          style={{
            marginTop: 12,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: "#DBEAFE",
            alignSelf: "flex-end",
            flexDirection: "row",
            alignItems: "center",
          }}
          accessibilityLabel="Sửa chi tiết"
        >
          <Icon name="create-outline" size={16} color="#3B82F6" style={{ marginRight: 4 }} />
          <Text style={{ color: "#3B82F6", fontWeight: "500", fontSize: 14 }}>
            Sửa
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AssignmentDetailItem;