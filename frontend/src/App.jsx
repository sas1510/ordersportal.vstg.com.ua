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
import FilePreviewErrorPage from './pages/FilePreviewErrorPage'

import PortalLoader from "./components/ui/PortalLoader";
import { adminRoutes, dealerRoutes, managerRoutes } from "./routesConfig";
import { useCacheBuster } from './hooks/useCacheBuster';

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
  "/finance/statistics": "Аналітика",
  "/finance/cash-flow": "Рух коштів",
  "/edit-addresses": "Редагування адрес",




};

// function AppRoutes() {
//   const { role, isLoading } = useContext(RoleContext);
//   const location = useLocation();

//   // 1. Поки вантажиться роль - СТОЇМО НА МІСЦІ (показуємо лоадер)
//   if (isLoading) {
//     return <PortalLoader />;
//   }

//   const publicPaths = ["/", "/home", "/login"];
//   const isInvite = location.pathname.startsWith("/invite/");
//   const isPublicRoute = publicPaths.includes(location.pathname) || isInvite;

//   useEffect(() => {
//     const title = routeTitles[location.pathname] || "Портал замовлень";
//     document.title = title;
//   }, [location]);

//   // Визначаємо Layout і маршрути за роллю
//   let LayoutComponent = PublicLayout;
//   let routes = [];

//   if (role === "admin") {
//     LayoutComponent = AdminLayout;
//     routes = adminRoutes;
//   } else if (role === "dealer") {
//     LayoutComponent = DealerLayout;
//   } else if (role === "customer") {
//     LayoutComponent = DealerLayout;
//     routes = dealerRoutes;
//   } else if (role === "manager") {
//     LayoutComponent = AdminLayout;
//     routes = managerRoutes;
//   } else if (role === "director") {
//     LayoutComponent = AdminLayout;
//     routes = managerRoutes;
//   }else if (role === "regionalManager") {
//     LayoutComponent = AdminLayout;
//     routes = managerRoutes;
//   }



//   return (
//     <Routes>
//       {/* Публічні маршрути */}
//       <Route path="/" element={<PublicLayout />}>
//         <Route index element={<HomePage />} />
//         <Route path="home" element={<HomePage />} />
//         <Route path="login" element={<LoginPage />} />
//         <Route path="invite/:code/" element={<InviteRegisterForm />} />
//       </Route>

//       {/* Авторизовані маршрути */}
//       {role ? (
//         <Route path="/" element={<LayoutComponent />}>
//           {routes.map(({ path, element }) => (
//             <Route key={path} path={path} element={element} />
//           ))}
//           {/* Якщо зайшли на неіснуючу сторінку всередині адмінки */}
//           <Route path="*" element={<Navigate to="/dashboard" replace />} />
//         </Route>
//       ) : (
//         /* ЯКЩО РОЛІ НЕМАЄ:
//           Якщо ми НЕ на публічному роуті - кидаємо на логін, 
//           але ЗАПАМ'ЯТОВУЄМО, де був юзер (state: { from: location })
//         */
//         !isPublicRoute && <Route path="*" element={<Navigate to="/login" state={{ from: location }} replace />} />
//       )}
//     </Routes>
//   );
// }

// export default AppRoutes;

function AppRoutes() {


  useCacheBuster();
  const { role, isLoading } = useContext(RoleContext);
  const location = useLocation();

  const publicPaths = ["/", "/home", "/login"];
  const isInvite = location.pathname.startsWith("/invite/");
  const isPublicRoute = publicPaths.includes(location.pathname) || isInvite;

  useEffect(() => {
    const title = routeTitles[location.pathname] || "Портал замовлень";
    document.title = title;
  }, [location]);

  // --- ЛОГІКА ВІДОБРАЖЕННЯ ---

  // 1. Якщо ми на публічній сторінці — показуємо її ВІДРАЗУ
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="invite/:code/" element={<InviteRegisterForm />} />
        </Route>
        {/* Якщо юзер авторизований і випадково зайшов на логін — можна буде додати редирект пізніше */}
        <Route path="*" element={<Navigate to={location.pathname} replace />} />
      </Routes>
    );
  }

  // 2. Якщо сторінка НЕ публічна і йде завантаження ролі — показуємо лоадер
  if (isLoading) {
    return <PortalLoader />;
  }

  // 3. Визначаємо Layout і маршрути за роллю (для авторизованих)
  let LayoutComponent = PublicLayout;
  let routes = [];

  if (role === "admin") {
    LayoutComponent = AdminLayout;
    routes = adminRoutes;
  } else if (role === "dealer" || role === "customer") {
    LayoutComponent = DealerLayout;
    routes = dealerRoutes;
  } else if (["manager", "director", "regionalManager"].includes(role)) {
    LayoutComponent = AdminLayout;
    routes = managerRoutes;
  }

  return (
    <Routes>
      {role ? (
        <Route path="/" element={<LayoutComponent />}>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        // Якщо ролі немає і це не публічний шлях (перевірка вище)
        <Route path="*" element={<Navigate to="/login" state={{ from: location }} replace />} />
      )}
    </Routes>
  );
}


export default AppRoutes;