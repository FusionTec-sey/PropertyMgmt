const tintColorLight = "#007AFF";
const tintColorDark = "#0A84FF";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#666",
    textTertiary: "#999",
    background: "#FFFFFF",
    backgroundSecondary: "#F8F9FA",
    tint: tintColorLight,
    tabIconDefault: "#999",
    tabIconSelected: tintColorLight,
    border: "#E0E0E0",
    card: "#FFFFFF",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    info: "#007AFF",
    purple: "#AF52DE",
    orange: "#FF9500",
    blue: "#007AFF",
    green: "#34C759",
    red: "#FF3B30",
    gray: "#8E8E93",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#EBEBF5",
    textTertiary: "#8E8E93",
    background: "#000000",
    backgroundSecondary: "#1C1C1E",
    tint: tintColorDark,
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorDark,
    border: "#38383A",
    card: "#1C1C1E",
    error: "#FF453A",
    success: "#32D74B",
    warning: "#FF9F0A",
    info: "#0A84FF",
    purple: "#BF5AF2",
    orange: "#FF9F0A",
    blue: "#0A84FF",
    green: "#32D74B",
    red: "#FF453A",
    gray: "#8E8E93",
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
