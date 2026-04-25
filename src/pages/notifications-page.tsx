import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell01 } from "@untitledui/icons";
import { AppLayout } from "@/components/application/app-layout/app-layout";

function NotificationsPage() {
  const navigate = useNavigate();

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
      <main className="mx-auto w-full max-w-3xl px-4 pt-20">
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
      </main>
    </AppLayout>
  );
}

export default NotificationsPage;