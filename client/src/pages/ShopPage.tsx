import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Box, Tabs, Tab, Typography, Card, CardContent, CardMedia, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, ImageList, ImageListItem, Select, FormControl, InputLabel, Paper } from "@mui/material";
import { Add, Delete, ShoppingCart, Store, CardGiftcard, CloudUpload, Edit, Close, ContentCopy, Archive, Check, Build } from "@mui/icons-material";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { useMarkAsViewed } from "@/hooks/useMarkAsViewed";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { useTranslation } from "react-i18next";
import type { ShopProduct, MarketplaceItem, User, Service, ServiceWithUser } from "@shared/schema";

interface ShopProductWithUser extends ShopProduct {
  creator?: User;
}

interface MarketplaceItemWithUser extends MarketplaceItem {
  user?: User;
}

export default function ShopPage() {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { toast } = useToast();
  const { t } = useTranslation(['shop']);
  useMarkAsViewed('shop');
  
  // Feature Access Check
  const { isEnabled, upgradeRequired, currentPlan, requiredPlan, isLoading: featureLoading } = useFeatureAccess("shop");
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"all" | "sell" | "gift" | "need" | "offer">("all");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [fullscreenImageOpen, setFullscreenImageOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [editingMarketplaceItem, setEditingMarketplaceItem] = useState<MarketplaceItemWithUser | null>(null);
  const [editingProduct, setEditingProduct] = useState<ShopProductWithUser | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopProductWithUser | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState({
    size: "",
    quantity: 1,
    color: ""
  });
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactUserId, setContactUserId] = useState<string | null>(null);
  const [contactItemName, setContactItemName] = useState<string>("");
  const [contactMessage, setContactMessage] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    photos: [] as string[],
    price: "",
    duration: "",
    type: "offer" as "offer" | "need"
  });
  
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    photos: [] as string[],
    price: ""
  });
  
  const [marketplaceForm, setMarketplaceForm] = useState({
    name: "",
    description: "",
    photos: [] as string[],
    type: "sell" as "sell" | "gift",
    price: "",
    status: "active"
  });

  const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('imam');

  // Deep linking helper - get itemId from URL query parameter
  const getDeepLinkItemId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('itemId');
  };

  // Fetch shop products
  const { data: shopProducts, isLoading: loadingProducts } = useQuery<ShopProductWithUser[]>({
    queryKey: ['/api/shop/products'],
  });

  // Fetch marketplace items
  const { data: marketplaceItems, isLoading: loadingMarketplace } = useQuery<MarketplaceItemWithUser[]>({
    queryKey: ['/api/marketplace/items'],
  });

  // Fetch users for displaying names - SCOPED BY TENANT
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users', user?.tenantId],
  });

  // Fetch services
  const { data: services, isLoading: loadingServices } = useQuery<ServiceWithUser[]>({
    queryKey: ['/api/services'],
  });

  // State for deep link scroll target
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

  // Deep linking - navigate to the correct tab and scroll to item
  useEffect(() => {
    const deepLinkItemId = getDeepLinkItemId();
    if (deepLinkItemId && shopProducts && marketplaceItems && services) {
      // Search in shop products first (Tab 0)
      const shopProduct = shopProducts.find(p => p.id === deepLinkItemId);
      
      if (shopProduct) {
        setActiveTab(0);
        setScrollTargetId(deepLinkItemId);
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Check marketplace items (Tab 1 for sell/sale, Tab 2 for gift)
        const marketplaceItem = marketplaceItems.find(m => m.id === deepLinkItemId);
        if (marketplaceItem) {
          // Tab 1 = Prodajem (sell/sale), Tab 2 = Poklanjam (gift)
          setActiveTab((marketplaceItem.type === 'sell' || marketplaceItem.type === 'sale') ? 1 : 2);
          setScrollTargetId(deepLinkItemId);
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // Check services (Tab 3)
          const service = services.find(s => s.id === deepLinkItemId);
          if (service) {
            setActiveTab(3);
            setScrollTargetId(deepLinkItemId);
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      }
    }
  }, [shopProducts, marketplaceItems, services]);

  // Scroll to target element after tab change
  useEffect(() => {
    if (scrollTargetId) {
      // Small delay to let the DOM render the element
      const timer = setTimeout(() => {
        const element = document.getElementById(`item-${scrollTargetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the element briefly
          element.style.boxShadow = '0 0 0 3px var(--primary)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
        setScrollTargetId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scrollTargetId, activeTab]);

  // Service photo upload handler
  const handleServicePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxFiles = 3;
    const currentPhotos = serviceForm.photos;

    if (currentPhotos.length + files.length > maxFiles) {
      toast({ 
        title: t('shop:toast.tooManyPhotos'), 
        description: t('shop:toast.maxPhotosDescription', { max: maxFiles }),
        variant: "destructive" 
      });
      return;
    }

    setUploadingPhotos(true);
    const formData = new FormData();
    
    for (let i = 0; i < Math.min(files.length, maxFiles - currentPhotos.length); i++) {
      formData.append('photos', files[i]);
    }

    try {
      const response = await fetch('/api/upload/shop-photos', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setServiceForm({ ...serviceForm, photos: [...currentPhotos, ...data.photoUrls] });
      toast({ title: t('shop:toast.photosUploaded') });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({ title: t('shop:toast.uploadError'), variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (files: FileList | null, isProduct: boolean) => {
    if (!files || files.length === 0) return;

    const maxFiles = isProduct ? 10 : 3;
    const currentPhotos = isProduct ? productForm.photos : marketplaceForm.photos;

    if (currentPhotos.length + files.length > maxFiles) {
      toast({ 
        title: t('shop:toast.tooManyPhotos'), 
        description: t('shop:toast.maxPhotosDescription', { max: maxFiles }),
        variant: "destructive" 
      });
      return;
    }

    setUploadingPhotos(true);
    const formData = new FormData();
    
    for (let i = 0; i < Math.min(files.length, maxFiles - currentPhotos.length); i++) {
      formData.append('photos', files[i]);
    }

    try {
      const response = await fetch('/api/upload/shop-photos', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newPhotos = [...currentPhotos, ...data.photoUrls];

      if (isProduct) {
        setProductForm({ ...productForm, photos: newPhotos });
      } else {
        setMarketplaceForm({ ...marketplaceForm, photos: newPhotos });
      }

      toast({ title: t('shop:toast.photosAdded') });
    } catch (error) {
      toast({ title: t('shop:toast.photoUploadError'), variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeServicePhoto = (index: number) => {
    const newPhotos = serviceForm.photos.filter((_, i) => i !== index);
    setServiceForm({ ...serviceForm, photos: newPhotos });
  };

  const removePhoto = (index: number, isProduct: boolean) => {
    if (isProduct) {
      const newPhotos = productForm.photos.filter((_, i) => i !== index);
      setProductForm({ ...productForm, photos: newPhotos });
    } else {
      const newPhotos = marketplaceForm.photos.filter((_, i) => i !== index);
      setMarketplaceForm({ ...marketplaceForm, photos: newPhotos });
    }
  };

  const openFullscreenImage = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setFullscreenImageOpen(true);
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: typeof productForm) => {
      return await apiRequest('/api/shop/products', 'POST', {
        ...productData,
        createdById: user!.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: t('shop:toast.productAdded') });
      setProductModalOpen(false);
      setProductForm({
        name: "",
        description: "",
        photos: [],
        price: ""
      });
    },
    onError: () => {
      toast({ title: t('shop:toast.productAddError'), variant: "destructive" });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/shop/products/${productId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: t('shop:toast.productDeleted') });
    },
    onError: () => {
      toast({ title: t('shop:toast.productDeleteError'), variant: "destructive" });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof productForm }) => {
      return await apiRequest(`/api/shop/products/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: t('shop:toast.productUpdated') });
      setProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        photos: [],
        price: ""
      });
    },
    onError: () => {
      toast({ title: t('shop:toast.productUpdateError'), variant: "destructive" });
    }
  });

  // Complete product mutation (mark as finished)
  const completeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/shop/products/${productId}`, 'PUT', { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: t('shop:toast.productCompleted') });
    },
    onError: () => {
      toast({ title: t('shop:toast.error'), variant: "destructive" });
    }
  });

  // Duplicate product mutation
  const duplicateProductMutation = useMutation({
    mutationFn: async (product: ShopProductWithUser) => {
      return await apiRequest('/api/shop/products', 'POST', {
        name: product.name,
        description: product.description || "",
        photos: product.photos || [],
        price: product.price,
        createdById: user!.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: t('shop:toast.productCopied') });
    },
    onError: () => {
      toast({ title: t('shop:toast.productCopyError'), variant: "destructive" });
    }
  });

  // Create marketplace item mutation
  const createMarketplaceItemMutation = useMutation({
    mutationFn: async (itemData: typeof marketplaceForm) => {
      return await apiRequest('/api/marketplace/items', 'POST', itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: t('shop:toast.listingAdded') });
      setMarketplaceModalOpen(false);
      setEditingMarketplaceItem(null);
      setMarketplaceForm({
        name: "",
        description: "",
        photos: [],
        type: "sell",
        price: "",
        status: "active"
      });
    },
    onError: () => {
      toast({ title: t('shop:toast.listingAddError'), variant: "destructive" });
    }
  });

  // Update marketplace item mutation
  const updateMarketplaceItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof marketplaceForm }) => {
      return await apiRequest(`/api/marketplace/items/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: t('shop:toast.listingUpdated') });
      setMarketplaceModalOpen(false);
      setEditingMarketplaceItem(null);
      setMarketplaceForm({
        name: "",
        description: "",
        photos: [],
        type: "sell",
        price: "",
        status: "active"
      });
    },
    onError: () => {
      toast({ title: t('shop:toast.listingUpdateError'), variant: "destructive" });
    }
  });

  // Delete marketplace item mutation
  const deleteMarketplaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/marketplace/items/${itemId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: t('shop:toast.listingDeleted') });
    },
    onError: () => {
      toast({ title: t('shop:toast.listingDeleteError'), variant: "destructive" });
    }
  });

  // Mark marketplace item as completed mutation
  const completeMarketplaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/marketplace/items/${itemId}`, 'PUT', { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: t('shop:toast.listingCompleted') });
    },
    onError: () => {
      toast({ title: t('shop:toast.listingCompleteError'), variant: "destructive" });
    }
  });

  // Service mutations
  const createServiceMutation = useMutation({
    mutationFn: async (data: typeof serviceForm) => {
      const { type, ...rest } = data;
      return await apiRequest('/api/services', 'POST', { ...rest, category: type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: "Usluga dodana" });
      setServiceModalOpen(false);
      setServiceForm({ name: "", description: "", photos: [], price: "", duration: "", type: "offer" });
    },
    onError: () => {
      toast({ title: "Greška pri dodavanju usluge", variant: "destructive" });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof serviceForm }) => {
      const { type, ...rest } = data;
      return await apiRequest(`/api/services/${id}`, 'PUT', { ...rest, category: type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: "Usluga ažurirana" });
      setServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({ name: "", description: "", photos: [], price: "", duration: "", type: "offer" });
    },
    onError: () => {
      toast({ title: "Greška pri ažuriranju usluge", variant: "destructive" });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/services/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: "Usluga obrisana" });
    },
    onError: () => {
      toast({ title: "Greška pri brisanju usluge", variant: "destructive" });
    }
  });

  // Create purchase request mutation
  const createPurchaseRequestMutation = useMutation({
    mutationFn: async ({ productId, quantity, size, color }: { productId: string; quantity: number; size?: string; color?: string }) => {
      return await apiRequest('/api/shop/purchase-requests', 'POST', { 
        productId, 
        quantity,
        userId: user!.id
      });
    },
    onSuccess: async () => {
      toast({ 
        title: t('shop:toast.orderSent'), 
        description: t('shop:toast.orderSentDescription')
      });
      
      // Send message to admin about the purchase request
      const adminUser = users?.find(u => u.isAdmin);
      if (adminUser && selectedProduct) {
        try {
          await apiRequest('/api/messages', 'POST', {
            senderId: user!.id,
            recipientId: adminUser.id,
            subject: t('shop:messages.newOrder'),
            content: t('shop:messages.orderContent', { 
              user: `${user!.firstName} ${user!.lastName}`, 
              product: selectedProduct.name,
              quantity: purchaseDetails.quantity > 1 ? t('shop:messages.quantityLabel', { quantity: purchaseDetails.quantity }) : ''
            })
          });
        } catch (error) {
          console.error("Failed to send notification to admin", error);
        }
      }
      
      setPurchaseModalOpen(false);
      setPurchaseDetails({ size: "", quantity: 1, color: "" });
      setSelectedProduct(null);
    },
    onError: () => {
      toast({ title: t('shop:toast.orderError'), variant: "destructive" });
    }
  });

  const handleCreateProduct = () => {
    if (!productForm.name) {
      toast({ title: t('shop:toast.nameRequired'), variant: "destructive" });
      return;
    }
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  const handleEditProduct = (product: ShopProductWithUser) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      photos: product.photos || [],
      price: product.price || ""
    });
    setProductModalOpen(true);
  };

  const handleCreateOrUpdateMarketplaceItem = () => {
    if (!marketplaceForm.name) {
      toast({ title: t('shop:toast.nameRequired'), variant: "destructive" });
      return;
    }
    
    if (editingMarketplaceItem) {
      updateMarketplaceItemMutation.mutate({ id: editingMarketplaceItem.id, data: marketplaceForm });
    } else {
      createMarketplaceItemMutation.mutate(marketplaceForm);
    }
  };

  const handleEditMarketplaceItem = (item: MarketplaceItemWithUser) => {
    setEditingMarketplaceItem(item);
    setMarketplaceForm({
      name: item.title,
      description: item.description || "",
      photos: item.photos || [],
      type: item.type as "sell" | "gift",
      price: item.price || "",
      status: item.status || "active"
    });
    setMarketplaceModalOpen(true);
  };


  const handleOpenPurchaseModal = (product: ShopProductWithUser) => {
    // Use contact dialog instead of purchase form (same as Prodajem/Poklanjam)
    const creatorUser = users?.find(u => u.id === product.createdById);
    if (creatorUser) {
      setContactUserId(creatorUser.id);
      setContactItemName(product.name);
      setContactDialogOpen(true);
    } else {
      toast({ title: t('shop:toast.ownerNotFound'), variant: "destructive" });
    }
  };

  const handleOpenPurchaseModalLegacy = (product: ShopProductWithUser) => {
    setSelectedProduct(product);
    setPurchaseDetails({
      size: product.size || "",
      quantity: 1,
      color: product.color || ""
    });
    setPurchaseModalOpen(true);
  };

  const handleSubmitPurchase = () => {
    if (!selectedProduct) return;
    
    createPurchaseRequestMutation.mutate({
      productId: selectedProduct.id,
      quantity: purchaseDetails.quantity,
      size: purchaseDetails.size,
      color: purchaseDetails.color
    });
  };

  const calculateTotal = () => {
    if (!selectedProduct || !selectedProduct.price) return "0";
    const priceNumber = parseFloat(selectedProduct.price);
    if (isNaN(priceNumber)) return selectedProduct.price;
    return (priceNumber * purchaseDetails.quantity).toFixed(2);
  };

  const handleContactUser = (itemUser: User | undefined, itemName?: string) => {
    if (itemUser) {
      setContactUserId(itemUser.id);
      setContactItemName(itemName || "");
      setContactMessage("");
      setContactDialogOpen(true);
    } else {
      toast({ 
        title: t('shop:toast.error'), 
        description: t('shop:toast.ownerNotFound', 'Vlasnik nije pronađen'), 
        variant: "destructive" 
      });
    }
  };

  const sendContactMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; message: string; itemName: string }) => {
      const subject = data.itemName 
        ? `${t('shop:messages.shopMessage')} - ${data.itemName}`
        : t('shop:messages.shopMessage');
      
      return apiRequest("/api/messages", "POST", {
        senderId: user!.id,
        recipientId: data.recipientId,
        subject: subject,
        content: data.message
      });
    },
    onSuccess: () => {
      setContactDialogOpen(false);
      setContactMessage("");
      setContactUserId(null);
    },
    onError: () => {
      toast({ 
        title: t('shop:toast.error'), 
        description: t('shop:toast.messageError'), 
        variant: "destructive" 
      });
    }
  });

  const handleSendContactMessage = () => {
    if (!contactUserId || !contactMessage.trim()) {
      toast({ 
        title: t('shop:toast.error'), 
        description: t('shop:toast.messageRequired'), 
        variant: "destructive" 
      });
      return;
    }
    sendContactMessageMutation.mutate({ 
      recipientId: contactUserId, 
      message: contactMessage,
      itemName: contactItemName
    });
  };

  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  // Filter function for search
  const filterBySearch = (name: string | null, description?: string | null) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (name?.toLowerCase().includes(query) || false) || 
           (description?.toLowerCase().includes(query) || false);
  };

  // Filtered data based on search (support both "sell" and legacy "sale" types)
  const filteredProducts = shopProducts?.filter(p => filterBySearch(p.name, p.description)) || [];
  const sellItems = marketplaceItems?.filter(item => 
    (item.type === "sell" || item.type === "sale") && item.status === "active" && filterBySearch(item.title, item.description)
  ) || [];
  const giftItems = marketplaceItems?.filter(item => 
    item.type === "gift" && item.status === "active" && filterBySearch(item.title, item.description)
  ) || [];
  const filteredServices = services?.filter(s => filterBySearch(s.name, s.description)) || [];
  const archivedItems = marketplaceItems?.filter(item => item.status === "completed") || [];

  // Show upgrade CTA if feature is locked
  if (upgradeRequired && currentPlan && requiredPlan) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('shop:title')}
          </Typography>
        </Box>
        <UpgradeCTA 
          moduleId="shop" 
          requiredPlan={requiredPlan} 
          currentPlan={currentPlan} 
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('shop:title')}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Pretraži..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Kategorija</InputLabel>
            <Select
              value={searchCategory}
              label="Kategorija"
              onChange={(e) => {
                const value = e.target.value as typeof searchCategory;
                setSearchCategory(value);
                if (value === "sell") setActiveTab(1);
                else if (value === "gift") setActiveTab(2);
                else if (value === "need") setActiveTab(3);
                else if (value === "offer") setActiveTab(3);
              }}
              data-testid="select-search-category"
            >
              <MenuItem value="all">Sve</MenuItem>
              <MenuItem value="sell">Prodajem</MenuItem>
              <MenuItem value="gift">Poklanjam</MenuItem>
              <MenuItem value="need">Tražim</MenuItem>
              <MenuItem value="offer">Nudim</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: { xs: 60, md: 120 },
              fontSize: { xs: '0.7rem', md: '0.875rem' },
              padding: { xs: '6px 8px', md: '12px 16px' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 0.5, md: 1 },
              '& .MuiTab-iconWrapper': {
                marginBottom: { xs: 0, md: 0 },
                marginRight: { xs: 0, md: 1 }
              }
            }
          }}
        >
          <Tab 
            icon={<Store />}
            iconPosition="top"
            label={t('shop:tabs.dzematShop')}
            data-testid="tab-buy" 
          />
          <Tab 
            icon={<ShoppingCart />}
            iconPosition="top"
            label={t('shop:tabs.sell')}
            data-testid="tab-sell" 
          />
          <Tab 
            icon={<CardGiftcard />}
            iconPosition="top"
            label={t('shop:tabs.gift')}
            data-testid="tab-gift" 
          />
          <Tab 
            icon={<Build />}
            iconPosition="top"
            label={t('shop:tabs.services')}
            data-testid="tab-services" 
          />
          {isAdmin && (
            <Tab 
              icon={<Archive />}
              iconPosition="top"
              label={t('shop:tabs.archive')}
              data-testid="tab-archive" 
            />
          )}
        </Tabs>
      </Paper>

      {/* Global Search Results - when searching with "all" category */}
      {searchQuery.trim() && searchCategory === "all" && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Rezultati pretrage: "{searchQuery}"</Typography>
          
          {/* Džemat Shop Products Results */}
          {filteredProducts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Store fontSize="small" /> Džemat Shop ({filteredProducts.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {filteredProducts.slice(0, 6).map((product) => (
                  <Card key={product.id} sx={{ cursor: 'pointer' }} onClick={() => { setSearchCategory("all"); setActiveTab(0); }}>
                    {product.photos && product.photos.length > 0 && (
                      <CardMedia component="img" height="120" image={product.photos[0]} alt={product.name} sx={{ objectFit: 'cover' }} />
                    )}
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" noWrap>{product.name}</Typography>
                      {product.price && <Typography variant="body2" color="primary">{formatPrice(product.price)}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {filteredProducts.length > 6 && (
                <Button size="small" onClick={() => { setSearchCategory("all"); setActiveTab(0); }}>
                  Prikaži sve ({filteredProducts.length})
                </Button>
              )}
            </Box>
          )}

          {/* Sell Items Results */}
          {sellItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart fontSize="small" /> Prodajem ({sellItems.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {sellItems.slice(0, 6).map((item) => (
                  <Card key={item.id} sx={{ cursor: 'pointer' }} onClick={() => { setSearchCategory("sell"); setActiveTab(1); }}>
                    {item.photos && item.photos.length > 0 && (
                      <CardMedia component="img" height="120" image={item.photos[0]} alt={item.title || ''} sx={{ objectFit: 'cover' }} />
                    )}
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                      {item.price && <Typography variant="body2" color="primary">{formatPrice(item.price)}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {sellItems.length > 6 && (
                <Button size="small" onClick={() => { setSearchCategory("sell"); setActiveTab(1); }}>
                  Prikaži sve ({sellItems.length})
                </Button>
              )}
            </Box>
          )}

          {/* Gift Items Results */}
          {giftItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardGiftcard fontSize="small" /> Poklanjam ({giftItems.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {giftItems.slice(0, 6).map((item) => (
                  <Card key={item.id} sx={{ cursor: 'pointer' }} onClick={() => { setSearchCategory("gift"); setActiveTab(2); }}>
                    {item.photos && item.photos.length > 0 && (
                      <CardMedia component="img" height="120" image={item.photos[0]} alt={item.title || ''} sx={{ objectFit: 'cover' }} />
                    )}
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {giftItems.length > 6 && (
                <Button size="small" onClick={() => { setSearchCategory("gift"); setActiveTab(2); }}>
                  Prikaži sve ({giftItems.length})
                </Button>
              )}
            </Box>
          )}

          {/* Services Results */}
          {filteredServices.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build fontSize="small" /> Usluge ({filteredServices.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {filteredServices.slice(0, 6).map((service) => (
                  <Card key={service.id} sx={{ cursor: 'pointer' }} onClick={() => { setSearchCategory("offer"); setActiveTab(3); }}>
                    {service.photos && service.photos.length > 0 && (
                      <CardMedia component="img" height="120" image={service.photos[0]} alt={service.name} sx={{ objectFit: 'cover' }} />
                    )}
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle2" noWrap>{service.name}</Typography>
                      {service.price && <Typography variant="body2" color="primary">{formatPrice(service.price)}</Typography>}
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {filteredServices.length > 6 && (
                <Button size="small" onClick={() => { setSearchCategory("offer"); setActiveTab(3); }}>
                  Prikaži sve ({filteredServices.length})
                </Button>
              )}
            </Box>
          )}

          {/* No results message */}
          {filteredProducts.length === 0 && sellItems.length === 0 && giftItems.length === 0 && filteredServices.length === 0 && (
            <Typography color="text.secondary">Nema rezultata za "{searchQuery}"</Typography>
          )}
        </Box>
      )}

      {/* DžematShop Tab */}
      {activeTab === 0 && !(searchQuery.trim() && searchCategory === "all") && (
        <Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  description: "",
                  photos: [],
                  price: ""
                });
                setProductModalOpen(true);
              }}
              sx={{ mb: 3 }}
              data-testid="button-add-product"
            >
              {t('shop:buttons.addProduct')}
            </Button>
          )}

          {loadingProducts ? (
            <Typography>{t('shop:display.loading')}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {filteredProducts.map((product) => (
                <Box key={product.id} id={`item-${product.id}`}>
                  <Card data-testid={`card-product-${product.id}`}>
                    {product.photos && product.photos.length > 0 && (
                      product.photos.length === 1 ? (
                        <CardMedia
                          component="img"
                          image={product.photos[0]}
                          alt={product.name}
                          sx={{ 
                            cursor: 'pointer',
                            aspectRatio: '4/3',
                            objectFit: 'cover',
                            width: '100%'
                          }}
                          onClick={() => openFullscreenImage(product.photos![0])}
                        />
                      ) : (
                        <ImageList sx={{ aspectRatio: '4/3' }} cols={2}>
                          {product.photos.slice(0, 4).map((photo, idx) => (
                            <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                              <img 
                                src={photo} 
                                alt={`${product.name} ${idx + 1}`}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      )
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </Typography>
                      {product.price && (
                        <Typography variant="h5" color="primary" gutterBottom>
                          {formatPrice(product.price)}
                        </Typography>
                      )}
                      {product.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {product.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {!isAdmin && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenPurchaseModal(product)}
                            data-testid={`button-buy-${product.id}`}
                          >
                            {t('shop:buttons.buy')}
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditProduct(product)}
                              data-testid={`button-edit-product-${product.id}`}
                              title={t('shop:tooltips.editProduct')}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="success"
                              onClick={() => completeProductMutation.mutate(product.id)}
                              data-testid={`button-complete-product-${product.id}`}
                              title={t('shop:tooltips.completeProduct')}
                            >
                              <Check />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              data-testid={`button-delete-product-${product.id}`}
                              title={t('shop:tooltips.deleteProduct')}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Prodajem Tab */}
      {activeTab === 1 && !(searchQuery.trim() && searchCategory === "all") && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingMarketplaceItem(null);
              setMarketplaceForm({ name: "", description: "", photos: [], type: "sell", price: "", status: "active" });
              setMarketplaceModalOpen(true);
            }}
            sx={{ mb: 3 }}
            data-testid="button-add-sell-item"
          >
            {t('shop:buttons.addListing')}
          </Button>

          {loadingMarketplace ? (
            <Typography>{t('shop:display.loading')}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {sellItems.map((item) => {
                const itemUser = getUserById(item.userId);
                const canEdit = item.userId === user?.id || isAdmin;
                return (
                  <Box key={item.id} id={`item-${item.id}`}>
                    <Card data-testid={`card-sell-${item.id}`}>
                      {item.photos && item.photos.length > 0 && (
                        item.photos.length === 1 ? (
                          <CardMedia
                            component="img"
                            image={item.photos[0]}
                            alt={item.title}
                            sx={{ 
                              cursor: 'pointer',
                              aspectRatio: '4/3',
                              objectFit: 'cover',
                              width: '100%'
                            }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ aspectRatio: '4/3' }} cols={2}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img 
                                  src={photo} 
                                  alt={`${item.title} ${idx + 1}`}
                                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-sell-name-${item.id}`}>
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.price && (
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }} data-testid={`text-sell-price-${item.id}`}>
                            {formatPrice(item.price)}
                          </Typography>
                        )}
                        <Chip label={t('shop:display.forSale')} color="primary" size="small" sx={{ mb: 1 }} />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {item.userId !== user?.id && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleContactUser(itemUser, item.title)}
                              data-testid={`button-contact-${item.id}`}
                            >
                              {t('shop:buttons.contactOwner')}
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <IconButton
                                color="primary"
                                onClick={() => handleEditMarketplaceItem(item)}
                                data-testid={`button-edit-sell-${item.id}`}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-delete-sell-${item.id}`}
                              >
                                <Delete />
                              </IconButton>
                              <Button
                                variant="outlined"
                                size="small"
                                color="success"
                                onClick={() => completeMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-complete-sell-${item.id}`}
                              >
                                {t('shop:buttons.complete')}
                              </Button>
                            </>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Poklanjam Tab */}
      {activeTab === 2 && !(searchQuery.trim() && searchCategory === "all") && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingMarketplaceItem(null);
              setMarketplaceForm({ name: "", description: "", photos: [], type: "gift", price: "", status: "active" });
              setMarketplaceModalOpen(true);
            }}
            sx={{ mb: 3 }}
            data-testid="button-add-gift-item"
          >
            {t('shop:buttons.addGift')}
          </Button>

          {loadingMarketplace ? (
            <Typography>{t('shop:display.loading')}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {giftItems.map((item) => {
                const itemUser = getUserById(item.userId);
                const canEdit = item.userId === user?.id || isAdmin;
                return (
                  <Box key={item.id} id={`item-${item.id}`}>
                    <Card data-testid={`card-gift-${item.id}`}>
                      {item.photos && item.photos.length > 0 && (
                        item.photos.length === 1 ? (
                          <CardMedia
                            component="img"
                            image={item.photos[0]}
                            alt={item.title}
                            sx={{ 
                              cursor: 'pointer',
                              aspectRatio: '4/3',
                              objectFit: 'cover',
                              width: '100%'
                            }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ aspectRatio: '4/3' }} cols={2}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img 
                                  src={photo} 
                                  alt={`${item.title} ${idx + 1}`}
                                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-gift-name-${item.id}`}>
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        <Chip label={t('shop:display.giftLabel')} color="success" size="small" sx={{ mb: 1 }} />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {item.userId !== user?.id && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleContactUser(itemUser, item.title)}
                              data-testid={`button-contact-gift-${item.id}`}
                            >
                              {t('shop:buttons.contactOwner')}
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <IconButton
                                color="primary"
                                onClick={() => handleEditMarketplaceItem(item)}
                                data-testid={`button-edit-gift-${item.id}`}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-delete-gift-${item.id}`}
                              >
                                <Delete />
                              </IconButton>
                              <Button
                                variant="outlined"
                                size="small"
                                color="success"
                                onClick={() => completeMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-complete-gift-${item.id}`}
                              >
                                {t('shop:buttons.complete')}
                              </Button>
                            </>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Services Tab */}
      {activeTab === 3 && !(searchQuery.trim() && searchCategory === "all") && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: "", description: "", photos: [], price: "", duration: "", type: "offer" });
                setServiceModalOpen(true);
              }}
              data-testid="button-add-service"
            >
              {t('shop:buttons.addService')}
            </Button>
          </Box>

          {loadingServices ? (
            <Typography>{t('shop:display.loading')}</Typography>
          ) : filteredServices.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
              {filteredServices.map((service) => {
                const serviceUser = users?.find(u => u.id === service.userId);
                
                return (
                  <Box key={service.id} id={`item-${service.id}`}>
                    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
                    {service.photos && service.photos.length > 0 && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={service.photos[0]}
                        alt={service.name}
                        sx={{ cursor: 'pointer', objectFit: 'cover' }}
                        onClick={() => openFullscreenImage(service.photos![0])}
                      />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {service.description}
                      </Typography>
                      {service.price && (
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                          {formatPrice(service.price)}
                        </Typography>
                      )}
                      <Chip label={t('shop:display.serviceLabel')} color="info" size="small" sx={{ mb: 1, mr: 1 }} />
                      {service.duration && (
                        <Chip label={service.duration} size="small" sx={{ mr: 1 }} />
                      )}
                      {service.category && (
                        <Chip 
                          label={service.category === 'need' ? 'Tražim' : 'Nudim'} 
                          color={service.category === 'need' ? 'warning' : 'success'}
                          size="small" 
                        />
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {service.userId !== user?.id && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleContactUser(serviceUser, service.name)}
                            data-testid={`button-contact-service-${service.id}`}
                          >
                            {t('shop:buttons.contactOwner')}
                          </Button>
                        )}
                      {(isAdmin || service.userId === user?.id) && (
                        <>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({
                                name: service.name,
                                description: service.description,
                                photos: service.photos || [],
                                price: service.price || "",
                                duration: service.duration || "",
                                type: (service.category as "offer" | "need") || "offer"
                              });
                              setServiceModalOpen(true);
                            }}
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            data-testid={`button-delete-service-${service.id}`}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </CardContent>
                  </Card>
                  </Box>
              );
              })}
            </Box>
          ) : (
            <Typography color="text.secondary">Nema dostupnih usluga</Typography>
          )}
        </Box>
      )}

      {/* Arhiva Tab (Admin only) */}
      {activeTab === 4 && isAdmin && (
        <Box>
          {loadingMarketplace ? (
            <Typography>{t('shop:display.loading')}</Typography>
          ) : archivedItems.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              {t('shop:display.noArchivedItems')}
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {archivedItems.map((item) => {
                const itemUser = getUserById(item.userId);
                return (
                  <Box key={item.id}>
                    <Card data-testid={`card-archived-${item.id}`}>
                      {item.photos && item.photos.length > 0 && (
                        item.photos.length === 1 ? (
                          <CardMedia
                            component="img"
                            image={item.photos[0]}
                            alt={item.title}
                            sx={{ 
                              cursor: 'pointer',
                              aspectRatio: '4/3',
                              objectFit: 'cover',
                              width: '100%'
                            }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ aspectRatio: '4/3' }} cols={2}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img 
                                  src={photo} 
                                  alt={`${item.title} ${idx + 1}`}
                                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-archived-name-${item.id}`}>
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.price && (
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }} data-testid={`text-archived-price-${item.id}`}>
                            {formatPrice(item.price)}
                          </Typography>
                        )}
                        <Chip 
                          label={item.type === "sell" ? t('shop:display.sold') : t('shop:display.gifted')} 
                          color="default" 
                          size="small" 
                          sx={{ mb: 1 }} 
                        />
                        {itemUser && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            {t('shop:display.owner', { name: `${itemUser.firstName} ${itemUser.lastName}` })}
                          </Typography>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <IconButton
                            color="error"
                            onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                            data-testid={`button-delete-archived-${item.id}`}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Add/Edit Product Dialog (Admin only) - Simplified form */}
      <Dialog open={productModalOpen} onClose={() => { setProductModalOpen(false); setEditingProduct(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? t('shop:dialogs.editProduct') : t('shop:dialogs.addProduct')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('shop:labels.name')}
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            margin="normal"
            data-testid="input-product-name"
          />
          
          <TextField
            fullWidth
            label={t('shop:labels.description')}
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            data-testid="input-product-description"
          />

          <TextField
            fullWidth
            label={t('shop:labels.price')}
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            margin="normal"
            data-testid="input-product-price"
          />
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              disabled={uploadingPhotos || productForm.photos.length >= 10}
              data-testid="button-upload-product-photos"
            >
              {uploadingPhotos ? t('shop:buttons.uploading') : t('shop:display.addPhotos', { current: productForm.photos.length, max: 10 })}
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files, true)}
              />
            </Button>
            {productForm.photos.length > 0 && (
              <ImageList sx={{ mt: 2, maxHeight: 200 }} cols={3} rowHeight={80}>
                {productForm.photos.map((photo, idx) => (
                  <ImageListItem key={idx}>
                    <img src={photo} alt={`Upload ${idx + 1}`} />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                      size="small"
                      onClick={() => removePhoto(idx, true)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductModalOpen(false)} data-testid="button-cancel-product">{t('shop:buttons.cancel')}</Button>
          <Button onClick={handleCreateProduct} variant="contained" data-testid="button-save-product">{t('shop:buttons.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Marketplace Item Dialog */}
      <Dialog open={marketplaceModalOpen} onClose={() => { setMarketplaceModalOpen(false); setEditingMarketplaceItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMarketplaceItem ? t('shop:dialogs.editListing') : (marketplaceForm.type === "sell" ? t('shop:dialogs.addSaleListing') : t('shop:dialogs.addGiftListing'))}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('shop:labels.name')}
            value={marketplaceForm.name}
            onChange={(e) => setMarketplaceForm({ ...marketplaceForm, name: e.target.value })}
            margin="normal"
            data-testid="input-marketplace-name"
          />
          
          <TextField
            fullWidth
            label={t('shop:labels.description')}
            value={marketplaceForm.description}
            onChange={(e) => setMarketplaceForm({ ...marketplaceForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            data-testid="input-marketplace-description"
          />

          {marketplaceForm.type === "sell" && (
            <TextField
              fullWidth
              label={t('shop:labels.price')}
              value={marketplaceForm.price}
              onChange={(e) => setMarketplaceForm({ ...marketplaceForm, price: e.target.value })}
              margin="normal"
              data-testid="input-marketplace-price"
            />
          )}

          <Box sx={{ mt: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              disabled={uploadingPhotos || marketplaceForm.photos.length >= 3}
              data-testid="button-upload-marketplace-photos"
            >
              {uploadingPhotos ? t('shop:buttons.uploading') : t('shop:display.addPhotos', { current: marketplaceForm.photos.length, max: 3 })}
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files, false)}
              />
            </Button>
            {marketplaceForm.photos.length > 0 && (
              <ImageList sx={{ mt: 2, maxHeight: 200 }} cols={3} rowHeight={80}>
                {marketplaceForm.photos.map((photo, idx) => (
                  <ImageListItem key={idx}>
                    <img src={photo} alt={`Upload ${idx + 1}`} />
                    <IconButton
                      sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                      size="small"
                      onClick={() => removePhoto(idx, false)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMarketplaceModalOpen(false); setEditingMarketplaceItem(null); }} data-testid="button-cancel-marketplace">{t('shop:buttons.cancel')}</Button>
          <Button onClick={handleCreateOrUpdateMarketplaceItem} variant="contained" data-testid="button-save-marketplace">
            {editingMarketplaceItem ? t('shop:buttons.update') : t('shop:buttons.publish')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Modal */}
      <Dialog open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('shop:dialogs.order', { product: selectedProduct?.name || '' })}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('shop:labels.size')}</InputLabel>
                <Select
                  value={purchaseDetails.size}
                  label={t('shop:labels.size')}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, size: e.target.value })}
                  data-testid="select-purchase-size"
                >
                  {selectedProduct.size && <MenuItem value={selectedProduct.size}>{selectedProduct.size}</MenuItem>}
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                  <MenuItem value="XL">XL</MenuItem>
                  <MenuItem value="XXL">XXL</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={t('shop:labels.quantity')}
                type="number"
                value={purchaseDetails.quantity}
                onChange={(e) => setPurchaseDetails({ ...purchaseDetails, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                margin="normal"
                inputProps={{ min: 1 }}
                data-testid="input-purchase-quantity"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>{t('shop:labels.color')}</InputLabel>
                <Select
                  value={purchaseDetails.color}
                  label={t('shop:labels.color')}
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, color: e.target.value })}
                  data-testid="select-purchase-color"
                >
                  {selectedProduct.color && <MenuItem value={selectedProduct.color}>{selectedProduct.color}</MenuItem>}
                  <MenuItem value="Crna">{t('shop:colors.black')}</MenuItem>
                  <MenuItem value="Bijela">{t('shop:colors.white')}</MenuItem>
                  <MenuItem value="Plava">{t('shop:colors.blue')}</MenuItem>
                  <MenuItem value="Crvena">{t('shop:colors.red')}</MenuItem>
                  <MenuItem value="Zelena">{t('shop:colors.green')}</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.contrastText">
                  {t('shop:display.total', { total: calculateTotal() })}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseModalOpen(false)} data-testid="button-cancel-purchase">{t('shop:buttons.cancel')}</Button>
          <Button onClick={handleSubmitPurchase} variant="contained" data-testid="button-submit-purchase">
            {t('shop:buttons.submitOrder')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog 
        open={fullscreenImageOpen} 
        onClose={() => setFullscreenImageOpen(false)} 
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            boxShadow: 'none'
          }
        }}
      >
        <IconButton
          onClick={() => setFullscreenImageOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
          data-testid="button-close-fullscreen"
        >
          <Close />
        </IconButton>
        <img 
          src={fullscreenImage} 
          alt="Fullscreen" 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '90vh', 
            objectFit: 'contain' 
          }} 
        />
      </Dialog>

      {/* Contact Owner Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('shop:dialogs.sendMessage')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label={t('shop:labels.messageContent')}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={t('shop:placeholders.enterMessage')}
              data-testid="input-contact-message"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)} data-testid="button-cancel-contact">
            {t('shop:buttons.cancel')}
          </Button>
          <Button 
            onClick={handleSendContactMessage} 
            variant="contained"
            disabled={sendContactMessageMutation.isPending}
            data-testid="button-send-contact"
          >
            {sendContactMessageMutation.isPending ? t('shop:buttons.sending') : t('shop:buttons.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceModalOpen} onClose={() => setServiceModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingService ? t('shop:dialogs.editService') : t('shop:dialogs.addService')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('shop:labels.serviceName')}
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('shop:labels.serviceDescription')}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              required
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label={t('shop:labels.servicePrice')}
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('shop:labels.serviceDuration')}
              value={serviceForm.duration}
              onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Vrsta usluge</InputLabel>
              <Select
                value={serviceForm.type}
                label="Vrsta usluge"
                onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value as "offer" | "need" })}
                data-testid="select-service-type"
              >
                <MenuItem value="offer">Nudim</MenuItem>
                <MenuItem value="need">Tražim</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                disabled={uploadingPhotos || serviceForm.photos.length >= 3}
                data-testid="button-upload-service-photos"
              >
                {uploadingPhotos ? t('shop:buttons.uploading') : t('shop:display.addPhotos', { current: serviceForm.photos.length, max: 3 })}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => handleServicePhotoUpload(e.target.files)}
                />
              </Button>
              {serviceForm.photos.length > 0 && (
                <ImageList sx={{ mt: 2, maxHeight: 200 }} cols={3} rowHeight={80}>
                  {serviceForm.photos.map((photo, idx) => (
                    <ImageListItem key={idx}>
                      <img src={photo} alt={`Upload ${idx + 1}`} />
                      <IconButton
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                        size="small"
                        onClick={() => removeServicePhoto(idx)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceModalOpen(false)}>
            {t('shop:buttons.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (!serviceForm.name || !serviceForm.description) {
                toast({ title: "Naziv i opis su obavezni", variant: "destructive" });
                return;
              }
              if (editingService) {
                updateServiceMutation.mutate({ id: editingService.id, data: serviceForm });
              } else {
                createServiceMutation.mutate(serviceForm);
              }
            }}
            variant="contained"
            disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
          >
            {editingService ? t('shop:buttons.update') : t('shop:buttons.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
