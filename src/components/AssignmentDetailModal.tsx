// src/components/AssignmentDetailModal.tsx
import React, { useState } from "react";
import { Modal, View, TouchableOpacity, ScrollView, TextInput, Text, Platform, KeyboardAvoidingView, Alert, Image } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

interface AssignmentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  grade: string;
  onGradeChange: (text: string) => void;
  isTeacher: boolean;
  detailModalTitle: string;
  detailLoading: boolean;
  onSubmit: () => void;
  onFileChange: (uri: string) => void; // New prop to handle file URI change
  filePath: string; // Existing filePath for display
  insets: EdgeInsets;
  screenWidth: number;
  screenHeight: number;
}

const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  visible,
  onClose,
  grade,
  onGradeChange,
  isTeacher,
  detailModalTitle,
  detailLoading,
  onSubmit,
  onFileChange,
  filePath,
  insets,
  screenWidth,
  screenHeight,
}) => {
    const [showImageViewer, setShowImageViewer] = useState(false);
 const handleFilePicker = async () => {
  // Xin quyền camera
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (permissionResult.status !== "granted") {
    Alert.alert("Thông báo", "Bạn chưa cấp quyền sử dụng camera.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled && result.assets.length > 0) {
    const uri = result.assets[0].uri;
    onFileChange(uri);
  }
};

  return (
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
          style={{
            backgroundColor: "#f9fafb",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            width: screenWidth,
            height: screenHeight * 0.7,
            paddingBottom: insets.bottom,
          }}
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#10B981' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="document-attach-outline" size={24} color="#FFF" />
                <Text style={{ marginLeft: 12, fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                  {detailModalTitle}
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

            {/* Form - Simplified */}
            <ScrollView style={{ paddingHorizontal: 20,paddingTop: 20,  paddingBottom: 20, gap: 16 }}>
             
                {/* File section */}
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    File bài nộp
                  </Text>
                  {filePath ? (
                    <View style={{ gap: 12 }}>
                      <View style={{ alignItems: 'center' }}>
                        <Image
                          source={{ uri: filePath }}
                          style={{
                            width: '100%',
                            height: 200,
                            borderRadius: 12,
                            backgroundColor: '#F3F4F6',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 1,
                          }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowImageViewer(true)}
                          style={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }} 
                          accessibilityLabel="Xem ảnh"
                        >
                          <Icon name="search-outline" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                      {!isTeacher && (
                        <TouchableOpacity 
                          onPress={handleFilePicker}
                          style={{ 
                            paddingVertical: 12, 
                            paddingHorizontal: 20,
                            backgroundColor: '#F3F4F6', 
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                          }} 
                          accessibilityLabel="Thay đổi file"
                        >
                          <Icon name="camera-outline" size={20} color="#374151" style={{ marginRight: 8 }} />
                          <Text style={{ color: '#374151', fontWeight: '500', fontSize: 16 }}>
                            Thay đổi file
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View>
                      {!isTeacher ? (
                        <TouchableOpacity 
                          onPress={handleFilePicker}
                          style={{ 
                            padding: 20, 
                            backgroundColor: 'white', 
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 1,
                            elevation: 1,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                          }} 
                          accessibilityLabel="Mở máy ảnh để chụp bài"
                        >
                          <Icon name="camera-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>
                            Chụp ảnh bài nộp
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ 
                          padding: 20, 
                          backgroundColor: '#F9FAFB', 
                          borderRadius: 12,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                        }}>
                          <Icon name="document-outline" size={48} color="#D1D5DB" />
                          <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                            Chưa có file
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {isTeacher && (
                  <View>
                    <Text style={{ fontSize: 16,paddingTop: 12, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                      Điểm số
                    </Text>
                    <TextInput
                      style={{
                        padding: 16,
                        fontSize: 16,
                        color: '#111827',
                        borderRadius: 12,
                        backgroundColor: 'white',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 1,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                      placeholder="Nhập điểm (0-10)"
                      value={grade}
                      onChangeText={onGradeChange}
                      keyboardType="numeric"
                      accessibilityLabel="Điểm số"
                    />
                  </View>
                )}
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
              <TouchableOpacity
                style={{ flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}
                onPress={onSubmit}
                disabled={detailLoading}
                activeOpacity={0.7}
                accessibilityLabel="Lưu chi tiết"
              >
                <Text style={{ color: 'white', fontWeight: '600', paddingVertical: 14 }}>
                  {detailLoading ? "Đang xử lý..." : "Lưu"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      {showImageViewer && filePath && (
        <Modal
          visible={showImageViewer}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageViewer(false)}
        >
          <View
            className="flex-1 bg-black/90 justify-center items-center"
          >
            <TouchableOpacity
              className="flex-1 w-full"
              activeOpacity={1}
              onPress={() => setShowImageViewer(false)}
            />
            <Image
              source={{ uri: filePath }}
              style={{
                width: screenWidth * 0.9,
                height: screenHeight * 0.7,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
            <TouchableOpacity
              className="absolute top-12 right-5 p-3 bg-black/50 rounded-full"
              onPress={() => setShowImageViewer(false)}
              accessibilityLabel="Đóng xem ảnh"
            >
              <Icon name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

export default AssignmentDetailModal;