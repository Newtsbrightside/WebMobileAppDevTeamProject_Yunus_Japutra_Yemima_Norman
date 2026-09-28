// CONTOH SAJA. Jangan menimpa App.jsx milik tim!
// Tunjukkan ke teman Anda: tiga <Route> di dalam <Route element={<DashboardLayout />}>
// adalah bagian Anda. Route "/" dan "/form" milik teman satu tim.

import { Route, Routes, useNavigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import { saveRole } from "./utils/session";

// Login PALSU khusus untuk tes bagian Anda. Ganti dengan halaman login teman.
function TestLogin() {
  const navigate = useNavigate();
  function loginAs(role) {
    saveRole(role);
    navigate("/dashboard");
  }
  return (
    <div style={{ padding: 24 }}>
      <h1>Test Login</h1>
      <button onClick={() => loginAs("administrator")}>Login as Administrator</button>{" "}
      <button onClick={() => loginAs("client")}>Login as Client</button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TestLogin />} />

      {/* Halaman yang butuh login, dibungkus sidebar */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        {/* <Route path="/form" element={<FormPage />} />  <- halaman form teman */}
      </Route>
    </Routes>
  );
}

export default App;
