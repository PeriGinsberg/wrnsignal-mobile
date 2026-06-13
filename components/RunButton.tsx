import { Pressable, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { brand, radii, palette } from "@/constants/theme";
import { QuoteRotator } from "./QuoteRotator";

type Props = {
  label: string;
  onPress: () => void;
  loading: boolean;
  loadingHint?: string;
};

export function RunButton({ label, onPress, loading, loadingHint }: Props) {
  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          loading && styles.disabled,
          pressed && !loading && { opacity: 0.85 },
        ]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#04060F" size="small" />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </Pressable>
      {loading && loadingHint && (
        <Text style={styles.hint}>{loadingHint}</Text>
      )}
      <QuoteRotator visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.orange,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: "900",
    color: "#04060F",
  },
  hint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: palette.dim,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
