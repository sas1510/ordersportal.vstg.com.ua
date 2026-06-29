import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { RoleContext } from "../context/RoleContext";
import { useTheme } from "../hooks/useTheme";
import "./LoginPage.css";
import { useTranslation } from 'react-i18next';
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../hooks/useNotification";

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { addNotification } = useNotification();
  const { loginSuccess } = useContext(RoleContext);

  const navigate = useNavigate();
  const { setRole } = useContext(RoleContext);
  const { theme } = useTheme();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // При завантаженні компонента підтягуємо збережений логін
  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axiosInstance.post("/login/", {
        username,
        password,
      });

      const { user, role } = response.data;

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      localStorage.setItem("role", role);
      loginSuccess(user, role);

      setRole(role);

      // При вході зберігаємо логін, якщо checkbox активний
      if (rememberMe) {
        localStorage.setItem("savedUsername", username);
      } else {
        localStorage.removeItem("savedUsername");
      }

      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          addNotification(t('login.error_invalid_credentials'), "error");
        } else {
          addNotification(`${t('login.error_auth')} (${error.response.status})`, "error");
        }
      } else if (error.request) {
        addNotification(t('login.error_server_unavailable'), "warning");
      } else {
        addNotification(t('login.error_general'), "error");
      }
    }

    setLoading(false);
  };

  const isDark = theme === "dark";

  return (
    <div className={`login-page ${isDark ? "dark" : "light"}`}>
      {/* Анімовані фонові елементи */}
      <div className="background-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />

        {/* COSMIC DUST */}
        <div className="star s1"></div>
        <div className="star s2"></div>
        <div className="star s3"></div>
        <div className="star s4"></div>
        <div className="star s5"></div>
        <div className="star s6"></div>
        <div className="star s7"></div>
        <div className="star s8"></div>
        <div className="star s9"></div>
        <div className="star s10"></div>
        <div className="star s11"></div>
        <div className="star s12"></div>
        <div className="star s13"></div>
        <div className="star s14"></div>
        <div className="star s15"></div>
      </div>

      {/* Основний контейнер */}
      <div className="login-container-wrapper">
        <div className="login-card">
          <div className="login-grid">
            {/* Ліва панель - інформаційна */}
            <div className="info-panel">
              {/* Декоративні елементи */}
              <div className="deco-circle deco-circle-1" />
              <div className="deco-circle deco-circle-2" />
              <div className="energy-line"></div>
              <div className="info-content">
                <div className="welcome-row">
                  <img
                    src="/header_logo_small white.svg"
                    className="logo-small"
                    alt="Вікна Стиль"
                  />

                  <div className="welcome-divider"></div>

                  <div className="welcome-text-block">
                    <p className="welcome-line">{t('login.welcome_title')}</p>
                    <p className="welcome-subline">
                      {t('login.welcome_subtitle')}
                    </p>
                  </div>
                </div>

                <div className="stats-grid-login">
                  <div className="stat-item">
                    <i className="fa fa-magic stat-icon"></i>
                    <div className="stat-label">{t('values.aesthetics.title')}</div>
                  </div>

                  <div className="stat-item">
                    <i className="fa fa-star stat-icon"></i>
                    <div className="stat-label">{t('values.quality.title')}</div>
                  </div>

                  <div className="stat-item">
                    <i className="fa fa-tags stat-icon"></i>
                    <div className="stat-label">{t('values.price.title')}</div>
                  </div>

                  <div className="stat-item">
                    <i className="fa fa-shield-alt stat-icon"></i>
                    <div className="stat-label">{t('values.safety.title')}</div>
                  </div>
                </div>
                <div className="energy-line"></div>
              </div>
            </div>

            
            <div className="form-panel">
              <div className="form-wrapper">
                <h2 className="form-title">{t('login.form_title')}</h2>
                <p className="form-subtitle">
                  {t('login.form_subtitle')}
                </p>

                <form onSubmit={handleSubmit} noValidate className="login-form">
            
                  <div className="form-group">
                    <label className="form-label">{t('login.username_label')}</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <i className="fa fa-user"></i>
                      </span>
                      <input
                        type="text"
                        placeholder={t('login.username_placeholder')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="form-input"
                        autocomplete="username"
                      />
                    </div>
                  </div>

              
                  <div className="form-group">
                    <label className="form-label">{t('login.password_label')}</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <i className="fa fa-lock"></i>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('login.password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input"
                        autocomplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                      >
                        <span
                          className="password-toggle-icon"
                          onClick={togglePasswordVisibility}
                        >
                          <i
                            className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                          ></i>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Опції */}
                  <div className="form-options">
                    <label className="remember-checkbox">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>{t('login.remember_me')}</span>
                    </label>
                    {/* <a href="#" className="forgot-link">
                      Забули пароль?
                    </a> */}
                  </div>

                  {/* Кнопка входу */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`submit-button ${loading ? "loading" : ""}`}
                  >
                    {loading ? t('login.button_loading') : t('login.button_submit')}
                  </button>

                  {/* Повідомлення про помилку */}
                  <div className="error-wrapper">
                    {errorMessage && (
                      <div className="error-inline">{errorMessage}</div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
