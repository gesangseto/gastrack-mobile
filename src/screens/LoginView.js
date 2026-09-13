import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {loginSeller} from '../resource/Login';
import {fetchSysConfig} from '../resource/Configuration';
import {
  getEndpoint,
  getProfile,
  getSysConfig,
  setEndpoint,
  setProfile,
  setSysConfig,
} from '../storage';

const Field = React.forwardRef(({icon, ...props}, ref) => (
  <View style={styles.field}>
    <Icon name={icon} size={18} color="#9A9A9A" />
    <TextInput
      ref={ref}
      placeholderTextColor="#B0B0B0"
      style={styles.input}
      {...props}
    />
  </View>
));

const LoginView = ({navigation, route}) => {
  const [api, setApi] = useState(getEndpoint());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    if (api) setEndpoint(api);
    if (!username || !password) return;
    setLoading(true);
    let response = await loginSeller({username: username, password: password});
    setLoading(false);
    if (response) {
      setProfile(response);
      // Simpan semua data sys_configuration_mst ke MMKV (tanpa logo/password)
      const config = await fetchSysConfig();
      if (config) setSysConfig(config);
      return RootNavigation.navigateReplace('TabView');
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      const profile = await getProfile();
      if (profile) {
        // Pastikan konfigurasi tersimpan (mis. app di-update tanpa login ulang)
        if (!getSysConfig()) {
          const config = await fetchSysConfig();
          if (config) setSysConfig(config);
        }
        RootNavigation.navigateReplace('TabView');
      }
    };
    checkLogin();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={color.white}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        {/* Tombol server (API endpoint) */}
        <TouchableOpacity
          onPress={() => setShowServer(prev => !prev)}
          style={styles.serverButton}>
          <Icon name="server" size={18} color="#9A9A9A" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoBlock}>
          <View style={styles.logoIcon}>
            <Icon name="baggage-claim" size={40} color={color.white} />
          </View>
          <Text style={styles.title}>GasTrack</Text>
          <Text style={styles.subtitle}>Your Warehouse Partner</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            icon="user"
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
          <Field
            ref={passwordInputRef}
            icon="lock"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}>
            {loading ? (
              <ActivityIndicator size="small" color={color.white} />
            ) : (
              <Text style={styles.loginText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server endpoint (opsional, untuk development) */}
        {showServer && (
          <View style={styles.serverBox}>
            <Text style={styles.serverLabel}>Server</Text>
            <Field
              icon="globe"
              value={api}
              onChangeText={setApi}
              placeholder="http://192.168.0.233:8000"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginView;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  serverButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 24,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: color.primaryColor,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1F1F',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9A9A9A',
    marginTop: 6,
  },
  form: {
    width: '100%',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F1F1F',
    marginLeft: 12,
    height: '100%',
  },
  loginButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: color.primaryColor,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: color.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serverBox: {
    marginTop: 24,
  },
  serverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});