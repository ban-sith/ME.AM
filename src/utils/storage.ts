import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, Alarm, TimeCapsule } from '../types';

const RECORDINGS_KEY = 'recordings';
const ALARMS_KEY = 'alarms';
const CAPSULES_KEY = 'capsules';

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

export async function getCapsules(): Promise<TimeCapsule[]> {
  const data = await AsyncStorage.getItem(CAPSULES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveCapsules(capsules: TimeCapsule[]) {
  await AsyncStorage.setItem(CAPSULES_KEY, JSON.stringify(capsules));
}

export async function getFavoriteRecordings(): Promise<Recording[]> {
  const recs = await getRecordings();
  return recs.filter((r) => r.favorite);
}

export async function getRandomFavorite(): Promise<Recording | null> {
  const favs = await getFavoriteRecordings();
  if (favs.length === 0) return null;
  return favs[Math.floor(Math.random() * favs.length)];
}
