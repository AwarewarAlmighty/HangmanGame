import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, // Import ScrollView
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  Vibration,
} from 'react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Word lists by difficulty
const WORD_LISTS = {
  easy: ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'FISH', 'BIRD', 'BOOK', 'CAKE', 'GAME'],
  medium: ['HOUSE', 'PLANT', 'MUSIC', 'PHONE', 'LIGHT', 'WATER', 'CLOUD', 'SMILE', 'DANCE', 'HEART'],
  hard: ['AMAZING', 'JOURNEY', 'MYSTERY', 'FREEDOM', 'COURAGE', 'SCIENCE', 'HARMONY', 'VICTORY', 'BALANCE', 'THUNDER']
};

const MAX_WRONG_GUESSES = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Hangman drawing stages
const HANGMAN_STAGES = [
  '', // 0 wrong guesses
  '  |\n  |', // 1
  '  +---+\n  |   |\n      |', // 2
  '  +---+\n  |   |\n  O   |', // 3
  '  +---+\n  |   |\n  O   |\n  |   |', // 4
  '  +---+\n  |   |\n  O   |\n /|   |', // 5
  '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |', // 6 (game over)
];

export default function HangmanGame() {
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));

  // Sound effects (optional - commented out for demo)
  // const [correctSound, setCorrectSound] = useState(null);
  // const [wrongSound, setWrongSound] = useState(null);
  // const [winSound, setWinSound] = useState(null);
  // const [loseSound, setLoseSound] = useState(null);

  // Initialize game
  const initializeGame = useCallback(() => {
    const wordList = WORD_LISTS[difficulty];
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');

    // Reset animations
    fadeAnim.setValue(1);
    pulseAnim.setValue(1);
    shakeAnim.setValue(0);
  }, [difficulty, fadeAnim, pulseAnim, shakeAnim]);

  // Initialize game on mount and difficulty change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Check win condition
  const checkWinCondition = useCallback(() => {
    if (currentWord && currentWord.split('').every(letter => guessedLetters.includes(letter))) {
      setGameStatus('won');
      setScore(prev => prev + 10);

      // Win animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      // playSound(winSound);
      Vibration.vibrate([100, 50, 100]);
    }
  }, [currentWord, guessedLetters, pulseAnim]);

  // Check lose condition
  useEffect(() => {
    if (wrongGuesses >= MAX_WRONG_GUESSES) {
      setGameStatus('lost');

      // Lose animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();

      // playSound(loseSound);
      Vibration.vibrate([200, 100, 200, 100, 200]);
    }
  }, [wrongGuesses, shakeAnim]);

  // Check win condition when guessed letters change
  useEffect(() => {
    checkWinCondition();
  }, [checkWinCondition]);

  // Handle letter guess
  const handleLetterGuess = useCallback((letter) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter)) {
      return;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (currentWord.includes(letter)) {
      // Correct guess animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // playSound(correctSound);
      Vibration.vibrate(50);
    } else {
      setWrongGuesses(prev => prev + 1);

      // Wrong guess animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        })
      ]).start();

      // playSound(wrongSound);
      Vibration.vibrate(100);
    }
  }, [gameStatus, guessedLetters, currentWord, pulseAnim, shakeAnim]);

  // Display word with guessed letters
  const displayWord = () => {
    return currentWord
      .split('')
      .map(letter => (guessedLetters.includes(letter) ? letter : '_'))
      .join(' ');
  };

  // Get letter button style
  const getLetterButtonStyle = (letter) => {
    const baseStyle = [styles.letterButton];

    if (guessedLetters.includes(letter)) {
      if (currentWord.includes(letter)) {
        baseStyle.push(styles.correctLetter);
      } else {
        baseStyle.push(styles.incorrectLetter);
      }
    }

    if (isDarkMode) {
      baseStyle.push(styles.letterButtonDark);
    }

    return baseStyle;
  };

  // Get letter text style
  const getLetterTextStyle = (letter) => {
    const baseStyle = [styles.letterText];

    if (guessedLetters.includes(letter)) {
      baseStyle.push(styles.guessedLetterText);
    }

    if (isDarkMode) {
      baseStyle.push(styles.letterTextDark);
    }

    return baseStyle;
  };

  // Theme styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <ScrollView 
        contentContainerStyle={[styles.container, themeStyles.container]}
        keyboardShouldPersistTaps='handled'
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, themeStyles.text]}>Hangman</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.themeButton, themeStyles.button]}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Text style={[styles.themeButtonText, themeStyles.buttonText]}>
              {isDarkMode ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.score, themeStyles.text]}>Score: {score}</Text>
        </View>
      </View>

      {/* Difficulty Selector */}
      <View style={styles.difficultyContainer}>
        {Object.keys(WORD_LISTS).map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              difficulty === level && styles.selectedDifficulty,
              themeStyles.button
            ]}
            onPress={() => setDifficulty(level)}
            disabled={gameStatus === 'playing'}
          >
            <Text style={[
              styles.difficultyText,
              difficulty === level && styles.selectedDifficultyText,
              themeStyles.buttonText
            ]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hangman Drawing */}
      <Animated.View
        style={[
          styles.hangmanContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        <Text style={[styles.hangmanText, themeStyles.text]}>
          {HANGMAN_STAGES[wrongGuesses]}
        </Text>
      </Animated.View>

      {/* Word Display */}
      <Animated.View
        style={[
          styles.wordContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Text style={[styles.wordText, themeStyles.text]}>
          {displayWord()}
        </Text>
      </Animated.View>

      {/* Game Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.wrongGuessesText, themeStyles.text]}>
          Wrong guesses: {wrongGuesses}/{MAX_WRONG_GUESSES}
        </Text>

        {gameStatus === 'won' && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[styles.statusText, styles.winText]}>
              🎉 You Won! 🎉
            </Text>
          </Animated.View>
        )}

        {gameStatus === 'lost' && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[styles.statusText, styles.loseText]}>
              💀 Game Over! The word was: {currentWord}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Alphabet Keyboard */}
      <View style={styles.keyboardContainer}>
        {ALPHABET.map(letter => (
          <TouchableOpacity
            key={letter}
            style={getLetterButtonStyle(letter)}
            onPress={() => handleLetterGuess(letter)}
            disabled={gameStatus !== 'playing' || guessedLetters.includes(letter)}
          >
            <Text style={getLetterTextStyle(letter)}>
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Restart Button */}
      <TouchableOpacity
        style={[styles.restartButton, themeStyles.button]}
        onPress={initializeGame}
      >
        <Text style={[styles.restartButtonText, themeStyles.buttonText]}>
          {gameStatus === 'playing' ? 'New Game' : 'Play Again'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Use flexGrow to allow the container to expand
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  themeButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  difficultyButton: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDifficulty: {
    backgroundColor: '#007AFF',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDifficultyText: {
    color: 'white',
  },
  hangmanContainer: {
    alignItems: 'center',
    marginVertical: 20,
    minHeight: 150,
    justifyContent: 'center',
  },
  hangmanText: {
    fontSize: 16,
    fontFamily: 'monospace',
    lineHeight: 20,
    textAlign: 'center',
  },
  wordContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 15,
    minHeight: 60,
  },
  wrongGuessesText: {
    fontSize: 16,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  winText: {
    color: '#28A745',
  },
  loseText: {
    color: '#DC3545',
  },
  keyboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  letterButton: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  letterButtonDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#007AFF',
  },
  correctLetter: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  incorrectLetter: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  letterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  letterTextDark: {
    color: '#FFFFFF',
  },
  guessedLetterText: {
    color: 'white',
  },
  restartButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
  },
  text: {
    color: '#212529',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#007AFF',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
  },
  text: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#2C2C2E',
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});