import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Constants from "expo-constants";
import {
  palette,
  brand,
  shared,
  space,
  radii,
} from "@/constants/theme";

/**
 * Unauthenticated first-run screen. Shown only to users who have never
 * signed in on this device. Returning users skip this and go straight
 * to /login. No purchase UI, no external URLs — the app is a sign-in-only
 * client for paid users (accounts are created server-side after purchase).
 */
export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "";
  const build = Constants.expoConfig?.ios?.buildNumber ?? "";

  return (
    <SafeAreaView style={shared.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
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

        {/* Heading */}
        <Text style={styles.headline}>What is SIGNAL?</Text>

        {/* Bullets */}
        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Scores whether a job is worth your time — before you apply.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Builds evidence-backed resume and cover-letter language that
              matches each role.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Tracks every application in one place.
            </Text>
          </View>
        </View>

        {/* Sign-in CTA */}
        <Pressable
          onPress={() => router.push("/login")}
          style={({ pressed }) => [
            styles.signInBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.signInBtnText}>Sign in →</Text>
        </Pressable>

        {/* Version */}
        {(version || build) && (
          <Text style={styles.versionText}>
            v{version}
            {build ? ` · build ${build}` : ""}
          </Text>
        )}
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

  // Logo — visually consistent with login.tsx
  logoWrap: { alignItems: "center", marginBottom: space["3xl"] },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoText: {
    fontSize: 44,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1.5,
    color: "#ffffff",
  },
  logoDash: {
    width: 24,
    height: 6,
    backgroundColor: brand.orange,
    borderRadius: 1,
    marginLeft: 6,
    marginBottom: 2,
  },
  bylineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  bylineBy: { fontSize: 10, fontWeight: "700", color: palette.dim },
  bylineOrange: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: brand.orange,
    textTransform: "uppercase",
  },
  bylineBlue: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: brand.blue,
    textTransform: "uppercase",
  },

  // Heading
  headline: {
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: space["2xl"],
    letterSpacing: -0.5,
  },

  // Bullets
  bulletList: {
    marginBottom: space["3xl"],
    gap: space.lg,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 18,
    fontWeight: "900",
    color: brand.orange,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: palette.muted,
    lineHeight: 22,
  },

  // Sign-in button
  signInBtn: {
    height: 54,
    borderRadius: radii.md,
    backgroundColor: brand.orange,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xl,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#04060F",
    letterSpacing: 0.2,
  },

  // Version footer
  versionText: {
    textAlign: "center",
    marginTop: space["2xl"],
    fontSize: 11,
    color: palette.dim,
    letterSpacing: 0.5,
  },
});
