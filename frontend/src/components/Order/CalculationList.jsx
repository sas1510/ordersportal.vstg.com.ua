import { useState } from "react";
import CalculationItem from "./CalculationItem";

export default function CalculationList({ calculations }) {
  const [searchText, setSearchText] = useState("");
  const [openCalc, setOpenCalc] = useState(null); // зберігаємо id відкритого прорахунку

  // Фільтруємо прорахунки за пошуком
  const filteredCalculations = calculations.filter((calc) =>
    !searchText || calc.items.some(order => order.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const toggleCalc = (name) => {
    setOpenCalc(openCalc === name ? null : name);
  };

  return (
    <div className="calculation-list flex flex-col gap-4">
      {/* Пошук */}


      {/* Список прорахунків з прокруткою */}
      <div className="flex-1 overflow-y-auto gap-4 flex flex-col">
        {filteredCalculations.length === 0 && (
          <div className="text-gray-500 font-medium uppercase text-center mt-4">
            Ще немає прорахунків по цьому фільтру
          </div>
        )}
        {filteredCalculations.map((calc) => (
          <CalculationItem
            key={calc.name}
            calculation={calc}
            isOpen={openCalc === calc.name}
            onToggle={() => toggleCalc(calc.name)}
          />
        ))}
      </div>
    </div>
  );
}
