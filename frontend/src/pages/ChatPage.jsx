import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from "../api/axios";

const ChatPage = () => {
    const { chatId } = useParams(); 
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const socket = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!chatId || chatId === "undefined") return;

        const fetchHistory = async () => {
            try {
                const response = await axiosInstance.get(`/chat/history/${chatId}/`);
                const history = response.data.map(m => ({
                    message: m.text,
                    author: m.author_name,
                    timestamp: m.timestamp
                }));
                setMessages(history);
            } catch (error) {
                // Якщо 404 або порожньо — це новий чат
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [chatId]);

    useEffect(() => {
        if (!chatId || chatId === "undefined") return;

        const token = localStorage.getItem("access");

       // Визначаємо протокол (ws для http, wss для https)
        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        // Використовуємо поточний хост (наприклад, portal.viknastyle.com)
        const ws_host = window.location.host; 

        socket.current = new WebSocket(
        `${ws_scheme}://${ws_host}/ws/chat/${chatId}/?token=${token}`
        );

        socket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === 'error') {
                // Виводимо повідомлення про помилку користувачу
                addNotification(data.message, "error");
                setLoading(false); // зупиняємо індикатор завантаження, якщо він був
                return;
            }
            if (data.type === 'chat_message') {
                setMessages((prev) => [...prev, {
                    message: data.message,
                    author: data.author,
                    timestamp: data.timestamp
                }]);
            }
        };

        return () => {
            if (socket.current) socket.current.close();
        };
    }, [chatId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

   const handleSend = () => {
    console.log("Намагаюся надіслати...", socket.current?.readyState);
    
    if (input.trim() && socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({ 'message': input }));
        console.log("Відправлено!");
        setInput('');
    } else {
        console.error("Сокет не готовий. Статус:", socket.current?.readyState);
    }
};

    if (loading) return <div className="chat-loader">Перевірка історії чату...</div>;

    return (
        <div className="chat-container" style={{marginTop: '80px'}}>
            <header className="chat-header">
                <h3>Діалог # {chatId}</h3>
            </header>

            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="empty-chat-msg" style={{textAlign: 'center', padding: '40px'}}>
                        <div style={{fontSize: '40px'}}>👋</div>
                        <h4>Ви розпочинаєте новий чат!</h4>
                        <p>Надішліть перше повідомлення, щоб ініціювати діалог.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`msg-bubble ${msg.author === 'Me' ? 'me' : 'other'}`}>
                            <small>{msg.author}</small>
                            <p>{msg.message}</p>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            <div className="chat-input">
                <input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ваше перше повідомлення..."
                />
                <button onClick={handleSend} className="send-btn">Надіслати</button>
            </div>
        </div>
    );
};

export default ChatPage;