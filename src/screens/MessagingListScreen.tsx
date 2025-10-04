import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../store";
import { getRelationship, getMessages } from "../store/slices/messagingSlice";
import { RootState } from "../store";
import { AccountManagementResponseDTO } from "../domain/entities/AccountManagementDTO/AccountManagementResponseDTO";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessagingResponseDTO } from "../domain/entities/MessagingDTO/MessagingResponseDTO";

interface MessagingListItemProps {
  item: AccountManagementResponseDTO;
  currentUserId: string;
  messages: MessagingResponseDTO[];
}

const MessagingListItem: React.FC<MessagingListItemProps> = ({
  item,
  currentUserId,
  messages,
}) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    const otherUserId = item.UserName;
    const otherUserName = item.FullName || item.UserName || "Unknown User";
    if (!otherUserId) return;
    // Only pass otherUserId and otherUserName; currentUserId from Redux in screen
    navigation.navigate("Messaging", { otherUserId, otherUserName });
  };

  const getLastNameInitial = (fullName: string | undefined) => {
    if (!fullName) return "U";
    const names = fullName.trim().split(" ");
    return names[names.length - 1].charAt(0).toUpperCase();
  };

  const { lastMessage, lastMessageAt } = useMemo(() => {
    const relevantMessages = messages.filter(
      (msg) =>
        (msg.SenderId === item.UserName && msg.ReceiverId === currentUserId) ||
        (msg.ReceiverId === item.UserName && msg.SenderId === currentUserId)
    );
    const sortedMessages = relevantMessages
      .filter((msg) => msg.CreatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.CreatedAt).getTime();
        const dateB = new Date(b.CreatedAt).getTime();
        return isNaN(dateB) ? 1 : isNaN(dateA) ? -1 : dateB - dateA;
      });
    const lastMessageObj = sortedMessages[0];
    return {
      lastMessage: lastMessageObj?.Content || "Bắt đầu trò chuyện",
      lastMessageAt: lastMessageObj?.CreatedAt,
    };
  }, [messages, item.UserName, currentUserId]);

  const formattedTime = lastMessageAt
    ? new Date(lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const getAvatarColor = (userName: string) => {
    const colors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#8B5CF6", // purple
      "#F59E0B", // orange
      "#06B6D4", // teal
      "#E11D48", // pink/red
    ];
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColor = getAvatarColor(item.UserName || "");

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#FFF",
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: avatarColor,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>
          {getLastNameInitial(item.FullName)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#111827" }}>
          {item.FullName || item.UserName || "Unknown User"}
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280" }} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      {formattedTime && (
        <View style={{ marginLeft: 8, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{formattedTime}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MessagingListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>(); // Added for navigation
  const { loading: relationshipLoading, relationships, messages } = useSelector(
    (state: RootState) => state.messagingSlice
  );
  const auth = useSelector((state: RootState) => state.auth);
  const currentUserId = auth.user?.username || "";
  const [refreshing, setRefreshing] = useState(false);

  const handleReminderPress = useCallback(() => {
    console.log("Reminder pressed");
  }, []);

  const handleNotificationPress = useCallback(() => {
    navigation.navigate("Notifications");
  }, [navigation]);

  const fetchRelationships = useCallback(() => {
    if (currentUserId) {
      dispatch(getRelationship({ userId: currentUserId }));
      dispatch(getMessages(currentUserId));
    }
  }, [dispatch, currentUserId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRelationships();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchRelationships]);

  if (relationshipLoading && relationships.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <Header
          onOpenSidebar={() => {}}
          onReminderPress={handleReminderPress}
          onNotificationPress={handleNotificationPress}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 8, fontSize: 16, color: "#4B5563" }}>
            Đang tải danh sách trò chuyện...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", padding:10 }}>
      <Header
        onOpenSidebar={() => {}}
        onReminderPress={handleReminderPress}
        onNotificationPress={handleNotificationPress}
      />
      <View style={{ padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>Tin nhắn</Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Chọn người để trò chuyện</Text>
      </View>
      <FlatList
        data={relationships}
        keyExtractor={(item, index) =>
          item.UserName ? `${item.UserName}-${index}` : `${index}`
        }
        renderItem={({ item }) => (
          <MessagingListItem
            item={item}
            currentUserId={currentUserId}
            messages={messages}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 16, color: "#6B7280", marginBottom: 8 }}>
              Chưa có cuộc trò chuyện nào.
            </Text>
            <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
              Bắt đầu bằng cách gửi tin nhắn đầu tiên!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default MessagingListScreen;