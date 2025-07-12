import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export function useAdminAuth() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem("admin_token");
    const adminUserData = localStorage.getItem("admin_user");

    if (!adminToken || !adminUserData) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(adminUserData);
      setAdminUser(user);
      setLoading(false);
    } catch (error) {
      console.error("Error parsing admin user data:", error);
      router.push("/admin/login");
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const getAdminToken = () => {
    return localStorage.getItem("admin_token");
  };

  return {
    adminUser,
    loading,
    logout,
    getAdminToken,
  };
} 