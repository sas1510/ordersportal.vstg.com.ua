import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { X, Plus, Key, Ban } from "lucide-react";

import GenerateApiKeyModal from "./GenerateApiKeyModal";
import ConfirmModal from "./ConfirmModal";
import {formatDateHumanShorter} from '../utils/formatters'
import "./UserApiKeysModal.css";

export default function UserApiKeysModal({ user, onClose }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [processingId, setProcessingId] = useState(null);
  const [confirmKeyId, setConfirmKeyId] = useState(null);

  /* ================= LOAD KEYS ================= */
  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/admin/api-keys/by-user/${user.id}/`
      );
      setKeys(res.data.keys || []);
    } catch (e) {
      console.error("Не вдалося завантажити ключі", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  /* ================= REQUEST CONFIRM ================= */
  const requestDeactivate = (keyId) => {
    setConfirmKeyId(keyId);
  };

  /* ================= DEACTIVATE ================= */
  const deactivateKey = async () => {
    if (!confirmKeyId) return;

    setProcessingId(confirmKeyId);

    try {
      await axiosInstance.post(
        `/admin/api-keys/${confirmKeyId}/deactivate/`
      );

      setKeys((prev) =>
        prev.map((k) =>
          k.id === confirmKeyId ? { ...k, is_active: false } : k
        )
      );
    } catch (e) {
      alert("Не вдалося деактивувати API-ключ");
    } finally {
      setProcessingId(null);
      setConfirmKeyId(null);
    }
  };

  /* ================= RENDER ================= */
  return (
    <>
      <div className="api-keys-overlay" onClick={onClose}>
        <div
          className="api-keys-window"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="api-keys-header">
            <div className="api-keys-title">
              <Key size={22} />
              API-ключі: {user.username}
            </div>

            <button className="api-keys-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* BODY */}
          <div className="api-keys-body">
            {loading ? (
              <div className="api-keys-loading">Завантаження…</div>
            ) : keys.length === 0 ? (
              <div className="api-keys-empty">
                API-ключів ще немає
              </div>
            ) : (
              <table className="api-keys-table">
                <thead>
                  <tr>
                    <th>Назва</th>
                    <th>Ключ</th>
                    <th>Дійсний до</th>
                    <th>Статус</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td>{k.key}</td>
                      <td>{formatDateHumanShorter(k.expire_date)}</td>
                      <td>
                        {k.is_active ? (
                          <span className="badge-active">Активний</span>
                        ) : (
                          <span className="badge-disabled">Вимкнений</span>
                        )}
                      </td>

                      <td className="api-keys-actions">
                        {k.is_active && (
                          <button
                            className="btn-deactivate"
                            title="Деактивувати"
                            disabled={processingId === k.id}
                            onClick={() => requestDeactivate(k.id)}
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER */}
          <div className="api-keys-footer">
            <button
              className="btn-create"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={18} />
              Створити ключ
            </button>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {createOpen && (
        <GenerateApiKeyModal
          user={user}
          onClose={() => {
            setCreateOpen(false);
            loadKeys();
          }}
        />
      )}

      {/* CONFIRM MODAL */}
      {confirmKeyId && (
        <ConfirmModal
          title="Деактивація API-ключа"
          message={
            <>
              Ви впевнені, що хочете деактивувати цей API-ключ?
              <br />
              <b>Повернути його буде неможливо.</b>
            </>
          }
          confirmText="Деактивувати"
          cancelText="Скасувати"
          danger
          onCancel={() => setConfirmKeyId(null)}
          onConfirm={deactivateKey}
        />
      )}
    </>
  );
}
