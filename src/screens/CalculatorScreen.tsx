import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';

type Mode = 'area' | 'volume';

const CalculatorScreen = () => {
  const [mode, setMode] = useState<Mode>('area');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [total, setTotal] = useState(0);

  const currentResult = useMemo(() => {
    const l = parseFloat(length.replace(',', '.'));
    const w = parseFloat(width.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));

    if (mode === 'area') {
      return isNaN(l) || isNaN(w) ? 0 : l * w;
    } else {
      return isNaN(l) || isNaN(w) || isNaN(h) ? 0 : l * w * h;
    }
  }, [mode, length, width, height]);

  const addToTotal = () => {
    if (currentResult > 0) {
      setTotal(prevTotal => prevTotal + currentResult);
      resetInputs();
      Keyboard.dismiss();
    }
  };

  const resetTotal = () => {
    setTotal(0);
  };
  
  const resetInputs = () => {
    setLength('');
    setWidth('');
    setHeight('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'area' && styles.activeMode]}
            onPress={() => setMode('area')}
          >
            <Text style={styles.modeText}>Plocha (m²)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'volume' && styles.activeMode]}
            onPress={() => setMode('volume')}
          >
            <Text style={styles.modeText}>Objem (m³)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Dĺžka (m)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={length}
            onChangeText={setLength}
          />
          <TextInput
            style={styles.input}
            placeholder="Šírka (m)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={width}
            onChangeText={setWidth}
          />
          {mode === 'volume' && (
            <TextInput
              style={styles.input}
              placeholder="Výška / Hĺbka (m)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          )}
        </View>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultLabel}>Výsledok</Text>
          <Text style={styles.resultValue}>
            {currentResult.toFixed(3)} {mode === 'area' ? 'm²' : 'm³'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={addToTotal} disabled={currentResult <= 0}>
          <Text style={styles.addButtonText}>Pridať k súčtu (+)</Text>
        </TouchableOpacity>

        <View style={styles.totalContainer}>
            <View>
                <Text style={styles.totalLabel}>Celkový súčet:</Text>
                <Text style={styles.totalValue}>
                    {total.toFixed(3)} {mode === 'area' ? 'm²' : 'm³'}
                </Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={resetTotal}>
                <Text style={styles.resetButtonText}>Vynulovať</Text>
            </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    modeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#333',
        borderRadius: 20,
        marginHorizontal: 5,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    activeMode: {
        backgroundColor: '#ff4500',
    },
    modeText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        fontSize: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    resultsContainer: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
    },
    resultLabel: {
        color: '#AAA',
        fontSize: 18,
    },
    resultValue: {
        color: '#FFFFFF',
        fontSize: 40,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    addButton: {
        backgroundColor: '#ff4500',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 20,
    },
    totalLabel: {
        color: '#AAA',
        fontSize: 18,
    },
    totalValue: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    resetButton: {
        padding: 10,
    },
    resetButtonText: {
        color: '#ff4500',
        fontSize: 16,
    },
});

export default CalculatorScreen;

