import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { palette, brand, space, radii } from "@/constants/theme";

interface DatePickerFieldProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (dateStr: string) => void;
  placeholder?: string;
}

export function DatePickerField({ value, onChange, placeholder = "Select date" }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  const parsed = value ? new Date(value + "T12:00:00") : new Date();
  const isValid = value && !isNaN(parsed.getTime());

  function handleChange(_event: any, selectedDate?: Date) {
    if (Platform.OS === "android") setShow(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
  }

  function handleDone() {
    setShow(false);
  }

  function handleClear() {
    onChange("");
    setShow(false);
  }

  return (
    <View>
      <Pressable
        onPress={() => setShow(true)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          borderRadius: radii.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{
          fontSize: 14,
          color: isValid ? palette.text : palette.dim,
        }}>
          {isValid ? value : placeholder}
        </Text>
        <Text style={{ fontSize: 14, color: palette.dim }}>📅</Text>
      </Pressable>

      {show && (
        <View>
          <DateTimePicker
            value={isValid ? parsed : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            themeVariant="dark"
          />
          {Platform.OS === "ios" && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Pressable onPress={handleClear}>
                <Text style={{ fontSize: 13, color: palette.muted }}>Clear</Text>
              </Pressable>
              <Pressable onPress={handleDone}>
                <Text style={{ fontSize: 13, fontWeight: "900", color: brand.orange }}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
