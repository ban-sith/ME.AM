import React, { useEffect, useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface Star {
  x: string;
  y: string;
  size: number;
  anim: Animated.Value;
  duration: number;
}

export default function Starfield({ count = 30 }: { count?: number }) {
  const stars = useMemo<Star[]>(() =>
    Array.from({ length: count }, () => ({
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
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
              left: star.x as any,
              top: star.y as any,
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
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
