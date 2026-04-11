import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import {
  getApplications, updateApplication, getInterviews, createInterview,
  type Application, type Interview,
} from "@/lib/api";
import { GradientBar } from "@/components/GradientBar";
import {
  palette, brand, type as typ, shared, space, radii, gradients,
} from "@/constants/theme";

/* ── Constants ───────────────────────────────────────────────── */

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"];
const STAGES = ["hr_screening", "phone", "zoom", "in_person", "take_home", "final_round", "other"];
const INT_STATUSES = ["scheduled", "completed", "cancelled"];

const STAGE_LABELS: Record<string, string> = {
  hr_screening: "HR Screening", phone: "Phone", zoom: "Zoom",
  in_person: "In Person", take_home: "Take Home", final_round: "Final Round", other: "Other",
};

const DECISION_COLORS: Record<string, { bg: string; color: string }> = {
  "Priority Apply": { bg: "rgba(81,173,229,0.15)", color: "#51ADE5" },
  Apply: { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  Review: { bg: "rgba(254,176,106,0.12)", color: "#FEB06A" },
  Pass: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

const STATUS_COLORS: Record<string, string> = {
  saved: "#51ADE5", applied: "#FEB06A", interviewing: "#a78bfa",
  offer: "#4ade80", rejected: "#f87171", withdrawn: "#94a3b8",
};

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [status, setStatus] = useState("");
  const [interest, setInterest] = useState(3);
  const [notes, setNotes] = useState("");

  // Add interview form
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [newStage, setNewStage] = useState("phone");
  const [newIntStatus, setNewIntStatus] = useState("scheduled");
  const [newConfidence, setNewConfidence] = useState(3);
  const [newNotes, setNewNotes] = useState("");

  const loadData = useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      const [apps, ints] = await Promise.all([
        getApplications(accessToken),
        getInterviews(accessToken),
      ]);
      const found = apps.find((a) => a.id === id);
      if (found) {
        setApp(found);
        setStatus(found.application_status);
        setInterest(found.interest_level ?? 3);
        setNotes(found.notes ?? "");
      }
      setInterviews(ints.filter((i) => i.application_id === id));
    } catch {}
    setLoading(false);
  }, [accessToken, id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave() {
    if (!accessToken || !id) return;
    setSaving(true);
    try {
      const updated = await updateApplication(accessToken, id, {
        application_status: status,
        interest_level: interest,
        notes,
      } as any);
      setApp(updated);
    } catch {}
    setSaving(false);
  }

  async function handleAddInterview() {
    if (!accessToken || !id) return;
    setSaving(true);
    try {
      await createInterview(accessToken, {
        application_id: id,
        interview_stage: newStage,
        status: newIntStatus,
        confidence_level: newConfidence,
        notes: newNotes,
      });
      setShowAddInterview(false);
      setNewStage("phone");
      setNewIntStatus("scheduled");
      setNewConfidence(3);
      setNewNotes("");
      await loadData();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add interview");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={shared.screen}>
        <Stack.Screen options={{ headerShown: true, title: "Loading...", headerStyle: { backgroundColor: palette.bg }, headerTintColor: palette.text }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={brand.orange} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={shared.screen}>
        <Stack.Screen options={{ headerShown: true, title: "Not Found", headerStyle: { backgroundColor: palette.bg }, headerTintColor: palette.text }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: palette.muted }}>Application not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dc = DECISION_COLORS[app.signal_decision] ?? { bg: "transparent", color: palette.dim };

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: brand.blue,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ──────────────────────────────────────── */}
        <Text style={s.jobTitle}>{app.job_title || "Untitled"}</Text>
        <Text style={s.company}>{app.company_name || "Unknown"}</Text>

        {/* Decision + Score row */}
        <View style={s.badges}>
          {app.signal_decision ? (
            <View style={[s.badge, { backgroundColor: dc.bg }]}>
              <Text style={[s.badgeText, { color: dc.color }]}>{app.signal_decision}</Text>
            </View>
          ) : null}
          {app.signal_score != null && (
            <View style={[s.badge, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
              <Text style={[s.badgeText, { color: palette.text }]}>Score: {app.signal_score}</Text>
            </View>
          )}
          {app.applied_date && (
            <Text style={s.dateText}>Applied {app.applied_date}</Text>
          )}
        </View>

        {/* ── Status selector ─────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>STATUS</Text>
          <View style={s.chipRow}>
            {STATUSES.map((st) => {
              const active = status === st;
              const color = STATUS_COLORS[st] ?? palette.dim;
              return (
                <Pressable
                  key={st}
                  onPress={() => setStatus(st)}
                  style={[
                    s.chip,
                    active && { backgroundColor: color + "20", borderColor: color + "50" },
                  ]}
                >
                  <Text style={[s.chipText, active && { color }]}>{st}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Interest stars ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>INTEREST LEVEL</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setInterest(interest === n ? 1 : n)}>
                <Text style={[s.star, n <= interest ? s.starActive : s.starInactive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Notes ───────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>NOTES</Text>
          <TextInput
            style={[shared.textArea, { minHeight: 80, maxHeight: 160 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this application..."
            placeholderTextColor={palette.dim}
            multiline
            scrollEnabled
          />
        </View>

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        {/* ── Interviews ──────────────────────────────────── */}
        <View style={s.interviewSection}>
          <View style={s.interviewHeader}>
            <Text style={s.sectionLabel}>INTERVIEWS ({interviews.length})</Text>
            <Pressable onPress={() => setShowAddInterview(!showAddInterview)}>
              <Text style={s.addLink}>{showAddInterview ? "Cancel" : "+ Add Interview"}</Text>
            </Pressable>
          </View>

          {/* Add interview form */}
          {showAddInterview && (
            <View style={s.addForm}>
              <GradientBar colors={["#a78bfa", "#51ADE5", "#a78bfa"]} />
              <View style={{ padding: space.lg }}>
                <Text style={s.formLabel}>STAGE</Text>
                <View style={s.chipRow}>
                  {STAGES.map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setNewStage(st)}
                      style={[s.chip, newStage === st && { backgroundColor: "rgba(167,139,250,0.20)", borderColor: "rgba(167,139,250,0.50)" }]}
                    >
                      <Text style={[s.chipText, newStage === st && { color: "#a78bfa" }]}>
                        {STAGE_LABELS[st] || st}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.formLabel, { marginTop: space.md }]}>STATUS</Text>
                <View style={s.chipRow}>
                  {INT_STATUSES.map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setNewIntStatus(st)}
                      style={[s.chip, newIntStatus === st && { backgroundColor: "rgba(81,173,229,0.20)", borderColor: "rgba(81,173,229,0.50)" }]}
                    >
                      <Text style={[s.chipText, newIntStatus === st && { color: brand.blue }]}>{st}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.formLabel, { marginTop: space.md }]}>CONFIDENCE</Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setNewConfidence(n)}>
                      <Text style={[s.star, n <= newConfidence ? s.starActive : s.starInactive]}>★</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.formLabel, { marginTop: space.md }]}>NOTES</Text>
                <TextInput
                  style={[shared.textArea, { minHeight: 60, maxHeight: 120 }]}
                  value={newNotes}
                  onChangeText={setNewNotes}
                  placeholder="Interview notes..."
                  placeholderTextColor={palette.dim}
                  multiline
                />

                <Pressable
                  style={({ pressed }) => [s.addInterviewBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleAddInterview}
                  disabled={saving}
                >
                  <Text style={s.addInterviewBtnText}>{saving ? "Adding..." : "Add Interview"}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Interview list */}
          {interviews.map((iv) => (
            <View key={iv.id} style={s.interviewCard}>
              <View style={s.interviewTop}>
                <View style={s.stagePill}>
                  <Text style={s.stagePillText}>{STAGE_LABELS[iv.interview_stage] || iv.interview_stage}</Text>
                </View>
                <View style={[s.intStatusPill, {
                  backgroundColor: iv.status === "completed" ? "rgba(74,222,128,0.12)"
                    : iv.status === "cancelled" ? "rgba(248,113,113,0.12)"
                    : "rgba(81,173,229,0.12)",
                }]}>
                  <Text style={[s.intStatusText, {
                    color: iv.status === "completed" ? "#4ade80"
                      : iv.status === "cancelled" ? "#f87171"
                      : brand.blue,
                  }]}>{iv.status}</Text>
                </View>
              </View>
              {iv.interview_date && (
                <Text style={s.interviewDate}>{iv.interview_date}</Text>
              )}
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Text key={n} style={[s.starSmall, n <= iv.confidence_level ? s.starActive : s.starInactive]}>★</Text>
                ))}
                <Text style={s.confidenceLabel}>confidence</Text>
              </View>
              {iv.notes ? <Text style={s.interviewNotes}>{iv.notes}</Text> : null}
            </View>
          ))}

          {interviews.length === 0 && !showAddInterview && (
            <Text style={s.emptyText}>No interviews logged yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 100 },

  jobTitle: { fontSize: 24, fontWeight: "900", color: palette.text, letterSpacing: -0.3 },
  company: { fontSize: 15, color: palette.muted, marginTop: 2, marginBottom: space.md },

  badges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: space.xl },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.pill },
  badgeText: { fontSize: 11, fontWeight: "900" },
  dateText: { fontSize: 12, color: palette.dim },

  section: { marginBottom: space.xl },
  sectionLabel: { ...typ.eyebrow, color: palette.dim, marginBottom: space.sm },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm,
    borderWidth: 1, borderColor: palette.borderSoft, backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipText: { fontSize: 11, fontWeight: "800", color: palette.muted, textTransform: "uppercase" },

  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { fontSize: 24 },
  starSmall: { fontSize: 14 },
  starActive: { color: brand.orange },
  starInactive: { color: "rgba(255,255,255,0.15)" },

  saveBtn: {
    height: 48, borderRadius: radii.md, backgroundColor: brand.orange,
    alignItems: "center", justifyContent: "center", marginBottom: space["3xl"],
  },
  saveBtnText: { fontSize: 15, fontWeight: "900", color: "#04060F" },

  // Interviews
  interviewSection: { marginBottom: space["3xl"] },
  interviewHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: space.md,
  },
  addLink: { fontSize: 13, fontWeight: "700", color: brand.blue },

  addForm: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: palette.cardDeep, overflow: "hidden", marginBottom: space.lg,
  },
  formLabel: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  addInterviewBtn: {
    height: 44, borderRadius: radii.sm, backgroundColor: "#a78bfa",
    alignItems: "center", justifyContent: "center", marginTop: space.lg,
  },
  addInterviewBtnText: { fontSize: 14, fontWeight: "900", color: "#04060F" },

  interviewCard: {
    padding: space.lg, borderRadius: radii.md, borderWidth: 1,
    borderColor: palette.borderSoft, backgroundColor: palette.card, marginBottom: 10,
  },
  interviewTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  stagePill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill,
    backgroundColor: "rgba(167,139,250,0.15)",
  },
  stagePillText: { fontSize: 10, fontWeight: "900", color: "#a78bfa", textTransform: "uppercase" },
  intStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  intStatusText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  interviewDate: { fontSize: 12, color: palette.dim, marginBottom: 6 },
  confidenceLabel: { fontSize: 10, color: palette.dim, marginLeft: 4 },
  interviewNotes: { fontSize: 13, color: palette.muted, lineHeight: 18, marginTop: 8 },
  emptyText: { fontSize: 13, color: palette.dim, marginTop: space.sm },
});
