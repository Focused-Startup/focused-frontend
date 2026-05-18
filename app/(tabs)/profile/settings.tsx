import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';

type Field = 'firstName' | 'lastName' | 'username' | 'password';

export default function SettingsScreen() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingField, setSavingField] = useState<Field | null>(null);
  const [savedField, setSavedField] = useState<Field | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const flashSaved = (field: Field) => {
    setSavedField(field);
    setTimeout(() => setSavedField(null), 2000);
  };

  const saveField = async (field: Field) => {
    if (!user) return;
    setSavingField(field);

    try {
      if (field === 'firstName') {
        await user.update({ firstName: firstName.trim() });
      } else if (field === 'lastName') {
        await user.update({ lastName: lastName.trim() });
      } else if (field === 'username') {
        await user.update({ username: username.trim() });
      } else if (field === 'password') {
        if (newPassword !== confirmPassword) {
          Alert.alert('Passwords do not match', 'New password and confirmation must be the same.');
          return;
        }
        if (newPassword.length < 8) {
          Alert.alert('Password too short', 'Password must be at least 8 characters.');
          return;
        }
        await user.updatePassword({ currentPassword, newPassword });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      flashSaved(field);
    } catch (error: unknown) {
      const clerkError = error as { errors?: { message: string }[] };
      const message = clerkError?.errors?.[0]?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSavingField(null);
    }
  };

  const handlePickProfilePicture = async () => {
    if (!user) {
      Alert.alert('Profile Picture', 'Please wait for your account to finish loading and try again.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Allow photo library access to choose a new profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const file = asset.base64
      ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
      : asset.uri;

    try {
      await user.setProfileImage({ file });
      await user.reload();
    } catch {
      Alert.alert('Upload failed', 'Unable to update your profile picture. Please try again.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch {
            Alert.alert('Error', 'Unable to sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <ThemedText style={styles.backText}>Profile</ThemedText>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>Settings</ThemedText>
          <View style={styles.backButton} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Picture */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>PROFILE PICTURE</ThemedText>
              <View style={styles.avatarRow}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handlePickProfilePicture}>
                  {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color="#b0b7c3" />
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <ThemedText style={styles.avatarHint}>Tap to change your profile photo</ThemedText>
              </View>
            </View>

            {/* First Name */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>FIRST NAME</ThemedText>
              <View style={styles.fieldRow}>
                <ThemedTextInput
                  style={styles.fieldInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <SaveButton
                  loading={savingField === 'firstName'}
                  saved={savedField === 'firstName'}
                  onPress={() => saveField('firstName')}
                  disabled={firstName.trim() === (user?.firstName ?? '')}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>LAST NAME</ThemedText>
              <View style={styles.fieldRow}>
                <ThemedTextInput
                  style={styles.fieldInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <SaveButton
                  loading={savingField === 'lastName'}
                  saved={savedField === 'lastName'}
                  onPress={() => saveField('lastName')}
                  disabled={lastName.trim() === (user?.lastName ?? '')}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>USERNAME</ThemedText>
              <View style={styles.fieldRow}>
                <ThemedTextInput
                  style={styles.fieldInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <SaveButton
                  loading={savingField === 'username'}
                  saved={savedField === 'username'}
                  onPress={() => saveField('username')}
                  disabled={username.trim() === (user?.username ?? '')}
                />
              </View>
            </View>

            {/* Sign Out */}
            <View style={[styles.section, styles.signOutSection]}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={isSigningOut}
                activeOpacity={0.7}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#ff3b30" />
                ) : (
                  <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
                )}
                <ThemedText style={styles.signOutText}>
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function SaveButton({
  loading,
  saved,
  onPress,
  disabled,
}: {
  loading: boolean;
  saved: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  if (loading) {
    return (
      <View style={saveBtnStyles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (saved) {
    return (
      <View style={[saveBtnStyles.container, saveBtnStyles.savedContainer]}>
        <Ionicons name="checkmark" size={16} color="#fff" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[saveBtnStyles.container, saveBtnStyles.saveContainer, disabled && saveBtnStyles.disabledContainer]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText style={[saveBtnStyles.saveText, disabled && saveBtnStyles.disabledText]}>Save</ThemedText>
    </TouchableOpacity>
  );
}

const saveBtnStyles = StyleSheet.create({
  container: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  saveContainer: {
    backgroundColor: '#007AFF',
  },
  savedContainer: {
    backgroundColor: '#34C759',
  },
  disabledContainer: {
    backgroundColor: '#c8d6e5',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledText: {
    color: 'rgba(255,255,255,0.7)',
  },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f2f4f7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 70,
  },
  backText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a93a2',
    letterSpacing: 0.6,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8ecf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f2f4f7',
  },
  avatarHint: {
    flex: 1,
    fontSize: 14,
    color: '#8a93a2',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
    marginBottom: 10,
  },
  signOutSection: {
    marginTop: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ffdede',
  },
  signOutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});
