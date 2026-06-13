import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useJob } from "@/lib/job-context";
import {
  getApplications, updateApplication, getInterviews, createInterview,
  deleteApplication, updateInterview, deleteInterview,
  type Application, type Interview,
} from "@/lib/api";
import { GradientBar } from "@/components/GradientBar";
import { DatePickerField } from "@/components/DatePickerField";
import {
  palette, brand, type as typ, shared, space, radii, gradients,
} from "@/constants/theme";

/* ── Constants ───────────────────────────────────────────────── */

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"];
const STAGES = ["hr_screening", "phone", "zoom", "in_person", "take_home", "final_round", "other"];
const INT_STATUSES = ["scheduled", "completed", "cancelled"];
const APP_LOCATIONS = ["Company Website", "LinkedIn", "Indeed", "Handshake", "Referral", "Other"];

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

/* ── EditInterviewForm ───────────────────────────────────────── */

function EditInterviewForm({
  interview,
  accessToken,
  onSaved,
  onDeleted,
}: {
  interview: Interview;
  accessToken: string;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [stage, setStage] = useState(interview.interview_stage);
  const [status, setStatus] = useState(interview.status);
  const [confidence, setConfidence] = useState(interview.confidence_level);
  const [notes, setNotes] = useState(interview.notes ?? "");
  const [date, setDate] = useState(interview.interview_date ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateInterview(accessToken, interview.id, {
        interview_stage: stage,
        status,
        confidence_level: confidence,
        notes,
        interview_date: date || undefined,
      });
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update interview");
    }
    setSaving(false);
  }

  function handleDelete() {
    Alert.alert(
      "Delete Interview",
      "Remove this interview entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await deleteInterview(accessToken, interview.id);
              onDeleted();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete interview");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={ef.container}>
      <GradientBar colors={["#a78bfa", "#51ADE5", "#a78bfa"]} />
      <View style={{ padding: space.lg }}>
        <Text style={ef.label}>STAGE</Text>
        <View style={ef.chipRow}>
          {STAGES.map((st) => (
            <Pressable
              key={st}
              onPress={() => setStage(st)}
              style={[ef.chip, stage === st && { backgroundColor: "rgba(167,139,250,0.20)", borderColor: "rgba(167,139,250,0.50)" }]}
            >
              <Text style={[ef.chipText, stage === st && { color: "#a78bfa" }]}>
                {STAGE_LABELS[st] || st}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[ef.label, { marginTop: space.md }]}>STATUS</Text>
        <View style={ef.chipRow}>
          {INT_STATUSES.map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatus(st)}
              style={[ef.chip, status === st && { backgroundColor: "rgba(81,173,229,0.20)", borderColor: "rgba(81,173,229,0.50)" }]}
            >
              <Text style={[ef.chipText, status === st && { color: brand.blue }]}>{st}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[ef.label, { marginTop: space.md }]}>CONFIDENCE</Text>
        <View style={ef.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setConfidence(n)}>
              <Text style={[ef.star, n <= confidence ? ef.starActive : ef.starInactive]}>★</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[ef.label, { marginTop: space.md }]}>INTERVIEW DATE</Text>
        <DatePickerField value={date} onChange={setDate} placeholder="Select interview date" />

        <Text style={[ef.label, { marginTop: space.md }]}>NOTES</Text>
        <TextInput
          style={[ef.input, { minHeight: 60, maxHeight: 120 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Interview notes..."
          placeholderTextColor={palette.dim}
          multiline
        />

        <View style={ef.actionRow}>
          <Pressable
            style={({ pressed }) => [ef.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={ef.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [ef.deleteBtn, pressed && { opacity: 0.85 }]}
            onPress={handleDelete}
          >
            <Text style={ef.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const ef = StyleSheet.create({
  container: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    backgroundColor: palette.cardDeep, overflow: "hidden", marginBottom: space.lg,
  },
  label: { ...typ.eyebrow, color: palette.dim, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm,
    borderWidth: 1, borderColor: palette.borderSoft, backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipText: { fontSize: 11, fontWeight: "800", color: palette.muted, textTransform: "uppercase" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { fontSize: 22 },
  starActive: { color: brand.orange },
  starInactive: { color: "rgba(255,255,255,0.15)" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: palette.borderSoft,
    borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 10,
    color: palette.text, fontSize: 14,
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: space.lg },
  saveBtn: {
    flex: 1, height: 40, borderRadius: radii.sm, backgroundColor: "#a78bfa",
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: 13, fontWeight: "900", color: "#04060F" },
  deleteBtn: {
    height: 40, paddingHorizontal: 18, borderRadius: radii.sm,
    backgroundColor: "rgba(255,120,120,0.12)", borderWidth: 1, borderColor: "rgba(255,120,120,0.30)",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 13, fontWeight: "900", color: "#FF7878" },
});

/* ── Main Screen ─────────────────────────────────────────────── */

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { setJobFitResult, setJob, setJobContext } = useJob();
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedInterviewId, setExpandedInterviewId] = useState<string | null>(null);

  // Editable fields
  const [status, setStatus] = useState("");
  const [interest, setInterest] = useState(3);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [appLocation, setAppLocation] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState(false);
  const [referral, setReferral] = useState(false);
  const [appliedDate, setAppliedDate] = useState("");
  const [datePosted, setDatePosted] = useState("");

  // Add interview form
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [newStage, setNewStage] = useState("phone");
  const [newIntStatus, setNewIntStatus] = useState("scheduled");
  const [newConfidence, setNewConfidence] = useState(3);
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState("");

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
        setLocation(found.location ?? "");
        setJobUrl(found.job_url ?? "");
        setAppLocation(found.application_location ?? null);
        setCoverLetter(found.cover_letter_submitted ?? false);
        setReferral(found.referral ?? false);
        setAppliedDate(found.applied_date ?? "");
        setDatePosted(found.date_posted ?? "");
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
        location,
        job_url: jobUrl || null,
        application_location: appLocation,
        cover_letter_submitted: coverLetter,
        referral,
        applied_date: appliedDate || null,
        date_posted: datePosted || null,
      } as any);
      setApp(updated);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save");
    }
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
        interview_date: newDate || undefined,
      });
      setShowAddInterview(false);
      setNewStage("phone");
      setNewIntStatus("scheduled");
      setNewConfidence(3);
      setNewNotes("");
      setNewDate("");
      await loadData();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to add interview");
    }
    setSaving(false);
  }

  async function handleDeleteApp() {
    if (!accessToken || !id) return;
    Alert.alert(
      "Delete Application",
      "Permanently delete this application? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await deleteApplication(accessToken, id);
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete application");
            }
          },
        },
      ]
    );
  }

  async function handleSignalPress() {
    if (!accessToken || !app?.jobfit_run_id) return;
    try {
      const res = await fetch(
        `https://wrnsignal-api.vercel.app/api/runs/${app.jobfit_run_id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (data.jobfit) setJobFitResult(data.jobfit);
      if (data.jobDescription) setJob(data.jobDescription);
      if (data.jobTitle || data.companyName) {
        setJobContext({ title: data.jobTitle || "", company: data.companyName || "" });
      }
      router.push("/(tabs)/jobfit");
    } catch {
      Linking.openURL(
        `https://wrnsignal.workforcereadynow.com/signal/jobfit?run=${app!.jobfit_run_id}`
      );
    }
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
          headerLeft: () => (
            <Pressable onPress={() => router.navigate("/(tabs)/tracker")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 17, color: brand.blue }}>‹</Text>
              <Text style={{ fontSize: 17, color: brand.blue }}>Tracker</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── 1. Header ───────────────────────────────────────── */}
        <Text style={s.jobTitle}>{app.job_title || "Untitled"}</Text>
        <Text style={s.company}>{app.company_name || "Unknown"}</Text>

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
        </View>

        {/* ── 2. Status selector ──────────────────────────────── */}
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
                  style={[s.chip, active && { backgroundColor: color + "20", borderColor: color + "50" }]}
                >
                  <Text style={[s.chipText, active && { color }]}>{st}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 3. Details ──────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DETAILS</Text>

          <Text style={s.fieldLabel}>Location</Text>
          <TextInput
            style={s.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State or Remote"
            placeholderTextColor={palette.dim}
          />

          <Text style={[s.fieldLabel, { marginTop: space.md }]}>Job URL</Text>
          <TextInput
            style={s.input}
            value={jobUrl}
            onChangeText={setJobUrl}
            placeholder="https://..."
            placeholderTextColor={palette.dim}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={[s.fieldLabel, { marginTop: space.md }]}>Applied Date</Text>
          <DatePickerField value={appliedDate} onChange={setAppliedDate} placeholder="Select applied date" />

          <Text style={[s.fieldLabel, { marginTop: space.md }]}>Date Posted</Text>
          <DatePickerField value={datePosted} onChange={setDatePosted} placeholder="Select date posted" />

          <Text style={[s.fieldLabel, { marginTop: space.md }]}>Applied Via</Text>
          <View style={s.chipRow}>
            {APP_LOCATIONS.map((loc) => {
              const active = appLocation === loc;
              return (
                <Pressable
                  key={loc}
                  onPress={() => setAppLocation(active ? null : loc)}
                  style={[
                    s.chip,
                    active && { backgroundColor: "rgba(81,173,229,0.20)", borderColor: "rgba(81,173,229,0.50)" },
                  ]}
                >
                  <Text style={[s.chipText, active && { color: brand.blue }]}>{loc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 4. Interest level ───────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>INTEREST LEVEL</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setInterest(interest === n ? 1 : n)}>
                <Text style={[s.star, n <= interest ? s.starActive : s.starInactive]}>★</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── 5. Cover letter / Referral toggles ──────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>APPLICATION DETAILS</Text>
          <View style={s.toggleRow}>
            <View style={s.toggleItem}>
              <Text style={s.fieldLabel}>Cover Letter Submitted</Text>
              <View style={s.chipRow}>
                {[true, false].map((val) => {
                  const active = coverLetter === val;
                  return (
                    <Pressable
                      key={String(val)}
                      onPress={() => setCoverLetter(val)}
                      style={[
                        s.chip,
                        active && {
                          backgroundColor: val ? "rgba(74,222,128,0.20)" : "rgba(148,163,184,0.20)",
                          borderColor: val ? "rgba(74,222,128,0.50)" : "rgba(148,163,184,0.50)",
                        },
                      ]}
                    >
                      <Text style={[s.chipText, active && { color: val ? "#4ade80" : "#94a3b8" }]}>
                        {val ? "Yes" : "No"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[s.toggleItem, { marginTop: space.md }]}>
              <Text style={s.fieldLabel}>Referral</Text>
              <View style={s.chipRow}>
                {[true, false].map((val) => {
                  const active = referral === val;
                  return (
                    <Pressable
                      key={String(val)}
                      onPress={() => setReferral(val)}
                      style={[
                        s.chip,
                        active && {
                          backgroundColor: val ? "rgba(74,222,128,0.20)" : "rgba(148,163,184,0.20)",
                          borderColor: val ? "rgba(74,222,128,0.50)" : "rgba(148,163,184,0.50)",
                        },
                      ]}
                    >
                      <Text style={[s.chipText, active && { color: val ? "#4ade80" : "#94a3b8" }]}>
                        {val ? "Yes" : "No"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── 6. Notes ────────────────────────────────────────── */}
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

        {/* ── 7. View in SIGNAL ───────────────────────────────── */}
        {app.jobfit_run_id ? (
          <Pressable
            style={({ pressed }) => [s.signalBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSignalPress}
          >
            <Text style={s.signalBtnText}>View in SIGNAL</Text>
          </Pressable>
        ) : null}

        {/* ── 8. Save button ──────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        {/* ── 9. Interviews ───────────────────────────────────── */}
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

                <Text style={[s.formLabel, { marginTop: space.md }]}>INTERVIEW DATE</Text>
                <DatePickerField value={newDate} onChange={setNewDate} placeholder="Select interview date" />

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
          {interviews.map((iv) => {
            const isExpanded = expandedInterviewId === iv.id;
            return (
              <View key={iv.id}>
                <Pressable
                  style={({ pressed }) => [s.interviewCard, pressed && { opacity: 0.8 }]}
                  onPress={() => setExpandedInterviewId(isExpanded ? null : iv.id)}
                >
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
                    <Text style={s.expandHint}>{isExpanded ? "▲" : "▼"}</Text>
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
                </Pressable>

                {isExpanded && accessToken && (
                  <EditInterviewForm
                    interview={iv}
                    accessToken={accessToken}
                    onSaved={async () => {
                      setExpandedInterviewId(null);
                      await loadData();
                    }}
                    onDeleted={async () => {
                      setExpandedInterviewId(null);
                      await loadData();
                    }}
                  />
                )}
              </View>
            );
          })}

          {interviews.length === 0 && !showAddInterview && (
            <Text style={s.emptyText}>No interviews logged yet.</Text>
          )}
        </View>

        {/* ── 10. Delete application ──────────────────────────── */}
        <View style={s.dangerZone}>
          <Text style={s.dangerLabel}>DANGER ZONE</Text>
          <Pressable
            style={({ pressed }) => [s.deleteAppBtn, pressed && { opacity: 0.85 }]}
            onPress={handleDeleteApp}
          >
            <Text style={s.deleteAppBtnText}>Delete Application</Text>
          </Pressable>
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

  section: { marginBottom: space.xl },
  sectionLabel: { ...typ.eyebrow, color: palette.dim, marginBottom: space.sm },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: palette.dim, marginBottom: 6, letterSpacing: 0.5 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm,
    borderWidth: 1, borderColor: palette.borderSoft, backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipText: { fontSize: 11, fontWeight: "800", color: palette.muted, textTransform: "uppercase" },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: palette.borderSoft,
    borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 10,
    color: palette.text, fontSize: 14,
  },

  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { fontSize: 24 },
  starSmall: { fontSize: 14 },
  starActive: { color: brand.orange },
  starInactive: { color: "rgba(255,255,255,0.15)" },

  toggleRow: { gap: 0 },
  toggleItem: {},

  signalBtn: {
    height: 44, borderRadius: radii.md,
    backgroundColor: "rgba(74,222,128,0.12)",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.30)",
    alignItems: "center", justifyContent: "center",
    marginBottom: space.md,
  },
  signalBtnText: { fontSize: 14, fontWeight: "900", color: "#4ade80", letterSpacing: 0.5 },

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
    borderColor: palette.borderSoft, backgroundColor: palette.card, marginBottom: 6,
  },
  interviewTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  stagePill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill,
    backgroundColor: "rgba(167,139,250,0.15)",
  },
  stagePillText: { fontSize: 10, fontWeight: "900", color: "#a78bfa", textTransform: "uppercase" },
  intStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  intStatusText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  expandHint: { marginLeft: "auto", fontSize: 10, color: palette.dim },
  interviewDate: { fontSize: 12, color: palette.dim, marginBottom: 6 },
  confidenceLabel: { fontSize: 10, color: palette.dim, marginLeft: 4 },
  interviewNotes: { fontSize: 13, color: palette.muted, lineHeight: 18, marginTop: 8 },
  emptyText: { fontSize: 13, color: palette.dim, marginTop: space.sm },

  // Danger zone
  dangerZone: {
    borderTopWidth: 1, borderTopColor: "rgba(255,120,120,0.15)",
    paddingTop: space.xl, marginBottom: space["3xl"],
  },
  dangerLabel: {
    ...typ.eyebrow, color: "rgba(255,120,120,0.50)", marginBottom: space.md,
  },
  deleteAppBtn: {
    height: 48, borderRadius: radii.md,
    backgroundColor: "rgba(255,120,120,0.08)",
    borderWidth: 1, borderColor: "rgba(255,120,120,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  deleteAppBtnText: { fontSize: 15, fontWeight: "900", color: "#FF7878" },
});
