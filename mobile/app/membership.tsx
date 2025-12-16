import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuth } from '../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Payment {
  id: string;
  amount: string;
  coverageMonth: number;
  coverageYear: number;
  paidAt: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export default function MembershipScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<{ payments: Payment[] }>('/api/membership-fees/my-payments');
      setPayments(data?.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currentYear = new Date().getFullYear();
  const thisYearPayments = payments.filter(p => p.coverageYear === currentYear);
  const paidMonths = new Set(thisYearPayments.map(p => p.coverageMonth));
  const totalPaid = thisYearPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Članarina', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Članarina', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{currentYear}. godina</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{paidMonths.size}</Text>
              <Text style={styles.summaryLabel}>Plaćeno mjeseci</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{12 - paidMonths.size}</Text>
              <Text style={styles.summaryLabel}>Preostalo</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalPaid.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>CHF ukupno</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pregled po mjesecima</Text>
        <View style={styles.monthsGrid}>
          {MONTHS.map((month, index) => {
            const isPaid = paidMonths.has(index + 1);
            const isFuture = index + 1 > new Date().getMonth() + 1;
            return (
              <View 
                key={month} 
                style={[
                  styles.monthCard, 
                  isPaid && styles.monthCardPaid,
                  isFuture && styles.monthCardFuture
                ]}
              >
                <Text style={[styles.monthName, isPaid && styles.monthNamePaid]}>{month}</Text>
                <Ionicons 
                  name={isPaid ? 'checkmark-circle' : isFuture ? 'time-outline' : 'close-circle-outline'} 
                  size={24} 
                  color={isPaid ? AppColors.white : isFuture ? AppColors.navInactive : AppColors.error} 
                />
              </View>
            );
          })}
        </View>

        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Historija uplata</Text>
            {payments.slice(0, 10).map(payment => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="checkmark" size={20} color={AppColors.white} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMonth}>{MONTHS[payment.coverageMonth - 1]} {payment.coverageYear}</Text>
                  <Text style={styles.paymentDate}>
                    Plaćeno: {new Date(payment.paidAt).toLocaleDateString('bs-BA')}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>{payment.amount} CHF</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  summaryCard: { backgroundColor: AppColors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  summaryTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: AppColors.white, marginBottom: Spacing.md, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: AppColors.white },
  summaryLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.md },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.lg },
  monthCard: { width: '23%', aspectRatio: 1, backgroundColor: AppColors.white, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm, ...Shadows.card },
  monthCardPaid: { backgroundColor: AppColors.accent },
  monthCardFuture: { backgroundColor: AppColors.background },
  monthName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  monthNamePaid: { color: AppColors.white },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card },
  paymentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.accent, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  paymentInfo: { flex: 1 },
  paymentMonth: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary },
  paymentDate: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary },
  paymentAmount: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: AppColors.accent },
});
