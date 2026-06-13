import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { palette, brand, space, radii } from "@/constants/theme";

interface EmptyToolStateProps {
  icon: string;
  headline: string;
  body: string;
  buttonLabel?: string;
}

export function EmptyToolState({
  icon,
  headline,
  body,
  buttonLabel = "Go to Job Fit →",
}: EmptyToolStateProps) {
  const router = useRouter();

  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.headline}>{headline}</Text>
      <Text style={s.body}>{body}</Text>
      <Pressable
        onPress={() => router.navigate("/(tabs)/jobfit" as any)}
        style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
      >
        <Text style={s.btnText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  headline: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.md,
    backgroundColor: brand.orange,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#04060F",
  },
});
