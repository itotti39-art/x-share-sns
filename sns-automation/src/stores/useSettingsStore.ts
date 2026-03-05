import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Platform } from '../types';

interface AccountSettings {
    [key: string]: {
        isConnected: boolean;
        accountName?: string;
    };
}

interface SettingsState {
    accounts: AccountSettings;
    connectAccount: (platform: Platform, accountName: string) => void;
    disconnectAccount: (platform: Platform) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            accounts: {
                x: { isConnected: false },
                facebook: { isConnected: false },
                threads: { isConnected: false },
            },
            connectAccount: (platform, accountName) =>
                set((state) => ({
                    accounts: {
                        ...state.accounts,
                        [platform]: { isConnected: true, accountName },
                    },
                })),
            disconnectAccount: (platform) =>
                set((state) => ({
                    accounts: {
                        ...state.accounts,
                        [platform]: { isConnected: false, accountName: undefined },
                    },
                })),
        }),
        {
            name: 'sns-automation-settings',
        }
    )
);
