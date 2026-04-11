import { useState, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useJob } from "@/lib/job-context";
import { runPositioning as apiRunPositioning } from "@/lib/api";
import { RunButton } from "@/components/RunButton";
import { CompletionIndicator } from "@/components/CompletionIndicator";
import { SectionCard } from "@/components/SectionCard";
import { CopyButton } from "@/components/CopyButton";
import { GradientBar } from "@/components/GradientBar";
import {
  palette, brand, type as typ, shared, space, radii, gradients,
} from "@/constants/theme";

/* ── helpers ─────────────────────────────────────────────────── */

function toSafeLine(x: any): string {
  if (x == null) return "";
  if (typeof x === "string") return x.trim();
  try { return JSON.stringify(x); } catch { return String(x); }
}

function pickText(obj: any, keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default function PositioningScreen() {
  const { accessToken } = useAuth();
  const { job, positioningResult, setPositioningResult } = useJob();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!job.trim()) { setError("Paste a job description on the Job Fit tab first."); return; }
    if (!accessToken) { setError("Please log in again."); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await apiRunPositioning(accessToken, job);
      setPositioningResult(result);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [job, accessToken]);

  const r = positioningResult?.result ?? positioningResult ?? null;
  const hasResult = !!r;

  // Extract data from result
  const intro = hasResult ? String((r as any)?.student_intro ?? (r as any)?.studentIntro ?? "").trim() : "";

  const editsRaw: any[] = hasResult
    ? ((r as any)?.resume_bullet_edits ?? (r as any)?.resumeBulletEdits ?? (r as any)?.bullet_edits ?? (r as any)?.bulletEdits ?? [])
    : [];

  const edits = editsRaw.map((e: any) => {
    if (typeof e === "string") return { before: "", after: e.trim(), why: "" };
    return {
      before: pickText(e, ["before", "before_bullet", "beforeBullet", "original", "original_bullet"]),
      after: pickText(e, ["after", "after_bullet", "afterBullet", "revised", "revised_bullet", "updated", "updated_bullet", "new", "new_bullet", "newBullet"]),
      why: pickText(e, ["why", "rationale", "reason", "explanation", "notes"]),
    };
  }).filter((x) => (x.before || x.after) && x.before !== x.after);

  const drivers: string[] = hasResult
    ? (Array.isArray((r as any)?.primary_match_drivers) ? (r as any).primary_match_drivers
      : Array.isArray((r as any)?.primaryMatchDrivers) ? (r as any).primaryMatchDrivers
      : Array.isArray((r as any)?.role_angle?.evidence) ? (r as any).role_angle.evidence
      : []
    ).map(toSafeLine).filter(Boolean)
    : [];

  const summary = hasResult ? ((r as any)?.summary_statement ?? (r as any)?.summaryStatement ?? null) : null;
  const summaryText = typeof summary === "string" ? summary.trim()
    : summary?.recommended_summary ?? summary?.recommendedSummary ?? "";
  const summaryWhy = typeof summary === "object" ? String(summary?.why ?? "").trim() : "";
  const needSummary = typeof summary === "object" ? String(summary?.need_summary ?? summary?.needSummary ?? "").trim() : "";

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <ScrollView contentContainerStyle={shared.scrollContent} keyboardShouldPersistTaps="handled">
        <CompletionIndicator current={2} />
        <Text style={s.title}>Positioning</Text>

        {!hasResult && (
          <Text style={s.subtitle}>
            Rewrite your resume bullets to match the exact language this hiring manager is scanning for.
          </Text>
        )}

        {error && (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        )}

        {!hasResult && (
          <RunButton
            label="Run Positioning"
            onPress={handleRun}
            loading={loading}
            loadingHint="Analyzing your resume against this role..."
          />
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {hasResult && (
          <View style={{ marginTop: space.xl }}>

            {/* Intro */}
            {intro ? (
              <View style={s.introCard}>
                <GradientBar colors={["#51ADE5", "#218C8C", "#FEB06A"]} />
                <View style={{ padding: space.xl }}>
                  <Text style={s.introEyebrow}>POSITIONING ANALYSIS</Text>
                  <Text style={s.introText}>{intro}</Text>
                </View>
              </View>
            ) : null}

            {/* Bullet edits */}
            {edits.length > 0 && (
              <SectionCard
                gradientColors={["#FEB06A", "#f97316", "#FEB06A"]}
                icon="1"
                iconBg="rgba(254,176,106,0.15)"
                iconColor={brand.orange}
                title="Optimize Key Bullets"
                titleColor={brand.orange}
                subtitle="Copy these rewrites into your resume"
                badge={`${edits.length} edits`}
                badgeBg="rgba(254,176,106,0.12)"
                badgeColor={brand.orange}
              >
                {edits.map((b, i) => (
                  <View key={i} style={s.editCard}>
                    {/* Before */}
                    <View style={s.editHalf}>
                      <Text style={s.editLabel}>BEFORE</Text>
                      <Text style={s.editBefore}>{b.before || "—"}</Text>
                    </View>
                    {/* After */}
                    <View style={[s.editHalf, s.editAfterBg]}>
                      <Text style={s.editAfterLabel}>AFTER — COPY THIS</Text>
                      <Text style={s.editAfter}>{b.after || "—"}</Text>
                      {b.after && <CopyButton text={b.after} label="Copy bullet" />}
                    </View>
                    {/* Why */}
                    {b.why ? (
                      <View style={s.editWhyRow}>
                        <Text style={s.editWhyLabel}>WHY</Text>
                        <Text style={s.editWhyText}>{b.why}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </SectionCard>
            )}

            {/* Summary statement */}
            {summary && (
              <SectionCard
                gradientColors={["#51ADE5", "#218C8C", "#51ADE5"]}
                icon="2"
                iconBg="rgba(81,173,229,0.15)"
                iconColor={brand.blue}
                title="Align Your Summary"
                titleColor={brand.blue}
                subtitle={needSummary === "NO"
                  ? "Your current summary works for this role"
                  : "Swap in this summary before you apply"
                }
              >
                {summaryWhy ? <Text style={s.summaryWhy}>{summaryWhy}</Text> : null}
                {summaryText ? (
                  <View style={s.summaryBox}>
                    <Text style={s.summaryBoxLabel}>COPY THIS INTO YOUR RESUME SUMMARY</Text>
                    <Text style={s.summaryBoxText}>{summaryText}</Text>
                    <CopyButton text={summaryText} label="Copy summary" />
                  </View>
                ) : (
                  <Text style={s.dimText}>No summary guidance was generated for this job.</Text>
                )}
              </SectionCard>
            )}

            {/* Match drivers */}
            {drivers.length > 0 && (
              <SectionCard
                gradientColors={gradients.why}
                icon="✦"
                iconBg="rgba(74,222,128,0.12)"
                iconColor="#4ade80"
                title="Why These Changes Work"
                titleColor="#4ade80"
                subtitle="Mention these in your cover letter and interview"
                badge={`${drivers.length} signals`}
                badgeBg="rgba(74,222,128,0.10)"
                badgeColor="#4ade80"
              >
                {drivers.map((d, i) => (
                  <View key={i} style={s.driverRow}>
                    <View style={s.driverDot}><Text style={s.driverCheck}>✓</Text></View>
                    <Text style={s.driverText}>{d}</Text>
                  </View>
                ))}
              </SectionCard>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  eyebrow: { ...typ.eyebrow, color: brand.orange, marginBottom: space.sm },
  title: { ...typ.h1, color: palette.text, marginBottom: space.sm },
  subtitle: { ...typ.body, color: palette.muted, marginBottom: space.xl },

  errorBox: {
    marginBottom: space.md, padding: space.md, borderRadius: radii.sm,
    backgroundColor: palette.errorBg, borderWidth: 1, borderColor: "rgba(255,120,120,0.20)",
  },
  errorText: { ...typ.caption, color: palette.error, fontWeight: "800" },

  // Intro
  introCard: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: "rgba(81,173,229,0.20)",
    backgroundColor: palette.cardDeep, overflow: "hidden", marginBottom: 20,
  },
  introEyebrow: { ...typ.eyebrow, color: "rgba(81,173,229,0.65)", marginBottom: 10 },
  introText: { fontSize: 15, lineHeight: 24, color: "rgba(255,255,255,0.88)" },

  // Edits
  editCard: {
    borderRadius: radii.lg, borderWidth: 1, borderColor: palette.borderSoft,
    backgroundColor: "rgba(255,255,255,0.03)", overflow: "hidden", marginBottom: 10,
  },
  editHalf: { padding: 14 },
  editAfterBg: { backgroundColor: "rgba(74,222,128,0.06)" },
  editLabel: {
    fontSize: 9, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase",
    color: "rgba(255,255,255,0.25)", marginBottom: 8,
  },
  editAfterLabel: {
    fontSize: 9, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase",
    color: "#4ade80", marginBottom: 8,
  },
  editBefore: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.40)" },
  editAfter: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.88)", marginBottom: 10 },
  editWhyRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingVertical: 9, paddingHorizontal: 14, borderTopWidth: 1,
    borderTopColor: "rgba(254,176,106,0.10)", backgroundColor: "rgba(254,176,106,0.04)",
  },
  editWhyLabel: {
    fontSize: 9, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase",
    color: "rgba(254,176,106,0.70)", marginTop: 2,
  },
  editWhyText: { flex: 1, fontSize: 12, lineHeight: 18, color: palette.muted },

  // Summary
  summaryWhy: { fontSize: 13, lineHeight: 20, color: palette.muted, marginBottom: space.lg },
  summaryBox: {
    padding: 14, borderRadius: radii.md, backgroundColor: "rgba(81,173,229,0.06)",
    borderWidth: 1, borderColor: "rgba(81,173,229,0.18)",
  },
  summaryBoxLabel: {
    ...typ.eyebrow, color: brand.blue, marginBottom: 8,
  },
  summaryBoxText: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.88)", marginBottom: 10 },
  dimText: { fontSize: 14, color: palette.dim },

  // Drivers
  driverRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  driverDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(74,222,128,0.12)",
    borderWidth: 1.5, borderColor: "rgba(74,222,128,0.40)",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  driverCheck: { fontSize: 11, fontWeight: "900", color: "#4ade80" },
  driverText: { flex: 1, fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.85)" },
});
