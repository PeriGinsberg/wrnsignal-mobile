import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import {
  getProfile, updateProfile, loadPersonas, updatePersona,
  createPersona, deletePersona,
  type Profile, type Persona,
} from "@/lib/api";
import { GradientBar } from "@/components/GradientBar";
import { ResumeUploadButton } from "@/components/ResumeUploadButton";
import {
  palette, brand, type as typ, shared, space, radii, gradients,
} from "@/constants/theme";

export default function ProfileScreen() {
  const { accessToken, email, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add persona form
  const [addingPersona, setAddingPersona] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaResume, setNewPersonaResume] = useState("");

  // Edit persona form
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editPersonaName, setEditPersonaName] = useState("");
  const [editPersonaResume, setEditPersonaResume] = useState("");

  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [p, pers] = await Promise.all([
        getProfile(accessToken),
        loadPersonas(accessToken),
      ]);
      setProfile(p);
      setPersonas(pers);
    } catch {}
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function startEdit() {
    setEditFields({
      name: profile?.name ?? "",
      job_type: profile?.job_type ?? "",
      target_roles: profile?.target_roles ?? "",
      target_locations: profile?.target_locations ?? "",
      preferred_locations: profile?.preferred_locations ?? "",
      timeline: profile?.timeline ?? "",
    });
    setEditingProfile(true);
  }

  async function saveProfile() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateProfile(accessToken, editFields);
      setProfile(updated);
      setEditingProfile(false);
      showToast("Profile updated");
    } catch {}
    setSaving(false);
  }

  async function handleSetDefault(id: string) {
    if (!accessToken) return;
    await updatePersona(accessToken, id, { is_default: true }).catch(() => {});
    loadAll();
  }

  async function handleCreatePersona() {
    if (!accessToken || !newPersonaName.trim()) return;
    setSaving(true);
    try {
      await createPersona(accessToken, newPersonaName.trim(), newPersonaResume.trim());
      setAddingPersona(false);
      setNewPersonaName("");
      setNewPersonaResume("");
      showToast("Persona created");
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || "Create failed");
    }
    setSaving(false);
  }

  function startEditPersona(p: Persona) {
    setEditingPersonaId(p.id);
    setEditPersonaName(p.name);
    setEditPersonaResume(p.resume_text || "");
  }

  function cancelEditPersona() {
    setEditingPersonaId(null);
    setEditPersonaName("");
    setEditPersonaResume("");
  }

  async function handleSavePersona() {
    if (!accessToken || !editingPersonaId || !editPersonaName.trim()) return;
    setSaving(true);
    try {
      await updatePersona(accessToken, editingPersonaId, {
        name: editPersonaName.trim(),
        resume_text: editPersonaResume.trim(),
      });
      cancelEditPersona();
      showToast("Persona updated");
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePersona(id: string, name: string) {
    if (!accessToken) return;
    try {
      await deletePersona(accessToken, id);
      showToast(`${name} deleted`);
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || "Delete failed");
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={shared.screen} edges={[]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={brand.orange} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={shared.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={shared.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.orange} />}
      >
        <Text style={s.title}>Profile</Text>

        {/* ── Profile Card ──────────────────────────────────── */}
        <View style={s.section}>
          <GradientBar colors={gradients.profile} />
          <View style={s.inner}>
            <View style={s.sectionHeader}>
              <Text style={[s.eyebrow, { color: brand.blue }]}>YOUR PROFILE</Text>
              {!editingProfile && (
                <Pressable onPress={startEdit}>
                  <Text style={s.editLink}>Edit</Text>
                </Pressable>
              )}
            </View>

            {editingProfile ? (
              <View style={{ gap: space.md }}>
                {(["name", "job_type", "target_roles", "target_locations", "timeline"] as const).map((key) => (
                  <View key={key}>
                    <Text style={s.fieldLabel}>{key.replace(/_/g, " ").toUpperCase()}</Text>
                    <TextInput
                      style={shared.input}
                      value={String(editFields[key] ?? "")}
                      onChangeText={(v) => setEditFields((prev) => ({ ...prev, [key]: v }))}
                      placeholderTextColor={palette.dim}
                    />
                  </View>
                ))}
                <View style={{ flexDirection: "row", gap: 10, marginTop: space.sm }}>
                  <Pressable
                    style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]}
                    onPress={saveProfile}
                    disabled={saving}
                  >
                    <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditingProfile(false)} style={{ justifyContent: "center", paddingHorizontal: 12 }}>
                    <Text style={s.cancelLink}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Row label="Name" value={profile?.name} />
                <Row label="Job Type" value={profile?.job_type} />
                <Row label="Target Roles" value={profile?.target_roles} />
                <Row label="Target Locations" value={profile?.target_locations} />
                <Row label="Timeline" value={profile?.timeline} />
                <Row label="Resume" value={profile?.resume_text ? profile.resume_text.slice(0, 200) + "..." : null} />
              </View>
            )}
          </View>
        </View>

        {/* ── Personas ──────────────────────────────────────── */}
        <View style={s.section}>
          <GradientBar colors={gradients.persona} />
          <View style={s.inner}>
            <View style={s.sectionHeader}>
              <Text style={[s.eyebrow, { color: brand.orange }]}>
                PERSONAS ({personas.length}/2)
              </Text>
            </View>

            {personas.length === 0 && !addingPersona && (
              <Text style={s.emptyText}>No personas yet. Add one to get started.</Text>
            )}

            {personas.map((p) => (
              <View key={p.id} style={s.personaCard}>
                {editingPersonaId === p.id ? (
                  /* ── Inline edit form ─────────────────────────── */
                  <View>
                    <Text style={s.fieldLabel}>PERSONA NAME</Text>
                    <TextInput
                      style={shared.input}
                      value={editPersonaName}
                      onChangeText={setEditPersonaName}
                      placeholder="Persona name"
                      placeholderTextColor={palette.dim}
                    />
                    <View style={{ height: space.md }} />
                    <Text style={s.fieldLabel}>RESUME</Text>
                    <ResumeUploadButton
                      onTextExtracted={(text) => setEditPersonaResume(text)}
                    />
                    <View style={{ height: space.sm }} />
                    <Text style={s.orText}>or paste manually</Text>
                    <View style={{ height: space.sm }} />
                    <TextInput
                      style={[shared.textArea, { minHeight: 120, maxHeight: 200 }]}
                      value={editPersonaResume}
                      onChangeText={setEditPersonaResume}
                      placeholder="Paste your resume text here..."
                      placeholderTextColor={palette.dim}
                      multiline
                      scrollEnabled
                    />
                    <View style={{ flexDirection: "row", gap: 10, marginTop: space.lg }}>
                      <Pressable
                        style={({ pressed }) => [s.saveBtn, (!editPersonaName.trim() || saving) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
                        onPress={handleSavePersona}
                        disabled={!editPersonaName.trim() || saving}
                      >
                        <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
                      </Pressable>
                      <Pressable
                        onPress={cancelEditPersona}
                        style={{ justifyContent: "center", paddingHorizontal: 12 }}
                      >
                        <Text style={s.cancelLink}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* ── Read-only view ──────────────────────────── */
                  <>
                    <View style={s.personaHeader}>
                      <Text style={s.personaName}>{p.name}</Text>
                      {p.is_default && (
                        <View style={s.defaultBadge}>
                          <Text style={s.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                      <Text style={s.versionText}>v{p.persona_version}</Text>
                    </View>
                    <Text style={s.personaPreview} numberOfLines={3}>
                      {p.resume_text ? p.resume_text.slice(0, 180) + "..." : "No resume text"}
                    </Text>
                    <View style={s.personaActions}>
                      <Pressable onPress={() => startEditPersona(p)}>
                        <Text style={s.editPersonaLink}>Edit</Text>
                      </Pressable>
                      {!p.is_default && (
                        <Pressable onPress={() => handleSetDefault(p.id)}>
                          <Text style={s.setDefaultLink}>Set as default</Text>
                        </Pressable>
                      )}
                      {!(p.is_default && personas.length === 1) && (
                        <Pressable onPress={() => handleDeletePersona(p.id, p.name)}>
                          <Text style={s.deleteLink}>Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                )}
              </View>
            ))}

            {/* Add persona form */}
            {addingPersona && (
              <View style={s.addForm}>
                <Text style={s.fieldLabel}>PERSONA NAME</Text>
                <TextInput
                  style={shared.input}
                  value={newPersonaName}
                  onChangeText={setNewPersonaName}
                  placeholder="e.g. Sales, Brand Marketing"
                  placeholderTextColor={palette.dim}
                />
                <View style={{ height: space.md }} />
                <Text style={s.fieldLabel}>RESUME</Text>
                <ResumeUploadButton
                  onTextExtracted={(text) => setNewPersonaResume(text)}
                />
                <View style={{ height: space.sm }} />
                <Text style={s.orText}>or paste manually</Text>
                <View style={{ height: space.sm }} />
                <TextInput
                  style={[shared.textArea, { minHeight: 120, maxHeight: 200 }]}
                  value={newPersonaResume}
                  onChangeText={setNewPersonaResume}
                  placeholder="Paste your resume text here..."
                  placeholderTextColor={palette.dim}
                  multiline
                  scrollEnabled
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: space.lg }}>
                  <Pressable
                    style={({ pressed }) => [s.saveBtn, (!newPersonaName.trim() || saving) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
                    onPress={handleCreatePersona}
                    disabled={!newPersonaName.trim() || saving}
                  >
                    <Text style={s.saveBtnText}>{saving ? "Creating..." : "Create Persona"}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setAddingPersona(false); setNewPersonaName(""); setNewPersonaResume(""); }}
                    style={{ justifyContent: "center", paddingHorizontal: 12 }}
                  >
                    <Text style={s.cancelLink}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Add persona button — only if under limit and not already adding */}
            {!addingPersona && personas.length < 2 && (
              <Pressable
                style={({ pressed }) => [s.addPersonaBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setAddingPersona(true)}
              >
                <Text style={s.addPersonaBtnText}>+ Add Persona</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Account ───────────────────────────────────────── */}
        <View style={s.accountCard}>
          <Text style={[s.eyebrow, { color: palette.dim }]}>ACCOUNT</Text>
          <Text style={s.accountEmail}>{email || "—"}</Text>
          <Pressable
            style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.7 }]}
            onPress={signOut}
          >
            <Text style={s.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: { ...typ.h1, color: palette.text, marginBottom: space.xl },

  section: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: palette.borderSoft,
    backgroundColor: palette.card, overflow: "hidden", marginBottom: space.lg,
  },
  inner: { padding: space.xl },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: space.lg,
  },
  eyebrow: { ...typ.eyebrow },
  editLink: { fontSize: 13, fontWeight: "700", color: brand.orange },

  // Profile rows
  rowLabel: {
    fontSize: 10, fontWeight: "900", letterSpacing: 1,
    textTransform: "uppercase", color: palette.dim, marginBottom: 2,
  },
  rowValue: { fontSize: 13, color: palette.text, lineHeight: 18 },

  // Edit
  fieldLabel: { ...typ.label, color: brand.blue, marginBottom: 4 },
  saveBtn: {
    height: 44, paddingHorizontal: 24, borderRadius: radii.sm,
    backgroundColor: brand.orange, alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "900", color: "#04060F" },
  cancelLink: { fontSize: 14, fontWeight: "700", color: palette.muted },

  // Personas
  personaCard: {
    padding: space.lg, borderRadius: radii.md, borderWidth: 1,
    borderColor: palette.borderSoft, backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 10, marginTop: space.md,
  },
  personaHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  personaName: { fontSize: 16, fontWeight: "900", color: palette.text },
  defaultBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill,
    backgroundColor: "rgba(254,176,106,0.12)",
  },
  defaultBadgeText: {
    fontSize: 9, fontWeight: "900", letterSpacing: 1,
    textTransform: "uppercase", color: brand.orange,
  },
  versionText: { fontSize: 11, color: palette.dim, marginLeft: "auto" },
  personaPreview: { fontSize: 13, lineHeight: 18, color: palette.muted, marginBottom: 8 },
  personaActions: { flexDirection: "row", gap: 16 },
  editPersonaLink: { fontSize: 12, fontWeight: "700", color: brand.orange },
  setDefaultLink: { fontSize: 12, fontWeight: "700", color: brand.blue },
  deleteLink: { fontSize: 12, fontWeight: "700", color: palette.error },
  emptyText: { fontSize: 13, color: palette.muted, marginTop: space.md },
  orText: { fontSize: 12, color: palette.dim, textAlign: "center" },

  // Add persona
  addForm: {
    marginTop: space.md, padding: space.lg, borderRadius: radii.md,
    borderWidth: 1, borderColor: "rgba(254,176,106,0.25)",
    backgroundColor: "rgba(254,176,106,0.04)",
  },
  addPersonaBtn: {
    marginTop: space.lg, height: 44, borderRadius: radii.sm,
    backgroundColor: brand.orange, alignItems: "center", justifyContent: "center",
  },
  addPersonaBtnText: { fontSize: 14, fontWeight: "900", color: "#04060F" },

  // Account
  accountCard: {
    padding: space.xl, borderRadius: radii.xl, borderWidth: 1,
    borderColor: palette.borderSoft, backgroundColor: palette.card,
    marginBottom: space.xl,
  },
  accountEmail: { fontSize: 15, fontWeight: "700", color: palette.text, marginTop: space.sm, marginBottom: space.lg },
  logoutBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: palette.borderSoft,
    alignSelf: "flex-start",
  },
  logoutText: { fontSize: 13, fontWeight: "900", color: palette.muted },

  toast: {
    position: "absolute", bottom: 100, left: 24, right: 24,
    padding: 14, borderRadius: radii.md,
    backgroundColor: "rgba(74,222,128,0.15)", borderWidth: 1,
    borderColor: "rgba(74,222,128,0.30)",
  },
  toastText: { fontSize: 13, fontWeight: "900", color: "#4ade80", textAlign: "center" },
});
