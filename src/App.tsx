import { Outlet } from "react-router-dom";
import "./App.css";
import Sidebar from "./componets/Sidebar";

function App() {
  return (
    <>
      <Sidebar />
      <div>
        <Outlet />
      </div>
    </>
  );
}

export default App;
