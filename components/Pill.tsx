import { View, Text, StyleSheet } from "react-native";
import { type as typ, radii } from "@/constants/theme";

type Props = {
  text: string;
  bg: string;
  color: string;
  borderColor?: string;
};

export function Pill({ text, bg, color, borderColor }: Props) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: borderColor || bg,
        },
      ]}
    >
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  text: {
    ...typ.pill,
    textTransform: "uppercase",
  },
});
