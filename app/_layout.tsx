import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { UserProvider } from '@/contexts/UserContext';
import { tokenCache } from '@clerk/expo/token-cache';
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'rgb(255, 255, 255)',
  }
}

const httpLink = new HttpLink({
  uri: process.env.EXPO_PUBLIC_FOCUSED_BACKEND_URL,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.EXPO_PUBLIC_FOCUSED_BACKEND_WS_URL!, // e.g. wss://api.focused-backend.com/graphql
  })
);

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,   // subscriptions → WebSocket
  httpLink, // queries & mutations → HTTP
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

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
      if (segments.includes('verify-email')) return;
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
  if (!publishableKey) {
    throw new Error('Add your Clerk Publishable Key to the .env file');
  }

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // Clerk Expo setup guide: https://clerk.com/docs/quickstarts/expo
    <ApolloProvider client={client}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <UserProvider>
              <AppNavigation />
            </UserProvider>
            <StatusBar style="auto" />
          </GestureHandlerRootView>
        </ThemeProvider>
      </ClerkProvider>
    </ApolloProvider>
  );
}
