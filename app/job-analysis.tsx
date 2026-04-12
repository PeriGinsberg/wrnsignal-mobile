import { useState, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE = "https://wrnsignal-api.vercel.app";

// Colors
const BG = "#040D1A";
const SURFACE = "#0A1828";
const CARD = "#071220";
const ORANGE = "#FEB06A";
const BLUE = "#51ADE5";
const PURPLE = "#7B5CF6";
const TEAL = "#2DD4BF";
const CORAL = "#FF4F6D";
const GREEN = "#4ADE80";
const TEXT_PRIMARY = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.55)";
const TEXT_DIM = "rgba(255,255,255,0.35)";
const BORDER = "#1E3A5F";

type CompanyContext = {
  what_they_do?: string | null;
  company_stage?: string | null;
  clients?: string | null;
  marketing_context?: string | null;
  recent_news?: string | null;
  application_insight?: string | null;
};

type MarketReality = {
  stats?: { value: string; label: string }[];
  competitive_dynamic?: string;
  estimated_applicants?: string;
};

type AnalysisResult = {
  role_level: string;
  function: string;
  seniority_signals: string[];
  core_skills: string[];
  hidden_requirements: string[];
  competitiveness: string;
  risk_flags: string[];
  target_candidate_profile: string[];
  summary: string;
  company_name?: string;
  company_context?: CompanyContext;
  market_reality?: MarketReality;
};

const LOADING_MSGS = [
  "Reading the job description...",
  "Identifying hidden requirements...",
  "Assessing the applicant pool...",
  "Checking what they're not telling you...",
  "Building your intelligence report...",
];

function getCompColor(comp: string): string {
  if (comp === "Low") return TEAL;
  if (comp === "Medium") return ORANGE;
  return CORAL;
}

