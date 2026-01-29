import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useNotification } from "../components/notification/Notifications";
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

/* ================= PHONE HELPERS (з ClientAddressModal) ================= */

const isValidPhoneUA = (phone) => {
  return /^\+380\d{9}$/.test(phone);
};

const formatPhoneInput = (value) => {
  let digits = value.replace(/[^\d]/g, "");

  if (!digits) return "";

  if (digits.startsWith("0")) digits = "38" + digits;
  else if (digits.startsWith("9")) digits = "380" + digits;
  else if (digits.startsWith("80")) digits = "3" + digits;

  return ("+" + digits).slice(0, 13);
};

export default function InviteRegisterForm() {
  const { code } = useParams();
  const { addNotification } = useNotification();

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

  /* ================= PASSWORD VALIDATION ================= */

  const passwordErrors = useMemo(() => {
    const p = formData.password;
    const errors = [];

    if (!p) return errors;
    if (p.length < 8) errors.push("Мінімум 8 символів");
    if (!/[a-z]/.test(p)) errors.push("Має містити малу літеру");
    if (!/[A-Z]/.test(p)) errors.push("Має містити велику літеру");
    if (!/[0-9]/.test(p)) errors.push("Має містити цифру");
    if (!/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p))
      errors.push("Має містити спецсимвол");

    return errors;
  }, [formData.password]);

  const isPasswordValid = passwordErrors.length === 0;

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    let score = 0;

    if (!p) return { score: 0, label: "", color: "#ccc" };

    if (p.length >= 8) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p)) score++;

    if (score <= 1)
      return { score, label: "Слабкий пароль", color: "#e74c3c" };
    if (score <= 3)
      return { score, label: "Середній пароль", color: "#f1c40f" };
    return { score, label: "Надійний пароль", color: "#2ecc71" };
  }, [formData.password]);

  /* ================= LOAD DATA ================= */

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

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      addNotification(
        "Пароль не відповідає вимогам безпеки",
        "error"
      );
      return;
    }

    if (
      formData.phone_number &&
      !isValidPhoneUA(formData.phone_number)
    ) {
      addNotification(
        "Некоректний формат телефону. Використовуйте +380XXXXXXXXX",
        "error"
      );
      return;
    }

    try {
      await axiosInstance.post(`/register/${code}/`, formData);
      setSuccess(true);
    } catch (err) {
      addNotification(
        err.response?.data?.error || "Помилка реєстрації",
        "error"
      );
    }
  };

  /* ================= STATES ================= */

  if (loading)
    return (
      <div className="portal-body align-center">
        <div className="loading-spinner"></div>
      </div>
    );

  if (error)
    return (
      <div className="portal-body align-center">
        <div className="panel invite-panel text-danger text-center invite-padding">
          {error}
        </div>
      </div>
    );

  if (success)
    return (
      <div className="portal-body align-center">
  <div className="panel invite-panel text-success invite-padding">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
      <i className="fa-solid fa-circle-check font-size-32"></i>
      <span>Реєстрацію успішно завершено! Тепер ви можете увійти в систему.</span>
    </div>
  </div>
</div>
    );

  /* ================= RENDER ================= */

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
              <div className="invite-info-card-header invite-border-bottom uppercase font-size-16 mb-3">
                Параметри доступу від адміністратора:
              </div>

              <div className="invite-info-grid mt-3">
                <div className="invite-info-block">
                  <label>Ваш логін в систему</label>
                  <div className="invite-info-data text-bold">
                    {info.username || "—"}
                  </div>
                </div>

                <div className="invite-info-block">
                  <label>Тип аккаунта</label>
                  <span className="invite-role-badge">
                    {ROLE_LABELS[info.role] || info.role}
                  </span>
                </div>

                <div className="invite-info-block">
                  <label>Акаунт активний до:</label>
                  {info.expire_date ? (
                    <span className="expire-date">
                      {new Date(info.expire_date).toLocaleDateString("uk-UA")}
                    </span>
                  ) : (
                    <span className="text-success text-bold">Безстроково</span>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="column invite-gap-4">

              {/* WARNINGS */}
              <div className="invite-section-intro">
                <h2 className="font-size-24 text-dark m-0">Персональні дані</h2>
                <div className="text-danger font-size-16">
                  <p className="m-0">
                    Перевірте та за потреби відредагуйте контактні дані та встановіть пароль.
                  </p>
                  <p className="m-0 text-danger text-bold">
                    Важливо: збережіть свій логін та пароль!
                  </p>
                </div>
              </div>

              <div className="invite-form-grid">

                {/* FULL NAME */}
                <div className="invite-input-group">
                  <label className="invite-required">Повне ім’я (ПІБ)</label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, full_name: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* EMAIL */}
                <div className="invite-input-group">
                  <label className="invite-required">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* PHONE */}
                <div className="invite-input-group">
                  <label>Телефон</label>
                  <input
                    name="phone_number"
                    placeholder="+380XXXXXXXXX"
                    value={formData.phone_number}
                    maxLength={13}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (e.nativeEvent.inputType === "deleteContentBackward") {
                        setFormData((p) => ({ ...p, phone_number: val }));
                      } else {
                        setFormData((p) => ({
                          ...p,
                          phone_number: formatPhoneInput(val),
                        }));
                      }
                    }}
                  />
                </div>

                {/* PASSWORD */}
                <div className="invite-input-group">
                  <label className="invite-required">Новий пароль</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                  />

                  {formData.password && (
                    <div className="password-strength-wrapper">
                      <div className="password-strength-bar">
                        <div
                          className="password-strength-fill"
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                      <div
                        className="password-strength-label"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </div>
                    </div>
                  )}

                  {passwordErrors.length > 0 && (
                    <ul className="password-rules">
                      {passwordErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              <div className="invite-border-top pt-5">
                <button
                  type="submit"
                  className={`invite-btn-submit ${!isPasswordValid ? "not-ready" : ""}`}
                >
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
