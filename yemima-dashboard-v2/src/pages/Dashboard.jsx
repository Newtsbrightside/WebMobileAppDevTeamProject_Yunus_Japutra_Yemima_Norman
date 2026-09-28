import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useInventoryData from "../hooks/useInventoryData";
import { formatRupiah, getOrderTotal, getStockStatus } from "../data/inventoryData";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DataState from "../components/DataState";

// ---------- Tampilan ADMIN: statistik penjualan, inventory, dan order ----------
function AdminDashboard({ products, orders, monthlySales }) {
  const validOrders = orders.filter((o) => o.status !== "Cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + getOrderTotal(o, products), 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const lowStock = products.filter((p) => p.stock < p.minStock);
  const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  const maxSales = Math.max(...monthlySales.map((m) => m.total));
  const recentOrders = [...orders].reverse().slice(0, 5); // 5 order terbaru

  return (
    <>
      <div className="dash-stats">
        <StatCard label="Total Revenue" value={formatRupiah(totalRevenue)} />
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Pending Orders" value={pendingCount} />
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Low / Empty Stock" value={lowStock.length} />
        <StatCard label="Inventory Value" value={formatRupiah(inventoryValue)} />
      </div>

      <div className="dash-two-col">
        <div className="dash-card">
          <h2>Monthly Sales</h2>
          <div className="dash-chart">
            {monthlySales.map((m) => (
              <div className="dash-bar-col" key={m.month}>
                <div
                  className="dash-bar"
                  style={{ height: `${(m.total / maxSales) * 100}%` }}
                  title={formatRupiah(m.total)}
                />
                <span>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <h2>Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="dash-muted">All products are well stocked.</p>
          ) : (
            <ul className="dash-list">
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name}
                  <span>
                    {p.stock} left <StatusBadge text={getStockStatus(p)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dash-card">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="dash-muted">No orders yet.</p>
        ) : (
          <div className="dash-table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{formatRupiah(getOrderTotal(o, products))}</td>
                    <td><StatusBadge text={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Tampilan CLIENT: cek ketersediaan stok ----------
function ClientDashboard({ products }) {
  const [keyword, setKeyword] = useState("");

  const availableCount = products.filter((p) => p.stock >= p.minStock).length;
  const limitedCount = products.filter((p) => p.stock > 0 && p.stock < p.minStock).length;
  const emptyCount = products.filter((p) => p.stock === 0).length;

  const results = products.filter((p) =>
    p.name.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <>
      <div className="dash-stats">
        <StatCard label="Available Products" value={availableCount} />
        <StatCard label="Limited Stock" value={limitedCount} />
        <StatCard label="Out of Stock" value={emptyCount} />
      </div>

      <div className="dash-card">
        <h2>Check Stock</h2>
        <input
          className="dash-input"
          type="text"
          placeholder="Search product..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {results.length === 0 ? (
          <p className="dash-muted">No product matches "{keyword}".</p>
        ) : (
          <ul className="dash-list">
            {results.map((p) => (
              <li key={p.id}>
                {p.name}
                <span>
                  {p.stock} pcs <StatusBadge text={getStockStatus(p)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ---------- Halaman utama: pilih tampilan berdasarkan role ----------
function Dashboard() {
  const { role } = useOutletContext(); // role dititipkan oleh DashboardLayout
  const { data, loading, error, retry } = useInventoryData();

  return (
    <div>
      <h1>{role === "administrator" ? "Admin Dashboard" : "Stock Overview"}</h1>
      <p className="dash-muted dash-subtitle">
        {role === "administrator"
          ? "Overview of sales, orders, and inventory"
          : "Check which products are available"}
      </p>

      <DataState loading={loading} error={error} onRetry={retry}>
        {data && (role === "administrator" ? (
          <AdminDashboard {...data} />
        ) : (
          <ClientDashboard products={data.products} />
        ))}
      </DataState>
    </div>
  );
}

export default Dashboard;
