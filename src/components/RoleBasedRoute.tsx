import React from "react";
import { Navigate, Link } from "react-router-dom";
import { User } from "../../types";

interface Props {
  user: User | null;
  allowedRoles: string[];
  children?: React.ReactNode;
}

const RoleBasedRoute: React.FC<Props> = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-gray-400">Access Denied</h2>
        <p className="text-gray-500 mt-2">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded"
        >
          Go Home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
};

export default RoleBasedRoute;
