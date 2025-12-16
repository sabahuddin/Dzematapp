import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  inStock: boolean;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: string | null;
  type: 'sale' | 'gift';
  imageUrl: string | null;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function ShopScreen() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'marketplace'>('shop');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '', type: 'sale' as 'sale' | 'gift' });
  const [submitting, setSubmitting] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, marketplaceRes] = await Promise.all([
        apiClient.get<ShopProduct[]>('/api/shop/products').catch(() => ({ data: [] })),
        apiClient.get<MarketplaceItem[]>('/api/marketplace/items').catch(() => ({ data: [] }))
      ]);
      setProducts(productsRes.data || []);
      setMarketplaceItems(marketplaceRes.data || []);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePurchaseRequest = async (product: ShopProduct) => {
    try {
      await apiClient.post('/api/shop/purchase-requests', {
        productId: product.id,
        quantity: 1
      });
      Alert.alert('Uspješno', 'Zahtjev za kupovinu je poslan.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati zahtjev.');
    }
  };

  const handleAddMarketplaceItem = async () => {
    if (!newItem.title.trim()) {
      Alert.alert('Greška', 'Unesite naslov');
      return;
    }
    setSubmitting(true);
    try {
      const priceValue = newItem.type === 'gift' ? null : 
        (newItem.price ? parseFloat(newItem.price) : null);
      
      await apiClient.post('/api/marketplace/items', {
        title: newItem.title,
        description: newItem.description,
        price: priceValue,
        type: newItem.type
      });
      setShowAddModal(false);
      setNewItem({ title: '', description: '', price: '', type: 'sale' });
      loadData();
      Alert.alert('Uspješno', 'Oglas je objavljen.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće objaviti oglas.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => setActiveTab('shop')}
        >
          <Text style={[styles.tabText, activeTab === 'shop' && styles.activeTabText]}>DžematShop</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'marketplace' && styles.activeTab]}
          onPress={() => setActiveTab('marketplace')}
        >
          <Text style={[styles.tabText, activeTab === 'marketplace' && styles.activeTabText]}>Marketplace</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {activeTab === 'shop' ? (
          products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema proizvoda u shopu</Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                {product.imageUrl && (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                )}
                <View style={styles.cardContent}>
                  <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                  <Text style={[styles.productDesc, { color: colors.textSecondary }]}>{product.description}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{product.price} KM</Text>
                    {product.inStock ? (
                      <TouchableOpacity 
                        style={styles.buyButton}
                        onPress={() => handlePurchaseRequest(product)}
                      >
                        <Text style={styles.buyButtonText}>Zatraži</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.outOfStock}>Nema na stanju</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )
        ) : (
          <>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Dodaj oglas</Text>
            </TouchableOpacity>
            
            {marketplaceItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏷️</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema oglasa</Text>
              </View>
            ) : (
              marketplaceItems.map((item) => (
                <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <View style={styles.cardContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.productName, { color: colors.text }]}>{item.title}</Text>
                      <View style={[styles.typeBadge, item.type === 'gift' ? styles.giftBadge : styles.saleBadge]}>
                        <Text style={styles.typeBadgeText}>{item.type === 'gift' ? 'Poklon' : 'Prodaja'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.productDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                    <View style={styles.itemFooter}>
                      {item.price && <Text style={styles.price}>{item.price} KM</Text>}
                      <Text style={[styles.sellerName, { color: colors.textSecondary }]}>Od: {item.userName}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Novi oglas</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Naslov"
              placeholderTextColor={colors.textSecondary}
              value={newItem.title}
              onChangeText={(text) => setNewItem({ ...newItem, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Opis"
              placeholderTextColor={colors.textSecondary}
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, newItem.type === 'sale' && styles.typeOptionActive]}
                onPress={() => setNewItem({ ...newItem, type: 'sale' })}
              >
                <Text style={[styles.typeOptionText, newItem.type === 'sale' && styles.typeOptionTextActive]}>Prodaja</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, newItem.type === 'gift' && styles.typeOptionActive]}
                onPress={() => setNewItem({ ...newItem, type: 'gift' })}
              >
                <Text style={[styles.typeOptionText, newItem.type === 'gift' && styles.typeOptionTextActive]}>Poklon</Text>
              </TouchableOpacity>
            </View>
            
            {newItem.type === 'sale' && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Cijena (KM)"
                placeholderTextColor={colors.textSecondary}
                value={newItem.price}
                onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                keyboardType="numeric"
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleAddMarketplaceItem}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Objavi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: AppColors.primary, paddingTop: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#fff' },
  tabText: { ...Typography.body, color: 'rgba(255,255,255,0.7)' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  content: { padding: Spacing.md },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  productImage: { width: '100%', height: 150, resizeMode: 'cover' },
  cardContent: { padding: Spacing.md },
  productName: { ...Typography.h3, marginBottom: Spacing.xs },
  productDesc: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { ...Typography.h3, color: AppColors.secondary },
  buyButton: { backgroundColor: AppColors.secondary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  buyButtonText: { ...Typography.button, color: '#fff' },
  outOfStock: { ...Typography.bodySmall, color: AppColors.error },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
  addButton: { backgroundColor: AppColors.secondary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginBottom: Spacing.md },
  addButtonText: { ...Typography.button, color: '#fff' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  saleBadge: { backgroundColor: AppColors.secondary },
  giftBadge: { backgroundColor: AppColors.accent },
  typeBadgeText: { ...Typography.caption, color: '#fff' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sellerName: { ...Typography.caption },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  input: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  typeOption: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  typeOptionActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  typeOptionText: { ...Typography.body, color: AppColors.textSecondary },
  typeOptionTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  cancelButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  cancelButtonText: { ...Typography.body, color: AppColors.textSecondary },
  submitButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: AppColors.secondary, alignItems: 'center' },
  submitButtonText: { ...Typography.button, color: '#fff' },
  buttonDisabled: { opacity: 0.7 },
});
