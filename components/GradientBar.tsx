import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { shared } from "@/constants/theme";

type Props = {
  colors: readonly [string, string, ...string[]];
};

export function GradientBar({ colors }: Props) {
  return <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={shared.gradientBar} />;
}
