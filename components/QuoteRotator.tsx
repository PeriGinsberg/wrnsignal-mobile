import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { SIGNAL_QUOTES } from "@/lib/quotes";

interface QuoteRotatorProps {
  visible: boolean;
}

export function QuoteRotator({ visible }: QuoteRotatorProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * SIGNAL_QUOTES.length)
  );

  useEffect(() => {
    if (!visible) return;

    // Reset to a new random start each time loading begins
    setIndex(Math.floor(Math.random() * SIGNAL_QUOTES.length));
    opacity.setValue(1);

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Switch quote
        setIndex((prev) => (prev + 1) % SIGNAL_QUOTES.length);
        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const quote = SIGNAL_QUOTES[index];

  return (
    <Animated.View style={[s.container, { opacity }]}>
      <Text style={s.text}>{quote.text}</Text>
      {quote.attribution && (
        <Text style={s.attribution}>{quote.attribution}</Text>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 32,
    marginHorizontal: 24,
    minHeight: 100,
    justifyContent: "center",
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255,149,0,0.4)",
    paddingLeft: 16,
  },
  text: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
  },
  attribution: {
    color: "#FF9500",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
});
