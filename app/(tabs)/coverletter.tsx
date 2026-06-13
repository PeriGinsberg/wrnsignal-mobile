import { useState, useCallback } from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useJob } from "@/lib/job-context";
import { runCoverLetter as apiRunCoverLetter } from "@/lib/api";
import { RunButton } from "@/components/RunButton";
import { CompletionIndicator } from "@/components/CompletionIndicator";
import { CopyButton } from "@/components/CopyButton";
import { EmptyToolState } from "@/components/EmptyToolState";
import {
  palette, brand, type as typ, shared, space, radii,
} from "@/constants/theme";

/* ── letter formatting (matches web) ─────────────────────────── */

function normalizeBody(raw: string): string {
  const s = (raw || "").replace(/\r/g, "").trim();
  if (!s) return "";
  const lines = s.split("\n").map((l) => l.replace(/[ \t]+$/g, ""));
  const out: string[] = [];
  let lastBlank = false;
  for (const line of lines) {
    const isBlank = !line.trim();
    if (isBlank) { if (!lastBlank) out.push(""); lastBlank = true; }
    else { out.push(line.trimStart()); lastBlank = false; }
  }
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join("\n");
}

function stripSalutation(raw: string): string {
  const s = normalizeBody(raw);
  if (!s) return "";
  const lines = s.split("\n");
  const idx = lines.findIndex((l) => l.trim().length > 0);
  if (idx === -1) return s;
  if (!/^dear\s+.+/i.test(lines[idx].trim())) return s;
  const rest = lines.slice(idx + 1);
  while (rest.length && !rest[0].trim()) rest.shift();
  return normalizeBody(rest.join("\n"));
}

function stripSignature(raw: string): string {
  const s = normalizeBody(raw);
  if (!s) return "";
  const signoffs = ["sincerely,","sincerely","best,","best regards,","best regards","regards,","regards","thank you,","thank you","respectfully,","respectfully"];
  const lines = s.split("\n");
  const start = Math.max(0, lines.length - 10);
  for (let i = lines.length - 1; i >= start; i--) {
    const t = lines[i].trim().toLowerCase();
    if (signoffs.some((so) => t === so || t.startsWith(so))) {
      return normalizeBody(lines.slice(0, i).join("\n"));
    }
  }
  return s;
}

function buildFinalLetter(args: {
  bodyRaw: string; jobTitle: string; companyName: string;
  fullName: string; phone: string; email: string; hiringManager: string;
}): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const body = stripSignature(stripSalutation(args.bodyRaw));
  const hm = args.hiringManager.trim() || "[Hiring Manager]";
  const co = args.companyName || "[Company Name]";
  const name = args.fullName.trim() || "[Your Name]";
  const phone = args.phone.trim() || "[Phone Number]";
  const email = args.email.trim() || "[Email Address]";

  return `${name}\n${phone}\n${email}\n\n${today}\n\n${hm}\n${co}\n\nDear ${hm},\n\n${body}\n\nSincerely,\n${name}\n`;
}

export default function CoverLetterScreen() {
  const { accessToken, email: userEmail } = useAuth();
  const { job, jobFitResult, positioningResult, jobContext, coverLetterResult, setCoverLetterResult } = useJob();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [clName, setClName] = useState("");
  const [clCompany, setClCompany] = useState("");
  const [clHiringManager, setClHiringManager] = useState("");

  const handleRun = useCallback(async () => {
    if (!job.trim()) { setError("Paste a job description on the Job Fit tab first."); return; }
    if (!accessToken) { setError("Please log in again."); return; }
    setError(null);
    setLoading(true);
    try {
      const result = await apiRunCoverLetter(accessToken, job, jobFitResult, positioningResult);
      setCoverLetterResult(result);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [job, accessToken, jobFitResult, positioningResult]);

  const r = coverLetterResult;
  const hasResult = !!r;

  // Build final letter
  let finalLetter = "";
  if (r) {
    const rawName = String(r.contact?.full_name ?? r.full_name ?? r.name ?? r.student_name ?? r.studentName ?? "").trim();
    const looksLikeBadName = !rawName || rawName.toLowerCase().includes("project") || rawName.split(" ").length < 2;
    const fullName = looksLikeBadName ? "" : rawName;
    const phone = String(r.contact?.phone ?? (r as any)?.phone ?? "").trim();
    const emailFromProfile = String(r.contact?.email ?? (r as any)?.email ?? userEmail ?? "").trim();

    finalLetter = buildFinalLetter({
      bodyRaw: String(r.letter || ""),
      jobTitle: jobContext.title,
      companyName: clCompany.trim() || jobContext.company,
      fullName: clName.trim() || fullName,
      phone,
      email: emailFromProfile,
      hiringManager: clHiringManager,
    });
  }

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <ScrollView contentContainerStyle={shared.scrollContent} keyboardShouldPersistTaps="handled">
        <CompletionIndicator current={3} />
        <Text style={s.title}>Cover Letter</Text>

        {!hasResult && !job && (
          <EmptyToolState
            icon="📝"
            headline="No cover letter yet"
            body="Run a Job Fit analysis first. Your personalized cover letter will appear here."
          />
        )}

        {!hasResult && job && (
          <Text style={s.subtitle}>
            Generate a cover letter written in your voice, tied to your real background and this specific role.
          </Text>
        )}

        {error && (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        )}

        {!hasResult && (
          <RunButton
            label="Run Cover Letter"
            onPress={handleRun}
            loading={loading}
            loadingHint="Writing your cover letter..."
          />
        )}

        {hasResult && (
          <View style={{ marginTop: space.xl }}>
            {/* Editable fields */}
            <View style={s.fieldGroup}>
              <EditableField label="Your name" value={clName} onChange={setClName} placeholder="Your full name" />
              <EditableField label="Company name" value={clCompany} onChange={setClCompany} placeholder="Company name" />
              <EditableField label="Hiring manager" value={clHiringManager} onChange={setClHiringManager} placeholder="e.g. Sarah Johnson (optional)" />
            </View>

            {/* Letter preview */}
            <View style={s.letterCard}>
              <Text style={s.letterText}>{finalLetter}</Text>
            </View>

            <CopyButton text={finalLetter} label="Copy Full Letter" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <View style={s.field}>
      <View style={s.fieldLabelRow}>
        <View style={s.fieldArrow} />
        <Text style={s.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.dim}
      />
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

  // Fields
  fieldGroup: { marginBottom: space.lg, gap: space.md },
  field: {},
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  fieldArrow: {
    width: 0, height: 0,
    borderTopWidth: 6, borderTopColor: "transparent",
    borderBottomWidth: 6, borderBottomColor: "transparent",
    borderLeftWidth: 8, borderLeftColor: brand.orange,
  },
  fieldLabel: { ...typ.label, color: brand.orange, textTransform: "uppercase" },
  fieldInput: {
    ...shared.input,
    borderWidth: 2,
    borderColor: "rgba(254,176,106,0.50)",
  },

  // Letter
  letterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: 24,
    marginBottom: space.lg,
  },
  letterText: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    lineHeight: 22,
    color: "#1a1a2e",
  },
});
