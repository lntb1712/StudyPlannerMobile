// src/screens/AssignmentScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatInTimeZone } from "date-fns-tz";
import { format, parse, compareAsc } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { RootState, AppDispatch } from "../store";
import {
  getAssignmentsByTeacher,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  clearError as clearAssignmentError,
  setSelectedAssignment,
  clearAssignments,
  getAssignmentsByClass,
} from "../store/slices/assignmentSlice";
import {
  getAssignmentDetailsByAssignment,
  getAssignmentDetailByStudent,
  addAssignmentDetail,
  updateAssignmentDetail,
  clearError as clearDetailError,
  setSelectedAssignmentDetail,
  clearAssignmentDetails,
} from "../store/slices/assignmentDetailSlice";
import {
  fetchTeachersByClassId,
  fetchClassesByTeacherId,
} from "../store/slices/teacherClassSlice";
import { AssignmentRequestDTO } from "../domain/entities/AssignmentDTO/AssignmentRequestDTO";
import { AssignmentResponseDTO } from "../domain/entities/AssignmentDTO/AssignmentResponseDTO";
import { AssignmentDetailResponseDTO } from "../domain/entities/AssignmentDetailDTO/AssignmentDetailResponseDTO";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header";

// Import sub-components
import AssignmentSelector from "../components/AssignmentSelector";
import AssignmentList from "../components/AssignmentList";
import AssignmentDetailItem from "../components/AssignmentDetailItem";
import AssignmentModal from "../components/AssignmentModal";
import AssignmentDetailModal from "../components/AssignmentDetailModal";
import DetailedHeader from "../components/DetailedHeader";

export type DrawerParamList = {
  Schedule: undefined;
  Assignments: undefined;
  Reminders: undefined;
  Notifications: undefined;
};

type AssignmentNav = DrawerNavigationProp<DrawerParamList, "Assignments">;
type AssignmentRoute = RouteProp<DrawerParamList, "Assignments">;

