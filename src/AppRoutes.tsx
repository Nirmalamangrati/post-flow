import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Theme from "./pages/theme/Theme";
import Notification from "./pages/notification/Notification";
import Login from "./login/Login";
import Registration from "./registration/Registration";
import PrivateComponent from "./componets/PrivateComponent";
import App from "./App";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PrivateComponent component={App} />}>
        <Route path="dashboard" element={<Dashboard />}></Route>
        <Route path="chats" element={<Chats />} />
        <Route path="profile" element={<Profile />} />
        <Route path="theme" element={<Theme />} />
        <Route path="notification" element={<Notification />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="registration" element={<Registration />} />
    </Routes>
  );
}

export default AppRoutes;
