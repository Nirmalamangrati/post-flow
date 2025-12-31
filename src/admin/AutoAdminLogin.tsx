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
      .post("https://backend-of-postflow-fioq.vercel.app/api/admin/autologin", {
        email: "aadminpostflow@gmail.com",
        password: "Admin4466@&$",
      })
      .then((res) => {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/admin/dashboard");
      })
      .catch((err) => {
        console.error(
          "Admin auto-login failed:",
          err.response?.data?.message || err.message
        );
      });
  }, []);

  return null;
};

export default AutoAdminLogin;
