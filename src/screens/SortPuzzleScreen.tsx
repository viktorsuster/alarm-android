// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useNavigation } from '@react-navigation/native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useTranslate } from '../hooks/useTranslate';
// import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useDerivedValue, interpolate, Extrapolate, withSpring, withSequence } from 'react-native-reanimated';
// import { Gesture, GestureDetector } from 'react-native-gesture-handler';


// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// // --- Game Configuration ---
// const TUBE_CAPACITY = 4;
// const EMOJI_LIST = ['😀', '😂', '😍', '🥳', '🤯', '😎', '😡', '🥶', '🤢', '🤡'];

// // --- Types ---
// type Emoji = string;
// type Tube = {
//   id: number;
//   emojis: Emoji[];
// };

// // --- Helper Functions ---
// const shuffleArray = (array: any[]) => {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// };

// const generateLevel = (level: number): Tube[] => {
//     const numTubes = Math.min(level + 3, 8);
//     const numEmptyTubes = 2;
//     const numColors = numTubes - numEmptyTubes;
//     const colors = shuffleArray([...EMOJI_LIST]).slice(0, numColors);
  
//     let allEmojis: Emoji[] = [];
//     for (const color of colors) {
//       for (let i = 0; i < TUBE_CAPACITY; i++) {
//         allEmojis.push(color);
//       }
//     }
  
//     allEmojis = shuffleArray(allEmojis);
  
//     const tubes: Tube[] = [];
//     for (let i = 0; i < numColors; i++) {
//       tubes.push({
//         id: i,
//         emojis: allEmojis.slice(i * TUBE_CAPACITY, (i + 1) * TUBE_CAPACITY),
//       });
//     }
  
//     for (let i = 0; i < numEmptyTubes; i++) {
//       tubes.push({ id: numColors + i, emojis: [] });
//     }
  
//     return tubes;
//   };
  
// const TubeComponent = ({ tube, onPress, isSelected, shakingTubeId, shakeTranslateX }: { tube: Tube; onPress: () => void; isSelected: boolean; shakingTubeId: Animated.SharedValue<number | null>, shakeTranslateX: Animated.SharedValue<number> }) => {
//     const animatedStyle = useAnimatedStyle(() => {
//         const isMyTubeShaking = shakingTubeId.value === tube.id;
//         return {
//           transform: [
//             {
//               translateY: isSelected
//                 ? withSpring(-30, { damping: 15, stiffness: 150 })
//                 : withSpring(0, { damping: 15, stiffness: 150 }),
//             },
//             {
//                 translateX: isMyTubeShaking ? shakeTranslateX.value : 0,
//             }
//           ],
//           shadowOpacity: isSelected
//             ? withTiming(0.4, { duration: 200 })
//             : withTiming(0.1, { duration: 200 }),
//           shadowRadius: isSelected
//             ? withTiming(10, { duration: 200 })
//             : withTiming(5, { duration: 200 }),
//         };
//       });

//     return (
//         <Animated.View style={[styles.tubeWrapper, animatedStyle]}>
//             <TouchableOpacity onPress={onPress} style={styles.tube}>
//                 <View style={styles.emojiContainer}>
//                 {tube.emojis.map((emoji, index) => (
//                     <Text key={index} style={styles.emoji}>
//                     {emoji}
//                     </Text>
//                 ))}
//                 </View>
//             </TouchableOpacity>
//         </Animated.View>
//     )
// }
  

// const SortPuzzleScreen = () => {
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
//   const translate = useTranslate();

//   const [gameStarted, setGameStarted] = useState(false);
//   const [level, setLevel] = useState(1);
//   const [tubes, setTubes] = useState<Tube[]>([]);
//   const [selectedTubeId, setSelectedTubeId] = useState<number | null>(null);
//   const [win, setWin] = useState(false);
//   const selectionAnimation = useSharedValue(0);
//   const shakingTubeId = useSharedValue<number | null>(null);
//   const shakeTranslateX = useSharedValue(0);

