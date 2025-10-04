import 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Animated, Easing, View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppDispatch, store } from './src/store';
import { makeSelectPermission } from './src/store/slices/permissionsSlice';
import { listenForNotifications, registerForPushNotificationsAsync, setupNotificationHandler } from './src/store/services/NotificationService';
import MessagingScreen from './src/screens/MessagingScreen';
import CustomSidebar from './src/components/CustomSidebar';
import ScheduleScreen from './src/screens/ScheduleScreen';
import AssignmentScreen from './src/screens/AssignmentScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import MessagingListScreen from './src/screens/MessagingListScreen';
import LoginScreen from './src/screens/LoginScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import './src/styles/tailwind.css';
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Splash Screen with normal StyleSheet
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
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/study_planner_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>StudyPlanner</Text>
      </View>
      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 32,
  },
  progressBackground: {
    width: 256,
    height: 8,
    backgroundColor: '#d1d5db',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
});

// Wrapper for MessagingScreen
const MessagingWrapper: React.FC = () => <MessagingScreen />;

// Drawer Navigator
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
      <Drawer.Screen name="MessagingList" component={MessagingListScreen} options={{ title: 'Tin nhắn' }} />
    </Drawer.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Home" component={DrawerNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Lịch' }} />
    <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Nhắc nhở' }} />
    <Stack.Screen name="Assignments" component={AssignmentScreen} options={{ title: 'Bài tập' }} />
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Thông báo' }} />
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

// App Content
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupNotificationHandler();

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) console.log('Push token registered:', token);
      })
      .catch((error) => console.error('Failed to register for push notifications:', error));

    const unsubscribe = listenForNotifications(dispatch);
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return <NavigationContainer>{showSplash ? <SplashScreen /> : <MainNavigator />}</NavigationContainer>;
};

// App
const App: React.FC = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;
