import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ allowedRole }) => {
    const token = localStorage.getItem("access");

    if (!token) return <Navigate to="/login" replace />;

    try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);

        if (allowedRole && decoded.role !== allowedRole) {
            return <Navigate to="/login" replace />;
        }

        return <Outlet />;
    } catch (err) {
        console.log("Decode error:", err);
        return <Navigate to="/login" replace />;
    }

};

export default PrivateRoute;
