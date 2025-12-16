import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Alert, TextInput, Modal, SafeAreaView } from 'react-native';
import { apiClient, API_BASE_URL } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  photos: string[];
  status?: string;
  createdById?: string;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: string | null;
  type: 'sell' | 'gift';
  photos: string[];
  status?: string;
  userId: string;
  user?: { firstName: string; lastName: string };
}

interface Service {
  id: string;
  name: string;
  description: string;
  photos: string[];
  price: string;
  duration: string;
  category: 'offer' | 'need';
  userId: string;
  user?: { firstName: string; lastName: string };
}

interface UserData {
  id: string;
  isAdmin?: boolean;
  roles?: string[];
}

type TabType = 'dzemat' | 'prodajem' | 'poklanjam' | 'usluge' | 'arhiva';

export default function ShopScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dzemat');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '', type: 'sell' as 'sell' | 'gift' });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('imam');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('dzematapp_user');
      if (userData) setUser(JSON.parse(userData));

      const [productsRes, marketplaceRes, servicesRes] = await Promise.all([
        apiClient.get<ShopProduct[]>('/api/shop/products').catch(() => ({ data: [] })),
        apiClient.get<MarketplaceItem[]>('/api/marketplace/items').catch(() => ({ data: [] })),
        apiClient.get<Service[]>('/api/services').catch(() => ({ data: [] })),
      ]);
      setProducts(productsRes.data || []);
      setMarketplaceItems(marketplaceRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleContactSeller = (item: MarketplaceItem | ShopProduct | Service, itemName: string) => {
    Alert.alert('Kontaktiraj', `Želite li kontaktirati vlasnika za "${itemName}"?`, [
      { text: 'Odustani', style: 'cancel' },
      { text: 'Da', onPress: () => Alert.alert('Poruka poslana', 'Vlasnik će primiti obavijest.') }
    ]);
  };

  const handleAddMarketplaceItem = async () => {
    if (!newItem.title.trim()) {
      Alert.alert('Greška', 'Unesite naslov');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/api/marketplace/items', {
        name: newItem.title,
        description: newItem.description,
        price: newItem.type === 'gift' ? null : (newItem.price || null),
        type: newItem.type
      });
      setShowAddModal(false);
      setNewItem({ title: '', description: '', price: '', type: 'sell' });
      loadData();
      Alert.alert('Uspješno', 'Oglas je objavljen.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće objaviti oglas.');
    } finally {
      setSubmitting(false);
    }
  };

  const imageUrl = (photos?: string[]) => {
    if (!photos || photos.length === 0) return null;
    const url = photos[0];
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };

  const activeProducts = products.filter(p => p.status !== 'completed');
  const sellItems = marketplaceItems.filter(i => (i.type === 'sell') && i.status !== 'completed');
  const giftItems = marketplaceItems.filter(i => (i.type === 'gift') && i.status !== 'completed');
  const activeServices = services;
  const archivedItems = [
    ...products.filter(p => p.status === 'completed').map(p => ({ ...p, itemType: 'product' as const })),
    ...marketplaceItems.filter(i => i.status === 'completed').map(i => ({ ...i, itemType: 'marketplace' as const })),
  ];

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'dzemat', label: 'DžematShop', icon: 'store' },
    { key: 'prodajem', label: 'Prodajem', icon: 'tag' },
    { key: 'poklanjam', label: 'Poklanjam', icon: 'gift' },
    { key: 'usluge', label: 'Usluge', icon: 'hammer-wrench' },
    ...(isAdmin ? [{ key: 'arhiva' as TabType, label: 'Arhiva', icon: 'archive' }] : []),
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3949AB" /></View>;
  }

  const renderProductCard = (product: ShopProduct) => (
    <TouchableOpacity key={product.id} style={styles.card} onPress={() => handleContactSeller(product, product.name)}>
      {imageUrl(product.photos) ? (
        <Image source={{ uri: imageUrl(product.photos)! }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholder]}><MaterialCommunityIcons name="image" size={40} color="#B0BEC5" /></View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{product.name}</Text>
        {product.description && <Text style={styles.cardDesc} numberOfLines={2}>{product.description}</Text>}
        <Text style={styles.cardPrice}>{product.price} KM</Text>
        <TouchableOpacity style={styles.contactBtn} onPress={() => handleContactSeller(product, product.name)}>
          <Text style={styles.contactBtnText}>Kontaktiraj</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderMarketplaceCard = (item: MarketplaceItem) => (
    <TouchableOpacity key={item.id} style={styles.card} onPress={() => handleContactSeller(item, item.title)}>
      {imageUrl(item.photos) ? (
        <Image source={{ uri: imageUrl(item.photos)! }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholder]}><MaterialCommunityIcons name="image" size={40} color="#B0BEC5" /></View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, item.type === 'gift' ? styles.giftBadge : styles.saleBadge]}>
            <Text style={styles.badgeText}>{item.type === 'gift' ? 'Poklon' : 'Prodaja'}</Text>
          </View>
        </View>
        {item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
        <View style={styles.cardFooter}>
          {item.price && <Text style={styles.cardPrice}>{item.price} KM</Text>}
          {item.user && <Text style={styles.sellerText}>Od: {item.user.firstName} {item.user.lastName}</Text>}
        </View>
        <TouchableOpacity style={styles.contactBtn} onPress={() => handleContactSeller(item, item.title)}>
          <Text style={styles.contactBtnText}>Kontaktiraj</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity key={service.id} style={styles.card} onPress={() => handleContactSeller(service, service.name)}>
      {imageUrl(service.photos) ? (
        <Image source={{ uri: imageUrl(service.photos)! }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholder]}><MaterialCommunityIcons name="hammer-wrench" size={40} color="#B0BEC5" /></View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{service.name}</Text>
          <View style={[styles.badge, service.category === 'offer' ? styles.offerBadge : styles.needBadge]}>
            <Text style={styles.badgeText}>{service.category === 'offer' ? 'Nudim' : 'Tražim'}</Text>
          </View>
        </View>
        {service.description && <Text style={styles.cardDesc} numberOfLines={2}>{service.description}</Text>}
        <View style={styles.cardFooter}>
          {service.price && <Text style={styles.cardPrice}>{service.price} KM</Text>}
          {service.duration && <Text style={styles.durationText}>{service.duration}</Text>}
        </View>
        {service.user && <Text style={styles.sellerText}>Od: {service.user.firstName} {service.user.lastName}</Text>}
        <TouchableOpacity style={styles.contactBtn} onPress={() => handleContactSeller(service, service.name)}>
          <Text style={styles.contactBtnText}>Kontaktiraj</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dzemat':
        return activeProducts.length === 0 ? (
          <View style={styles.empty}><MaterialCommunityIcons name="store-off" size={60} color="#B0BEC5" /><Text style={styles.emptyText}>Nema proizvoda u DžematShop-u</Text></View>
        ) : activeProducts.map(renderProductCard);
      case 'prodajem':
        return (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setNewItem({ ...newItem, type: 'sell' }); setShowAddModal(true); }}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" /><Text style={styles.addBtnText}>Dodaj oglas</Text>
            </TouchableOpacity>
            {sellItems.length === 0 ? (
              <View style={styles.empty}><MaterialCommunityIcons name="tag-off" size={60} color="#B0BEC5" /><Text style={styles.emptyText}>Nema oglasa za prodaju</Text></View>
            ) : sellItems.map(renderMarketplaceCard)}
          </>
        );
      case 'poklanjam':
        return (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setNewItem({ ...newItem, type: 'gift' }); setShowAddModal(true); }}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" /><Text style={styles.addBtnText}>Dodaj poklon</Text>
            </TouchableOpacity>
            {giftItems.length === 0 ? (
              <View style={styles.empty}><MaterialCommunityIcons name="gift-off" size={60} color="#B0BEC5" /><Text style={styles.emptyText}>Nema poklona</Text></View>
            ) : giftItems.map(renderMarketplaceCard)}
          </>
        );
      case 'usluge':
        return activeServices.length === 0 ? (
          <View style={styles.empty}><MaterialCommunityIcons name="hammer-wrench" size={60} color="#B0BEC5" /><Text style={styles.emptyText}>Nema usluga</Text></View>
        ) : activeServices.map(renderServiceCard);
      case 'arhiva':
        return archivedItems.length === 0 ? (
          <View style={styles.empty}><MaterialCommunityIcons name="archive-off" size={60} color="#B0BEC5" /><Text style={styles.emptyText}>Arhiva je prazna</Text></View>
        ) : archivedItems.map((item) => 
          item.itemType === 'product' ? renderProductCard(item as ShopProduct) : renderMarketplaceCard(item as MarketplaceItem)
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Shop</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3949AB']} />}>
        {renderContent()}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{newItem.type === 'sell' ? 'Novi oglas za prodaju' : 'Novi poklon'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><MaterialCommunityIcons name="close" size={24} color="#546E7A" /></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Naslov" placeholderTextColor="#9E9E9E" value={newItem.title} onChangeText={(text) => setNewItem({ ...newItem, title: text })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Opis" placeholderTextColor="#9E9E9E" value={newItem.description} onChangeText={(text) => setNewItem({ ...newItem, description: text })} multiline numberOfLines={3} />
            {newItem.type === 'sell' && (
              <TextInput style={styles.input} placeholder="Cijena (KM)" placeholderTextColor="#9E9E9E" value={newItem.price} onChangeText={(text) => setNewItem({ ...newItem, price: text })} keyboardType="numeric" />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}><Text style={styles.cancelBtnText}>Odustani</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]} onPress={handleAddMarketplaceItem} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Objavi</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#3949AB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1' },
  topBar: { backgroundColor: '#3949AB', paddingHorizontal: 16, paddingVertical: 12 },
  topBarTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabsScroll: { backgroundColor: '#3949AB', maxHeight: 48 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { marginLeft: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, backgroundColor: '#ECEFF1', padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardImage: { width: '100%', height: 140 },
  placeholder: { backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0D1B2A', flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 13, color: '#546E7A', marginBottom: 8 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#1E88E5' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sellerText: { fontSize: 12, color: '#9E9E9E' },
  durationText: { fontSize: 12, color: '#9E9E9E' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  saleBadge: { backgroundColor: '#1E88E5' },
  giftBadge: { backgroundColor: '#26A69A' },
  offerBadge: { backgroundColor: '#1E88E5' },
  needBadge: { backgroundColor: '#FF7043' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  contactBtn: { backgroundColor: '#1E88E5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9E9E9E', marginTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E88E5', paddingVertical: 12, borderRadius: 10, marginBottom: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  input: { backgroundColor: '#ECEFF1', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12, color: '#0D1B2A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ECEFF1', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#546E7A' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1E88E5', alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.7 },
});
