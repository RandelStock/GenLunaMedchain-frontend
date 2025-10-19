// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NetworkManager from "./components/NetworkManager";
import { RoleProvider, useRole } from "./components/auth/RoleProvider";

// Dashboard / role-based
import AdminHome from "./components/dashboard/AdminHome";
import StaffHome from "./components/dashboard/StaffHome";
import PatientHome from "./components/dashboard/PatientHome";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import RemovalsDashboard from "./components/dashboard/RemovalDashboard";

// Medicine
import MedicineList from "./components/medicine/MedicineList";
import AddMedicineForm from "./components/medicine/AddMedicineForm";
import AddReleaseForm from "./components/medicine/AddReleaseForm";
import ReleaseList from "./components/medicine/ReleaseList";
import AddStockRemovalForm from "./components/medicine/AddStockRemovalForm";
import AddStockForm from "./components/medicine/AddStockForm";
import StockRemovalHistory from "./components/medicine/StockRemovalHistory";
import StockTransactionHistory from "./components/medicine/StockTransactionHistory";

// Residents
import AddResidentForm from "./components/residents/AddResidentForm";
import ResidentList from "./components/residents/ResidentList";
import ResidentDashboard from "./components/residents/ResidentDashboard";

// Consultation
import ProviderManagement from "./components/consultation/ProviderManagement";

// Other pages
import AddStaffReceiptForm from "./components/receipts/AddStaffReceiptForm";
import ReceiptsTable from "./components/receipts/ReceiptsTable";
import ConsultationPage from "./components/consultation/ConsultationPage";
import TransactionHistory from "./components/TransactionHistory";
import Profile from "./components/Profile";
import AuditLogs from "./components/AuditLogs";
import AllAuditLogs from "./components/AllAuditLogs";
import WalletDebug from './components/walletdebug';
import BlockchainHistory from "./components/BlockchainHistory";
import ScheduleCalendar from "./components/ScheduleCalendar";
import ConsultationCalendar from './components/consultation/ConsultationCalendar';
import ConsultationStatistics from './components/consultation/ConsultationStatistics';

// ----------------------
// Role-based Home Router
// ----------------------
const RoleBasedHome = () => {
  const { userRole, isWalletConnected } = useRole();

  console.log("🔍 RoleBasedHome Debug:", {
    userRole,
    isWalletConnected,
    timestamp: new Date().toISOString(),
  });

  // ✅ FIXED: Handle both uppercase and capitalized role names
  const normalizedRole = userRole?.toUpperCase();

  switch (normalizedRole) {
    case "ADMIN":
      return <AdminHome />;
    case "STAFF":
      return <StaffHome />;
    case "PATIENT":
    default:
      return <PatientHome />;
  }
};

// ----------------------
// Layout Component
// ----------------------
const AppLayout = () => {
  const location = useLocation();
  const { isWalletConnected } = useRole();
  
  // Hide sidebar and navbar ONLY on home page when wallet is NOT connected
  const isHomePage = location.pathname === '/';
  const showNavigation = !isHomePage || isWalletConnected;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      {showNavigation && <Sidebar />}
      <div className={`flex-1 flex flex-col min-w-0 ${showNavigation ? 'ml-[220px]' : ''}`}>
        {showNavigation && <Navbar />}
        {/* <NetworkManager /> */}
        <main className="flex-1 overflow-auto">
          <Routes>
            {/* Role-based landing */}
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route
              path="/audit-logs/all"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AllAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Admin only - ✅ Updated to handle both ADMIN and Admin */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN" requireWallet={true}>
                  <AdminDashboard />
                  {/* <WalletDebug /> */}
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Medicines
            ------------------------- */}
            <Route
              path="/medicines"
              element={
                <ProtectedRoute requireWallet={true}>
                  <MedicineList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicines/new"
              element={
                <ProtectedRoute requiredRoles={["ADMIN", "STAFF"]} requireWallet={true}>
                  <AddMedicineForm />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Releases / Removals
            ------------------------- */}
            <Route
              path="/releases"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ReleaseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/releases/new"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AddReleaseForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/removals/new"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AddStockRemovalForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/removals/history"
              element={
                <ProtectedRoute requireWallet={true}>
                  <StockRemovalHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/removals"
              element={
                <ProtectedRoute requireWallet={true}>
                  <RemovalsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AddStockForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-transactions"
              element={
                <ProtectedRoute requireWallet={true}>
                  <StockTransactionHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/blockchain"
              element={
                <ProtectedRoute requireWallet={true}>
                  <BlockchainHistory />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Residents
            ------------------------- */}
            <Route
              path="/residents"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ResidentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/new"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AddResidentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/dashboard"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ResidentDashboard />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Provider Management
            ------------------------- */}
            <Route
              path="/provider-management"
              element={
                <ProtectedRoute requiredRoles={["ADMIN", "STAFF"]} requireWallet={true}>
                  <ProviderManagement />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Receipts / Transactions
            ------------------------- */}
            <Route
              path="/addReceipts"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AddStaffReceiptForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transaction-history"
              element={
                <ProtectedRoute requireWallet={true}>
                  <TransactionHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ReceiptsTable />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Profile & Audit
            ------------------------- */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireWallet={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Calendar
            ------------------------- */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ScheduleCalendar />
                </ProtectedRoute>
              }
            />

            {/* -------------------------
                Consultation
            ------------------------- */}
            <Route
              path="/consultations/calendar"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ConsultationCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations/statistics"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ConsultationStatistics />
                </ProtectedRoute>
              }
            />

            {/* fallback public (if needed) */}
            {/* <Route path="/medicine" element={<MedicineList />} /> */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ----------------------
// App Component
// ----------------------
function App() {
  return (
    <RoleProvider>
      <Router>
        <AppLayout />
      </Router>
    </RoleProvider>
  );
}

export default App;