jest.mock("expo-font", () => ({
  useFonts: () => [true, null]
}));

jest.mock("expo-router", () => ({
  Link: "Link",
  Redirect: "Redirect",
  Stack: {
    Screen: "Screen"
  },
  Slot: "Slot",
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn()
  },
  useLocalSearchParams: () => ({}),
  usePathname: () => "/"
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true }))
}));
