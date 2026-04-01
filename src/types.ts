export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: number;
  favorite?: boolean;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  recordingId: string; // 'shuffle' = random favorite
  enabled: boolean;
  notificationId?: string;
  days: number[]; // 0=Sun, 1=Mon...6=Sat. Empty = one-time
  snoozeMinutes: number; // 0 = no snooze, 5/10/15
  vibration: string; // 'default' | 'pulse' | 'urgent' | 'gentle' | 'off'
}

export interface TimeCapsule {
  id: string;
  recordingId: string;
  message: string; // short note about what this capsule is about
  createdAt: number;
  deliverAt: number; // timestamp when it should fire as alarm
  delivered: boolean;
  hour: number;
  minute: number;
}
