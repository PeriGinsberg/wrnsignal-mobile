import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { GradientBar } from "./GradientBar";
import { palette, radii, space, type as typ } from "@/constants/theme";

type Props = {
  gradientColors: readonly [string, string, ...string[]];
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Reusable card with gradient top bar, header with icon + title + badge,
 * and content area.  Used for why cards, risk cards, positioning steps,
 * networking steps, etc.
 */
export function SectionCard({
  gradientColors,
  icon,
  iconBg,
  iconColor,
  title,
  titleColor = palette.text,
  subtitle,
  badge,
  badgeBg,
  badgeColor,
  children,
  style,
}: Props) {
  return (
    <View style={[styles.card, style]}>
      <GradientBar colors={gradientColors} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon && (
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: iconBg || "rgba(255,255,255,0.10)" },
              ]}
            >
              <Text style={[styles.iconText, { color: iconColor || "#fff" }]}>
                {icon}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {badge && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeBg || "rgba(255,255,255,0.06)",
                borderColor: badgeColor
                  ? badgeColor + "40"
                  : "rgba(255,255,255,0.12)",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeColor || palette.dim },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.cardDeep,
    overflow: "hidden",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    color: palette.dim,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
});
