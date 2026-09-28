// Tempat menyimpan & membaca role yang sedang login.
// Ini SATU-SATUNYA file yang perlu disesuaikan dengan cara login teman Anda.
// Nilai role harus "administrator" atau "client".

const KEY = "role";

export function getRole() {
  return localStorage.getItem(KEY);
}

export function saveRole(role) {
  localStorage.setItem(KEY, role);
}

export function clearRole() {
  localStorage.removeItem(KEY);
}
