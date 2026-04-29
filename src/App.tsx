import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/login-page";
import HomePage from "@/pages/home-page";
import MatchesPage from "@/pages/matches-page";
import CreateMatchPage from "@/pages/create-match-page";
import MatchDetailPage from "@/pages/match-detail-page";
import FinancePage from "@/pages/finance-page";
import DrawTeamsPage from "@/pages/draw-teams-page";
import JoinPage from "@/pages/join-page";
import NotificationsPage from "@/pages/notifications-page";
import ProfilePage from "@/pages/profile-page";
import MyPaymentsPage from "@/pages/my-payments-page";
import TermsPage from "@/pages/terms-page";
import MatchResultsPage from "@/pages/match-results-page";
import { OnboardingModal } from "@/components/application/onboarding-modal/onboarding-modal";
import { useNativePlugins, useDeepLinks } from "@/hooks/use-native-plugins";

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function UnauthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
}

function OnboardingGuard() {
  const { needsOnboarding } = useAuth();
  return needsOnboarding ? <OnboardingModal /> : null;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <UnauthenticatedRoute>
              <LoginPage />
            </UnauthenticatedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <AuthenticatedRoute>
              <HomePage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <AuthenticatedRoute>
              <MatchesPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/create-match"
          element={
            <AuthenticatedRoute>
              <CreateMatchPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/match-detail/:peladaId"
          element={
            <AuthenticatedRoute>
              <MatchDetailPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <AuthenticatedRoute>
              <FinancePage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute>
              <ProfilePage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/draw-teams/:peladaId"
          element={
            <AuthenticatedRoute>
              <DrawTeamsPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/join/:inviteCode"
          element={
            <AuthenticatedRoute>
              <JoinPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <AuthenticatedRoute>
              <NotificationsPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/my-payments"
          element={
            <AuthenticatedRoute>
              <MyPaymentsPage />
            </AuthenticatedRoute>
          }
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/match-results/:peladaId"
          element={
            <AuthenticatedRoute>
              <MatchResultsPage />
            </AuthenticatedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <OnboardingGuard />
    </>
  );
}

function App() {
  useNativePlugins();
  useDeepLinks();

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;