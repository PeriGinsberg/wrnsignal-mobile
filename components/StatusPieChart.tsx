import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, G, Text as SvgText } from "react-native-svg";
import { palette, brand, type as typ, space, radii } from "@/constants/theme";

type StatusSlice = {
  label: string;
  count: number;
  color: string;
  glow: string;
};

const STATUS_CONFIG: StatusSlice[] = [
  { label: "Applied", count: 0, color: "#FEB06A", glow: "rgba(254,176,106,0.35)" },
  { label: "Interviewing", count: 0, color: "#A78BFA", glow: "rgba(167,139,250,0.35)" },
  { label: "Offer", count: 0, color: "#4ADE80", glow: "rgba(74,222,128,0.35)" },
  { label: "Saved", count: 0, color: "#51ADE5", glow: "rgba(81,173,229,0.35)" },
  { label: "Rejected", count: 0, color: "#F87171", glow: "rgba(248,113,113,0.35)" },
  { label: "Withdrawn", count: 0, color: "#64748B", glow: "rgba(100,116,139,0.35)" },
];

type Props = {
  statusCounts: Record<string, number>;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  // For a full circle, draw two half-arcs
  if (endAngle - startAngle >= 359.99) {
    const mid = startAngle + 180;
    return describeArc(cx, cy, r, startAngle, mid) + " " + describeArc(cx, cy, r, mid, endAngle - 0.01);
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

export function StatusPieChart({ statusCounts }: Props) {
  const slices = STATUS_CONFIG.map((s) => ({
    ...s,
    count: statusCounts[s.label.toLowerCase()] ?? 0,
  })).filter((s) => s.count > 0);

  const total = slices.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) return null;

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 100;
  const innerR = 52; // donut hole

  let currentAngle = 0;
  const arcs = slices.map((slice) => {
    const sweep = (slice.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    const midAngle = startAngle + sweep / 2;
    currentAngle = endAngle;

    // Outer arc path
    const outerPath = describeArc(cx, cy, outerR, startAngle, endAngle);

    // Inner cutout (we'll use a mask approach — draw the donut by overlaying)
    // For simplicity, draw full pie slices then overlay a center circle

    // Label position
    const labelR = outerR * 0.72;
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    const pct = Math.round((slice.count / total) * 100);

    return {
      ...slice,
      outerPath,
      labelPos,
      pct,
      midAngle,
      sweep,
    };
  });

  return (
    <View style={s.container}>
      <View style={s.chartCard}>
        {/* Title */}
        <Text style={s.title}>APPLICATION STATUS</Text>

        {/* Chart */}
        <View style={s.chartWrap}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Pie slices */}
            {arcs.map((arc, i) => (
              <Path
                key={i}
                d={arc.outerPath}
                fill={arc.color}
                strokeWidth={2}
                stroke={palette.cardDeep}
              />
            ))}

            {/* Center donut hole */}
            <Circle cx={cx} cy={cy} r={innerR} fill={palette.cardDeep} />

            {/* Center text */}
            <SvgText
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              fontSize={32}
              fontWeight="900"
              fill={palette.text}
            >
              {total}
            </SvgText>
            <SvgText
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              fontSize={10}
              fontWeight="700"
              letterSpacing={1.5}
              fill={palette.dim}
            >
              TOTAL
            </SvgText>

            {/* Percentage labels on slices */}
            {arcs.map((arc, i) =>
              arc.sweep > 25 ? (
                <SvgText
                  key={`lbl-${i}`}
                  x={arc.labelPos.x}
                  y={arc.labelPos.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="900"
                  fill="#ffffff"
                >
                  {arc.pct}%
                </SvgText>
              ) : null
            )}
          </Svg>
        </View>

        {/* Legend */}
        <View style={s.legend}>
          {slices.map((slice, i) => (
            <View key={i} style={s.legendRow}>
              <View style={s.legendDotWrap}>
                <View style={[s.legendGlow, { backgroundColor: slice.glow }]} />
                <View style={[s.legendDot, { backgroundColor: slice.color }]} />
              </View>
              <Text style={s.legendLabel}>{slice.label}</Text>
              <Text style={[s.legendCount, { color: slice.color }]}>{slice.count}</Text>
            </View>
          ))}
        </View>

        {/* All statuses legend (including zero counts) */}
        {slices.length < STATUS_CONFIG.length && (
          <View style={s.emptyStatuses}>
            {STATUS_CONFIG.filter(
              (sc) => (statusCounts[sc.label.toLowerCase()] ?? 0) === 0
            ).map((sc, i) => (
              <View key={i} style={s.emptyStatusRow}>
                <View style={[s.emptyDot, { backgroundColor: sc.color + "40" }]} />
                <Text style={s.emptyLabel}>{sc.label}</Text>
                <Text style={s.emptyCount}>0</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: space.xl,
    marginBottom: space.xl,
  },
  chartCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    backgroundColor: palette.cardDeep,
    overflow: "hidden",
    padding: space.xl,
  },
  title: {
    ...typ.eyebrow,
    color: palette.dim,
    textAlign: "center",
    marginBottom: space.lg,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xl,
  },

  // Legend
  legend: {
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  legendDotWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  legendGlow: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: palette.text,
  },
  legendCount: {
    fontSize: 18,
    fontWeight: "900",
  },

  // Empty statuses
  emptyStatuses: {
    marginTop: space.md,
    gap: 4,
  },
  emptyStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyLabel: {
    flex: 1,
    fontSize: 12,
    color: palette.dim,
  },
  emptyCount: {
    fontSize: 12,
    color: palette.dim,
  },
});
