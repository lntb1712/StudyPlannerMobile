import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { AppDispatch } from '../index'; // Adjust path to your store's AppDispatch type
import { addNotification } from '../slices/notificationSlice'; // Adjust path; assume this thunk exists for adding incoming push as local notification
import { NotificationRequestDTO } from '../../domain/entities/NotificationDTO/NotificationRequestDTO'; // Adjust path to your DTO

// Xử lý handler cho notifications (foreground) - Global setup, call once in App.tsx
export const setupNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: Notifications.Notification) => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,  // Hiển thị banner
      shouldShowList: true,    // Thêm vào list notifications
    }),
  });
};

// Hàm đăng ký quyền và lấy Expo Push Token
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    // Tạo kênh notifications cho Android (bắt buộc để prompt quyền)
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'Kênh thông báo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    Alert.alert('Cảnh báo', 'Phải dùng thiết bị thật để test push notifications!');
    return undefined;
  }

  // Kiểm tra và yêu cầu quyền
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Lỗi', 'Không thể lấy quyền push notifications!');
    return undefined;
  }

  // Lấy project ID từ Expo
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    throw new Error('Không tìm thấy Project ID. Kiểm tra expo.dev.');
  }

  // Lấy token
  const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
  token = expoToken.data;
  console.log('Expo Push Token:', token);  // Copy token này để test
  return token;
}

// Lắng nghe notifications - Theo chuẩn Redux: Nhận dispatch để cập nhật state
export function listenForNotifications(dispatch: AppDispatch): () => void {
  const notificationListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
    console.log('Foreground notification:', notification);
    // Dispatch action/thunk để lưu/update state Redux
    // Ví dụ: Map notification thành NotificationRequestDTO và add vào list
    const { title, body, data } = notification.request.content;
    if (title && body) {
      dispatch(addNotification({
        UserName: (data?.userName as string) || 'currentUser',  // Safe cast and fallback
        Title: title,
        Content: body,
        Type: (data?.type as string) || 'push',  // Safe cast and fallback
        IsRead: false,
        // Map other fields from data if available
      } as NotificationRequestDTO));  // Explicit cast to DTO
    }
    // Hoặc dispatch custom action: dispatch(receivedNotification({ notification }));
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
    console.log('User tap notification:', response);
    // Dispatch action để xử lý tap (e.g., navigate, set selected)
    const notification = response.notification;
    const { data } = notification.request.content;
    // Ví dụ: dispatch(setSelectedNotification(mapToResponseDTO(notification)));
    // Hoặc navigate dựa trên data.screen hoặc data.id
  });

  // Cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}