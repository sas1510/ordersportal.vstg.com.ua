import "./CalcMenu.css";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useTranslation } from "react-i18next";


export const CalculationMenu = ({
  calc,
  onEdit,
  onDelete,
  hasOrders = false,
  hasRefusableOrders = false,
  onRequestRefusal,
}) => {
  const { t } = useTranslation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteIcon = "/assets/icons/DeleteIcon.png";

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!hasOrders) {
      setIsDeleteModalOpen(true);
      return;
    }

    if (hasRefusableOrders) {
      onRequestRefusal?.();
    }
  };

  const isDisabled = hasOrders && !hasRefusableOrders;
  const title = !hasOrders
    ? t("portal_calc.ui.delete_calc_allowed")
    : hasRefusableOrders
      ? t("portal_calc.ui.request_order_refusal")
      : t("portal_calc.ui.order_refusal_unavailable");
  return (
    <div className="summary-item small row no-wrap gap-10 align-center">
<img 
  src={deleteIcon} 
  alt={title}
  onClick={!isDisabled ? handleDeleteClick : undefined}
  className={` transition-all
    ${isDisabled
      ? "icon-delete-disabled cursor-not-allowed" 
      : "icon-delete-red cursor-pointer active:scale-95"
    }`} 
  title={title}
/>

   
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)} 
        onDeleted={onDelete} 
        itemData={calc}
        itemType="calculation"
      />

      {/* Модалка редагування
      <EditCalculationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        calculation={calc}
        onSave={(updated) => {
          setIsEditModalOpen(false);
          onEdit?.(updated);
        }}
      /> */}
    </div>
  );
};
