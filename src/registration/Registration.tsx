import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    dob: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    const { fullname, dob, phone, email, password, confirmPassword } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+977)?9[78]\d{8}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!fullname || !dob || !phone || !email || !password || !confirmPassword)
      return "Please fill in all fields.";
    if (!emailRegex.test(email)) return "Invalid email format.";
    if (!phoneRegex.test(phone)) return "Invalid Nepal phone number.";
    if (!passwordRegex.test(password))
      return "Password must be 8+ chars with uppercase, lowercase, number & special char.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log(data, "@data");
      console.log(res, "@res");
      if (res.status === 201) {
        toast.success("Registration successful!");

        //  Save user info to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("fullname", formData.fullname);
        localStorage.setItem("email", formData.email);
        localStorage.setItem("dob", formData.dob);
        localStorage.setItem("phone", formData.phone);

        //  Redirect to dashboard
        navigate("/dashboard");

        setFormData({
          fullname: "",
          dob: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <ToastContainer />
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Your Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="fullname"
            placeholder="Full Name"
            onChange={handleChange}
            value={formData.fullname}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            name="dob"
            type="date"
            onChange={handleChange}
            value={formData.dob}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            name="phone"
            placeholder="+977-98XXXXXXXX"
            onChange={handleChange}
            value={formData.phone}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            value={formData.password}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
            value={formData.confirmPassword}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {error && (
            <p className="text-red-600 text-center text-sm mb-2">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-red-700 text-white font-bold rounded hover:bg-green-700 transition duration-300"
          >
            Sign Up
          </button>
          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-red-700 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Registration;
