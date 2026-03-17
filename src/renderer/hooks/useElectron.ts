import { useMemo } from 'react';
import type { ElectronAPI } from '../../shared/ipc';

export const useElectron = (): ElectronAPI => {
    return useMemo(() => {
        if (typeof window !== 'undefined' && window.api) {
            return window.api;
        }
        throw new Error('Electron API not available. Make sure you are running in an Electron environment.');
    }, []);
}; 