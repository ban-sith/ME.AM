import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import RecordScreen from './src/screens/RecordScreen';
import AlarmsScreen from './src/screens/AlarmsScreen';
import { colors, pixelFont } from './src/theme';

const micIcon = require('./assets/ui/mic_icon.png');
const alarmIcon = require('./assets/ui/alarm_icon.png');

type Tab = 'records' | 'alarms';

export default function App() {
  const [tab, setTab] = useState<Tab>('records');
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = '* { outline: none !important; -webkit-tap-highlight-color: transparent !important; }';
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      {tab === 'records' ? <RecordScreen /> : <AlarmsScreen />}

      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => setTab('records')} activeOpacity={0.7}>
          <Image source={micIcon} style={[s.tabImg, tab === 'records' && s.tabImgActive]} />
          <Text style={[s.tabLabel, tab === 'records' && s.tabLabelActive]}>REC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={() => setTab('alarms')} activeOpacity={0.7}>
          <Image source={alarmIcon} style={[s.tabImg, tab === 'alarms' && s.tabImgActive]} />
          <Text style={[s.tabLabel, tab === 'alarms' && s.tabLabelActive]}>ALARMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1.5,
    borderTopColor: colors.cardBorder,
    paddingBottom: 28,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabImg: { width: 26, height: 26, opacity: 0.4 },
  tabImgActive: { opacity: 1 },
  tabLabel: {
    fontFamily: pixelFont,
    color: colors.textMuted,
    fontSize: 7,
    marginTop: 4,
  },
  tabLabelActive: { color: colors.pink },
});
