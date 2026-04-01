import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowCriticalAlerts: true },
  });
  if (status !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarm', {
      name: 'Alarm',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function scheduleAlarm(alarm: Alarm): Promise<string> {
  const now = new Date();

  // If repeating days are set, use weekly trigger
  if (alarm.days.length > 0) {
    // Schedule for the nearest matching day
    const ids: string[] = [];
    for (const day of alarm.days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ME:AM',
          body: 'Time to wake up!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            alarmId: alarm.id,
            recordingId: alarm.recordingId,
            snoozeMinutes: alarm.snoozeMinutes,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day === 0 ? 1 : day + 1, // expo: 1=Sun, JS: 0=Sun
          hour: alarm.hour,
          minute: alarm.minute,
          channelId: Platform.OS === 'android' ? 'alarm' : undefined,
        },
      });
      ids.push(id);
    }
    return ids.join(',');
  }

  // One-time alarm
  const trigger = new Date();
  trigger.setHours(alarm.hour, alarm.minute, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ME:AM',
      body: 'Time to wake up!',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        alarmId: alarm.id,
        recordingId: alarm.recordingId,
        snoozeMinutes: alarm.snoozeMinutes,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
      channelId: Platform.OS === 'android' ? 'alarm' : undefined,
    },
  });
}

export async function scheduleSnooze(
  alarmId: string,
  recordingId: string,
  snoozeMinutes: number
): Promise<string> {
  const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ME:AM (Snooze)',

      body: `Snoozed for ${snoozeMinutes} minutes`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { alarmId, recordingId, snoozeMinutes },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeTime,
      channelId: Platform.OS === 'android' ? 'alarm' : undefined,
    },
  });
}

export async function cancelAlarm(notificationId: string) {
  const ids = notificationId.split(',');
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id.trim());
  }
}
