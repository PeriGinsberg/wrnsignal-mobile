import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  Dimensions,
} from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

type Props = {
  onAnimationComplete: () => void
}

/**
 * Dramatic animated splash screen for SIGNAL.
 *
 * Sequence (~2.4s total):
 *   0.0s  Black-navy background, glow orbs at 0
 *   0.0s  Orange + blue orbs scale up + fade in (overlap)
 *   0.4s  Logo fades in + scales from 0.7 -> 1.0 with spring
 *   1.0s  Glow orbs pulse outward (scale 1.0 -> 1.4)
 *   1.4s  Logo gets a subtle "breath" scale to 1.05
 *   1.8s  Everything fades to black, then onAnimationComplete fires
 */
export default function AnimatedSplash({ onAnimationComplete }: Props) {
  // ── Animated values ──
  const orbOpacity = useRef(new Animated.Value(0)).current
  const orbScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.7)).current
  const logoGlow = useRef(new Animated.Value(0)).current
  const fadeOut = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Main animation sequence — all use native driver (transform + opacity)
    const mainSequence = Animated.sequence([
      // Phase 1: Glow orbs fade in + scale up
      Animated.parallel([
        Animated.timing(orbOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Phase 2: Logo enters with spring
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1.0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 3: Orb pulse + logo breath
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: 1.4,
            duration: 700,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 1.1,
            duration: 400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.0,
            duration: 500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Phase 4: Fade everything out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ])

    // Separate glow sequence — uses JS driver because shadow props
    // are not supported by the native driver. Runs in parallel but
    // on its own Animated.Value so it doesn't conflict.
    const glowSequence = Animated.sequence([
      Animated.delay(1300), // wait until logo is visible
      Animated.timing(logoGlow, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(logoGlow, {
        toValue: 0.4,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ])

    // Fire both in parallel — they target different Animated.Values
    // so there's no conflict between native and JS drivers.
    mainSequence.start(() => {
      onAnimationComplete()
    })
    glowSequence.start()
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Background glow orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbOrange,
          {
            opacity: orbOpacity,
            transform: [{ scale: orbScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbBlue,
          {
            opacity: orbOpacity,
            transform: [{ scale: orbScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbPurple,
          {
            opacity: Animated.multiply(orbOpacity, 0.7),
            transform: [{ scale: orbScale }],
          },
        ]}
      />

      {/* Logo with glow.
          Outer view handles opacity + scale (native driver).
          Inner view handles shadow glow (JS driver).
          They MUST be separate Animated.Views because RN does not allow
          mixing native and JS driven props on the same view. */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Animated.View
          style={{
            shadowColor: "#FEB06A",
            shadowOpacity: logoGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.9],
            }),
            shadowRadius: logoGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 40],
            }),
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Image
            source={require("../assets/images/signal-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0b1929",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbOrange: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    backgroundColor: "rgba(254, 176, 106, 0.18)",
    top: "30%",
  },
  orbBlue: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: "rgba(81, 173, 229, 0.18)",
    bottom: "30%",
  },
  orbPurple: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: "rgba(192, 132, 252, 0.14)",
    left: "5%",
  },
  logoWrap: {
    width: SCREEN_WIDTH * 0.78,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: undefined,
    aspectRatio: 1024 / 320, // logo is wider than tall
  },
})
