import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export default function RegionPage() {
  const [regions, setRegions] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchRegions = async () => {
    try {
      const res = await axiosInstance.get("/regions/");
      setRegions(res.data);
    } catch (error) {
      console.error("Помилка завантаження регіонів:", error);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const addRegion = async () => {
    if (!newName.trim()) {
      alert("Назва обов'язкова");
      return;
    }
    try {
      await axiosInstance.post("/regions/", { name: newName });
      setNewName("");
      fetchRegions();
    } catch (error) {
      console.error("Помилка додавання регіону:", error);
    }
  };

  const updateRegion = async () => {
    if (!editName.trim()) {
      alert("Назва обов'язкова");
      return;
    }
    try {
      await axiosInstance.put(`/regions/${editId}/`, { name: editName });
      setEditId(null);
      setEditName("");
      fetchRegions();
    } catch (error) {
      console.error("Помилка оновлення регіону:", error);
    }
  };

  const deleteRegion = async (id) => {
    if (window.confirm("Видалити регіон?")) {
      try {
        await axiosInstance.delete(`/regions/${id}/`);
        fetchRegions();
      } catch (error) {
        console.error("Помилка видалення регіону:", error);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-gray-50 unded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">
        Регіони
      </h2>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новий регіон"
          className="flex-grow rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <button
          onClick={addRegion}
          className="bg-[#003d66] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#00509e] transition-colors duration-300"
        >
          Додати
        </button>
      </div>

      <ul>
        {regions.map((region) => (
          <li
            key={region.id}
            className="flex justify-between items-center border-b border-gray-300 py-3"
          >
            {editId === region.id ? (
              <div className="flex gap-3 flex-grow">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-grow rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
                />
                <button
                  onClick={updateRegion}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
                >
                  Зберегти
                </button>
                <button
                  onClick={() => {
                    setEditId(null);
                    setEditName("");
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-300"
                >
                  Відмінити
                </button>
              </div>
            ) : (
              <>
                <span className="text-[#003d66] font-medium">{region.name}</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setEditId(region.id);
                      setEditName(region.name);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => deleteRegion(region.id)}
                    className="text-red-600 hover:underline"
                  >
                    Видалити
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
