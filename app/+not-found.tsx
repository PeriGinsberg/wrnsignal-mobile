import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { palette, type, shared, space, brand } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found.</Text>
        <Link href="/jobfit" style={styles.link}>
          <Text style={styles.linkText}>Go to Job Fit</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: space["3xl"],
  },
  title: {
    ...type.h2,
    color: palette.text,
    marginBottom: space.lg,
  },
  link: {
    marginTop: space.lg,
  },
  linkText: {
    ...type.bodyBold,
    color: brand.blue,
  },
});
