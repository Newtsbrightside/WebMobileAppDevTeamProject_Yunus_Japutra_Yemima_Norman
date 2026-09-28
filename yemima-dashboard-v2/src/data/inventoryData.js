// Semua data di-hardcode (tanpa database) sesuai ketentuan UTS.
// Nanti di Final, bagian fetchInventoryData() diganti dengan panggilan ke backend.

export const products = [
  { id: 1, name: "Laptop Asus Vivobook", category: "Electronics", stock: 12, minStock: 5, price: 8500000 },
  { id: 2, name: "Wireless Mouse", category: "Accessories", stock: 3, minStock: 10, price: 150000 },
  { id: 3, name: "Mechanical Keyboard", category: "Accessories", stock: 25, minStock: 10, price: 750000 },
  { id: 4, name: "Monitor 24 inch", category: "Electronics", stock: 0, minStock: 4, price: 2100000 },
  { id: 5, name: "USB-C Hub", category: "Accessories", stock: 8, minStock: 8, price: 320000 },
  { id: 6, name: "Webcam Full HD", category: "Electronics", stock: 15, minStock: 5, price: 450000 },
  { id: 7, name: "Laptop Stand", category: "Accessories", stock: 2, minStock: 6, price: 210000 },
  { id: 8, name: "Headset Gaming", category: "Electronics", stock: 19, minStock: 7, price: 600000 },
];

export const orders = [
  { id: "ORD-001", customer: "Budi Santoso", date: "2026-09-20", productId: 1, qty: 1, status: "Completed" },
  { id: "ORD-002", customer: "Siti Aminah", date: "2026-09-21", productId: 2, qty: 3, status: "Completed" },
  { id: "ORD-003", customer: "Andi Wijaya", date: "2026-09-22", productId: 3, qty: 2, status: "Shipped" },
  { id: "ORD-004", customer: "Dewi Lestari", date: "2026-09-23", productId: 6, qty: 1, status: "Shipped" },
  { id: "ORD-005", customer: "Rudi Hartono", date: "2026-09-24", productId: 8, qty: 2, status: "Pending" },
  { id: "ORD-006", customer: "Maya Putri", date: "2026-09-25", productId: 5, qty: 4, status: "Pending" },
  { id: "ORD-007", customer: "Joko Widodo", date: "2026-09-26", productId: 4, qty: 1, status: "Cancelled" },
  { id: "ORD-008", customer: "Lina Marlina", date: "2026-09-27", productId: 7, qty: 2, status: "Pending" },
];

export const monthlySales = [
  { month: "Apr", total: 18500000 },
  { month: "May", total: 22300000 },
  { month: "Jun", total: 19800000 },
  { month: "Jul", total: 27600000 },
  { month: "Aug", total: 31200000 },
  { month: "Sep", total: 26400000 },
];

// Ubah ke true untuk menguji tampilan error saat presentasi/demo.
const SIMULATE_ERROR = false;

// Meniru pengambilan data dari server (delay 0,6 detik) supaya
// state loading dan error bisa ditampilkan.
export function fetchInventoryData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (SIMULATE_ERROR) {
        reject(new Error("Failed to load inventory data."));
      } else {
        resolve({ products, orders, monthlySales });
      }
    }, 600);
  });
}

// ---------- fungsi bantu ----------
export function formatRupiah(number) {
  return "Rp " + number.toLocaleString("id-ID");
}

export function getStockStatus(product) {
  if (product.stock === 0) return "Out of stock";
  if (product.stock < product.minStock) return "Low";
  return "Available";
}

export function getOrderTotal(order, productList) {
  const product = productList.find((p) => p.id === order.productId);
  return product ? product.price * order.qty : 0;
}
