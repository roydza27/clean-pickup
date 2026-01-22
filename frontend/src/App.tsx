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

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
          {/* Common Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/error" element={<ErrorPage />} />

          {/* Citizen Routes */}
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/locality" element={<LocalitySelection />} />
          <Route path="/citizen/rates" element={<ScrapRatesView />} />
          <Route path="/citizen/create-pickup" element={<CreatePickup />} />
          <Route path="/citizen/pickup-confirmation" element={<PickupConfirmation />} />
          <Route path="/citizen/pickups" element={<MyPickupsList />} />
          <Route path="/citizen/pickups/:id" element={<PickupDetails />} />
          <Route path="/citizen/payments" element={<PaymentStatus />} />
          <Route path="/citizen/garbage-timing" element={<GarbageTiming />} />
          <Route path="/citizen/notifications" element={<NotificationsCenter />} />
          <Route path="/citizen/account" element={<AccountPage />} />
          <Route path="/citizen/map" element={<MapPage />} />

          {/* Kabadiwala Routes */}
          <Route path="/kabadiwala" element={<KabadiwalaDashboard />} />
          <Route path="/kabadiwala/pickups" element={<TodayPickupsList />} />
          <Route path="/kabadiwala/pickups/:id" element={<KabadiPickupDetails />} />
          <Route path="/kabadiwala/pickups/:id/complete" element={<PickupCompletion />} />
          <Route path="/kabadiwala/route" element={<RouteOptimization />} />
          <Route path="/kabadiwala/notifications" element={<NotificationsCenterKAB />} />
          <Route path="/kabadiwala/earnings" element={<EarningsSummary />} />
          <Route path="/kabadiwala/trust-score" element={<TrustScore />} />
          <Route path="/kabadiwala/account" element={<KabadiAccountPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/rates" element={<ScrapRateManagement />} />
          <Route path="/admin/localities" element={<LocalityManagement />} />
          <Route path="/admin/pickups" element={<PickupAssignmentBoard />} />
          <Route path="/admin/kabadiwalas" element={<KabadiWalaManagement />} />
          <Route path="/admin/schedule" element={<GarbageScheduleUpload />} />
          <Route path="/admin/complaints" element={<ComplaintsManagement />} />
          <Route path="/admin/reports" element={<ReportsMetrics />} />
          <Route path="/admin/notifications" element={<NotificationsCenterAdmin />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
