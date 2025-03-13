import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';

interface DialogModalNProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  initialValue: string;
}

const DialogModalN: React.FC<DialogModalNProps> = ({ visible, onClose, onConfirm, initialValue }) => {
  const [input, setInput] = useState<string>(initialValue || '');
  const inputRef = useRef<TextInput>(null);
  
  // Use useEffect to focus the input when the modal becomes visible
  useEffect(() => {
    if (visible) {
      // Short timeout to ensure modal is fully rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const handleAdd = () => {
    setInput((prev) => `${prev}+`);
  };
  
  const handleSubtract = () => {
    setInput((prev) => `${prev}-`);
  };
  
  const handleConfirm = () => {
    if (validateInput(input)) {
      // Just pass the raw expression
      onConfirm(input);
      onClose();
    }
  };
  
  const validateInput = (value: string): boolean => {
    // Allow expressions with + and - operations
    const regex = /^-?\d+(?:[+-]\d+)*$/;
    return regex.test(value);
  };
  
  // We'll still show the evaluated result in the modal for user feedback,
  // but we won't store it separately
  const evaluateExpression = (expr: string): string => {
    try {
      if (!expr) return "0";
      
      if (validateInput(expr)) {
        // Replace all occurrences of "-" with "+-" to handle subtraction
        // But first handle the case where the expression starts with "-"
        let normalizedExpr = expr;
        if (normalizedExpr.startsWith('-')) {
          normalizedExpr = '0' + normalizedExpr;
        }
        
        normalizedExpr = normalizedExpr.replace(/-/g, '+-');
        
        // Split by "+" and handle the empty strings that might result from "+-" replacements
        const parts = normalizedExpr.split('+');
        const result = parts
          .filter(part => part !== '')
          .map(num => parseInt(num, 10))
          .reduce((sum, num) => sum + num, 0);
        
        return result.toString();
      }
      return expr;
    } catch {
      return expr;
    }
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.title}>UNESITE VREDNOSTI</Text>
            
            <Text style={styles.evaluatedText}>
              Vrednost: {evaluateExpression(input)}
            </Text>
            
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder="Unesite vrednosti..."
              autoFocus={true}
            />
            
            <View style={styles.inlineButtons}>
              <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.minusButton} onPress={handleSubtract} activeOpacity={0.7}>
                <Text style={styles.addButtonText}>-</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.warningText}>
              Upozorenje!{"\n"}
              Negativne vrednosti unosite samo u slučaju nedostatka pića.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm} activeOpacity={0.7}>
                <Text style={styles.buttonText}>Potvrdi</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  evaluatedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
},
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 10,
    textAlign: 'center',
},
  input: {
    borderWidth: 1,
    borderColor: '#393B44',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  inlineButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#FFA001',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 4,
  },
  minusButton: {
    backgroundColor: '#FFA001',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default DialogModalN;