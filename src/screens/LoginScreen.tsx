import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Keyboard,
  ScrollView,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState, AppDispatch } from '../store';
import { login } from '../store/slices/authSlice';
import { LoginRequestDTO } from '../domain/entities/LoginDTO/LoginRequestDTO';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;     

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();

    const loadStoredUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
          setRememberMe(true);
        }
      } catch (error) {
        console.warn('AsyncStorage Error:', error);
      }
    };
    loadStoredUsername();
  }, []);

  useEffect(() => {
    console.log('Auth State:', auth); // Debug trạng thái auth
    if (auth.user) {
      if (rememberMe) AsyncStorage.setItem('username', username);
      else AsyncStorage.removeItem('username');
      Keyboard.dismiss();
      navigation.replace('Home');
    }
    if (auth.error) {
      setErrorMessage(auth.error);
    }
  }, [auth]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setErrorMessage('');
    const payload = new LoginRequestDTO({ Username: username, Password: password });
    dispatch(login(payload));
  };

  const getInputStyle = (hasError: boolean) => ({
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: hasError ? 'rgba(254,242,242,0.7)' : 'rgba(255,255,255,0.9)',
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginBottom: 12,
    borderColor: hasError ? '#ef4444' : '#d1d5db',
    fontSize: 16,
  });

  return (
    <ImageBackground
      source={require('../../assets/background_login.jpg')}
      style={{ flex: 1, width, height }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 20,
              padding: 24,
              alignSelf: 'center',
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Image
                source={require('../../assets/study_planner_logo.png')}
                style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937' }}>Study Planner</Text>
              <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Chào mừng bạn trở lại! 🎓</Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Tên đăng nhập</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#9ca3af"
                  style={getInputStyle(!!errorMessage)}
                  onFocus={() => setErrorMessage('')}
                />
                <Icon
                  name="person-outline"
                  size={18}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 12, top: '38%', transform: [{ translateY: -9 }] }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Mật khẩu</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9ca3af"
                  style={getInputStyle(!!errorMessage)}
                  onFocus={() => setErrorMessage('')}
                />
                <Icon
                  name="lock-closed-outline"
                  size={18}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 12, top: '38%', transform: [{ translateY: -9 }] }}
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 12, top: '40%', transform: [{ translateY: -9 }] }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setRememberMe(!rememberMe)}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderWidth: 1.5,
                    borderColor: rememberMe ? '#3b82f6' : '#d1d5db',
                    borderRadius: 4,
                    marginRight: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: rememberMe ? '#3b82f6' : 'transparent',
                  }}
                >
                  {rememberMe && <Icon name="checkmark" size={14} color="white" />}
                </View>
                <Text style={{ color: '#1f2937', fontSize: 14 }}>Ghi nhớ tôi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu', 'Liên hệ hỗ trợ để đặt lại.')}>
                <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600', margin: 2 }}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {errorMessage && (
              <View
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#ef4444',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: '#b91c1c', textAlign: 'center', fontSize: 14 }}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={auth.loading}
              style={{
                backgroundColor: '#3b82f6',
                paddingVertical: 14,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: auth.loading ? 0.7 : 1,
                flexDirection: 'row',
              }}
            >
              {auth.loading && <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />}
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                {auth.loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;