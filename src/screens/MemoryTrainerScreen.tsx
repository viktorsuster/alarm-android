import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSequence } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useTranslate } from '../hooks/useTranslate';

// Definícia typov pre lepšiu prácu s kódom
type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  isError?: boolean;
};

// Zoznam dostupných emoji pre hru
const EMOJI_LIST = ['☀️', '❤️', '⚽️', '🍕', '🚀', '⭐️', '🎉', '🎁', '💡', '👑', '🎸', '🎲'];

// Funkcia na zamiešanie poľa (Fisher-Yates shuffle)
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Komponent pre jednu kartu s animáciou
const CardComponent = ({ card, onPress, size }: { card: Card, onPress: () => void, size: number }) => {
  const rotation = useSharedValue(card.isFlipped ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(card.isFlipped ? 180 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [card.isFlipped]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotation.value;
    return {
      transform: [{ rotateY: `${rotate}deg` }],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = rotation.value + 180;
    return {
      transform: [{ rotateY: `${rotate}deg` }],
    };
  });

  const cardBackgroundColor = card.isError
    ? '#FFCDD2' // Svetlo červená pre chybu
    : card.isMatched
    ? '#C8E6C9' // Svetlo zelená pre zhodu
    : '#BBDEFB'; // Predvolená modrá

  return (
    <TouchableOpacity onPress={onPress} disabled={card.isFlipped || card.isMatched}>
      <View style={{ width: size, height: size * 1.25, margin: 5 }}>
        <Animated.View style={[styles.card, styles.cardFace, { width: size, height: size * 1.25 }, frontAnimatedStyle]}>
          <Icon name="brain" size={size * 0.5} color="#0277BD" />
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardFace, styles.cardBack, { width: size, height: size * 1.25, backgroundColor: cardBackgroundColor }, backAnimatedStyle]}>
          <Text style={{ fontSize: size * 0.5 }}>{card.emoji}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const MemoryTrainerScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
//   const translate = useTranslate();
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(true); // Stav na zobrazenie kariet na začiatku
  const [gameStarted, setGameStarted] = useState(false);
  const [showFailOverlay, setShowFailOverlay] = useState(false);
  const shakeAnimation = useSharedValue(0);


  // useEffect sa spustí vždy, keď sa zmení úroveň (level)
  useEffect(() => {
    if (gameStarted) {
      setupLevel(level);
    }
  }, [level, gameStarted]);

  const setupLevel = useCallback((currentLevel: number) => {
    const numPairs = currentLevel + 1;
    const shuffledEmojis = shuffleArray([...EMOJI_LIST]);
    const levelEmojis = shuffledEmojis.slice(0, numPairs);

    const levelCards = levelEmojis.flatMap((emoji, index) => [
      { id: index * 2, emoji, isFlipped: true, isMatched: false, isError: false },
      { id: index * 2 + 1, emoji, isFlipped: true, isMatched: false, isError: false },
    ]);
    
    setCards(shuffleArray(levelCards));
    setIsShowing(true);

    // Po 1.5 sekunde karty otočíme a hra sa môže začať
    setTimeout(() => {
      setCards(prevCards => prevCards.map(c => ({ ...c, isFlipped: false })));
      setIsShowing(false);
    }, 1500);
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleCardPress = (cardId: number) => {
    if (isShowing || flippedCards.length === 2) return;

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedCards(prev => [...prev, cardId]);
  };

  // useEffect na kontrolu zhody po otočení druhej karty
  useEffect(() => {
    if (flippedCards.length === 2 && !showFailOverlay) {
      const [firstCardId, secondCardId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);

      if (firstCard && secondCard) {
        if (firstCard.emoji === secondCard.emoji) {
          // Zhoda!
          setCards(prevCards =>
            prevCards.map(card =>
              card.emoji === firstCard.emoji
                ? { ...card, isMatched: true }
                : card
            )
          );
          setFlippedCards([]);
        } else {
          // Nezhoda - zobraziť overlay a odhaliť karty
          shakeAnimation.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          
          // Odhaliť všetky karty a označiť chybné
          setCards(prevCards =>
            prevCards.map(c => ({
              ...c,
              isFlipped: true,
              isError: c.id === firstCardId || c.id === secondCardId,
            }))
          );
          setShowFailOverlay(true);
        }
      }
    }
  }, [flippedCards, cards, showFailOverlay]);

  // useEffect na kontrolu konca úrovne
  useEffect(() => {
    if (
      cards.length > 0 &&
      cards.every(card => card.isMatched) &&
      !showFailOverlay
    ) {
      // Všetky karty sú zhodné, postup do ďalšej úrovne
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
      }, 1000);
    }
  }, [cards, showFailOverlay]);

  const handlePlayAgain = () => {
    setLevel(1);
    setFlippedCards([]);
    setGameStarted(false);
    setCards([]);
    setShowFailOverlay(false);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const getBackgroundGradient = () => {
    if (level < 3) return ['#E1F5FE', '#B3E5FC'];   // Svetlo modrá
    if (level < 5) return ['#FFF9C4', '#FFF176'];   // Žltá
    if (level < 7) return ['#FFCC80', '#FF9800'];   // Oranžová
    return ['#EF9A9A', '#E57373'];                  // Červená
  };

  const gameAreaAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  });

  if (!gameStarted) {
    return (
      <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={styles.container}>
        <SafeAreaView style={styles.startScreen}>
          <Icon name="brain" style={styles.bigIcon} />
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top || 20 }]}
            onPress={handleGoBack}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>
            Tréner Pamäti
          </Text>
          <Text style={styles.instructionText}>Zapamätaj si pozíciu kariet a nájdi všetky páry!</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Štart</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  
  // Výpočet rozloženia mriežky
  const maxColumns = 4;
  const numPairs = level + 1;
  const numCards = numPairs * 2;
  const numColumns = Math.min(Math.ceil(Math.sqrt(numCards)), maxColumns);
  const cardSize = (Dimensions.get('window').width - 40) / numColumns - 10;

  const renderCard = ({ item }: { item: Card }) => {
    return <CardComponent card={item} onPress={() => handleCardPress(item.id)} size={cardSize} />;
  };

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{level}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.backButton, { top: insets.top || 20 }]} 
          onPress={handleGoBack}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Animated.View style={[styles.gameArea, gameAreaAnimatedStyle]}>
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            contentContainerStyle={styles.grid}
            key={numColumns}
          />
        </Animated.View>
        {showFailOverlay && (
          <View style={styles.failOverlay}>
            <TouchableOpacity
              style={[styles.backButton, { top: insets.top || 20, left: 20 }]}
              onPress={handleGoBack}>
              <Text style={[styles.backButtonText, { color: '#FFF' }]}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayButton} onPress={handlePlayAgain}>
              <Icon name="refresh" size={24} color="#FFF" />
              <Text style={styles.overlayButtonText}>
                Hrať znova
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 140, // Väčšie číslo
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.15)', // Priesvitnejšia farba
  },
  gameArea: {
    flex: 1,
    padding: 10,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 80,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backfaceVisibility: 'hidden', // Dôležité pre animáciu otáčania
  },
  cardFace: {
    position: 'absolute',
  },
  cardBack: {
    // backgroundColor: '#BBDEFB',
  },
  cardText: {
    fontSize: 40,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  finalScore: {
    fontSize: 32,
    color: '#FFF',
    marginBottom: 40,
  },
  playAgainButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  grid: {
    flex: 1,
    justifyContent: 'flex-end', // Zarovnanie odspodu
    alignItems: 'center',
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20, // Zmenené z right na left
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backButtonText: {
    fontSize: 40,
    color: '#000',
    fontWeight: 'bold',
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeText: {
    fontSize: 32,
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  failOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  overlayButton: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  overlayButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bigIcon: {
    position: 'absolute',
    bottom: 40,
    fontSize: 250,
    color: 'rgba(0,0,0,0.08)',
  },
});

export default MemoryTrainerScreen;
