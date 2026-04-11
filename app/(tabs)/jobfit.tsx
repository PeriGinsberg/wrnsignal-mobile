import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import { useJob } from "@/lib/job-context";
import { runJobFit as apiRunJobFit, loadPersonas } from "@/lib/api";
import { RunButton } from "@/components/RunButton";
import { CompletionIndicator } from "@/components/CompletionIndicator";
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

/* ── helpers ─────────────────────────────────────────────────── */

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

export default function JobFitScreen() {
  const { accessToken } = useAuth();
  const {
    job, setJob,
    jobContext, setJobContext,
    selectedPersonaId, setSelectedPersonaId,
    personas, setPersonas,
    jobFitResult, setJobFitResult,
    runNewJob,
  } = useJob();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personasLoading, setPersonasLoading] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);

  // Load personas on mount
  useEffect(() => {
    if (!accessToken || personas.length > 0) return;
    setPersonasLoading(true);
    loadPersonas(accessToken)
      .then((list) => {
        setPersonas(list);
        const def = list.find((p) => p.is_default) ?? list[0];
        if (def && !selectedPersonaId) setSelectedPersonaId(def.id);
      })
      .catch(() => {})
      .finally(() => setPersonasLoading(false));
  }, [accessToken]);

  const handleRun = useCallback(async () => {
    if (!job.trim()) { setError("Paste a job description first."); return; }
    if (!jobContext.title.trim()) { setError("Enter the job title before running JobFit."); return; }
    if (!jobContext.company.trim()) { setError("Enter the company name before running JobFit."); return; }
    if (!accessToken) { setError("Please log in again."); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await apiRunJobFit(
        accessToken,
        job,
        jobContext.title,
        jobContext.company,
        selectedPersonaId
      );
      setJobFitResult(result);
      // Keep whatever the server echoed back as the authoritative
      // display values — it will normally match what the user typed
      // because the backend injects user-provided title/company
      // before scoring runs.
      const title = String(result?.job_signals?.jobTitle ?? result?.job_title ?? jobContext.title).trim();
      const company = String(result?.job_signals?.companyName ?? result?.company ?? jobContext.company).trim();
      if (title || company) setJobContext({ title, company });
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [job, accessToken, selectedPersonaId, jobContext.title, jobContext.company]);

  const r = jobFitResult;
  const hasResult = !!r;

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <ScrollView contentContainerStyle={shared.scrollContent} keyboardShouldPersistTaps="handled">

        <CompletionIndicator current={1} />

        {/* ── Job input ──────────────────────────────────────── */}
        {!hasResult && (
          <>
            <Text style={s.title}>Job Fit</Text>
            <Text style={s.subtitle}>
              Paste a job description and get a clear decision before you apply.
            </Text>
          </>
        )}

        {/* ── Before results: full input area ────────────── */}
        {!hasResult && (
          <>
            {/* Persona selector */}
            {personas.length > 1 && (
              <View style={s.personaRow}>
                <Text style={s.personaLabel}>EVALUATING AS</Text>
                <View style={s.personaChips}>
                  {personas.map((p) => {
                    const active = selectedPersonaId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setSelectedPersonaId(p.id)}
                        style={[s.personaChip, active && s.personaChipActive]}
                      >
                        {active && <View style={s.personaDot} />}
                        <Text style={[s.personaName, active && s.personaNameActive]}>
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Required: Job title */}
            <Text style={s.fieldLabel}>
              Job Title <Text style={s.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={shared.input}
              value={jobContext.title}
              onChangeText={(t) => setJobContext({ ...jobContext, title: t })}
              placeholder="e.g. Software Engineer"
              placeholderTextColor={palette.dim}
              autoCapitalize="words"
            />

            {/* Required: Company name */}
            <Text style={s.fieldLabel}>
              Company <Text style={s.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={shared.input}
              value={jobContext.company}
              onChangeText={(c) => setJobContext({ ...jobContext, company: c })}
              placeholder="e.g. Acme Corp"
              placeholderTextColor={palette.dim}
              autoCapitalize="words"
            />

            {/* Job description textarea */}
            <Text style={s.fieldLabel}>
              Job Description <Text style={s.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={[shared.textArea, { maxHeight: 200 }]}
              value={job}
              onChangeText={setJob}
              placeholder="Paste the full job description here..."
              placeholderTextColor={palette.dim}
              multiline
              scrollEnabled
            />
          </>
        )}

        {/* ── After results: collapsed "View Job Description" ── */}
        {hasResult && (
          <>
            <Pressable
              onPress={() => setJobExpanded(!jobExpanded)}
              style={({ pressed }) => [s.viewJobLink, pressed && { opacity: 0.6 }]}
            >
              <Text style={s.viewJobText}>
                {jobExpanded ? "Hide Job Description" : "View Job Description"}
              </Text>
            </Pressable>
            {jobExpanded && (
              <View style={s.jobPreviewCard}>
                <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
                  <Text style={s.jobPreviewText}>{job}</Text>
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Run button — hidden once results render */}
        {!hasResult && (
          <View style={{ marginTop: space.lg }}>
            <RunButton
              label="Run JobFit"
              onPress={handleRun}
              loading={loading}
              loadingHint="This takes 20-40 seconds — we're reading your full profile and the job in detail."
            />
          </View>
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {hasResult && <JobFitResults />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Result renderer (only rendered when jobFitResult is set) ── */

function JobFitResults() {
  const { jobFitResult: r, jobContext } = useJob();
  if (!r) return null;

  const decisionRaw = String(r.decision ?? "").trim();
  const dLower = decisionRaw.toLowerCase();
  const isPass = dLower.includes("pass") || dLower.includes("do not");
  const isReview = dLower.includes("review");
  const isPriority = dLower.includes("priority");
  const score = typeof r.score === "number" ? r.score : Number(r.score ?? 0);
  const hasScore = Number.isFinite(score) && score > 0;
  const nextStep = String(r.next_step ?? "").trim();

  const decisionColor = isPass ? decisionColors.pass
    : isReview ? decisionColors.review
    : isPriority ? decisionColors.priorityApply
    : decisionColors.apply;

  const stripeColors = isPass ? gradients.pass
    : isReview ? gradients.review
    : isPriority ? gradients.priorityApply
    : gradients.apply;

  const decisionWord = isPass ? "Pass"
    : isReview ? "Review"
    : isPriority ? "Priority\nApply"
    : "Apply";

  // Bullets / why
  const bullets: string[] = pickFirstArray(r.bullets, r.risk)
    .map(toSafeLine).filter(Boolean);
  // Actually, bullets are from why, risks are separate
  const whyBullets: string[] = pickFirstArray(r.bullets)
    .map(toSafeLine).filter(Boolean);
  const riskBullets: string[] = pickFirstArray(
    r.risk, (r as any)?.risk_bullets, (r as any)?.risk_flags, (r as any)?.risks
  ).map(toSafeLine).filter(Boolean);

  const whyCodes = Array.isArray(r.why_codes) ? r.why_codes : [];
  const riskCodes = Array.isArray(r.risk_codes) ? r.risk_codes : [];
  const whyStructured = Array.isArray((r as any)?.why_structured) ? (r as any).why_structured : [];
  const riskStructured = Array.isArray((r as any)?.risk_structured) ? (r as any).risk_structured : [];

  const whyCount = whyBullets.length || whyCodes.length;
  const riskCount = riskBullets.length || riskCodes.length || riskStructured.length;

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
  const ctxTitle = String(js?.jobTitle ?? "").trim() || jobContext.title;
  const ctxCompany = String(js?.companyName ?? "").trim() || jobContext.company;

  return (
    <View style={{ marginTop: space.xl }}>
      {/* Job context bar */}
      {(ctxTitle || ctxCompany) && (
        <View style={s.ctxBar}>
          <View style={{ flex: 1 }}>
            {ctxTitle ? <Text style={s.ctxTitle}>{ctxTitle}</Text> : null}
            {ctxTitle && ctxCompany ? <Text style={s.ctxAt}> at </Text> : null}
            {ctxCompany ? <Text style={s.ctxCompany}>{ctxCompany}</Text> : null}
          </View>
          <View style={s.ctxPills}>
            {isInternship && <Pill text="Internship" bg="rgba(220,254,255,0.10)" color="#DCFEFF" borderColor="rgba(220,254,255,0.20)" />}
            {locLabel ? <Pill text={locLabel} bg="rgba(81,173,229,0.12)" color={brand.blue} borderColor="rgba(81,173,229,0.24)" /> : null}
            {yearsReq !== null && <Pill text={`${yearsReq}+ yrs`} bg="rgba(255,255,255,0.07)" color={palette.muted} borderColor={palette.border} />}
          </View>
        </View>
      )}

      {/* ── Hero decision card ──────────────────────────────── */}
      <View style={s.heroCard}>
        <GradientBar colors={stripeColors} />
        <View style={s.heroInner}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroEyebrow}>SIGNAL DECISION</Text>
              <Text style={[s.heroWord, { color: decisionColor }]}>
                {decisionWord}
              </Text>
            </View>
            {hasScore && (
              <View style={s.scoreCol}>
                <Text style={s.scoreEyebrow}>FIT SCORE</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text style={[s.scoreBig, { color: decisionColor }]}>{score}</Text>
                  <Text style={s.scoreOf}>/100</Text>
                </View>
                <View style={s.scoreTrack}>
                  <View style={[s.scoreFill, { width: `${score}%`, backgroundColor: decisionColor }]} />
                </View>
              </View>
            )}
          </View>

          <View style={shared.divider} />

          {/* Gate detail */}
          {isForcePass && gateDetail ? (
            <View style={{ marginTop: space.lg, marginBottom: space.md }}>
              <Text style={s.moveLabel}>WHY THIS IS A PASS</Text>
              <Text style={s.moveText}>{gateDetail}</Text>
            </View>
          ) : null}

          {/* Next step */}
          {nextStep ? (
            <View style={[s.nextStepBox, { borderLeftColor: decisionColor }]}>
              <Text style={[s.nextStepLabel, { color: decisionColor }]}>YOUR MOVE</Text>
              <Text style={s.nextStepText}>{nextStep}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Why + Risk cards ────────────────────────────────── */}
      {whyCount > 0 && (
        <SectionCard
          gradientColors={gradients.why}
          icon="✦"
          iconBg="rgba(74,222,128,0.15)"
          iconColor="#4ade80"
          title={isPass ? "Strengths to Remember" : "Why You Are Competitive"}
          titleColor="#4ade80"
          subtitle="Lead with these in your application"
          badge={`${whyCount} signals`}
          badgeBg="rgba(74,222,128,0.10)"
          badgeColor="#4ade80"
        >
          {whyStructured.length > 0
            ? whyStructured.map((ws: any, i: number) => {
                const keyword = String(ws.keyword ?? "").trim();
                const lead = String(ws.lead ?? "").trim();
                const connection = String(ws.connection ?? "").trim();
                const action = String(ws.action ?? "").trim();
                if (!lead && !connection) return null;
                return (
                  <View key={i} style={s.bulletRow}>
                    <View style={s.whyDot}><Text style={s.whyCheck}>✓</Text></View>
                    <View style={{ flex: 1 }}>
                      {keyword ? (
                        <Text style={s.whyKeyword}>{keyword.toUpperCase()}</Text>
                      ) : null}
                      <Text style={s.bulletText}>
                        {lead}{connection ? " " + connection : ""}
                      </Text>
                      {action ? (
                        <View style={s.actionBox}>
                          <Text style={s.actionLabel}>YOUR MOVE</Text>
                          <Text style={s.actionText}>{action}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })
            : whyBullets.length > 0
            ? whyBullets.map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={s.whyDot}><Text style={s.whyCheck}>✓</Text></View>
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))
            : whyCodes.map((w, i) => {
                const note = String(w?.note ?? "").trim();
                if (!note) return null;
                return (
                  <View key={i} style={s.bulletRow}>
                    <View style={s.whyDot}><Text style={s.whyCheck}>✓</Text></View>
                    <Text style={s.bulletText}>{note}</Text>
                  </View>
                );
              })
          }
        </SectionCard>
      )}

      {riskCount > 0 && (
        <SectionCard
          gradientColors={gradients.risk}
          icon="⚠"
          iconBg="rgba(248,113,113,0.15)"
          iconColor="#f87171"
          title={isForcePass ? "Why This Is a Pass" : "Your Risks"}
          titleColor="#f87171"
          subtitle="Address these before you apply"
          badge={`${riskCount} risks`}
          badgeBg="rgba(248,113,113,0.10)"
          badgeColor="#f87171"
        >
          {(riskStructured.length > 0
            ? riskStructured.map((rs: any) => ({ text: rs.reframe, keyword: rs.keyword }))
            : riskBullets.length > 0
            ? riskBullets.map((rb) => ({ text: rb, keyword: "" }))
            : riskCodes.map((rc) => ({ text: String(rc?.risk ?? "").trim(), keyword: String(rc?.job_fact ?? "").trim() }))
          )
            .filter((item: any) => item.text)
            .map((item: any, i: number) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.riskDot}><Text style={s.riskBang}>!</Text></View>
                <View style={{ flex: 1 }}>
                  {item.keyword ? (
                    <Text style={s.riskKeyword}>{String(item.keyword).toUpperCase()}</Text>
                  ) : null}
                  <Text style={s.bulletText}>{item.text}</Text>
                </View>
              </View>
            ))
          }
        </SectionCard>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */

const s = StyleSheet.create({
  eyebrow: { ...typ.eyebrow, color: brand.orange, marginBottom: space.sm },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: space.md,
    marginBottom: space.xs,
  },
  requiredMark: {
    color: brand.orange,
    fontWeight: "700",
  },
  viewJobLink: {
    alignSelf: "flex-start",
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  viewJobText: {
    fontSize: 13,
    fontWeight: "700",
    color: brand.blue,
    textDecorationLine: "underline",
  },
  jobPreviewCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.cardDeep,
    padding: space.lg,
    marginBottom: space.lg,
  },
  jobPreviewText: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
  },
  newJobBtn: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    backgroundColor: "rgba(254,176,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(254,176,106,0.30)",
    marginBottom: space.md,
  },
  newJobBtnText: { fontSize: 12, fontWeight: "900", color: brand.orange },
  title: { ...typ.h1, color: palette.text, marginBottom: space.sm },
  subtitle: { ...typ.body, color: palette.muted, marginBottom: space.xl },

  // Persona
  personaRow: {
    marginBottom: space.lg,
    padding: space.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(254,176,106,0.25)",
    backgroundColor: "rgba(254,176,106,0.06)",
  },
  personaLabel: { ...typ.eyebrow, color: "rgba(254,176,106,0.70)", marginBottom: 10 },
  personaChips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  personaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  personaChipActive: {
    borderColor: "rgba(254,176,106,0.70)",
    backgroundColor: "rgba(254,176,106,0.15)",
  },
  personaDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: brand.orange },
  personaName: { fontSize: 13, fontWeight: "900", color: palette.muted },
  personaNameActive: { color: brand.orange },

  // Error
  errorBox: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radii.sm,
    backgroundColor: palette.errorBg,
    borderWidth: 1,
    borderColor: "rgba(255,120,120,0.20)",
  },
  errorText: { ...typ.caption, color: palette.error, fontWeight: "800" },

  // Context bar
  ctxBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    marginBottom: 14,
    gap: 12,
  },
  ctxTitle: { fontSize: 14, fontWeight: "900", color: palette.text },
  ctxAt: { fontSize: 13, color: palette.dim },
  ctxCompany: { fontSize: 13, color: palette.muted, fontWeight: "700" },
  ctxPills: { flexDirection: "row", flexWrap: "wrap", gap: 5 },

  // Hero card
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: palette.card,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroInner: { padding: space["2xl"] },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: space.xl,
  },
  heroEyebrow: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  heroWord: { fontSize: 48, fontWeight: "900", lineHeight: 48, textTransform: "uppercase" },

  // Score
  scoreCol: { alignItems: "flex-end" },
  scoreEyebrow: { ...typ.eyebrow, color: palette.dim, marginBottom: 3 },
  scoreBig: { fontSize: 42, fontWeight: "900", lineHeight: 42 },
  scoreOf: { fontSize: 15, fontWeight: "900", color: palette.dim, marginBottom: 4 },
  scoreTrack: {
    width: 100,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 7,
  },
  scoreFill: { height: "100%", borderRadius: 3 },

  // Next step
  moveLabel: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  moveText: { fontSize: 16, fontWeight: "600", lineHeight: 24, color: palette.text },
  nextStepBox: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 14,
    marginTop: space.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  nextStepLabel: { ...typ.eyebrow, marginBottom: 6 },
  nextStepText: { fontSize: 15, fontWeight: "600", lineHeight: 22, color: palette.text },

  // Bullet rows
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.82)" },

  whyDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(74,222,128,0.15)",
    borderWidth: 1.5, borderColor: "rgba(74,222,128,0.50)",
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  whyCheck: { fontSize: 11, fontWeight: "900", color: "#4ade80" },

  riskDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(248,113,113,0.15)",
    borderWidth: 1.5, borderColor: "rgba(248,113,113,0.50)",
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  riskBang: { fontSize: 11, fontWeight: "900", color: "#f87171" },
  riskKeyword: {
    fontSize: 10, fontWeight: "900", letterSpacing: 1.4,
    textTransform: "uppercase", color: "#f87171", marginBottom: 4,
  },
  whyKeyword: {
    fontSize: 10, fontWeight: "900", letterSpacing: 1.4,
    textTransform: "uppercase", color: "#4ade80", marginBottom: 4,
  },
  actionBox: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(74,222,128,0.40)",
  },
  actionLabel: {
    fontSize: 9, fontWeight: "900", letterSpacing: 1.2,
    color: "rgba(74,222,128,0.70)", marginBottom: 2,
  },
  actionText: {
    fontSize: 12, lineHeight: 17, color: "rgba(255,255,255,0.65)",
    fontStyle: "italic",
  },
});
