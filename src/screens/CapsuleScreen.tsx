import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Recording, TimeCapsule } from '../types';
import { getRecordings, getCapsules, saveCapsules } from '../utils/storage';
import { colors, pixelFont, shadow, shadowSmall, glowPink } from '../theme';
import SwipeableCard from '../components/SwipeableCard';

const capsuleImg = require('../../assets/ui/capsule.png');
const arrowUp = require('../../assets/ui/arrow_up.png');
const arrowDown = require('../../assets/ui/arrow_down.png');

const DELIVER_OPTIONS = [
  { label: '1 Day', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
];

export default function CapsuleScreen() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selRec, setSelRec] = useState<string | null>(null);
  const [selDays, setSelDays] = useState(7);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [c, r] = await Promise.all([getCapsules(), getRecordings()]);
    setCapsules(c);
    setRecordings(r);
    if (r.length > 0 && !selRec) setSelRec(r[0].id);
  }

  async function createCapsule() {
    if (!selRec) { Alert.alert('Error', 'Record a voice first!'); return; }
    const now = Date.now();
    const deliverAt = now + selDays * 24 * 60 * 60 * 1000;
    const rec = recordings.find((r) => r.id === selRec);

    const capsule: TimeCapsule = {
      id: now.toString(),
      recordingId: selRec,
      message: rec?.name || 'Time Capsule',
      createdAt: now,
      deliverAt,
      delivered: false,
      hour,
      minute,
    };

    const updated = [capsule, ...capsules];
    setCapsules(updated);
    await saveCapsules(updated);
    setShowModal(false);
  }

  async function deleteCapsule(cap: TimeCapsule) {
    const updated = capsules.filter((c) => c.id !== cap.id);
    setCapsules(updated);
    await saveCapsules(updated);
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  function daysUntil(ts: number) {
    const days = Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000));
    if (days <= 0) return 'Today!';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const getRecName = (id: string) => recordings.find((r) => r.id === id)?.name || '?';

  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        <Image source={capsuleImg} style={s.titleImg} />
        <Text style={s.title}>CAPSULES</Text>
      </View>

      <TouchableOpacity style={s.addBtn} onPress={() => { loadData(); setShowModal(true); }} activeOpacity={0.8}>
        <Text style={s.addText}>NEW CAPSULE</Text>
      </TouchableOpacity>

      <FlatList
        data={capsules}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Image source={capsuleImg} style={s.emptyImg} />
            <Text style={s.empty}>No time capsules yet{'\n'}Record a message to{'\n'}your future self!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableCard onDelete={() => deleteCapsule(item)}>
            <View style={[s.card, item.deliverAt <= Date.now() && s.cardReady]}>
              <View style={s.cardLeft}>
                <Text style={s.cardTime}>{pad(item.hour)}:{pad(item.minute)}</Text>
                <Text style={s.cardRec}>{getRecName(item.recordingId)}</Text>
                <Text style={s.cardDate}>Opens: {formatDate(item.deliverAt)}</Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.cardCountdown, item.deliverAt <= Date.now() && s.cardCountdownReady]}>
                  {daysUntil(item.deliverAt)}
                </Text>
              </View>
            </View>
          </SwipeableCard>
        )}
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>NEW CAPSULE</Text>

            {/* When to deliver */}
            <Text style={s.label}>OPEN IN</Text>
            <View style={s.optRow}>
              {DELIVER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  style={[s.optBtn, selDays === opt.days && s.optBtnOn]}
                  onPress={() => setSelDays(opt.days)}
                >
                  <Text style={[s.optText, selDays === opt.days && s.optTextOn]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time */}
            <Text style={s.label}>ALARM TIME</Text>
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
                  <TouchableOpacity style={[s.recChip, selRec === item.id && s.recChipOn]} onPress={() => setSelRec(item.id)}>
                    <Text style={[s.recChipText, selRec === item.id && s.recChipTextOn]} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, !selRec && { opacity: 0.4 }]} onPress={createCapsule} disabled={!selRec}>
                <Text style={s.saveText}>SEAL</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  titleImg: { width: 32, height: 32 },
  title: { fontFamily: pixelFont, fontSize: 14, color: colors.purple, letterSpacing: 2 },

  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomWidth: 5,
    borderBottomColor: '#7030a0',
    ...glowPink,
  },
  addText: { fontFamily: pixelFont, fontSize: 9, color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },

  emptyBox: { alignItems: 'center', marginTop: 30, gap: 12 },
  emptyImg: { width: 48, height: 48, opacity: 0.5 },
  empty: { fontFamily: pixelFont, color: colors.textMuted, textAlign: 'center', fontSize: 8, lineHeight: 18 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.purple,
    borderBottomWidth: 4,
    borderBottomColor: '#5a2080',
    ...shadowSmall,
  },
  cardReady: { borderColor: colors.gold, borderBottomColor: '#cc9900' },
  cardLeft: { flex: 1 },
  cardTime: { fontFamily: pixelFont, color: colors.gold, fontSize: 16 },
  cardRec: { fontFamily: pixelFont, color: colors.pink, fontSize: 7, marginTop: 3 },
  cardDate: { fontFamily: pixelFont, color: colors.textDim, fontSize: 6, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardCountdown: { fontFamily: pixelFont, color: colors.purple, fontSize: 8 },
  cardCountdownReady: { color: colors.gold },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 3,
    borderTopColor: colors.purple,
    ...shadow,
  },
  modalTitle: { fontFamily: pixelFont, fontSize: 12, color: colors.purple, textAlign: 'center', marginBottom: 16 },

  label: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7, marginBottom: 8, letterSpacing: 1 },

  optRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  optBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderBottomWidth: 3,
    borderBottomColor: '#0e1830',
  },
  optBtnOn: { backgroundColor: colors.purple, borderColor: colors.purple, borderBottomColor: '#7030a0' },
  optText: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7 },
  optTextOn: { color: '#fff' },

  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  timeCol: { alignItems: 'center' },
  arrowBtn: { padding: 6, outlineStyle: 'none' } as any,
  arrowImg: { width: 24, height: 24 },
  timeVal: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, width: 70, textAlign: 'center', outlineStyle: 'none' } as any,
  timeSep: { fontFamily: pixelFont, color: colors.gold, fontSize: 28, marginHorizontal: 4 },

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
    backgroundColor: colors.purple,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#7030a0',
    ...shadow,
  },
  saveText: { fontFamily: pixelFont, color: '#fff', fontSize: 8 },
});
