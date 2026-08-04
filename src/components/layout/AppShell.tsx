import { Slot, usePathname, router, type Href } from "expo-router";
import {
  Bell,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageSearch,
  Shield,
  Sprout
} from "lucide-react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { OfflineState } from "@/components/feedback/States";
import { AppText } from "@/components/primitives/AppText";
import { useAuth } from "@/providers/AuthProvider";
import { useConnectivity } from "@/providers/ConnectivityProvider";
import { colors, layout, spacing, typography } from "@/theme/tokens";
import { FarmSelector } from "@/features/shared/FarmSelector";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const mobileNav: NavItem[] = [
  { label: "Inicio", href: "/(app)/dashboard", icon: <Home size={20} /> },
  { label: "Produccion", href: "/(app)/production", icon: <Sprout size={20} /> },
  { label: "Tareas", href: "/(app)/tasks", icon: <ClipboardList size={20} /> },
  { label: "Reportes", href: "/(app)/reports", icon: <PackageSearch size={20} /> },
  { label: "Mas", href: "/(app)/settings", icon: <MoreHorizontal size={20} /> }
];

const desktopNav: NavItem[] = [
  ...mobileNav,
  { label: "Finanzas", href: "/(app)/finances", icon: <LayoutDashboard size={20} /> },
  { label: "Soporte", href: "/(app)/support", icon: <Bell size={20} /> },
  { label: "Admin", href: "/admin", icon: <Shield size={20} />, adminOnly: true }
];

export function AppShell({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { isOnline } = useConnectivity();
  const nav = isWide ? desktopNav : mobileNav;

  return (
    <View style={styles.root}>
      {isWide ? (
        <View style={styles.sidebar}>
          <View style={styles.brandRow}>
            <Image source={require("../../../assets/brand/agrosmart-logo.png")} style={styles.logo} accessibilityLabel="Logo AgroSmart" />
            <View>
              <AppText style={styles.brand}>AgroSmart</AppText>
              <AppText variant="caption" color={colors.mutedText}>
                Campo y ganado
              </AppText>
            </View>
          </View>
          <FarmSelector />
          <View style={styles.navList}>
            {nav
              .filter((item) => !item.adminOnly || profile?.role === "admin")
              .map((item) => (
                <NavLink key={item.href} item={item} active={pathname.startsWith(item.href.replace("/(app)", ""))} />
              ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void signOut().then(() => router.replace("/(auth)/sign-in"));
            }}
            style={styles.signOut}
          >
            <LogOut color={colors.error} size={18} />
            <AppText color={colors.error}>Cerrar sesion</AppText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.main}>
        {!isOnline ? <OfflineState /> : null}
        {!isWide ? (
          <View style={styles.mobileTop}>
            <View style={styles.mobileBrand}>
              <Menu color={colors.forestDark} size={20} />
              <AppText style={styles.brand}>AgroSmart</AppText>
            </View>
            <FarmSelector />
          </View>
        ) : null}
        {children ?? <Slot />}
      </View>

      {!isWide ? (
        <View style={styles.bottomNav}>
          {mobileNav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href.replace("/(app)", ""))} compact />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NavLink({ item, active, compact = false }: { item: NavItem; active: boolean; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(item.href as Href)}
      style={[compact ? styles.bottomItem : styles.navItem, active ? styles.navActive : null]}
    >
      <View>{item.icon}</View>
      <AppText variant="caption" color={active ? colors.forestDark : colors.mutedText}>
        {item.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.cream
  },
  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: colors.white,
    borderRightColor: colors.line,
    borderRightWidth: 1,
    padding: spacing.md,
    gap: spacing.lg
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 12
  },
  brand: {
    fontFamily: typography.brand,
    fontSize: 23,
    color: colors.forestDark
  },
  navList: {
    gap: spacing.xs,
    flex: 1
  },
  navItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 8,
    paddingHorizontal: spacing.sm
  },
  navActive: {
    backgroundColor: colors.cream
  },
  main: {
    flex: 1,
    paddingBottom: layout.bottomNavHeight
  },
  mobileTop: {
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    padding: spacing.sm,
    gap: spacing.sm
  },
  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: layout.bottomNavHeight,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xs
  },
  bottomItem: {
    minWidth: 58,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 2,
    paddingHorizontal: spacing.xs
  },
  signOut: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  }
});
