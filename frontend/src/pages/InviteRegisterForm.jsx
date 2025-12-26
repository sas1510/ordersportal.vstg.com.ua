import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./InviteRegisterForm.css";

const ROLE_LABELS = {
  admin: "Адміністратор",
  manager: "Менеджер",
  operator: "Оператор",
  director: "Директор",
  region_manager: "Регіональний менеджер",
  complaint_manager: "Менеджер скарг",
  customer: "Дилер",
};

export default function InviteRegisterForm() {
  const { code } = useParams();

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const [info, setInfo] = useState({
    username: "",
    role: "",
    expire_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(`/register/${code}/`)
      .then((res) => {
        const d = res.data;
        setFormData({
          full_name: d.full_name || "",
          phone_number: d.phone_number || "",
          email: d.email || "",
          password: "",
        });
        setInfo({
          username: d.username || "",
          role: d.role || "",
          expire_date: d.expire_date || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Не вдалося завантажити дані");
        setLoading(false);
      });
  }, [code]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axiosInstance.post(`/register/${code}/`, formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Помилка реєстрації");
    }
  };

  if (loading) return (
    <div className="portal-body align-center">
      <div className="loading-spinner"></div>
    </div>
  );

  if (error) return (
    <div className="portal-body align-center">
      <div className="panel invite-panel text-danger text-center invite-padding">
        {error}
      </div>
    </div>
  );

  if (success) return (
    <div className="portal-body align-center">
      <div className="panel invite-panel text-success text-center invite-padding">
        <i className="fa-solid fa-circle-check font-size-32 mb-10"></i>
        <div>Реєстрацію успішно завершено! Тепер ви можете увійти в систему.</div>
      </div>
    </div>
  );

  return (
    <div className="portal-body">
      <div className="invite-wrapper">
        <div className="invite-padding">
          <div className="panel invite-panel column gap-5 shadow-sm">
            
            {/* Header */}
            <div className="invite-header-container invite-border-bottom invite-pb-10">
              <div className="header uppercase text-info font-size-18 text-bold">
                <i className="fa-solid fa-user-plus mr-10"></i>
                Завершення реєстрації
              </div>
            </div>

            {/* Static Info Card */}
            <div className="invite-info-card">
              <div className="invite-info-card-header  invite-border-bottom text-color-header-register uppercase font-size-16 mb-3">
                Параметри доступу від адміністратора: 
              </div>
              <div className="invite-info-grid mt-3">
                <div className="invite-info-block">
                  <label>Ваш логін в систему</label>
                  <div className="invite-info-data text-bold">{info.username || "—"}</div>
                </div>
                <div className="invite-info-block">
                  <label>Тип аккаунта</label>
                  <div className="invite-info-data">
                    <span className="invite-role-badge">
                      {ROLE_LABELS[info.role] || info.role}
                    </span>
                  </div>
                </div>
                <div className="invite-info-block">
                  <label>Акаунт активний до:</label>
                  <div className="invite-info-data">
                    {info.expire_date ? (
                      <span className="expire-date">
                        <i className="fa-regular fa-calendar-check mr-1"></i>
                        {new Date(info.expire_date).toLocaleDateString("uk-UA")}
                      </span>
                    ) : (
                      <span className="text-success text-bold">Безстроково</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="column invite-gap-4">
              <div className="invite-section-intro">
                <h2 className="font-size-24 text-dark m-0">Персональні дані</h2>
                <div className="text-danger font-size-16">
                  <p className="m-0">Перевірте та за потреби відредагуйте контактні дані та встановіть пароль.</p>
                  <p className="m-0 text-danger text-bold ">Важливо: збережіть свій логін та пароль!</p>
                </div>
              </div>

              <div className="invite-form-grid">
                <div className="invite-input-group">
                  <label className="invite-required">Повне ім’я (ПІБ)</label>
                  <div className="invite-input-with-icon">
                    <i className="fa-regular fa-address-card"></i>
                    <input
                      name="full_name"
                      placeholder="Прізвище Ім'я По батькові"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="invite-input-group">
                  <label className="invite-required">Email для сповіщень</label>
                  <div className="invite-input-with-icon">
                    <i className="fa-regular fa-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="invite-input-group">
                  <label>Контактний телефон</label>
                  <div className="invite-input-with-icon">
                    <i className="fa-solid fa-phone-flip"></i>
                    <input
                      name="phone_number"
                      placeholder="+380 (__) ___-__-__"
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="invite-input-group">
                  <label className="invite-required">Новий пароль</label>
                  <div className="invite-input-with-icon">
                    <i className="fa-solid fa-lock"></i>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <small className="text-grey font-size-11 mt-5">Використовуйте надійний пароль</small>
                </div>
              </div>

              <div className="invite-border-top pt-5">
                <button type="submit" className="invite-btn-submit">
                  <span>Створити профіль</span>
                  <i className="fa-solid fa-arrow-right ml-10"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}