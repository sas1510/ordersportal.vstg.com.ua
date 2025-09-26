import React, { useState } from "react";
import { OrderTimeline } from "./OrderTimeline";

export function SubOrderCard({ sub }) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  return (
    <div className="border rounded-md bg-gray-50 p-3 mb-3">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">#{sub.id}</div>
          <div className="text-sm text-gray-500">{sub.date}</div>
          <div className="text-sm text-indigo-600 font-semibold">{sub.amount.toLocaleString()} грн.</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm px-2 py-1 bg-white rounded text-gray-700 border">{sub.status}</div>
          {/* <button className="text-sm text-blue-600">{open ? "Згорнути" : "Розгорнути"}</button> */}
          <button
              // onClick={() => onUpdateStatus(order.id, "Підтверджено")}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Підтвердити
            </button>
            <button
              // onClick={() => onUpdateStatus(order.id, "Скасовано")}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Скасувати
            </button>
            <button className="px-3 py-1 bg-blue-500 text-white rounded">
              Дозамовлення
            </button>
            <button className="px-3 py-1 bg-yellow-500 text-white rounded">
              Рекламація
            </button>
        </div>
      </div>


      {open && (
        <div className="mt-3">
          <div className="text-sm text-gray-700 mb-2">Кількість позицій: {sub.items} • <span className="text-gray-500">{sub.pdf}</span></div>
          <OrderTimeline steps={sub.steps} activeIndex={activeStep} onStepClick={(i)=> setActiveStep(i===activeStep? null : i)} />

          {activeStep !== null && (
            <div className="mt-3 p-3 bg-white border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">{sub.steps[activeStep].name}</div>
                  <div className="text-xs text-gray-500">{sub.steps[activeStep].date || "Дата не вказана"}</div>
                </div>
                <button className="text-sm text-gray-600" onClick={() => setActiveStep(null)}>Закрити</button>
              </div>
              <div className="mt-2 text-sm text-gray-700">{sub.steps[activeStep].details}</div>
                    
            </div>
          )}
        </div>
      )}
    </div>
  );
}
