// src/screens/RemindersScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatInTimeZone } from "date-fns-tz";
import { format, parse, compareAsc } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootState, AppDispatch } from "../store";
import {
  getRemindersByUser,
  addReminder,
  updateReminder,
  deleteReminder,
  clearError,
  setSelectedReminder,
} from "../store/slices/ReminderSlice";
import { ReminderRequestDTO } from "../domain/entities/ReminderDTO/ReminderRequestDTO";
import { ReminderResponseDTO } from "../domain/entities/ReminderDTO/ReminderResponseDTO";
import { RootStackParamList } from "../navigation/types";
import {
  makeSelectHasPermission,
  selectIsAdmin,
} from "../store/slices/permissionsSlice";

type RemindersNav = NativeStackNavigationProp<RootStackParamList, "Reminders">;

const TIMEZONE = "Asia/Ho_Chi_Minh";

const STATUS_OPTIONS = [
  { label: "Chưa bắt đầu", value: 1 },
  { label: "Đang thực hiện", value: 2 },
  { label: "Đã hoàn thành", value: 3 },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const RemindersScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<RemindersNav>();
  const { reminders, loading, error, selectedReminder } = useSelector(
    (state: RootState) => state.reminderSlice
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"create" | "update" | null>(null);
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusId, setStatusId] = useState(1);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isStatusPickerVisible, setStatusPickerVisible] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [statusUpdateOnly, setStatusUpdateOnly] = useState(false);
  const insets = useSafeAreaInsets();
  const auth = useSelector((state: RootState) => state.auth);
  const userId = auth.user?.username || "";

  const isAdmin = useSelector(selectIsAdmin);
  const hasReminderPermission = useSelector(
    makeSelectHasPermission("ucReminder")
  );
  const canCreateOrUpdate = isAdmin || hasReminderPermission;
  const isReadonlyMode = !canCreateOrUpdate;

  // ✅ Real-time polling: Reload every 30 seconds if userId exists
  useEffect(() => {
    if (!userId) return;

    const pollInterval = setInterval(() => {
      dispatch(getRemindersByUser(userId));
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [dispatch, userId]);

  useEffect(() => {
    const loadGroupId = async () => {
      try {
        const storedGroupId = await AsyncStorage.getItem("groupId");
        if (storedGroupId) setGroupId(storedGroupId);
      } catch (err) {
        console.error("Error loading groupId:", err);
      }
    };
    loadGroupId();
  }, []);

  useEffect(() => {
    if (userId) dispatch(getRemindersByUser(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const clearForm = useCallback(() => {
    setContent("");
    setDueDate("");
    setStatusId(1);
    setMode(null);
    setStatusUpdateOnly(false);
    dispatch(setSelectedReminder(null));
  }, [dispatch]);

  const handleAddPress = useCallback(() => {
    if (isReadonlyMode) {
      Alert.alert("Không có quyền", "Bạn chỉ có quyền xem nhắc nhở.");
      return;
    }
    clearForm();
    setMode("create");
    setModalVisible(true);
  }, [clearForm, isReadonlyMode]);

  const handleEditPress = useCallback(
    (reminder: ReminderResponseDTO) => {
      dispatch(setSelectedReminder(reminder));
      setContent(reminder.Content || "");
      setDueDate(reminder.DueDate || "");
      setStatusId(reminder.StatusId || 1);
      setMode("update");
      setStatusUpdateOnly(isReadonlyMode);
      setModalVisible(true);
    },
    [dispatch, isReadonlyMode]
  );

  const handleDeletePress = useCallback(
    (reminder: ReminderResponseDTO) => {
      if (isReadonlyMode) {
        Alert.alert("Không có quyền", "Bạn chỉ có quyền xem nhắc nhở.");
        return;
      }

      dispatch(clearError());

      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc muốn xóa "${reminder.Content?.substring(0, 50) ?? ""}..."?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => {
              if (reminder.ReminderId) {
                dispatch(deleteReminder(reminder.ReminderId))
                  .unwrap()
                  .then(() => {
                    dispatch(clearError()); // ✅ Clear error sau success
                    Alert.alert("Thành công", "Đã xóa nhắc nhở.");
                  })
                  .catch((err) => {
                    dispatch(clearError()); // ✅ Clear error trong catch để tránh double alert
                    Alert.alert("Lỗi", err || "Xóa thất bại.");
                  });
              }
            },
          },
        ]
      );
    },
    [dispatch, isReadonlyMode]
  );

  const handleSubmit = useCallback(async () => {
    dispatch(clearError());

    if (statusUpdateOnly && isReadonlyMode) {
      // Allow submit for status update
    } else if (isReadonlyMode) {
      Alert.alert("Không có quyền", "Bạn không có quyền thao tác.");
      return;
    }
    if (!statusUpdateOnly && !content.trim()) {
      Alert.alert("Lỗi", "Nội dung không được để trống.");
      return;
    }
    if (!statusUpdateOnly && !dueDate) {
      Alert.alert("Lỗi", "Vui lòng chọn hạn chót.");
      return;
    }

    const createAt =
      mode === "create"
        ? format(new Date(), "dd/MM/yyyy HH:mm:ss")
        : selectedReminder?.CreateAt || "";

    const payload: ReminderRequestDTO = {
      ReminderId: mode === "update" ? selectedReminder?.ReminderId || 0 : 0,
      ParentId: groupId.startsWith("PH") ? userId : "",
      StudentId: !groupId.startsWith("PH") ? userId : "",
      Content: content,
      DueDate: dueDate,
      StatusId: statusId,
      CreateAt: createAt,
    };

    try {
      if (mode === "create") {
        await dispatch(addReminder(payload)).unwrap();
      } else {
        await dispatch(updateReminder(payload)).unwrap();
      }

      setModalVisible(false);
      clearForm();
      // ✅ Reload ngay sau success để sync với backend (vì slice không update local)
      if (userId) dispatch(getRemindersByUser(userId));
      Alert.alert(
        "Thành công",
        mode === "create" ? "Đã thêm." : "Đã cập nhật."
      );
    } catch (err: any) {
      dispatch(clearError()); // ✅ Clear trong catch để tránh useEffect alert thêm
      Alert.alert("Lỗi", err || "Thao tác thất bại.");
    }
  }, [
    dispatch,
    mode,
    selectedReminder,
    userId,
    content,
    dueDate,
    statusId,
    clearForm,
    groupId,
    isReadonlyMode,
    statusUpdateOnly,
  ]);

  const getStatusStyle = (statusId: number) => {
    switch (statusId) {
      case 1:
        return "text-red-600 font-semibold";
      case 2:
        return "text-blue-600 font-semibold";
      case 3:
        return "text-green-500 font-semibold";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (statusId: number) => {
    const status = STATUS_OPTIONS.find((s) => s.value === statusId);
    return status ? status.label : "Không xác định";
  };

  const isOverdue = (dueDateStr: string, statusId: number) => {
    if (statusId === 4) return true;
    if (!dueDateStr) return false;
    const d = parse(dueDateStr, "dd/MM/yyyy HH:mm:ss", new Date());
    return compareAsc(d, new Date()) === -1;
  };

  const renderReminderItem = ({ item }: { item: ReminderResponseDTO }) => (
    <TouchableOpacity activeOpacity={0.8} className="mb-4">
      <View
        className={`rounded-2xl p-5 bg-white shadow-md shadow-black/10 border-l-4 
        ${
          isOverdue(item.DueDate || "", item.StatusId || 1)
            ? "border-l-red-500 bg-red-50"
            : "border-l-pink-500"
        }`}
      >
        <View className="flex-row items-center mb-3">
          <View className="w-11 h-11 rounded-full bg-pink-500 justify-center items-center mr-3">
            <Icon name="notifications-outline" size={22} color="#FFF" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {item.StudentFullName || item.ParentFullName || "Không xác định"}
            </Text>
            <Text className={`text-xs ${getStatusStyle(item.StatusId || 1)}`}>
              {getStatusLabel(item.StatusId || 1)}
            </Text>
          </View>
        </View>
        <Text
          className="text-sm text-gray-700 leading-5 mb-3"
          numberOfLines={2}
        >
          {item.Content || "Nội dung không có"}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="time-outline" size={14} color="#6B7280" />
            <Text
              className={`text-xs ml-1 ${
                isOverdue(item.DueDate || "", item.StatusId || 1)
                  ? "text-red-500 font-medium"
                  : "text-gray-500"
              }`}
            >
              Hạn: {item.DueDate || "Không có"}
            </Text>
          </View>
        </View>
        {!isReadonlyMode && item.ReminderId && (
          <View className="flex-row justify-end gap-3 mt-3">
            <TouchableOpacity
              onPress={() => handleEditPress(item)}
              className="p-2 rounded-lg bg-pink-100"
            >
              <Icon name="create-outline" size={20} color="#EC4899" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeletePress(item)}
              className="p-2 rounded-lg bg-red-100"
            >
              <Icon name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        {isReadonlyMode && item.ReminderId && (
          <View className="flex-row justify-end gap-3 mt-3">
            <TouchableOpacity
              onPress={() => handleEditPress(item)}
              className="p-2 rounded-lg bg-blue-100"
            >
              <Icon name="flag-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const modalTitle =
    mode === "create" ? "Tạo nhắc nhở mới" : "Cập nhật nhắc nhở";

  const handleCloseModal = useCallback(() => {
    Keyboard.dismiss();
    setModalVisible(false);
    setStatusPickerVisible(false);
    clearForm();
  }, [clearForm]);

  const handleDatePress = useCallback(() => {
    Keyboard.dismiss();
    setDatePickerVisible(true);
  }, []);

  const handleStatusPress = useCallback(() => {
    setStatusPickerVisible(true);
  }, []);

  const pickerReadonly = isReadonlyMode && !statusUpdateOnly;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={reminders.filter((item) => item?.ReminderId !== undefined)}
        keyExtractor={(item, index) =>
          item.ReminderId ? item.ReminderId.toString() : index.toString()
        }
        renderItem={renderReminderItem}
        contentContainerClassName="p-4 pb-24"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-12">
            <Icon name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-base text-gray-500 text-center">
              Chưa có nhắc nhở nào.
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={() => userId && dispatch(getRemindersByUser(userId))}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 rounded-full shadow-lg shadow-black/40 bg-pink-500 justify-center items-center"
        onPress={handleAddPress}
        disabled={!canCreateOrUpdate}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Modal CRUD */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
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
            onPress={handleCloseModal}
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
              height: screenHeight * 0.8,
              paddingBottom: insets.bottom,
            }}
          >
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
                <View className="flex-1 px-5 py-3 rounded-2xl bg-pink-500 flex-row items-center justify-center">
                  <Icon name="notifications-outline" size={22} color="#FFF" />
                  <Text className="ml-2 text-xl font-bold text-white">
                    {modalTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="ml-3 p-2 rounded-xl bg-gray-100"
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View className="flex-1 px-5 pb-5 gap-4">
                <TextInput
                  className={`p-4 text-base text-gray-900 rounded-2xl h-[100px] shadow-sm shadow-black/5 ${
                    isReadonlyMode ? "bg-gray-50 text-gray-400" : "bg-white"
                  }`}
                  placeholder="Nội dung nhắc nhở"
                  placeholderTextColor="#9CA3AF"
                  value={content}
                  onChangeText={isReadonlyMode ? undefined : setContent}
                  editable={!isReadonlyMode}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-2xl shadow-sm shadow-black/5 ${
                    isReadonlyMode ? "bg-gray-50" : "bg-white"
                  }`}
                  onPress={isReadonlyMode ? undefined : handleDatePress}
                  disabled={isReadonlyMode}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="calendar-outline"
                    size={20}
                    color={isReadonlyMode ? "#9CA3AF" : "#374151"}
                  />
                  <Text
                    className={`ml-3 text-base ${
                      isReadonlyMode ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {dueDate || "Chọn hạn chót"}
                  </Text>
                </TouchableOpacity>

                {/* Status Picker Field */}
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-2xl shadow-sm shadow-black/5 ${
                    pickerReadonly ? "bg-gray-50" : "bg-white"
                  }`}
                  onPress={pickerReadonly ? undefined : handleStatusPress}
                  activeOpacity={0.7}
                  disabled={pickerReadonly}
                >
                  <Icon
                    name="flag-outline"
                    size={20}
                    color={pickerReadonly ? "#9CA3AF" : "#374151"}
                  />
                  <Text
                    className={`ml-3 text-base ${
                      pickerReadonly ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {getStatusLabel(statusId)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer buttons */}
              <View className="flex-row px-5 py-4 bg-white border-t border-gray-200 gap-3">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-2xl bg-gray-100 items-center shadow-sm"
                  onPress={handleCloseModal}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-600 font-medium">Hủy</Text>
                </TouchableOpacity>
                {(!isReadonlyMode || statusUpdateOnly) && (
                  <TouchableOpacity
                    className="flex-1 rounded-2xl overflow-hidden shadow-md bg-pink-500 justify-center items-center"
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text className="text-white font-semibold py-3">
                      {loading
                        ? "Đang xử lý..."
                        : mode === "create"
                          ? "Tạo"
                          : "Cập nhật"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={(date) => {
            const uiString = formatInTimeZone(
              date,
              TIMEZONE,
              "dd/MM/yyyy HH:mm:ss"
            );
            setDueDate(uiString);
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />

        {/* Status Picker Modal */}
        <Modal
          visible={isStatusPickerVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setStatusPickerVisible(false)}
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
              onPress={() => setStatusPickerVisible(false)}
            />
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                width: screenWidth,
                paddingHorizontal: 20,
                paddingVertical: 20,
                paddingBottom: insets.bottom + 20,
                minHeight: 250,
              }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Chọn trạng thái
                </Text>
                <TouchableOpacity
                  onPress={() => setStatusPickerVisible(false)}
                  className="p-2"
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={{ height: 200 }}>
                <Picker
                  selectedValue={statusId}
                  onValueChange={(value: number) => {
                    setStatusId(value);
                    setStatusPickerVisible(false);
                  }}
                  style={{
                    height: 200,
                  }}
                  mode="dialog"
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <Picker.Item key={value} label={label} value={value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
};

export default RemindersScreen;