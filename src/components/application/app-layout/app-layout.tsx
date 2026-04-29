import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TopAppBar,
  type TopAppBarProps,
} from "@/components/application/top-app-bar/top-app-bar";
import {
  BottomNavBar,
  type NavItem,
} from "@/components/application/bottom-nav-bar/bottom-nav-bar";
import { Avatar } from "@/components/base/avatar/avatar";
import { useAuth } from "@/providers/auth-provider";
import {
  Trophy01,
  Wallet01,
  User01,
  Home01,
  PlusCircle,
  Bell01,
} from "@untitledui/icons";
import { cx } from "@/utils/cx";
import logoFecha10 from "@/assets/logo-fecha10.png";
import { usePushNotification } from "@/hooks/use-push-notification";
import { getUnreadNotificationCount } from "@/lib/notifications";

export interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  topAppBarProps?: Partial<TopAppBarProps>;
}

export const defaultNavItems: NavItem[] = [
  { label: "Home", icon: Home01, href: "/home" },
  { label: "Jogos", icon: Trophy01, href: "/matches" },
  { label: "Criar", icon: PlusCircle, href: "/create-match" },
  { label: "Finanças", icon: Wallet01, href: "/finance" },
  { label: "Perfil", icon: User01, href: "/profile" },
];

function NotificationBell({ deviceId }: { deviceId: string }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount(deviceId).then(setUnreadCount);
  }, [deviceId]);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="relative rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
    >
      <Bell01 className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-error-solid" />
      )}
    </button>
  );
}

export function AppLayout({
  children,
  hideNav = false,
  topAppBarProps,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAuthenticated, deviceId } = useAuth();
  const { requestPermission, registerToken } = usePushNotification();

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const granted = await requestPermission();
      if (granted) {
        await registerToken();
      }
    })();
  }, [isAuthenticated, requestPermission, registerToken]);

  const navItems: NavItem[] = defaultNavItems.map((item) => ({
    ...item,
    isActive: location.pathname.startsWith(item.href),
  }));

  const firstName = profile?.name?.split(" ")[0] ?? "Jogador";

  const defaultTrailing = (
    <div className="flex items-center gap-2">
      <NotificationBell deviceId={deviceId} />
      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="size-8 overflow-hidden rounded-full bg-quaternary transition-transform active:scale-95"
      >
        {profile?.avatar_url ? (
          <Avatar
            src={profile.avatar_url}
            alt={profile.name ?? ""}
            size="sm"
            rounded
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-brand-solid font-display text-xs font-bold text-primary_on-brand">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-secondary text-primary">
      <TopAppBar
        leading={topAppBarProps?.leading}
        title={
          topAppBarProps?.title ?? (
            <img
              src={logoFecha10}
              alt="Fecha10"
              className="h-14 w-auto object-contain"
            />
          )
        }
        trailing={topAppBarProps?.trailing ?? defaultTrailing}
        className={topAppBarProps?.className}
      />

      <main className={cx("flex-1", hideNav && "pb-0")}>{children}</main>

      {!hideNav && <BottomNavBar items={navItems} />}
    </div>
  );
}
