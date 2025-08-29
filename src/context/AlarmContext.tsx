import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NativeModules } from 'react-native';

const { AlarmModule } = NativeModules;

interface AlarmContextType {
    // isRinging a alarmMessage už nebudú priamo v kontexte
    // triggerAlarm bude teraz slúžiť len na zobrazenie modálu
    showAlarmModal: (message: string) => void;
    dismissAlarm: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{children: ReactNode, showModal: (message: string) => void}> = ({ children, showModal }) => {

    const dismissAlarm = async () => {
        try {
            await AlarmModule.stopAlarm();
        } catch (error) {
            console.error("Failed to stop alarm via context", error);
        }
    };

    return (
        <AlarmContext.Provider value={{ showAlarmModal: showModal, dismissAlarm }}>
            {children}
        </AlarmContext.Provider>
    );
};

export const useAlarm = () => {
    const context = useContext(AlarmContext);
    if (context === undefined) {
        throw new Error('useAlarm must be used within an AlarmProvider');
    }
    return context;
};
