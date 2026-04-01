import React, { useEffect, useRef, useMemo } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const noteImg = require('../../assets/ui/note.png');

interface Props {
  active: boolean;
  count?: number;
  areaWidth?: number;
  areaHeight?: number;
}

export default function FloatingNotes({ active, count = 5, areaWidth = 60, areaHeight = 40 }: Props) {
  const notes = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: new Animated.Value(Math.random() * areaWidth),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      delay: Math.random() * 2000,
    })),
  []);

  useEffect(() => {
    if (active) {
      notes.forEach((note) => {
        const animate = () => {
          note.x.setValue(Math.random() * areaWidth);
          note.y.setValue(0);
          note.opacity.setValue(0);
          Animated.parallel([
            Animated.timing(note.y, { toValue: -areaHeight, duration: 2000 + Math.random() * 1000, useNativeDriver: false }),
            Animated.sequence([
              Animated.timing(note.opacity, { toValue: 1, duration: 400, useNativeDriver: false }),
              Animated.delay(1000),
              Animated.timing(note.opacity, { toValue: 0, duration: 600, useNativeDriver: false }),
            ]),
          ]).start(() => { if (active) animate(); });
        };
        setTimeout(animate, note.delay);
      });
    } else {
      notes.forEach((n) => { n.opacity.setValue(0); });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={[s.container, { width: areaWidth, height: areaHeight }]}>
      {notes.map((note, i) => (
        <Animated.Image
          key={i}
          source={noteImg}
          style={[
            s.note,
            {
              left: note.x,
              transform: [{ translateY: note.y }],
              opacity: note.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  note: {
    position: 'absolute',
    bottom: 0,
    width: 14,
    height: 14,
  },
});
