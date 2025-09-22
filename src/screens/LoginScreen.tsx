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
import { sendOTP, verifyOTP, registerParent } from '../store/slices/authSlice'; // Giả sử có actions sendOTP, verifyOTP, registerParent
import { LoginRequestDTO } from '../domain/entities/LoginDTO/LoginRequestDTO';
import { SendOTPRequestDTO } from '../domain/entities/OTP/SendOTPRequestDTO'; // Giả sử DTO
import { VerifyOTPRequestDTO } from '../domain/entities/OTP/VerifyOTPRequestDTO';
import { RegisterParentRequestDTO } from '../domain/entities/RegisterDTO/RegisterParentRequestDTO';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const [loginMode, setLoginMode] = useState<'student' | 'createParent'>('student'); // Mặc định là học sinh
  const [parentStep, setParentStep] = useState<'email' | 'otp' | 'password'>('email'); // Bước cho createParent
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState(''); // Mã OTP
  const [parentPassword, setParentPassword] = useState('');
  const [confirmParentPassword, setConfirmParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (loginMode === 'student' && rememberMe) AsyncStorage.setItem('username', username);
      else if (loginMode === 'student') AsyncStorage.removeItem('username');
      Keyboard.dismiss();
      navigation.replace('Home');
    }
    if (auth.error) {
      setErrorMessage(auth.error);
    }
  }, [auth, loginMode]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setErrorMessage('');
    const payload = new LoginRequestDTO({ Username: username, Password: password });
    dispatch(login(payload));
  };

  const handleSendOTP = () => {
    if (!parentEmail.trim()) {
      setErrorMessage('Vui lòng nhập email');
      return;
    }
    setErrorMessage('');
    const payload = new SendOTPRequestDTO({ Email: parentEmail });
    dispatch(sendOTP(payload)).then((result) => {
      if (sendOTP.fulfilled.match(result)) {
        setParentStep('otp');
        Alert.alert('Thành công', 'Mã xác thực đã được gửi đến email của bạn!');
      } else {
        setErrorMessage((result.payload as string) || 'Gửi mã thất bại');
      }
    });
  };

  const handleVerifyOTP = () => {
    if (!otpCode.trim()) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }
    setErrorMessage('');
    const payload = new VerifyOTPRequestDTO({ Email: parentEmail, OTP: otpCode });
    dispatch(verifyOTP(payload)).then((result) => {
      if (verifyOTP.fulfilled.match(result)) {
        setParentStep('password');
        Alert.alert('Thành công', 'Mã OTP đã được xác thực!');
      } else {
        setErrorMessage((result.payload as string) || 'Xác thực OTP thất bại');
      }
    });
  };

  const handleCreateParent = () => {
    if (!parentPassword.trim() || !confirmParentPassword.trim() || !fullName.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (parentPassword !== confirmParentPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    setErrorMessage('');
    const payload = new RegisterParentRequestDTO({ 
      Email: parentEmail, 
      FullName: fullName,
      Password: parentPassword, 
      ConfirmPassword: confirmParentPassword 
    });
    dispatch(registerParent(payload)).then((result) => {
      if (registerParent.fulfilled.match(result)) {
        Alert.alert('Thành công', 'Tài khoản phụ huynh đã được tạo!');
        setLoginMode('student'); // Chuyển về student mode sau khi tạo
        setParentStep('email');
        setParentEmail('');
        setFullName('');
        setOtpCode('');
        setParentPassword('');
        setConfirmParentPassword('');
      } else {
        setErrorMessage((result.payload as string) || 'Tạo tài khoản thất bại');
      }
    });
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

            {/* Switcher tab */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setLoginMode('student')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderBottomWidth: loginMode === 'student' ? 2 : 0,
                  borderBottomColor: '#3b82f6',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: loginMode === 'student' ? '600' : '400', color: loginMode === 'student' ? '#3b82f6' : '#6b7280' }}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLoginMode('createParent')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderBottomWidth: loginMode === 'createParent' ? 2 : 0,
                  borderBottomColor: '#3b82f6',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: loginMode === 'createParent' ? '600' : '400', color: loginMode === 'createParent' ? '#3b82f6' : '#6b7280' }}>
                  Tạo tài khoản phụ huynh
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form học sinh (mặc định) */}
            {loginMode === 'student' && (
              <>
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
              </>
            )}

            {/* Form tạo tài khoản phụ huynh - theo bước */}
            {loginMode === 'createParent' && (
              <>
                {/* Bước 1: Email */}
                {parentStep === 'email' && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Email</Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        value={parentEmail}
                        onChangeText={setParentEmail}
                        placeholder="Nhập email để nhận mã xác thực"
                        placeholderTextColor="#9ca3af"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={getInputStyle(!!errorMessage)}
                        onFocus={() => setErrorMessage('')}
                      />
                      <Icon
                        name="mail-outline"
                        size={18}
                        color="#9ca3af"
                        style={{ position: 'absolute', left: 12, top: '38%', transform: [{ translateY: -9 }] }}
                      />
                    </View>
                  </View>
                )}

                {/* Bước 2: OTP */}
                {parentStep === 'otp' && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Mã xác thực</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      Đã gửi mã đến {parentEmail}
                    </Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        value={otpCode}
                        onChangeText={setOtpCode}
                        placeholder="Nhập mã OTP (6 chữ số)"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        maxLength={6}
                        style={getInputStyle(!!errorMessage)}
                        onFocus={() => setErrorMessage('')}
                      />
                      <Icon
                        name="key-outline"
                        size={18}
                        color="#9ca3af"
                        style={{ position: 'absolute', left: 12, top: '38%', transform: [{ translateY: -9 }] }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setParentStep('email')} // Quay lại gửi lại
                      style={{ alignSelf: 'flex-start', marginTop: 8 }}
                    >
                      <Text style={{ color: '#3b82f6', fontSize: 14 }}>Gửi lại mã</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Bước 3: Password */}
                {parentStep === 'password' && (
                  <>
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Họ và tên</Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder="Nhập họ và tên"
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

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Mật khẩu</Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={parentPassword}
                          onChangeText={setParentPassword}
                          placeholder="Nhập mật khẩu"
                          secureTextEntry={!showParentPassword}
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
                          onPress={() => setShowParentPassword(!showParentPassword)}
                        >
                          <Icon name={showParentPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 4, color: '#1f2937' }}>Xác nhận mật khẩu</Text>
                      <View style={{ position: 'relative' }}>
                        <TextInput
                          value={confirmParentPassword}
                          onChangeText={setConfirmParentPassword}
                          placeholder="Nhập lại mật khẩu"
                          secureTextEntry={!showConfirmPassword}
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
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}

            {/* Phần remember me - chỉ hiển thị cho student mode */}
            {loginMode === 'student' && (
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
            )}

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

            {/* Nút action dựa trên mode và step */}
            <TouchableOpacity
              onPress={
                loginMode === 'student' 
                  ? handleLogin 
                  : parentStep === 'email' 
                    ? handleSendOTP 
                    : parentStep === 'otp' 
                      ? handleVerifyOTP 
                      : handleCreateParent
              }
              // disabled={auth.loading || 
              //   (loginMode === 'student' && (!username.trim() || !password.trim())) ||
              //   (parentStep === 'email' && !parentEmail.trim()) ||
              //   (parentStep === 'otp' && !otpCode.trim()) ||
              //   (parentStep === 'password' && (!parentPassword.trim() || !confirmParentPassword.trim() || !fullName.trim()))
              // }r
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
                {auth.loading 
                  ? 'Đang xử lý...' 
                  : loginMode === 'student' 
                    ? 'Đăng Nhập' 
                    : parentStep === 'email' 
                      ? 'Gửi mã xác thực' 
                      : parentStep === 'otp' 
                        ? 'Xác thực OTP' 
                        : 'Tạo Tài Khoản'
                }
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;