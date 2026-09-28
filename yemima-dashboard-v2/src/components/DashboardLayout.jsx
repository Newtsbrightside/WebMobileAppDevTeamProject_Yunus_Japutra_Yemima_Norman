import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { clearRole, getRole } from "../utils/session";
import "../styles/dashboard.css";

// Ke halaman inilah pengguna dikirim bila belum login. Sesuaikan dengan route login tim.
const LOGIN_PATH = "/";

// Kerangka halaman: sidebar di kiri, isi halaman di kanan.
// Semua halaman yang butuh login dibungkus komponen ini di App.jsx.
function DashboardLayout() {
  const navigate = useNavigate();
  const role = getRole();

  // Belum login (tidak ada role) -> kembalikan ke halaman login
  if (!role) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  function handleLogout() {
    clearRole();
    navigate(LOGIN_PATH);
  }

  return (
    <div className="dash-layout">
      <Sidebar role={role} onLogout={handleLogout} />
      <main className="dash-content">
        {/* Outlet = tempat halaman anak (Dashboard/Inventory) ditampilkan.
            context = "titipan" role agar bisa dibaca halaman anak. */}
        <Outlet context={{ role }} />
      </main>
    </div>
  );
}

export default DashboardLayout;
