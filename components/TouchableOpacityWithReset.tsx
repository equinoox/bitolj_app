import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const TouchableOpacityWithReset = (props: TouchableOpacityProps) => {
  const { resetInactivityTimeout } = useAuth();

  return (
    <TouchableOpacity
      {...props}
      onPress={(e) => {
        resetInactivityTimeout();
        props.onPress?.(e);
      }}
    />
  );
};