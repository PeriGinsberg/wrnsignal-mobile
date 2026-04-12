import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

/** Redirects based on auth state and whether the user has logged in before. */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<string | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("signal_has_logged_in").then((val) => {
      setHasLoggedInBefore(val);
      setStorageChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!splashDone) return;
    if (!storageChecked) return;

    const firstSegment = segments[0];
    const onLoginScreen = firstSegment === "login";
    const onLandingScreen = firstSegment === "landing";
    const onJobAnalysis = firstSegment === "job-analysis";
    const onRootIndex = firstSegment === undefined;

    if (!session) {
      // No session — route to landing (never logged in) or login (returning user)
      // Allow job-analysis without auth (it's the free tool)
      if (!onLoginScreen && !onLandingScreen && !onJobAnalysis) {
        if (hasLoggedInBefore === "true") {
          router.replace("/login");
        } else {
          router.replace("/landing");
        }
      }
    } else {
      // Logged in — go to tracker tab
      if (onLoginScreen || onLandingScreen || onRootIndex) {
        router.replace("/(tabs)/tracker");
      }
    }
  }, [session, loading, segments, splashDone, storageChecked, hasLoggedInBefore]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="job-analysis" />
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
