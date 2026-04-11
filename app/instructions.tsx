import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GradientBar } from "@/components/GradientBar";
import {
  palette, brand, type as typ, shared, space, radii, gradients,
} from "@/constants/theme";

const STEPS = [
  {
    n: "1",
    title: "Run Job Fit",
    desc: "Paste any job description and get a clear decision — Priority Apply, Apply, Review, or Pass — before you spend time on an application.",
    accent: brand.orange,
  },
  {
    n: "2",
    title: "Run Positioning",
    desc: "Rewrite your resume bullets to match this specific role. One targeted story, in the language the recruiter is scanning for.",
    accent: brand.orange,
  },
  {
    n: "3",
    title: "Run Cover Letter",
    desc: "Generate a cover letter in your voice that connects your background to this company. Not a template — a real case for why you fit.",
    accent: brand.blue,
  },
  {
    n: "4",
    title: "Run Networking",
    desc: "Build your outreach plan. Know who to contact, what to say, and how to follow up so your name is known before the interview.",
    accent: brand.blue,
  },
];

const TIPS = [
  "Run all 4 steps for every job you're serious about.",
  "Start with Job Fit — if it says Pass, save your energy for a better match.",
  "Copy your rewritten bullets directly into your resume before applying.",
  "Send your first networking message the same day you apply.",
  "Tap the + button in the tab bar to start fresh with a new job.",
];

export default function InstructionsModal() {
  const router = useRouter();

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.closeText}>Done</Text>
        </Pressable>

        {/* Header */}
        <View style={s.card}>
          <GradientBar colors={gradients.primary} />
          <View style={s.cardInner}>
            <Text style={s.eyebrow}>HOW TO USE SIGNAL</Text>
            <Text style={s.headline}>4 steps. One job at a time.</Text>
            <Text style={s.subhead}>
              SIGNAL works best when you run all 4 tools in order for each job
              you're considering. Here's the workflow:
            </Text>

            {/* Steps */}
            {STEPS.map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View
                  style={[
                    s.stepDot,
                    {
                      borderColor: step.accent + "80",
                      backgroundColor: step.accent + "20",
                    },
                  ]}
                >
                  <Text style={[s.stepDotText, { color: step.accent }]}>
                    {step.n}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}

            {/* Divider */}
            <View style={s.divider} />

            {/* Tips */}
            <Text style={s.tipsEyebrow}>TIPS</Text>
            {TIPS.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <Text style={s.tipBullet}>•</Text>
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Close at bottom too */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.doneBtnText}>Got it</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: space["2xl"],
    paddingTop: space.lg,
    paddingBottom: 40,
  },

  closeBtn: {
    alignSelf: "flex-end",
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    marginBottom: space.md,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.blue,
  },

  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.cardDeep,
    overflow: "hidden",
    marginBottom: space.xl,
  },
  cardInner: { padding: space.xl },

  eyebrow: { ...typ.eyebrow, color: brand.orange, marginBottom: space.md },
  headline: { ...typ.h2, color: palette.text, marginBottom: space.sm },
  subhead: {
    ...typ.caption, color: palette.muted, lineHeight: 20,
    marginBottom: space.xl,
  },

  // Steps
  stepRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    marginBottom: 18,
  },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  stepDotText: { fontSize: 14, fontWeight: "900" },
  stepTitle: {
    fontSize: 15, fontWeight: "900", color: palette.text, marginBottom: 3,
  },
  stepDesc: { fontSize: 13, lineHeight: 19, color: palette.muted },

  divider: {
    height: 1, backgroundColor: palette.borderSoft, marginVertical: space.xl,
  },

  tipsEyebrow: { ...typ.eyebrow, color: palette.dim, marginBottom: space.md },
  tipRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginBottom: 10,
  },
  tipBullet: { fontSize: 13, color: brand.orange, fontWeight: "900", marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: palette.muted },

  doneBtn: {
    height: 52, borderRadius: radii.md, backgroundColor: brand.orange,
    alignItems: "center", justifyContent: "center",
  },
  doneBtnText: { fontSize: 15, fontWeight: "900", color: "#04060F" },
});
