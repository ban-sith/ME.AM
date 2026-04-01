import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, pixelFont } from '../theme';

const moonImg = require('../../assets/ui/moon.png');
const sunImg = require('../../assets/ui/sun.png');

const DEBUG_HOUR: number | null = null; // set to number for testing

function getTimeOfDay(): 'night' | 'dawn' | 'day' | 'dusk' {
  const h = DEBUG_HOUR ?? new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 18) return 'day';
  if (h >= 18 && h < 20) return 'dusk';
  return 'night';
}

function getGreeting(): string {
  const h = DEBUG_HOUR ?? new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 18) return 'Good Afternoon';
  if (h >= 18 && h < 22) return 'Good Evening';
  return 'Good Night';
}

export default function SkyIndicator() {
  const [tod, setTod] = useState(getTimeOfDay());
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setTod(getTimeOfDay());
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isNight = tod === 'night' || tod === 'dusk';
  const isDawn = tod === 'dawn';

  return (
    <View style={s.container}>
      <Image source={isNight ? moonImg : sunImg} style={s.icon} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  icon: { width: 18, height: 18 },
  text: {
    fontFamily: pixelFont,
    fontSize: 7,
    color: colors.textDim,
  },
  textDawn: { color: colors.warmOrange },
  textDay: { color: colors.gold },
});
