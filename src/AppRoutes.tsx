import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Theme from "./pages/theme/Theme";
import Notification from "./pages/notification/Notification";
import Chats from "./pages/chats/Chats";
import App from "./App";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="dashboard" element={<Dashboard />}></Route>
        <Route path="chats" element={<Chats />} />
        <Route path="profile" element={<Profile />} />
        <Route path="theme" element={<Theme />} />
        <Route path="notification" element={<Notification />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
