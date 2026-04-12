/**
 * SIGNAL Design System — Mobile
 *
 * All color tokens, typography scales, spacing, and shared style
 * primitives for the mobile app.  Derived from the Framer web
 * component but rebuilt for React Native (no CSS strings).
 */

import { StyleSheet } from "react-native";

/* ── Brand ─────────────────────────────────────────────────── */

export const brand = {
  orange: "#FEB06A",
  blue: "#51ADE5",
  teal: "#218C8C",
  ice: "#FFFFFF",
} as const;

/* ── Palette ───────────────────────────────────────────────── */

export const palette = {
  bg: "#13294A",
  navBg: "#091629",
  card: "#0F1F38",
  cardAlt: "#112240",
  cardDeep: "#0D1829",

  glass: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",

  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.60)",
  dim: "rgba(255,255,255,0.35)",

  error: "#FF7878",
  errorBg: "rgba(255,120,120,0.08)",
  success: "#4ade80",
  successBg: "rgba(74,222,128,0.10)",
  warning: "#FEB06A",
  warningBg: "rgba(254,176,106,0.08)",

  tealBright: "#2DD4BF",
  purple: "#7B5CF6",
  coral: "#FF4F6D",
  bgDeep: "#040D1A",
  bgSurface: "#0A1828",
  bgCard: "#071220",
  borderSubtle: "#1E3A5F",
} as const;

/* ── Decision colors ───────────────────────────────────────── */

export const decision = {
  priorityApply: "#0FD668",
  apply: "#3DDC84",
  review: "#D4A444",
  pass: "#E87070",
} as const;

/* ── Gradient stop arrays (for expo-linear-gradient) ──────── */

export const gradients = {
  primary: ["#FEB06A", "#51ADE5"] as const,
  profile: ["#51ADE5", "#218C8C", "#FEB06A"] as const,
  persona: ["#FEB06A", "#f97316", "#51ADE5"] as const,
  priorityApply: ["#FEB06A", "#0FD668"] as const,
  apply: ["#18A957", "#51ADE5"] as const,
  review: ["#8A5A00", "#C68A1E"] as const,
  pass: ["#6B1E1E", "#C23B3B"] as const,
  why: ["#4ade80", "#22c55e", "#51ADE5"] as const,
  risk: ["#f87171", "#ef4444", "#FEB06A"] as const,
} as const;

/* ── Typography scale ──────────────────────────────────────── */

export const type = {
  hero: {
    fontSize: 42,
    fontWeight: "900" as const,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  h1: {
    fontSize: 28,
    fontWeight: "900" as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: "900" as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "900" as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: "700" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: "900" as const,
    lineHeight: 18,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900" as const,
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
    lineHeight: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "900" as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  pill: {
    fontSize: 10,
    fontWeight: "900" as const,
    letterSpacing: 0.5,
    lineHeight: 14,
  },
} as const;

/* ── Spacing scale (4-point grid) ──────────────────────────── */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/* ── Radii ─────────────────────────────────────────────────── */

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 999,
} as const;

/* ── Shared styles ─────────────────────────────────────────── */

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: 100, // clear tab bar
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.card,
    overflow: "hidden",
  },
  cardDeep: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.cardDeep,
    overflow: "hidden",
  },
  input: {
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    color: palette.text,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    color: palette.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
    textAlignVertical: "top",
  },
  gradientBar: {
    height: 3,
    width: "100%",
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
  },
});
