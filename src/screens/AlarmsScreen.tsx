import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  Image,
  Vibration,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Alarm, Recording } from '../types';
import { getAlarms, saveAlarms, getRecordings } from '../utils/storage';
import {
  requestPermissions,
  scheduleAlarm,
  scheduleSnooze,
  cancelAlarm,
} from '../utils/notifications';
import { getRandomFavorite } from '../utils/storage';
import { colors, pixelFont, shadow, shadowSmall, glowPink, glowCyan, glowGold, VIBRATION_PATTERNS } from '../theme';
import { startWebAlarmChecker, setAlarmCallback, triggerWebSnooze } from '../utils/webAlarm';
import PixelToggle from '../components/PixelToggle';
import SwipeableCard from '../components/SwipeableCard';
import Waveform from '../components/Waveform';

const addIcon = require('../../assets/ui/add_icon.png');
const arrowUp = require('../../assets/ui/arrow_up.png');
const arrowDown = require('../../assets/ui/arrow_down.png');
const snoozeIcon = require('../../assets/ui/snooze_icon.png');
const clearAllImg = require('../../assets/ui/clear_all.png');
const shuffleImg = require('../../assets/ui/shuffle.png');
const alarmImg = require('../../assets/ui/alarm_icon.png');

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SNOOZE_OPTIONS = [0, 5, 10, 15];

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [selRec, setSelRec] = useState<string | null>(null);
  const [selDays, setSelDays] = useState<number[]>([]);
  const [snooze, setSnooze] = useState(5);
  const [vibration, setVibration] = useState('default');
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadData();
    const sub1 = Notifications.addNotificationReceivedListener(onNotif);
    const sub2 = Notifications.addNotificationResponseReceivedListener((r) => onNotif(r.notification));

    // Web alarm checker
    if (Platform.OS === 'web') {
      setAlarmCallback((recordingId, snoozeMin) => {
        playAlarmSound(recordingId, snoozeMin, 'default');
      });
      startWebAlarmChecker();
    }

    return () => { sub1.remove(); sub2.remove(); soundRef.current?.unloadAsync(); };
  }, []);

  function onNotif(notification: Notifications.Notification) {
    const data = notification.request.content.data;
    if (data?.recordingId) playAlarmSound(data.recordingId as string, data.snoozeMinutes as number, data.vibration as string);
  }

  async function playAlarmSound(recordingId: string, snoozeMin: number, vib: string) {
    let rec;
    if (recordingId === 'shuffle') {
      rec = await getRandomFavorite();
    } else {
      const recs = await getRecordings();
      rec = recs.find((r) => r.id === recordingId);
    }
    if (!rec) return;

    // Vibrate
    const vibPattern = VIBRATION_PATTERNS.find((v) => v.value === vib);
    if (vibPattern && vibPattern.pattern.length > 0 && Platform.OS !== 'web') {
      Vibration.vibrate(vibPattern.pattern, true);
    }

    if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    const { sound } = await Audio.Sound.createAsync({ uri: rec.uri }, { shouldPlay: true, volume: 1.0, isLooping: true });
    soundRef.current = sound;

    setTimeout(async () => { await sound.stopAsync(); await sound.unloadAsync(); Vibration.cancel(); }, 60000);

    const buttons: any[] = [
      {
        text: 'Dismiss',
        onPress: async () => { await sound.stopAsync(); await sound.unloadAsync(); soundRef.current = null; Vibration.cancel(); },
      },
    ];
    if (snoozeMin > 0) {
      buttons.unshift({
        text: `Snooze (${snoozeMin}m)`,
        onPress: async () => {
          await sound.stopAsync(); await sound.unloadAsync(); soundRef.current = null; Vibration.cancel();
          if (Platform.OS === 'web') {
            triggerWebSnooze(recordingId, snoozeMin);
          } else {
            await scheduleSnooze('snooze', recordingId, snoozeMin);
          }
        },
      });
    }
    Alert.alert('WAKE UP!', rec.name, buttons);
  }

  async function loadData() {
    const [a, r] = await Promise.all([getAlarms(), getRecordings()]);
    setAlarms(a);
    setRecordings(r);
    if (r.length > 0 && !selRec) setSelRec(r[0].id);
  }

  function openNewAlarm() {
    setEditingAlarm(null);
    setHour(7);
    setMinute(0);
    setSelDays([]);
    setSnooze(5);
    setVibration('default');
    loadData();
    setShowModal(true);
  }

  function openEditAlarm(alarm: Alarm) {
    setEditingAlarm(alarm);
    setHour(alarm.hour);
    setMinute(alarm.minute);
    setSelRec(alarm.recordingId);
    setSelDays([...alarm.days]);
    setSnooze(alarm.snoozeMinutes);
    setVibration(alarm.vibration || 'default');
    loadData();
    setShowModal(true);
  }

  async function saveAlarmFromModal() {
    if (!selRec) { Alert.alert('Error', 'Record a voice first!'); return; }

    if (editingAlarm) {
      // Cancel old notification
      if (editingAlarm.notificationId) try { await cancelAlarm(editingAlarm.notificationId); } catch {}

      const updated: Alarm = {
        ...editingAlarm,
        hour, minute,
        recordingId: selRec,
        days: selDays,
        snoozeMinutes: snooze,
        vibration,
        enabled: true,
      };
      try { await requestPermissions(); updated.notificationId = await scheduleAlarm(updated); } catch {}

      const newAlarms = alarms.map((a) => a.id === updated.id ? updated : a);
      setAlarms(newAlarms);
      await saveAlarms(newAlarms);
    } else {
      const alarm: Alarm = {
        id: Date.now().toString(),
        hour, minute,
        recordingId: selRec,
        enabled: true,
        days: selDays,
        snoozeMinutes: snooze,
        vibration,
      };
      try { await requestPermissions(); alarm.notificationId = await scheduleAlarm(alarm); } catch {}
      const updated = [alarm, ...alarms];
      setAlarms(updated);
      await saveAlarms(updated);
    }

    setShowModal(false);
    setEditingAlarm(null);
  }

  async function toggleAlarm(alarm: Alarm) {
    let updated: Alarm[];
    if (alarm.enabled) {
      if (alarm.notificationId) try { await cancelAlarm(alarm.notificationId); } catch {}
      updated = alarms.map((a) => a.id === alarm.id ? { ...a, enabled: false, notificationId: undefined } : a);
    } else {
      let nid: string | undefined;
      try { await requestPermissions(); nid = await scheduleAlarm(alarm); } catch {}
      updated = alarms.map((a) => a.id === alarm.id ? { ...a, enabled: true, notificationId: nid } : a);
    }
    setAlarms(updated);
    await saveAlarms(updated);
  }

  async function deleteAlarm(alarm: Alarm) {
    if (alarm.notificationId) try { await cancelAlarm(alarm.notificationId); } catch {}
    const updated = alarms.filter((a) => a.id !== alarm.id);
    setAlarms(updated);
    await saveAlarms(updated);
  }

  async function clearAllAlarms() {
    if (alarms.length === 0) return;
    if (Platform.OS === 'web') {
      if (!window.confirm(`Delete all ${alarms.length} alarms?`)) return;
    } else {
      return new Promise<void>((resolve) => {
        Alert.alert('Delete All', `Delete all ${alarms.length} alarms?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Delete All', style: 'destructive',
            onPress: async () => {
              for (const a of alarms) { if (a.notificationId) try { await cancelAlarm(a.notificationId); } catch {} }
              setAlarms([]);
              await saveAlarms([]);
              resolve();
            },
          },
        ]);
      });
    }
    for (const a of alarms) { if (a.notificationId) try { await cancelAlarm(a.notificationId); } catch {} }
    setAlarms([]);
    await saveAlarms([]);
  }

  function toggleDay(d: number) {
    setSelDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function previewVibration(v: string) {
    setVibration(v);
    const p = VIBRATION_PATTERNS.find((vp) => vp.value === v);
    if (p && p.pattern.length > 0 && Platform.OS !== 'web') {
      Vibration.vibrate(p.pattern);
    }
  }

  const getRecName = (id: string) => recordings.find((r) => r.id === id)?.name || '?';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const daysLabel = (days: number[]) => days.length === 0 ? 'Once' : days.length === 7 ? 'Every day' : days.map((d) => DAY_LABELS[d]).join(' ');
  const vibLabel = (v: string) => VIBRATION_PATTERNS.find((vp) => vp.value === v)?.label || 'Default';

  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        <Image source={alarmImg} style={s.titleImg} />
        <Text style={s.title}>ALARMS</Text>
      </View>

      <TouchableOpacity style={s.addBtn} onPress={openNewAlarm} activeOpacity={0.8}>
        <Image source={addIcon} style={s.addImg} />
        <Text style={s.addText}>NEW ALARM</Text>
      </TouchableOpacity>

      <FlatList
        data={alarms}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No alarms yet{'\n'}Record a voice, set an alarm!</Text>}
        ListFooterComponent={alarms.length > 0 ? (
          <TouchableOpacity style={s.clearAllBtn} onPress={clearAllAlarms} activeOpacity={0.7}>
            <Image source={clearAllImg} style={s.clearAllImg} />
            <Text style={s.clearAllText}>CLEAR ALL</Text>
          </TouchableOpacity>
        ) : null}
        renderItem={({ item }) => (
          <SwipeableCard onDelete={() => deleteAlarm(item)}>
            <TouchableOpacity style={[s.card, !item.enabled && s.cardOff]} onPress={() => openEditAlarm(item)} activeOpacity={0.7}>
              <View style={s.cardLeft}>
                <Text style={[s.cardTime, !item.enabled && s.cardTimeOff]}>{pad(item.hour)}:{pad(item.minute)}</Text>
                <View style={s.cardMeta}>
                  <Text style={s.cardRec}>{getRecName(item.recordingId)}</Text>
                  <Text style={s.cardDays}>{daysLabel(item.days)}</Text>
                  {item.snoozeMinutes > 0 && (
                    <View style={s.badge}>
                      <Image source={snoozeIcon} style={s.badgeImg} />
                      <Text style={s.badgeText}>{item.snoozeMinutes}m</Text>
                    </View>
                  )}
                  <Text style={s.vibText}>{vibLabel(item.vibration)}</Text>
                </View>
              </View>
              <PixelToggle value={item.enabled} onToggle={() => toggleAlarm(item)} />
            </TouchableOpacity>
          </SwipeableCard>
        )}
      />

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editingAlarm ? 'EDIT ALARM' : 'NEW ALARM'}</Text>

            {/* Time */}
            <View style={s.timePicker}>
              <View style={s.timeCol}>
                <TouchableOpacity onPress={() => setHour((h) => (h + 1) % 24)} style={s.arrowBtn}>
                  <Image source={arrowUp} style={s.arrowImg} />
                </TouchableOpacity>
                <Text style={s.timeVal}>{pad(hour)}</Text>
                <TouchableOpacity onPress={() => setHour((h) => (h - 1 + 24) % 24)} style={s.arrowBtn}>
                  <Image source={arrowDown} style={s.arrowImg} />
                </TouchableOpacity>
              </View>
              <Text style={s.timeSep}>:</Text>
              <View style={s.timeCol}>
                <TouchableOpacity onPress={() => setMinute((m) => (m + 1) % 60)} style={s.arrowBtn}>
                  <Image source={arrowUp} style={s.arrowImg} />
                </TouchableOpacity>
                <Text style={s.timeVal}>{pad(minute)}</Text>
                <TouchableOpacity onPress={() => setMinute((m) => (m - 1 + 60) % 60)} style={s.arrowBtn}>
                  <Image source={arrowDown} style={s.arrowImg} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days */}
            <Text style={s.label}>REPEAT</Text>
            <View style={s.daysRow}>
              {DAY_LABELS.map((l, i) => (
                <TouchableOpacity key={i} style={[s.dayBtn, selDays.includes(i) && s.dayBtnOn]} onPress={() => toggleDay(i)}>
                  <Text style={[s.dayText, selDays.includes(i) && s.dayTextOn]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Snooze */}
            <Text style={s.label}>SNOOZE</Text>
            <View style={s.optRow}>
              {SNOOZE_OPTIONS.map((m) => (
                <TouchableOpacity key={m} style={[s.optBtn, snooze === m && s.optBtnOn]} onPress={() => setSnooze(m)}>
                  <Text style={[s.optText, snooze === m && s.optTextOn]}>{m === 0 ? 'Off' : `${m}m`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vibration */}
            <Text style={s.label}>VIBRATION</Text>
            <View style={s.optRow}>
              {VIBRATION_PATTERNS.map((v) => (
                <TouchableOpacity key={v.value} style={[s.optBtn, vibration === v.value && s.vibBtnOn]} onPress={() => previewVibration(v.value)}>
                  <Text style={[s.optText, vibration === v.value && s.vibTextOn]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recording */}
            <Text style={s.label}>VOICE</Text>
            {recordings.length === 0 ? (
              <Text style={s.noRec}>Record a voice first</Text>
            ) : (
              <FlatList
                data={[{ id: 'shuffle', name: 'Shuffle', isShuffle: true }, ...recordings.filter(r => r.favorite).map(r => ({ ...r, isShuffle: false })), ...recordings.filter(r => !r.favorite).map(r => ({ ...r, isShuffle: false }))]}
                keyExtractor={(i) => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.recScroll}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[s.recChip, selRec === item.id && s.recChipOn, item.id === 'shuffle' && s.shuffleChip, selRec === 'shuffle' && item.id === 'shuffle' && s.shuffleChipOn]}
                    onPress={() => setSelRec(item.id)}
                  >
                    {item.id === 'shuffle' ? (
                      <View style={s.shuffleRow}>
                        <Image source={shuffleImg} style={s.shuffleImg} />
                        <Text style={[s.recChipText, selRec === 'shuffle' && s.recChipTextOn]}>Shuffle</Text>
                      </View>
                    ) : (
                      <Text style={[s.recChipText, selRec === item.id && s.recChipTextOn]} numberOfLines={1}>{item.name}</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, !selRec && { opacity: 0.4 }]} onPress={saveAlarmFromModal} disabled={!selRec}>
                <Text style={s.saveText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingTop: 8 },
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
    color: colors.cyan,
    letterSpacing: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    borderBottomWidth: 5,
    borderBottomColor: '#a03070',
    ...glowPink,
  },
  addImg: { width: 20, height: 20 },
  addText: { fontFamily: pixelFont, fontSize: 9, color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { fontFamily: pixelFont, color: colors.textMuted, textAlign: 'center', fontSize: 8, marginTop: 40, lineHeight: 18 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#1a2540',
    ...shadowSmall,
  },
  cardOff: { opacity: 0.45 },
  cardLeft: { flex: 1 },
  cardTime: { fontFamily: pixelFont, color: colors.gold, fontSize: 20, textShadowColor: 'rgba(255,215,0,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 } as any,
  cardTimeOff: { color: colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  cardRec: { fontFamily: pixelFont, color: colors.pink, fontSize: 7 },
  cardDays: { fontFamily: pixelFont, color: colors.textDim, fontSize: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badgeImg: { width: 12, height: 12 },
  badgeText: { fontFamily: pixelFont, color: colors.orange, fontSize: 6 },
  vibText: { fontFamily: pixelFont, color: colors.purple, fontSize: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 3,
    borderTopColor: colors.cyan,
    ...shadow,
  },
  modalTitle: { fontFamily: pixelFont, fontSize: 12, color: colors.cyan, textAlign: 'center', marginBottom: 16 },

  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  timeCol: { alignItems: 'center' },
  arrowBtn: { padding: 6, outlineStyle: 'none' } as any,
  arrowImg: { width: 24, height: 24 },
  timeVal: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, width: 70, textAlign: 'center', outlineStyle: 'none' } as any,
  timeSep: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, marginHorizontal: 4 },

  label: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7, marginBottom: 8, letterSpacing: 1 },

  daysRow: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#0e1830',
  },
  dayBtnOn: { backgroundColor: colors.purple, borderColor: colors.purple, borderBottomColor: '#7030a0' },
  dayText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  dayTextOn: { color: '#fff' },

  optRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  optBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#0e1830',
  },
  optBtnOn: { backgroundColor: colors.orange, borderColor: colors.orange, borderBottomColor: '#cc7700' },
  optText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  optTextOn: { color: '#fff' },
  vibBtnOn: { backgroundColor: colors.purple, borderColor: colors.purple, borderBottomColor: '#7030a0' },
  vibTextOn: { color: '#fff' },

  noRec: { fontFamily: pixelFont, color: colors.textMuted, fontSize: 7, textAlign: 'center', padding: 12 },
  recScroll: { marginBottom: 16, maxHeight: 44 },
  recChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#0e1830',
    marginRight: 8,
  },
  recChipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan, borderBottomColor: '#0099bb' },
  recChipText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  recChipTextOn: { color: '#111' },
  shuffleChip: { borderColor: colors.gold },
  shuffleChipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  shuffleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shuffleImg: { width: 14, height: 14 },

  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#0e1830',
  },
  cancelText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 8 },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#1a9050',
    ...shadow,
  },
  saveText: { fontFamily: pixelFont, color: '#111', fontSize: 8 },
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
  clearAllText: { fontFamily: pixelFont, fontSize: 7, color: colors.coral },
});
