import React, { useRef } from 'react';
import {
  View,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { colors, pixelFont } from '../theme';

const deleteIcon = require('../../assets/ui/delete_icon.png');

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  style?: ViewStyle;
}

const THRESHOLD = -80;

export default function SwipeableCard({ children, onDelete, style }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const deleteOpacity = translateX.interpolate({
    inputRange: [THRESHOLD, -10, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? THRESHOLD : 0;
        const val = Math.min(0, Math.max(THRESHOLD - 20, base + g.dx));
        translateX.setValue(val);
      },
      onPanResponderRelease: (_, g) => {
        const base = isOpen.current ? THRESHOLD : 0;
        const final = base + g.dx;
        if (final < THRESHOLD / 2) {
          Animated.spring(translateX, { toValue: THRESHOLD, friction: 8, useNativeDriver: false }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: false }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  function handleDelete() {
    Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: false }).start(() => {
      onDelete();
      translateX.setValue(0);
      isOpen.current = false;
    });
  }

  return (
    <View style={[s.wrapper, style]}>
      <Animated.View style={[s.deleteBg, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={s.deleteInner} onPress={handleDelete} activeOpacity={0.7}>
          <Image source={deleteIcon} style={s.deleteImg} />
          <Text style={s.deleteText}>DEL</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  deleteInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteImg: { width: 20, height: 20 },
  deleteText: {
    fontFamily: pixelFont,
    fontSize: 7,
    color: colors.coral,
  },
});
