import { View } from "react-native"

/**
 * Root route. The AuthGate in _layout.tsx handles the redirect
 * to /login or /jobfit based on auth state. This component exists
 * only to give the root path a valid screen so expo-router doesn't
 * show its "page not found" screen during the brief moment between
 * splash dismissal and redirect.
 */
export default function Index() {
  return <View style={{ flex: 1, backgroundColor: "#0b1929" }} />
}
