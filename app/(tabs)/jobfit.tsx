import { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Modal,
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
  const [jobUrl, setJobUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [showLinkedInHelper, setShowLinkedInHelper] = useState(false);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [linkedInPasteText, setLinkedInPasteText] = useState("");
  const [linkedInPasteLoading, setLinkedInPasteLoading] = useState(false);
  const [manualStep, setManualStep] = useState<"paste" | "confirm">("paste");
  const [manualExtracting, setManualExtracting] = useState(false);

  // Reset local state when context is cleared (runNewJob from another screen)
  useEffect(() => {
    if (!jobFitResult && !job) {
      setJobUrl("");
      setUrlError("");
      setUrlLoading(false);
      setShowLinkedInHelper(false);
      setShowBlockedPopup(false);
      setLinkedInPasteText("");
      setLinkedInPasteLoading(false);
      setManualStep("paste");
      setManualExtracting(false);
      setError(null);
      setJobExpanded(false);
    }
  }, [jobFitResult, job]);

  // Load personas on mount. Kept narrow — just loads. Default-selection lives
  // in its own effect below so user taps don't get clobbered by a stale
  // closure from this .then. (When accessToken changes twice in quick
  // succession — getSession + INITIAL_SESSION on cold start, or a token
  // refresh — two concurrent loadPersonas can race; whichever lands after
  // the user has picked a non-default persona was reverting the selection.)
  useEffect(() => {
    if (!accessToken || personas.length > 0) return;
    setPersonasLoading(true);
    loadPersonas(accessToken)
      .then((list) => setPersonas(list))
      .catch(() => {})
      .finally(() => setPersonasLoading(false));
  }, [accessToken]);

  // Set default persona once, only if the user hasn't picked one yet. Reading
  // selectedPersonaId from current render (not from a captured closure) means
  // a user tap that lands while a load is in flight is honored correctly.
  useEffect(() => {
    if (selectedPersonaId) return;
    if (personas.length === 0) return;
    const def = personas.find((p) => p.is_default) ?? personas[0];
    if (def) setSelectedPersonaId(def.id);
  }, [personas, selectedPersonaId]);

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    setShowLinkedInHelper(false);
    setShowBlockedPopup(false);
    try {
      const res = await fetch("https://wrnsignal-api.vercel.app/api/parse-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = await res.json();
      if (data.code === "LINKEDIN" || data.code === "INDEED_BLOCKED" || data.code === "BLOCKED") {
        setShowBlockedPopup(true);
        setShowLinkedInHelper(true);
        return;
      }
      if (data.error) {
        setUrlError(data.error);
        return;
      }
      if (data.companyName) setJobContext({ ...jobContext, company: data.companyName });
      if (data.jobTitle) setJobContext({ ...jobContext, title: data.jobTitle });
      if (data.companyName && data.jobTitle) setJobContext({ ...jobContext, title: data.jobTitle, company: data.companyName });
      if (data.jobDescription) setJob(data.jobDescription);
      setJobUrl("");
      setUrlError("");
      setShowLinkedInHelper(false);
      setShowBlockedPopup(false);
    } catch {
      setUrlError("Something went wrong. Please paste the job description manually.");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleLinkedInPaste = async () => {
    if (!linkedInPasteText.trim() || linkedInPasteText.length < 50) {
      setUrlError("Please paste more content — select the full page.");
      return;
    }
    setLinkedInPasteLoading(true);
    try {
      const res = await fetch("https://wrnsignal-api.vercel.app/api/parse-job-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: linkedInPasteText.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setUrlError(data.error);
        return;
      }
      if (data.companyName && data.jobTitle) setJobContext({ ...jobContext, title: data.jobTitle, company: data.companyName });
      else if (data.companyName) setJobContext({ ...jobContext, company: data.companyName });
      else if (data.jobTitle) setJobContext({ ...jobContext, title: data.jobTitle });
      if (data.jobDescription) setJob(data.jobDescription);
      setShowLinkedInHelper(false);
      setLinkedInPasteText("");
      setJobUrl("");
      setUrlError("");
      // Show confirm step so user sees extracted results
      setManualStep("confirm");
    } catch {
      setUrlError("Extraction failed. Please paste the description manually below.");
    } finally {
      setLinkedInPasteLoading(false);
    }
  };

  const handleManualExtract = async () => {
    if (!job.trim() || job.trim().length < 50) {
      setError("Please paste more content — at least the full job posting.");
      return;
    }
    setManualExtracting(true);
    setError(null);
    try {
      const res = await fetch("https://wrnsignal-api.vercel.app/api/parse-job-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: job.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const newCtx = { ...jobContext };
      if (data.companyName) newCtx.company = data.companyName;
      if (data.jobTitle) newCtx.title = data.jobTitle;
      setJobContext(newCtx);
      if (data.jobDescription) setJob(data.jobDescription);
      setManualStep("confirm");
      setError(null);
    } catch {
      setError("Extraction failed. Please try again.");
    } finally {
      setManualExtracting(false);
    }
  };

  const handleRun = useCallback(async () => {
    if (!job.trim()) { setError("Paste a job description first."); return; }
    if (!jobContext.title.trim() || !jobContext.company.trim()) {
      setError('Tap "Extract & Continue" to pull the job title and company from the posting — or add them in the Confirm step.');
      return;
    }
    if (!accessToken) { setError("Please log in again."); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await apiRunJobFit(
        accessToken,
        job,
        jobContext.title,
        jobContext.company,
        selectedPersonaId,
        jobUrl || null
      );
      setJobFitResult(result);
      // Keep whatever the server echoed back as the authoritative
      // display values — it will normally match what the user typed
      // because the backend injects user-provided title/company
      // before scoring runs.
      const title = String(result?.job_signals?.jobTitle ?? result?.job_title ?? jobContext.title).trim();
      const company = String(result?.job_signals?.companyName ?? result?.company ?? jobContext.company).trim();
      if (title || company) setJobContext({ ...jobContext, title, company });
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

        {/* Helper card when no input yet */}
        {!hasResult && !job && !jobUrl && (
          <View style={s.helperCard}>
            <Text style={s.helperText}>
              Paste a job URL above to auto-fill the details, or paste the full posting manually below.
            </Text>
            <Text style={s.helperSub}>
              Works with Indeed, LinkedIn, Greenhouse, Lever, and more.
            </Text>
          </View>
        )}

        {/* ── Before results: full input area ────────────── */}
        {!hasResult && (
          <>
            {/* URL Fetch */}
            <View style={s.urlCard}>
              <Text style={s.urlCardLabel}>PASTE JOB URL</Text>
              <Text style={s.urlCardHint}>
                LinkedIn, Indeed, Greenhouse, Lever, Handshake — paste any job URL
              </Text>
              <View style={s.urlRow}>
                <TextInput
                  style={s.urlInput}
                  value={jobUrl}
                  onChangeText={setJobUrl}
                  onSubmitEditing={handleFetchUrl}
                  placeholder="https://linkedin.com/jobs/view/..."
                  placeholderTextColor={palette.dim}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                />
                <Pressable
                  onPress={handleFetchUrl}
                  disabled={urlLoading}
                  style={({ pressed }) => [s.urlBtn, urlLoading && s.urlBtnDisabled, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[s.urlBtnText, urlLoading && s.urlBtnTextDisabled]}>
                    {urlLoading ? "Fetching..." : "FETCH →"}
                  </Text>
                </Pressable>
              </View>
              {!!urlError && <Text style={s.urlError}>{urlError}</Text>}

              {/* Blocked-site popup modal */}
              <Modal
                visible={showBlockedPopup}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBlockedPopup(false)}
              >
                <View style={s.modalOverlay}>
                  <View style={s.modalCard}>
                    <Text style={s.modalTitle}>LinkedIn / Indeed Detected</Text>
                    <Text style={s.modalBody}>
                      This site blocks automated access. No worries — just:
                    </Text>
                    <Text style={s.modalSteps}>
                      {"1. Open the job posting (button below)\n2. Tap and hold on the job description\n3. Tap \"Select All\" then \"Copy\"\n4. Come back here and paste it below"}
                    </Text>
                    <View style={s.modalButtons}>
                      <Pressable
                        onPress={() => {
                          const match = jobUrl.match(/https?:\/\/.+/);
                          const cleanUrl = match ? match[0].trim() : jobUrl.trim();
                          Linking.openURL(cleanUrl);
                          setShowBlockedPopup(false);
                        }}
                        style={({ pressed }) => [s.modalPrimaryBtn, pressed && { opacity: 0.8 }]}
                      >
                        <Text style={s.modalPrimaryBtnText}>Open Job Posting</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setShowBlockedPopup(false)}
                        style={({ pressed }) => [s.modalSecondaryBtn, pressed && { opacity: 0.8 }]}
                      >
                        <Text style={s.modalSecondaryBtnText}>Close</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Paste helper (visible after popup closes) */}
              {showLinkedInHelper && !showBlockedPopup && (
                <View style={s.linkedInBox}>
                  <Text style={s.linkedInTitle}>LINKEDIN / INDEED DETECTED</Text>
                  <TextInput
                    style={s.linkedInTextArea}
                    value={linkedInPasteText}
                    onChangeText={setLinkedInPasteText}
                    placeholder="Paste the full job page here..."
                    placeholderTextColor={palette.dim}
                    multiline
                    scrollEnabled={false}
                  />
                  <Pressable
                    onPress={handleLinkedInPaste}
                    disabled={linkedInPasteLoading}
                    style={({ pressed }) => [s.linkedInBtn, linkedInPasteLoading && s.linkedInBtnDisabled, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[s.linkedInBtnText, linkedInPasteLoading && s.linkedInBtnTextDisabled]}>
                      {linkedInPasteLoading ? "Extracting..." : "EXTRACT FROM PASTE →"}
                    </Text>
                  </Pressable>
                </View>
              )}

            </View>

            {/* OR divider */}
            <View style={s.orDividerRow}>
              <View style={s.orDividerLine} />
              <Text style={s.orDividerText}>OR</Text>
              <View style={s.orDividerLine} />
            </View>

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
            {!personasLoading && personas.length === 0 && accessToken && (
              <View style={s.personaEmpty}>
                <Text style={s.personaEmptyText}>
                  No resume on file yet. Go to your Profile to add one — SIGNAL uses it to score how well you match each job.
                </Text>
              </View>
            )}

            {/* ── Paste step ── */}
            {manualStep === "paste" && (
              <>
                <Text style={s.pasteManualLabel}>PASTE FULL JOB POSTING</Text>
                <Text style={s.pasteHint}>
                  Paste the entire job posting — SIGNAL will extract the company, title, and description automatically.
                </Text>
                <TextInput
                  style={[shared.textArea, { minHeight: 160 }]}
                  value={job}
                  onChangeText={setJob}
                  placeholder="Paste the entire job posting here..."
                  placeholderTextColor={palette.dim}
                  multiline
                  scrollEnabled={false}
                />
                <Pressable
                  onPress={handleManualExtract}
                  disabled={manualExtracting}
                  style={({ pressed }) => [s.extractBtn, manualExtracting && s.extractBtnDisabled, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[s.extractBtnText, manualExtracting && s.extractBtnTextDisabled]}>
                    {manualExtracting ? "Extracting job details..." : "Extract & Continue →"}
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── Confirm step ── */}
            {manualStep === "confirm" && (
              <>
                <Text style={s.pasteManualLabel}>CONFIRM DETAILS</Text>
                <Text style={s.fieldLabel}>Company</Text>
                <TextInput
                  style={shared.input}
                  value={jobContext.company}
                  onChangeText={(c) => setJobContext({ ...jobContext, company: c })}
                  placeholder="Company name"
                  placeholderTextColor={palette.dim}
                  autoCapitalize="words"
                />
                <Text style={s.fieldLabel}>Job Title</Text>
                <TextInput
                  style={shared.input}
                  value={jobContext.title}
                  onChangeText={(t) => setJobContext({ ...jobContext, title: t })}
                  placeholder="Job title"
                  placeholderTextColor={palette.dim}
                  autoCapitalize="words"
                />
                {job ? (
                  <View style={s.jdPreview}>
                    <Text style={s.fieldLabel}>Job Description (extracted)</Text>
                    <ScrollView style={{ maxHeight: 100 }} nestedScrollEnabled>
                      <Text style={s.jdPreviewText}>
                        {job.length > 600 ? job.slice(0, 600) + "…" : job}
                      </Text>
                    </ScrollView>
                  </View>
                ) : null}
                <Text style={s.confirmHint}>Look right? You can edit before continuing.</Text>
                <Pressable
                  onPress={() => {
                    setManualStep("paste");
                    setJob("");
                    setJobContext({ ...jobContext, title: "", company: "" });
                  }}
                  style={{ marginTop: space.sm }}
                >
                  <Text style={s.pasteAgainLink}>← Paste again</Text>
                </Pressable>
              </>
            )}
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
  const riskStructured = Array.isArray(r.risk_structured) ? r.risk_structured : [];

  const whyCount = whyBullets.length || whyCodes.length;
  const riskCount = riskBullets.length || riskCodes.length || riskStructured.length;

  // Normalize risks into one typed list, then sort by severity (high → low) so
  // the most important gaps surface first. Built fresh via .map → sorting does
  // not mutate r.risk_structured / r.risk_codes.
  type RiskItem = { text: string; keyword: string; detail: string; severity?: string };
  const SEV_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const riskItems: RiskItem[] = (
    riskStructured.length > 0
      ? riskStructured.map((rs) => ({
          text: String(rs.gap ?? "").trim(),
          keyword: String(rs.keyword ?? "").trim(),
          detail: String(rs.adjacent_evidence ?? "").trim(),
          severity: rs.severity as string | undefined,
        }))
      : riskBullets.length > 0
      ? riskBullets.map((rb) => ({ text: rb, keyword: "", detail: "", severity: undefined }))
      : riskCodes.map((rc) => ({
          text: String(rc?.risk ?? "").trim(),
          keyword: String(rc?.job_fact ?? "").trim(),
          detail: "",
          severity: rc?.severity as string | undefined,
        }))
  )
    .filter((it) => it.text)
    .sort((a, b) => (SEV_RANK[b.severity ?? ""] ?? 0) - (SEV_RANK[a.severity ?? ""] ?? 0));

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
          {riskItems.map((item, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={s.riskDot}><Text style={s.riskBang}>!</Text></View>
              <View style={{ flex: 1 }}>
                {(item.keyword || item.severity) ? (
                  <View style={s.riskHeaderRow}>
                    {item.keyword ? (
                      <Text style={s.riskKeyword}>{item.keyword.toUpperCase()}</Text>
                    ) : null}
                    {item.severity ? <SeverityPill severity={item.severity} /> : null}
                  </View>
                ) : null}
                <Text style={s.bulletText}>{item.text}</Text>
                {item.detail ? <Text style={s.riskDetail}>{item.detail}</Text> : null}
              </View>
            </View>
          ))}
        </SectionCard>
      )}
    </View>
  );
}

/* ── Severity badge — reuses the shared Pill; mapped to risk colors ── */
function SeverityPill({ severity }: { severity: string }) {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    high: { label: "High", bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
    medium: { label: "Medium", bg: "rgba(254,176,106,0.12)", color: brand.orange, border: "rgba(254,176,106,0.3)" },
    low: { label: "Low", bg: "rgba(255,255,255,0.07)", color: palette.muted, border: palette.border },
  };
  const m = map[severity] ?? map.low;
  return <Pill text={m.label} bg={m.bg} color={m.color} borderColor={m.border} />;
}

/* ── Styles ──────────────────────────────────────────────────── */

const s = StyleSheet.create({
  // URL fetch card
  urlCard: {
    backgroundColor: "#0D1F35",
    borderWidth: 1,
    borderColor: "rgba(255,149,0,0.2)",
    borderRadius: radii.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  urlCardLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#FF9500",
    marginBottom: 4,
  },
  urlCardHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 10,
  },
  urlRow: {
    flexDirection: "row",
    gap: 8,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.sm,
    color: palette.text,
    fontSize: 13,
    fontFamily: undefined,
  },
  urlBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FF9500",
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  urlBtnDisabled: {
    backgroundColor: "#333",
  },
  urlBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0B0F1A",
  },
  urlBtnTextDisabled: {
    color: "#999",
  },
  urlError: {
    fontSize: 12,
    color: "#FF3B5C",
    marginTop: 8,
  },
  urlOrDivider: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    marginTop: 12,
  },
  orDividerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    marginVertical: 16,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orDividerText: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 2,
  },
  pasteManualLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    color: brand.orange,
    marginBottom: 8,
  },
  helperCard: {
    backgroundColor: "rgba(255,149,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,149,0,0.2)",
    borderRadius: 10,
    padding: 14,
    marginBottom: space.md,
  },
  helperText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 19,
  },
  helperSub: {
    fontSize: 11,
    color: brand.orange,
    marginTop: 6,
  },
  pasteHint: {
    fontSize: 13,
    color: palette.muted,
    lineHeight: 19,
    marginBottom: space.md,
  },
  extractBtn: {
    marginTop: space.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: brand.orange,
    borderRadius: radii.sm,
    alignItems: "center" as const,
  },
  extractBtnDisabled: {
    backgroundColor: "#333",
  },
  extractBtnText: {
    fontSize: 14,
    fontWeight: "900" as const,
    color: "#0B0F1A",
  },
  extractBtnTextDisabled: {
    color: "#999",
  },
  jdPreview: {
    marginTop: space.md,
    marginBottom: space.sm,
  },
  jdPreviewText: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  confirmHint: {
    fontSize: 12,
    color: palette.dim,
    marginTop: space.sm,
  },
  pasteAgainLink: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: palette.muted,
  },

  // Blocked-site modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#0D1F35",
    borderWidth: 0.5,
    borderColor: "#1E3A5F",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FFD60A",
    marginBottom: 12,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  modalSteps: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 22,
    textAlign: "left",
    marginBottom: 24,
    alignSelf: "stretch",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FF6B00",
    alignItems: "center",
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#ffffff",
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  // Paste helper
  linkedInBox: {
    backgroundColor: "rgba(255,214,10,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,214,10,0.25)",
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  linkedInTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFD60A",
    marginBottom: 8,
  },
  linkedInInstructions: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
    marginBottom: 10,
  },
  linkedInTextArea: {
    minHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.sm,
    color: palette.text,
    fontSize: 13,
    textAlignVertical: "top",
  },
  linkedInBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFD60A",
    borderRadius: radii.sm,
    alignItems: "center",
  },
  linkedInBtnDisabled: {
    backgroundColor: "#333",
  },
  linkedInBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0B0F1A",
  },
  linkedInBtnTextDisabled: {
    color: "#999",
  },

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
  personaEmpty: {
    marginBottom: space.md,
    padding: space.sm,
    borderRadius: radii.sm,
    backgroundColor: "rgba(254,176,106,0.06)",
    borderWidth: 1,
    borderColor: "rgba(254,176,106,0.2)",
  },
  personaEmptyText: { fontSize: 12, color: palette.dim, lineHeight: 18 },

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
  riskHeaderRow: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8,
  },
  riskDetail: {
    fontSize: 12, lineHeight: 18, color: palette.dim, marginTop: 4,
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
