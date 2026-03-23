import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationsCenterKAB from '@/pages/kabadiwala/NotificationsCenter';
import NotificationsCenterAdmin from '@/pages/admin/NotificationsCenter';

// Common Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AuthPage from "./pages/AuthPage";
import ErrorPage from "./pages/ErrorPage";
import NotFound from "./pages/NotFound";

// Citizen Pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import LocalitySelection from "./pages/citizen/LocalitySelection";
import ScrapRatesView from "./pages/citizen/ScrapRatesView";
import CreatePickup from "./pages/citizen/CreatePickup";
import PickupConfirmation from "./pages/citizen/PickupConfirmation";
import MyPickupsList from "./pages/citizen/MyPickupsList";
import PickupDetails from "./pages/citizen/PickupDetails";
import PaymentStatus from "./pages/citizen/PaymentStatus";
import GarbageTiming from "./pages/citizen/GarbageTiming";
import NotificationsCenter from "./pages/citizen/NotificationsCenter";
import AccountPage from "./pages/citizen/AccountPage";
import MapPage from "./pages/citizen/MapPage";

// Kabadiwala Pages
import KabadiwalaDashboard from "./pages/kabadiwala/KabadiwalaDashboard";
import TodayPickupsList from "./pages/kabadiwala/TodayPickupsList";
import KabadiPickupDetails from "./pages/kabadiwala/KabadiPickupDetails";
import RouteOptimization from "./pages/kabadiwala/RouteOptimization";
import PickupCompletion from "./pages/kabadiwala/PickupCompletion";
import EarningsSummary from "./pages/kabadiwala/EarningsSummary";
import TrustScore from "./pages/kabadiwala/TrustScore";
import KabadiAccountPage from "./pages/kabadiwala/AccountPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ScrapRateManagement from "./pages/admin/ScrapRateManagement";
import LocalityManagement from "./pages/admin/LocalityManagement";
import PickupAssignmentBoard from "./pages/admin/PickupAssignmentBoard";
import KabadiWalaManagement from "./pages/admin/KabadiWalaManagement";
import GarbageScheduleUpload from "./pages/admin/GarbageScheduleUpload";
import ComplaintsManagement from "./pages/admin/ComplaintsManagement";
import ReportsMetrics from "./pages/admin/ReportsMetrics";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/error" element={<ErrorPage />} />

          {/* ================= CITIZEN ROUTES ================= */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <Routes>
                  <Route index element={<CitizenDashboard />} />
                  <Route path="locality" element={<LocalitySelection />} />
                  <Route path="rates" element={<ScrapRatesView />} />
                  <Route path="create-pickup" element={<CreatePickup />} />
                  <Route path="pickup-confirmation" element={<PickupConfirmation />} />
                  <Route path="pickups" element={<MyPickupsList />} />
                  <Route path="pickups/:id" element={<PickupDetails />} />
                  <Route path="payments" element={<PaymentStatus />} />
                  <Route path="garbage-timing" element={<GarbageTiming />} />
                  <Route path="notifications" element={<NotificationsCenter />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="map" element={<MapPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* ================= KABADIWALA ROUTES ================= */}
          <Route
            path="/kabadiwala/*"
            element={
              <ProtectedRoute allowedRoles={["kabadiwala"]}>
                <Routes>
                  <Route index element={<KabadiwalaDashboard />} />
                  <Route path="pickups" element={<TodayPickupsList />} />
                  <Route path="pickups/:id" element={<KabadiPickupDetails />} />
                  <Route path="pickups/:id/complete" element={<PickupCompletion />} />
                  <Route path="route" element={<RouteOptimization />} />
                  <Route path="notifications" element={<NotificationsCenterKAB />} />
                  <Route path="earnings" element={<EarningsSummary />} />
                  <Route path="trust-score" element={<TrustScore />} />
                  <Route path="account" element={<KabadiAccountPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="rates" element={<ScrapRateManagement />} />
                  <Route path="localities" element={<LocalityManagement />} />
                  <Route path="pickups" element={<PickupAssignmentBoard />} />
                  <Route path="kabadiwalas" element={<KabadiWalaManagement />} />
                  <Route path="schedule" element={<GarbageScheduleUpload />} />
                  <Route path="complaints" element={<ComplaintsManagement />} />
                  <Route path="reports" element={<ReportsMetrics />} />
                  <Route path="notifications" element={<NotificationsCenterAdmin />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* ================= 404 ================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
