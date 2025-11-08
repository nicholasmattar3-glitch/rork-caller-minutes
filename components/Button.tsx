import { ReactNode } from 'react';
import { Pressable } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  style?: any;
  children: ReactNode;
  disabled?: boolean;
}

export default function Button({ onPress, style, children, disabled = false }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
}
