import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RoleContext } from "./context/RoleContext";

import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import DealerLayout from "./components/layout/DealerLayout";
// В App.js
import './styles/mobile-responsive.css';
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import InviteRegisterForm from "./pages/InviteRegisterForm";

import PortalLoader from "./components/ui/PortalLoader";
import { adminRoutes, dealerRoutes, managerRoutes } from "./routesConfig";

const routeTitles = {
  "/login": "Вхід — Портал замовлень",
  "home": "Портал замовлень",
  "/dashboard": "Головна",
  "/users": "Користувачі",
  "/files": "Файли",
  "/files/add": "Додати файли",
  "/files/edit/:id": "Редагування файлів",
  "/videos": "Відео",
  "/addUser": "Додати користувача",
  "/organizations": "Організації",
  "/regions": "Регіони",
  "/contacts": "Контакти SOS",
  "/orders": "Замовлення",
  "/admin-order": "Замовлення",
  "/complaints": "Рекламації",
  "/admin-reclamation": "Рекламації",
  "/additional-orders": "Список дозамовлень",
  "/admin-additional-order": "Список дозамовлень",
  "/orders-fin": "Фінанси",
  "/change-password": "Зміна паролю",
  "/users/:id/edit": "Редагування користувача",
  "/finance/settlements": "Взаєморозрахунки",
  "/finance/paymentMovement": "Рух коштів",
  "/contacts/new": "Додання контактів SOS",
  // "/contacts/new": "Вхід — Портал замовлень",
  "/urgentLogs": "Звернення SOS",
  "/contacts/:id/edit": "Редагування контактів SOS",
  "/emergency-contacts": "SOS",

  "/promo-wds-codes": "Акція WDS",
  "/finance/payment": "Оплата",
  "/finance/customer-bills": "Рахунки",




};

function AppRoutes() {
  const { role } = useContext(RoleContext);
  const location = useLocation();

  const publicPaths = ["/", "/home", "/login"];
  const isInvite = location.pathname.startsWith("/invite/");
  const isPublicRoute =
    publicPaths.includes(location.pathname) || isInvite;


  useEffect(() => {
    const title = routeTitles[location.pathname] || "Портал замовлень";
    document.title = title;
  }, [location]);

  // Визначаємо Layout і маршрути за роллю
  let LayoutComponent = PublicLayout;
  let routes = [];

  if (role === "admin") {
    LayoutComponent = AdminLayout;
    routes = adminRoutes;
  } else if (role === "dealer") {
    LayoutComponent = DealerLayout;
  } else if (role === "customer") {
    LayoutComponent = DealerLayout;
    routes = dealerRoutes;
  } else if (role === "manager") {
    LayoutComponent = AdminLayout;
    routes = managerRoutes;
  } else if (role === "director") {
    LayoutComponent = AdminLayout;
    routes = managerRoutes;
  }else if (role === "regionalManager") {
    LayoutComponent = AdminLayout;
    routes = managerRoutes;
  }

  // if (role === null && !isPublicRoute) {
  //   return <PortalLoader />;
  // }


  return (
    <Routes>
      {/* Публічні */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="invite/:code/" element={<InviteRegisterForm />} />
        {/* <Route path="api/admin" element={<InviteRegisterForm />} /> */}

      </Route>

      {/* Якщо роль не завантажена і маршрут не публічний — завантаження */}
      {/* {role === null && location.pathname !== "/" && location.pathname !== "/login" && (
        <Route path="*" element={<div>Завантаження...</div>} />
      )} */}

      {/* Якщо неавторизований і маршрут не публічний — редірект на логін */}
      {!role && location.pathname !== "/" && location.pathname !== "/login" && !location.pathname.startsWith("/api/admin") && (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}


      {/* Авторизовані маршрути */}
      {role && (
        <Route path="/" element={<LayoutComponent />}>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          {/* Фолбек для невідомих маршрутів */}
          <Route path="*" element={<Navigate to= "/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}


export default AppRoutes;
