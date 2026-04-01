import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const sleepImg = require('../../assets/mascot/sleep.png');
const wakingImg = require('../../assets/mascot/waking.png');
const awakeImg = require('../../assets/mascot/awake.png');

export type MascotState = 'sleep' | 'waking' | 'awake';

interface Props {
  state: MascotState;
  size?: number;
}

export default function Mascot({ state, size = 48 }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'awake') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -6, duration: 400, useNativeDriver: false }),
          Animated.timing(bounce, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      ).start();
    } else if (state === 'sleep') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce, { toValue: -2, duration: 1500, useNativeDriver: false }),
          Animated.timing(bounce, { toValue: 2, duration: 1500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      bounce.setValue(0);
    }
    return () => bounce.stopAnimation();
  }, [state]);

  const img = state === 'sleep' ? sleepImg : state === 'waking' ? wakingImg : awakeImg;

  return (
    <Animated.View style={[s.container, { transform: [{ translateY: bounce }] }]}>
      <Image source={img} style={{ width: size, height: size }} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
