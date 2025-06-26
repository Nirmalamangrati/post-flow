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
    to: "#",
    subCategories: ["Technology", "Travel", "Lifestyle", "Food", "Funny"],
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
  {
    label: "Settings",
    icon: "https://img.icons8.com/color/32/settings--v1.png",
    to: "settings",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-red-700 text-white p-2 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close" : "Menu"}
      </button>

      <div
        className={`fixed top-0 left-0 h-screen w-[300px] tracking-widest leading-loose bg-gradient-to-b from-black via-[#3a0000] to-[#a30000] transition-transform z-40 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
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
                <li
                  key={item.label}
                  className="px-4 relative"
                  onMouseEnter={() =>
                    item.subCategories && setHoveredItem(item.label)
                  }
                  onMouseLeave={() =>
                    item.subCategories && setHoveredItem(null)
                  }
                >
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
                    {item.subCategories && (
                      <span className="ml-auto text-sm">▶</span>
                    )}
                  </NavLink>

                  {/* Subcategory Popup */}
                  {hoveredItem === item.label && item.subCategories && (
                    <ul className="absolute top-0 left-full ml-2 mt-1 w-40 bg-black bg-opacity-80 border border-white/10 rounded shadow z-50">
                      {item.subCategories.map((sub) => (
                        <li key={sub}>
                          <NavLink
                            to={`/categories/${sub.toLowerCase()}`}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm transition ${
                                isActive
                                  ? "bg-red-500 text-white"
                                  : "text-white hover:bg-white/10"
                              }`
                            }
                          >
                            {sub}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Logout Section */}
          <div>
            <hr className="border-t border-white/20 mx-4 mb-4" />
            <NavLink
              to="/login"
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
