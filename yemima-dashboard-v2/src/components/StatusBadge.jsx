// Label berwarna untuk status stok / status order.
const colors = {
  Available: "green",
  Completed: "green",
  Low: "orange",
  Pending: "orange",
  "Out of stock": "red",
  Cancelled: "red",
  Shipped: "blue",
};

function StatusBadge({ text }) {
  return <span className={`dash-badge ${colors[text]}`}>{text}</span>;
}

export default StatusBadge;
