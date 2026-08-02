import { Platform } from "react-native";

export const colors = {
  forestDark: "#2E3C21",
  forest: "#485A34",
  olive: "#7A8F5A",
  sage: "#A8BC8A",
  beige: "#DCCFAE",
  cream: "#F6F2E8",
  white: "#FFFFFF",
  text: "#20251C",
  mutedText: "#5F6658",
  border: "#D9D2BF",
  line: "#E8E1D0",
  success: "#496D3A",
  warning: "#A66A1F",
  warningBg: "#FFF4DE",
  error: "#A33B32",
  errorBg: "#F9E7E4",
  info: "#365E74",
  infoBg: "#E9F2F4",
  disabled: "#B9B6AB",
  overlay: "rgba(32, 37, 28, 0.38)"
} as const;

export const typography = {
  brand: "PlayfairDisplay_700Bold",
  title: "PlayfairDisplay_700Bold",
  body: "Montserrat_400Regular",
  bodyMedium: "Montserrat_500Medium",
  bodyBold: "Montserrat_700Bold"
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
  display: 34
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999
} as const;

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: "0px 10px 26px rgba(46, 60, 33, 0.10)"
    },
    default: {
      shadowColor: colors.forestDark,
      shadowOpacity: 0.13,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3
    }
  }),
  subtle: Platform.select({
    web: {
      boxShadow: "0px 6px 16px rgba(46, 60, 33, 0.08)"
    },
    default: {
      shadowColor: colors.forestDark,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1
    }
  })
} as const;

export const layout = {
  maxContentWidth: 1180,
  sidebarWidth: 254,
  bottomNavHeight: 78,
  touchTarget: 48
} as const;
