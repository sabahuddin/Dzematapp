import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Box, Tabs, Tab, Typography, Card, CardContent, CardMedia, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, ImageList, ImageListItem, Select, FormControl, InputLabel } from "@mui/material";
import { Add, Delete, ShoppingCart, Store, CardGiftcard, CloudUpload, Edit, Close, ContentCopy, Archive, Check } from "@mui/icons-material";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMarkAsViewed } from "@/hooks/useMarkAsViewed";
import type { ShopProduct, MarketplaceItem, User } from "@shared/schema";

interface ShopProductWithUser extends ShopProduct {
  creator?: User;
}

interface MarketplaceItemWithUser extends MarketplaceItem {
  user?: User;
}

export default function ShopPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  useMarkAsViewed('shop');
  const [activeTab, setActiveTab] = useState(0);
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
  const [contactMessage, setContactMessage] = useState("");
  
  const [productForm, setProductForm] = useState({
    name: "",
    photos: [] as string[],
    size: "",
    quantity: 0,
    color: "",
    notes: "",
    price: ""
  });
  
  const [marketplaceForm, setMarketplaceForm] = useState({
    name: "",
    description: "",
    photos: [] as string[],
    type: "sale" as "sale" | "gift",
    price: "",
    status: "active"
  });

  const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('imam');

  // Fetch shop products
  const { data: shopProducts, isLoading: loadingProducts } = useQuery<ShopProductWithUser[]>({
    queryKey: ['/api/shop/products'],
  });

  // Fetch marketplace items
  const { data: marketplaceItems, isLoading: loadingMarketplace } = useQuery<MarketplaceItemWithUser[]>({
    queryKey: ['/api/marketplace/items'],
  });

  // Fetch users for displaying names
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Photo upload handler
  const handlePhotoUpload = async (files: FileList | null, isProduct: boolean) => {
    if (!files || files.length === 0) return;

    const maxFiles = isProduct ? 10 : 3;
    const currentPhotos = isProduct ? productForm.photos : marketplaceForm.photos;

    if (currentPhotos.length + files.length > maxFiles) {
      toast({ 
        title: "Previše slika", 
        description: `Možete dodati maksimalno ${maxFiles} slika`,
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

      toast({ title: "Slike uspješno dodane" });
    } catch (error) {
      toast({ title: "Greška pri uploadovanju slika", variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
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
      toast({ title: "Artikal uspješno dodan" });
      setProductModalOpen(false);
      setProductForm({
        name: "",
        photos: [],
        size: "",
        quantity: 0,
        color: "",
        notes: "",
        price: ""
      });
    },
    onError: () => {
      toast({ title: "Greška pri dodavanju artikla", variant: "destructive" });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/shop/products/${productId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal obrisan" });
    },
    onError: () => {
      toast({ title: "Greška pri brisanju artikla", variant: "destructive" });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof productForm }) => {
      return await apiRequest(`/api/shop/products/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal uspješno ažuriran" });
      setProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        photos: [],
        size: "",
        quantity: 0,
        color: "",
        notes: "",
        price: ""
      });
    },
    onError: () => {
      toast({ title: "Greška pri ažuriranju artikla", variant: "destructive" });
    }
  });

  // Complete product mutation (mark as finished)
  const completeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/shop/products/${productId}`, 'PUT', { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal označen kao završen" });
    },
    onError: () => {
      toast({ title: "Greška", variant: "destructive" });
    }
  });

  // Duplicate product mutation
  const duplicateProductMutation = useMutation({
    mutationFn: async (product: ShopProductWithUser) => {
      return await apiRequest('/api/shop/products', 'POST', {
        name: product.name,
        photos: product.photos || [],
        size: product.size,
        quantity: product.quantity,
        color: product.color,
        notes: product.notes,
        price: product.price,
        createdById: user!.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal kopiran" });
    },
    onError: () => {
      toast({ title: "Greška pri kopiranju artikla", variant: "destructive" });
    }
  });

  // Create marketplace item mutation
  const createMarketplaceItemMutation = useMutation({
    mutationFn: async (itemData: typeof marketplaceForm) => {
      return await apiRequest('/api/marketplace/items', 'POST', {
        ...itemData,
        userId: user!.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas uspješno dodan" });
      setMarketplaceModalOpen(false);
      setEditingMarketplaceItem(null);
      setMarketplaceForm({
        name: "",
        description: "",
        photos: [],
        type: "sale",
        price: "",
        status: "active"
      });
    },
    onError: () => {
      toast({ title: "Greška pri dodavanju oglasa", variant: "destructive" });
    }
  });

  // Update marketplace item mutation
  const updateMarketplaceItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof marketplaceForm }) => {
      return await apiRequest(`/api/marketplace/items/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas uspješno ažuriran" });
      setMarketplaceModalOpen(false);
      setEditingMarketplaceItem(null);
      setMarketplaceForm({
        name: "",
        description: "",
        photos: [],
        type: "sale",
        price: "",
        status: "active"
      });
    },
    onError: () => {
      toast({ title: "Greška pri ažuriranju oglasa", variant: "destructive" });
    }
  });

  // Delete marketplace item mutation
  const deleteMarketplaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/marketplace/items/${itemId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas obrisan" });
    },
    onError: () => {
      toast({ title: "Greška pri brisanju oglasa", variant: "destructive" });
    }
  });

  // Mark marketplace item as completed mutation
  const completeMarketplaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/marketplace/items/${itemId}`, 'PUT', { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas označen kao završen" });
    },
    onError: () => {
      toast({ title: "Greška pri označavanju oglasa", variant: "destructive" });
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
        title: "Narudžba poslana", 
        description: "Uskoro ćete biti kontaktirani oko pojedinosti."
      });
      
      // Send message to admin about the purchase request
      const adminUser = users?.find(u => u.isAdmin);
      if (adminUser && selectedProduct) {
        try {
          await apiRequest('/api/messages', 'POST', {
            senderId: user!.id,
            recipientId: adminUser.id,
            subject: "Nova narudžba iz DžematShop",
            content: `${user!.firstName} ${user!.lastName} želi kupiti: ${selectedProduct.name}${purchaseDetails.quantity > 1 ? ` (Količina: ${purchaseDetails.quantity})` : ''}`
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
      toast({ title: "Greška pri slanju narudžbe", variant: "destructive" });
    }
  });

  const handleCreateProduct = () => {
    if (!productForm.name) {
      toast({ title: "Naziv je obavezan", variant: "destructive" });
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
      photos: product.photos || [],
      size: product.size || "",
      quantity: product.quantity || 0,
      color: product.color || "",
      notes: product.notes || "",
      price: product.price || ""
    });
    setProductModalOpen(true);
  };

  const handleCreateOrUpdateMarketplaceItem = () => {
    if (!marketplaceForm.name) {
      toast({ title: "Naziv je obavezan", variant: "destructive" });
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
      name: item.name,
      description: item.description || "",
      photos: item.photos || [],
      type: item.type as "sale" | "gift",
      price: item.price || "",
      status: item.status || "active"
    });
    setMarketplaceModalOpen(true);
  };

  const handleOpenPurchaseModal = (product: ShopProductWithUser) => {
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

  const handleContactUser = (itemUser: User | undefined) => {
    if (itemUser) {
      setContactUserId(itemUser.id);
      setContactMessage("");
      setContactDialogOpen(true);
    }
  };

  const sendContactMessageMutation = useMutation({
    mutationFn: async (data: { recipientId: string; message: string }) => {
      return apiRequest("/api/messages", "POST", {
        senderId: user!.id,
        recipientId: data.recipientId,
        subject: "Poruka sa Shop-a",
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
        title: "Greška", 
        description: "Greška pri slanju poruke", 
        variant: "destructive" 
      });
    }
  });

  const handleSendContactMessage = () => {
    if (!contactUserId || !contactMessage.trim()) {
      toast({ 
        title: "Greška", 
        description: "Molimo unesite sadržaj poruke", 
        variant: "destructive" 
      });
      return;
    }
    sendContactMessageMutation.mutate({ 
      recipientId: contactUserId, 
      message: contactMessage
    });
  };

  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  const saleItems = marketplaceItems?.filter(item => item.type === "sale" && item.status === "active") || [];
  const giftItems = marketplaceItems?.filter(item => item.type === "gift" && item.status === "active") || [];
  const archivedItems = marketplaceItems?.filter(item => item.status === "completed") || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Shop
      </Typography>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="DžematShop" icon={<Store />} iconPosition="start" data-testid="tab-buy" />
        <Tab label="Prodajem" icon={<ShoppingCart />} iconPosition="start" data-testid="tab-sell" />
        <Tab label="Poklanjam" icon={<CardGiftcard />} iconPosition="start" data-testid="tab-gift" />
        {isAdmin && <Tab label="Arhiva" icon={<Archive />} iconPosition="start" data-testid="tab-archive" />}
      </Tabs>

      {/* DžematShop Tab */}
      {activeTab === 0 && (
        <Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  photos: [],
                  size: "",
                  quantity: 0,
                  color: "",
                  notes: "",
                  price: ""
                });
                setProductModalOpen(true);
              }}
              sx={{ mb: 3 }}
              data-testid="button-add-product"
            >
              Dodaj Artikal
            </Button>
          )}

          {loadingProducts ? (
            <Typography>Učitavanje...</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {shopProducts?.map((product) => (
                <Box key={product.id}>
                  <Card data-testid={`card-product-${product.id}`}>
                    {product.photos && product.photos.length > 0 && (
                      product.photos.length === 1 ? (
                        <CardMedia
                          component="img"
                          height="200"
                          image={product.photos[0]}
                          alt={product.name}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => openFullscreenImage(product.photos![0])}
                        />
                      ) : (
                        <ImageList sx={{ height: 200 }} cols={2} rowHeight={100}>
                          {product.photos.slice(0, 4).map((photo, idx) => (
                            <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                              <img src={photo} alt={`${product.name} ${idx + 1}`} />
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
                          {product.price} CHF
                        </Typography>
                      )}
                      {product.size && (
                        <Typography variant="body2" color="text.secondary">
                          Veličina: {product.size}
                        </Typography>
                      )}
                      {product.color && (
                        <Typography variant="body2" color="text.secondary">
                          Boja: {product.color}
                        </Typography>
                      )}
                      {product.quantity !== null && product.quantity !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                          Na stanju: {product.quantity}
                        </Typography>
                      )}
                      {product.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {product.notes}
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
                            Kupi
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditProduct(product)}
                              data-testid={`button-edit-product-${product.id}`}
                              title="Uredi artikal"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="success"
                              onClick={() => completeProductMutation.mutate(product.id)}
                              data-testid={`button-complete-product-${product.id}`}
                              title="Završeno"
                            >
                              <Check />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              data-testid={`button-delete-product-${product.id}`}
                              title="Obriši artikal"
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
      {activeTab === 1 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingMarketplaceItem(null);
              setMarketplaceForm({ name: "", description: "", photos: [], type: "sale", price: "", status: "active" });
              setMarketplaceModalOpen(true);
            }}
            sx={{ mb: 3 }}
            data-testid="button-add-sale-item"
          >
            Dodaj Oglas
          </Button>

          {loadingMarketplace ? (
            <Typography>Učitavanje...</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {saleItems.map((item) => {
                const itemUser = getUserById(item.userId);
                const canEdit = item.userId === user?.id || isAdmin;
                return (
                  <Box key={item.id}>
                    <Card data-testid={`card-sale-${item.id}`}>
                      {item.photos && item.photos.length > 0 && (
                        item.photos.length === 1 ? (
                          <CardMedia
                            component="img"
                            height="200"
                            image={item.photos[0]}
                            alt={item.name}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ height: 200 }} cols={2} rowHeight={100}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img src={photo} alt={`${item.name} ${idx + 1}`} />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-sale-name-${item.id}`}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.price && (
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }} data-testid={`text-sale-price-${item.id}`}>
                            {item.price} CHF
                          </Typography>
                        )}
                        <Chip label="Na prodaju" color="primary" size="small" sx={{ mb: 1 }} />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {item.userId !== user?.id && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleContactUser(itemUser)}
                              data-testid={`button-contact-${item.id}`}
                            >
                              Pošalji poruku vlasniku
                            </Button>
                          )}
                          {canEdit && (
                            <>
                              <IconButton
                                color="primary"
                                onClick={() => handleEditMarketplaceItem(item)}
                                data-testid={`button-edit-sale-${item.id}`}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-delete-sale-${item.id}`}
                              >
                                <Delete />
                              </IconButton>
                              <Button
                                variant="outlined"
                                size="small"
                                color="success"
                                onClick={() => completeMarketplaceItemMutation.mutate(item.id)}
                                data-testid={`button-complete-sale-${item.id}`}
                              >
                                Završeno
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
      {activeTab === 2 && (
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
            Dodaj Poklon
          </Button>

          {loadingMarketplace ? (
            <Typography>Učitavanje...</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {giftItems.map((item) => {
                const itemUser = getUserById(item.userId);
                const canEdit = item.userId === user?.id || isAdmin;
                return (
                  <Box key={item.id}>
                    <Card data-testid={`card-gift-${item.id}`}>
                      {item.photos && item.photos.length > 0 && (
                        item.photos.length === 1 ? (
                          <CardMedia
                            component="img"
                            height="200"
                            image={item.photos[0]}
                            alt={item.name}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ height: 200 }} cols={2} rowHeight={100}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img src={photo} alt={`${item.name} ${idx + 1}`} />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-gift-name-${item.id}`}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        <Chip label="Poklon" color="success" size="small" sx={{ mb: 1 }} />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {item.userId !== user?.id && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleContactUser(itemUser)}
                              data-testid={`button-contact-gift-${item.id}`}
                            >
                              Pošalji poruku vlasniku
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
                                Završeno
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

      {/* Arhiva Tab (Admin only) */}
      {activeTab === 3 && isAdmin && (
        <Box>
          {loadingMarketplace ? (
            <Typography>Učitavanje...</Typography>
          ) : archivedItems.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Nema arhiviranih artikala
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
                            height="200"
                            image={item.photos[0]}
                            alt={item.name}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => openFullscreenImage(item.photos![0])}
                          />
                        ) : (
                          <ImageList sx={{ height: 200 }} cols={2} rowHeight={100}>
                            {item.photos.slice(0, 4).map((photo, idx) => (
                              <ImageListItem key={idx} sx={{ cursor: 'pointer' }} onClick={() => openFullscreenImage(photo)}>
                                <img src={photo} alt={`${item.name} ${idx + 1}`} />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-archived-name-${item.id}`}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.price && (
                          <Typography variant="h6" color="primary" sx={{ mb: 1 }} data-testid={`text-archived-price-${item.id}`}>
                            {item.price} CHF
                          </Typography>
                        )}
                        <Chip 
                          label={item.type === "sale" ? "Prodato" : "Pokloneno"} 
                          color="default" 
                          size="small" 
                          sx={{ mb: 1 }} 
                        />
                        {itemUser && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            Vlasnik: {itemUser.firstName} {itemUser.lastName}
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

      {/* Add/Edit Product Dialog (Admin only) */}
      <Dialog open={productModalOpen} onClose={() => { setProductModalOpen(false); setEditingProduct(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? "Uredi Artikal" : "Dodaj Artikal"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Naziv"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            margin="normal"
            data-testid="input-product-name"
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
              {uploadingPhotos ? "Uploadovanje..." : `Dodaj slike (${productForm.photos.length}/10)`}
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

          <TextField
            fullWidth
            label="Veličina"
            value={productForm.size}
            onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
            margin="normal"
            data-testid="input-product-size"
          />
          <TextField
            fullWidth
            label="Količina"
            type="number"
            value={productForm.quantity}
            onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
            margin="normal"
            data-testid="input-product-quantity"
          />
          <TextField
            fullWidth
            label="Boja"
            value={productForm.color}
            onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
            margin="normal"
            data-testid="input-product-color"
          />
          <TextField
            fullWidth
            label="Cijena (CHF)"
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            margin="normal"
            data-testid="input-product-price"
          />
          <TextField
            fullWidth
            label="Napomena"
            value={productForm.notes}
            onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            data-testid="input-product-notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductModalOpen(false)} data-testid="button-cancel-product">Odustani</Button>
          <Button onClick={handleCreateProduct} variant="contained" data-testid="button-save-product">Sačuvaj</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Marketplace Item Dialog */}
      <Dialog open={marketplaceModalOpen} onClose={() => { setMarketplaceModalOpen(false); setEditingMarketplaceItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMarketplaceItem ? "Uredi Oglas" : (marketplaceForm.type === "sale" ? "Dodaj Oglas za Prodaju" : "Dodaj Poklon")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Naziv"
            value={marketplaceForm.name}
            onChange={(e) => setMarketplaceForm({ ...marketplaceForm, name: e.target.value })}
            margin="normal"
            data-testid="input-marketplace-name"
          />
          
          <TextField
            fullWidth
            label="Opis"
            value={marketplaceForm.description}
            onChange={(e) => setMarketplaceForm({ ...marketplaceForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            data-testid="input-marketplace-description"
          />

          {marketplaceForm.type === "sale" && (
            <TextField
              fullWidth
              label="Cijena (CHF)"
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
              {uploadingPhotos ? "Uploadovanje..." : `Dodaj slike (${marketplaceForm.photos.length}/3)`}
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
          <Button onClick={() => { setMarketplaceModalOpen(false); setEditingMarketplaceItem(null); }} data-testid="button-cancel-marketplace">Odustani</Button>
          <Button onClick={handleCreateOrUpdateMarketplaceItem} variant="contained" data-testid="button-save-marketplace">
            {editingMarketplaceItem ? "Ažuriraj" : "Objavi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Modal */}
      <Dialog open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Naruči {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Veličina</InputLabel>
                <Select
                  value={purchaseDetails.size}
                  label="Veličina"
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
                label="Količina"
                type="number"
                value={purchaseDetails.quantity}
                onChange={(e) => setPurchaseDetails({ ...purchaseDetails, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                margin="normal"
                inputProps={{ min: 1 }}
                data-testid="input-purchase-quantity"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Boja</InputLabel>
                <Select
                  value={purchaseDetails.color}
                  label="Boja"
                  onChange={(e) => setPurchaseDetails({ ...purchaseDetails, color: e.target.value })}
                  data-testid="select-purchase-color"
                >
                  {selectedProduct.color && <MenuItem value={selectedProduct.color}>{selectedProduct.color}</MenuItem>}
                  <MenuItem value="Crna">Crna</MenuItem>
                  <MenuItem value="Bijela">Bijela</MenuItem>
                  <MenuItem value="Plava">Plava</MenuItem>
                  <MenuItem value="Crvena">Crvena</MenuItem>
                  <MenuItem value="Zelena">Zelena</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.contrastText">
                  Ukupno: {calculateTotal()} CHF
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseModalOpen(false)} data-testid="button-cancel-purchase">Odustani</Button>
          <Button onClick={handleSubmitPurchase} variant="contained" data-testid="button-submit-purchase">
            Pošalji narudžbu
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
        <DialogTitle>Pošalji poruku</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Sadržaj poruke"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Unesite vašu poruku..."
              data-testid="input-contact-message"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)} data-testid="button-cancel-contact">
            Odustani
          </Button>
          <Button 
            onClick={handleSendContactMessage} 
            variant="contained"
            disabled={sendContactMessageMutation.isPending}
            data-testid="button-send-contact"
          >
            {sendContactMessageMutation.isPending ? "Slanje..." : "Pošalji"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
