import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setErrorMsg(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log(data);
      if (res.ok) {
        toast.success("Login successful!");

        //   Save token and correct user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("fullname", data.user.fullname);
        localStorage.setItem("email", data.user.email || "");
        localStorage.setItem("dob", data.user.dob || "");
        localStorage.setItem("phone", data.user.phone || "");

        navigate("/dashboard");
      } else {
        setErrorMsg(data.message || "Login failed");
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Server error");
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 animate-fade-in">
      <ToastContainer />
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[350px] animate-slide-down">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-bold mb-1">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-700 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-bold mb-1">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-700 transition"
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm text-center min-h-[20px]">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white rounded-lg transition duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-900"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          Don't have an account?{" "}
          <Link to="/registration" className="text-red-700 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
