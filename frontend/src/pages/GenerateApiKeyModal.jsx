import { useState } from "react";
import axiosInstance from "../api/axios";
import { KeyRound, X, Copy, Check } from "lucide-react";

import "./GenerateApiKeyModal.css";

export default function GenerateApiKeyModal({ user, onClose }) {
  const [expireDate, setExpireDate] = useState("");
  const [name, setName] = useState("1C інтеграція");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!expireDate || loading) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/admin/api-keys/create/", {
        user_id: user.id,
        name,
        expire_date: expireDate,
      });
      setApiKey(res.data.api_key);
    } catch {
      alert("Не вдалося згенерувати ключ");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="portal-api-key-modal-overlay" onClick={onClose}>
      <div
        className="portal-api-key-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="portal-api-key-modal-header">
          <div className="portal-api-key-header-content">
            <div className="portal-api-key-icon">
              <KeyRound size={26} />
            </div>
            <h3>API-ключ для дилера: {user.username}</h3>
          </div>

          <button className="portal-api-key-close-btn" onClick={onClose}>
            <X size={26} />
          </button>
        </div>

        {/* BODY */}
        <div className="portal-api-key-body">
          {apiKey ? (
            <>
              <div className="portal-api-key-warning">
                ⚠️ Скопіюй ключ зараз — повторно він не відображатиметься
              </div>

              <div className="portal-api-key-box">
                <code>{apiKey}</code>

                <button
                  className="portal-api-key-copy-btn"
                  onClick={copyKey}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </>
          ) : (
            <div className="portal-api-key-form">
              <label className="portal-api-key-label">
                <span>Назва ключа</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="portal-api-key-input"
                />
              </label>

              <label className="portal-api-key-label">
                <span>Дійсний до</span>
                <input
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="portal-api-key-input"
                />
              </label>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="portal-api-key-modal-footer">
          <button
            className="portal-api-key-btn-cancel"
            onClick={onClose}
          >
            Закрити
          </button>

          {!apiKey && (
            <button
              className="portal-api-key-btn-generate"
              onClick={generate}
              disabled={!expireDate || loading}
            >
              {loading ? "Генерація..." : "Згенерувати"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
