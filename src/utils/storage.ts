import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, Alarm } from '../types';

const RECORDINGS_KEY = 'recordings';
const ALARMS_KEY = 'alarms';

export async function getRecordings(): Promise<Recording[]> {
  const data = await AsyncStorage.getItem(RECORDINGS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveRecordings(recordings: Recording[]) {
  await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
}

export async function getAlarms(): Promise<Alarm[]> {
  const data = await AsyncStorage.getItem(ALARMS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveAlarms(alarms: Alarm[]) {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}
