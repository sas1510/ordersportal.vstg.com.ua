import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import BillItemSelect from "./BillItemSelect";
import BillSelect from "./BillSelect";
import "./CreateCustomerBillModal.css";

/* ===================== STEPS ===================== */
const STEPS = {
  BASE: 1,
  ITEMS: 2,
  CONFIRM: 3,
};

export default function CreateCustomerBillModal({
  isOpen,
  onClose,
  onSuccess,
  contractorGuid,
}) {
  if (!isOpen) return null;

  /* ===================== STATE ===================== */
  const [step, setStep] = useState(STEPS.BASE);

  const [addresses, setAddresses] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [ibans, setIbans] = useState([]);

  const [selectedContragent, setSelectedContragent] = useState("");
  const [selectedIban, setSelectedIban] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");

  const [paymentDate, setPaymentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [internalComment, setInternalComment] = useState("");

  const [orderItems, setOrderItems] = useState([
    {
      itemGUID: "",
      quantity: 1,
      price: 0,
      width: "",
      height: "",
    },
  ]);

  const [loading, setLoading] = useState(false);

  /* ===================== LOAD PROFILE ===================== */
  useEffect(() => {
    if (!contractorGuid) return;

    const fetchProfile = async () => {
      const res = await axiosInstance.get(
        `/dealers/${contractorGuid}/profile/`
      );
      const data = res.data || {};

      setAddresses(data.addresses || []);
      setIbans(data.accounts || []);
      setItemsList(data.nomenclature || []);

      if (data.contractor?.ContractorGUID) {
        setSelectedContragent(data.contractor.ContractorGUID);
      }
    };

    fetchProfile();
  }, [contractorGuid]);

  /* ===================== ITEMS ===================== */
  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { itemGUID: "", quantity: 1, price: 0, width: "", height: "" },
    ]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const totalSum = orderItems.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async () => {
    setLoading(true);

    const dto = {
      OrderNumber: `ORD-${Date.now()}`,
      OrderContrAgentGUID: selectedContragent,
      OrderIbanGUID: selectedIban,
      AddressGUID: selectedAddress,
      OrderSuma: totalSum,
      InternalComment: internalComment,
      OrderPaymentDate: paymentDate || null,
      OrderDeliveryDate: deliveryDate || null,
      OrderItemsLIST: orderItems.map((i) => ({
        ItemGUID: i.itemGUID,
        Count: Number(i.quantity) || 0,
        Price: Number(i.price) || 0,
        Width: i.width || null,
        Height: i.height || null,
      })),
      OrderCreateDate: new Date().toISOString(),
    };

    try {
      await axiosInstance.post("/customerbill/create", dto);
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="bill-modal-overlay">
      <div className="bill-modal-window">
        {/* ===== HEADER ===== */}
        <div className="bill-modal-header">
          <h3>
            🧾 Створення рахунку
            <span className="step-info"> • крок {step} з 3</span>
          </h3>
          <button className="bill-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ===== BODY (SCROLLABLE) ===== */}
        <div className="bill-form-scroll">
          <div className="bill-form">
            {/* STEP 1 */}
            {step === STEPS.BASE && (
              <>
                <div className="bill-field">
                  <span className="bill-field__label">IBAN</span>
                  <BillSelect
                    value={selectedIban}
                    options={ibans}
                    placeholder="— оберіть IBAN —"
                    getValue={(i) => i.AccountGUID}
                    getLabel={(i) =>
                      `${i.NumberBills} — ${i.AccountName}`
                    }
                    onChange={setSelectedIban}
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">Адреса</span>
                  <BillSelect
                    value={selectedAddress}
                    options={addresses}
                    placeholder="— оберіть адресу —"
                    getValue={(a) => a.AddressKindGUID}
                    getLabel={(a) =>
                      `${a.AddressKind} — ${a.AddressValue}`
                    }
                    onChange={setSelectedAddress}
                  />
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === STEPS.ITEMS && (
              <>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="series-list-product">
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(idx)}
                      title="Видалити позицію"
                    >
                      ✕
                    </button>

                    {/* Товар */}
                    <div className="bill-field full">
                      <span className="bill-field__label">Товар</span>
                      <BillItemSelect
                        value={item.itemGUID}
                        items={itemsList}
                        placeholder="— оберіть товар —"
                        onChange={(val) =>
                          handleItemChange(idx, "itemGUID", val)
                        }
                      />
                    </div>

                    {/* К-сть + Ціна */}
                    <div className="bill-field">
                      <span className="bill-field__label">К-сть</span>
                      <input
                        type="number"
                        min="1"
                        className="bill-input"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">Ціна</span>
                      <input
                        type="text"
                        className="bill-input"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "price",
                            e.target.value.replace(/[^0-9.]/g, "")
                          )
                        }
                      />
                    </div>

                    {/* Ширина + Висота */}
                    <div className="bill-field">
                      <span className="bill-field__label">
                        Ширина (мм)
                      </span>
                      <input
                        type="number"
                        className="bill-input"
                        value={item.width}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "width",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">
                        Висота (мм)
                      </span>
                      <input
                        type="number"
                        className="bill-input"
                        value={item.height}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "height",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                <button
                  className="add-product-btn"
                  onClick={handleAddItem}
                >
                  ➕ Додати позицію
                </button>
              </>
            )}

            {/* STEP 3 */}
            {step === STEPS.CONFIRM && (
              <>
                <div className="bill-field">
                  <span className="bill-field__label">
                    Сума рахунку
                  </span>
                  <input
                    className="bill-input"
                    disabled
                    value={totalSum.toFixed(2)}
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">
                    Дата оплати
                  </span>
                  <input
                    type="date"
                    className="bill-input"
                    value={paymentDate}
                    onChange={(e) =>
                      setPaymentDate(e.target.value)
                    }
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">
                    Дата відвантаження
                  </span>
                  <input
                    type="date"
                    className="bill-input"
                    value={deliveryDate}
                    onChange={(e) =>
                      setDeliveryDate(e.target.value)
                    }
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">
                    Коментар
                  </span>
                  <textarea
                    className="bill-textarea"
                    value={internalComment}
                    onChange={(e) =>
                      setInternalComment(e.target.value)
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="bill-modal-footer">
          {step > 1 && (
            <button
              className="bill-btn-cancel"
              onClick={() => setStep(step - 1)}
            >
              ← Назад
            </button>
          )}

          {step < 3 && (
            <button
              className="bill-btn-save"
              onClick={() => setStep(step + 1)}
            >
              Далі →
            </button>
          )}

          {step === 3 && (
            <button
              className="bill-btn-save"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Створюємо…" : "Створити рахунок"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
