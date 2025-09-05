import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, allowedRoles, children }) {
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
