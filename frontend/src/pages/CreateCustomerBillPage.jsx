import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export default function CreateCustomerBillPage() {
  const [addresses, setAddresses] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [contragents, setContragents] = useState([]);
  const [ibans, setIbans] = useState([]);

  const [selectedContragent, setSelectedContragent] = useState("");
  const [selectedIban, setSelectedIban] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [orderItems, setOrderItems] = useState([
    { itemGUID: "", name: "", quantity: 1, price: 0, height: 0, width: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await axiosInstance.get("/customerbill/info", {
          params: { kodKontr: "" },
        });
        const data = res.data;

        setAddresses(data.filter((d) => d.type === "Address"));
        setItemsList(data.filter((d) => d.type === "Item"));
        setContragents(data.filter((d) => d.type === "Contragent"));
        setIbans(data.filter((d) => d.type === "Iban"));
      } catch (err) {
        console.error(err);
        alert("Помилка при завантаженні списків");
      }
    };
    fetchLists();
  }, []);

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { itemGUID: "", name: "", height: 0, width: 0, quantity: 1, price: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const totalSum = orderItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 0),
    0
  );

  const handleSubmit = async () => {
    setLoading(true);
    const dto = {
      OrderNumber: `ORD-${Date.now()}`,
      OrderContrAgent: selectedContragent,
      OrderIban: selectedIban,
      Address: selectedAddress,
      OrderSuma: totalSum,
      InternalComment: internalComment,
      OrderPaymentDate: paymentDate,
      OrderDeliveryDate: deliveryDate,
      OrderItemsLIST: orderItems.map((i) => ({
        ItemGUID: i.itemGUID,
        Price: parseFloat(i.price) || 0,
        Count: parseInt(i.quantity) || 0,
        Height: parseInt(i.height) || 0,
        Width: parseInt(i.width) || 0,
      })),
      OrderCreateDate: new Date().toISOString(),
    };

    try {
      await axiosInstance.post("/customerbill/create", dto);
      alert("Рахунок створено успішно!");
      setSelectedContragent("");
      setSelectedIban("");
      setSelectedAddress("");
      setPaymentDate("");
      setDeliveryDate("");
      setInternalComment("");
      setOrderItems([
        { itemGUID: "", name: "", height: 0, width: 0, quantity: 1, price: 0 },
      ]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Помилка при створенні рахунку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Контрагент */}
      <div className="mt-2">
        <label>Контрагент: </label> <br />
        <select
          value={selectedContragent}
          onChange={(e) => setSelectedContragent(e.target.value)}
          className="border p-1 ml-2 w-full"
        >
          <option value="">-- оберіть контрагента --</option>
          {contragents.map((c) => (
            <option key={c.guid} value={c.guid}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* IBAN */}
      <div className="mt-2">
        <label>IBAN: </label> <br />
        <select
          value={selectedIban}
          onChange={(e) => setSelectedIban(e.target.value)}
          className="border p-1 ml-2 w-full"
        >
          <option value="">-- оберіть IBAN --</option>
          {ibans.map((iban) => (
            <option key={iban.guid} value={iban.name}>
              {iban.name}
            </option>
          ))}
        </select>
      </div>

      {/* Адреса */}
      <div className="mt-2">
        <label>Адреса: </label> <br />
        <select
          value={selectedAddress}
          onChange={(e) => setSelectedAddress(e.target.value)}
          className="border p-1 ml-2 w-full"
        >
          <option value="">-- оберіть адресу --</option>
          {addresses.map((addr) => (
            <option key={addr.guid} value={addr.guid}>
              {addr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Далі йдуть товари (orderItems) */}
      {orderItems.map((item, idx) => (
        <div key={idx} className="border p-2 mt-2">
          <h4>Позиція {idx + 1}</h4>
          <label>Найменування:</label>
          <select
            value={item.itemGUID}
            onChange={(e) => {
              handleItemChange(idx, "itemGUID", e.target.value);
              const selected = itemsList.find((i) => i.guid === e.target.value);
              handleItemChange(idx, "name", selected ? selected.name : "");
            }}
            className="border p-1 w-full"
          >
            <option value="">-- оберіть товар --</option>
            {itemsList.map((i) => (
              <option key={i.guid} value={i.guid}>
                {i.name}
              </option>
            ))}
          </select>

          <label>Висота (мм):</label>
          <input
            type="number"
            min="0"
            step="1"
            value={item.height}
            onChange={(e) => handleItemChange(idx, "height", e.target.value)}
            className="border p-1 w-full"
          />

          <label>Ширина (мм):</label>
          <input
            type="number"
            min="0"
            step="1"
            value={item.width}
            onChange={(e) => handleItemChange(idx, "width", e.target.value)}
            className="border p-1 w-full"
          />

          <label>К-сть:</label>
          <input
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
            className="border p-1 w-full"
          />

          <label>Ціна:</label>
          <input
            type="text"
            value={item.price}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, "");
              const cleaned = raw.replace(/^0+(?=\d)/, "");
              handleItemChange(idx, "price", cleaned === "" ? 0 : cleaned);
            }}
            className="border p-1 w-full"
          />
        </div>
      ))}

      <button
        onClick={handleAddItem}
        className="bg-blue-500 text-white p-2 rounded mt-2"
      >
        Додати позицію
      </button>

      <div className="mt-2">
        <label>Сума рахунку:</label>
        <input
          type="number"
          value={totalSum.toFixed(2)}
          disabled
          className="border p-1 bg-gray-100 w-full"
        />
      </div>

      <div className="mt-2">
        <label>Дата оплати:</label>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mt-2">
        <label>Дата відвантаження:</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mt-2">
        <label>Внутрішній коментар:</label>
        <input
          type="text"
          value={internalComment}
          onChange={(e) => setInternalComment(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white p-2 rounded mt-4"
      >
        {loading ? "Створюємо..." : "Створити рахунок"}
      </button>
    </div>
  );
}
