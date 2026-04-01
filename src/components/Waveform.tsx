import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  active: boolean;
  color?: string;
  barCount?: number;
}

export default function Waveform({ active, color = colors.cyan, barCount = 12 }: Props) {
  const anims = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (active) {
      const animations = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 150 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.15 + Math.random() * 0.3,
              duration: 150 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    } else {
      anims.forEach((a) =>
        Animated.timing(a, { toValue: 0.15, duration: 300, useNativeDriver: false }).start()
      );
    }
  }, [active]);

  return (
    <View style={s.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            s.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
              opacity: anim.interpolate({
                inputRange: [0.15, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 2,
  },
  bar: {
    width: 3,
    height: 28,
    borderRadius: 2,
  },
});
