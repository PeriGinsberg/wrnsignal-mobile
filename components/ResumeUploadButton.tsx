import { useState } from "react";
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/lib/auth-context";
import { uploadResume } from "@/lib/api";
import { palette, brand, radii, space, type as typ } from "@/constants/theme";

type Props = {
  /** Called with the extracted resume text after a successful upload. */
  onTextExtracted: (text: string) => void;
};

export function ResumeUploadButton({ onTextExtracted }: Props) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick() {
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];

      // accessToken is null for anonymous (trial) users — that's fine,
      // /api/resume-upload accepts anonymous uploads (auth optional).
      setUploading(true);
      const text = await uploadResume(
        accessToken ?? null,
        file.uri,
        file.name,
        file.mimeType || "application/octet-stream"
      );
      onTextExtracted(text);
    } catch (e: any) {
      setError(e?.message || "Upload failed. Try pasting your resume instead.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Pressable
        onPress={handlePick}
        disabled={uploading}
        style={({ pressed }) => [
          styles.btn,
          uploading && { opacity: 0.5 },
          pressed && !uploading && { opacity: 0.85 },
        ]}
      >
        {uploading ? (
          <ActivityIndicator color={brand.blue} size="small" />
        ) : (
          <Text style={styles.btnText}>Upload Resume (PDF, DOCX, TXT)</Text>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(81,173,229,0.30)",
    backgroundColor: "rgba(81,173,229,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "800",
    color: brand.blue,
  },
  error: {
    ...typ.caption,
    color: palette.error,
    marginTop: space.sm,
  },
});
