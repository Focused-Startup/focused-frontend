import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function LandingLayout() {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />
        </Stack>
    )
}