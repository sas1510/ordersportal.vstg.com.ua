// src/hooks/useCancelAllRequests.js
import { useRef, useEffect } from "react";

export default function useCancelAllRequests() {
    const controllers = useRef([]);

    const register = () => {
        const controller = new AbortController();
        controllers.current.push(controller);
        return controller;
    };

    const cancelAll = () => {
        controllers.current.forEach(c => {
            try {
                c.abort();
            } catch (_) {}
        });
        controllers.current = [];
    };

    // ❗ ВАЖЛИВО: ТУТ ПОВИНЕН БУТИ ВИКЛИК cancelAll()
    useEffect(() => {
        return () => {
            cancelAll();
        };
    }, []);

    return { register, cancelAll };
}
