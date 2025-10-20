// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
// import NetworkManager from "./components/NetworkManager"; // REMOVED - Uncomment if needed
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
import ConsultationPage from "./components/consultation/ConsultationPage";
import ConsultationCalendar from './components/consultation/ConsultationCalendar';
import ConsultationStatistics from './components/consultation/ConsultationStatistics';

// Other pages
import AddStaffReceiptForm from "./components/receipts/AddStaffReceiptForm";
import ReceiptsTable from "./components/receipts/ReceiptsTable";
import TransactionHistory from "./components/TransactionHistory";
import Profile from "./components/Profile";
import AuditLogs from "./components/AuditLogs";
import AllAuditLogs from "./components/AllAuditLogs";
// import WalletDebug from './components/walletdebug'; // REMOVED - Debug component
import BlockchainHistory from "./components/BlockchainHistory";
import ScheduleCalendar from "./components/ScheduleCalendar";

// ----------------------
// Role-based Home Router
// ----------------------
const RoleBasedHome = () => {
  const { userRole, isAdmin, isStaff, isPatient, isLoading, userAddress } = useRole();

  // REMOVED DEBUG LOGS - Uncomment if you need to debug role issues:
  // console.log("🔍 RoleBasedHome Debug:", {
  //   userRole,
  //   isAdmin,
  //   isStaff,
  //   isPatient,
  //   isLoading,
  //   userAddress,
  //   timestamp: new Date().toISOString(),
  // });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // REMOVED DEBUG LOGS - Uncomment if needed:
  // if (isAdmin) console.log("✅ Rendering AdminHome");
  // if (isStaff) console.log("✅ Rendering StaffHome");
  // if (isPatient) console.log("✅ Rendering PatientHome");

  if (isAdmin) return <AdminHome />;
  if (isStaff) return <StaffHome />;
  return <PatientHome />;
};

// ----------------------
// Layout Component
// ----------------------
const AppLayout = () => {
  const location = useLocation();
  const address = useAddress();
  
  const isHomePage = location.pathname === '/';
  const showNavigation = !isHomePage || address;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {showNavigation && <Sidebar />}
      <div className={`flex-1 flex flex-col min-w-0 ${showNavigation ? 'ml-[240px]' : ''}`}>
        {showNavigation && <Navbar />}
        {/* REMOVED: <NetworkManager /> - Uncomment if you need network status monitoring */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Routes>
            {/* ========================================
                HOME & CONSULTATION (Public Access)
            ======================================== */}
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="/consultation" element={<ConsultationPage />} />

            {/* ========================================
                ADMIN DASHBOARD
            ======================================== */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN" requireWallet={true}>
                  <AdminDashboard />
                  {/* REMOVED: <WalletDebug /> - Debug component for wallet testing */}
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MEDICINE MANAGEMENT
            ======================================== */}
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

            {/* ========================================
                STOCK MANAGEMENT
            ======================================== */}
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

            {/* ========================================
                RELEASES & REMOVALS
            ======================================== */}
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
              path="/removals"
              element={
                <ProtectedRoute requireWallet={true}>
                  <RemovalsDashboard />
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

            {/* ========================================
                RESIDENT MANAGEMENT
            ======================================== */}
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

            {/* ========================================
                PROVIDER MANAGEMENT
            ======================================== */}
            <Route
              path="/provider-management"
              element={
                <ProtectedRoute requiredRoles={["ADMIN", "STAFF"]} requireWallet={true}>
                  <ProviderManagement />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                CONSULTATION MANAGEMENT
            ======================================== */}
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

            {/* ========================================
                CALENDAR
            ======================================== */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ScheduleCalendar />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                RECEIPTS & TRANSACTIONS
            ======================================== */}
            <Route
              path="/receipts"
              element={
                <ProtectedRoute requireWallet={true}>
                  <ReceiptsTable />
                </ProtectedRoute>
              }
            />
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

            {/* ========================================
                BLOCKCHAIN & AUDIT
            ======================================== */}
            <Route
              path="/blockchain"
              element={
                <ProtectedRoute requireWallet={true}>
                  <BlockchainHistory />
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
            <Route
              path="/audit-logs/all"
              element={
                <ProtectedRoute requireWallet={true}>
                  <AllAuditLogs />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                USER PROFILE
            ======================================== */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireWallet={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />
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