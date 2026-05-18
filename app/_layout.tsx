import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'rgb(255, 255, 255)',
  }
}

export const DATABASE_NAME = 'app.db';

function AppNavigation() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const isAuthRoute = segments[0] === '(auth)';

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn && !isAuthRoute) {
      router.replace('./(auth)/login');
      return;
    }

    if (isSignedIn && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, isAuthRoute, router]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    console.log('Migration success:', success);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    console.error('Migration error:', error);
  }, [error]);

  if (!publishableKey) {
    throw new Error('Add your Clerk Publishable Key to the .env file');
  }

  if (!loaded || !success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // Clerk Expo setup guide: https://clerk.com/docs/quickstarts/expo
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Suspense fallback={<ActivityIndicator size="large" />}>
            <SQLiteProvider databaseName={'app.db'} options={{ enableChangeListener: true }} useSuspense>
              <AppNavigation />
              <StatusBar style="auto" />
            </SQLiteProvider>
          </Suspense>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ClerkProvider>
  );
}
