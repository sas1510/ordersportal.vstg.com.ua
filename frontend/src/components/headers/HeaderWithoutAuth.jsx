import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import logo from "../../assets/icons/logo-vst.svg";

export default function HeaderWithoutAuth() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const exitIcon = "/assets/icons/exit-icon.png";

  return (
        <header className="w-[calc(100%-20px)]  flex flex-col items-center bg-transparent z-50 font-['Inter'] mx-[10px]">
      

      <div className="w-full max-w-[1334px]  h-2 md:h-[12px]  bg-[#B4D947] rounded-t-sm" />


      <div className="w-full max-w-[1334px] h-12 md:h-[70px] bg-white flex items-center justify-between shadow-sm rounded-bl-[15px] rounded-br-[15px] md:rounded-bl-[25px] md:rounded-br-[25px] px-4 md:px-8">
        

        <Link to="/home" className="flex-shrink-0 items-center flex ">
          <img 
            src={logo} 
            alt="Вікна Стиль" 
            className="h-[35px] w-auto transition-all" 
          />
        </Link>


        <div className="flex items-center gap-4 md:gap-6">
          
    
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