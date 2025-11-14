// src/context/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Створюємо контекст
const ThemeContext = createContext();

// 2. Створюємо кастомний хук для зручного використання
export const useTheme = () => useContext(ThemeContext);

// 3. Створюємо компонент-провайдер
export const ThemeProvider = ({ children }) => {
    // Встановлюємо початкову тему з localStorage або 'light' за замовчуванням
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Функція для перемикання теми
    const toggleTheme = () => {
        setTheme(currentTheme => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    };

    // Застосовуємо клас 'dark-theme' до кореневого елемента (<body>)
    useEffect(() => {
        const body = document.body;
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }, [theme]); // Викликається при зміні теми

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};