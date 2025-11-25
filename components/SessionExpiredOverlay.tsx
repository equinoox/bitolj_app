// components/SessionExpiredOverlay.tsx
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SessionExpiredOverlayProps {
  visible: boolean;
  onLogout: () => void;
}

export const SessionExpiredOverlay = ({ visible, onLogout }: SessionExpiredOverlayProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-8">
        <View className="bg-secondary rounded-3xl p-8 w-full items-center">
        <MaterialCommunityIcons name="timer-off-outline" size={80} color="#FFA500" />
          
          
          <Text className="text-white text-3xl font-bold text-center mt-6">
            Sesija je Istekla
          </Text>
          
          <Text className="text-text_color_2 text-lg text-center mt-4">
            Vaša sesija je istekla zbog neaktivnosti. Molimo vas da se ponovo prijavite.
          </Text>
          
          <TouchableOpacity
            className="bg-orange rounded-xl py-4 px-8 mt-8 w-full"
            onPress={onLogout}
          >
            <Text className="text-black text-xl font-bold text-center">
              Odjavi se
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};