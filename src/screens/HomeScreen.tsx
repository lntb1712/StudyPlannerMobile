// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import {
  makeSelectCanEdit,
  selectIsAdmin,
} from "../store/slices/permissionsSlice";
import Header from "../components/Header";
import { logout } from "../store/slices/authSlice";
import { AppDispatch } from "../store";

type HomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<HomeNav>();
  const route = useRoute();

  // Permissions selectors
  const isAdmin = useSelector(selectIsAdmin);
  const hasAssignmentPermission = useSelector(makeSelectCanEdit("ucAssignment"));
  const hasAssignmentDetail = useSelector(makeSelectCanEdit("ucAssignmentDetail"));
  const hasAssignmentsAccess = hasAssignmentPermission && hasAssignmentDetail;
  const hasReminderPermission = useSelector(makeSelectCanEdit("ucReminder"));

  // Auto-navigate to first available screen on mount (within drawer)
  useEffect(() => {
   
      if (hasAssignmentsAccess) {
        navigation.navigate("Assignments");
      } else if (hasReminderPermission) {
        navigation.navigate("Reminders");
      }
    
  }, [hasAssignmentsAccess, hasReminderPermission, navigation, route.name]);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy" },
      { text: "Đăng xuất", onPress: async () => {
        try {
          await dispatch(logout()).unwrap();
          navigation.replace("Login");
        } catch (error) {
          console.error("Logout failed:", error);
        }
      } },
    ]);
  };

  const auth = useSelector((state: RootState) => state.auth);
  const userName = auth.user?.username || "Người dùng";

  // Header handlers
  const handleOpenSidebar = () => {
    // @ts-ignore
    navigation.openDrawer();
  };

  const handleReminderPress = () => {
    if (hasReminderPermission) {
      navigation.navigate("Reminders");
    } else {
      Alert.alert("Không có quyền", "Bạn không có quyền truy cập nhắc nhở.");
    }
  };

  const handleNotificationPress = () => Alert.alert("Thông báo", "Chức năng thông báo sẽ được thêm sau.");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <Header
          onOpenSidebar={handleOpenSidebar}
          onReminderPress={handleReminderPress}
          onNotificationPress={handleNotificationPress}
        />

        {/* Dashboard Content */}
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
          <View className="items-center justify-center flex-1">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Chào mừng!</Text>
            <Text className="text-lg text-gray-600">{userName}</Text>
            <Text className="text-sm text-gray-500 mt-4">Sử dụng menu bên trái để điều hướng</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;