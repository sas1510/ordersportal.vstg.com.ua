import React from "react";
import "./PaymentRowCard.css";

const formatDate = (d) => new Date(d).toLocaleDateString("uk-UA");
const formatCurrency = (n) =>
  new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2 }).format(n);

const PaymentRowCard = ({ item }) => {
  return (
    <div className="payment-card">

      {/* HEADER */}
      <div className="payment-card-header row jc-space-between ai-center">
        <div className="font-bold">
          {item.ВидДокумента || "Документ"}
        </div>

        <div className={`status-badge ${item.InOut === "Прихід" ? "success" : "danger"}`}>
          {item.InOut}
        </div>
      </div>

      {/* MAIN INFO */}
      <div className="payment-card-body column">

        <div className="payment-row">
          <span className="label">Дата:</span>
          <span>{formatDate(item.ДатаДок)}</span>
        </div>

        <div className="payment-row">
          <span className="label">Документ:</span>
          <span>{item.НомерДок}</span>
        </div>

        <div className="payment-row">
          <span className="label">Договір:</span>
          <span>{item.FinalDogovorName}</span>
        </div>

        <div className="payment-row">
          <span className="label">Сума документа:</span>
          <span className={item.SignSumDoc < 0 ? "text-red" : "text-green"}>
            {formatCurrency(item.SumDoc)}
          </span>
        </div>

        <div className="payment-row">
          <span className="label">Дельта:</span>
          <span className={item.DeltaRow < 0 ? "text-red" : "text-green"}>
            {formatCurrency(item.DeltaRow)}
          </span>
        </div>

        <div className="payment-row">
          <span className="label">Накопичене сальдо:</span>
          <span className={item.CumSaldo < 0 ? "text-red" : "text-green"}>
            {formatCurrency(item.CumSaldo)}
          </span>
        </div>

        {item.DealType && (
          <div className="payment-row">
            <span className="label">Тип операції:</span>
            <span>{item.DealType}</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default PaymentRowCard;
