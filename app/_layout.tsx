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
import { configurePurchases } from "@/lib/iap";
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

  // Initialize RevenueCat once at startup, before any purchase call. Empty
  // deps → runs a single time on mount. configurePurchases swallows its own
  // errors (logs [iap] configure_failed), so this never blocks app boot.
  useEffect(() => {
    configurePurchases();
  }, []);

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

/** Redirects based on auth state and whether the user has logged in before.
 *  Post-1.1.0: the app is sign-in-only. No purchase UI; purchase happens on
 *  the website. First-time visitors see /about; returning users go to /login. */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<string | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("signal_has_logged_in").then((loggedIn) => {
      setHasLoggedInBefore(loggedIn);
      setStorageChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!splashDone) return;
    if (!storageChecked) return;

    const firstSegment = segments[0];
    const onLoginScreen = firstSegment === "login";
    const onAboutScreen = firstSegment === "about";
    const onWelcomeScreen = (firstSegment as string) === "welcome";
    const onTrialScreen = (firstSegment as string) === "trial";
    const onTrialResultsScreen = (firstSegment as string) === "trial-results";
    const onRootIndex = firstSegment === undefined;

    if (!session) {
      // No session — route to welcome (never logged in) or login (returning
      // user). /about stays registered as a fallback during cleanup. The
      // trial screens are anonymous-accessible, so leave session-less users
      // on them.
      if (!onLoginScreen && !onAboutScreen && !onWelcomeScreen && !onTrialScreen && !onTrialResultsScreen) {
        if (hasLoggedInBefore === "true") {
          router.replace("/login");
        } else {
          router.replace("/welcome" as any);
        }
      }
    } else {
      // Logged in — route into the app from the entry screens (incl. the
      // anonymous trial screens, which a logged-in user shouldn't sit on).
      if (onLoginScreen || onAboutScreen || onWelcomeScreen || onTrialScreen || onTrialResultsScreen || onRootIndex) {
        router.replace("/(tabs)/tracker");
      }
    }
  }, [session, loading, segments, splashDone, storageChecked, hasLoggedInBefore]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="trial" options={{ gestureEnabled: false }} />
        <Stack.Screen name="trial-results" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="about" />
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
