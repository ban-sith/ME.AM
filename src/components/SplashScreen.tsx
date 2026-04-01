import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, StyleSheet } from 'react-native';
import { colors, pixelFont } from '../theme';

const splashImg = require('../../assets/splash.png');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: false }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
      // Title fades in
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: false }),
      // Hold
      Animated.delay(800),
      // Fade out everything
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[s.container, { opacity: fadeOut }]}>
      <Animated.Image
        source={splashImg}
        style={[s.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      />
      <Animated.Text style={[s.title, { opacity: titleOpacity }]}>WAKE ME UP</Animated.Text>
      <Animated.Text style={[s.sub, { opacity: titleOpacity }]}>Your voice. Your alarm.</Animated.Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontFamily: pixelFont,
    fontSize: 16,
    color: colors.pink,
    marginTop: 16,
    letterSpacing: 3,
  },
  sub: {
    fontFamily: pixelFont,
    fontSize: 7,
    color: colors.textDim,
    marginTop: 8,
  },
});
