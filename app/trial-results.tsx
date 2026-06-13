import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { SectionCard } from "@/components/SectionCard";
import { Pill } from "@/components/Pill";
import { GradientBar } from "@/components/GradientBar";
import {
  palette,
  brand,
  type as typ,
  shared,
  space,
  radii,
  decision as decisionColors,
  gradients,
} from "@/constants/theme";
import { TRIAL_RESULT_KEY } from "./trial";

/* ── helpers (mirror jobfit.tsx) ─────────────────────────────── */
function pickFirstArray(...vals: any[]): any[] {
  for (const v of vals) if (Array.isArray(v) && v.length) return v;
  return [];
}
function toSafeLine(x: any): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "number") return String(x);
  try { return JSON.stringify(x); } catch { return String(x); }
}

// Locked premium previews — title comes from the endpoint's `locks` block;
// icon + blurb are fixed copy per feature.
const LOCKED: { key: string; icon: string; blurb: string }[] = [
  { key: "cover_letter", icon: "✉️", blurb: "A tailored cover letter in your voice, tied to this role." },
  { key: "networking", icon: "🤝", blurb: "Who to contact and exactly what to say." },
  { key: "resume_positioning", icon: "✏️", blurb: "Rewrite your bullets to match what this role scans for." },
  { key: "tracker", icon: "📋", blurb: "Track every application, interview, and offer in one place." },
];

