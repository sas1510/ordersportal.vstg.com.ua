import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartChatPage = () => {
    const navigate = useNavigate();

    const handleCreateChat = (type) => {
        // Генеруємо унікальний ID або беремо ID об'єкта
        // Наприклад: 'order_125', 'support_user_7'
        const newChatId = `${type}_${Math.floor(Math.random() * 10000)}`;
        navigate(`/chat/${newChatId}`);
    };

    return (
        <div className="start-chat-container" style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Розпочати новий чат</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                <button onClick={() => handleCreateChat('order')} className="chat-btn">
                    Питання по замовленню
                </button>
                <button onClick={() => handleCreateChat('support')} className="chat-btn">
                    Зв'язатися з підтримкою
                </button>
            </div>
        </div>
    );
};

export default StartChatPage;