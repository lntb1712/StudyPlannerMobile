// types/navigation.ts (hoặc import vào App.tsx)
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined; // No params
  Home: undefined; // Drawer root, no params
  Schedule: undefined; // Fixed: Schedules -> Schedule (match screen name)
  Reminders: undefined;
  Assignments: undefined; // Or Assignment if singular
  Notifications: undefined;
  Messaging: { // Fixed: Messagings -> Messaging (match Stack.Screen name)
    otherUserId: string;
    otherUserName: string;
  };
};

// Optional: Use for props typing (e.g., in screen components)
export type Props<Screen extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Screen>;