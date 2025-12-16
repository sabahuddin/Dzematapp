import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, SafeAreaView } from 'react-native';
import { apiClient } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  collected: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
}

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const response = await apiClient.get<Project[]>('/api/projects');
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#26A69A';
      case 'completed': return '#1E88E5';
      case 'cancelled': return '#9E9E9E';
      default: return '#546E7A';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivan';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  const calculateProgress = (collected: string, goal: string) => {
    const c = parseFloat(collected) || 0;
    const g = parseFloat(goal) || 1;
    return Math.min((c / g) * 100, 100);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3949AB" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Projekti</Text>
      </View>

      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3949AB']} />}>
        {projects.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bank-off" size={60} color="#B0BEC5" />
            <Text style={styles.emptyText}>Nema projekata</Text>
          </View>
        ) : (
          projects.map((project) => {
            const progress = calculateProgress(project.collected, project.goal);
            return (
              <View key={project.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(project.status)}</Text>
                  </View>
                </View>
                
                {project.description && (
                  <Text style={styles.cardDesc}>{project.description}</Text>
                )}

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Prikupljeno</Text>
                    <Text style={styles.statValue}>{project.collected} KM</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Cilj</Text>
                    <Text style={styles.statValue}>{project.goal} KM</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.donateBtn}>
                  <MaterialCommunityIcons name="heart-outline" size={18} color="#fff" />
                  <Text style={styles.donateBtnText}>Doniraj</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#3949AB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1' },
  topBar: { backgroundColor: '#3949AB', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1, backgroundColor: '#ECEFF1', padding: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9E9E9E', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D1B2A', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#546E7A', marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#ECEFF1', borderRadius: 4, overflow: 'hidden', marginRight: 12 },
  progressFill: { height: '100%', backgroundColor: '#26A69A', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#0D1B2A', width: 40, textAlign: 'right' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#9E9E9E', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#0D1B2A' },
  donateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#26A69A', paddingVertical: 12, borderRadius: 10, gap: 6 },
  donateBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
