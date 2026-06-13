import { useState, useCallback } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useJob } from "@/lib/job-context";
import { runNetworking as apiRunNetworking } from "@/lib/api";
import { RunButton } from "@/components/RunButton";
import { CompletionIndicator } from "@/components/CompletionIndicator";
import { CopyButton } from "@/components/CopyButton";
import { EmptyToolState } from "@/components/EmptyToolState";
import { GradientBar } from "@/components/GradientBar";
import {
  palette, brand, type as typ, shared, space, radii,
} from "@/constants/theme";

/* ── step config ─────────────────────────────────────────────── */

const STEP_COLORS = [
  { accent: "#FEB06A", border: "rgba(254,176,106,0.30)", gradient: ["#FEB06A", "#f97316", "#FEB06A"] as const, whenLabel: "Send Today", msgBg: "rgba(254,176,106,0.07)", msgBorder: "rgba(254,176,106,0.20)" },
  { accent: "#51ADE5", border: "rgba(81,173,229,0.25)", gradient: ["#51ADE5", "#218C8C", "#51ADE5"] as const, whenLabel: "Send Day 3", msgBg: "rgba(81,173,229,0.07)", msgBorder: "rgba(81,173,229,0.18)" },
  { accent: "#4ade80", border: "rgba(74,222,128,0.22)", gradient: ["#4ade80", "#22c55e", "#51ADE5"] as const, whenLabel: "Send Day 5", msgBg: "rgba(74,222,128,0.06)", msgBorder: "rgba(74,222,128,0.18)" },
] as const;

const STEP_TITLES = [
  "Find someone doing this job at the company",
  "Find someone with a similar background to you",
  "Find a recruiter or hiring manager",
];

