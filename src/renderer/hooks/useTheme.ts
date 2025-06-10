import { useState, useEffect } from 'react';
import { useElectron } from './useElectron';
import type { ThemeMode } from '../types';

export const useTheme = () => {
    const api = useElectron();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initialize theme from system
        const initializeTheme = async () => {
            try {
                const systemDark = await api.shouldUseDarkColors();
                setIsDark(systemDark);
                document.documentElement.classList.toggle('dark', systemDark);
            } catch (error) {
                console.error('Failed to initialize theme:', error);
            }
        };

        initializeTheme();
    }, [api]);

    const setTheme = async (theme: ThemeMode) => {
        try {
            const newIsDark = await api.setTheme(theme);
            setIsDark(newIsDark);
            document.documentElement.classList.toggle('dark', newIsDark);
        } catch (error) {
            console.error('Failed to set theme:', error);
        }
    };

    const toggleTheme = () => {
        const newTheme: ThemeMode = isDark ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return {
        isDark,
        setTheme,
        toggleTheme,
    };
}; 