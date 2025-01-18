import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";

interface DialogModalProps {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onAddPlus: () => void;
}

const DialogModal: React.FC<DialogModalProps> = ({
  visible,
  value,
  onChangeText,
  onConfirm,
  onCancel,
  onAddPlus,
}) => {

  const handleSubmit = () => {
    if (!value || !value.trim()) {
      onChangeText("0");
    } else {
      onConfirm()
    }
  };

  const handleCancel = () => {
    if (!value || !value.trim()) {
      onChangeText("0");
    }
    onCancel();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.dialogContainer}>
          <Text style={styles.title}>Unesite vrednosti</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder=""
            keyboardType="number-pad"
          />
        <View style={styles.addButtonContainer}>
        </View>
          <View style={styles.buttonContainer}>
            <Button title="OK" onPress={handleSubmit} />
            <Button title="[  +  ]" onPress={onAddPlus}/>
            <Button title="Cancel" onPress={handleCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialogContainer: {
    width: 300,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  addButtonContainer: {
    marginBottom: 10,
    alignSelf: "center",
  },
});

export default DialogModal;