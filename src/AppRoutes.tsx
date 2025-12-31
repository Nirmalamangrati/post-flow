import { Routes, Route, useParams } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Theme from "./pages/theme/Theme";
import Chats from "./pages/chats/Chats";
import Notification from "./pages/notification/NotificationBell.tsx";

import Login from "./login/Login";
import Registration from "./registration/Registration";
import PrivateComponent from "./componets/PrivateComponent";
import App from "./App";
import Setting from "./setting/Setting";
import AutoAdminLogin from "./admin/AutoAdminLogin.tsx";
import FriendList from "./FriendList/FriendList.tsx";
import FriendsPosts from "./FriendsPosts/FriendsPosts.tsx";
import FriendRequest from "./friendrequest/FriendRequest.tsx";
import ProfileView from "./ProfileView/ProfileView.tsx";

// URL parameter bata friendId line wrapper banayera FriendRequest lai pass garne
const FriendRequestPage = () => {
  const { friendId } = useParams<{ friendId: string }>();
  return friendId ? (
    <FriendRequest friendId={friendId} />
  ) : (
    <p>No friendId specified</p>
  );
};

// URL parameter bata userId liyera ProfileView pathaune wrapper
const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  return userId ? <ProfileView userId={userId} /> : <p>No userId specified</p>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PrivateComponent component={App} />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chats" element={<Chats />} />
        <Route path="profile" element={<Profile />} />
        <Route path="theme" element={<Theme />} />
        <Route path="notification" element={<Notification userId={""} />} />
        <Route path="settings" element={<Setting />} />
        <Route path="friends" element={<FriendList />} />
        <Route path="posts" element={<FriendsPosts />} />
        <Route path="/admin" element={<AutoAdminLogin />} />
        {/* friend request route with dynamic friendId */}
        <Route
          path="friend-request/:friendId"
          element={<FriendRequestPage />}
        />

        {/* profile view route with dynamic userId */}
        <Route path="profile/:userId" element={<ProfilePage />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="registration" element={<Registration />} />
    </Routes>
  );
}

export default AppRoutes;
