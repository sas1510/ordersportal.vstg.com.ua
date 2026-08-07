import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { Check, Copy, KeyRound, RefreshCw, X } from "lucide-react";

import "./GenerateApiKeyModal.css";

const UI = {
  title: "\u041a\u043b\u044e\u0447 Telegram-\u0431\u043e\u0442\u0430",
  close: "\u0417\u0430\u043a\u0440\u0438\u0442\u0438",
  generate: "\u0417\u0433\u0435\u043d\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u043a\u043b\u044e\u0447",
  rotate: "\u0417\u0430\u043c\u0456\u043d\u0438\u0442\u0438 \u043a\u043b\u044e\u0447",
  warning: "\u0421\u043a\u043e\u043f\u0456\u044e\u0439\u0442\u0435 \u043a\u043b\u044e\u0447 \u0437\u0430\u0440\u0430\u0437. \u041f\u0456\u0441\u043b\u044f \u0437\u0430\u043a\u0440\u0438\u0442\u0442\u044f \u0432\u0456\u043d \u043d\u0435 \u0432\u0456\u0434\u043e\u0431\u0440\u0430\u0436\u0430\u0442\u0438\u043c\u0435\u0442\u044c\u0441\u044f.",
  configured: "\u041a\u043b\u044e\u0447 \u0430\u043a\u0442\u0438\u0432\u043d\u0438\u0439:",
  missing: "\u041a\u043b\u044e\u0447 \u0449\u0435 \u043d\u0435 \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u043e.",
  info: "\u041f\u0456\u0441\u043b\u044f \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0456\u0457 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u0439\u043e\u0433\u043e \u0432 n8n Environment Variables \u044f\u043a PORTAL_BOT_API_KEY.",
  copied: "\u0421\u043a\u043e\u043f\u0456\u0439\u043e\u0432\u0430\u043d\u043e",
  copyError: "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0441\u043a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438 \u043a\u043b\u044e\u0447.",
  error: "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0433\u0435\u043d\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u043a\u043b\u044e\u0447.",
};

export default function TelegramBotKeyModal({ onClose }) {
  const [keyInfo, setKeyInfo] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    axiosInstance
      .get("/telegram-bot/admin/key/")
      .then((response) => active && setKeyInfo(response.data))
      .catch(() => active && setKeyInfo({ configured: false }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await axiosInstance.post("/telegram-bot/admin/key/");
      setApiKey(response.data.api_key || "");
      setKeyInfo({ configured: true, key_prefix: response.data.key_prefix });
    } catch {
      window.alert(UI.error);
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.alert(UI.copyError);
    }
  };

  return (
    <div className="portal-api-key-modal-overlay" onClick={onClose}>
      <div className="portal-api-key-modal-window" onClick={(event) => event.stopPropagation()}>
        <div className="portal-api-key-modal-header">
          <div className="portal-api-key-header-content">
            <div className="portal-api-key-icon"><KeyRound size={26} /></div>
            <h3>{UI.title}</h3>
          </div>
          <button className="portal-api-key-close-btn" type="button" onClick={onClose}><X size={26} /></button>
        </div>
        <div className="portal-api-key-body">
          {loading ? (
            <p>{"\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f..."}</p>
          ) : apiKey ? (
            <>
              <div className="portal-api-key-warning">{UI.warning}</div>
              <div className="portal-api-key-box">
                <code>{apiKey}</code>
                <button className="portal-api-key-copy-btn" type="button" onClick={copyKey} title={UI.copied}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="mt-4 text-sm opacity-80">{UI.info}</p>
            </>
          ) : (
            <div className="portal-api-key-form">
              <p>{keyInfo?.configured ? `${UI.configured} ${keyInfo.key_prefix}...` : UI.missing}</p>
              <p className="text-sm opacity-80">{UI.info}</p>
            </div>
          )}
        </div>
        <div className="portal-api-key-modal-footer">
          <button className="portal-api-key-btn-cancel" type="button" onClick={onClose}>{UI.close}</button>
          {!apiKey && (
            <button className="portal-api-key-btn-generate" type="button" onClick={generate} disabled={loading || generating}>
              <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
              {generating ? "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0456\u044f..." : keyInfo?.configured ? UI.rotate : UI.generate}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
