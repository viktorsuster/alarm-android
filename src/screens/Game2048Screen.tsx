import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Image, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TILE_IMAGES = {
  2: require('../assets/2048/1.webp'),
  4: require('../assets/2048/2.webp'),
  8: require('../assets/2048/3.webp'),
  16: require('../assets/2048/4.webp'),
  32: require('../assets/2048/5.webp'),
  64: require('../assets/2048/6.webp'),
  128: require('../assets/2048/7.webp'),
  256: require('../assets/2048/8.webp'),
  512: require('../assets/2048/9.webp'),
  1024: require('../assets/2048/10.webp'),
  2048: require('../assets/2048/11.webp'),
};

const GRID_SIZE = 4;
const CELL_SIZE = (Dimensions.get('window').width - 40) / GRID_SIZE;
const CELL_MARGIN = 5;

type Tile = {
  id: number;
  value: number;
  x: number;
  y: number;
  mergedInto?: Tile | null;
};

const Game2048Screen = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const tileIdCounter = useRef(0);
  const navigation = useNavigation();
  const isInitialMount = useRef(true);

  const GAME_STATE_KEY = 'game_2048_state';

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
        headerRight: () => (
            <TouchableOpacity onPress={handleRefresh} style={{ paddingRight: 10 }}>
                <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
        ),
        title: `Skóre: ${score}`
    });
  }, [navigation, score]);

  useFocusEffect(
    useCallback(() => {
        const loadGameState = async () => {
            try {
                const savedState = await AsyncStorage.getItem(GAME_STATE_KEY);
                if (savedState !== null) {
                    const { tiles: savedTiles, score: savedScore } = JSON.parse(savedState);
                    if (savedTiles.length > 0) {
                        setTiles(savedTiles);
                        setScore(savedScore);
                        tileIdCounter.current = Math.max(...savedTiles.map((t: Tile) => t.id)) + 1;
                    } else {
                        startGame(false); // Don't clear storage if it's already empty
                    }
                } else {
                    startGame(false);
                }
            } catch (e) {
                console.error("Failed to load game state.", e);
                startGame(false);
            }
        };
        loadGameState();
    }, [])
  );

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    const saveGameState = async () => {
        try {
            const gameState = JSON.stringify({ tiles, score });
            await AsyncStorage.setItem(GAME_STATE_KEY, gameState);
        } catch (e) {
            console.error("Failed to save game state.", e);
        }
    };
    if (tiles.length > 0) { // Only save if there's a game in progress
        saveGameState();
    }
  }, [tiles, score]);


  const startGame = async (clearStorage = true) => {
    setScore(0);
    setTiles([]);
    setGameOver(false);
    setWin(false);
    tileIdCounter.current = 0;
    if (clearStorage) {
        try {
            await AsyncStorage.removeItem(GAME_STATE_KEY);
        } catch (e) {
            console.error("Failed to clear game state.", e);
        }
    }
    setTimeout(() => {
        addRandomTile();
        addRandomTile();
    }, 100);
  };

  const handleRefresh = () => {
    Alert.alert(
      "Reštartovať hru",
      "Naozaj si želáš začať odznova? Tvoj aktuálny postup bude stratený.",
      [
        { text: "Zrušiť", style: "cancel" },
        { text: "Áno, reštartovať", onPress: () => startGame(), style: 'destructive' }
      ]
    );
  };
  
  const addRandomTile = () => {
    setTiles(currentTiles => {
      const emptyCells = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (!currentTiles.some(tile => tile.x === i && tile.y === j)) {
            emptyCells.push({ x: i, y: j });
          }
        }
      }
      if (emptyCells.length > 0) {
        const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        const newTile: Tile = { id: tileIdCounter.current++, value, x, y };
        return [...currentTiles, newTile];
      }
      return currentTiles;
    });
  };

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || win) return;

    // This is a simplified and more robust logic inspired by common 2048 implementations.
    const L = GRID_SIZE;
    let board: (Tile | null)[][] = Array.from({ length: L }, () => Array(L).fill(null));
    tiles.forEach(t => {
        board[t.y][t.x] = { ...t };
    });

    let moved = false;
    let score = 0;

    const rotateLeft = (matrix: any[][]) => {
        let rows = matrix.length;
        let columns = matrix[0].length;
        let res: any[][] = [];
        for (let row = 0; row < rows; ++row) {
            res.push([]);
            for (let column = 0; column < columns; ++column) {
                res[row][column] = matrix[column][columns - 1 - row];
            }
        }
        return res;
    };
    
    const rotateRight = (matrix: any[][]) => {
        let rows = matrix.length;
        let columns = matrix[0].length;
        let res: any[][] = [];
        for (let row = 0; row < rows; ++row) {
            res.push([]);
            for (let column = 0; column < columns; ++column) {
                res[row][column] = matrix[rows - 1 - column][row];
            }
        }
        return res;
    };


    const slide = (row: (Tile | null)[]) => {
        let arr = row.filter(val => val);
        let missing = L - arr.length;
        let zeros = Array(missing).fill(null);
        arr = arr.concat(zeros);
        return arr;
    };

    const combine = (row: (Tile | null)[]) => {
        for (let i = 0; i < L - 1; i++) {
            if (row[i] && row[i]?.value === row[i + 1]?.value) {
                row[i]!.value *= 2;
                score += row[i]!.value;
                row[i + 1] = null;
                moved = true;
            }
        }
        return row;
    };
    
    // All moves are handled as a 'left' move, by rotating the board.
    if (direction === 'left') {
        // do nothing
    } else if (direction === 'right') {
        board = rotateRight(rotateRight(board));
    } else if (direction === 'up') {
        board = rotateLeft(board);
    } else if (direction === 'down') {
        board = rotateRight(board);
    }

    for (let y = 0; y < L; y++) {
        let row = board[y];
        let originalRow = [...row];
        row = slide(row);
        row = combine(row);
        row = slide(row);
        board[y] = row;
        for (let x=0; x<L; x++) {
            if (originalRow[x]?.value !== row[x]?.value) {
                moved = true;
            }
        }
    }
    
    if (direction === 'left') {
        // do nothing
    } else if (direction === 'right') {
        board = rotateLeft(rotateLeft(board));
    } else if (direction === 'up') {
        board = rotateRight(board);
    } else if (direction === 'down') {
        board = rotateLeft(board);
    }

    if (moved) {
        const newTiles: Tile[] = [];
        for (let y = 0; y < L; y++) {
            for (let x = 0; x < L; x++) {
                if (board[y][x]) {
                    const tile = board[y][x]!;
                    newTiles.push({ ...tile, x, y });
                }
            }
        }
        
        setScore(prev => prev + score);

        if (newTiles.some(t => t.value === 2048)) {
            setWin(true);
        }

        setTiles(newTiles);
        addRandomTile();

        if (!movesAvailable(newTiles)) {
            setGameOver(true);
        }
    }
  };

  const movesAvailable = (currentTiles: Tile[]) => {
    const L = GRID_SIZE;
    const grid: (Tile | null)[][] = Array.from({ length: L }, () => Array(L).fill(null));
    currentTiles.forEach(t => grid[t.y][t.x] = t);
    
    if (currentTiles.length < L * L) return true;

    for (let y = 0; y < L; y++) {
        for (let x = 0; x < L; x++) {
            const tile = grid[y][x];
            if (tile) {
                if (x < L - 1 && tile.value === grid[y][x+1]?.value) return true;
                if (y < L - 1 && tile.value === grid[y+1][x]?.value) return true;
            }
        }
    }
    return false;
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.explanationTitle}>Pivné 2048 🍻</Text>
        <Text style={styles.explanationText}>
          Ahoj, Marek! Vitaj v hre Pivné 2048. Posúvaj prstom po obrazovke (hore, dole, doľava, doprava), aby si pohol všetkými dielikmi naraz. Keď sa dva rovnaké obrázky dotknú, spoja sa do nového. Cieľom je prepracovať sa od vody až k vytúženej base piva. Po každom ťahu pribudne nový dielik, takže plánuj dopredu. Hra končí, keď je plocha plná a nemáš kam pohnúť. Veľa šťastia!
        </Text>
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.gridContainer} {...panResponder.panHandlers}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <View key={i} style={styles.cell} />
          ))}
          {tiles.map(tile => (
            <TileComponent key={tile.id} tile={tile} />
          ))}
        </View>
      </View>
      {(gameOver || win) && (
        <View style={styles.overlay}>
            <Text style={styles.overlayText}>{win ? "Vyhral si!" : "Koniec hry"}</Text>
            <TouchableOpacity onPress={() => startGame()} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Hrať znova</Text>
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const TileComponent = ({ tile }: { tile: Tile }) => {
  const scale = useSharedValue(0);
  const positionX = useSharedValue(tile.x * (CELL_SIZE + CELL_MARGIN * 2) + CELL_MARGIN);
  const positionY = useSharedValue(tile.y * (CELL_SIZE + CELL_MARGIN * 2) + CELL_MARGIN);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 200 });
  }, []);
  
  useEffect(() => {
    positionX.value = withTiming(tile.x * (CELL_SIZE + CELL_MARGIN * 2) + CELL_MARGIN, { duration: 100 });
    positionY.value = withTiming(tile.y * (CELL_SIZE + CELL_MARGIN * 2) + CELL_MARGIN, { duration: 100 });
  }, [tile.x, tile.y]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      top: positionY.value,
      left: positionX.value,
    };
  });

  return (
    <Animated.View style={[styles.tile, animatedStyle]}>
      <Image source={TILE_IMAGES[tile.value as keyof typeof TILE_IMAGES]} style={styles.tileImage} />
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#bbada0',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20, // Reduced padding
  },
  explanationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  explanationText: {
    fontSize: 16,
    color: '#eee4da',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Removed custom header styles
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#776e65',
    marginBottom: 20,
  },
  gridContainer: {
    width: CELL_SIZE * GRID_SIZE + CELL_MARGIN * 2 * GRID_SIZE,
    height: CELL_SIZE * GRID_SIZE + CELL_MARGIN * 2 * GRID_SIZE,
    backgroundColor: '#bbada0',
    borderRadius: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(238, 228, 218, 0.35)',
    margin: CELL_MARGIN,
    borderRadius: 3,
  },
  tile: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#776e65',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8f7a66',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  }
});

export default Game2048Screen;