export default function JobAnalysisScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[idx]);
    }, 2500);
    return () => clearInterval(iv);
  }, [loading]);

  async function handleAnalyze() {
    setError("");
    if (!companyName.trim()) { setError("Enter the company name."); return; }
    if (!jobTitle.trim()) { setError("Enter the job title."); return; }
    if (jd.trim().length < 100) {
      setError("Paste the full job description (at least 100 characters).");
      return;
    }
    setLoading(true);
    setLoadingMsg(LOADING_MSGS[0]);
    try {
      const res = await fetch(`${API_BASE}/api/job-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jd.trim(),
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analysis failed.");
      setResult(data as AnalysisResult);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    setResult(null);
    setJd("");
    setCompanyName("");
    setJobTitle("");
    setError("");
  }

  if (result) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Header bar */}
          <View style={s.topBar}>
            <Text style={s.logoText}>SIGNAL<Text style={{ color: ORANGE }}>—</Text></Text>
            <Pressable onPress={handleStartOver}>
              <Text style={s.runAnother}>Run another →</Text>
            </Pressable>
          </View>

          {/* Breadcrumb */}
          <Text style={s.breadcrumb}>
            {result.role_level} · {result.function}{result.company_name ? ` · ${result.company_name}` : ""}
          </Text>

          {/* Job title */}
          <Text style={s.resultTitle}>{jobTitle || result.function}</Text>
          {result.company_name && <Text style={s.resultCompany}>{result.company_name}</Text>}

          {/* Summary */}
          <Text style={s.resultSummary}>{result.summary}</Text>

          {/* Stat pills */}
          <View style={s.pillRow}>
            <StatPill
              label="APPLICANTS"
              value={result.market_reality?.stats?.[0]?.value || result.market_reality?.estimated_applicants || "—"}
              color={ORANGE}
            />
            <StatPill label="COMPETITION" value={result.competitiveness} color={getCompColor(result.competitiveness)} />
            <StatPill label="HARD SKILLS" value={`${result.core_skills.length} req`} color={BLUE} />
            <StatPill label="LEVEL" value={result.role_level} color={PURPLE} />
          </View>

          {/* Company Intelligence */}
          {result.company_context && (
            <IntelCard title="COMPANY INTELLIGENCE" color={PURPLE} badge="CLASSIFIED" cc={result.company_context} companyName={result.company_name || ""} />
          )}

          {/* Hard Skills */}
          <View style={[s.card, { borderColor: ORANGE + "33" }]}>
            <CardHeader label="HARD SKILLS REQUIRED" color={ORANGE} />
            <View style={s.cardBody}>
              <View style={s.skillWrap}>
                {result.core_skills.map((skill, i) => (
                  <View key={i} style={s.skillTag}>
                    <Text style={s.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Strong Candidate */}
          <View style={[s.card, { borderColor: TEAL + "33" }]}>
            <CardHeader label="STRONG CANDIDATE LOOKS LIKE" color={TEAL} />
            <View style={s.cardBody}>
              {result.target_candidate_profile.map((item, i) => (
                <View key={i} style={s.checkRow}>
                  <View style={[s.checkIcon, { borderColor: TEAL + "55" }]}>
                    <Text style={{ color: TEAL, fontSize: 10, fontWeight: "900" }}>✓</Text>
                  </View>
                  <Text style={s.checkText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hidden Reality */}
          <View style={[s.card, { borderColor: PURPLE + "33" }]}>
            <CardHeader label="THE HIDDEN REALITY" color={PURPLE} badge="WHAT THE JD DOESN'T SAY" />
            <View style={s.cardBody}>
              <Text style={s.sectionHeadline}>What every hiring manager expects — but no one writes down.</Text>
              {result.hidden_requirements.map((item, i) => (
                <View key={i} style={[s.numberedRow, i < result.hidden_requirements.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: CARD }]}>
                  <Text style={s.numberedNum}>{String(i + 1).padStart(2, "0")}</Text>
                  <Text style={s.numberedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Risk Flags */}
          <View style={[s.card, { borderColor: CORAL + "33" }]}>
            <CardHeader label="RISK FLAGS" color={CORAL} badge="READ BEFORE YOU APPLY" badgeColor={CORAL} />
            <View style={s.cardBody}>
              {result.risk_flags.map((flag, i) => (
                <View key={i} style={s.riskItem}>
                  <Text style={{ color: CORAL, fontSize: 12, marginTop: 1 }}>⚠</Text>
                  <Text style={s.riskText}>{flag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Market Reality */}
          {result.market_reality && (
            <View style={[s.card, { borderColor: PURPLE + "33" }]}>
              <CardHeader label="MARKET REALITY" color={PURPLE} />
              <View style={s.cardBody}>
                {result.market_reality.stats && result.market_reality.stats.length > 0 && (
                  <View style={s.statsRow}>
                    {result.market_reality.stats.map((st, i) => {
                      const colors = [PURPLE, ORANGE, CORAL];
                      return (
                        <View key={i} style={s.statBox}>
                          <Text style={[s.statValue, { color: colors[i % 3] }]}>{st.value}</Text>
                          <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                {result.market_reality.competitive_dynamic && (
                  <View style={s.dynamicBox}>
                    <Text style={{ color: PURPLE, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 4 }}>THE REAL COMPETITIVE DYNAMIC</Text>
                    <Text style={s.dynamicText}>{result.market_reality.competitive_dynamic}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Upgrade CTA */}
          <View style={s.upgradeCta}>
            <Text style={s.upgradeTitle}>Want to know how competitive <Text style={{ color: ORANGE }}>YOU</Text> are?</Text>
            <Text style={s.upgradeSub}>Full SIGNAL scores your specific profile against this role — fit score, cover letter, networking plan, and resume rewrites.</Text>
            <Pressable
              style={({ pressed }) => [s.upgradeBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/landing")}
            >
              <LinearGradient colors={["#FF6B00", "#FEB06A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gradBtn}>
                <Text style={s.upgradeBtnText}>Get full SIGNAL access · $99 →</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={{ paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ color: BLUE, fontSize: 13, fontWeight: "700" }}>← Back</Text>
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Input state
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Text style={{ color: BLUE, fontSize: 13, fontWeight: "700" }}>← Back</Text>
          </Pressable>

          {/* Logo */}
          <Text style={s.logoText}>SIGNAL<Text style={{ color: ORANGE }}>—</Text></Text>
          <Text style={s.logoSub}>FREE JOB INTELLIGENCE</Text>

          {/* Headline */}
          <Text style={s.inputHeadline}>Paste any job description.{"\n"}See what they're not telling you.</Text>
          <Text style={s.inputSub}>No account needed. Real intelligence in under 30 seconds.</Text>

          {/* Inputs */}
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Company name *"
              placeholderTextColor={TEXT_DIM}
            />
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="Job title *"
              placeholderTextColor={TEXT_DIM}
            />
          </View>

          <TextInput
            style={s.textarea}
            value={jd}
            onChangeText={setJd}
            placeholder="Paste the full job description here..."
            placeholderTextColor={TEXT_DIM}
            multiline
            scrollEnabled
          />

          {/* Char hint */}
          <Text style={s.charHint}>
            {jd.length < 100
              ? "Paste the full posting for best results"
              : `${jd.length} characters — ready to analyze`}
          </Text>

          {/* Error */}
          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Analyze button */}
          <Pressable
            onPress={handleAnalyze}
            disabled={loading}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={loading ? ["#333", "#333"] : ["#FF6B00", "#FEB06A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.analyzeBtn}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={s.analyzeBtnText}>{loadingMsg}</Text>
                </View>
              ) : (
                <Text style={s.analyzeBtnText}>Analyze this role →</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Tag line */}
          <View style={s.tagRow}>
            <View style={[s.tagDot, { backgroundColor: GREEN }]} />
            <Text style={s.tagText}>FREE · No account · Results in ~30 seconds</Text>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Sub-components

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillLabel}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

function CardHeader({ label, color, badge, badgeColor }: { label: string; color: string; badge?: string; badgeColor?: string }) {
  return (
    <View style={s.cardHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={[s.headerDot, { backgroundColor: color }]} />
        <Text style={[s.headerLabel, { color }]}>{label}</Text>
      </View>
      {badge && (
        <View style={[s.badge, { backgroundColor: (badgeColor || color) + "22", borderColor: (badgeColor || color) + "44" }]}>
          <Text style={[s.badgeText, { color: badgeColor || color }]}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

function IntelCard({ title, color, badge, cc, companyName }: { title: string; color: string; badge: string; cc: CompanyContext; companyName: string }) {
  const items: { label: string; text: string }[] = [];
  if (cc.what_they_do) items.push({ label: "WHAT THEY DO", text: cc.what_they_do });
  if (cc.company_stage) items.push({ label: "COMPANY STAGE", text: cc.company_stage });
  if (cc.clients) items.push({ label: "CLIENTS", text: cc.clients });
  if (cc.marketing_context) items.push({ label: "MARKETING CONTEXT", text: cc.marketing_context });
  if (cc.recent_news) items.push({ label: "RECENT NEWS", text: cc.recent_news });

  return (
    <View style={[s.card, { borderColor: color + "33" }]}>
      <CardHeader label={title} color={color} badge={badge} />
      <View style={s.cardBody}>
        <Text style={s.sectionHeadline}>What you need to know about {companyName}</Text>
        {items.map((item, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={s.intelLabel}>{item.label}</Text>
            <Text style={s.intelText}>{item.text}</Text>
          </View>
        ))}
        {cc.application_insight && (
          <View style={s.insightBox}>
            <Text style={{ color: PURPLE, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 3 }}>WHY THIS MATTERS</Text>
            <Text style={s.insightText}>{cc.application_insight}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Styles
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Top bar
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoText: { fontSize: 22, fontWeight: "900", fontStyle: "italic", color: "#fff", letterSpacing: -0.5 },
  logoSub: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: TEAL, marginTop: 2, marginBottom: 20 },
  runAnother: { fontSize: 12, fontWeight: "700", color: BLUE },

  // Breadcrumb
  breadcrumb: { fontSize: 10, letterSpacing: 1, color: TEXT_DIM, textTransform: "uppercase", marginBottom: 8 },

  // Result header
  resultTitle: { fontSize: 28, fontWeight: "900", fontStyle: "italic", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
  resultCompany: { fontSize: 14, fontWeight: "700", color: BLUE, marginBottom: 10 },
  resultSummary: { fontSize: 13, color: TEXT_MUTED, lineHeight: 21, marginBottom: 20 },

  // Stat pills
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  pill: { backgroundColor: CARD, borderWidth: 0.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pillLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1, color: TEXT_DIM, textTransform: "uppercase", marginBottom: 2 },
  pillValue: { fontSize: 14, fontWeight: "900", fontStyle: "italic" },

  // Cards
  card: { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 0.5, marginBottom: 14, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: CARD },
  headerDot: { width: 6, height: 6, borderRadius: 3 },
  headerLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  badge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  cardBody: { padding: 14 },

  // Section headline
  sectionHeadline: { fontSize: 16, fontWeight: "900", fontStyle: "italic", color: "#fff", marginBottom: 14 },

  // Skills
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillTag: { backgroundColor: BLUE + "22", borderWidth: 0.5, borderColor: BLUE + "44", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  skillText: { fontSize: 11, fontWeight: "600", color: BLUE },

  // Checklist
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  checkIcon: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkText: { flex: 1, fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },

  // Numbered list
  numberedRow: { flexDirection: "row", gap: 10, paddingVertical: 9 },
  numberedNum: { fontSize: 10, fontWeight: "900", fontStyle: "italic", color: PURPLE, width: 20 },
  numberedText: { flex: 1, fontSize: 12, color: TEXT_MUTED, lineHeight: 19 },

  // Risk
  riskItem: { flexDirection: "row", gap: 8, backgroundColor: CARD, borderRadius: 8, padding: 10, borderLeftWidth: 2, borderLeftColor: CORAL, marginBottom: 6 },
  riskText: { flex: 1, fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },

  // Market stats
  statsRow: { flexDirection: "row", gap: 1, borderRadius: 10, overflow: "hidden", marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: CARD, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "900", fontStyle: "italic", marginBottom: 4 },
  statLabel: { fontSize: 10, color: TEXT_DIM, textAlign: "center", lineHeight: 14 },
  dynamicBox: { backgroundColor: CARD, borderLeftWidth: 2, borderLeftColor: PURPLE, borderRadius: 8, padding: 12 },
  dynamicText: { fontSize: 12, color: TEXT_MUTED, lineHeight: 19 },

  // Intel
  intelLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: TEXT_DIM, textTransform: "uppercase", marginBottom: 3 },
  intelText: { fontSize: 11, color: TEXT_MUTED, lineHeight: 17 },
  insightBox: { backgroundColor: CARD, borderLeftWidth: 2, borderLeftColor: PURPLE, borderTopRightRadius: 8, borderBottomRightRadius: 8, padding: 10, marginTop: 6 },
  insightText: { fontSize: 11, color: TEXT_MUTED, lineHeight: 17 },

  // Upgrade CTA
  upgradeCta: { backgroundColor: SURFACE, borderWidth: 1, borderColor: ORANGE + "33", borderRadius: 16, padding: 24, marginTop: 10, alignItems: "center" },
  upgradeTitle: { fontSize: 20, fontWeight: "900", fontStyle: "italic", color: "#fff", textAlign: "center", marginBottom: 10 },
  upgradeSub: { fontSize: 13, color: TEXT_DIM, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  upgradeBtn: { width: "100%", borderRadius: 10, overflow: "hidden" },
  gradBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 10 },
  upgradeBtnText: { fontSize: 15, fontWeight: "900", fontStyle: "italic", color: "#fff" },

  // Input state
  inputHeadline: { fontSize: 26, fontWeight: "900", fontStyle: "italic", color: "#fff", lineHeight: 32, marginBottom: 10 },
  inputSub: { fontSize: 14, color: TEXT_MUTED, marginBottom: 24 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textarea: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 180,
    textAlignVertical: "top",
    marginBottom: 6,
  },
  charHint: { fontSize: 11, color: TEXT_DIM, marginBottom: 10 },
  error: { fontSize: 12, color: CORAL, marginBottom: 10 },
  analyzeBtn: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  analyzeBtnText: { fontSize: 15, fontWeight: "900", fontStyle: "italic", color: "#fff" },
  tagRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 11, color: TEXT_DIM },
  gradBtnText: { fontSize: 15, fontWeight: "900", fontStyle: "italic" },
});
