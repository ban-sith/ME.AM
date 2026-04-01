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
import { colors, pixelFont } from '../theme';
import PixelToggle from '../components/PixelToggle';
import SwipeableCard from '../components/SwipeableCard';

const addIcon = require('../../assets/ui/add_icon.png');
const clearAllImg = require('../../assets/ui/clear_all.png');
const arrowUp = require('../../assets/ui/arrow_up.png');
const arrowDown = require('../../assets/ui/arrow_down.png');
const snoozeIcon = require('../../assets/ui/snooze_icon.png');

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SNOOZE_OPTIONS = [0, 5, 10, 15];

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [selRec, setSelRec] = useState<string | null>(null);
  const [selDays, setSelDays] = useState<number[]>([]);
  const [snooze, setSnooze] = useState(5);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadData();
    const sub1 = Notifications.addNotificationReceivedListener(onNotif);
    const sub2 = Notifications.addNotificationResponseReceivedListener((r) =>
      onNotif(r.notification)
    );
    return () => { sub1.remove(); sub2.remove(); soundRef.current?.unloadAsync(); };
  }, []);

  function onNotif(notification: Notifications.Notification) {
    const data = notification.request.content.data;
    if (data?.recordingId) playAlarmSound(data.recordingId as string, data.snoozeMinutes as number);
  }

  async function playAlarmSound(recordingId: string, snoozeMin: number) {
    const recs = await getRecordings();
    const rec = recs.find((r) => r.id === recordingId);
    if (!rec) return;

    if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    const { sound } = await Audio.Sound.createAsync({ uri: rec.uri }, { shouldPlay: true, volume: 1.0, isLooping: true });
    soundRef.current = sound;

    setTimeout(async () => { await sound.stopAsync(); await sound.unloadAsync(); }, 60000);

    const buttons: any[] = [
      {
        text: 'Dismiss',
        onPress: async () => { await sound.stopAsync(); await sound.unloadAsync(); soundRef.current = null; },
      },
    ];

    if (snoozeMin > 0) {
      buttons.unshift({
        text: `Snooze (${snoozeMin}m)`,
        onPress: async () => {
          await sound.stopAsync();
          await sound.unloadAsync();
          soundRef.current = null;
          await scheduleSnooze('snooze', recordingId, snoozeMin);
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

  async function addAlarm() {
    if (!selRec) { Alert.alert('Error', 'Record a voice first!'); return; }

    const alarm: Alarm = {
      id: Date.now().toString(),
      hour, minute,
      recordingId: selRec,
      enabled: true,
      days: selDays,
      snoozeMinutes: snooze,
    };

    try {
      await requestPermissions();
      alarm.notificationId = await scheduleAlarm(alarm);
    } catch {
      // Web doesn't support notifications - alarm still saves
    }

    const updated = [alarm, ...alarms];
    setAlarms(updated);
    await saveAlarms(updated);
    setShowModal(false);
    setSelDays([]);
    setSnooze(5);
  }

  async function toggleAlarm(alarm: Alarm) {
    let updated: Alarm[];
    if (alarm.enabled) {
      if (alarm.notificationId) {
        try { await cancelAlarm(alarm.notificationId); } catch {}
      }
      updated = alarms.map((a) => a.id === alarm.id ? { ...a, enabled: false, notificationId: undefined } : a);
    } else {
      let nid: string | undefined;
      try {
        await requestPermissions();
        nid = await scheduleAlarm(alarm);
      } catch {}
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

  function clearAllAlarms() {
    if (alarms.length === 0) return;
    Alert.alert('Delete All', `Delete all ${alarms.length} alarms?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          for (const a of alarms) {
            if (a.notificationId) try { await cancelAlarm(a.notificationId); } catch {}
          }
          setAlarms([]);
          await saveAlarms([]);
        },
      },
    ]);
  }

  function toggleDay(d: number) {
    setSelDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  const getRecName = (id: string) => recordings.find((r) => r.id === id)?.name || '?';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const daysLabel = (days: number[]) => days.length === 0 ? 'Once' : days.length === 7 ? 'Every day' : days.map((d) => DAY_LABELS[d]).join(' ');

  return (
    <View style={s.container}>
      <Text style={s.title}>ALARMS</Text>

      <TouchableOpacity style={s.addBtn} onPress={() => { loadData(); setShowModal(true); }} activeOpacity={0.8}>
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
          <View
            style={[s.card, !item.enabled && s.cardOff]}
          >
            <View style={s.cardLeft}>
              <Text style={[s.cardTime, !item.enabled && s.cardTimeOff]}>{pad(item.hour)}:{pad(item.minute)}</Text>
              <View style={s.cardMeta}>
                <Text style={s.cardRec}>{getRecName(item.recordingId)}</Text>
                <Text style={s.cardDays}>{daysLabel(item.days)}</Text>
                {item.snoozeMinutes > 0 && (
                  <View style={s.snoozeBadge}>
                    <Image source={snoozeIcon} style={s.snoozeBadgeImg} />
                    <Text style={s.snoozeBadgeText}>{item.snoozeMinutes}m</Text>
                  </View>
                )}
              </View>
            </View>
            <PixelToggle value={item.enabled} onToggle={() => toggleAlarm(item)} />
          </View>
          </SwipeableCard>
        )}
      />

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>NEW ALARM</Text>

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
                <TouchableOpacity
                  key={i}
                  style={[s.dayBtn, selDays.includes(i) && s.dayBtnOn]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[s.dayText, selDays.includes(i) && s.dayTextOn]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Snooze */}
            <Text style={s.label}>SNOOZE</Text>
            <View style={s.snoozeRow}>
              {SNOOZE_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.snoozeBtn, snooze === m && s.snoozeBtnOn]}
                  onPress={() => setSnooze(m)}
                >
                  <Text style={[s.snoozeText, snooze === m && s.snoozeTextOn]}>
                    {m === 0 ? 'Off' : `${m}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recording */}
            <Text style={s.label}>VOICE</Text>
            {recordings.length === 0 ? (
              <Text style={s.noRec}>Record a voice first</Text>
            ) : (
              <FlatList
                data={recordings}
                keyExtractor={(i) => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.recScroll}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[s.recChip, selRec === item.id && s.recChipOn]}
                    onPress={() => setSelRec(item.id)}
                  >
                    <Text style={[s.recChipText, selRec === item.id && s.recChipTextOn]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, !selRec && { opacity: 0.4 }]}
                onPress={addAlarm}
                disabled={!selRec}
              >
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
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  title: {
    fontFamily: pixelFont,
    fontSize: 14,
    color: colors.cyan,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
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
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  cardOff: { opacity: 0.45 },
  cardLeft: { flex: 1 },
  cardTime: { fontFamily: pixelFont, color: colors.gold, fontSize: 20 },
  cardTimeOff: { color: colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  cardRec: { fontFamily: pixelFont, color: colors.pink, fontSize: 7 },
  cardDays: { fontFamily: pixelFont, color: colors.textDim, fontSize: 6 },
  snoozeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  snoozeBadgeImg: { width: 12, height: 12 },
  snoozeBadgeText: { fontFamily: pixelFont, color: colors.orange, fontSize: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontFamily: pixelFont, fontSize: 12, color: colors.cyan, textAlign: 'center', marginBottom: 16 },

  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  timeCol: { alignItems: 'center' },
  arrowBtn: { padding: 6, outlineStyle: 'none' } as any,
  arrowImg: { width: 24, height: 24 },
  timeVal: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, width: 70, textAlign: 'center', outlineStyle: 'none' } as any,
  timeSep: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, marginHorizontal: 4 },

  label: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7, marginBottom: 8, letterSpacing: 1 },

  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  dayBtnOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  dayText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  dayTextOn: { color: '#fff' },

  snoozeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  snoozeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  snoozeBtnOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  snoozeText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  snoozeTextOn: { color: '#fff' },

  noRec: { fontFamily: pixelFont, color: colors.textMuted, fontSize: 7, textAlign: 'center', padding: 12 },
  recScroll: { marginBottom: 16, maxHeight: 44 },
  recChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  recChipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  recChipText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  recChipTextOn: { color: '#111' },

  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  cancelText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 8 },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: 'center',
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
    marginTop: 8,
    gap: 8,
  },
  clearAllImg: { width: 18, height: 18 },
  clearAllText: {
    fontFamily: pixelFont,
    fontSize: 7,
    color: colors.coral,
  },
});
