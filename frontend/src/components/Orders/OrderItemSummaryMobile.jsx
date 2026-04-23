// ================= OrderItemSummaryMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
// --- НОВИЙ ІМПОРТ ---
import ConfirmModal from "./ConfirmModal";
import OrderFilesModal from "./OrderFilesModal";
// --------------------
import OrderDetailsDesktop from "./OrderDetailsDesktop";
import { formatMoney, formatMoney2 } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import { CalculationMenu } from "./CalculationMenu";
import AddClaimModal from "../Reclamations/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from "./OrderDetailsMobile";
import { formatDateHumanShorter } from "../../utils/formatters";
import PaymentModal from "./PaymentModal";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

// КРОК 1: Обгортаємо функціональний компонент у React.memo
export default React.memo(function OrderItemSummaryMobile({ order, calculationDate, onRefresh }) {
  const { addNotification } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // --- ДОДАНО СТАН ДЛЯ МОДАЛКИ ФАЙЛІВ ---
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const windowsIcon = "/assets/icons/WindowsIconCalc.png";
    const listCalcIcon = "/assets/icons/ListCalcIcon.png";
    const moneyCalcIcon = "/assets/icons/MoneyCalcIcon.png";
    const historyOfMessage = "/assets/icons/HistoryOfMessageIcon.png";
    const fileIcon = "/assets/icons/FileIcon.png";
    const recipientIcon = "/assets/icons/RecipientIcon.png";

    const moneyGreen = "/assets/icons/MoneyGreen.png";
    const moneyRed = "/assets/icons/MoneyRed.png";
    const speedIcon = "/assets/icons/SpeedIcon.png";
    const openDetails = "/assets/icons/OpenDetailsOrdersIcon.png";


  // ------------------------------------
  const [claimOrderNumber, setClaimOrderNumber] = useState("");
  const { user, role } = useAuthGetRole();
  const _isAdmin = role === "admin";
  // 1. Мемоїзація простого обробника стану
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);


  const dateDiffStatus = useMemo(() => {
    // Перевіряємо наявність обох дат
    if (!order.date || !calculationDate) return null;

    const d1 = new Date(calculationDate);
    const d2 = new Date(order.date);

    // Різниця в мілісекундах перетворена в дні
    const diffInDays = (d2 - d1) / (1000 * 60 * 60 * 24);

    // Якщо замовлення зроблено протягом 24 годин (<= 1 дня) — true (радісний)
    return diffInDays <= 1;
  }, [order.date, calculationDate]);

  const getButtonState = useCallback((status) => {
    // Всі кнопки за замовчуванням вимкнені
    const state = {
      confirm: false,
      pay: false,
      reorder: false,
      claim: false,
    };

    // Логіка на основі статусу
    const statusConfig = {
      Новий: { confirm: true, pay: true },
      "Очікуємо підтвердження": { confirm: true, pay: true },
      Підтверджений: { confirm: true, pay: true, reorder: true },
      "Очікуємо оплату": { pay: true, reorder: true },
      Оплачено: { pay: true, reorder: true },
      Готовий: { pay: true, reorder: true },
      Відвантажений: { pay: true, reorder: true, claim: true },
    };

    // Якщо статус є в конфігу — застосовуємо значення
    if (statusConfig[status]) {
      Object.assign(state, statusConfig[status]);
    }

    return state;
  }, []);

  // 5. Мемоїзація обчислення боргу (без змін)
  const debtAmount = useMemo(() => {
    const paid = order.paid ?? 0;
    const debt = parseFloat(order.amount) - parseFloat(paid);
    return Math.max(0, Math.round(debt * 100) / 100);
  }, [order.amount, order.paid]);

  // 3. Мемоїзація результату обчислення стану кнопок (без змін)
  const buttonState = useMemo(() => {
    const state = getButtonState(order.status);

    // Блокувати оплату, якщо борг 0
    if (debtAmount <= 0) {
      state.pay = false;
    }

    return state;
  }, [order.status, debtAmount, getButtonState]);

  // 4. Мемоїзація функції стилю статусу (без змін)
  const getStatusClass = useCallback((status) => {
      switch (status) {
        case "Новий":
  
  
          return "text-WS---DarkBlue";
          
        case "Очікуємо підтвердження":
          return "text-WS---Orange";
        case "Очікуємо оплату":
          return "text-WS---DarkRed";
  
        case "Підтверджений":
          return "text-WS---DarkGrey";
  
        case "У виробництві":
          return "text-WS---DarkBlueProfile"
        case "В обробці":
  
  
        case "Відмова":
          return "text-WS---MiddleGrey";
  
        case "Готовий":
          return "text-WS---DarkGreen";
        case "Відвантажений":
          return "text-WS---DarkPurple";
  
        default:
          return "text-WS---MiddleGrey ";
      }
    }, []);

  const openPaymentModal = useCallback((e) => {
    e.stopPropagation();
    setIsPaymentOpen(true);
  }, []);

  const handlePaymentConfirm = async (contractID, amount) => {
    console.log("ОПЛАТА:", {
      contractID,
      amount,
      orderID: order.idGuid,
    });

    try {
      await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: order.idGuid,
        amount: Number(amount),
      });

      addNotification("Оплату успішно виконано!", "success");
      setIsPaymentOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      addNotification("Оплату успішно виконано!", "success");
    }
  };

  // 6. Мемоїзація обробників модальних вікон
  const openClaimModal = useCallback(() => {
    setClaimOrderNumber(order.number);
    setIsClaimModalOpen(true);
  }, [order.number]);

  const openReorderModal = useCallback(() => {
    setIsReorderModalOpen(true);
  }, []);

  const openConfirmModal = useCallback((e) => {
    e.stopPropagation();
    setIsConfirmModalOpen(true);
  }, []);

  // 🔥 НОВИЙ ОБРОБНИК: Відкриття модалки файлів
  const openFilesModal = useCallback((e) => {
    e.stopPropagation(); // Запобігаємо згортанню/розгортанню рядка
    setIsFilesModalOpen(true);
  }, []);
  // ------------------------------------------------

  // 7. Мемоїзація обробника збереження дозамовлення (без змін)
  const handleReorderSave = useCallback(
    (formData) => {
      console.log("Дозамовлення по замовленню", order.number, formData);
      setIsReorderModalOpen(false);
      // Тут повинна бути функція оновлення батьківського компонента
    },
    [order.number],
  );

  // --- НОВИЙ ОБРОБНИК: Відправка підтвердження API (без змін) ---
  const handleConfirmOrder = useCallback(async () => {
    // Модалка закриється через onConfirm у компоненті ConfirmModal

    try {
      // Припускаємо, що API очікує лише POST-запит для зміни статусу
      const response = await axiosInstance.post(
        `/orders/${order.idGuid}/confirm/`,
      );

      if (response.status === 200 || response.status === 204) {
        addNotification(
          `Замовлення ${order.number} успішно підтверджено!`,
          "success",
        );

        if (onRefresh) onRefresh();
        // !!! ТУТ МАЄ БУТИ ВИКЛИК ФУНКЦІЇ ОНОВЛЕННЯ БАТЬКІВСЬКОГО СПИСКУ !!!
      } else {
        addNotification(
          `⚠️ Не вдалося підтвердити замовлення: ${response.data.error || response.statusText}`,
          "error",
        );
      }
    } catch (error) {
      addNotification(`Помилка підтвердження: ${error.message}`, "error");
    }
  }, [order.idGuid, order.number]);

  return (
    <div className="order-item flex flex-col w-full gap-0 !border-0">
      {/* ============ MOBILE VERSION (COMPACT & UPDATED BUTTONS) ============ */}
      <div
        className="md:hidden flex flex-col w-full p-1 "
        onClick={toggleExpand}
        
      >

        <div className="flex items-stretch justify-between mb-1 w-full gap-3  pb-1 border-bottom ">
          
          {/* 1. ЛІВА ЧАСТИНА: Номер та Дата + Бордюр справа */}
          <div className="flex flex-[2] items-center pr-1  border-right shrink-0">
             <img src={listCalcIcon} className="align-center mr-2"  alt="" />
            <div className="flex  flex-col gap-[6px] no-wrap w-full">
  
              <div className="text-[15px] w-full font-bold pb-1 no-wrap text-WS---DarkGrey border-bottom leading-tight">
                № {order.number}
              </div>
              <div className="text-[11px] text-WS---DarkGrey">
                 {formatDateHumanShorter(order.date)}
              </div>
            </div>
          </div>

            <div className="flex flex-col items-center pt-2 justify-center pr-2 border-right flex-1">
              <div className="flex items-center gap-2 no-wrap">
                <img src={windowsIcon} className="align-center mr-2"  alt="" />
                <span className="font-size-24 font-bold text-WS---DarkBlue">
                  {order.count}
                </span>
              </div>
              <span className="text-grey text-[10px] mt-1">Конструкції</span>
            </div>

            <div 
              className="flex items-center gap-2 text-center justify-center pt-2 flex-1 pb-[17px] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={openFilesModal}

            >
       
             <img src={fileIcon} className="align-center mr-2"  alt="" />
            
              <div className="text-[13px] text-dark">Файли</div>
            </div>



          </div>

          <div className="flex items-stretch justify-between  w-full gap-2   py-2">
  
  {/* 1. Сума замовлення */}
  <div className="flex items-center gap-2 pr-1 border-right  flex-1">
    <img src={moneyGreen} className=" mr-1" alt="" />
    <div className="flex flex-col">
      <div className="text-WS---DarkGreen text-[14px] font-bold leading-tight">
        {formatMoney2(order.amount, order.currency)}
      </div>
      <div className="text-grey text-[8px]">Сума замовлення</div>
    </div>
  </div>

  {/* 2. Сума боргу */}
  <div className="flex items-center gap-2 px-1 border-right flex-1">
    {/* Тут використовуємо червону іконку монет, якщо вона є, або ту саму */}
    <img src={moneyRed} className="mr-1" alt="" /> 
    <div className="flex flex-col">
      <div className="text-WS---DarkRed  text-[14px] font-bold leading-tight">
        {formatMoney2(debtAmount, order.currency)}
      </div>
      <div className="text-grey text-[8px]">Сума боргу</div>
    </div>
  </div>

  {/* 3. Статус */}
<div className="flex items-center gap-2 pl-3 flex-1">
  <span className={`icon-info-with-circle font-size-24 mr-2 shrink-0 ${getStatusClass(order.status)}`}></span>
  <div className={`font-size-14 leading-tight ${getStatusClass(order.status)}`}>
    {order.status}
  </div>
</div>

</div>
        {/* Header - Номер і статус (без змін) */}
        {/* <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="icon icon-news font-size-18 text-success"></span>
            <div className="text-info font-weight-bold font-size-16">
              {order.number}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="icon-info-with-circle font-size-16 text-info"></span>
            <div
              className={`font-size-14 font-weight-medium ${getStatusClass(order.status)}`}
            >
              {order.status}
            </div>
          </div>
        </div> */}

        {/* Дата і кількість (без змін) */}
       
        {/* Фінанси (без змін) */}
      

        {/* PDF та Файли */}

        {/* КНОПКИ (Сітка 2х2 + Швидке оформлення) */}
<div 
  className="flex items-center gap-3 " 
  onClick={(e) => e.stopPropagation()}
>
  {/* Ліва частина: Сітка кнопок 2х2 */}
  <div className="grid grid-cols-2-btn gap-8 flex-grow">
    {user?.role !== "admin" ? (
      <>
        {/* Підтвердити */}
        <button
          className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkGrey text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50"
          disabled={!buttonState.confirm}
          onClick={openConfirmModal}
        >
          Підтвердити
        </button>

        {/* Сплатити */}
        <button
          className="h-[31px] flex items-center font-['Inter']  justify-center px-2 bg-WS---DarkGreen text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50"
          disabled={!buttonState.pay}
          onClick={openPaymentModal}
        >
          Сплатити
        </button>
      </>
    ) : (
      <div className="col-span-2"></div> // Заглушка для адміна, щоб зберегти сітку
    )}

    {/* Дозамовлення */}
    <button
      className="h-[31px] flex items-center font-['Inter'] justify-center px-2 bg-WS---DarkBlue text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50"
      disabled={!buttonState.reorder}
      onClick={(e) => {
        e.stopPropagation();
        openReorderModal();
      }}
    >
      Дозамовлення
    </button>

    {/* Рекламація */}
    <button
      className="h-[31px] flex items-center font-['Inter']  justify-center  px-2 bg-WS---DarkRed text-white rounded-[5px] font-medium text-[14px] leading-tight disabled:opacity-50"
      disabled={!buttonState.claim}
      onClick={(e) => {
        e.stopPropagation();
        openClaimModal();
      }}
    >
      Рекламація
    </button>
  </div>

  {/* Права частина: Швидке оформлення */}
<div 
    className="flex flex-col items-center justify-center min-w-[40px] text-center gap-1 cursor-help"
    title={
      dateDiffStatus
        ? "Швидке оформлення (менше доби)"
        : "Замовлення оформлено пізніше ніж через добу"
    }
  >
    {dateDiffStatus === null ? null : (
      <div className="bg-white p-1 rounded-sm overflow-hidden flex items-center justify-center">
        <img 
          src={speedIcon} 
          alt="Іконка швидкості"
          className=" block"
          style={{ 
            /* 🔥 ЗАСТОСУВАННЯ КОЛЬОРУ ЧЕРЕЗ ФІЛЬТР */
            /* Якщо dateDiffStatus === true (зелений), інакше — червоний */
            filter: dateDiffStatus
              ? 'invert(34%) sepia(87%) saturate(372%) hue-rotate(33deg) brightness(95%) contrast(91%)' /* Зелений #5A7302 */
              : 'invert(38%) sepia(58%) saturate(651%) hue-rotate(325deg) brightness(90%) contrast(85%)'  /* Червоний #BC553D */
          }}
        />
      </div>
    )}
    <span className="text-[9px] leading-none text-gray-500 font-medium whitespace-nowrap">
      Швидке<br/>оформлення
    </span>
  </div>
</div>
        

        {/* КНОПКИ (Скролл-меню) (без змін) */}
      

        {/* Індикатор розкриття (без змін) */}
<div className="flex justify-center mt-4 cursor-pointer" >
  <img 
    src={openDetails} 
    alt="Деталі"
    className={`block transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}

  />
</div>
      </div>

      {/* Деталі замовлення */}
      {isExpanded && (
                <div className="separator-border w-full mt-2">
        <div className="mt-2 pt-2 flex w-full ">
          <OrderDetailsMobile order={order} />
        </div>
        </div>
      )}

      {/* Модальні вікна */}

      {/* 🔥 1. Модалка Файлів */}
      {isFilesModalOpen && (
        <OrderFilesModal
          orderGuid={order.idGuid}
          onClose={() => setIsFilesModalOpen(false)}
        />
      )}

      {/* 2. Універсальна Модалка Підтвердження (без змін) */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmOrder}
        title="Підтвердження замовлення"
        message={`Ви впевнені, що бажаєте підтвердити замовлення ${order.number}? Це змінить його статус.`}
        confirmText="Підтвердити"
        type="success"
      />

      {/* 3. Модалка Рекламації (без змін) */}
      <AddClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSave={() => {
          /* Логіка оновлення */
        }}
        initialOrderNumber={claimOrderNumber}
      />

      {/* 4. Модалка Дозамовлення (без змін) */}
      <AddReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        onSave={handleReorderSave}
      />

      {isPaymentOpen && (
        <PaymentModal
          order={{
            OrderNumber: order.number,
            DebtAmount: debtAmount,
            OrderID: order.idGuid,
            CurrencyName: order.currency,
          }}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handlePaymentConfirm}
          formatCurrency={formatMoney}
        />
      )}
    </div>
  );
});
