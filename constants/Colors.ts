/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0095ff';
const tintColorDark = '#38bdf8';

// Common color values for both themes
const commonColors = {
  primary: '#0095ff',
  accent: '#00d2ff',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
};

export const Colors = {
  light: {
    text: '#1a1a1a',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    // Custom colors
    ...commonColors,
    card: '#ffffff',
    border: '#edf2f7',
    highlight: '#f0f9ff',
  },
  dark: {
    text: '#f8fafc',
    background: '#111827',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    // Custom colors
    ...commonColors,
    card: '#1e293b',
    border: '#334155',
    highlight: '#1e3a8a',
  },
};
