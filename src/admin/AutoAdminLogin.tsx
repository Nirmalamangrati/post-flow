// components/AutoAdminLogin.tsx
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AutoAdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, don't auto-login again
    const existingUser = localStorage.getItem("user");
    if (existingUser) return;

    // Auto-login request
    axios
      .post("http://localhost:8000/api/admin/autologin", {
        email: "aadminpostflow@gmail.com",
        password: "Admin4466@&$",
      })
      .then((res) => {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/admin/dashboard"); // Redirect to admin dashboard
      })
      .catch((err) => {
        console.error("Admin auto-login failed:", err.response?.data?.message || err.message);
      });
  }, []);

  return null; // You can return a loading spinner if you want
};

export default AutoAdminLogin;
