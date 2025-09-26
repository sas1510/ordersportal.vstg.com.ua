import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export default function AddClaimPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [reasonLink, setReasonLink] = useState(""); 
  const [solutionLink, setSolutionLink] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]); // масив фото
  const [loading, setLoading] = useState(false);

  const [reasonOptions, setReasonOptions] = useState([]);
  const [solutionOptions, setSolutionOptions] = useState([]);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [orderNotFound, setOrderNotFound] = useState(false);

  

  // Завантаження причин
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const res = await axiosInstance.get("/complaints/issues/");
        setReasonOptions(res.data.issues || []);
      } catch (error) {
        console.error("Помилка при завантаженні причин:", error);
        setReasonOptions([]);
      }
    };
    fetchReasons();
  }, []);

  // Завантаження рішень при зміні причини
  useEffect(() => {
    if (!reasonLink) {
      setSolutionOptions([]);
      setSolutionLink("");
      return;
    }
    const fetchSolutions = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/solutions/${reasonLink}/`);
        setSolutionOptions(res.data.solutions || []);
      } catch (error) {
        console.error("Помилка при завантаженні рішень:", error);
        setSolutionOptions([]);
      }
    };
    fetchSolutions();
  }, [reasonLink]);

  // Завантаження серій за номером замовлення
  useEffect(() => {
    if (!orderNumber) {
      setSeriesOptions([]);
      setSelectedSeries([]);
      setOrderNotFound(false);
      return;
    }
    const fetchSeries = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/get_series/${orderNumber}/`);
        if (res.data.series === null) {
          setSeriesOptions([]);
          setSelectedSeries([]);
          setOrderNotFound(true);
        } else {
          setSeriesOptions(res.data.series || []);
          setSelectedSeries([]);
          setOrderNotFound(false);
        }
      } catch (error) {
        console.error("Помилка при завантаженні серій:", error);
        setSeriesOptions([]);
        setOrderNotFound(true);
      }
    };
    fetchSeries();
  }, [orderNumber]);

  const handleSeriesChange = (seriesLink) => {
    setSelectedSeries(prev => prev.includes(seriesLink)
      ? prev.filter(link => link !== seriesLink)
      : [...prev, seriesLink]
    );
  };

  const handleAddPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotos(prev => [...prev, file]);
    e.target.value = null; // очищаємо input, щоб можна було додати ще одне фото
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderNotFound) return;

    const formData = new FormData();
    formData.append("order_number", orderNumber);
    formData.append("order_deliver_date", deliveryDate);
    formData.append("order_define_date", claimDate);
    formData.append("complaint_date", new Date().toISOString());
    formData.append("issue", reasonLink);
    formData.append("solution", solutionLink);
    formData.append("description", description);
    formData.append("series", JSON.stringify(
      selectedSeries.map(link => {
        const serie = seriesOptions.find(s => s.SeriesLink === link);
        return { serie_link: link, serie_name: serie?.Name || null };
      })
    ));
    formData.append("create_date", new Date().toISOString());

    // додаємо всі фото
    photos.forEach(photo => formData.append("photos", photo));

    setLoading(true);
    try {
      await axiosInstance.post("/complaints/create_complaints/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Рекламація успішно завантажена");

      // очищаємо форми
      setOrderNumber("");
      setDeliveryDate("");
      setClaimDate("");
      setReasonLink("");
      setSolutionLink("");
      setSolutionOptions([]);
      setDescription("");
      setPhotos([]);
      setSeriesOptions([]);
      setSelectedSeries([]);
      setOrderNotFound(false);

    } catch (error) {
      alert("Помилка при завантаженні рекламації: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 mt-8">
      <form onSubmit={handleSubmit} className="mx-auto p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">Додати рекламацію</h2>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Номер замовлення:
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            placeholder="Введіть номер замовлення"
          />
          {orderNotFound && (
            <p className="text-red-600 text-sm mt-1">Замовлення не знайдено</p>
          )}
        </label>


        {/* Серії */}
        {/* Серії */}
        {seriesOptions.length > 0 && (
          <div className="block mb-5">
            <span className="block mb-1 font-semibold text-gray-700">Виберіть серії:</span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {seriesOptions.map((s) => (
                <label key={s.SeriesLink} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSeries.includes(s.SeriesLink)}
                    onChange={() => handleSeriesChange(s.SeriesLink)}
                    className="mr-2"
                  />
                  {s.Name} ({s.FullName})
                </label>
              ))}
            </div>
          </div>
        )}





        {/* Дата доставки */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Дата доставки замовлення:
          </span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          />
        </label>

        {/* Дата визначення рекламації */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Дата визначення рекламації:
          </span>
          <input
            type="date"
            value={claimDate}
            onChange={(e) => setClaimDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          />
        </label>

        {/* Причина (issue) */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Причина рекламації:
          </span>
          <select
            value={reasonLink}
            onChange={(e) => setReasonLink(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">-- Оберіть причину --</option>
            {reasonOptions.map((opt) => (
              <option key={opt.Link} value={opt.Link}>
                {opt.Name}
              </option>
            ))}
          </select>
        </label>

        {/* Рішення (solution) */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Варіант вирішення:
          </span>
          <select
            value={solutionLink}
            onChange={(e) => setSolutionLink(e.target.value)}
            required
            disabled={!solutionOptions.length}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">-- Оберіть варіант --</option>
            {solutionOptions.map((opt) => (
              <option key={opt.Link} value={opt.Link}>
                {opt.Name}
              </option>
            ))}
          </select>
        </label>

        {/* Опис */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Опис рекламації:
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            placeholder="Опишіть рекламацію..."
          />
        </label>



        {/* Фото */}
        <label className="block mb-6">
          <span className="block mb-1 font-semibold text-gray-700">Фото рекламації:</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleAddPhoto}
            className="w-full text-sm text-gray-600"
          />
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((file, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </label>

        <button
          type="submit"
          disabled={loading || orderNotFound}
          className="w-full bg-[#003d66] text-white font-semibold py-2 rounded-md shadow-md transition-colors duration-300 hover:bg-[#00509e] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Завантаження..." : "Додати рекламацію"}
        </button>
      </form>
    </div>
  );
}