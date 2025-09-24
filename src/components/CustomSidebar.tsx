// src/components/CustomSidebar.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";  // Adjust path if needed
import { AppDispatch } from "../store";  // Import AppDispatch from store config

const CustomSidebar = (props: any) => {
  const dispatch = useDispatch<AppDispatch>();  // Type dispatch with AppDispatch

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();  // Await thunk success (clear auth state)
      props.navigation.replace("Login");  // Navigate sau khi state đã clean
    } catch (error) {
      console.error("Logout failed:", error);  // Optional: Handle error (e.g., Alert)
      // Có thể fallback navigate nếu cần
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-5 py-6 border-b border-slate-200 bg-slate-50">
        <Image
          source={require("../../assets/study_planner_logo.png")}
          className="w-10 h-10 mr-3"
        />
        <Text className="text-xl font-bold text-slate-800">
          Study Planner
        </Text>
      </View>

      {/* Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 0, flexGrow: 1 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View className="border-t border-slate-200">
        <TouchableOpacity
          className="flex-row items-center px-5 py-4"
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={22} color="#EA4335" />
          <Text className="ml-3 text-base text-red-500 font-medium">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CustomSidebar;