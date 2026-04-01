import { Platform } from 'react-native';

export const colors = {
  bg: '#16213e',
  card: '#1f2940',
  cardBorder: '#2a3a5c',
  surface: '#0f3460',

  pink: '#e056a0',
  cyan: '#00d2ff',
  gold: '#ffd700',
  coral: '#ff4757',
  green: '#2ed573',
  neonGreen: '#39ff14',
  orange: '#ffa502',
  purple: '#a855f7',
  warmOrange: '#ff8c00',

  text: 'rgba(240,240,240,0.92)',
  textBright: '#ffffff',
  textDim: '#8892a8',
  textMuted: '#4a5568',
};

export const pixelFont = 'PressStart2P_400Regular';

export const shadow = Platform.select({
  web: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
}) as any;

export const shadowSmall = Platform.select({
  web: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
}) as any;

export const glowPink = Platform.select({
  web: {
    boxShadow: '0 0 12px rgba(224,86,160,0.4), 0 4px 8px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#e056a0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
}) as any;

export const glowCyan = Platform.select({
  web: {
    boxShadow: '0 0 12px rgba(0,210,255,0.4), 0 4px 8px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
}) as any;

export const glowGold = Platform.select({
  web: {
    boxShadow: '0 0 10px rgba(255,215,0,0.3), 0 2px 6px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
}) as any;

export const glowCoral = Platform.select({
  web: {
    boxShadow: '0 0 10px rgba(255,71,87,0.35), 0 2px 6px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
}) as any;

export const VIBRATION_PATTERNS = [
  { label: 'Default', value: 'default', pattern: [0, 500, 250, 500] },
  { label: 'Pulse', value: 'pulse', pattern: [0, 300, 150, 300, 150, 300] },
  { label: 'Urgent', value: 'urgent', pattern: [0, 200, 100, 200, 100, 200, 100, 200] },
  { label: 'Gentle', value: 'gentle', pattern: [0, 800, 400, 800] },
  { label: 'Off', value: 'off', pattern: [] },
];
