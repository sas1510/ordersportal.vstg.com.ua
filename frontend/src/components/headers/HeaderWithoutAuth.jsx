import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import logo from "../../assets/icons/logo-vst.svg";

export default function HeaderWithoutAuth() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const exitIcon = "/assets/icons/exit-icon.png";

  return (
    <header className="w-full flex flex-col items-center bg-transparent z-50 font-['Inter']">
      {/* 1. Декоративна смуга (як у всьому додатку) */}
      <div className="w-full max-w-[1334px] h-[30px] bg-[#B4D947] rounded-t-sm" />

      {/* 2. Основна панель */}
      <div className="w-full max-w-[1334px] h-[70px] bg-white flex items-center justify-between shadow-md rounded-bl-[25px] rounded-br-[25px] px-8">
        
        {/* Логотип */}
        <Link to="/home" className="flex-shrink-0">
          <img src={logo} alt="Вікна Стиль" className="h-[35px] w-auto" />
        </Link>

        {/* Права частина */}
        <div className="flex items-center gap-6">
          
          {/* Перемикач теми */}
          {/* <button 
            onClick={toggleTheme} 
            className="text-[#44403E] text-lg hover:scale-110 transition-transform flex items-center justify-center"
            title="Змінити тему"
          >
            <i className={theme === "light" ? "fas fa-moon" : "fas fa-sun"}></i>
          </button> */}

          {/* Роздільник (опціонально, для стилю) */}
          {/* <div className="h-8 w-[1px] bg-gray-200"></div> */}

          {/* Кнопка входу */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center  font-bold ] transition-colors"
            title="Увійти"
          >
            {/* <span className="text-sm">Увійти</span> */}
            <img src={exitIcon} alt="Вихід" className="w-[20px] h-[20px] object-contain" />
          </button>
          
        </div>
      </div>
    </header>
  );
}