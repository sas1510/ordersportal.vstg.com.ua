// ================= OrderItemSummaryMobile.jsx (Final Optimization) =================
import React, { useState, useCallback, useMemo } from "react";
// --- НОВИЙ ІМПОРТ ---
import ConfirmModal from "./ConfirmModal"; 
import OrderFilesModal from "./OrderFilesModal"; // 🔥 ІМПОРТ МОДАЛКИ ФАЙЛІВ
// --------------------
import OrderDetailsDesktop from './OrderDetailsDesktop';
import { formatMoney } from "../../utils/formatMoney";
import CommentsModal from "./CommentsModal";
import {CalculationMenu} from "./CalculationMenu";
import AddClaimModal from "../Complaint/AddClaimModal";
import AddReorderModal from "../AdditionalOrder/AddReorderModal";
import axiosInstance from "../../api/axios";
import OrderDetailsMobile from './OrderDetailsMobile';
import {formatDateHumanShorter} from '../../utils/formatters'


// КРОК 1: Обгортаємо функціональний компонент у React.memo
export default React.memo(function OrderItemSummaryMobile ({ order }) {
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    // --- ДОДАНО СТАН ДЛЯ МОДАЛКИ ФАЙЛІВ ---
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false); 
    // ------------------------------------
    const [claimOrderNumber, setClaimOrderNumber] = useState("");
    
    // 1. Мемоїзація простого обробника стану
    const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);
    
    // 2. Мемоїзація функції, що обчислює доступність кнопок (без змін)
    const getButtonState = useCallback((status) => {
        const state = { confirm: false, pay: false, reorder: false, claim: false };
        switch (status) {
            case "Новий":
            case "Очікуємо підтвердження":
                state.confirm = true;
                break;
            case "Підтверджений":
                state.pay = true;
                state.claim = true;
                break;
            case "Очікуємо оплату":
                state.pay = true;
                break;
            case "Оплачено":
            case "Готовий":
            case "Відвантажений":
                state.reorder = true;
                if (status === "Відвантажений") state.claim = true;
                break;
            default:
                break;
        }
        return state;
    }, []); 

    // 3. Мемоїзація результату обчислення стану кнопок (без змін)
    const buttonState = useMemo(() => getButtonState(order.status), [order.status, getButtonState]);

    // 4. Мемоїзація функції стилю статусу (без змін)
    const getStatusClass = useCallback((status) => {
        switch (status) {
            case "Новий": case "В обробці": case "У виробництві": case "Підтверджений": return "text-info";
            case "Очікуємо оплату": case "Очікуємо підтвердження": case "Відмова": return "text-danger";
            case "Готовий": case "Відвантажений": return "text-success";
            default: return "text-grey";
        }
    }, []); 

    // 5. Мемоїзація обчислення боргу (без змін)
    const debtAmount = useMemo(() => {
        const paid = order.paid ?? 0;
        const debt = parseFloat(order.amount) - parseFloat(paid);
        return Math.max(0, Math.round(debt * 100) / 100); 
    }, [order.amount, order.paid]);

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
    const handleReorderSave = useCallback((formData) => {
        console.log("Дозамовлення по замовленню", order.number, formData);
        setIsReorderModalOpen(false);
        // Тут повинна бути функція оновлення батьківського компонента
    }, [order.number]);

    // --- НОВИЙ ОБРОБНИК: Відправка підтвердження API (без змін) ---
    const handleConfirmOrder = useCallback(async () => {
        // Модалка закриється через onConfirm у компоненті ConfirmModal
        
        try {
            // Припускаємо, що API очікує лише POST-запит для зміни статусу
            const response = await axiosInstance.post(`/orders/${order.id}/confirm/`);
            
            if (response.status === 200 || response.status === 204) {
                alert(`✅ Замовлення ${order.number} успішно підтверджено!`);
                // !!! ТУТ МАЄ БУТИ ВИКЛИК ФУНКЦІЇ ОНОВЛЕННЯ БАТЬКІВСЬКОГО СПИСКУ !!!
            } else {
                 alert(`⚠️ Не вдалося підтвердити замовлення: ${response.data.error || response.statusText}`);
            }
        } catch (error) {
            alert(`❌ Помилка з'єднання: ${error.message}`);
        }
        
    }, [order.id, order.number]);


    return (
        <div className="order-item flex flex-col w-full gap-0">
        
            {/* ============ MOBILE VERSION (COMPACT & UPDATED BUTTONS) ============ */}
            <div className="md:hidden flex flex-col w-full p-3 bg-white rounded-lg shadow-sm border border-gray-200"
                onClick={toggleExpand}>
                
                {/* Header - Номер і статус (без змін) */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="icon icon-news font-size-18 text-success"></span>
                        <div className="text-info font-weight-bold font-size-16">{order.number}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="icon-info-with-circle font-size-16 text-info"></span>
                        <div className={`font-size-14 font-weight-medium ${getStatusClass(order.status)}`}>
                            {order.status}
                        </div>
                    </div>
                </div>

                {/* Дата і кількість (без змін) */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                    <div className="text-danger font-size-18">{formatDateHumanShorter(order.date)}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="icon-layout5 font-size-18 text-info"></span>
                        <span className="font-size-16 text-danger font-weight-medium">{order.count} конст.</span>
                    </div>
                </div>

                {/* Організація/Менеджер (без змін) */}
                {(order.organizationName || order.managerName) && (
                    <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-gray-200">
                        {order.organizationName && (
                            <div className="flex flex-col p-2 bg-blue-50 rounded">
                                <div classNameošs="font-size-18 font-weight-medium text-dark leading-tight">
                                    <span className="fas fa-building font-size-18 text-info mr-1"></span>
                                    {order.organizationName}
                                </div>
                            </div>
                        )}
                        {order.managerName && (
                            <div className="flex flex-col p-2 bg-purple-50 rounded">
                                <div className="font-size-18 font-weight-medium text-dark leading-tight">
                                    <span className="fas fa-user-tie font-size-18 text-success mr-1"></span>
                                    {order.managerName}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Фінанси (без змін) */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="icon icon-coin-dollar text-success font-size-14"></span>
                            <span className="text-grey font-size-16">Сума</span>
                        </div>
                        <div className="text-info font-size-18 font-weight-bold">
                            {formatMoney(order.amount)}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="icon icon-coin-dollar text-danger font-size-14"></span>
                            <span className="text-grey font-size-16">Борг</span>
                        </div>
                        <div className="text-danger font-size-18 font-weight-bold">
                            {formatMoney(debtAmount)} 
                        </div>
                    </div>
                </div>

                {/* PDF та Файли */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    {/* PDF (без змін) */}
                    {/* <div className="flex items-center gap-1.2 p-1.5 bg-gray-50 rounded"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="icon-document-file-pdf font-size-16 text-red"></div>
                        <div className="font-size-14 text-grey">{order.name}.pdf</div>
                    </div>
                     */}
                    {/* Файли (Клікабельна кнопка) */}
                    <div 
                        className="flex items-center gap-1.2 p-1.5 bg-gray-100 rounded-md cursor-pointer transition-colors"
                        onClick={openFilesModal} // 🔥 ПРИВ'ЯЗКА
                    >
                        <div className="icon-download font-size-18 text-red"></div>
                        <div className="font-size-14 text-info underline">Файли</div>
                    </div>
                </div>

                {/* КНОПКИ (Скролл-меню) (без змін) */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 py-[2px] -mx-3 px-3 mobile-buttons-scroll"
                    onClick={(e) => e.stopPropagation()}>

                    {/* Підтвердити */}
                    <button 
                        className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-success text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        disabled={!buttonState.confirm}
                        onClick={openConfirmModal}
                    >
                        Підтвердити
                    </button>

                    {/* Сплатити */}
                    <button 
                        className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-warning text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        disabled={!buttonState.pay}
                    >
                        Сплатити
                    </button>

                    {/* Дозамовлення */}
                    <button 
                        className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-info text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        disabled={!buttonState.reorder}
                        onClick={(e) => { e.stopPropagation(); openReorderModal(); }}
                    >
                        Дозамовлення
                    </button>

                    {/* Рекламація */}
                    <button 
                        className="grow shrink-0 basis-0 h-6 flex items-center justify-center px-1.5 background-danger text-white rounded font-size-12 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-center mr-3"
                        disabled={!buttonState.claim}
                        onClick={(e) => { e.stopPropagation(); openClaimModal(); }}
                    >
                        Рекламація
                    </button>

                </div>


                {/* Індикатор розкриття (без змін) */}
                <div className="flex justify-center mt-1.5">
                    <span className={`icon ${isExpanded ? 'icon-chevron-up' : 'icon-chevron-down'} font-size-12 text-grey`}></span>
                </div>
            </div>

            {/* Деталі замовлення */}
            {isExpanded && (
                <div className="mt-2 pt-2 border-t flex w-full border-dashed border-gray-300">
                    <OrderDetailsMobile order={order} />
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
                onSave={() => { /* Логіка оновлення */ }}
                initialOrderNumber={claimOrderNumber}
            />

            {/* 4. Модалка Дозамовлення (без змін) */}
            <AddReorderModal
                isOpen={isReorderModalOpen}
                onClose={() => setIsReorderModalOpen(false)}
                onSave={handleReorderSave} 
            />
        </div>
    );
}
)