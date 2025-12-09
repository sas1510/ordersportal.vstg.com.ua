// routesConfig.js
import Dashboard from "./pages/Dashboard";
import FilesPage from "./pages/FilesPage";
import AddOrEditFilePage from "./pages/AddOrEditFilePage";
import AdminUsersPage from './pages/Users';
import VideosPage from "./pages/VideosPage";
import VideoFormPage from './pages/VideoFormPage';
import RegistrationPage from "./pages/RegisterUser";
import OrganizationPage from "./pages/OrganizationsPage";
import RegionPage from "./pages/RegionsPage";
import ContactsPage from "./pages/ContactsPage";
import PortalOriginal from "./pages/OrdersPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import AdditionalOrdersPage from "./pages/AdditionalOrdersPage";
import OrdersFinancePage from "./pages/OrdersFinancePage";
import ChangePassword from "./pages/ChangePassword";
import EditUserPage from "./pages/EditUserPage";
import SettlementsPage from "./pages/SettlementsPage";
import CashFlowPage from "./pages/CashFlowPage";
import ContactFormPage from "./pages/ContactFormPage";
import UrgentCallLogsPage from "./pages/UrgentCallLogsPage";
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import AddOrderPage from "./pages/AddOrders";
import AddClaimForm from "./pages/AddClaimForm";
import AddReorderForm from "./pages/AddReorderForm";
import HomePage from "./pages/HomePage";
// import ManagersUpdatePage from "./pages/ManagersUpdatePage"
import ManagersUpdatePage from "./pages/ManagersUpdatePage";
import ManagersSync from "./pages/ManagersSync";
import SyncManagersPage from "./pages/SyncManagersPage"
import PaymentStatus from "./pages/DebtPage"
import WdsPromotion from "./pages/WdsPromotion"
import CustomerBills from "./pages/CustomerBills"
import CreateCustomerBillPage from "./pages/CreateCustomerBillPage"
import ReclamationPortal from "./pages/ReclamationPortal";
// import InviteRegisterForm from "./pages/InviteRegisterForm";
import { Dashboards } from "./pages/Dashboards"
import ComplaintsPages from "./pages/ComplaintsPages";
import ChangePasswordPage from "./pages/ChangePasswordPage" 
import UsersListPage from "./pages/UsersListPage"
import PaymentStatusV2 from "./pages/PaymentStatusV2"

export const adminRoutes = [
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  { path: "users", element: <AdminUsersPage /> },
  { path: "files/add", element: <AddOrEditFilePage /> },
  { path: "files/edit/:id", element: <AddOrEditFilePage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "videos/add", element: <VideoFormPage /> },
  { path: "videos/edit/:id", element: <VideoFormPage /> },
  { path: "addUser", element: <RegistrationPage /> },
  { path: "organizations", element: <OrganizationPage /> },
  { path: "regions", element: <RegionPage /> },
  { path: "contacts", element: <ContactsPage /> },
  { path: "orders", element: <PortalOriginal /> },
  { path: "complaints", element: <ReclamationPortal /> },
  // { path: "complaints", element: <ComplaintsPage /> },
  { path: "additional-orders", element: <AdditionalOrdersPage /> },
  { path: "orders-fin", element: <OrdersFinancePage /> },
  { path: "change-password", element: <ChangePassword /> },
  { path: "users/:id/edit", element: <EditUserPage /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },
  { path: "finance/money-flow", element: <CashFlowPage /> },
  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "managers-update", element: <ManagersUpdatePage /> },
  { path: "managers-sync", element: <ManagersSync /> },
  { path: "managers-dealer-sync", element: <SyncManagersPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },
  { path: "promo", element: <WdsPromotion /> },
  { path: "finance/bills", element: <CustomerBills /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "users-list", element: <UsersListPage /> },

  // { path: "/invite/:code", element: <InviteRegisterForm  /> },
  // { path: "create-bill", element: <CreateCustomerBillPage /> },

  
];

export const dealerRoutes = [
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "orders", element: <PortalOriginal /> },
  // { path: "complaints", element: <ComplaintsPage /> },
  { path: "complaints", element: <ReclamationPortal /> },
  { path: "additional-orders", element: <AdditionalOrdersPage /> },
  { path: "orders-fin", element: <OrdersFinancePage /> },
  // { path: "change-password", element: <ChangePassword /> },
  { path: "addOrder", element: <AddOrderPage /> },
  { path: "addClaim", element: <AddClaimForm /> },
  { path: "addReorder", element: <AddReorderForm /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },
  { path: "promo", element: <WdsPromotion /> },
  { path: "finance/bills", element: <CustomerBills /> },
  { path: "create-bill", element: <CreateCustomerBillPage /> },
  { path: "reclamation", element: <ReclamationPortal /> },


  { path: "localComplaints", element: <ComplaintsPages/> },
  { path: "change-password", element: <ChangePasswordPage/> },
  { path: "finance/paymentV2", element: <PaymentStatusV2/> },
  // { path: "/invite/:code", element: <InviteRegisterForm  /> },
];

export const managerRoutes = [
  { path: "home", element: <HomePage /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "files", element: <FilesPage /> },
  { path: "users", element: <AdminUsersPage /> },
  { path: "files/add", element: <AddOrEditFilePage /> },
  { path: "files/edit/:id", element: <AddOrEditFilePage /> },
  { path: "videos", element: <VideosPage /> },
  { path: "videos/add", element: <VideoFormPage /> },
  { path: "videos/edit/:id", element: <VideoFormPage /> },
  { path: "addUser", element: <RegistrationPage /> },
  { path: "organizations", element: <OrganizationPage /> },
  { path: "regions", element: <RegionPage /> },
  { path: "contacts", element: <ContactsPage /> },
  { path: "orders", element: <PortalOriginal /> },
  { path: "complaints", element: <ComplaintsPage /> },
  { path: "additional-orders", element: <AdditionalOrdersPage /> },
  { path: "orders-fin", element: <OrdersFinancePage /> },
  { path: "change-password", element: <ChangePassword /> },
  { path: "users/:id/edit", element: <EditUserPage /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },
  { path: "finance/money-flow", element: <CashFlowPage /> },
  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },
  { path: "promo", element: <WdsPromotion /> },
  { path: "finance/bills", element: <CustomerBills /> },

  { path: "addClaim", element: <AddClaimForm /> },
    { path: "addOrder", element: <AddOrderPage /> },
  // { path: "/invite/:code", element: <InviteRegisterForm  /> },
  // { path: "create-bill", element: <CreateCustomerBillPage /> },
];
