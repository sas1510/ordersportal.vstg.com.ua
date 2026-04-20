import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import logo from "../../assets/icons/logo-vst.svg";

export default function HeaderWithoutAuth() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const exitIcon = "/assets/icons/exit-icon.png";

  return (
    <header className="w-full flex flex-col items-center bg-transparent z-50 font-['Inter']">
      
      {/* 1. Декоративна смуга — зменшуємо висоту на мобільних (h-2 проти h-[30px]) */}
      <div className="w-full max-w-[1334px]  h-2 md:h-[12px]  bg-[#B4D947] rounded-t-sm" />

      {/* 2. Основна панель — адаптивна висота (h-12 на мобілках, h-[70px] на десктопі) */}
      <div className="w-full max-w-[1334px] h-12 md:h-[70px] bg-white flex items-center justify-between shadow-sm rounded-bl-[15px] rounded-br-[15px] md:rounded-bl-[25px] md:rounded-br-[25px] px-4 md:px-8">
        
        {/* Логотип — зменшуємо висоту на мобільних */}
        <Link to="/home" className="flex-shrink-0 items-center flex ">
          <img 
            src={logo} 
            alt="Вікна Стиль" 
            className="h-[25px] md:h-[35px] w-auto transition-all" 
          />
        </Link>

        {/* Права частина */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Кнопка входу */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-end font-bold transition-all hover:opacity-80"
            title="Увійти"
          >
            <img 
              src={exitIcon} 
              alt="Увійти" 
              className="w-[20px] md:h-[20px] md:w-[20px] md:h-[20px] object-contain" 
            />
          </button>
          
        </div>
      </div>
    </header>
  );
}