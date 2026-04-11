import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { JobProvider } from "@/lib/job-context";
import AnimatedSplash from "@/components/AnimatedSplash";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <JobProvider>
        <StatusBar style="light" />
        <AuthGate />
      </JobProvider>
    </AuthProvider>
  );
}

/** Redirects to /login when not authenticated, to /(tabs) when authenticated. */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!splashDone) return;

    // segments[0] === undefined means we're at the root index route.
    // After splash dismisses we always land on index first, so we need
    // to push the user to their real destination based on auth state.
    const firstSegment = segments[0];
    const onLoginScreen = firstSegment === "login";
    const onTabs = firstSegment === "(tabs)";
    const onRootIndex = firstSegment === undefined;

    if (!session) {
      // Not logged in — anywhere except /login should redirect to /login
      if (!onLoginScreen) {
        router.replace("/login");
      }
    } else {
      // Logged in — if on /login or the root /index screen, push to jobfit
      if (onLoginScreen || onRootIndex) {
        router.replace("/jobfit");
      }
    }
  }, [session, loading, segments, splashDone]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen
          name="instructions"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="application/[id]"
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
      {!splashDone && (
        <AnimatedSplash onAnimationComplete={() => setSplashDone(true)} />
      )}
    </>
  );
}
