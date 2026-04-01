import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Alarm } from '../types';
import { getAlarms, getRecordings } from './storage';

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastFiredMinute = -1;
let onAlarmFired: ((recordingId: string, snoozeMinutes: number) => void) | null = null;

export function setAlarmCallback(cb: (recordingId: string, snoozeMinutes: number) => void) {
  onAlarmFired = cb;
}

export function startWebAlarmChecker() {
  if (Platform.OS !== 'web') return;
  if (intervalId) return;

  intervalId = setInterval(async () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const currentMinute = h * 60 + m;

    if (currentMinute === lastFiredMinute) return;

    const alarms = await getAlarms();
    const dayOfWeek = now.getDay(); // 0=Sun

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      if (alarm.hour !== h || alarm.minute !== m) continue;

      // Check if day matches (empty = one-time, always fire)
      if (alarm.days.length > 0 && !alarm.days.includes(dayOfWeek)) continue;

      lastFiredMinute = currentMinute;

      if (onAlarmFired) {
        onAlarmFired(alarm.recordingId, alarm.snoozeMinutes);
      }
      break;
    }
  }, 1000);
}

export function stopWebAlarmChecker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function triggerWebSnooze(recordingId: string, snoozeMinutes: number) {
  setTimeout(() => {
    if (onAlarmFired) {
      onAlarmFired(recordingId, snoozeMinutes);
    }
  }, snoozeMinutes * 60 * 1000);
}
