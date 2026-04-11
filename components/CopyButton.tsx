import { useState, useCallback } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { palette, radii, space } from "@/constants/theme";

type Props = {
  text: string;
  label?: string;
};

export function CopyButton({ text, label = "Copy" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Pressable
      onPress={handleCopy}
      style={({ pressed }) => [
        styles.btn,
        copied && styles.btnCopied,
        pressed && !copied && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.text, copied && styles.textCopied]}>
        {copied ? "Copied!" : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: "flex-start",
  },
  btnCopied: {
    backgroundColor: "rgba(74,222,128,0.15)",
    borderColor: "rgba(74,222,128,0.40)",
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.muted,
  },
  textCopied: {
    color: "#4ade80",
  },
});
