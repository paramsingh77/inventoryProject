import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Rating,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Compare as CompareIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../utils/api';
import { Row, Col } from 'react-bootstrap';

/**
 * ITStore - Mini IT Shopping Store UI
 * Allows users to search for IT products, compare prices, and view ratings.
 */
const ITStore = () => {
  const { siteName } = useParams();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Handle product search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/store/search', { query: searchQuery });
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add to cart (placeholder)
  const handleAddToCart = (product) => {
    setSnackbar({
      open: true,
      message: `${product.name} added to cart`,
      severity: 'success'
    });
  };

  // Toggle favorite
  const toggleFavorite = (product) => {
    setFavorites(prev => {
      const isFavorite = prev.some(p => p.url === product.url);
      if (isFavorite) {
        return prev.filter(p => p.url !== product.url);
      }
      return [...prev, product];
    });
  };

  // Toggle compare
  const toggleCompare = (product) => {
    setCompareList(prev => {
      const isInCompare = prev.some(p => p.url === product.url);
      if (isInCompare) {
        return prev.filter(p => p.url !== product.url);
      }
      if (prev.length >= 3) {
        setSnackbar({
          open: true,
          message: 'You can compare up to 3 products at a time',
          severity: 'warning'
        });
        return prev;
      }
      return [...prev, product];
    });
  };

  // Product card UI
  const ProductCard = ({ product }) => (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={product.rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviews_count})
          </Typography>
        </Box>
        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
          ${product.price.toFixed(2)}
        </Typography>
        <Chip 
          label={product.source}
          size="small"
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          Last updated: {new Date(product.last_updated).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Tooltip title="Add to Cart">
          <IconButton onClick={() => handleAddToCart(product)} color="primary">
            <CartIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={favorites.some(p => p.url === product.url) ? "Remove from Favorites" : "Add to Favorites"}>
          <IconButton 
            onClick={() => toggleFavorite(product)}
            color={favorites.some(p => p.url === product.url) ? "secondary" : "default"}
          >
            <FavoriteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Compare">
          <IconButton 
            onClick={() => toggleCompare(product)}
            color={compareList.some(p => p.url === product.url) ? "primary" : "default"}
          >
            <CompareIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="View Details">
          <IconButton href={product.url} target="_blank" rel="noopener noreferrer">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* DEBUG: Show siteName param */}
      <div style={{ background: '#ffeeba', padding: 8, marginBottom: 16, borderRadius: 4 }}>
        <strong>DEBUG:</strong> siteName param = {siteName}
      </div>
      {/* TEST: Confirm component renders */}
      <div style={{ color: 'green', fontWeight: 'bold', marginBottom: 16 }}>ITStore component is rendering!</div>
      <Typography variant="h4" component="h1" gutterBottom>
        IT Store
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Find the best IT products at competitive prices
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {products.length > 0 && (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item key={product.url} xs={12} sm={6} md={4}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
      {!loading && !error && products.length === 0 && searchQuery && (
        <Alert severity="info">
          No products found. Try a different search term.
        </Alert>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ITStore; 