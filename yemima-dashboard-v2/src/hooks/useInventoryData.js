import { useEffect, useState } from "react";
import { fetchInventoryData } from "../data/inventoryData";

// Custom hook: mengurus 3 state (loading, error, data) di satu tempat
// supaya Dashboard dan Inventory tidak menulis logika yang sama dua kali.
export default function useInventoryData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // naik 1 tiap kali tombol Retry ditekan

  useEffect(() => {
    let ignore = false; // mencegah update state kalau komponen sudah ditutup

    fetchInventoryData()
      .then((result) => {
        if (!ignore) setData(result);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setError("");
    setAttempt((n) => n + 1);
  }

  return { data, loading, error, retry };
}
