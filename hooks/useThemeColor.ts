/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// Helper hooks for specific colors
export function usePrimaryColor() {
  return useThemeColor({}, 'primary');
}

export function useSuccessColor() {
  return useThemeColor({}, 'success');
}

export function useWarningColor() {
  return useThemeColor({}, 'warning');
}

export function useErrorColor() {
  return useThemeColor({}, 'error');
}

export function useAccentColor() {
  return useThemeColor({}, 'accent');
}
