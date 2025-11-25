import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const TextInputWithReset = (props: TextInputProps) => {
  const { resetInactivityTimeout } = useAuth();

  return (
    <TextInput
      {...props}
      onChangeText={(text) => {
        resetInactivityTimeout();
        props.onChangeText?.(text);
      }}
      onFocus={(e) => {
        resetInactivityTimeout();
        props.onFocus?.(e);
      }}
      onTouchStart={(e) => {
        resetInactivityTimeout();
        props.onTouchStart?.(e);
      }}
    />
  );
};