import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  anim: Animated.Value;
  duration: number;
}

export default function Starfield({ count = 30 }: { count?: number }) {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height - 100),
      size: 1 + Math.random() * 2,
      anim: new Animated.Value(Math.random()),
      duration: 1500 + Math.random() * 3000,
    })),
  []);

  useEffect(() => {
    stars.forEach((star) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.anim, { toValue: 1, duration: star.duration, useNativeDriver: false }),
          Animated.timing(star.anim, { toValue: 0.1, duration: star.duration, useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={s.container} pointerEvents="none">
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={[
            s.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
