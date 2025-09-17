import { useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    icon: "https://img.icons8.com/color/32/combo-chart--v1.png",
    to: "/dashboard",
  },
  {
    label: "Profile",
    icon: "https://img.icons8.com/color/32/user-male-circle--v1.png",
    to: "/profile",
  },
  {
    label: "Theme",
    icon: "https://img.icons8.com/color/32/paint-palette.png",
    to: "/theme",
  },
  {
    label: "Notification",
    icon: "https://img.icons8.com/color/32/appointment-reminders--v1.png",
    to: "/notification",
  },
  {
    label: "Friends",
    icon: "https://img.icons8.com/color/32/conference-call--v2.png",
    to: "/friends",
  },
  {
    label: "Settings",
    icon: "https://img.icons8.com/color/32/settings--v1.png",
    to: "/settings",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop small toggle (3-line icon) */}
      <div className="hidden md:flex fixed top-1/20 right-0 -translate-y-1/2 z-50">
        <button
          className="flex flex-col justify-between w-8 h-6 p-1 bg-red-700 rounded ml-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="block h-0.5 w-full bg-white"></span>
          <span className="block h-0.5 w-full bg-white"></span>
          <span className="block h-0.5 w-full bg-white"></span>
        </button>
      </div>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-red-700 text-white p-2 rounded justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close" : "Menu"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-full bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] z-40 transform transition-transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:${
          isOpen ? "translate-x-0" : "-translate-x-[260px]"
        }`}
      >
        <div className="flex flex-col h-full justify-between py-6 relative">
          {/* Top Section */}
          <div>
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-semibold mt-2">
                PostFlow
              </h2>
            </div>

            <hr className="border-t border-white/20 mb-4 mx-4" />

            <ul className="flex flex-col gap-3 relative">
              {menuItems.map((item) => (
                <li key={item.label} className="px-4 relative">
                  <NavLink
                    to={item.to}
                    onClick={() => setIsOpen(false)} // ✅ this closes sidebar
                    className={({ isActive }) =>
                      `flex items-center justify-center gap-4 text-base font-medium transition-all duration-200 ${
                        isActive
                          ? "text-red-500 bg-white/10 px-3 py-2 rounded-lg"
                          : "text-white hover:bg-white/10 px-3 py-2 rounded-lg"
                      }`
                    }
                    end
                  >
                    <img src={item.icon} alt={item.label} className="w-6 h-6" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Logout Section */}
          <div>
            <hr className="border-t border-white/20 mx-4 mb-4" />
            <NavLink
              to="/login"
              onClick={() => setIsOpen(false)} // ✅ logout click also hides sidebar
              className="justify-center flex items-center gap-4 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
            >
              <img
                src="https://img.icons8.com/color/32/logout-rounded-left.png"
                alt="Logout"
                className="w-6 h-6"
              />
              <span>Logout</span>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
}
