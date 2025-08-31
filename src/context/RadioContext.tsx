import React, { createContext, useState, useContext, ReactNode } from 'react';
import Sound from 'react-native-sound';

interface PlayingRadioInfo {
  name: string;
  url: string;
  sound: Sound;
}

interface RadioContextType {
  playingRadio: PlayingRadioInfo | null;
  setPlayingRadio: (radioInfo: PlayingRadioInfo | null) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [playingRadio, setPlayingRadioInfo] = useState<PlayingRadioInfo | null>(null);

  const setPlayingRadio = (radioInfo: PlayingRadioInfo | null) => {
    if (playingRadio && playingRadio.sound) {
      playingRadio.sound.stop();
      playingRadio.sound.release();
    }
    setPlayingRadioInfo(radioInfo);
  };

  return (
    <RadioContext.Provider value={{ playingRadio, setPlayingRadio }}>
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
