import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./CreateBillPage.css";

/* =========================
   CONSTANTS
   ========================= */
const emptyItem = {
  nomenclatureCode: "",
  height: "",
  width: "",
  qty: 1,
  price: "",
};

const USER = JSON.parse(localStorage.getItem("user") || "{}");
const contractor_guid = USER.user_id_1c;

/* =========================
   CUSTOM SELECT
   ========================= */
const CustomSelect = ({
  value,
  options,
  placeholder,
  onChange,
  getLabel,
  getValue,
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (o) => getValue(o) === value
  );

  return (
    <div className="custom-select">
      <div
        className="custom-select__control"
        onClick={() => setOpen(!open)}
      >
        <span>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <span className="arrow">▾</span>
      </div>

      {open && (
        <div className="custom-select__menu">
          {options.map((o) => (
            <div
              key={getValue(o)}
              className="custom-select__option"
              onClick={() => {
                onChange(getValue(o));
                setOpen(false);
              }}
            >
              {getLabel(o)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   PAGE
   ========================= */
const CreateBillPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    addressGuid: "",
    accountGuid: "",
    paymentDate: "",
    shipmentDate: "",
    comment: "",
  });

  const [items, setItems] = useState([emptyItem]);

  // 👉 РУЧНА СУМА
  const [manualSum, setManualSum] = useState("");

  /* =========================
     LOAD PROFILE
     ========================= */
  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get(
        `/dealers/${contractor_guid}/profile/`
      );
      setProfile(res.data);
    } catch {
      setError("Помилка при завантаженні профілю");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* =========================
     ITEMS
     ========================= */
  const addItem = () => setItems([...items, emptyItem]);

  const removeItem = (idx) =>
    setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: value };
    setItems(copy);
  };

  const toNum = (v) => {
    const s = String(v ?? "").trim().replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const autoSum = items.reduce((sum, i) => {
    const qty = toNum(i.qty);
    const price = toNum(i.price);
    return sum + qty * price;
  }, 0);

  /* =========================
     VALIDATION FLAGS
     ========================= */
  const {
  contractor = {},
  addresses = [],
  accounts = [],
  nomenclature = [],
} = profile || {};


  const hasAccounts =
    Array.isArray(accounts) && accounts.length > 0;

  const hasSelectedAccount = Boolean(form.accountGuid);
  const hasSelectedAddress = Boolean(form.addressGuid);

  // 👉 ЧИ МОЖНА РЕДАГУВАТИ СУМУ
  const canEditSum =
    hasAccounts &&
    hasSelectedAccount &&
    hasSelectedAddress;

  // 👉 ФІНАЛЬНА СУМА
  const finalSum =
    manualSum !== ""
      ? toNum(manualSum)
      : autoSum;

  const canSubmit =
    canEditSum && finalSum > 0;

  /* =========================
     SUBMIT
     ========================= */
  const handleSubmit = async () => {
    try {
      await axiosInstance.post(
        `/dealers/${contractor_guid}/bills/`,
        {
          ...form,
          items,
          totalSum: finalSum,
        }
      );
      navigate(-1);
    } catch {
      alert("Помилка при створенні рахунку");
    }
  };

  /* =========================
     STATES
     ========================= */
  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          Завантаження…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-bill-error">
        {error}
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="column create-bill-body">
      {/* HEADER */}
      <div className="create-bill-header">
        <h1 className="page-title">
          Створити рахунок
        </h1>
        <div className="page-subtitle">
          Заповніть дані для формування рахунку
        </div>
      </div>

      {/* CONTRACTOR */}
      <label>Контрагент</label>
      <input value={contractor.ContractorName} disabled />

      {/* ADDRESS */}
      <label>Адреса</label>
      <CustomSelect
        value={form.addressGuid}
        options={addresses}
        placeholder="— оберіть адресу —"
        getValue={(a) => a.AddressKindGUID}
        getLabel={(a) => a.AddressValue}
        onChange={(v) =>
          setForm({ ...form, addressGuid: v })
        }
      />

      {/* IBAN */}
      <label>IBAN</label>
      {hasAccounts ? (
        <CustomSelect
          value={form.accountGuid}
          options={accounts}
          placeholder="— оберіть рахунок —"
          getValue={(a) => a.AccountGUID}
          getLabel={(a) =>
            `${a.AccountName} (${a.НомерСчета})`
          }
          onChange={(v) =>
            setForm({ ...form, accountGuid: v })
          }
        />
      ) : (
        <div className="bill-warning">
          ⚠️ У контрагента немає жодного IBAN
        </div>
      )}

      <div className="form-divider"></div>

      {/* ITEMS */}
      <div className="bill-items">
        {items.map((item, idx) => (
          <div key={idx} className="bill-item-row">
            <CustomSelect
              value={item.nomenclatureCode}
              options={nomenclature}
              placeholder="Найменування"
              getValue={(n) => n.КодВРегбазе}
              getLabel={(n) =>
                `${n.Наименование} (${n.ЕдИзм})`
              }
              onChange={(v) =>
                updateItem(idx, "nomenclatureCode", v)
              }
            />

            <input
              placeholder="Висота"
              value={item.height}
              onChange={(e) =>
                updateItem(idx, "height", e.target.value)
              }
            />
            <input
              placeholder="Ширина"
              value={item.width}
              onChange={(e) =>
                updateItem(idx, "width", e.target.value)
              }
            />

            <input
              type="number"
              min="0"
              step="1"
              placeholder="К-сть"
              value={item.qty}
              onChange={(e) =>
                updateItem(idx, "qty", e.target.value)
              }
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ціна"
              value={item.price}
              onChange={(e) =>
                updateItem(idx, "price", e.target.value)
              }
            />

            <button
              className="btn btn-danger"
              onClick={() => removeItem(idx)}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          className="btn btn-success"
          onClick={addItem}
        >
          + Додати позицію
        </button>
      </div>

      <label>Сума рахунку</label>
      <input
        className="bill-total"
        type="number"
        step="0.01"
        min="0"
        disabled={!canEditSum}
        value={manualSum}
        placeholder={autoSum.toFixed(2)}
        onFocus={() => {
          if (manualSum === "") {
            setManualSum("");
          }
        }}
        onChange={(e) => setManualSum(e.target.value)}
        onBlur={() => {
          // якщо стерли і вийшли — лишаємо пустим
          // autoSum підставиться через placeholder
        }}
      />

      {canEditSum && (
        <div className="hint-text">
          За потреби суму можна відредагувати вручну
        </div>
      )}

      {/* DATES */}
      <label>Дата оплати</label>
      <input
        type="date"
        value={form.paymentDate}
        onChange={(e) =>
          setForm({
            ...form,
            paymentDate: e.target.value,
          })
        }
      />

      <label>Дата відвантаження</label>
      <input
        type="date"
        value={form.shipmentDate}
        onChange={(e) =>
          setForm({
            ...form,
            shipmentDate: e.target.value,
          })
        }
      />

      {/* COMMENT */}
      <label>Коментар</label>
      <textarea
        value={form.comment}
        onChange={(e) =>
          setForm({
            ...form,
            comment: e.target.value,
          })
        }
      />

      {/* SUBMIT */}
      <button
        className="btn btn-add-bill"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Створити рахунок
      </button>
    </div>
  );
};

export default CreateBillPage;
