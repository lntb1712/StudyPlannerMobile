// src/components/Header.tsx
import React, { useEffect } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { RootState } from "../store";
import { getAllNotifications } from "../store/slices/notificationSlice"; // Adjust the import path as needed

type HeaderProps = {
  onOpenSidebar: () => void;
  onReminderPress: () => void;
  onNotificationPress: () => void;
};

const colors = {
  blue400: "#60A5FA",
  purple400: "#A78BFA",
  pinkLight: "#FBCFE8",
  slateDark: "#1E293B",
};

const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onReminderPress, onNotificationPress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const unreadCount = useSelector((state: RootState) => state.notificationSlice?.unreadCount || 0);
  const navigation = useNavigation();

  const username = auth.user?.username;

  useEffect(() => {
    if (username) {
      dispatch(getAllNotifications(username));
    }

    const interval = setInterval(() => {
      if (username) {
        dispatch(getAllNotifications(username));
      }
    }, 30000); // Auto-refresh every 30 seconds

    return () => clearInterval(interval);
  }, [username, dispatch]);

  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-2">
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Icon name="menu-outline" size={30} color={colors.slateDark} />
        </TouchableOpacity>
        <Image
          source={require("../../assets/study_planner_logo.png")}
          className="w-10 h-10"
        />
        <Text className="text-2xl font-bold text-slate-800">Study Planner</Text>
      </View>

      <View className="flex-row items-center gap-3 relative">
        {/* Reminder Icon */}
        <TouchableOpacity
          onPress={onReminderPress}
          className="bg-pink-500 w-10 h-10 rounded-full items-center justify-center shadow-lg"
          activeOpacity={0.8}
        >
          <Icon name="time-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Notification Bell Icon */}
        <TouchableOpacity
          onPress={onNotificationPress}
          className="relative"
          activeOpacity={0.8}
        >
          <Icon name="notifications-outline" size={24} color={colors.slateDark} />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-5 items-center justify-center">
              <Text className="text-xs text-white font-bold leading-none">
                {unreadCount > 99 ? "99+" : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <LinearGradient
          colors={[colors.blue400, colors.purple400, colors.pinkLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 40, height: 40, borderRadius: 16, padding: 2 }}
        >
          <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  auth.user?.username || "User"
                )}&background=6366F1&color=fff`,
              }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Header;