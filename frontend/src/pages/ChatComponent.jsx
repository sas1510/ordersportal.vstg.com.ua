import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ChatPage = () => {
    const { chatId } = useParams(); 
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const socket = useRef(null);
    const scrollRef = useRef(null);

    // 1. Завантаження історії (навіть якщо чат новий)
    useEffect(() => {
        if (!chatId || chatId === "undefined") return;

        const fetchHistory = async () => {
            try {
                const response = await axios.get(`/api/chat/history/${chatId}/`);
                const history = response.data.map(m => ({
                    message: m.text,
                    author: m.author_name,
                    timestamp: m.timestamp
                }));
                setMessages(history);
            } catch (error) {
                console.log("Чат ще не має історії, це нормально.");
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [chatId]);

    // 2. Налаштування WebSocket
    useEffect(() => {
        if (!chatId || chatId === "undefined") return;

        // Підключаємося до сокета. Якщо ви використовуєте JWT, додайте ?token=...
        socket.current = new WebSocket(`ws://localhost:8000/ws/chat/${chatId}/`);

        socket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
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

    // Автопрокрутка до останнього повідомлення
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ 'message': input }));
            setInput('');
        }
    };

    if (loading) return <div className="chat-loader">Завантаження чату...</div>;

    return (
        <div className="chat-container" style={{marginTop: '80px'}}>
            <header className="chat-header">
                <h3>Діалог # {chatId}</h3>
            </header>

            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="empty-chat-msg">
                        <p>Повідомлень немає. Напишіть щось, щоб почати чат!</p>
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
                    placeholder="Введіть повідомлення..."
                />
                <button onClick={handleSend}>Відправити</button>
            </div>
        </div>
    );
};

export default ChatPage;