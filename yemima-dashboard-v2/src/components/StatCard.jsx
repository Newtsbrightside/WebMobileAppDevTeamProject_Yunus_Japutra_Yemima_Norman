// Kartu statistik kecil: judul + angka.
function StatCard({ label, value }) {
  return (
    <div className="dash-card">
      <p className="dash-muted">{label}</p>
      <h3 className="dash-stat">{value}</h3>
    </div>
  );
}

export default StatCard;
