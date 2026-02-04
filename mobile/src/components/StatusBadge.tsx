import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../constants/colors';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  const backgroundColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';

  return (
    <Text
      style={[styles.badge, { backgroundColor }]}
      accessibilityLabel={`Status: ${statusText}`}
    >
      {statusText}
    </Text>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
