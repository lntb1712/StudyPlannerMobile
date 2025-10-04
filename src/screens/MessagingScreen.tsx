import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../store";
import {
  getConversation,
  sendMessage,
  markAsRead,
} from "../store/slices/messagingSlice";
import { RootState } from "../store";
import { MessagingRequestDTO } from "../domain/entities/MessagingDTO/MessagingRequestDTO";
import { MessagingResponseDTO } from "../domain/entities/MessagingDTO/MessagingResponseDTO";
import { useRoute, useFocusEffect } from "@react-navigation/native";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Type route params
type MessagingRouteParams = {
  otherUserId: string;
  otherUserName: string;
};

const MessagingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute<any>();
  const { otherUserId, otherUserName } = route.params as MessagingRouteParams;

  const auth = useSelector((state: RootState) => state.auth);
  const currentUserId = auth.user?.username || "";

  const { loading, error } = useSelector(
    (state: RootState) => state.messagingSlice
  );

  const [inputText, setInputText] = useState("");
  const [conversationMessages, setConversationMessages] = useState<
    MessagingResponseDTO[]
  >([]); // Local state for this conversation
  const flatListRef = useRef<FlatList>(null);

  // fetch conversation (sets local state)
  const fetchConversation = useCallback(() => {
    if (currentUserId && otherUserId) {
      dispatch(
        getConversation({ senderId: currentUserId, receiverId: otherUserId })
      )
        .unwrap()
        .then((fetchedMessages) => {
          setConversationMessages(fetchedMessages);
        })
        .catch((err) => console.error("Fetch error:", err));
    }
  }, [dispatch, currentUserId, otherUserId]);

  // Refetch on focus + polling
  useFocusEffect(
    useCallback(() => {
      fetchConversation();
      const interval = setInterval(fetchConversation, 10000); // 30s poll
      return () => clearInterval(interval);
    }, [fetchConversation])
  );

  // Mark unread as read on focus
  useFocusEffect(
    useCallback(() => {
      const unread = conversationMessages.filter(
        (msg) => !msg.IsRead && msg.ReceiverId === currentUserId
      );
      unread.forEach((msg) => dispatch(markAsRead(msg.MessageId)));
    }, [conversationMessages, dispatch, currentUserId])
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [conversationMessages]);

  // Send message (append locally + refetch for sync)
  const handleSendMessage = useCallback(() => {
    if (inputText.trim()) {
      const payload: MessagingRequestDTO = {
        MessageId: 0,
        SenderId: currentUserId,
        ReceiverId: otherUserId,
        Content: inputText.trim(),
        IsRead: false,
      };
      dispatch(sendMessage(payload))
        .unwrap()
        .then((sentMessage) => {
          // Append locally for instant UI (with type guard)
          if (sentMessage) {
            setConversationMessages((prev) => [...prev, sentMessage]);
          }
          setInputText("");
          // Refetch after delay for server sync
          setTimeout(fetchConversation, 500);
        })
        .catch((err) => console.error("Send error:", err));
    }
  }, [dispatch, currentUserId, otherUserId, inputText]);

  const renderMessage = ({ item }: { item: MessagingResponseDTO }) => {
    const isOwnMessage = item.SenderId === currentUserId;

    return (
      <View
        style={{
          flexDirection: "row",
          marginVertical: 4,
          paddingHorizontal: 12,
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        }}
      >
        <View
          style={{
            maxWidth: "75%",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: isOwnMessage ? "#3B82F6" : "#E5E7EB",
            borderBottomRightRadius: isOwnMessage ? 4 : 24,
            borderBottomLeftRadius: !isOwnMessage ? 4 : 24,
          }}
        >
          <Text
            style={{ color: isOwnMessage ? "#FFF" : "#111827", fontSize: 16 }}
          >
            {item.Content}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: isOwnMessage ? "#BBDEFB" : "#6B7280",
                marginRight: 4,
              }}
            >
              {new Date(item.CreatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isOwnMessage && (
              <MaterialIcons
                name="done-all" // icon tick
                size={14}
                color={item.IsRead ? "#BBDEFB" : "#9CA3AF"}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading && conversationMessages.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Đang tải tin nhắn...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-red-500">{error}</Text>
        <TouchableOpacity
          onPress={fetchConversation}
          className="mt-4 px-6 py-2 bg-blue-500 rounded-full"
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="p-4 bg-white border-b border-gray-200 shadow-sm">
          <Text className="text-xl font-bold text-gray-800">
            {otherUserName}
          </Text>
          <Text className="text-sm text-gray-500">Đang trò chuyện</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.MessageId.toString()}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View className="flex-row items-center bg-white border-t border-gray-200 p-4 mb-10">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-base text-gray-800"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            className={`ml-2 px-4 py-2 rounded-full shadow-md ${
              inputText.trim() ? "bg-blue-500" : "bg-blue-300 opacity-50"
            }`}
          >
            <Text className="text-white font-semibold">Gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MessagingScreen;
