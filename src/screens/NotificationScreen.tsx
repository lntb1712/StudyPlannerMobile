// src/screens/NotificationScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getAllNotifications,
  updateNotification,
  deleteNotification,
  clearError,
  setSelectedNotification,
} from "../store/slices/notificationSlice";
import { NotificationResponseDTO } from "../domain/entities/NotificationDTO/NotificationResponseDTO";
import { NotificationRequestDTO } from "../domain/entities/NotificationDTO/NotificationRequestDTO";
import { RootState, AppDispatch } from "../store";

const NotificationScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications: reduxNotifications, selectedNotification, loading, error } =
    useSelector((state: RootState) => state.notificationSlice);
  const auth = useSelector((state: RootState) => state.auth);
  const userName = auth.user?.username || "";

  const [localNotifications, setLocalNotifications] = useState<NotificationResponseDTO[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLocalNotifications(reduxNotifications);
  }, [reduxNotifications]);

  useEffect(() => {
    if (userName) {
      dispatch(getAllNotifications(userName));
    }
  }, [dispatch, userName]);

  useEffect(() => {
    if (error) {
      console.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = useCallback(() => {
    if (userName) {
      setRefreshing(true);
      dispatch(getAllNotifications(userName))
        .unwrap()
        .finally(() => setRefreshing(false));
    }
  }, [dispatch, userName]);

  const handleMarkAsRead = (notification: NotificationResponseDTO) => {
    setLocalNotifications(prev =>
      prev.map(n =>
        n.NotificationId === notification.NotificationId
          ? { ...n, IsRead: true }
          : n
      )
    );

    const payload: NotificationRequestDTO = {
      NotificationId: notification.NotificationId,
      UserName: notification.UserName,
      Title: notification.Title,
      Content: notification.Content,
      Type: notification.Type,
      IsRead: true,
    };
    dispatch(updateNotification(payload))
      .unwrap()
      .then(() => dispatch(getAllNotifications(userName)))
      .catch(() => setLocalNotifications(reduxNotifications));
  };

  const handleDelete = (notificationId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa thông báo này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setLocalNotifications(prev => prev.filter(n => n.NotificationId !== notificationId));
          dispatch(deleteNotification(notificationId))
            .unwrap()
            .catch(() => {
              dispatch(getAllNotifications(userName));
              Alert.alert("Lỗi", "Không thể xóa. Vui lòng thử lại.");
            });
        },
      },
    ]);
  };

  const handleDeleteAll = () => {
    if (localNotifications.length === 0) return;

    Alert.alert(
      "Xác nhận xóa tất cả",
      `Bạn có chắc chắn muốn xóa ${localNotifications.length} thông báo?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: async () => {
            setLocalNotifications([]);
            dispatch(setSelectedNotification(null));

            const deletePromises = localNotifications.map(n =>
              dispatch(deleteNotification(n.NotificationId))
                .unwrap()
                .catch(() => null)
            );

            try {
              await Promise.all(deletePromises);
            } catch {
              dispatch(getAllNotifications(userName));
              Alert.alert("Lỗi", "Một số thông báo không thể xóa. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string | Date) => {
    let d: Date;
    if (dateString instanceof Date) {
      d = dateString;
    } else {
      const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        const [, day, month, year, hours, minutes, seconds] = parts.map(Number);
        d = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        d = new Date(dateString);
      }
    }
    if (isNaN(d.getTime())) return "Invalid Date";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const handleSelect = (notification: NotificationResponseDTO) => {
    dispatch(setSelectedNotification(notification));
  };

  if (loading && !refreshing && localNotifications.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-center py-4 text-gray-600 font-medium">
          Đang tải thông báo...
        </Text>
      </View>
    );
  }

  const unreadCount = localNotifications.filter(n => !n.IsRead).length;
  const hasNotifications = localNotifications.length > 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: selectedNotification ? 200 : 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" title="Đang làm mới..." />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={28} color="#3B82F6" />
            <Text className="text-2xl font-bold text-gray-800 ml-2">Thông báo</Text>
          </View>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount.toString()}</Text>
            </View>
          )}
        </View>

        {hasNotifications && (
          <TouchableOpacity
            className="flex-row items-center mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
            onPress={handleDeleteAll}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text className="text-red-600 font-medium ml-2">
              Xóa tất cả ({localNotifications.length})
            </Text>
          </TouchableOpacity>
        )}

        {!hasNotifications ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text className="text-center text-gray-500 mt-4 text-lg font-medium">Không có thông báo nào</Text>
            <Text className="text-center text-gray-400 mt-2">Kéo xuống để làm mới</Text>
          </View>
        ) : (
          <View className="space-y-6">
            {localNotifications.map(notification => (
              <TouchableOpacity
                key={notification.NotificationId}
                className={`bg-white rounded-xl p-5 shadow-sm border ${notification.IsRead ? "border-gray-200" : "border-l-4 border-blue-500 bg-blue-50/50 shadow-md"}`}
                onPress={() => handleSelect(notification)}
                activeOpacity={0.9}
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="flex-1 text-lg font-semibold text-gray-800 pr-3" numberOfLines={2}>
                    {notification.Title || "Không có tiêu đề"}
                  </Text>
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                    <Text className="text-blue-600 font-medium text-sm">{notification.Type || "Không xác định"}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text className="text-gray-600 mb-4 leading-relaxed" numberOfLines={3} ellipsizeMode="tail">
                  {notification.Content || "Không có nội dung"}
                </Text>

                {/* Footer */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm ml-1">{formatDateTime(notification.CreatedAt)}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm ml-1">{notification.FullName || "Không xác định"}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3 pt-2 border-t border-gray-100">
                  {!notification.IsRead && (
                    <TouchableOpacity
                      className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 items-center"
                      onPress={e => { e.stopPropagation(); handleMarkAsRead(notification); }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#3B82F6" />
                      <Text className="text-blue-600 font-medium text-sm mt-1">Đã đọc</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    className="flex-1 bg-red-50 border border-red-200 rounded-lg px-4 py-2 items-center"
                    onPress={e => { e.stopPropagation(); handleDelete(notification.NotificationId); }}
                    activeOpacity={0.7}
                  >
                    
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text className="text-red-600 font-medium text-sm mt-1">Xóa</Text>
               
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Selected Detail Panel */}
      {selectedNotification && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 pt-4 border-t border-gray-200">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">Chi tiết thông báo</Text>
            <TouchableOpacity onPress={() => dispatch(setSelectedNotification(null))} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="space-y-4 mb-6">
            <View className="flex-row items-start">
              <Text className="font-bold text-gray-600 w-20">Tiêu đề:</Text>
              <Text className="text-gray-800 flex-1" numberOfLines={1}>{selectedNotification.Title || "Không có tiêu đề"}</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="font-bold text-gray-600 w-20">Nội dung:</Text>
              <Text className="text-gray-800 flex-1" numberOfLines={3} ellipsizeMode="tail">{selectedNotification.Content || "Không có nội dung"}</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="font-bold text-gray-600 w-20">Loại:</Text>
              <Text className="text-gray-800 flex-1">{selectedNotification.Type || "Không xác định"}</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="font-bold text-gray-600 w-20">Ngày tạo:</Text>
              <Text className="text-gray-800 flex-1">{formatDateTime(selectedNotification.CreatedAt)}</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="font-bold text-gray-600 w-20">Trạng thái:</Text>
              <Text className={`font-medium flex-1 ${selectedNotification.IsRead ? "text-green-600" : "text-orange-600"}`}>
                {selectedNotification.IsRead ? "Đã đọc" : "Chưa đọc"}
              </Text>
            </View>
          </View>

          <TouchableOpacity className="bg-gray-100 rounded-lg px-6 py-3 items-center" onPress={() => dispatch(setSelectedNotification(null))} activeOpacity={0.7}>
            <Text className="text-gray-700 font-medium">Đóng</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default NotificationScreen;
