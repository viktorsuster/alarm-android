import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GamesStackParamList } from '../navigation/AppNavigator';

type GameState = {
  foundWords: string[];
  permanentlySelectedCells: {row: number, col: number}[];
  isGuessPhaseActive: boolean;
};

const CELL_SIZE = 35;
const { width } = Dimensions.get('window');

type WordSearchScreenRouteProp = RouteProp<GamesStackParamList, 'WordSearch'>;

const WordSearchScreen = () => {
  const route = useRoute<WordSearchScreenRouteProp>();
  const navigation = useNavigation();
  const { level } = route.params;

  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [tajnicka, setTajnicka] = useState('');
  const [solvedSentence, setSolvedSentence] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [permanentlySelectedCells, setPermanentlySelectedCells] = useState<{row: number, col: number}[]>([]);
  const [gridSize, setGridSize] = useState(0);
  const [isGuessPhaseActive, setIsGuessPhaseActive] = useState(false);
  const [isGuessModalVisible, setIsGuessModalVisible] = useState(false);
  const [isTajnickaGuessed, setIsTajnickaGuessed] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessFeedback, setGuessFeedback] = useState('');
  const [wordLocations, setWordLocations] = useState<Map<string, {row: number, col: number}[]>>(new Map());
  const [hintCells, setHintCells] = useState<{row: number, col: number}[]>([]);
  const [levelName, setLevelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hintAttempts, setHintAttempts] = useState(3);
  
  const gridContainerRef = useRef<View>(null);
  const gridLayoutRef = useRef<{x: number, y: number} | null>(null);

  const loadGame = useCallback(async (forceNew = false) => {
    if (!level) return;
    
    setIsLoading(true);

    const loadHints = async () => {
        try {
            const hintsJson = await AsyncStorage.getItem('global_hint_attempts');
            setHintAttempts(hintsJson !== null ? JSON.parse(hintsJson) : 3);
        } catch (error) {
            console.error("Failed to load global hints.", error);
            setHintAttempts(3); // Default to 3 on error
        }
    };
    loadHints();

    // Setup grid and basic level info first, as it's needed for both new and saved games
    setLevelName(level.name);
    setWords(level.words);
    setGridSize(level.gridSize);
    setTajnicka(level.tajnicka);
    setSolvedSentence(level.solved_sentence);
    const { grid: newGrid, wordLocations: newWordLocations } = generateGrid(level.gridSize, level.words, level.tajnicka);
    setGrid(newGrid);
    setWordLocations(newWordLocations);

    let loadedFromSave = false;
    if (!forceNew) {
      try {
        const savedStateJSON = await AsyncStorage.getItem(`word_search_progress_${level.id}`);
        if (savedStateJSON) {
          const savedState: GameState = JSON.parse(savedStateJSON);
          setFoundWords(savedState.foundWords);
          setPermanentlySelectedCells(savedState.permanentlySelectedCells);
          setIsGuessPhaseActive(savedState.isGuessPhaseActive);
          loadedFromSave = true;
        }
      } catch (error) {
        console.error("Failed to load game state.", error);
      }
    }

    if (!loadedFromSave) {
      setFoundWords([]);
      setPermanentlySelectedCells([]);
      setIsGuessPhaseActive(false);
    }

    setSelectedCells([]);
    setIsGuessModalVisible(false);
    setIsTajnickaGuessed(false);
    setGuess('');
    setGuessFeedback('');
    setIsLoading(false);
  }, [level]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleRefresh = useCallback(() => {
    Alert.alert(
      "Reštartovať level",
      "Naozaj chcete začať tento level odznova s novým rozložením? Váš aktuálny postup sa stratí.",
      [
        { text: "Zrušiť", style: "cancel" },
        {
          text: "Áno",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`word_search_progress_${level.id}`);
              loadGame(true);
            } catch (error) {
              console.error("Failed to reset level.", error);
            }
          }
        }
      ]
    );
  }, [level, loadGame]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="heart" size={22} color="#FF6B6B" style={{ marginRight: 5 }} />
            <Text style={{ color: '#FFFFFF', marginRight: 15, fontSize: 16, fontWeight: 'bold' }}>
                {hintAttempts}
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 15 }}>
                <Icon name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleRefresh, hintAttempts]);

  const saveGameState = async (state: GameState) => {
    try {
      const stateJSON = JSON.stringify(state);
      await AsyncStorage.setItem(`word_search_progress_${level.id}`, stateJSON);
    } catch (error) {
      console.error("Failed to save game state.", error);
    }
  };
  
  const generateGrid = (size: number, wordsToPlace: string[], secretWord: string) => {
    let gridGenerationAttempts = 0;
    while (gridGenerationAttempts < 20) { // Main loop to retry the entire generation
      const newGrid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
      const localWordLocations = new Map<string, {row: number, col: number}[]>();
      const directions = [
        { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: -1 },
        { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: 1 }
      ].sort(() => Math.random() - 0.5); // Shuffle directions for variety

      let allWordsPlacedSuccessfully = true;
      const shuffledWords = [...wordsToPlace].sort(() => Math.random() - 0.5);

      for (const word of shuffledWords) {
        let placed = false;
        const possiblePlacements = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            for (const dir of directions) {
              possiblePlacements.push({ r, c, dir });
            }
          }
        }
        possiblePlacements.sort(() => Math.random() - 0.5); // Shuffle all possible placements

        for (const placement of possiblePlacements) {
          const { r: startRow, c: startCol, dir } = placement;
          const endRow = startRow + (word.length - 1) * dir.r;
          const endCol = startCol + (word.length - 1) * dir.c;

          if (endRow >= 0 && endRow < size && endCol >= 0 && endCol < size) {
            let canPlace = true;
            const locations: {row: number, col: number}[] = [];
            for (let i = 0; i < word.length; i++) {
              const r = startRow + i * dir.r;
              const c = startCol + i * dir.c;
              if (newGrid[r][c] !== null) {
                canPlace = false;
                break;
              }
              locations.push({ row: r, col: c });
            }

            if (canPlace) {
              locations.forEach((loc, i) => {
                newGrid[loc.row][loc.col] = word[i];
              });
              localWordLocations.set(word, locations);
              placed = true;
              break;
            }
          }
        }

        if (!placed) {
          allWordsPlacedSuccessfully = false;
          break;
        }
      }

      if (allWordsPlacedSuccessfully) {
        const secretWordLetters = secretWord.replace(/\s/g, '').toUpperCase().split('');
        let secretLetterIndex = 0;
        if (secretWordLetters.length > 0) {
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (newGrid[r][c] === null) {
                if (secretLetterIndex < secretWordLetters.length) {
                  newGrid[r][c] = secretWordLetters[secretLetterIndex];
                  secretLetterIndex++;
                }
              }
            }
          }
        }
        return { grid: newGrid as string[][], wordLocations: localWordLocations };
      }
      gridGenerationAttempts++;
    }

    console.error("FATAL: Could not generate a valid grid. Please check the level data (too many long words for the grid size).");
    // Return a dummy grid to avoid a crash
    const errorGrid: (string)[][] = Array(size).fill(null).map(() => Array(size).fill('!'));
    return { grid: errorGrid, wordLocations: new Map() };
  };

  const checkWord = (cells: {row: number, col: number}[]) => {
    if (cells.length === 0) return;
    let selectedWord = '';
    for (const cell of cells) {
      selectedWord += grid[cell.row][cell.col];
    }

    const reversedSelectedWord = selectedWord.split('').reverse().join('');

    let wordFound = false;
    let correctWord = '';

    if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      wordFound = true;
      correctWord = selectedWord;
    } else if (words.includes(reversedSelectedWord) && !foundWords.includes(reversedSelectedWord)) {
      wordFound = true;
      correctWord = reversedSelectedWord;
    }
    
    if (wordFound) {
      const newFoundWords = [...foundWords, correctWord];
      const newPermanentlySelectedCells = [...permanentlySelectedCells, ...cells];
      const newIsGuessPhaseActive = newFoundWords.length === words.length;

      setFoundWords(newFoundWords);
      setPermanentlySelectedCells(newPermanentlySelectedCells);
      
      if (newIsGuessPhaseActive) {
        setIsGuessPhaseActive(true);
      }
      
      // Save state after a successful find
      saveGameState({
        foundWords: newFoundWords,
        permanentlySelectedCells: newPermanentlySelectedCells,
        isGuessPhaseActive: newIsGuessPhaseActive,
      });
    }
  };

  const getLine = (start: {row: number, col: number}, end: {row: number, col: number}): {row: number, col: number}[] => {
    const lineCells: {row: number, col: number}[] = [];
    const { row: r1, col: c1 } = start;
    const { row: r2, col: c2 } = end;
    
    const dr = r2 - r1;
    const dc = c2 - c1;

    if (Math.abs(dr) > Math.abs(dc)) {
        const len = Math.abs(dr);
        const stepR = Math.sign(dr);
        const stepC = Math.round(dc / len);
        for (let i = 0; i <= len; i++) {
            lineCells.push({ row: r1 + i * stepR, col: c1 + i * stepC });
        }
    } else {
        if (dc === 0) {
            if (dr === 0) return [{row: r1, col: c1}];
            const len = Math.abs(dr);
            const stepR = Math.sign(dr);
            for (let i = 0; i <= len; i++) {
                lineCells.push({ row: r1 + i * stepR, col: c1 });
            }
            return lineCells;
        }
        const len = Math.abs(dc);
        const stepC = Math.sign(dc);
        const stepR = Math.round(dr / len);
        for (let i = 0; i <= len; i++) {
            lineCells.push({ row: r1 + i * stepR, col: c1 + i * stepC });
        }
    }
    return lineCells;
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      if (!gridLayoutRef.current) return;
      const col = Math.floor((gestureState.x0 - gridLayoutRef.current.x) / CELL_SIZE);
      const row = Math.floor((gestureState.y0 - gridLayoutRef.current.y) / CELL_SIZE);

      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        setSelectedCells([{ row, col }]);
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!gridLayoutRef.current || selectedCells.length === 0) return;
      const col = Math.floor((gestureState.moveX - gridLayoutRef.current.x) / CELL_SIZE);
      const row = Math.floor((gestureState.moveY - gridLayoutRef.current.y) / CELL_SIZE);

      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        const startCell = selectedCells[0];
        const endCell = { row, col };
        const line = getLine(startCell, endCell);
        setSelectedCells(line);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (selectedCells.length > 1) {
        checkWord(selectedCells);
      }
      setSelectedCells([]);
    },
  });

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  }

  const isCellPermanentlySelected = (row: number, col: number) => {
    return permanentlySelectedCells.some(cell => cell.row === row && cell.col === col);
  }

  const handleHint = async (word: string) => {
      if (foundWords.includes(word)) return;

      if (hintAttempts <= 0) {
        Alert.alert("Žiadne nápovedy", "Už si vyčerpal všetky dostupné nápovedy.");
        return;
      }

      const newHintAttempts = hintAttempts - 1;
      setHintAttempts(newHintAttempts);
      
      try {
        await AsyncStorage.setItem('global_hint_attempts', JSON.stringify(newHintAttempts));
      } catch (error) {
        console.error("Failed to save new hint count.", error);
      }

      const locations = wordLocations.get(word);
      if (locations) {
          setHintCells(locations);
          setTimeout(() => {
              setHintCells([]);
          }, 1000);
      }
  };

  const isCellHinted = (row: number, col: number) => {
    return hintCells.some(cell => cell.row === row && cell.col === col);
  };

  const handleGuessSubmit = () => {
    // Normalize both strings by converting to uppercase and removing everything except letters
    const normalizeString = (str: string) => str.toUpperCase().replace(/[^A-ZÁČĎÉÍĹĽŇÓŠŤÚÝŽ]/g, '');

    const formattedGuess = normalizeString(guess);
    const formattedTajnicka = normalizeString(tajnicka);

    if (formattedGuess === formattedTajnicka) {
      setIsGuessModalVisible(false);
      setIsTajnickaGuessed(true);
      setGuessFeedback('');
      saveCompletion(level.id);
    } else {
      setGuessFeedback('Nesprávna odpoveď. Skús znova!');
    }
  };

  const saveCompletion = async (levelId: number) => {
    try {
      const completed = await AsyncStorage.getItem('completed_word_search_levels');
      const completedSet = completed ? new Set(JSON.parse(completed)) : new Set();
      
      const wasAlreadyCompleted = completedSet.has(levelId);

      if (!wasAlreadyCompleted) {
          completedSet.add(levelId);
          await AsyncStorage.setItem('completed_word_search_levels', JSON.stringify(Array.from(completedSet)));
          
          // Award a hint only on the first completion
          const currentHints = hintAttempts + 1;
          setHintAttempts(currentHints);
          await AsyncStorage.setItem('global_hint_attempts', JSON.stringify(currentHints));
      }
      
      // Remove the in-progress save file as the level is now complete
      await AsyncStorage.removeItem(`word_search_progress_${levelId}`);
    } catch (error) {
      console.error('Failed to save completed level.', error);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };
  
  if (isLoading) {
    return (
        <View style={[styles.container, {justifyContent: 'center'}]}>
            <ActivityIndicator size="large" color="#ff4500" />
        </View>
    )
  }

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={isTajnickaGuessed}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LottieView
              source={require('../assets/reminder.json')}
              autoPlay
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.modalTitle}>Správne!</Text>
            <Text style={styles.tajnickaText}>{solvedSentence}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleGoBack}>
              <Text style={styles.modalButtonText}>Naspäť na výber</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guessing Modal */}
      <Modal
        transparent={true}
        visible={isGuessModalVisible}
        animationType="fade"
        onRequestClose={() => setIsGuessModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hádaj tajničku!</Text>
            <TextInput
              style={styles.input}
              placeholder="Napíš tajničku..."
              placeholderTextColor="#888"
              value={guess}
              onChangeText={setGuess}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleGuessSubmit}>
              <Text style={styles.modalButtonText}>Odoslať</Text>
            </TouchableOpacity>
            {guessFeedback ? <Text style={styles.feedbackText}>{guessFeedback}</Text> : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsGuessModalVisible(false)}>
                <Text style={styles.closeButtonText}>Zavrieť</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <View 
        ref={gridContainerRef}
        style={[styles.gridContainer, { width: CELL_SIZE * gridSize }]} 
        {...panResponder.panHandlers}
        onLayout={() => {
          gridContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
            gridLayoutRef.current = { x: pageX, y: pageY };
          });
        }}
      >
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.cell,
                  isCellSelected(rowIndex, colIndex) && styles.selectedCell,
                  isCellPermanentlySelected(rowIndex, colIndex) && styles.foundCell,
                  isCellHinted(rowIndex, colIndex) && styles.hintCell,
                ]}
              >
                <Text style={styles.cellText}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.wordListContainer}>
        <Text style={styles.levelNameText}>{levelName}</Text>
        <Text style={styles.wordListTitle}>Nájdi slová:</Text>
        <View style={styles.words}>
            {words.map(word => (
            <TouchableOpacity key={word} onPress={() => handleHint(word)} disabled={foundWords.includes(word)}>
                <Text
                    style={[
                    styles.wordItem,
                    foundWords.includes(word) && styles.foundWord,
                    ]}
                >
                    {word}
                </Text>
            </TouchableOpacity>
            ))}
        </View>
      </View>

      {isGuessPhaseActive && !isTajnickaGuessed && (
        <TouchableOpacity style={styles.writeResultButton} onPress={() => { setGuessFeedback(''); setIsGuessModalVisible(true); }}>
            <Text style={styles.writeResultButtonText}>Napísať výsledok</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    paddingTop: 20, // Reduced from 50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  gridContainer: {
    backgroundColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cellText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#ff4500',
  },
  foundCell: {
    backgroundColor: '#006400',
  },
  hintCell: {
    backgroundColor: '#00008B', // Dark Blue for hint
  },
  wordListContainer: {
    marginTop: 15, // Adjusted margin
    marginHorizontal: 10,
    alignItems: 'center',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordItem: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#3a3a3a',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    margin: 4,
  },
  foundWord: {
    textDecorationLine: 'line-through',
    color: '#888',
    backgroundColor: '#2a2a2a',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
  },
  lottie: {
    width: 150,
    height: 150,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  tajnickaText: {
    fontSize: 18,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  modalButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guessTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  guessInstructions: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  submitButton: {
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackText: {
    marginTop: 15,
    fontSize: 16,
    color: '#ff4500',
  },
  writeResultButton: {
    marginTop: 15,
    backgroundColor: '#006400',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  writeResultButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  closeButton: {
      marginTop: 15,
  },
  closeButtonText: {
      color: '#B0B0B0',
      fontSize: 16,
  },
  levelNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4500',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default WordSearchScreen;
