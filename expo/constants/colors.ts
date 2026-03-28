const tintColorLight = '#007AFF';
const tintColorDark = '#fff';

export const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  teal: '#5AC8FA',
  indigo: '#5856D6',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  blue: '#007AFF',
  red: '#FF3B30',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
