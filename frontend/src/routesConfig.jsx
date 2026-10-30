import { lazy } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const AddOrEditFilePage = lazy(() => import("./pages/AddOrEditFilePage"));

const VideosPage = lazy(() => import("./pages/VideosPage"));
const ConstructorPage = lazy(() => import("./pages/ConstructorPage"));
const ZamirPage = lazy(() => import("./pages/ZamirPage"));
const MeasurementTestPage = lazy(() => import("./pages/MeasurementTestPage"));
const VideoFormPage = lazy(() => import("./pages/VideoFormPage"));
const FAQ = lazy(() => import("./pages/FAQ"));

const PortalOriginal = lazy(() => import("./pages/OrdersPage"));

const AdditionalOrdersPage = lazy(() => import("./pages/AdditionalOrdersPage"));
const FilePreviewErrorPage = lazy(() => import("./pages/FilePreviewErrorPage"));

const ContactFormPage = lazy(() => import("./pages/ContactFormPage"));
const UrgentCallLogsPage = lazy(() => import("./pages/UrgentCallLogsPage"));
const EmergencyContactsPage = lazy(() => import("./pages/EmergencyContactsPage"));

// import AddClaimForm from "./pages/AddClaimForm";
// import AddReorderForm from "./pages/AddReorderForm";
const HomePage = lazy(() => import("./pages/HomePage"));

const AdminAdditionalOrders = lazy(() => import("./pages/AdminAdditionalOrders"));

const ReclamationPortal = lazy(() => import("./pages/ReclamationPortal"));

const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const UsersListPage = lazy(() => import("./pages/UsersListPage"));
const PaymentStatusV2 = lazy(() => import("./pages/PaymentStatusV2"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));

const CustomerBillsPage = lazy(() => import("./pages/CustomerBillsPage"));
const AdminPortalOriginal = lazy(() => import("./pages/AdminOrderPage"));
const AdminReclamationPortal = lazy(() => import("./pages/AdminReclamationPortal"));
const WDSCodesTable = lazy(() => import("./pages/WDSCodesTable"));
const InvalidLinkPage = lazy(() => import("./pages/InvalidLinkPage"));
const ProductionStatisticsPage = lazy(() => import("./pages/ProductionStatisticsPage"));
const OrdersReportDashboardPage = lazy(() => import("./pages/OrdersReportDashboardPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotificationPage = lazy(() => import("./pages/NotificationPage"));
const ManagerQrDropdown = lazy(() => import("./pages/ManagerQrDropdown"));
const BonusPage = lazy(() => import("./pages/BonusPage"));
const DealerReconciliationPage = lazy(() => import("./pages/DealerReconciliationPage"));
const DealerReportsPage = lazy(() => import("./pages/DealerReportsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));

export const adminRoutes = [
  { path: "/statistics/reconciliation", element: <DealerReconciliationPage /> },
  { path: "zamir", element: <ZamirPage /> },
  { path: "integration-test/measurement", element: <MeasurementTestPage /> },
  { path: "constructor", element: <ConstructorPage /> },
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  // { path: "users", element: <AdminUsersPage /> },
  { path: "files/add", element: <AddOrEditFilePage /> },
  { path: "files/edit/:id", element: <AddOrEditFilePage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "videos/add", element: <VideoFormPage /> },
  { path: "videos/edit/:id", element: <VideoFormPage /> },
  { path: "faq", element: <FAQ /> },

  // { path: "orders", element: <PortalOriginal /> },
  // { path: "complaints", element: <ReclamationPortal /> },

  // { path: "additional-orders", element: <AdditionalOrdersPage /> },

  { path: "change-password", element: <ChangePasswordPage /> },
  // { path: "users/:id/edit", element: <EditUserPage /> },

  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },

  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "users-list", element: <UsersListPage /> },

  { path: "finance/cash-flow", element: <PaymentStatusV2 /> },
  // { path: "payment", element: <PaymentsPage /> },

  { path: "finance/customer-bills", element: <CustomerBillsPage /> },
  { path: "admin-additional-order", element: <AdminAdditionalOrders /> },
  { path: "admin-order", element: <AdminPortalOriginal /> },
  { path: "admin-reclamation", element: <AdminReclamationPortal /> },
  { path: "promo-wds-codes", element: <WDSCodesTable /> },
  { path: "bonus", element: <BonusPage /> },

  { path: "file-preview/:errorType", element: <FilePreviewErrorPage /> },
  { path: "/statistics", element: <ProductionStatisticsPage /> },
  { path: "/statistics/reports", element: <DealerReportsPage /> },
  { path: "orders-report", element: <OrdersReportDashboardPage /> },
  { path: "dashboardpage", element: <DashboardPage /> },
  { path: "notifications", element: <NotificationPage /> },
  { path: "manager-qr", element: <ManagerQrDropdown /> },
  { path: "announcements", element: <AnnouncementsPage /> },
  //  { path: "/ai", element: <AiChatPage /> },
];

const managerBlockedRoutePaths = new Set([
  "/statistics/reconciliation",
  "integration-test/measurement",
  "files/add",
  "files/edit/:id",
  "videos/add",
  "videos/edit/:id",
  "users-list",
  "manager-qr",
  "urgentLogs",
  "announcements",
]);

export const managerRoutes = adminRoutes.filter(
  ({ path }) => !managerBlockedRoutePaths.has(path),
);

const branchLeaderBlockedRoutePaths = new Set([
  "/statistics/reconciliation",
  "integration-test/measurement",
  "files/add",
  "files/edit/:id",
  "videos/add",
  "videos/edit/:id",
  "announcements",
]);

export const branchLeaderRoutes = adminRoutes.filter(
  ({ path }) => !branchLeaderBlockedRoutePaths.has(path),
);

export const dealerRoutes = [
  { path: "zamir", element: <ZamirPage /> },
  { path: "constructor", element: <ConstructorPage /> },
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "faq", element: <FAQ /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "orders", element: <PortalOriginal /> },

  { path: "complaints", element: <ReclamationPortal /> },
  { path: "additional-orders", element: <AdditionalOrdersPage /> },


  // { path: "create-bill", element: <CreateCustomerBillPage /> },

  { path: "change-password", element: <ChangePasswordPage /> },
  { path: "finance/cash-flow", element: <PaymentStatusV2 /> },
  { path: "payment", element: <PaymentsPage /> },

  { path: "finance/customer-bills", element: <CustomerBillsPage /> },
  { path: "promo-wds-codes", element: <WDSCodesTable /> },
  { path: "bonus", element: <BonusPage /> },
  // { path: "edit-addresses", element: <DealerAddressesPage /> },
  { path: "file-preview/invalid", element: <InvalidLinkPage /> },
  { path: "file-preview/:errorType", element: <FilePreviewErrorPage /> },
  { path: "dashboardpage", element: <DashboardPage /> },
  { path: "/statistics", element: <ProductionStatisticsPage /> },
  { path: "/statistics/reports", element: <DealerReportsPage /> },
  { path: "/notifications", element: <NotificationPage /> },
  // { path: "/ai", element: <AiChatPage /> },
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
