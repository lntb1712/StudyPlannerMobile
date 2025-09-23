import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider } from 'react-redux';
import { store } from './store';
import { RootStackParamList } from './navigation/types';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import './styles/tailwind.css';

import CustomSidebar from './components/CustomSidebar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: "70%", // 👈 sidebar chiếm 70% màn hình
        }, // Sidebar trượt từ trái
      }}
      drawerContent={(props) => <CustomSidebar {...props} />}
    >
      <Drawer.Screen name="Lịch" component={HomeScreen} />
    </Drawer.Navigator>
  );
}

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
