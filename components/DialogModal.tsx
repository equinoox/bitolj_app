import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';


interface DialogModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  initialValue: string;
}

const DialogModal: React.FC<DialogModalProps> = ({ visible, onClose, onConfirm, initialValue }) => {
  const [input, setInput] = useState<string>(initialValue || '');

  const handleAdd = () => {
    setInput((prev) => `${prev}+`);
  };

  const handleConfirm = () => {
    if (validateInput(input)) {
      onConfirm(input);
      onClose();
    }
  };

  const validateInput = (value: string): boolean => {
    const regex = /^\d+(?:\+\d+)*$/;
    return regex.test(value);
  };

  const evaluateExpression = (expr: string): string => {
    try {
      if (validateInput(expr)) {
        return expr
          .split('+')
          .map(num => parseInt(num, 10))
          .reduce((sum, num) => sum + num, 0)
          .toString();
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
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder="Unesite broj..."
              autoFocus
            />

            <View style={styles.inlineButtons}>
              <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

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
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  evaluatedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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

export default DialogModal;
