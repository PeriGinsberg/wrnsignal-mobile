import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ResumeUploadButton } from "@/components/ResumeUploadButton";
import { RunButton } from "@/components/RunButton";
import { palette, brand, type as typ, shared, space, radii } from "@/constants/theme";

const API_BASE = "https://wrnsignal-api.vercel.app";
const MIN_CHARS = 100;

// AsyncStorage handoff key — trial.tsx writes the scan result, trial-results.tsx
// reads it on mount. (Result is a large nested object; router params can't carry it.)
export const TRIAL_RESULT_KEY = "signal_trial_result";

export default function TrialScreen() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlNote, setUrlNote] = useState<string | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchUrl() {
    const u = jobUrl.trim();
    if (!u) return;
    setUrlLoading(true);
    setUrlNote(null);
    setBlockedUrl(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/parse-job-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (data.code === "LINKEDIN" || data.code === "INDEED_BLOCKED" || data.code === "BLOCKED") {
        setBlockedUrl(u);
        setUrlNote(
          "This site blocks automated reading. Open the posting, copy the full description, and paste it below."
        );
        return;
      }
      if (data.error) {
        setUrlNote(data.error);
        return;
      }
      if (data.jobDescription) {
        setJob(data.jobDescription);
        setJobUrl("");
      } else {
        setUrlNote("Couldn't read that page. Paste the description below instead.");
      }
    } catch {
      setUrlNote("Something went wrong. Paste the description below instead.");
    } finally {
      setUrlLoading(false);
    }
  }

  async function openBlocked() {
    if (!blockedUrl) return;
    const m = blockedUrl.match(/https?:\/\/.+/);
    const clean = m ? m[0].trim() : blockedUrl.trim();
    try {
      await WebBrowser.openBrowserAsync(clean);
    } catch {
      Linking.openURL(clean).catch(() => {});
    }
  }

  async function handleRun() {
    const r = resume.trim();
    const j = job.trim();
    if (r.length < MIN_CHARS) {
      setError(`Add your resume — at least ${MIN_CHARS} characters.`);
      return;
    }
    if (j.length < MIN_CHARS) {
      setError(`Add the job description — at least ${MIN_CHARS} characters.`);
      return;
    }
    setError(null);
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobfit-run-trial-open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: r, job_description: j }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 429) {
        setError("You've run a lot of scans in a short time. Please wait a minute and try again.");
        return;
      }
      if (!res.ok || !data || data.status !== "ok") {
        setError(data?.detail || data?.error || "Scan failed. Please try again.");
        return;
      }
      await AsyncStorage.setItem(TRIAL_RESULT_KEY, JSON.stringify(data));
      router.push("/trial-results" as any);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backLinkText}>← Back</Text>
        </Pressable>

        {/* Logo lockup — mirrors welcome/login */}
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

        <Text style={styles.headline}>Free JobFit Scan</Text>
        <Text style={styles.subhead}>
          Paste your resume and a job description — get a clear decision before you
          apply. No account needed.
        </Text>

        {/* Resume */}
        <Text style={styles.sectionLabel}>YOUR RESUME</Text>
        <TextInput
          style={[shared.textArea, styles.area]}
          value={resume}
          onChangeText={setResume}
          placeholder="Paste your resume here…"
          placeholderTextColor={palette.dim}
          multiline
          scrollEnabled={false}
        />
        <View style={styles.uploadWrap}>
          <ResumeUploadButton onTextExtracted={setResume} />
        </View>

        {/* Job */}
        <Text style={[styles.sectionLabel, { marginTop: space.xl }]}>THE JOB</Text>
        <View style={styles.urlRow}>
          <TextInput
            style={styles.urlInput}
            value={jobUrl}
            onChangeText={setJobUrl}
            onSubmitEditing={handleFetchUrl}
            placeholder="Paste a job URL…"
            placeholderTextColor={palette.dim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
          />
          <Pressable
            onPress={handleFetchUrl}
            disabled={urlLoading}
            style={({ pressed }) => [styles.urlBtn, urlLoading && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          >
            {urlLoading ? (
              <ActivityIndicator color="#0B0F1A" size="small" />
            ) : (
              <Text style={styles.urlBtnText}>FETCH →</Text>
            )}
          </Pressable>
        </View>
        {urlNote && (
          <View style={styles.note}>
            <Text style={styles.noteText}>{urlNote}</Text>
            {blockedUrl && (
              <Pressable
                onPress={openBlocked}
                style={({ pressed }) => [styles.noteBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.noteBtnText}>Open posting</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.orPaste}>or paste the description</Text>
        <TextInput
          style={[shared.textArea, styles.area]}
          value={job}
          onChangeText={setJob}
          placeholder="Paste the full job description here…"
          placeholderTextColor={palette.dim}
          multiline
          scrollEnabled={false}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: space.lg }}>
          <RunButton
            label="Run Free Scan"
            onPress={handleRun}
            loading={running}
            loadingHint="This takes 20–40 seconds — we're reading your resume and the job in detail."
          />
        </View>

        <Pressable onPress={() => router.push("/login")} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Already a member? Log in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space["2xl"], paddingTop: 60, paddingBottom: 60 },

  backLink: { alignSelf: "flex-start", marginBottom: space.lg },
  backLinkText: { fontSize: 14, fontWeight: "700", color: palette.muted },

  // Logo (mirrors login/welcome)
  logoWrap: { alignItems: "center", marginBottom: space["2xl"] },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoText: { fontSize: 36, fontWeight: "900", fontStyle: "italic", letterSpacing: -1, color: "#ffffff" },
  logoDash: { width: 20, height: 5, backgroundColor: brand.orange, borderRadius: 1, marginLeft: 5, marginBottom: 2 },
  bylineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  bylineBy: { fontSize: 9, fontWeight: "700", color: palette.dim },
  bylineOrange: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, color: brand.orange, textTransform: "uppercase" },
  bylineBlue: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, color: brand.blue, textTransform: "uppercase" },

  headline: { fontSize: 24, fontWeight: "900", fontStyle: "italic", color: "#ffffff", textAlign: "center", marginBottom: space.sm },
  subhead: { fontSize: 14, color: palette.muted, textAlign: "center", marginBottom: space["2xl"], lineHeight: 20 },

  sectionLabel: { ...typ.label, color: brand.blue, marginBottom: 6 },
  area: { minHeight: 140 },
  uploadWrap: { marginTop: space.sm },

  // URL row (mirrors jobfit's urlRow)
  urlRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.border,
    borderRadius: radii.sm, color: palette.text, fontSize: 13,
  },
  urlBtn: {
    paddingVertical: 10, paddingHorizontal: 16, backgroundColor: brand.orange,
    borderRadius: radii.sm, justifyContent: "center", alignItems: "center",
  },
  urlBtnText: { fontSize: 12, fontWeight: "900", color: "#0B0F1A" },

  note: {
    marginTop: space.sm, padding: space.md, borderRadius: radii.sm,
    backgroundColor: "rgba(255,214,10,0.06)", borderWidth: 1, borderColor: "rgba(255,214,10,0.25)",
  },
  noteText: { fontSize: 13, color: palette.muted, lineHeight: 19 },
  noteBtn: {
    marginTop: space.sm, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radii.sm, backgroundColor: "rgba(81,173,229,0.10)", borderWidth: 1, borderColor: "rgba(81,173,229,0.30)",
  },
  noteBtnText: { fontSize: 12, fontWeight: "900", color: brand.blue },

  orPaste: {
    ...typ.caption, color: palette.dim, textAlign: "center",
    marginTop: space.md, marginBottom: space.sm,
  },

  errorBox: {
    marginTop: space.md, padding: space.md, borderRadius: radii.sm,
    backgroundColor: palette.errorBg, borderWidth: 1, borderColor: "rgba(255,120,120,0.20)",
  },
  errorText: { ...typ.caption, color: palette.error, fontWeight: "800" },

  loginLink: { alignItems: "center", marginTop: space.xl, paddingVertical: space.sm },
  loginLinkText: { ...typ.caption, color: palette.dim, textDecorationLine: "underline" },
});
