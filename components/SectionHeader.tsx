import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, description && styles.titleWithDescription]}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.MD,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  titleWithDescription: {
    marginBottom: SPACING.XS,
  },
  description: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});
