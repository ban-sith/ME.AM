import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
  Platform,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Recording } from '../types';
import { getRecordings, saveRecordings } from '../utils/storage';
import { colors, pixelFont, shadow, shadowSmall, glowPink, glowCoral, glowCyan } from '../theme';
import SwipeableCard from '../components/SwipeableCard';
import Waveform from '../components/Waveform';

const recordBtnImg = require('../../assets/ui/record_btn.png');
const playIcon = require('../../assets/ui/play_icon.png');
const stopIcon = require('../../assets/ui/stop_icon.png');
const clearAllImg = require('../../assets/ui/clear_all.png');
const titleImg = require('../../assets/ui/title_rec.png');

export default function RecordScreen() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadRecordings();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function loadRecordings() {
    setRecordings(await getRecordings());
  }

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      Alert.alert('Error', 'Microphone permission required');
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    await recordingRef.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recordingRef.current.getURI();
    if (!uri) return;
    const status = await recordingRef.current.getStatusAsync();
    const duration = Math.round((status.durationMillis || 0) / 1000);
    const id = Date.now().toString();
    let finalUri = uri;

    if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
      const permanentUri = `${FileSystem.documentDirectory}recording_${id}.m4a`;
      await FileSystem.moveAsync({ from: uri, to: permanentUri });
      finalUri = permanentUri;
    }

    const newRec: Recording = { id, name: `Recording ${recordings.length + 1}`, uri: finalUri, duration, createdAt: Date.now() };
    const updated = [newRec, ...recordings];
    setRecordings(updated);
    await saveRecordings(updated);
    recordingRef.current = null;
  }

  async function playRecording(rec: Recording) {
    if (playingId === rec.id) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      setPlayingId(null);
      return;
    }
    if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    const { sound } = await Audio.Sound.createAsync({ uri: rec.uri }, { shouldPlay: true, volume: 1.0 });
    soundRef.current = sound;
    setPlayingId(rec.id);
    sound.setOnPlaybackStatusUpdate((st) => { if (st.isLoaded && st.didJustFinish) setPlayingId(null); });
  }

  async function deleteRecording(rec: Recording) {
    if (Platform.OS !== 'web') await FileSystem.deleteAsync(rec.uri, { idempotent: true });
    const updated = recordings.filter((r) => r.id !== rec.id);
    setRecordings(updated);
    await saveRecordings(updated);
  }

  function clearAll() {
    if (recordings.length === 0) return;
    Alert.alert('Delete All', `Delete all ${recordings.length} recordings?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          if (Platform.OS !== 'web') {
            for (const r of recordings) await FileSystem.deleteAsync(r.uri, { idempotent: true });
          }
          setRecordings([]);
          await saveRecordings([]);
        },
      },
    ]);
  }

  function startRename(rec: Recording) { setEditingId(rec.id); setEditName(rec.name); }

  async function finishRename(rec: Recording) {
    const name = editName.trim();
    setEditingId(null);
    if (!name || name === rec.name) return;
    const updated = recordings.map((r) => r.id === rec.id ? { ...r, name } : r);
    setRecordings(updated);
    await saveRecordings(updated);
  }

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <View style={st.container}>
      <View style={st.titleRow}>
        <Image source={titleImg} style={st.titleImg} />
        <Text style={st.title}>RECORDINGS</Text>
      </View>

      {/* Record Button */}
      <TouchableOpacity
        style={[st.recordBtn, isRecording && st.recordingBtn]}
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        {isRecording ? (
          <View style={st.recordingContent}>
            <Waveform active={true} color={colors.coral} barCount={16} />
            <Text style={st.recordTime}>{fmt(recordingTime)}</Text>
          </View>
        ) : (
          <View style={st.recordIdleContent}>
            <Image source={recordBtnImg} style={st.recordImg} />
            <Text style={st.recordText}>RECORD</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={recordings}
        keyExtractor={(i) => i.id}
        contentContainerStyle={st.list}
        ListEmptyComponent={
          <Text style={st.empty}>No recordings yet{'\n'}Tap the button to record!</Text>
        }
        ListFooterComponent={recordings.length > 0 ? (
          <TouchableOpacity style={st.clearAllBtn} onPress={clearAll} activeOpacity={0.7}>
            <Image source={clearAllImg} style={st.clearAllImg} />
            <Text style={st.clearAllText}>CLEAR ALL</Text>
          </TouchableOpacity>
        ) : null}
        renderItem={({ item }) => (
          <SwipeableCard onDelete={() => deleteRecording(item)}>
            <View style={[st.card, playingId === item.id && st.cardActive]}>
              <TouchableOpacity onPress={() => playRecording(item)} activeOpacity={0.7} style={st.playBtn}>
                <Image source={playingId === item.id ? stopIcon : playIcon} style={st.playImg} />
              </TouchableOpacity>
              <View style={st.cardInfo}>
                {editingId === item.id ? (
                  <TextInput
                    style={st.cardInput}
                    value={editName}
                    onChangeText={setEditName}
                    onSubmitEditing={() => finishRename(item)}
                    onBlur={() => finishRename(item)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => startRename(item)} activeOpacity={0.7}>
                    <Text style={st.cardName} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                <Text style={st.cardDur}>{fmt(item.duration)}</Text>
              </View>
              {playingId === item.id && (
                <Waveform active={true} color={colors.cyan} barCount={8} />
              )}
            </View>
          </SwipeableCard>
        )}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  titleImg: { width: 32, height: 32 },
  title: {
    fontFamily: pixelFont,
    fontSize: 14,
    color: colors.pink,
    letterSpacing: 2,
  },
  recordBtn: {
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.coral,
    borderBottomWidth: 5,
    borderBottomColor: '#cc2233',
    ...glowCoral,
  },
  recordingBtn: {
    backgroundColor: '#2a1020',
    borderColor: '#ff6b81',
    borderBottomColor: '#cc3344',
  },
  recordIdleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  recordingContent: {
    alignItems: 'center',
    gap: 6,
  },
  recordImg: { width: 36, height: 36 },
  recordText: {
    fontFamily: pixelFont,
    fontSize: 11,
    color: colors.coral,
  },
  recordTime: {
    fontFamily: pixelFont,
    fontSize: 14,
    color: colors.coral,
  },
  list: { padding: 16, paddingBottom: 100 },
  empty: {
    fontFamily: pixelFont,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 8,
    marginTop: 40,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#1a2540',
    gap: 10,
    ...shadowSmall,
  },
  cardActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.surface,
    borderBottomColor: '#0a2450',
    ...glowCyan,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  playImg: { width: 20, height: 20 },
  cardInfo: { flex: 1 },
  cardName: {
    fontFamily: pixelFont,
    color: colors.text,
    fontSize: 9,
  },
  cardInput: {
    fontFamily: pixelFont,
    color: colors.gold,
    fontSize: 9,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    outlineStyle: 'none',
  } as any,
  cardDur: {
    fontFamily: pixelFont,
    color: colors.textDim,
    fontSize: 7,
    marginTop: 3,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderBottomWidth: 4,
    borderBottomColor: '#cc2233',
    marginTop: 8,
    gap: 8,
    ...shadowSmall,
  },
  clearAllImg: { width: 18, height: 18 },
  clearAllText: {
    fontFamily: pixelFont,
    fontSize: 7,
    color: colors.coral,
  },
});