//   const checkWinCondition = (currentTubes: Tube[]) => {
//     return currentTubes.every(tube => {
//       // Skúmavka je v poriadku, ak je buď prázdna...
//       if (tube.emojis.length === 0) {
//         return true;
//       }
//       // ...alebo je plná a všetky smajlíky sú rovnaké.
//       if (tube.emojis.length === TUBE_CAPACITY) {
//         const firstEmoji = tube.emojis[0];
//         return tube.emojis.every(emoji => emoji === firstEmoji);
//       }
//       // Ak je skúmavka čiastočne plná, level nie je dokončený.
//       return false;
//     });
//   };


//   useEffect(() => {
//     if (gameStarted) {
//       setupLevel(level);
//     }
//   }, [gameStarted, level]);

//   const setupLevel = (currentLevel: number) => {
//     setTubes(generateLevel(currentLevel));
//     setSelectedTubeId(null);
//     setWin(false);
//   };

//   const handleStartGame = () => {
//     setGameStarted(true);
//   };

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   const getBackgroundGradient = () => {
//     if (level < 3) return ['#E1F5FE', '#B3E5FC'];   // Light Blue
//     if (level < 5) return ['#FFF9C4', '#FFF176'];   // Yellow
//     if (level < 7) return ['#FFCC80', '#FF9800'];   // Orange
//     return ['#EF9A9A', '#E57373'];                  // Red
//   };

//   if (!gameStarted) {
//     return (
//       <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={styles.container}>
//         <SafeAreaView style={styles.startScreen}>
//           <Icon name="water-pump" style={styles.bigIcon} />
//           <TouchableOpacity
//             style={[styles.backButton, { top: insets.top || 20 }]}
//             onPress={handleGoBack}>
//             <Text style={styles.backButtonText}>✕</Text>
//           </TouchableOpacity>
//           <Text style={styles.welcomeText}>{translate('row_sort_puzzle')}</Text>
//           <Text style={styles.instructionText}>{translate('sort_puzzle_instructions')}</Text>
//           <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
//             <Text style={styles.startButtonText}>{translate('start_game')}</Text>
//           </TouchableOpacity>
//         </SafeAreaView>
//       </LinearGradient>
//     );
//   }

//   const handleTubePress = (tubeId: number) => {
//     const pressedTube = tubes.find(t => t.id === tubeId);
//     if (!pressedTube) return;
  
//     if (selectedTubeId === null) {
//       // Selecting a tube
//       if (pressedTube.emojis.length > 0) {
//         setSelectedTubeId(tubeId);
//         selectionAnimation.value = withSpring(1);
//       }
//     } else {
//       // A tube is already selected, trying to move emoji
//       const sourceTube = tubes.find(t => t.id === selectedTubeId);
//       const destinationTube = pressedTube;
  
//       if (!sourceTube || !destinationTube || sourceTube.id === destinationTube.id) {
//         // Deselect if clicking the same tube or invalid state
//         setSelectedTubeId(null);
//         selectionAnimation.value = withSpring(0);
//         return;
//       }
  
//       const emojiToMove = sourceTube.emojis[sourceTube.emojis.length - 1];
//       const canMove =
//         destinationTube.emojis.length < TUBE_CAPACITY &&
//         (destinationTube.emojis.length === 0 ||
//           destinationTube.emojis[destinationTube.emojis.length - 1] === emojiToMove);
  
//       if (canMove) {
//         const newTubes = tubes.map(t => ({ ...t, emojis: [...t.emojis] }));
//         const newSourceTube = newTubes.find(t => t.id === sourceTube.id)!;
//         const newDestinationTube = newTubes.find(t => t.id === destinationTube.id)!;
        
//         newDestinationTube.emojis.push(newSourceTube.emojis.pop()!);
//         setTubes(newTubes);

//         if (checkWinCondition(newTubes)) {
//             setTimeout(() => setWin(true), 500);
//         }
//       } else {
//         // Invalid move, trigger shake animation
//         shakingTubeId.value = destinationTube.id;
//         shakeTranslateX.value = withSequence(
//             withTiming(-10, { duration: 50 }),
//             withTiming(10, { duration: 100 }),
//             withTiming(-10, { duration: 100 }),
//             withTiming(10, { duration: 100 }),
//             withTiming(0, { duration: 50 })
//         );
//       }
      
//       setSelectedTubeId(null);
//       selectionAnimation.value = withSpring(0);
//     }
//   };
  
//   return (
//     <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
//       <SafeAreaView style={styles.safeArea}>
//         <TouchableOpacity 
//           style={[styles.backButton, { top: insets.top || 20 }]} 
//           onPress={handleGoBack}
//         >
//           <Text style={styles.backButtonText}>✕</Text>
//         </TouchableOpacity>
//         <View style={styles.header}>
//           <Text style={styles.levelText}>{level}</Text>
//         </View>
//         <View style={styles.gameContainer}>
//           <View style={styles.tubesContainer}>
//             {tubes.map((tube) => (
//               <TubeComponent 
//                 key={tube.id} 
//                 tube={tube} 
//                 onPress={() => handleTubePress(tube.id)}
//                 isSelected={tube.id === selectedTubeId}
//                 shakingTubeId={shakingTubeId}
//                 shakeTranslateX={shakeTranslateX}
//               />
//             ))}
//           </View>
//         </View>
//         {win && (
//             <View style={styles.winOverlay}>
//                 <Text style={styles.winText}>{translate('level_up')}</Text>
//                 <TouchableOpacity style={styles.nextLevelButton} onPress={() => setLevel(l => l + 1)}>
//                     <Text style={styles.nextLevelButtonText}>{translate('next_level')}</Text>
//                 </TouchableOpacity>
//             </View>
//         )}
//       </SafeAreaView>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   safeArea: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   startScreen: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   welcomeText: {
//     fontSize: 32,
//     color: '#000',
//     textAlign: 'center',
//     marginBottom: 10,
//     fontWeight: 'bold',
//   },
//   instructionText: {
//     fontSize: 18,
//     color: '#333',
//     textAlign: 'center',
//     marginBottom: 40,
//     lineHeight: 24,
//     paddingHorizontal: 20,
//   },
//   startButton: {
//     backgroundColor: '#000',
//     paddingHorizontal: 40,
//     paddingVertical: 15,
//     borderRadius: 25,
//   },
//   startButtonText: {
//     color: '#FFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   backButton: {
//     position: 'absolute',
//     left: 20,
//     width: 60,
//     height: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 100,
//   },
//   backButtonText: {
//     fontSize: 40,
//     color: '#000',
//     fontWeight: 'bold',
//   },
//   header: {
//     width: '100%',
//     alignItems: 'center',
//     marginTop: 80,
//   },
//   levelText: {
//     fontSize: 140,
//     fontWeight: 'bold',
//     color: 'rgba(0,0,0,0.15)',
//   },
//   gameContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   tubesContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     alignItems: 'flex-end',
//   },
//   tubeWrapper: {
//     margin: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   tube: {
//     width: 60,
//     height: 240, // 4 * 60
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 30,
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     borderTopLeftRadius: 10,
//     borderTopRightRadius: 10,
//     overflow: 'hidden',
//     justifyContent: 'flex-end',
//   },
//   emojiContainer: {
//     flexDirection: 'column-reverse',
//     alignItems: 'center',
//     width: '100%',
//   },
//   emoji: {
//     fontSize: 40,
//     lineHeight: 60, // Height of each emoji slot
//   },
//   bigIcon: {
//     position: 'absolute',
//     bottom: 40,
//     fontSize: 250,
//     color: 'rgba(0,0,0,0.08)',
//   },
//   winOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 200,
//   },
//   winText: {
//     fontSize: 48,
//     color: '#FFF',
//     fontWeight: 'bold',
//     marginBottom: 40,
//   },
//   nextLevelButton: {
//     backgroundColor: '#FFF',
//     paddingHorizontal: 40,
//     paddingVertical: 15,
//     borderRadius: 30,
//   },
//   nextLevelButtonText: {
//     color: '#000',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

// export default SortPuzzleScreen;
