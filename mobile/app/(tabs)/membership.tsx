import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MembershipPayment {
  id: string;
  amount: string;
  year: number;
  month: number;
  paidAt: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export default function MembershipScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async () => {
    try {
      const response = await apiClient.get<MembershipPayment[]>('/api/membership-fees/my-payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading membership:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMembership();
  };

  const getPaymentForMonth = (year: number, month: number) => {
    return payments.find(p => p.year === year && p.month === month);
  };

  const currentYearPayments = payments.filter(p => p.year === currentYear);
  const totalPaid = currentYearPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const paidMonths = currentYearPayments.length;

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: AppColors.primary }]}>
        <Text style={styles.summaryTitle}>{currentYear}. godina</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{paidMonths}/12</Text>
            <Text style={styles.summaryLabel}>Plaćeno mjeseci</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalPaid.toFixed(2)} €</Text>
            <Text style={styles.summaryLabel}>Ukupno uplaćeno</Text>
          </View>
        </View>
      </View>

      {/* Monthly Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pregled po mjesecima</Text>
      <View style={styles.monthsGrid}>
        {MONTHS.map((month, index) => {
          const payment = getPaymentForMonth(currentYear, index + 1);
          const isPaid = !!payment;
          const currentMonth = new Date().getMonth();
          const isPast = index < currentMonth;
          
          return (
            <View 
              key={index} 
              style={[
                styles.monthCard,
                { backgroundColor: colors.surface },
                isPaid && styles.monthCardPaid,
                !isPaid && isPast && styles.monthCardOverdue
              ]}
            >
              <Text style={[
                styles.monthName,
                { color: isPaid ? AppColors.success : isPast ? AppColors.error : colors.text }
              ]}>
                {month}
              </Text>
              <Text style={[
                styles.monthStatus,
                { color: isPaid ? AppColors.success : isPast ? AppColors.error : colors.textSecondary }
              ]}>
                {isPaid ? '✓' : isPast ? '✗' : '−'}
              </Text>
              {payment && (
                <Text style={[styles.monthAmount, { color: colors.textSecondary }]}>
                  {parseFloat(payment.amount).toFixed(2)} €
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Payment History */}
      {payments.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Historija uplata</Text>
          {payments.slice(0, 10).map((payment) => (
            <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentMonth, { color: colors.text }]}>
                  {MONTHS[payment.month - 1]} {payment.year}
                </Text>
                <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                  Uplaćeno: {new Date(payment.paidAt).toLocaleDateString('hr-HR')}
                </Text>
              </View>
              <Text style={[styles.paymentAmount, { color: AppColors.success }]}>
                {parseFloat(payment.amount).toFixed(2)} €
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h2,
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  summaryValue: {
    ...Typography.h2,
    color: '#fff',
  },
  summaryLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  monthCard: {
    width: '23%',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthCardPaid: {
    borderWidth: 1,
    borderColor: AppColors.success,
  },
  monthCardOverdue: {
    borderWidth: 1,
    borderColor: AppColors.error,
  },
  monthName: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  monthStatus: {
    fontSize: 20,
    marginVertical: 2,
  },
  monthAmount: {
    ...Typography.caption,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMonth: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentDate: {
    ...Typography.caption,
  },
  paymentAmount: {
    ...Typography.h3,
  },
});
