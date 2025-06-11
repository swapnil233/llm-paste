import { useState, useEffect } from 'react';
import { useElectron } from './useElectron';
import type { ThemeMode } from '../types';

export const useTheme = () => {
    const api = useElectron();
    const [isDark, setIsDark] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize theme from system
        const initializeTheme = async () => {
            try {
                const systemDark = await api.shouldUseDarkColors();
                setIsDark(systemDark);
                // Apply theme to document element immediately
                if (systemDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize theme:', error);
                // Fallback to light mode
                setIsDark(false);
                document.documentElement.classList.remove('dark');
                setIsInitialized(true);
            }
        };

        initializeTheme();
    }, [api]);

    const setTheme = async (theme: ThemeMode) => {
        try {
            const newIsDark = await api.setTheme(theme);
            setIsDark(newIsDark);
            // Apply theme to document element immediately
            if (newIsDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
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
        isInitialized,
        setTheme,
        toggleTheme,
    };
}; 