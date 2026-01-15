import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface ToggleItemProps {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function ToggleItem({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: ToggleItemProps) {
  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.left}>
        <Text style={[styles.title, disabled && styles.titleDisabled]}>{title}</Text>
        <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.SWITCH_OFF, true: COLORS.PRIMARY }}
        thumbColor={Platform.OS === 'android' ? COLORS.ANDROID_THUMB : undefined}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingLeft: SPACING.LG,
    paddingRight: SPACING.XXL,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  left: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  titleDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  subtitleDisabled: {
    color: COLORS.TEXT_TERTIARY,
  },
});