export default function TrialResultsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TRIAL_RESULT_KEY)
      .then((raw) => {
        if (!raw) { router.replace("/trial" as any); return; }
        try { setData(JSON.parse(raw)); }
        catch { router.replace("/trial" as any); }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleUpgrade() {
    Alert.alert("Coming soon", "Buy flow coming in Unit 6.");
  }
  async function handleRunAnother() {
    await AsyncStorage.removeItem(TRIAL_RESULT_KEY);
    router.replace("/trial" as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={shared.screen}>
        <View style={styles.center}><ActivityIndicator color={brand.orange} /></View>
      </SafeAreaView>
    );
  }
  if (!data) return null; // redirecting back to /trial

  const r = data.result ?? {};
  const locks = data.locks ?? {};
  const upgrade = data.upgrade ?? {};

  // Decision
  const dl = String(r.decision ?? "").trim().toLowerCase();
  const isPass = dl.includes("pass") || dl.includes("do not");
  const isReview = dl.includes("review");
  const isPriority = dl.includes("priority");
  const score = typeof r.score === "number" ? r.score : Number(r.score ?? 0);
  const hasScore = Number.isFinite(score) && score > 0;
  const nextStep = String(r.next_step ?? "").trim();
  const decisionColor = isPass ? decisionColors.pass : isReview ? decisionColors.review : isPriority ? decisionColors.priorityApply : decisionColors.apply;
  const stripeColors = isPass ? gradients.pass : isReview ? gradients.review : isPriority ? gradients.priorityApply : gradients.apply;
  const decisionWord = isPass ? "Pass" : isReview ? "Review" : isPriority ? "Priority\nApply" : "Apply";

  // Why
  const whyStructured = Array.isArray(r.why_structured) ? r.why_structured : [];
  const whyBullets = pickFirstArray(r.bullets, r.why).map(toSafeLine).filter(Boolean);
  const whyCodes = Array.isArray(r.why_codes) ? r.why_codes : [];
  const whyCount = whyStructured.length || whyBullets.length || whyCodes.length;

  // Risk
  const riskStructured = Array.isArray(r.risk_structured) ? r.risk_structured : [];
  const riskBullets = pickFirstArray(r.risk, r.risk_bullets).map(toSafeLine).filter(Boolean);
  const riskCodes = Array.isArray(r.risk_codes) ? r.risk_codes : [];
  type RiskItem = { text: string; keyword: string; detail: string; severity?: string };
  const SEV: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const riskItems: RiskItem[] = (
    riskStructured.length > 0
      ? riskStructured.map((rs: any) => ({ text: String(rs.gap ?? "").trim(), keyword: String(rs.keyword ?? "").trim(), detail: String(rs.adjacent_evidence ?? "").trim(), severity: rs.severity }))
      : riskBullets.length > 0
      ? riskBullets.map((rb) => ({ text: rb, keyword: "", detail: "", severity: undefined }))
      : riskCodes.map((rc: any) => ({ text: String(rc?.risk ?? "").trim(), keyword: String(rc?.job_fact ?? "").trim(), detail: "", severity: rc?.severity }))
  ).filter((it: RiskItem) => it.text).sort((a: RiskItem, b: RiskItem) => (SEV[b.severity ?? ""] ?? 0) - (SEV[a.severity ?? ""] ?? 0));
  const riskCount = riskItems.length;

  const gate = r.gate_triggered ?? { type: "none" };
  const isForcePass = gate?.type === "force_pass";
  const gateDetail = String(gate?.detail ?? "").trim();

  // Job signals
  const js = r.job_signals ?? {};
  const isInternship = js?.internship?.isInternship === true;
  const locCity = String(js?.location?.city ?? "").trim();
  const locMode = String(js?.location?.mode ?? "").trim();
  const locLabel = locCity || (locMode === "remote" ? "Remote" : locMode === "hybrid" ? "Hybrid" : locMode === "in_person" ? "On-site" : "");
  const yearsReq = js?.yearsRequired ?? null;
  const ctxTitle = String(js?.jobTitle ?? "").trim();
  const ctxCompany = String(js?.companyName ?? "").trim();

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Job context bar */}
        {(ctxTitle || ctxCompany) && (
          <View style={styles.ctxBar}>
            <View style={{ flex: 1 }}>
              {ctxTitle ? <Text style={styles.ctxTitle}>{ctxTitle}</Text> : null}
              {ctxCompany ? <Text style={styles.ctxCompany}>{ctxCompany}</Text> : null}
            </View>
            <View style={styles.ctxPills}>
              {isInternship && <Pill text="Internship" bg="rgba(220,254,255,0.10)" color="#DCFEFF" borderColor="rgba(220,254,255,0.20)" />}
              {locLabel ? <Pill text={locLabel} bg="rgba(81,173,229,0.12)" color={brand.blue} borderColor="rgba(81,173,229,0.24)" /> : null}
              {yearsReq !== null && <Pill text={`${yearsReq}+ yrs`} bg="rgba(255,255,255,0.07)" color={palette.muted} borderColor={palette.border} />}
            </View>
          </View>
        )}

        {/* Hero decision card */}
        <View style={styles.heroCard}>
          <GradientBar colors={stripeColors} />
          <View style={styles.heroInner}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroEyebrow}>SIGNAL DECISION</Text>
                <Text style={[styles.heroWord, { color: decisionColor }]}>{decisionWord}</Text>
              </View>
              {hasScore && (
                <View style={styles.scoreCol}>
                  <Text style={styles.scoreEyebrow}>FIT SCORE</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={[styles.scoreBig, { color: decisionColor }]}>{score}</Text>
                    <Text style={styles.scoreOf}>/100</Text>
                  </View>
                  <View style={styles.scoreTrack}><View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: decisionColor }]} /></View>
                </View>
              )}
            </View>

            <View style={shared.divider} />

            {isForcePass && gateDetail ? (
              <View style={{ marginTop: space.lg }}>
                <Text style={styles.moveLabel}>WHY THIS IS A PASS</Text>
                <Text style={styles.moveText}>{gateDetail}</Text>
              </View>
            ) : null}

            {nextStep ? (
              <View style={[styles.nextStepBox, { borderLeftColor: decisionColor }]}>
                <Text style={[styles.nextStepLabel, { color: decisionColor }]}>YOUR MOVE</Text>
                <Text style={styles.nextStepText}>{nextStep}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Why */}
        {whyCount > 0 && (
          <SectionCard
            gradientColors={gradients.why} icon="✦" iconBg="rgba(74,222,128,0.15)" iconColor="#4ade80"
            title={isPass ? "Strengths to Remember" : "Why You Are Competitive"} titleColor="#4ade80"
            subtitle="Lead with these in your application" badge={`${whyCount} signals`} badgeBg="rgba(74,222,128,0.10)" badgeColor="#4ade80"
          >
            {whyStructured.length > 0
              ? whyStructured.map((ws: any, i: number) => {
                  const keyword = String(ws.keyword ?? "").trim();
                  const lead = String(ws.lead ?? "").trim();
                  const connection = String(ws.connection ?? "").trim();
                  const action = String(ws.action ?? "").trim();
                  if (!lead && !connection) return null;
                  return (
                    <View key={i} style={styles.bulletRow}>
                      <View style={styles.whyDot}><Text style={styles.whyCheck}>✓</Text></View>
                      <View style={{ flex: 1 }}>
                        {keyword ? <Text style={styles.whyKeyword}>{keyword.toUpperCase()}</Text> : null}
                        <Text style={styles.bulletText}>{lead}{connection ? " " + connection : ""}</Text>
                        {action ? (
                          <View style={styles.actionBox}>
                            <Text style={styles.actionLabel}>YOUR MOVE</Text>
                            <Text style={styles.actionText}>{action}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              : whyBullets.length > 0
              ? whyBullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}><View style={styles.whyDot}><Text style={styles.whyCheck}>✓</Text></View><Text style={styles.bulletText}>{b}</Text></View>
                ))
              : whyCodes.map((w: any, i: number) => {
                  const note = String(w?.note ?? "").trim();
                  if (!note) return null;
                  return <View key={i} style={styles.bulletRow}><View style={styles.whyDot}><Text style={styles.whyCheck}>✓</Text></View><Text style={styles.bulletText}>{note}</Text></View>;
                })}
          </SectionCard>
        )}

        {/* Risk */}
        {riskCount > 0 && (
          <SectionCard
            gradientColors={gradients.risk} icon="⚠" iconBg="rgba(248,113,113,0.15)" iconColor="#f87171"
            title={isForcePass ? "Why This Is a Pass" : "Your Risks"} titleColor="#f87171"
            subtitle="Address these before you apply" badge={`${riskCount} risks`} badgeBg="rgba(248,113,113,0.10)" badgeColor="#f87171"
          >
            {riskItems.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.riskDot}><Text style={styles.riskBang}>!</Text></View>
                <View style={{ flex: 1 }}>
                  {(item.keyword || item.severity) ? (
                    <View style={styles.riskHeaderRow}>
                      {item.keyword ? <Text style={styles.riskKeyword}>{item.keyword.toUpperCase()}</Text> : null}
                      {item.severity ? <SeverityPill severity={item.severity} /> : null}
                    </View>
                  ) : null}
                  <Text style={styles.bulletText}>{item.text}</Text>
                  {item.detail ? <Text style={styles.riskDetail}>{item.detail}</Text> : null}
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Locked premium previews */}
        <Text style={styles.lockedHeader}>UNLOCK THE FULL TOOLKIT</Text>
        {LOCKED.map((l) => {
          const label = String(locks?.[l.key]?.label ?? l.key);
          return (
            <Pressable key={l.key} onPress={handleUpgrade} style={({ pressed }) => [styles.lockedCard, pressed && { opacity: 0.85 }]}>
              <Text style={styles.lockedIcon}>{l.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>{label}</Text>
                <Text style={styles.lockedBlurb}>{l.blurb}</Text>
              </View>
              <View style={styles.lockBadge}><Text style={styles.lockBadgeText}>🔒 Unlock</Text></View>
            </Pressable>
          );
        })}

        {/* Upgrade CTA */}
        <Pressable onPress={handleUpgrade} style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.9 }]}>
          <Text style={styles.upgradeBtnText}>Upgrade to SIGNAL — {String(upgrade?.price ?? "$99")}</Text>
        </Pressable>
        {(upgrade?.term || upgrade?.guarantee) ? (
          <Text style={styles.upgradeSub}>{[upgrade?.term, upgrade?.guarantee].filter(Boolean).join(" · ")}</Text>
        ) : null}

        {/* Footer links */}
        <Pressable onPress={handleRunAnother} style={styles.footerLink}><Text style={styles.footerLinkText}>Run another scan</Text></Pressable>
        <Pressable onPress={() => router.push("/login")} style={styles.footerLink}><Text style={styles.footerLinkText}>Already a member? Log in</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    high: { label: "High", bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
    medium: { label: "Medium", bg: "rgba(254,176,106,0.12)", color: brand.orange, border: "rgba(254,176,106,0.3)" },
    low: { label: "Low", bg: "rgba(255,255,255,0.07)", color: palette.muted, border: palette.border },
  };
  const m = map[severity] ?? map.low;
  return <Pill text={m.label} bg={m.bg} color={m.color} borderColor={m.border} />;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Context bar (mirrors jobfit)
  ctxBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 12, borderRadius: radii.md, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", marginBottom: 14, gap: 12,
  },
  ctxTitle: { fontSize: 14, fontWeight: "900", color: palette.text },
  ctxCompany: { fontSize: 13, color: palette.muted, fontWeight: "700", marginTop: 2 },
  ctxPills: { flexDirection: "row", flexWrap: "wrap", gap: 5 },

  // Hero
  heroCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", backgroundColor: palette.card, overflow: "hidden", marginBottom: 16 },
  heroInner: { padding: space["2xl"] },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.xl },
  heroEyebrow: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  heroWord: { fontSize: 48, fontWeight: "900", lineHeight: 48, textTransform: "uppercase" },
  scoreCol: { alignItems: "flex-end" },
  scoreEyebrow: { ...typ.eyebrow, color: palette.dim, marginBottom: 3 },
  scoreBig: { fontSize: 42, fontWeight: "900", lineHeight: 42 },
  scoreOf: { fontSize: 15, fontWeight: "900", color: palette.dim, marginBottom: 4 },
  scoreTrack: { width: 100, height: 3, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden", marginTop: 7 },
  scoreFill: { height: "100%", borderRadius: 3 },
  moveLabel: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  moveText: { fontSize: 16, fontWeight: "600", lineHeight: 24, color: palette.text },
  nextStepBox: { borderLeftWidth: 3, borderRadius: 10, padding: 14, marginTop: space.lg, backgroundColor: "rgba(255,255,255,0.04)" },
  nextStepLabel: { ...typ.eyebrow, marginBottom: 6 },
  nextStepText: { fontSize: 15, fontWeight: "600", lineHeight: 22, color: palette.text },

  // Bullets
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.82)" },
  whyDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(74,222,128,0.15)", borderWidth: 1.5, borderColor: "rgba(74,222,128,0.50)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  whyCheck: { fontSize: 11, fontWeight: "900", color: "#4ade80" },
  whyKeyword: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", color: "#4ade80", marginBottom: 4 },
  actionBox: { marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "rgba(74,222,128,0.40)" },
  actionLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2, color: "rgba(74,222,128,0.70)", marginBottom: 2 },
  actionText: { fontSize: 12, lineHeight: 17, color: "rgba(255,255,255,0.65)", fontStyle: "italic" },
  riskDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(248,113,113,0.15)", borderWidth: 1.5, borderColor: "rgba(248,113,113,0.50)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  riskBang: { fontSize: 11, fontWeight: "900", color: "#f87171" },
  riskKeyword: { fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", color: "#f87171", marginBottom: 4 },
  riskHeaderRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  riskDetail: { fontSize: 12, lineHeight: 18, color: palette.dim, marginTop: 4 },

  // Locked premium
  lockedHeader: { ...typ.eyebrow, color: palette.dim, marginTop: space.lg, marginBottom: space.md },
  lockedCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: space.lg, borderRadius: radii.lg, marginBottom: space.sm,
    backgroundColor: palette.cardDeep, borderWidth: 1, borderColor: palette.borderSoft,
    opacity: 0.92,
  },
  lockedIcon: { fontSize: 22 },
  lockedTitle: { fontSize: 14, fontWeight: "900", color: palette.text },
  lockedBlurb: { fontSize: 12, color: palette.muted, lineHeight: 17, marginTop: 2 },
  lockBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.sm, backgroundColor: "rgba(254,176,106,0.12)", borderWidth: 1, borderColor: "rgba(254,176,106,0.30)" },
  lockBadgeText: { fontSize: 11, fontWeight: "900", color: brand.orange },

  // Upgrade CTA
  upgradeBtn: { marginTop: space.xl, height: 54, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: brand.orange },
  upgradeBtnText: { fontSize: 16, fontWeight: "900", color: "#04060F" },
  upgradeSub: { ...typ.caption, color: palette.dim, textAlign: "center", marginTop: space.sm },

  // Footer
  footerLink: { alignItems: "center", marginTop: space.lg, paddingVertical: space.sm },
  footerLinkText: { ...typ.caption, color: palette.dim, textDecorationLine: "underline" },
});
