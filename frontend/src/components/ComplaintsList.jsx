import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import ComplaintCard from "./ComplaintCard";
import "./Complaints.css";
import FiltersSidebar from "./FiltersSidebar";


export default function ComplaintsList({ isDealer = false }) {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/complaints/complaints-full/", {
        params: { with_dealer: true },
      });
      if (Array.isArray(res.data)) {
        setComplaints(res.data);
      } else {
        setError("Невірний формат даних від сервера");
      }
    } catch (err) {
      console.error(err);
      setError("Помилка при завантаженні рекламацій");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [isDealer]);

  const filtered = complaints.filter((c) =>
    c.DescriptionComplaint?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="complaints-container">
  <h2 className="complaints-title">Рекламації</h2>

  <div className="complaints-main">
    <FiltersSidebar /> {/* тут бокова панель з фільтрами */}

    <div className="complaints-content">
      <input
        type="text"
        placeholder="Пошук за описом..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="complaints-search"
      />

      {loading && <p>Завантаження...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="complaints-list">
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} />
        ))}
      </div>
    </div>
  </div>
</div>

  );
}
