import { Navigate } from "react-router-dom";

export default function PrivateComponent(props: any) {
  const token = localStorage.getItem("token");
  console.log(token);
  if (!token) {
    return <Navigate to="/login" />;
  }
  return (
    <div>
      <props.component />
    </div>
  );
}
