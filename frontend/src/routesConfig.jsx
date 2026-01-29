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

import ChangePassword from "./pages/ChangePassword";
import EditUserPage from "./pages/EditUserPage";
import SettlementsPage from "./pages/SettlementsPage";
import DealerAddressesPage from "./pages/DealerAddressesPage"
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
import AdminAdditionalOrders from './pages/AdminAdditionalOrders'


import CreateCustomerBillPage from "./pages/CreateCustomerBillPage"
import ReclamationPortal from "./pages/ReclamationPortal";
// import InviteRegisterForm from "./pages/InviteRegisterForm";
// import { Dashboards } from "./pages/Dashboards"
import ChangePasswordPage from "./pages/ChangePasswordPage" 
import UsersListPage from "./pages/UsersListPage"
import PaymentStatusV2 from "./pages/PaymentStatusV2"
import PaymentsPage from './pages/PaymentsPage'
import CreateBillPage from './pages/CreateBillPage'
import CustomerBillsPage from './pages/CustomerBillsPage'
import AdminPortalOriginal from './pages/AdminOrderPage'
import AdminReclamationPortal from './pages/AdminReclamationPortal'
import WDSCodesTable from './pages/WDSCodesTable'
import InvalidLinkPage from './pages/InvalidLinkPage'


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

  { path: "change-password", element: <ChangePasswordPage /> },
  { path: "users/:id/edit", element: <EditUserPage /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },


  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "managers-update", element: <ManagersUpdatePage /> },
  { path: "managers-sync", element: <ManagersSync /> },
  { path: "managers-dealer-sync", element: <SyncManagersPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },

  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "users-list", element: <UsersListPage /> },

  { path: "finance/cash-flow", element: <PaymentStatusV2/> },
  { path: "finance/payment", element: <PaymentsPage/> },
  { path: "finance/create-bill", element: <CreateBillPage/> },
  { path: "finance/customer-bills", element: <CustomerBillsPage/> },
  { path: "admin-additional-order", element: <AdminAdditionalOrders/> },
  { path: "admin-order", element: <AdminPortalOriginal/> },
  { path: "admin-reclamation", element: <AdminReclamationPortal/> },
  { path: "promo-wds-codes", element: <WDSCodesTable/> },
  { path: "file-preview/invalid", element: <InvalidLinkPage/> },
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

  // { path: "change-password", element: <ChangePassword /> },
  { path: "addOrder", element: <AddOrderPage /> },
  { path: "addClaim", element: <AddClaimForm /> },
  { path: "addReorder", element: <AddReorderForm /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },

  // { path: "finance/bills", element: <CustomerBills /> },
  { path: "create-bill", element: <CreateCustomerBillPage /> },
  { path: "reclamation", element: <ReclamationPortal /> },



  { path: "change-password", element: <ChangePasswordPage/> },
  { path: "finance/cash-flow", element: <PaymentStatusV2/> },
  { path: "finance/payment", element: <PaymentsPage/> },
  { path: "finance/create-bill", element: <CreateBillPage/> },
  { path: "finance/customer-bills", element: <CustomerBillsPage/> },
  { path: "promo-wds-codes", element: <WDSCodesTable/> },
  { path: "edit-addresses", element: <DealerAddressesPage/> },
  { path: "file-preview/invalid", element: <InvalidLinkPage/> },
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

  { path: "change-password", element: <ChangePassword /> },
  { path: "users/:id/edit", element: <EditUserPage /> },
  // { path: "finance/settlements", element: <SettlementsPage /> },

  { path: "contacts/new", element: <ContactFormPage /> },
  { path: "urgentLogs", element: <UrgentCallLogsPage /> },
  { path: "contacts/:id/edit", element: <ContactFormPage /> },
  { path: "emergency-contacts", element: <EmergencyContactsPage /> },
  { path: "finance/settlements", element: <PaymentStatus /> },


  { path: "promo-wds-codes", element: <WDSCodesTable/> },
  { path: "addClaim", element: <AddClaimForm /> },
  { path: "addOrder", element: <AddOrderPage /> },
  // { path: "/invite/:code", element: <InviteRegisterForm  /> },
  // { path: "create-bill", element: <CreateCustomerBillPage /> },
];
