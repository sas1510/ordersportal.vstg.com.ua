import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import "./AiChat.css"; // Нижче наведено базові стилі, якщо захочете кастомізувати

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AiChatPage = () => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotification();
  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";

  const [messages, setMessages] = useState([]); // Зберігає історію чату [{"role": "user"/"assistant", "content": ...}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Автопрокрутка вниз при кожному новому повідомленні чи стані завантаження
  const scrollToBottom = useCallback(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Статичні іконки та зображення (за аналогією з вашою сторінкою відео)
  const backgroundImage = "/assets/icons/FileBackground.jpg";
  const robotIcon = "/assets/icons/TechLessonVideo.png"; // Можна замінити на вашу іконку робота/ШІ

  // Форматування чисел для графіків та інтерфейсу відповідно до мови
  const formatCurrency = (value) => {
    return new Object(value).toLocaleString(i18n.language === 'en' ? "en-US" : "uk-UA", {
      style: "currency",
      currency: "UAH",
      maximumFractionDigits: 0
    });
  };

  // Функція відправки повідомлення на Django
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Формуємо нову історію повідомлень (поточний масив + новий запит)
    const updatedMessages = [...messages, { role: "user", content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Смикаємо створений нами ендпоінт на Django
      const res = await axiosInstance.post("/ai-chat/", {
        message: userText,
        messages: messages // Передаємо історію для контексту
      });

      if (res.data && res.data.status === "success") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.data.reply }
        ]);
      } else {
        addNotification(t('chat.errors.invalid_response') || "Некоректна відповідь сервера", "error");
      }
    } catch (err) {
      addNotification(t('chat.errors.send') || "Помилка при запиті до ШІ-агента", "error");
    } finally {
      setLoading(false);
    }
  };

  // Очищення контексту чату
  const handleClearChat = () => {
    setMessages([]);
    addNotification(t('chat.feedback.cleared') || "Історію чату очищено", "success");
  };

  // Допоміжний рендеринг графіків на основі конфігу від OpenAI
  const renderAiChart = (type, data) => {
    if (!data || data.length === 0) return null;

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip formatter={(value) => [formatCurrency(value), t('chat.chart.sum') || 'Сума']} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip formatter={(value) => [formatCurrency(value), t('chat.chart.sum') || 'Сума']} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} ${t('chat.chart.pieces') || 'шт.'}`, t('chat.chart.count') || 'Кількість']} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="videos-container">
      {/* Секція Hero (дизайн 1-в-1 як на сторінці відео) */}
      <section className="videos-hero">
        <img src={backgroundImage} className="videos-hero-bg" alt="bg" />
        <div className="videos-hero-overlay" />
        <div className="videos-hero-content w-full max-w-[1440px] mx-auto px-4">
          <h1 className="text-[24px] xl:text-[32px] font-bold uppercase tracking-wider text-center pt-[100px]">
            {t('chat.header.title') || "ШІ Аналітика"}
          </h1>
          <div className="flex !flex-col md:!flex-row items-center gap-6 justify-between">
            <div className="hidden lg:block lg:flex-1" />
            <p className="text-[16px] xl:text-[20px] font-light text-center leading-tight lg:flex-1 max-w-[600px]">
              {t('chat.header.subtitle') || "Голосовий та текстовий помічник аналізу ваших замовлень та продажів"}
            </p>
            <div className="w-full max-w-[285px] lg:max-w-[250px] lg:flex-1 flex justify-center lg:justify-end">
              {messages.length > 0 && (
                <button onClick={handleClearChat} className="w-full bg-red-500 hover:bg-red-600 text-white border border-transparent font-semibold text-sm px-4 py-2 rounded-[5px] flex items-center justify-center gap-2 transition-colors">
                  <span>{t('chat.buttons.clear') || "Очистити чат"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Основна робоча область аналітика */}
      <div className="max-w-[1200px] w-full mx-auto px-4 my-8 flex flex-col h-[550px] border border-zinc-200 rounded-[8px] bg-white shadow-sm overflow-hidden">
        
        {/* Внутрішній скрол-контейнер повідомлень */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
          
          {/* Повідомлення-привітання за замовчуванням */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-[12px] p-4 bg-white border border-zinc-200/80 rounded-bl-none shadow-sm flex gap-3 items-start">
                <img src={robotIcon} alt="AI" className="w-6 h-6 shrink-0 opacity-80" />
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="font-semibold mb-1">
                    {t('chat.welcome.title') || "Вітаю в інтелектуальному модулі аналітики!"}
                  </p>
                  <p>
                    {t('chat.welcome.body') || "Ви можете запитати мене будь-що про ваші замовлення. Наприклад:"}
                  </p>
                  <ul className="list-disc list-inside mt-2 text-xs text-blue-600 space-y-1 font-medium cursor-pointer">
                    <li onClick={() => setInput("Яка аналітика моїх замовлень за поточний рік?")}>
                      "Яка аналітика моїх замовлень за поточний рік?"
                    </li>
                    <li onClick={() => setInput("Покажи підсумки продажів за минулий рік")}>
                      "Покажи підсумки продажів за минулий рік"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Карти повідомлень історії */}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[12px] p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-custom-green text-WS---DarkGrey rounded-br-none border border-zinc-200'
                  : 'bg-white text-gray-800 border border-zinc-200 rounded-bl-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-4">
                    {/* Рендеринг тексту відповіді ШІ у форматі Markdown */}
        {/* Замість просто msg.content?.text_interpretation робимо фолбек на msg.content */}
<div className="prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-container">
  <ReactMarkdown>
    {typeof msg.content === 'object' 
      ? msg.content?.text_interpretation 
      : msg.content}
  </ReactMarkdown>
</div>
                    {/* Динамічний блок графіка Recharts */}
                    {msg.content?.has_chart && msg.content?.chart_data?.length > 0 && (
                      <div className="mt-4 p-3 bg-zinc-50 rounded-[6px] border border-zinc-100 h-60 w-full">
                        {renderAiChart(msg.content.chart_type, msg.content.chart_data)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Лоадер очікування відповіді (агент виконує SQL запит у MS SQL базу через 1С) */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-zinc-200 rounded-[12px] rounded-bl-none p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  {t('chat.loading_status') || "Обробка бази даних MS SQL..."}
                </p>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Форма вводу повідомлення */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-200 flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.input_placeholder') || "Запитайте мене про продажі або замовлення..."}
            disabled={loading}
            className="flex-1 border border-zinc-300 rounded-[5px] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-custom-green disabled:bg-zinc-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-custom-green hover:bg-custom-green-dark text-WS---DarkGrey border border-zinc-300 font-bold px-6 py-2.5 rounded-[5px] text-sm transition-colors disabled:bg-zinc-200 disabled:cursor-not-allowed"
          >
            {t('chat.buttons.send') || "Надіслати"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AiChatPage;