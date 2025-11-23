import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'rgb(255, 255, 255)',
  }
}

export const DATABASE_NAME = 'app.db';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  console.log('Migrations object:', JSON.stringify(migrations, null, 2));
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    console.log('Migration success:', success);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    console.error('Migration error:', error);
  }, [error]);

  if (!loaded || !success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Suspense fallback={<ActivityIndicator size="large" />}>
            <SQLiteProvider databaseName={'app.db'} options={{ enableChangeListener: true }} useSuspense>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            <StatusBar style="auto" />
          </SQLiteProvider>
          </Suspense>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ClerkProvider>
  );
}
