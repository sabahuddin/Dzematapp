import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Box, Tabs, Tab, Typography, Card, CardContent, CardMedia, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material";
import { Add, Delete, ShoppingCart, Store, CardGiftcard } from "@mui/icons-material";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const [activeTab, setActiveTab] = useState(0);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    image: "",
    size: "",
    quantity: 0,
    color: "",
    notes: "",
    price: 0
  });
  const [marketplaceForm, setMarketplaceForm] = useState({
    name: "",
    image: "",
    type: "sale" as "sale" | "gift"
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

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: typeof productForm) => {
      return await apiRequest('POST', '/api/shop/products', productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal uspješno dodan" });
      setProductModalOpen(false);
      setProductForm({
        name: "",
        image: "",
        size: "",
        quantity: 0,
        color: "",
        notes: "",
        price: 0
      });
    },
    onError: () => {
      toast({ title: "Greška pri dodavanju artikla", variant: "destructive" });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest('DELETE', `/api/shop/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({ title: "Artikal obrisan" });
    },
    onError: () => {
      toast({ title: "Greška pri brisanju artikla", variant: "destructive" });
    }
  });

  // Create marketplace item mutation
  const createMarketplaceItemMutation = useMutation({
    mutationFn: async (itemData: typeof marketplaceForm) => {
      return await apiRequest('POST', '/api/marketplace/items', itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas uspješno dodan" });
      setMarketplaceModalOpen(false);
      setMarketplaceForm({
        name: "",
        image: "",
        type: "sale"
      });
    },
    onError: () => {
      toast({ title: "Greška pri dodavanju oglasa", variant: "destructive" });
    }
  });

  // Delete marketplace item mutation
  const deleteMarketplaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest('DELETE', `/api/marketplace/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/items'] });
      toast({ title: "Oglas obrisan" });
    },
    onError: () => {
      toast({ title: "Greška pri brisanju oglasa", variant: "destructive" });
    }
  });

  // Create purchase request mutation
  const createPurchaseRequestMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest('POST', '/api/shop/purchase-requests', { productId, quantity });
    },
    onSuccess: () => {
      toast({ title: "Zahtjev za kupovinu poslat administratoru" });
    },
    onError: () => {
      toast({ title: "Greška pri slanju zahtjeva", variant: "destructive" });
    }
  });

  const handleCreateProduct = () => {
    createProductMutation.mutate(productForm);
  };

  const handleCreateMarketplaceItem = () => {
    createMarketplaceItemMutation.mutate(marketplaceForm);
  };

  const handlePurchaseRequest = (productId: string) => {
    createPurchaseRequestMutation.mutate({ productId, quantity: 1 });
  };

  const handleContactUser = (itemUser: User | undefined) => {
    if (itemUser) {
      toast({ title: `Kontaktirajte ${itemUser.firstName} ${itemUser.lastName}`, description: itemUser.phone || itemUser.email || "Nema dostupnih kontakt podataka" });
    }
  };

  const getUserById = (userId: string) => {
    return users?.find(u => u.id === userId);
  };

  const saleItems = marketplaceItems?.filter(item => item.type === "sale") || [];
  const giftItems = marketplaceItems?.filter(item => item.type === "gift") || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Prodavnica
      </Typography>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Kupujem" icon={<Store />} iconPosition="start" data-testid="tab-buy" />
        <Tab label="Prodajem" icon={<ShoppingCart />} iconPosition="start" data-testid="tab-sell" />
        <Tab label="Poklanjam" icon={<CardGiftcard />} iconPosition="start" data-testid="tab-gift" />
      </Tabs>

      {/* Kupujem Tab */}
      {activeTab === 0 && (
        <Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setProductModalOpen(true)}
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
                    {product.image && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={product.image}
                        alt={product.name}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </Typography>
                      {product.price && (
                        <Typography variant="h5" color="primary" gutterBottom>
                          {product.price} KM
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
                      {product.quantity !== null && (
                        <Typography variant="body2" color="text.secondary">
                          Dostupno: {product.quantity}
                        </Typography>
                      )}
                      {product.notes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {product.notes}
                        </Typography>
                      )}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {!isAdmin && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ShoppingCart />}
                            onClick={() => handlePurchaseRequest(product.id)}
                            disabled={product.quantity === 0}
                            data-testid={`button-buy-${product.id}`}
                          >
                            Kupi
                          </Button>
                        )}
                        {isAdmin && (
                          <IconButton
                            color="error"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Delete />
                          </IconButton>
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
              setMarketplaceForm({ ...marketplaceForm, type: "sale" });
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
                return (
                  <Box key={item.id}>
                    <Card data-testid={`card-sale-${item.id}`}>
                      {item.image && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.image}
                          alt={item.name}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-sale-name-${item.id}`}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Prodavač: {itemUser ? `${itemUser.firstName} ${itemUser.lastName}` : "Nepoznato"}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleContactUser(itemUser)}
                            data-testid={`button-contact-${item.id}`}
                          >
                            Kontaktiraj me
                          </Button>
                          {(isAdmin || item.userId === user?.id) && (
                            <IconButton
                              color="error"
                              onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                              data-testid={`button-delete-sale-${item.id}`}
                            >
                              <Delete />
                            </IconButton>
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
              setMarketplaceForm({ ...marketplaceForm, type: "gift" });
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
                return (
                  <Box key={item.id}>
                    <Card data-testid={`card-gift-${item.id}`}>
                      {item.image && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.image}
                          alt={item.name}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" gutterBottom data-testid={`text-gift-name-${item.id}`}>
                          {item.name}
                        </Typography>
                        <Chip label="Poklon" color="success" size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Poklanja: {itemUser ? `${itemUser.firstName} ${itemUser.lastName}` : "Nepoznato"}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleContactUser(itemUser)}
                            data-testid={`button-contact-gift-${item.id}`}
                          >
                            Kontaktiraj me
                          </Button>
                          {(isAdmin || item.userId === user?.id) && (
                            <IconButton
                              color="error"
                              onClick={() => deleteMarketplaceItemMutation.mutate(item.id)}
                              data-testid={`button-delete-gift-${item.id}`}
                            >
                              <Delete />
                            </IconButton>
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

      {/* Add Product Dialog */}
      <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dodaj Artikal</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Naziv"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            margin="normal"
            data-testid="input-product-name"
          />
          <TextField
            fullWidth
            label="URL Slike"
            value={productForm.image}
            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
            margin="normal"
            data-testid="input-product-image"
          />
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
            label="Kolicina"
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
            label="Cijena (KM)"
            type="number"
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
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

      {/* Add Marketplace Item Dialog */}
      <Dialog open={marketplaceModalOpen} onClose={() => setMarketplaceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{marketplaceForm.type === "sale" ? "Dodaj Oglas za Prodaju" : "Dodaj Poklon"}</DialogTitle>
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
            label="URL Slike"
            value={marketplaceForm.image}
            onChange={(e) => setMarketplaceForm({ ...marketplaceForm, image: e.target.value })}
            margin="normal"
            data-testid="input-marketplace-image"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarketplaceModalOpen(false)} data-testid="button-cancel-marketplace">Odustani</Button>
          <Button onClick={handleCreateMarketplaceItem} variant="contained" data-testid="button-save-marketplace">Objavi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
