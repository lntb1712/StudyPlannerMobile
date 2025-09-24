// src/components/Header.tsx
import React from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { RootState } from "../store";

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
  const auth = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation();

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
          <Icon name="calendar-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Notification Bell Icon */}
        <TouchableOpacity
          onPress={onNotificationPress}
          className="relative"
          activeOpacity={0.8}
        >
          <Icon name="notifications-outline" size={24} color={colors.slateDark} />
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
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