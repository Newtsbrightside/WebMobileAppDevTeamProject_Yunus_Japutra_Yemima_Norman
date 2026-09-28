// Menampilkan state loading / error. Kalau keduanya tidak aktif,
// tampilkan isi halaman (children).
function DataState({ loading, error, onRetry, children }) {
  if (loading) {
    return <p className="dash-message">Loading data...</p>;
  }
  if (error) {
    return (
      <div className="dash-message dash-error">
        <p>{error}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return children;
}

export default DataState;