export default function NetworkingScreen() {
  const { accessToken } = useAuth();
  const { job, networkingResult, setNetworkingResult } = useJob();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set());

  const toggle = (i: number) =>
    setOpenSet((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const handleRun = useCallback(async () => {
    if (!job.trim()) { setError("Paste a job description on the Job Fit tab first."); return; }
    if (!accessToken) { setError("Please log in again."); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await apiRunNetworking(accessToken, job);
      setNetworkingResult(result);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [job, accessToken]);

  const r = networkingResult;
  const hasResult = !!r;
  const framing = String(r?.framing || "").trim();
  const moves = Array.isArray(r?.moves) ? r.moves : [];

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <ScrollView contentContainerStyle={shared.scrollContent} keyboardShouldPersistTaps="handled">
        <CompletionIndicator current={4} />
        <Text style={s.title}>Networking</Text>

        {!hasResult && !job && (
          <EmptyToolState
            icon="🤝"
            headline="No networking plan yet"
            body="Run a Job Fit analysis first. Your outreach plan — who to contact and what to say — will appear here."
          />
        )}

        {!hasResult && job && (
          <Text style={s.subtitle}>
            Build your outreach plan — who to contact, what to say, and how to follow up.
          </Text>
        )}

        {error && (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        )}

        {!hasResult && (
          <RunButton
            label="Run Networking"
            onPress={handleRun}
            loading={loading}
            loadingHint="Building your outreach plan..."
          />
        )}

        {hasResult && (
          <View style={{ marginTop: space.xl }}>

            {/* Plan header */}
            <View style={s.planHeader}>
              <GradientBar colors={["#51ADE5", "#218C8C", "#FEB06A"]} />
              <View style={{ padding: space.xl }}>
                <Text style={s.planEyebrow}>YOUR NETWORKING PLAN</Text>
                <Text style={s.planTitle}>
                  Send 3 messages over the next 5 days.
                </Text>
                <Text style={s.planBody}>
                  {framing || "Each message goes to a different person at or connected to the company. Start with Step 1 today — right after you apply."}
                </Text>
              </View>
            </View>

            {/* Timeline dots */}
            <View style={s.timeline}>
              {STEP_COLORS.map((c, i) => (
                <View key={i} style={s.timelineItem}>
                  <View style={[s.timelineDot, { backgroundColor: c.accent, shadowColor: c.accent }]} />
                  <Text style={s.timelineLabel}>
                    Step {i + 1} — {c.whenLabel.replace("Send ", "")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Step cards */}
            {moves.map((m: any, i: number) => {
              const c = STEP_COLORS[i] || STEP_COLORS[2];
              const isOpen = openSet.has(i);

              const targetTitle = String(m?.target_title ?? m?.targetTitle ?? "").trim();
              const primaryMessage = String(m?.linkedin_message ?? m?.linkedin_connection_request ?? "").trim();
              const connectionRequest = String(m?.linkedin_connection_request ?? "").trim();
              const emailSubject = String(m?.email_subject ?? "").trim();
              const emailBody = String(m?.email_body ?? "").trim();
              const followUp = String(m?.follow_up_message ?? "").trim();
              const openers = Array.isArray(m?.conversation_openers) ? m.conversation_openers : [];
              const searchQueries = Array.isArray(m?.linkedin_search_queries) ? m.linkedin_search_queries : [];

              const humanTitle = STEP_TITLES[i] || targetTitle || "Contact";
              const searchHint = searchQueries[0]
                ? `Search LinkedIn for: ${String(searchQueries[0]).trim()}`
                : targetTitle ? `Search LinkedIn for: ${targetTitle}` : "";

              const hasDetails = (connectionRequest && connectionRequest !== primaryMessage) || emailSubject || emailBody || followUp || openers.length > 0;

              return (
                <View key={i} style={[s.stepCard, { borderColor: c.border }]}>
                  <GradientBar colors={c.gradient} />
                  <View style={{ padding: space.lg }}>

                    {/* Header */}
                    <View style={s.stepHeader}>
                      <View style={[s.stepNum, { backgroundColor: c.accent + "25", borderColor: c.accent + "80" }]}>
                        <Text style={[s.stepNumText, { color: c.accent }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={[s.stepWhen, { color: c.accent }]}>{c.whenLabel}</Text>
                          {i === 0 && (
                            <View style={[s.doFirstPill, { backgroundColor: c.accent + "20", borderColor: c.accent + "40" }]}>
                              <Text style={[s.doFirstText, { color: c.accent }]}>Do this first</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.stepTitle}>{humanTitle}</Text>
                        {searchHint ? <Text style={s.stepSearch}>{searchHint}</Text> : null}
                      </View>
                    </View>

                    {/* Primary message */}
                    {primaryMessage ? (
                      <>
                        <Text style={[s.msgLabel, { color: c.accent + "99" }]}>
                          YOUR MESSAGE — COPY AND SEND ON LINKEDIN
                        </Text>
                        <View style={[s.msgBox, { backgroundColor: c.msgBg, borderColor: c.msgBorder }]}>
                          <Text style={s.msgText}>{primaryMessage}</Text>
                        </View>
                        <CopyButton text={primaryMessage} label="Copy this message" />
                      </>
                    ) : null}

                    {/* Expand toggle */}
                    {hasDetails && (
                      <Pressable onPress={() => toggle(i)} style={s.toggleBtn}>
                        <Text style={s.toggleText}>
                          {isOpen ? "▾  Hide details" : "▸  Connection request, email, follow-up"}
                        </Text>
                        {!isOpen && <Text style={s.toggleHint}>Tap to expand</Text>}
                      </Pressable>
                    )}

                    {/* Expanded details */}
                    {isOpen && (
                      <View style={s.details}>
                        {/* Connection request */}
                        {connectionRequest && connectionRequest !== primaryMessage && (
                          <DetailBlock label="SHORT CONNECTION REQUEST (300 CHARS)" text={connectionRequest} />
                        )}
                        {/* Email */}
                        {(emailSubject || emailBody) && (
                          <View>
                            <Text style={s.detailLabel}>EMAIL VERSION</Text>
                            {emailSubject ? <Text style={s.emailSubject}>Subject: {emailSubject}</Text> : null}
                            {emailBody ? (
                              <>
                                <View style={s.detailBox}><Text style={s.detailText}>{emailBody}</Text></View>
                                <CopyButton text={emailBody} label="Copy email" />
                              </>
                            ) : null}
                          </View>
                        )}
                        {/* Follow-up */}
                        {followUp && <DetailBlock label="IF THEY DON'T REPLY IN 5 DAYS" text={followUp} />}
                        {/* Openers */}
                        {openers.length > 0 && (
                          <View>
                            <Text style={s.detailLabel}>IF THEY REPLY — THINGS TO ASK</Text>
                            {openers.map((o: any, oi: number) => (
                              <View key={oi} style={s.openerRow}>
                                <View style={[s.openerDot, { backgroundColor: c.accent }]} />
                                <Text style={s.openerText}>{String(o).trim()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* ── LinkedIn Search Help ── */}
            {moves.some((m: any) => Array.isArray(m?.linkedin_search_queries) && m.linkedin_search_queries.length > 0) && (
              <View style={s.searchCard}>
                <Pressable onPress={() => toggle(99)} style={s.searchHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 16 }}>🔍</Text>
                    <View>
                      <Text style={s.searchTitle}>Need help finding these people?</Text>
                      <Text style={s.searchSub}>Tap for LinkedIn search queries</Text>
                    </View>
                  </View>
                  <Text style={s.searchChevron}>{openSet.has(99) ? "▾" : "▸"}</Text>
                </Pressable>

                {openSet.has(99) && (
                  <View style={s.searchBody}>
                    {moves.map((m: any, i: number) => {
                      const queries = Array.isArray(m?.linkedin_search_queries) ? m.linkedin_search_queries : [];
                      if (!queries.length) return null;
                      const c = STEP_COLORS[i] || STEP_COLORS[2];
                      return (
                        <View key={i} style={{ marginBottom: 14 }}>
                          <Text style={[s.searchStepLabel, { color: c.accent }]}>Step {i + 1}</Text>
                          {queries.map((q: any, qi: number) => {
                            const qStr = String(q).trim();
                            const liUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(qStr)}`;
                            return (
                              <View key={qi} style={s.searchQueryRow}>
                                <Text style={s.searchQueryText}>{qStr}</Text>
                                <Pressable
                                  onPress={() => Linking.openURL(liUrl)}
                                  style={({ pressed }) => [s.searchGoBtn, pressed && { opacity: 0.7 }]}
                                >
                                  <Text style={s.searchGoBtnText}>Search →</Text>
                                </Pressable>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={s.detailLabel}>{label}</Text>
      <View style={s.detailBox}><Text style={s.detailText}>{text}</Text></View>
      <CopyButton text={text} label="Copy" />
    </View>
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

  // Plan header
  planHeader: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: "rgba(81,173,229,0.20)",
    backgroundColor: palette.cardDeep, overflow: "hidden", marginBottom: 20,
  },
  planEyebrow: { ...typ.eyebrow, color: "rgba(81,173,229,0.65)", marginBottom: 10 },
  planTitle: { fontSize: 18, fontWeight: "900", color: palette.text, lineHeight: 26, marginBottom: 8 },
  planBody: { fontSize: 14, color: palette.muted, lineHeight: 22 },

  // Timeline
  timeline: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingHorizontal: 4 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLabel: { fontSize: 10, color: palette.dim },

  // Step card
  stepCard: {
    borderRadius: radii.xl, borderWidth: 1, backgroundColor: palette.cardDeep,
    overflow: "hidden", marginBottom: 14,
  },
  stepHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14 },
  stepNum: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { fontSize: 16, fontWeight: "900" },
  stepWhen: { fontSize: 13, fontWeight: "900" },
  doFirstPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill, borderWidth: 1 },
  doFirstText: { fontSize: 10, fontWeight: "900" },
  stepTitle: { fontSize: 16, fontWeight: "900", color: palette.text, lineHeight: 22, marginBottom: 4 },
  stepSearch: { fontSize: 12, color: palette.dim, lineHeight: 18 },

  // Message
  msgLabel: { ...typ.eyebrow, marginBottom: 8, marginTop: 4 },
  msgBox: {
    borderRadius: radii.md, padding: 16, borderWidth: 1, marginBottom: 12,
  },
  msgText: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.88)" },

  // Toggle
  toggleBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(254,176,106,0.5)",
    backgroundColor: "rgba(254,176,106,0.06)",
    borderRadius: 6,
  },
  toggleText: { fontSize: 13, fontWeight: "900", color: brand.orange, letterSpacing: 0.3 },
  toggleHint: { fontSize: 10, color: palette.dim, marginTop: 2 },

  // Details
  details: { marginTop: space.lg, borderTopWidth: 1, borderTopColor: palette.borderSoft, paddingTop: space.lg, gap: space.lg },
  detailLabel: {
    fontSize: 9, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase",
    color: "rgba(255,255,255,0.28)", marginBottom: 8,
  },
  detailBox: {
    borderRadius: radii.md, padding: 14,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 8,
  },
  detailText: { fontSize: 13, lineHeight: 21, color: "rgba(255,255,255,0.80)" },
  emailSubject: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.70)", marginBottom: 8 },

  // Openers
  openerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  openerDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, opacity: 0.6 },
  openerText: { flex: 1, fontSize: 13, lineHeight: 20, color: palette.muted },

  // LinkedIn search help
  searchCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden" as const,
    marginTop: 20,
  },
  searchHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 14,
  },
  searchTitle: { fontSize: 13, fontWeight: "800" as const, color: "rgba(255,255,255,0.70)" },
  searchSub: { fontSize: 11, color: palette.dim, marginTop: 2 },
  searchChevron: { fontSize: 12, color: palette.dim },
  searchBody: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  searchStepLabel: { fontSize: 10, fontWeight: "900" as const, letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  searchQueryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  searchQueryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.60)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    fontFamily: "monospace" as any,
  },
  searchGoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(81,173,229,0.12)",
    borderWidth: 1,
    borderColor: "rgba(81,173,229,0.30)",
    borderRadius: 8,
  },
  searchGoBtnText: { fontSize: 11, fontWeight: "900" as const, color: brand.blue },
});
