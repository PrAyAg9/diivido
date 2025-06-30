import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to dashboard on successful login
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    // Our new backend doesn't have a resend confirmation feature
    Alert.alert(
      'Not Available',
      'Email confirmation resending is not available with the new backend.',
      [{ text: 'OK' }]
    );
  };

  // const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
  //   if (provider === 'apple') {
  //     Alert.alert(
  //       'Coming Soon',
  //       'Apple Sign-In will be available in the next update!',
  //       [{ text: 'OK' }]
  //     );
  //     return;
  //   }

  //   if (provider === 'google') {
  //     setIsLoading(true);
  //     setError(null);

  //     try {
  //       const result = await signInWithGoogle();
  //       if (result.error) {
  //         setError(result.error);
  //       } else {
  //         router.replace('/(tabs)');
  //       }
  //     } catch (err: any) {
  //       setError(err.message || 'Google sign-in failed');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/welcome')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to your Divido account and continue splitting expenses
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Confirmation Notice */}
            {showEmailConfirmation && (
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationTitle}>
                  Email Verification Required
                </Text>
                <Text style={styles.confirmationText}>
                  We've sent a verification link to your email. Please check
                  your inbox and click the link to verify your account.
                </Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendConfirmation}
                  disabled={isResending}
                  activeOpacity={0.8}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Text style={styles.resendButtonText}>
                      Resend Verification Email
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                    setShowEmailConfirmation(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (isLoading || !email.trim() || !password.trim()) &&
                    styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || !email.trim() || !password.trim()}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Temporarily hidden - social auth will be added later
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={() => handleOAuthSignIn('apple')}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.socialButtonText, styles.appleButtonText]}
                  >
                    Apple
                  </Text>
                </TouchableOpacity>
              </View>
              */}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text
              style={styles.signUpLink}
              onPress={() => router.push('/(auth)/register')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
    minHeight: height - 200,
  },
  titleSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: Math.min(32, width * 0.08),
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  confirmationContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  confirmationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0369A1',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    lineHeight: 20,
    marginBottom: 16,
  },
  resendButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    minHeight: 44,
    justifyContent: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  loginButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 56,
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  signUpLink: {
    color: '#10B981',
    fontFamily: 'Inter-SemiBold',
  },
});