const TIMEZONE = "Asia/Ho_Chi_Minh";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const AssignmentScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AssignmentNav>();
  const route = useRoute<AssignmentRoute>();
  const insets = useSafeAreaInsets();

  // Redux selectors
  const {
    assignments: assignmentList,
    loading: assignmentLoading,
  } = useSelector((state: RootState) => state.assignmentSlice);
  const {
    teachers,
    classes,
    loading: tcLoading,
  } = useSelector((state: RootState) => state.teacherClass);
  const {
    assignmentDetails,
    selectedAssignmentDetail,
    loading: detailLoading,
  } = useSelector((state: RootState) => state.assignmentDetailSlice);
  const auth = useSelector((state: RootState) => state.auth);
  const userId = auth.user?.username || "";

  // Local state
  const [isModalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [showAllDetailsModal, setShowAllDetailsModal] = useState(false);
  const [selectedAssignmentForAllDetails, setSelectedAssignmentForAllDetails] = useState<number | null>(null);
  const [mode, setMode] = useState<"create" | "update" | null>(null);
  const [detailMode, setDetailMode] = useState<"create" | "update" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [grade, setGrade] = useState("");
  const [filePath, setFilePath] = useState("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState("");
  const [classIdFromStorage, setClassIdFromStorage] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");
  const [studentDetails, setStudentDetails] = useState<AssignmentDetailResponseDTO[]>([]);

  // Computed values
  const isTeacher = groupId.startsWith("GV");
  const canManageAssignment = isTeacher;
  const canManageDetail = isTeacher; // Assuming teachers can manage details
  const isReadonlyForAssignment = !canManageAssignment;
  const isDetailedView = isTeacher ? !!selectedClassId : !!selectedTeacherId;
  const selectorList = isTeacher ? classes : teachers;
  const classId = selectedClassId;
  const className = selectedClassName;
  const teacherId = selectedTeacherId;
  const teacherName = selectedTeacherName;
  const filteredAssignments = assignmentList.filter((item) => item?.AssignmentId > 0);
  const showFab = isTeacher && isDetailedView;

  // Load student details for assignments using GetByStudentAsync
  const loadStudentDetails = useCallback(async () => {
    if (isTeacher || assignmentList.length === 0) return;
    const detailsPromises = assignmentList.map((ass) =>
      dispatch(getAssignmentDetailByStudent({ assignmentId: ass.AssignmentId, studentId: userId })).unwrap().catch(() => null)
    );
    const details = await Promise.all(detailsPromises);
    setStudentDetails(details.filter((d): d is AssignmentDetailResponseDTO => d !== null));
  }, [dispatch, isTeacher, assignmentList, userId]);

  useEffect(() => {
    loadStudentDetails();
  }, [loadStudentDetails]);

  // Load group ID and class ID on mount
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedGroupId = await AsyncStorage.getItem("groupId");
        const storedClassId = await AsyncStorage.getItem("classId");
        if (storedGroupId) {
          setGroupId(storedGroupId);
        }
        if (storedClassId) {
          setClassIdFromStorage(storedClassId);
        }
      } catch (error) {
        console.error("Error loading storage data:", error);
      }
    };
    loadStorageData();
  }, []);

  // Auto-set selected class for students
  useEffect(() => {
    if (groupId && classIdFromStorage && !isTeacher) {
      setSelectedClassId(classIdFromStorage);
      setSelectedClassName(`Lớp ${classIdFromStorage}`);
    }
  }, [groupId, classIdFromStorage, isTeacher]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearAssignmentError());
      dispatch(clearDetailError());
    };
  }, [dispatch]);

  // Focus effect for data loading
  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        if (isDetailedView) {
          loadAssignments();
        } else {
          loadSelectors();
        }
      }
    }, [groupId, isDetailedView, selectedClassId, selectedTeacherId, isTeacher])
  );

  // Load selectors (classes or teachers)
  const loadSelectors = useCallback(async () => {
    try {
      if (isTeacher) {
        dispatch(fetchClassesByTeacherId(userId));  // Pass userId directly as string
      } else {
        // For students, use classId from storage
        if (classIdFromStorage) {
          dispatch(fetchTeachersByClassId(classIdFromStorage));
        }
      }
    } catch (error) {
      console.error("Error loading selectors:", error);
    }
  }, [dispatch, isTeacher, userId, classIdFromStorage]);

  // Load assignments based on selection
  const loadAssignments = useCallback(async () => {
    try {
      // For students without selection, use classId from storage
      const effectiveClassId = selectedClassId || (!isTeacher ? classIdFromStorage : "");
      if (isTeacher && selectedClassId) {
        dispatch(getAssignmentsByTeacher({ teacherId: userId, classId: selectedClassId }));
      } else if (!isTeacher && selectedTeacherId) {
        dispatch(getAssignmentsByTeacher({ teacherId: selectedTeacherId, classId: classIdFromStorage }));
      } else if (effectiveClassId) {
        dispatch(getAssignmentsByClass(effectiveClassId));
      }
      // Clear details
      dispatch(clearAssignmentDetails());
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  }, [dispatch, isTeacher, userId, selectedClassId, selectedTeacherId, classIdFromStorage]);

  // Handle class selection
  const handleSelectClass = useCallback((classId: string, className: string) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setSelectedTeacherId("");
    setSelectedTeacherName("");
    dispatch(clearAssignments());
    setStudentDetails([]);
  }, [dispatch]);

  // Handle teacher selection
  const handleSelectTeacher = useCallback((teacherId: string, teacherName: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedTeacherName(teacherName);
    dispatch(clearAssignments());
    setStudentDetails([]);
  }, [dispatch]);

  // Handle back to selector
  const handleBackToSelector = useCallback(() => {
    setSelectedTeacherId("");
    setSelectedTeacherName("");
    if (isTeacher) {
      setSelectedClassId("");
      setSelectedClassName("");
    }
    dispatch(clearAssignments());
    dispatch(clearAssignmentDetails());
    setStudentDetails([]);
  }, [dispatch, isTeacher]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    loadAssignments();
  }, [loadAssignments]);

  // FAB press for add
  const handleAddAssignmentPress = useCallback(() => {
    setMode("create");
    setTitle("");
    setDescription("");
    setDeadline("");
    setModalVisible(true);
  }, []);

  // Edit assignment press
  const handleEditAssignmentPress = useCallback((assignment: AssignmentResponseDTO) => {
    setMode("update");
    setTitle(assignment.Title || "");
    setDescription(assignment.Description || "");
    setDeadline(assignment.Deadline || "");
    setSelectedAssignmentId(assignment.AssignmentId);
    setModalVisible(true);
  }, []);

  // Delete assignment press
  const handleDeleteAssignmentPress = useCallback(async (assignment: AssignmentResponseDTO) => {
    Alert.alert(
      "Xóa bài tập",
      "Bạn có chắc chắn muốn xóa bài tập này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteAssignment(assignment.AssignmentId)).unwrap();
              Alert.alert("Thành công", "Bài tập đã được xóa.");
            } catch (error: any) {
              Alert.alert("Lỗi", error || "Xóa bài tập thất bại.");
            }
          },
        },
      ]
    );
  }, [dispatch]);

  // Submit detail press (for students)
  const handleSubmitDetailPress = useCallback((assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    const existingDetail = studentDetails.find((d) => d.AssignmentId === assignmentId);
    if (existingDetail) {
      setDetailMode("update");
      setGrade(existingDetail.Grade?.toString() || "");
      setFilePath(existingDetail.FilePath || "");
      dispatch(setSelectedAssignmentDetail(existingDetail));
    } else {
      setDetailMode("create");
      setGrade("");
      setFilePath("");
      dispatch(setSelectedAssignmentDetail(null));
    }
    setDetailModalVisible(true);
  }, [dispatch, studentDetails]);

  // Edit detail press (for teachers)
  const handleEditDetailPress = useCallback((detail: AssignmentDetailResponseDTO) => {
    setSelectedAssignmentId(detail.AssignmentId);
    setDetailMode("update");
    setGrade(detail.Grade?.toString() || "");
    setFilePath(detail.FilePath || "");
    dispatch(setSelectedAssignmentDetail(detail));
    setDetailModalVisible(true);
  }, [dispatch]);

  // View all details (teacher only)
  const handleViewAllDetails = useCallback((assignmentId: number) => {
    setSelectedAssignmentForAllDetails(assignmentId);
    dispatch(getAssignmentDetailsByAssignment(assignmentId));
    setShowAllDetailsModal(true);
  }, [dispatch]);

  // Modal handlers
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setMode(null);
    setSelectedAssignmentId(null);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setDetailMode(null);
    setSelectedAssignmentId(null);
    setFilePath("");
    setGrade("");
    dispatch(setSelectedAssignmentDetail(null));
  }, [dispatch]);

  const handleDatePress = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  // Submit assignment
  const handleSubmitAssignment = useCallback(async () => {
    if (!title.trim() || !deadline) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      const now = new Date().toISOString();
      const payload: AssignmentRequestDTO = {
        AssignmentId: mode === "update" ? selectedAssignmentId! : 0,
        Title: title,
        Description: description,
        Deadline: deadline,
        ClassId: selectedClassId,  // Keep as string
        TeacherId: isTeacher ? userId : selectedTeacherId,  // Keep as string
        CreatedAt: now,  // Added required CreatedAt
      };
      await dispatch(mode === "create" ? addAssignment(payload) : updateAssignment(payload)).unwrap();
      setModalVisible(false);
      loadAssignments(); // Reload list
      Alert.alert("Thành công", mode === "create" ? "Tạo bài tập thành công." : "Cập nhật thành công.");
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Thao tác thất bại.");
    }
  }, [dispatch, mode, title, description, deadline, selectedAssignmentId, selectedClassId, selectedTeacherId, userId, isTeacher, loadAssignments]);

  // Submit detail
  const handleSubmitDetail = useCallback(async () => {
    if (!selectedAssignmentId) return;
    try {
      const studentId = detailMode === "create" ? userId : (selectedAssignmentDetail?.StudentId || userId);
      const formData = new FormData();
      formData.append("AssignmentId", selectedAssignmentId.toString());
      formData.append("StudentId", studentId);
      formData.append("Grade", grade);
      if (filePath) {
        const file = {
          uri: filePath,
          type: "image/jpeg",
          name: "assignment.jpg",
        } as any;
        formData.append("File", file);
      }
      const action = detailMode === "create" ? addAssignmentDetail : updateAssignmentDetail;
      await dispatch(action(formData)).unwrap();
      setDetailModalVisible(false);
      // Reload details if in all details modal
      if (showAllDetailsModal) {
        dispatch(getAssignmentDetailsByAssignment(selectedAssignmentId));
      }
      // For student, reload the specific detail
      if (!isTeacher && !showAllDetailsModal) {
        try {
          const updatedDetail = await dispatch(getAssignmentDetailByStudent({ assignmentId: selectedAssignmentId, studentId: userId })).unwrap();
          setStudentDetails((prev) => {
            const index = prev.findIndex((d) => d.AssignmentId === selectedAssignmentId);
            if (index !== -1) {
              const newPrev = [...prev];
              newPrev[index] = updatedDetail;
              return newPrev;
            } else {
              return [...prev, updatedDetail];
            }
          });
        } catch (error) {
          console.error("Failed to reload student detail:", error);
        }
      }
      Alert.alert("Thành công", "Cập nhật bài nộp thành công.");
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Thao tác thất bại.");
    }
  }, [dispatch, selectedAssignmentId, userId, grade, filePath, detailMode, showAllDetailsModal, selectedAssignmentDetail, isTeacher]);

  // Overdue checker
  const isOverdue = useCallback((deadlineStr: string) => {
    if (!deadlineStr) return false;
    const deadlineDate = parse(deadlineStr, "dd/MM/yyyy HH:mm:ss", new Date());
    return compareAsc(deadlineDate, new Date()) < 0;
  }, []);

  // Navigation handlers
  const handleOpenSidebar = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const handleReminderPress = useCallback(() => {
    navigation.navigate("Reminders");
  }, [navigation]);

