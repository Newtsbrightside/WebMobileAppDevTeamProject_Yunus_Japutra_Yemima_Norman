import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, PlusSquare, LogOut } from "lucide-react";

// Daftar menu. `roles` = siapa yang boleh melihat menu itu.
// `path` harus sama dengan path di <Route> pada App.jsx.
const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrator", "client"] },
  { path: "/inventory", label: "Inventory", icon: Package, roles: ["administrator", "client"] },
  { path: "/form", label: "Add Item", icon: PlusSquare, roles: ["administrator"] }, // halaman form teman
];

function Sidebar({ role, onLogout }) {
  // conditional rendering: hanya menu yang cocok dengan role yang tampil
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="dash-sidebar">
      <h2>Inventory System</h2>
      <p className="dash-role">
        {role === "administrator" ? "Administrator" : "Client"}
      </p>

      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          // NavLink = link biasa yang otomatis diberi class "active" bila alamatnya sedang dibuka
          <NavLink key={item.path} to={item.path}>
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}

      <button className="dash-logout" onClick={onLogout}>
        <LogOut size={18} />
        Logout
      </button>
    </nav>
  );
}

export default Sidebar;
