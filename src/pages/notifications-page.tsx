import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell01, Trophy01, Wallet01, User01, CheckCircle, XCircle, AnnotationDots } from "@untitledui/icons";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";
import { cx } from "@/utils/cx";

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Trophy01; color: string }> = {
  player_joined: { icon: CheckCircle, color: "text-success-primary bg-success-secondary" },
  player_declined: { icon: XCircle, color: "text-error-primary bg-error-secondary" },
  player_left: { icon: XCircle, color: "text-warning-primary bg-warning-secondary" },
  player_removed: { icon: User01, color: "text-error-primary bg-error-secondary" },
  payment_confirmed: { icon: Wallet01, color: "text-success-primary bg-success-secondary" },
  payment_reverted: { icon: Wallet01, color: "text-warning-primary bg-warning-secondary" },
  new_note: { icon: AnnotationDots, color: "text-brand-secondary bg-brand-secondary" },
  reminder_24h: { icon: Trophy01, color: "text-brand-secondary bg-brand-secondary" },
  reminder_today: { icon: Trophy01, color: "text-brand-secondary bg-brand-secondary" },
  pelada_cancelled: { icon: XCircle, color: "text-error-primary bg-error-secondary" },
  general: { icon: Bell01, color: "text-fg-secondary bg-secondary" },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setIsLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setIsLoading(false);
  }

  async function handleMarkAsRead(id: string) {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  async function handleMarkAllAsRead() {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function handleClickNotification(notification: Notification) {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.pelada_id) {
      navigate(`/match-detail/${notification.pelada_id}`);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout
      topAppBarProps={{
        leading: (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
        ),
      }}
    >
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary">
            Notificações
          </h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="font-display text-xs font-semibold text-brand-secondary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-2 border-brand-solid border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Bell01 className="size-8 text-fg-quaternary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-primary">
              Nenhuma notificação
            </h3>
            <p className="mt-1 text-sm text-tertiary">
              Quando houver novidades sobre suas peladas, você verá aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-28">
            {notifications.map((notification) => {
              const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.general;
              const Icon = config.icon;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClickNotification(notification)}
                  className={cx(
                    "flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary_hover",
                    !notification.is_read && "bg-brand-primary/5",
                  )}
                >
                  <div
                    className={cx(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      config.color.split(" ")[1],
                    )}
                  >
                    <Icon className={cx("size-5", config.color.split(" ")[0])} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cx(
                          "font-display text-sm font-semibold text-primary",
                          notification.is_read && "text-secondary",
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="shrink-0 font-display text-[10px] text-quaternary">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p
                      className={cx(
                        "mt-0.5 text-sm",
                        notification.is_read ? "text-tertiary" : "text-secondary",
                      )}
                    >
                      {notification.body}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="mt-2 size-2 shrink-0 rounded-full bg-brand-solid" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

export default NotificationPage;