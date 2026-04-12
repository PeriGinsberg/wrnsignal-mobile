import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

/* ── Constants ────────────────────────────────────────────────── */

const BG = "#040D1A";
const SURFACE = "#0A1828";
const ORANGE = "#FEB06A";
const ORANGE_DEEP = "#FF6B00";
const TEAL = "#2DD4BF";
const TEAL_DARK = "#218C8C";
const CORAL = "#FF4F6D";
const BLUE = "#51ADE5";
const PURPLE = "#7B5CF6";
const MUTED = "rgba(255,255,255,0.55)";
const TEXT = "rgba(255,255,255,0.92)";
const BORDER_SUBTLE = "#1E3A5F";

const API_BASE = "https://wrnsignal-api.vercel.app";

function validateEmail(e: string) {
  return e.includes("@") && e.includes(".");
}

/* ── Pulsing dot ─────────────────────────────────────────────── */

function PulsingDot() {
  return (
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL, marginRight: 6 }} />
  );
}

/* ── Verdict card ────────────────────────────────────────────── */

type VerdictCardProps = {
  color: string;
  label: string;
  bullets: string[];
  badge: string;
};

function VerdictCard({ color, label, bullets, badge }: VerdictCardProps) {
  return (
    <View style={[styles.verdictCard, { borderColor: color + "40" }]}>
      <View style={[styles.verdictTop, { backgroundColor: color }]} />
      <View style={styles.verdictInner}>
        <Text style={[styles.verdictLabel, { color }]}>{label}</Text>
        {bullets.map((b, i) => (
          <View key={i} style={styles.verdictBulletRow}>
            <Text style={[styles.verdictDot, { color }]}>•</Text>
            <Text style={styles.verdictBullet}>{b}</Text>
          </View>
        ))}
        <View style={[styles.verdictBadge, { backgroundColor: color + "22", borderColor: color + "50" }]}>
          <Text style={[styles.verdictBadgeText, { color }]}>{badge}</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Pillar row ──────────────────────────────────────────────── */

type PillarProps = {
  num: string;
  pain: string;
  response: string;
};

function PillarRow({ num, pain, response }: PillarProps) {
  return (
    <View style={styles.pillarRow}>
      <Text style={styles.pillarNum}>{num}</Text>
      <View style={styles.pillarContent}>
        <Text style={styles.pillarPain}>{pain}</Text>
        <View style={styles.pillarResponseBox}>
          <Text style={styles.pillarResponse}>{response}</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Email + CTA block ───────────────────────────────────────── */

type EmailBlockProps = {
  email: string;
  onEmailChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onPaidPress: () => void;
  freeEmail: string;
  onFreeEmailChange: (v: string) => void;
  onFreePress: () => void;
  showLogin?: boolean;
};

function EmailBlock({
  email,
  onEmailChange,
  loading,
  error,
  onPaidPress,
  freeEmail,
  onFreeEmailChange,
  onFreePress,
  showLogin = false,
}: EmailBlockProps) {
  return (
    <View style={styles.emailBlock}>
      {/* Paid CTA */}
      <TextInput
        style={styles.emailInput}
        value={email}
        onChangeText={onEmailChange}
        placeholder="your@email.com"
        placeholderTextColor={MUTED}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
      />
      {error ? (
        <Text style={styles.emailError}>{error}</Text>
      ) : null}
      <Pressable onPress={onPaidPress} disabled={loading} style={{ marginTop: 10 }}>
        <LinearGradient
          colors={[ORANGE, ORANGE_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          {loading ? (
            <ActivityIndicator color="#04060F" size="small" />
          ) : (
            <Text style={styles.gradBtnText}>Get full access · $99 →</Text>
          )}
        </LinearGradient>
      </Pressable>
      <Text style={styles.guarantee}>30-day money-back guarantee · Cancel anytime</Text>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or try free</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Free CTA */}
      <TextInput
        style={styles.emailInputTeal}
        value={freeEmail}
        onChangeText={onFreeEmailChange}
        placeholder="your@email.com"
        placeholderTextColor={MUTED}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
      />
      <Pressable onPress={onFreePress} style={{ marginTop: 10 }}>
        <LinearGradient
          colors={[TEAL_DARK, TEAL]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={[styles.gradBtnText, { color: "#04060F" }]}>Try job analysis free →</Text>
        </LinearGradient>
      </Pressable>

      {showLogin && (
        <Pressable
          onPress={() => router.push("/login")}
          style={styles.loginRow}
        >
          <Text style={styles.loginLink}>Already a member? <Text style={{ color: ORANGE }}>Log in →</Text></Text>
        </Pressable>
      )}
    </View>
  );
}

/* ── Main screen ─────────────────────────────────────────────── */

export default function LandingScreen() {
  // Hero email block state
  const [heroEmail, setHeroEmail] = useState("");
  const [heroFreeEmail, setHeroFreeEmail] = useState("");
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);

  // Bottom email block state
  const [bottomEmail, setBottomEmail] = useState("");
  const [bottomFreeEmail, setBottomFreeEmail] = useState("");
  const [bottomLoading, setBottomLoading] = useState(false);
  const [bottomError, setBottomError] = useState<string | null>(null);

  async function handlePaidCheckout(
    email: string,
    setLoading: (v: boolean) => void,
    setError: (v: string | null) => void
  ) {
    const trimmed = email.trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data?.url) {
        await Linking.openURL(data.url);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFreeAnalysis(freeEmail: string) {
    const trimmed = (freeEmail || "").trim().toLowerCase();
    const params = validateEmail(trimmed) ? `?email=${encodeURIComponent(trimmed)}` : "";
    router.push(`/job-analysis${params}` as any);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO ────────────────────────────────────────────── */}
          <View style={styles.heroBanner}>
            <PulsingDot />
            <Text style={styles.heroBannerText}>SIGNAL iOS app — now available</Text>
          </View>

          <View style={styles.logoRow}>
            <Text style={styles.logoText}>SIGNAL</Text>
            <View style={styles.logoDash} />
          </View>

          <Text style={styles.eyebrow}>FOR STUDENTS & EARLY CAREER PROFESSIONALS</Text>

          <Text style={styles.headline}>Apply Smarter.</Text>
          <LinearGradient
            colors={[ORANGE, ORANGE_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientHeadlineWrap}
          >
            <Text style={styles.gradientHeadlineText}>Get Hired.</Text>
          </LinearGradient>

          <Text style={styles.heroSubtext}>
            Most candidates apply to the wrong jobs, the wrong way — wasting months and missing real opportunities.
          </Text>
          <Text style={styles.heroKicker}>SIGNAL fixes that — before you apply.</Text>

          {/* ── EMAIL + CTA ─────────────────────────────────────── */}
          <EmailBlock
            email={heroEmail}
            onEmailChange={setHeroEmail}
            loading={heroLoading}
            error={heroError}
            onPaidPress={() => handlePaidCheckout(heroEmail, setHeroLoading, setHeroError)}
            freeEmail={heroFreeEmail}
            onFreeEmailChange={setHeroFreeEmail}
            onFreePress={() => handleFreeAnalysis(heroFreeEmail)}
            showLogin
          />

          {/* ── CREDIBILITY BAR ─────────────────────────────────── */}
          <View style={styles.credBar}>
            <Text style={styles.credText}>
              Built from 30 years of hiring experience · Trusted by early-career professionals · Evidence-backed decisions
            </Text>
          </View>

          {/* ── VERDICT EXPLAINER ───────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>YOUR SCORE. YOUR SIGNAL.</Text>
            <Text style={styles.sectionTitle}>Four verdicts. Zero guesswork.</Text>
            <View style={styles.verdictGrid}>
              <VerdictCard
                color={TEAL}
                label="Priority Apply"
                bullets={[
                  "Strong match across all dimensions",
                  "Your background stands out",
                  "High chance of callback",
                ]}
                badge="Apply today"
              />
              <VerdictCard
                color={BLUE}
                label="Apply"
                bullets={[
                  "Solid fit with minor gaps",
                  "Role aligns with your trajectory",
                  "Worth investing time",
                ]}
                badge="Apply this week"
              />
              <VerdictCard
                color={ORANGE}
                label="Review"
                bullets={[
                  "Meaningful gaps detected",
                  "You could apply, but risks noted",
                  "Consider your positioning first",
                ]}
                badge="Proceed with caution"
              />
              <VerdictCard
                color={CORAL}
                label="Pass"
                bullets={[
                  "Significant misalignment found",
                  "Your time is better spent elsewhere",
                  "Real gaps identified",
                ]}
                badge="Save your energy"
              />
            </View>
          </View>

          {/* ── FOUR PILLARS ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>WHY SIGNAL WORKS</Text>
            <Text style={styles.sectionTitle}>We solve the four problems that sink most applications.</Text>
            <PillarRow
              num="01"
              pain="You apply to jobs that sound good but aren't actually a fit."
              response="SIGNAL scores your real match against the job's actual requirements — not keywords."
            />
            <PillarRow
              num="02"
              pain="Your resume doesn't speak the language of the role."
              response="SIGNAL flags positioning gaps and shows you exactly what to highlight."
            />
            <PillarRow
              num="03"
              pain="You don't know what's working or why you're not getting callbacks."
              response="SIGNAL gives you evidence-backed WHY codes so you learn from every analysis."
            />
            <PillarRow
              num="04"
              pain="Generic advice doesn't account for your unique background."
              response="SIGNAL personalises every verdict to your profile — not a template."
            />
          </View>

          {/* ── BOTTOM CTA ──────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start making smarter applications today.</Text>
            <EmailBlock
              email={bottomEmail}
              onEmailChange={setBottomEmail}
              loading={bottomLoading}
              error={bottomError}
              onPaidPress={() => handlePaidCheckout(bottomEmail, setBottomLoading, setBottomError)}
              freeEmail={bottomFreeEmail}
              onFreeEmailChange={setBottomFreeEmail}
              onFreePress={() => handleFreeAnalysis(bottomFreeEmail)}
              showLogin={false}
            />
            <View style={styles.pricingNote}>
              <Text style={styles.pricingText}>Full access · One-time $99 · No subscription</Text>
              <Text style={styles.pricingSubtext}>30-day money-back guarantee, no questions asked.</Text>
            </View>
          </View>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 Workforce Ready Now · SIGNAL</Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.footerLink}>Member Login</Text>
            </Pressable>
          </View>

          <View style={{ paddingBottom: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Hero banner
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D2020",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 28,
    alignSelf: "center",
  },
  heroBannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: TEAL,
    letterSpacing: 0.3,
  },

  // Logo
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 44,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#ffffff",
    letterSpacing: -1.5,
  },
  logoDash: {
    width: 22,
    height: 6,
    backgroundColor: ORANGE,
    borderRadius: 2,
    marginLeft: 6,
    marginBottom: 4,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: TEAL,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  headline: {
    fontSize: 46,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  gradientHeadlineWrap: {
    alignSelf: "flex-start",
    borderRadius: 4,
    marginBottom: 20,
  },
  gradientHeadlineText: {
    fontSize: 46,
    fontWeight: "900",
    color: "#04060F",
    letterSpacing: -1.5,
    lineHeight: 50,
    paddingHorizontal: 4,
  },
  heroSubtext: {
    fontSize: 16,
    color: MUTED,
    lineHeight: 24,
    marginBottom: 12,
  },
  heroKicker: {
    fontSize: 17,
    fontWeight: "800",
    color: ORANGE,
    marginBottom: 32,
    lineHeight: 24,
  },

  // Email block
  emailBlock: {
    marginBottom: 0,
  },
  emailInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: ORANGE + "80",
    borderRadius: 12,
    color: TEXT,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  emailInputTeal: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: TEAL + "80",
    borderRadius: 12,
    color: TEXT,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  emailError: {
    fontSize: 12,
    color: "#FF7878",
    marginTop: 6,
    fontWeight: "700",
  },
  gradBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gradBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#04060F",
    letterSpacing: 0.2,
  },
  guarantee: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_SUBTLE,
  },
  dividerText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loginRow: {
    marginTop: 18,
    alignItems: "center",
  },
  loginLink: {
    fontSize: 14,
    color: MUTED,
  },

  // Credibility bar
  credBar: {
    backgroundColor: "#070F1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    padding: 16,
    marginTop: 28,
    marginBottom: 8,
  },
  credText: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Section
  section: {
    marginTop: 40,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: ORANGE,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 20,
  },

  // Verdict grid
  verdictGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  verdictCard: {
    width: "47.5%",
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  verdictTop: {
    height: 4,
    width: "100%",
  },
  verdictInner: {
    padding: 14,
  },
  verdictLabel: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  verdictBulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 5,
  },
  verdictDot: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
  },
  verdictBullet: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 18,
    flex: 1,
  },
  verdictBadge: {
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  verdictBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Pillars
  pillarRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },
  pillarNum: {
    fontSize: 13,
    fontWeight: "900",
    color: ORANGE,
    letterSpacing: 0.5,
    width: 28,
    paddingTop: 2,
  },
  pillarContent: {
    flex: 1,
  },
  pillarPain: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
    lineHeight: 22,
    marginBottom: 8,
  },
  pillarResponseBox: {
    borderWidth: 1,
    borderColor: ORANGE + "50",
    borderRadius: 10,
    padding: 12,
    backgroundColor: ORANGE + "0A",
  },
  pillarResponse: {
    fontSize: 13,
    color: ORANGE,
    lineHeight: 20,
    fontWeight: "600",
  },

  // Pricing note
  pricingNote: {
    marginTop: 20,
    alignItems: "center",
  },
  pricingText: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 4,
  },
  pricingSubtext: {
    fontSize: 12,
    color: MUTED,
  },

  // Footer
  footer: {
    marginTop: 40,
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    color: MUTED,
  },
  footerLink: {
    fontSize: 12,
    color: ORANGE,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
