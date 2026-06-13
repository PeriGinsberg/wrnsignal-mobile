import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { restorePurchases } from "@/lib/iap";
import { palette, brand, shared, space, radii } from "@/constants/theme";

export default function WelcomeScreen() {
  const [restoring, setRestoring] = useState(false);

  function handleFreeScan() {
    router.push("/trial" as any);
  }

  function handleBuy() {
    Alert.alert("Coming soon", "Mobile purchases coming in the next update.");
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      const hasEntitlement =
        Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasEntitlement) {
        // Purchase found — send them to log in (email → code → in).
        router.push("/login");
      } else {
        Alert.alert(
          "No previous purchase found",
          "Try logging in with your email instead."
        );
      }
    } catch {
      // restorePurchases throws a user-safe Error on failure; treat as
      // "nothing to restore" so the user is pointed at login regardless.
      Alert.alert(
        "No previous purchase found",
        "Try logging in with your email instead."
      );
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo lockup — mirrors login.tsx:105-116 */}
        <View style={styles.logoWrap}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>SIGNAL</Text>
            <View style={styles.logoDash} />
          </View>
          <View style={styles.bylineRow}>
            <Text style={styles.bylineBy}>by</Text>
            <Text style={styles.bylineOrange}>WORKFORCE</Text>
            <Text style={styles.bylineBlue}>READY NOW</Text>
          </View>
        </View>

        {/* Headline + subhead */}
        <Text style={styles.headline}>Welcome to SIGNAL</Text>
        <Text style={styles.subhead}>Apply smarter. Get hired.</Text>

        {/* Primary CTAs */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={handleFreeScan}
        >
          <Text style={styles.primaryBtnText}>Try a free scan</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            styles.primaryBtnSpacing,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleBuy}
        >
          <Text style={styles.primaryBtnText}>Buy SIGNAL — $99</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Secondary text links */}
        <Pressable onPress={() => router.push("/login")} style={styles.linkWrap}>
          <Text style={styles.linkText}>Already a member? Log in</Text>
        </Pressable>

        <Pressable onPress={handleRestore} disabled={restoring} style={styles.linkWrap}>
          {restoring ? (
            <ActivityIndicator color={palette.muted} size="small" />
          ) : (
            <Text style={styles.linkText}>Restore previous purchase</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space["2xl"],
    paddingTop: 80,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Logo (mirrors login.tsx)
  logoWrap: { alignItems: "center", marginBottom: space["3xl"] },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoText: {
    fontSize: 36, fontWeight: "900", fontStyle: "italic",
    letterSpacing: -1, color: "#ffffff",
  },
  logoDash: {
    width: 20, height: 5, backgroundColor: brand.orange,
    borderRadius: 1, marginLeft: 5, marginBottom: 2,
  },
  bylineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  bylineBy: { fontSize: 9, fontWeight: "700", color: palette.dim },
  bylineOrange: {
    fontSize: 9, fontWeight: "900", letterSpacing: 0.8,
    color: brand.orange, textTransform: "uppercase",
  },
  bylineBlue: {
    fontSize: 9, fontWeight: "900", letterSpacing: 0.8,
    color: brand.blue, textTransform: "uppercase",
  },

  // Headline
  headline: {
    fontSize: 24, fontWeight: "900", fontStyle: "italic",
    color: "#ffffff", textAlign: "center", marginBottom: space.sm,
  },
  subhead: {
    fontSize: 14, color: palette.muted, textAlign: "center",
    marginBottom: space["3xl"], lineHeight: 20,
  },

  // Primary buttons (mirror login's primaryBtn)
  primaryBtn: {
    height: 52, borderRadius: radii.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: brand.orange,
  },
  primaryBtnSpacing: { marginTop: space.md },
  primaryBtnText: { fontSize: 15, fontWeight: "900", color: "#04060F" },

  // Divider
  divider: {
    height: 1, backgroundColor: palette.border,
    marginVertical: space["2xl"],
  },

  // Secondary links
  linkWrap: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: space.md, minHeight: 44,
  },
  linkText: {
    fontSize: 14, fontWeight: "700", color: palette.muted,
    textDecorationLine: "underline",
  },
});
