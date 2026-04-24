import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { palette, brand, type as typ, shared, space, radii } from "@/constants/theme";

type Step = "email" | "code";

export default function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showNoAccount, setShowNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<string | null>(null);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem("signal_has_logged_in").then(setHasLoggedInBefore);
  }, []);

  async function handleSendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    const err = await sendOtp(trimmed);
    if (err) {
      if (err.toLowerCase().includes("signups not allowed") || err.toLowerCase().includes("not allowed")) {
        setError("We couldn't find an account for that email. Please check the email address and try again.");
        setShowNoAccount(true);
      } else {
        setError(err);
        setShowNoAccount(false);
      }
    } else {
      setStep("code");
      setCode("");
      // Auto-focus the code input after a brief delay
      setTimeout(() => codeInputRef.current?.focus(), 300);
    }
    setLoading(false);
  }

  async function handleVerifyCode() {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter the code from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    const err = await verifyOtp(email, trimmed);
    if (err) {
      setError(err);
    }
    // If no error, onAuthStateChange fires and AuthGate redirects automatically
    setLoading(false);
  }

  function handleBack() {
    setStep("email");
    setCode("");
    setError(null);
  }

  return (
    <SafeAreaView style={shared.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back link — only shown to first-time visitors who came from landing */}
          {hasLoggedInBefore !== "true" && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.backLinkText}>← Back</Text>
            </Pressable>
          )}

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

          {step === "email" ? (
            /* ── Step 1: Enter email ─────────────────────────── */
            <>
              <Text style={styles.headline}>Welcome back.</Text>
              <Text style={styles.subhead}>
                Enter your email and we'll send you a secure login link.
              </Text>

              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={shared.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.dim}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
              />

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {showNoAccount && (
                <View style={styles.noAccountActions}>
                  <Pressable
                    onPress={() => {
                      setEmail("");
                      setError(null);
                      setShowNoAccount(false);
                    }}
                    style={({ pressed }) => [styles.noAccountBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.noAccountBtnText}>Try a different email</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  loading && styles.btnDisabled,
                  pressed && !loading && { opacity: 0.85 },
                ]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#04060F" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Code</Text>
                )}
              </Pressable>

            </>
          ) : (
            /* ── Step 2: Enter code ──────────────────────────── */
            <>
              <View style={styles.sentCard}>
                <View style={styles.sentAccent} />
                <View style={styles.sentInner}>
                  <Text style={styles.sentEyebrow}>CODE SENT</Text>
                  <Text style={styles.sentTitle}>Check your email</Text>
                  <Text style={styles.sentBody}>
                    We sent a code to{" "}
                    <Text style={{ color: brand.blue, fontWeight: "700" }}>
                      {email}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={{ height: space.xl }} />

              <Text style={styles.label}>ENTER CODE</Text>
              <TextInput
                ref={codeInputRef}
                style={[shared.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="00000000"
                placeholderTextColor={palette.dim}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={handleVerifyCode}
              />

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  loading && styles.btnDisabled,
                  pressed && !loading && { opacity: 0.85 },
                ]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#04060F" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                )}
              </Pressable>

              <View style={styles.bottomRow}>
                <Pressable onPress={handleBack}>
                  <Text style={styles.linkText}>Use a different email</Text>
                </Pressable>

                <Pressable
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Text style={[styles.linkText, loading && { opacity: 0.4 }]}>
                    Resend code
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.hintText}>
                Check your spam folder if you don't see the email. The code
                expires in 10 minutes.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space["2xl"],
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Logo
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

  // Back link
  backLink: {
    marginBottom: space.lg,
    alignSelf: "flex-start",
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.muted,
  },

  // Content
  headline: {
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: space.sm,
  },
  subhead: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
    marginBottom: space["3xl"],
    lineHeight: 20,
  },
  label: { ...typ.label, color: brand.blue, marginBottom: 6 },

  // Error
  errorBox: {
    marginTop: space.md, padding: space.md, borderRadius: radii.sm,
    backgroundColor: palette.errorBg, borderWidth: 1,
    borderColor: "rgba(255,120,120,0.20)",
  },
  errorText: { ...typ.caption, color: palette.error, fontWeight: "800" },

  // Primary button
  primaryBtn: {
    marginTop: space.xl, height: 52, borderRadius: radii.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: brand.orange,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 15, fontWeight: "900", color: "#04060F" },

  // Sent card
  sentCard: {
    borderRadius: radii.xl, borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)", backgroundColor: palette.card,
    overflow: "hidden",
  },
  sentAccent: { height: 3, backgroundColor: palette.success },
  sentInner: { padding: space["2xl"], alignItems: "center" },
  sentEyebrow: { ...typ.eyebrow, color: palette.success, marginBottom: space.md },
  sentTitle: { ...typ.h3, color: palette.text, marginBottom: space.sm },
  sentBody: {
    ...typ.body, color: palette.muted, textAlign: "center",
  },

  // Code input
  codeInput: {
    fontSize: 24, fontWeight: "900", letterSpacing: 6,
    textAlign: "center", height: 60,
  },

  // Bottom links
  bottomRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: space.xl,
  },
  linkText: {
    ...typ.caption, color: palette.dim, textDecorationLine: "underline",
  },
  hintText: {
    ...typ.caption, color: palette.dim, textAlign: "center",
    marginTop: space.lg, lineHeight: 20,
  },

  // No account actions
  noAccountActions: {
    marginTop: space.md,
    gap: 10,
  },
  noAccountBtn: {
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(254,176,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,176,106,0.30)",
    alignItems: "center" as const,
  },
  noAccountBtnText: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: brand.orange,
  },
  noAccountBtnOutline: {
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center" as const,
  },
  noAccountBtnOutlineText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: palette.muted,
  },
});
