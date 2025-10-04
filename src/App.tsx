import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, AppDispatch, RootState } from './store';
import LoginScreen from './screens/LoginScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import RemindersScreen from './screens/RemindersScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import CustomSidebar from './components/CustomSidebar';
import './styles/tailwind.css';

import { Text, View, Animated, Easing, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeSelectPermission } from './store/slices/permissionsSlice';
import NotificationScreen from './screens/NotificationScreen';
import { setupNotificationHandler, registerForPushNotificationsAsync, listenForNotifications } from './store/services/NotificationService';
import MessagingScreen from './screens/MessagingScreen';
import MessagingListScreen from './screens/MessagingListScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Splash Screen (unchanged)
const SplashScreen: React.FC = () => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <View className="items-center">
        <Image
          source={require('../assets/study_planner_logo.png')}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-gray-800 mb-8">StudyPlanner</Text>
      </View>
      <View className="w-64 h-2 bg-gray-300 rounded-full overflow-hidden">
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: '#3B82F6',
            borderRadius: 10,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </SafeAreaView>
  );
};

// Wrapper for MessagingScreen (Fixed: No props; uses useRoute inside)
const MessagingWrapper: React.FC = () => {
  return <MessagingScreen />;
};

// Drawer (unchanged)
const DrawerNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const schedulePerm = useSelector(makeSelectPermission('ucSchedule'));
  const remindersPerm = useSelector(makeSelectPermission('ucReminder'));
  const assignmentPerm = useSelector(makeSelectPermission('ucAssignment'));

  let initialRoute = 'Schedule';
  if (!schedulePerm?.isenable && assignmentPerm?.isenable) {
    initialRoute = 'Assignments';
  } else if (!schedulePerm?.isenable && !assignmentPerm?.isenable && remindersPerm?.isenable) {
    initialRoute = 'Reminders';
  }

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType: 'slide', drawerStyle: { width: '70%' } }}
      drawerContent={(props) => <CustomSidebar {...props} />}
      initialRouteName={initialRoute}
    >
      {schedulePerm?.isenable && (
        <Drawer.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Lịch' }} />
      )}
      {assignmentPerm?.isenable && (
        <Drawer.Screen name="Assignments" component={AssignmentScreen} options={{ title: 'Bài tập' }} />
      )}
      {remindersPerm?.isenable && (
        <Drawer.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Nhắc nhở' }} />
      )}
      {/* Added: MessagingListScreen in Drawer for easy access */}
      <Drawer.Screen name="MessagingList" component={MessagingListScreen} options={{ title: 'Tin nhắn' }} />
    </Drawer.Navigator>
  );
};

// Main Stack (unchanged)
const MainNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen 
      name="Home" 
      component={DrawerNavigator} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Lịch' }} />
    <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Nhắc nhở' }} />
    <Stack.Screen name="Assignments" component={AssignmentScreen} options={{ title: 'Bài tập' }} />
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Thông báo' }} />
    {/* Direct Messaging screen for conversations - navigated from MessagingList */}
    <Stack.Screen 
      name="Messaging" 
      component={MessagingWrapper} 
      options={{ 
        title: 'Trò chuyện',
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTintColor: '#1e293b',
        headerTitleStyle: { fontWeight: 'bold' },
      }} 
    />
  </Stack.Navigator>
);

// App (unchanged)
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupNotificationHandler();

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push token registered:', token);
      }
    }).catch(error => {
      console.error('Failed to register for push notifications:', error);
    });

    const unsubscribe = listenForNotifications(dispatch);
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>{showSplash ? <SplashScreen /> : <MainNavigator />}</NavigationContainer>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;