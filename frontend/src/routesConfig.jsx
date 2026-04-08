import Dashboard from "./pages/Dashboard";
import FilesPage from "./pages/FilesPage";
import AddOrEditFilePage from "./pages/AddOrEditFilePage";

import VideosPage from "./pages/VideosPage";
import VideoFormPage from "./pages/VideoFormPage";

import PortalOriginal from "./pages/OrdersPage";

import AdditionalOrdersPage from "./pages/AdditionalOrdersPage";
import FilePreviewErrorPage from "./pages/FilePreviewErrorPage";

import ChangePassword from "./pages/ChangePassword";
import EditUserPage from "./pages/EditUserPage";

import DealerAddressesPage from "./pages/DealerAddressesPage";
import ContactFormPage from "./pages/ContactFormPage";
import UrgentCallLogsPage from "./pages/UrgentCallLogsPage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";

// import AddClaimForm from "./pages/AddClaimForm";
// import AddReorderForm from "./pages/AddReorderForm";
import HomePage from "./pages/HomePage";

import AdminAdditionalOrders from "./pages/AdminAdditionalOrders";

import CreateCustomerBillPage from "./pages/CreateCustomerBillPage";
import ReclamationPortal from "./pages/ReclamationPortal";

import ChangePasswordPage from "./pages/ChangePasswordPage";
import UsersListPage from "./pages/UsersListPage";
import PaymentStatusV2 from "./pages/PaymentStatusV2";
import PaymentsPage from "./pages/PaymentsPage";

import CustomerBillsPage from "./pages/CustomerBillsPage";
import AdminPortalOriginal from "./pages/AdminOrderPage";
import AdminReclamationPortal from "./pages/AdminReclamationPortal";
import WDSCodesTable from "./pages/WDSCodesTable";
import InvalidLinkPage from "./pages/InvalidLinkPage";
import ProductionStatisticsPage from "./pages/ProductionStatisticsPage";
import DashboardPage from "./pages/DashboardPage";
import NotificationPage from "./pages/NotificationPage";
import ManagerQrDropdown from "./pages/ManagerQrDropdown";

export const adminRoutes = [
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  // { path: "users", element: <AdminUsersPage /> },
  { path: "files/add", element: <AddOrEditFilePage /> },
  { path: "files/edit/:id", element: <AddOrEditFilePage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "videos/add", element: <VideoFormPage /> },
  { path: "videos/edit/:id", element: <VideoFormPage /> },

  { path: "orders", element: <PortalOriginal /> },
  { path: "complaints", element: <ReclamationPortal /> },

  { path: "additional-orders", element: <AdditionalOrdersPage /> },

  { path: "change-password", element: <ChangePasswordPage /> },
  { path: "users/:id/edit", element: <EditUserPage /> },

  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },

  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "users-list", element: <UsersListPage /> },

  { path: "finance/cash-flow", element: <PaymentStatusV2 /> },
  { path: "payment", element: <PaymentsPage /> },

  { path: "finance/customer-bills", element: <CustomerBillsPage /> },
  { path: "admin-additional-order", element: <AdminAdditionalOrders /> },
  { path: "admin-order", element: <AdminPortalOriginal /> },
  { path: "admin-reclamation", element: <AdminReclamationPortal /> },
  { path: "promo-wds-codes", element: <WDSCodesTable /> },

  { path: "file-preview/:errorType", element: <FilePreviewErrorPage /> },
  { path: "/finance/statistics", element: <ProductionStatisticsPage /> },
  { path: "dashboardpage", element: <DashboardPage /> },
  { path: "notifications", element: <NotificationPage /> },
  { path: "manager-qr", element: <ManagerQrDropdown /> },
];

export const dealerRoutes = [
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "orders", element: <PortalOriginal /> },

  { path: "complaints", element: <ReclamationPortal /> },
  { path: "additional-orders", element: <AdditionalOrdersPage /> },

  { path: "create-bill", element: <CreateCustomerBillPage /> },

  { path: "change-password", element: <ChangePasswordPage /> },
  { path: "finance/cash-flow", element: <PaymentStatusV2 /> },
  { path: "payment", element: <PaymentsPage /> },

  { path: "finance/customer-bills", element: <CustomerBillsPage /> },
  { path: "promo-wds-codes", element: <WDSCodesTable /> },
  { path: "edit-addresses", element: <DealerAddressesPage /> },
  { path: "file-preview/invalid", element: <InvalidLinkPage /> },
  { path: "file-preview/:errorType", element: <FilePreviewErrorPage /> },
  { path: "dashboardpage", element: <DashboardPage /> },
  { path: "/finance/statistics", element: <ProductionStatisticsPage /> },
  { path: "/notifications", element: <NotificationPage /> },
];

// export const managerRoutes = [
//   { path: "home", element: <HomePage /> },
//   { path: "dashboard", element: <Dashboard /> },
//   { path: "files", element: <FilesPage /> },
//   { path: "users", element: <AdminUsersPage /> },
//   { path: "files/add", element: <AddOrEditFilePage /> },
//   { path: "files/edit/:id", element: <AddOrEditFilePage /> },
//   { path: "videos", element: <VideosPage /> },
//   { path: "videos/add", element: <VideoFormPage /> },
//   { path: "videos/edit/:id", element: <VideoFormPage /> },
//   // { path: "addUser", element: <RegistrationPage /> },
//   { path: "organizations", element: <OrganizationPage /> },
//   { path: "regions", element: <RegionPage /> },

//   { path: "orders", element: <PortalOriginal /> },
//   // { path: "complaints", element: <ComplaintsPage /> },
//   { path: "additional-orders", element: <AdditionalOrdersPage /> },

//   { path: "change-password", element: <ChangePassword /> },
//   { path: "users/:id/edit", element: <EditUserPage /> },
//   // { path: "finance/settlements", element: <SettlementsPage /> },

//   { path: "contacts/new", element: <ContactFormPage /> },
//   { path: "urgentLogs", element: <UrgentCallLogsPage /> },
//   { path: "contacts/:id/edit", element: <ContactFormPage /> },
//   { path: "emergency-contacts", element: <EmergencyContactsPage /> },
//   // { path: "finance/settlements", element: <PaymentStatus /> },

//   { path: "promo-wds-codes", element: <WDSCodesTable/> },
//   { path: "addClaim", element: <AddClaimForm /> },

//   // { path: "/invite/:code", element: <InviteRegisterForm  /> },
//   // { path: "create-bill", element: <CreateCustomerBillPage /> },
// ];
