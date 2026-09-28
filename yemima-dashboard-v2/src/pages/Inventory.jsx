import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useInventoryData from "../hooks/useInventoryData";
import { formatRupiah, getStockStatus } from "../data/inventoryData";
import StatusBadge from "../components/StatusBadge";
import DataState from "../components/DataState";

function Inventory() {
  const { role } = useOutletContext(); // role dititipkan oleh DashboardLayout
  const { data, loading, error, retry } = useInventoryData();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");

  const isAdmin = role === "administrator";

  // Filter dihitung ulang setiap render dari state keyword & category
  const filtered = data
    ? data.products.filter((p) => {
        const matchName = p.name.toLowerCase().includes(keyword.toLowerCase());
        const matchCategory = category === "All" || p.category === category;
        return matchName && matchCategory;
      })
    : [];

  return (
    <div>
      <h1>Inventory</h1>
      <p className="dash-muted dash-subtitle">Product stock and availability</p>

      <DataState loading={loading} error={error} onRetry={retry}>
        <div className="dash-card">
          <div className="dash-filters">
            <input
              className="dash-input"
              type="text"
              placeholder="Search product..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              className="dash-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="dash-muted">No product found.</p>
          ) : (
            <div className="dash-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    {isAdmin && <th>Min. Stock</th>}
                    {isAdmin && <th>Price</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.stock}</td>
                      {isAdmin && <td>{p.minStock}</td>}
                      {isAdmin && <td>{formatRupiah(p.price)}</td>}
                      <td><StatusBadge text={getStockStatus(p)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DataState>
    </div>
  );
}

export default Inventory;
