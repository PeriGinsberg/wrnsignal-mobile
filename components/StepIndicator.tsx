import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { palette, brand, space, radii } from "@/constants/theme";

type Step = 1 | 2 | 3 | 4;

const STEPS: { step: Step; label: string; route: string }[] = [
  { step: 1, label: "Fit", route: "/jobfit" },
  { step: 2, label: "Position", route: "/positioning" },
  { step: 3, label: "Letter", route: "/coverletter" },
  { step: 4, label: "Network", route: "/networking" },
];

type Props = {
  current: Step;
  /** Steps that have results (are "done"). */
  completed?: Step[];
};

export function StepIndicator({ current, completed = [] }: Props) {
  const router = useRouter();
  const doneSet = new Set(completed);

  return (
    <View style={s.wrap}>
      {STEPS.map((item, i) => {
        const isActive = item.step === current;
        const isDone = doneSet.has(item.step);

        return (
          <View key={item.step} style={s.itemWrap}>
            {/* Connector line (before each step except the first) */}
            {i > 0 && (
              <View
                style={[
                  s.connector,
                  isDone || isActive
                    ? { backgroundColor: brand.orange + "70" }
                    : { backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
              />
            )}
            <Pressable
              onPress={() => router.navigate(item.route as any)}
              style={[
                s.step,
                isActive && s.stepActive,
                isDone && !isActive && s.stepDone,
              ]}
            >
              <View
                style={[
                  s.dot,
                  isActive && s.dotActive,
                  isDone && !isActive && s.dotDone,
                ]}
              >
                <Text
                  style={[
                    s.dotText,
                    isActive && s.dotTextActive,
                    isDone && !isActive && s.dotTextDone,
                  ]}
                >
                  {isDone && !isActive ? "✓" : item.step}
                </Text>
              </View>
              <Text
                style={[
                  s.label,
                  isActive && s.labelActive,
                  isDone && !isActive && s.labelDone,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },

  itemWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  connector: {
    height: 2,
    flex: 1,
    borderRadius: 1,
    marginRight: 4,
  },

  step: {
    alignItems: "center",
    gap: 4,
  },
  stepActive: {},
  stepDone: {},

  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: brand.orange,
    borderColor: brand.orange,
  },
  dotDone: {
    backgroundColor: "rgba(254,176,106,0.15)",
    borderColor: "rgba(254,176,106,0.50)",
  },

  dotText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.25)",
  },
  dotTextActive: {
    color: "#04060F",
  },
  dotTextDone: {
    color: brand.orange,
    fontSize: 11,
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    color: palette.dim,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: brand.orange,
  },
  labelDone: {
    color: palette.muted,
  },
});
