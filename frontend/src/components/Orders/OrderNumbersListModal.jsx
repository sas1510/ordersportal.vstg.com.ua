import React from "react";
import { useTranslation } from "react-i18next";

export default function OrderNumbersListModal({
  isOpen,
  onClose,
  numbers = [],
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/35 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[18px] bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#7b7b7b]">
              {t("portal_calc.ui.orders")}
            </div>
            <div className="text-[18px] font-bold text-[#234461]">
              {t("portal_calc.ui.order_numbers")}
            </div>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[22px] leading-none text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
            onClick={onClose}
            aria-label={t("portal_calc.ui.close_order_numbers")}
          >
            ×
          </button>
        </div>

        <div className="max-h-[320px] overflow-y-auto rounded-[14px] bg-[#f8fafc] px-4 py-3">
          <div className="flex flex-col gap-2">
            {numbers.map((number) => (
              <div
                key={number}
                className="rounded-[10px] bg-white px-3 py-2 text-[15px] font-semibold text-[#234461] shadow-sm"
              >
                {number}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
