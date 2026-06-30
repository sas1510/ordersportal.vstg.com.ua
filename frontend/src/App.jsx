import React, { useContext, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RoleContext } from "./context/RoleContext";
import { useTranslation } from "react-i18next";

import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import DealerLayout from "./components/layout/DealerLayout";
// В App.js
import '../public/assets/css/mobile-responsive.css';
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import InviteRegisterForm from "./pages/InviteRegisterForm";
import FilePreviewErrorPage from "./pages/FilePreviewErrorPage";
import SupportVideoUploadPage from "./pages/SupportVideoUploadPage";

import PortalLoader from "./components/ui/PortalLoader";
import { adminRoutes, dealerRoutes } from "./routesConfig";
import { useCacheBuster } from "./hooks/useCacheBuster";
import SupportChatWidget from "./components/SupportChatWidget";

const routeTitlePatterns = [
  ["/login", "route_titles.login"],
  ["/", "route_titles.home"],
  ["/home", "route_titles.home"],
  ["/dashboard", "route_titles.dashboard"],
  ["/users", "route_titles.users"],
  ["/files", "route_titles.files"],
  ["/files/add", "route_titles.files_add"],
  ["/files/edit/:id", "route_titles.files_edit"],
  ["/videos", "route_titles.videos"],
  ["/addUser", "route_titles.user_add"],
  ["/organizations", "route_titles.organizations"],
  ["/regions", "route_titles.regions"],
  ["/contacts", "route_titles.contacts"],
  ["/orders", "route_titles.orders"],
  ["/admin-order", "route_titles.orders"],
  ["/complaints", "route_titles.complaints"],
  ["/admin-reclamation", "route_titles.complaints"],
  ["/additional-orders", "route_titles.additional_orders"],
  ["/admin-additional-order", "route_titles.additional_orders"],
  ["/orders-fin", "route_titles.finance"],
  ["/change-password", "route_titles.change_password"],
  ["/users/:id/edit", "route_titles.user_edit"],
  ["/finance/settlements", "route_titles.settlements"],
  ["/finance/paymentMovement", "route_titles.cash_flow"],
  ["/contacts/new", "route_titles.contacts_add"],
  ["/urgentLogs", "route_titles.sos_requests"],
  ["/contacts/:id/edit", "route_titles.contacts_edit"],
  ["/emergency-contacts", "route_titles.emergency_contacts"],
  ["/promo-wds-codes", "route_titles.promo_wds"],
  ["/finance/payment", "route_titles.payment"],
  ["/finance/customer-bills", "route_titles.customer_bills"],
  ["/statistics", "route_titles.analytics"],
  ["/finance/cash-flow", "route_titles.cash_flow"],
  ["/edit-addresses", "route_titles.edit_addresses"],
  ["/support/video-upload", "route_titles.support_video_upload"],
];

const pathToRegExp = (pattern) =>
  new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);

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
  const { t } = useTranslation();

  const routeTitles = useMemo(
    () =>
      routeTitlePatterns.map(([pattern, key]) => ({
        pattern,
        regex: pathToRegExp(pattern),
        title: t(key),
      })),
    [t],
  );

  const publicPaths = ["/", "/home", "/login", "/support/video-upload"];
  const isInvite = location.pathname.startsWith("/invite/");
  const isPublicRoute = publicPaths.includes(location.pathname) || isInvite;

  useEffect(() => {
    const matchedRoute = routeTitles.find(({ regex }) =>
      regex.test(location.pathname),
    );
    const title = matchedRoute?.title || t("route_titles.default");
    document.title = title;
  }, [location.pathname, routeTitles, t]);

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
          <Route path="support/video-upload" element={<SupportVideoUploadPage />} />
        </Route>
        {/* Якщо юзер авторизований і випадково зайшов на логін — можна буде додати редирект пізніше */}
        <Route path="*" element={<Navigate to={location.pathname} replace />} />
      </Routes>
    );
  }


  if (isLoading) {
    return <PortalLoader />;
  }


  let LayoutComponent = PublicLayout;
  let routes = [];

  if (role === "admin") {
    LayoutComponent = AdminLayout;
    routes = adminRoutes;
  } else if (role === "dealer" || role === "customer") {
    LayoutComponent = DealerLayout;
    routes = dealerRoutes;
  }
  // } else if (["manager", "director", "regionalManager"].includes(role)) {
  //   LayoutComponent = AdminLayout;
  //   routes = managerRoutes;
  // }

return (
  <>
    <Routes>
      {role ? (
        <Route path="/" element={<LayoutComponent />}>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route
          path="*"
          element={<Navigate to="/login" state={{ from: location }} replace />}
        />
      )}
    </Routes>

    {role && <SupportChatWidget />}
  </>
);
}

export default AppRoutes;
