import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  value: boolean;
  onToggle: () => void;
}

export default function PixelToggle({ value, onToggle }: Props) {
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: value ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackBg = pos.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2a2a3e', colors.green],
  });

  const thumbLeft = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
      <Animated.View style={[s.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[s.thumb, { left: thumbLeft }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
});