const handleNotificationPress = useCallback(() => {
  navigation.navigate("Notifications");
}, [navigation]);
  const detailedTitle = className || teacherName || "Bài tập";

  if (!groupId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Header
          onOpenSidebar={handleOpenSidebar}
          onReminderPress={handleReminderPress}
          onNotificationPress={handleNotificationPress}
        />
      </View>
      {!isDetailedView ? (
        <View className="flex-1">
          <AssignmentSelector
            isTeacher={isTeacher}
            selectorList={selectorList}
            onSelectClass={handleSelectClass}
            onSelectTeacher={handleSelectTeacher}
            tcLoading={tcLoading}
          />
        </View>
      ) : (
        <>
          <DetailedHeader
            classId={classId}
            className={className}
            teacherId={teacherId}
            teacherName={teacherName}
            onBack={handleBackToSelector}
          />
          <AssignmentList
            assignments={filteredAssignments}
            userId={userId}
            isTeacher={isTeacher}
            canManageDetail={canManageDetail}
            isReadonlyForAssignment={isReadonlyForAssignment}
            detailLoading={detailLoading}
            onRefresh={handleRefresh}
            assignmentLoading={assignmentLoading}
            onEditAssignment={handleEditAssignmentPress}
            onDeleteAssignment={handleDeleteAssignmentPress}
            onSubmitDetail={handleSubmitDetailPress}
            onEditDetail={handleEditDetailPress}
            isOverdue={isOverdue}
            onViewAllDetails={isTeacher ? handleViewAllDetails : undefined}
            getStudentDetail={!isTeacher ? (assignmentId: number) => studentDetails.find((d) => d.AssignmentId === assignmentId) : undefined}
          />
          {showFab && (
            <TouchableOpacity
              className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-blue-500 justify-center items-center shadow-lg"
              onPress={handleAddAssignmentPress}
              activeOpacity={0.85}
              style={{ marginBottom: insets.bottom }} // Lift FAB above bottom inset
            >
              <Icon name="add" size={28} color="#FFF" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Modal for Teacher to View All Details */}
      <Modal
        visible={showAllDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Tất cả bài nộp</Text>
            <TouchableOpacity onPress={() => setShowAllDetailsModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={assignmentDetails.filter((d) => d.AssignmentId === selectedAssignmentForAllDetails)}
            renderItem={({ item: detail }) => (
              <AssignmentDetailItem
                detail={detail}
                isOwn={false}
                showSubmit={false}
                assignmentId={selectedAssignmentForAllDetails!}
                canManageDetail={canManageDetail}
                onSubmitDetail={() => {}}
                onEditDetail={handleEditDetailPress}
              />
            )}
            keyExtractor={(item) => `${item.AssignmentId}_${item.StudentId}`}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }} // Apply bottom inset here too
            showsVerticalScrollIndicator={false}
            refreshing={detailLoading}
            onRefresh={() => selectedAssignmentForAllDetails && dispatch(getAssignmentDetailsByAssignment(selectedAssignmentForAllDetails))}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center p-8">
                <Icon name="document-outline" size={80} color="#D1D5DB" />
                <Text className="mt-4 text-lg text-gray-500 text-center font-medium">
                  Chưa có bài nộp nào
                </Text>
              </View>
            }
          />
          {/* AssignmentDetailModal inside all details modal */}
          <AssignmentDetailModal
            visible={detailModalVisible && showAllDetailsModal}
            onClose={handleCloseDetailModal}
            grade={grade}
            onGradeChange={setGrade}
            isTeacher={isTeacher}
            detailModalTitle={detailMode === "create" ? "Nộp bài" : "Chỉnh sửa bài nộp"}
            detailLoading={detailLoading}
            onSubmit={handleSubmitDetail}
            onFileChange={setFilePath}
            filePath={filePath}
            insets={insets}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        </SafeAreaView>
      </Modal>

      <AssignmentModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        title={title}
        description={description}
        deadline={deadline}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onDatePress={handleDatePress}
        modalTitle={mode === "create" ? "Tạo bài tập mới" : "Cập nhật bài tập"}
        isReadonlyForAssignment={isReadonlyForAssignment}
        assignmentLoading={assignmentLoading}
        onSubmit={handleSubmitAssignment}
        insets={insets}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        isDatePickerVisible={isDatePickerVisible}
        onDateConfirm={(date: Date) => {
          const uiString = formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
          setDeadline(uiString);
          setDatePickerVisible(false);
        }}
        onDateCancel={() => setDatePickerVisible(false)}
      />
      {/* AssignmentDetailModal outside for main screen */}
      <AssignmentDetailModal
        visible={detailModalVisible && !showAllDetailsModal}
        onClose={handleCloseDetailModal}
        grade={grade}
        onGradeChange={setGrade}
        isTeacher={isTeacher}
        detailModalTitle={detailMode === "create" ? "Nộp bài" : "Chỉnh sửa bài nộp"}
        detailLoading={detailLoading}
        onSubmit={handleSubmitDetail}
        onFileChange={setFilePath}
        filePath={filePath}
        insets={insets}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          const uiString = formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm:ss");
          setDeadline(uiString);
          setDatePickerVisible(false);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
};

export default AssignmentScreen;