export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: number;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  recordingId: string;
  enabled: boolean;
  notificationId?: string;
  days: number[]; // 0=Sun, 1=Mon...6=Sat. Empty = one-time
  snoozeMinutes: number; // 0 = no snooze, 5/10/15
  vibration: string; // 'default' | 'pulse' | 'urgent' | 'gentle' | 'off'
}
