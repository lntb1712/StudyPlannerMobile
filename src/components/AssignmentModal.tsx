// src/components/AssignmentModal.tsx
import React from "react";
import { Modal, View, TouchableOpacity, ScrollView, TextInput, Text, Platform, KeyboardAvoidingView } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/Ionicons";
import { formatInTimeZone } from "date-fns-tz";
const TIMEZONE = "Asia/Ho_Chi_Minh";

interface AssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  deadline: string;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onDatePress: () => void;
  modalTitle: string;
  isReadonlyForAssignment: boolean;
  assignmentLoading: boolean;
  onSubmit: () => void;
  insets: EdgeInsets;
  screenWidth: number;
  screenHeight: number;
  isDatePickerVisible: boolean;
  onDateConfirm: (date: Date) => void;
  onDateCancel: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
  visible,
  onClose,
  title,
  description,
  deadline,
  onTitleChange,
  onDescriptionChange,
  onDatePress,
  modalTitle,
  isReadonlyForAssignment,
  assignmentLoading,
  onSubmit,
  insets,
  screenWidth,
  screenHeight,
  isDatePickerVisible,
  onDateConfirm,
  onDateCancel,
}) => {
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
          <KeyboardAvoidingView
            behavior={Platform.select({
              ios: "padding",
              android: "height",
            })}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 20 : 0}
            style={{
              backgroundColor: "#f9fafb",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              width: screenWidth,
              height: screenHeight * 0.85,
              paddingBottom: insets.bottom,
            }}
          >
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#3B82F6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="book-outline" size={24} color="#FFF" />
                  <Text style={{ marginLeft: 12, fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                    {modalTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={{ padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  accessibilityLabel="Đóng"
                >
                  <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <ScrollView style={{ flex: 1, paddingHorizontal: 20,paddingTop: 20, paddingBottom: 20, gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Tiêu đề bài tập
                  </Text>
                  <TextInput
                    style={{
                      padding: 16,
                      fontSize: 16,
                      color: '#111827',
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 1,
                      elevation: 1,
                      backgroundColor: isReadonlyForAssignment ? '#F9FAFB' : 'white',
                      borderWidth: 1,
                      borderColor: isReadonlyForAssignment ? '#E5E7EB' : '#E5E7EB',
                      ...(isReadonlyForAssignment && { color: '#9CA3AF' }),
                    }}
                    placeholder="Nhập tiêu đề bài tập"
                    value={title}
                    onChangeText={isReadonlyForAssignment ? undefined : onTitleChange}
                    editable={!isReadonlyForAssignment}
                    accessibilityLabel="Tiêu đề bài tập"
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Mô tả
                  </Text>
                  <TextInput
                    style={{
                      padding: 16,
                      fontSize: 16,
                      color: '#111827',
                      borderRadius: 12,
                      height: 120,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 1,
                      elevation: 1,
                      backgroundColor: isReadonlyForAssignment ? '#F9FAFB' : 'white',
                      borderWidth: 1,
                      borderColor: isReadonlyForAssignment ? '#E5E7EB' : '#E5E7EB',
                      ...(isReadonlyForAssignment && { color: '#9CA3AF' }),
                      textAlignVertical: 'top',
                    }}
                    placeholder="Mô tả chi tiết bài tập"
                    value={description}
                    onChangeText={isReadonlyForAssignment ? undefined : onDescriptionChange}
                    editable={!isReadonlyForAssignment}
                    multiline
                    numberOfLines={4}
                    accessibilityLabel="Mô tả bài tập"
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Hạn chót
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 1,
                      elevation: 1,
                      backgroundColor: isReadonlyForAssignment ? '#F9FAFB' : 'white',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                    onPress={isReadonlyForAssignment ? undefined : onDatePress}
                    disabled={isReadonlyForAssignment}
                    activeOpacity={0.7}
                    accessibilityLabel="Chọn hạn chót"
                  >
                    <Icon
                      name="calendar-outline"
                      size={20}
                      color={isReadonlyForAssignment ? "#9CA3AF" : "#374151"}
                    />
                    <Text
                      style={{
                        marginLeft: 12,
                        fontSize: 16,
                        color: isReadonlyForAssignment ? "#9CA3AF" : "#111827"
                      }}
                    >
                      {deadline || "Chọn hạn chót"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Hủy"
                >
                  <Text style={{ color: '#6B7280', fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>
                {!isReadonlyForAssignment && (
                  <TouchableOpacity
                    style={{ flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' }}
                    onPress={onSubmit}
                    disabled={assignmentLoading}
                    activeOpacity={0.7}
                    accessibilityLabel={modalTitle === "Tạo bài tập mới" ? "Tạo bài tập" : "Cập nhật bài tập"}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', paddingVertical: 14 }}>
                      {assignmentLoading
                        ? "Đang xử lý..."
                        : modalTitle === "Tạo bài tập mới"
                          ? "Tạo bài tập"
                          : "Cập nhật"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={onDateConfirm}
        onCancel={onDateCancel}
      />
      </Modal>
    </>
  );
};

export default AssignmentModal;