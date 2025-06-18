import { useState } from "react";
import { NavLink } from "react-router-dom";

// Sidebar menu items
const menuItems = [
  {
    label: "Dashboard",
    icon: "https://img.icons8.com/color/32/combo-chart--v1.png",
    to: "/dashboard",
  },
  {
    label: "Profile",
    icon: "https://img.icons8.com/color/32/user-male-circle--v1.png",
    to: "profile",
  },
  {
    label: "Theme",
    icon: "https://img.icons8.com/color/32/paint-palette.png",
    to: "theme",
  },
  {
    label: "Categories",
    icon: "https://img.icons8.com/color/32/opened-folder.png",
    to: "categories",
  },
  {
    label: "Chats",
    icon: "https://img.icons8.com/color/32/topic--v1.png",
    to: "chats",
  },
  {
    label: "Notification",
    icon: "https://img.icons8.com/color/32/appointment-reminders--v1.png",
    to: "notification",
  },
  {
    label: "Friends",
    icon: "https://img.icons8.com/color/32/conference-call--v2.png",
    to: "Friends",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button - visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-red-700 text-white p-2 rounded "
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close" : "Menu"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-[300px] tracking-widest leading-loose  bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] transition-transform z-40 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full justify-between py-6">
          {/* Profile Section */}
          <div>
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-semibold mt-2">
                PostFlow
              </h2>
            </div>

            <hr className="border-t border-white/20 mb-4 mx-4" />

            {/* Navigation Links */}
            <ul className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <li key={item.label} className="px-4">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-4 text-base font-medium transition-all duration-200 ${
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
              to="/logout"
              className="flex items-center gap-4 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
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
