import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  status: string;
  category?: string;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: string;
  type: 'prodaja' | 'poklon';
  photos?: string[];
}

export default function ShopScreen() {
  const [activeTab, setActiveTab] = useState<'shop' | 'marketplace'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [productsData, marketplaceData] = await Promise.all([
        apiClient.get<Product[]>('/api/shop/products').catch(() => []),
        apiClient.get<MarketplaceItem[]>('/api/marketplace/items').catch(() => []),
      ]);
      setProducts(productsData || []);
      setMarketplaceItems(marketplaceData || []);
    } catch (error) {
      console.error('Failed to load shop data:', error);
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Shop', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Shop', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'shop' && styles.tabActive]} onPress={() => setActiveTab('shop')}>
            <Text style={[styles.tabText, activeTab === 'shop' && styles.tabTextActive]}>DžematShop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'marketplace' && styles.tabActive]} onPress={() => setActiveTab('marketplace')}>
            <Text style={[styles.tabText, activeTab === 'marketplace' && styles.tabTextActive]}>Marketplace</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
        >
          {activeTab === 'shop' ? (
            products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={64} color={AppColors.navInactive} />
                <Text style={styles.emptyText}>Nema proizvoda</Text>
              </View>
            ) : (
              <View style={styles.productGrid}>
                {products.map(product => (
                  <TouchableOpacity key={product.id} style={styles.productCard}>
                    <View style={styles.productImage}>
                      {product.imageUrl ? (
                        <Image source={{ uri: product.imageUrl }} style={styles.productImageContent} />
                      ) : (
                        <Ionicons name="cube" size={40} color={AppColors.navInactive} />
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            marketplaceItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={64} color={AppColors.navInactive} />
                <Text style={styles.emptyText}>Nema oglasa</Text>
              </View>
            ) : (
              marketplaceItems.map(item => (
                <TouchableOpacity key={item.id} style={styles.marketplaceCard}>
                  <View style={[styles.typeBadge, item.type === 'poklon' && styles.typeBadgeGift]}>
                    <Text style={styles.typeBadgeText}>{item.type === 'poklon' ? 'Poklon' : 'Prodaja'}</Text>
                  </View>
                  <Text style={styles.marketplaceTitle}>{item.title}</Text>
                  <Text style={styles.marketplaceDescription} numberOfLines={2}>{item.description}</Text>
                  {item.type === 'prodaja' && <Text style={styles.marketplacePrice}>{item.price}</Text>}
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  tabs: { flexDirection: 'row', backgroundColor: AppColors.white, borderBottomWidth: 1, borderBottomColor: AppColors.navBorder },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: AppColors.primary },
  tabText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: AppColors.primary },
  list: { flex: 1 },
  listContent: { padding: Spacing.md },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  productImage: { height: 120, backgroundColor: AppColors.background, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  productImageContent: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  productName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  productPrice: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: AppColors.secondary },
  marketplaceCard: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: `${AppColors.secondary}20`, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginBottom: Spacing.xs },
  typeBadgeGift: { backgroundColor: `${AppColors.accent}20` },
  typeBadgeText: { fontSize: Typography.fontSize.xs, color: AppColors.secondary, fontWeight: Typography.fontWeight.medium },
  marketplaceTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  marketplaceDescription: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginBottom: Spacing.sm },
  marketplacePrice: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: AppColors.secondary },
});
