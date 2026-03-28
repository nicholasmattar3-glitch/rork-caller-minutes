import { View, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import Button from '@/components/Button';
import { COLORS, SPACING } from '@/constants/theme';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onAction?: () => void;
  leftIcon: ReactNode;
  rightIcon?: ReactNode;
}

export default function ModalHeader({
  title,
  onClose,
  onAction,
  leftIcon,
  rightIcon,
}: ModalHeaderProps) {
  return (
    <View style={styles.header}>
      <Button onPress={onClose}>{leftIcon}</Button>
      <Text style={styles.title}>{title}</Text>
      {onAction && rightIcon ? (
        <Button onPress={onAction}>{rightIcon}</Button>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 24,
  },
});
