import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Divider,
  Chip,
  FAB,
  Searchbar,
  Menu,
  Button,
  Portal,
  Modal,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import databaseHelper from '../database/database';

const HistoryScreen = ({navigation}) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [totalSummary, setTotalSummary] = useState({
    totalTrays: 0,
    totalAmount: 0,
    totalTransactions: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Load sales data
  const loadSales = async () => {
    try {
      setLoading(true);
      await databaseHelper.initDB();
      const allSales = await databaseHelper.getAllSales();
      setSales(allSales);
      setFilteredSales(allSales);
      calculateTotals(allSales);
    } catch (error) {
      console.log('Error loading sales:', error);
      Alert.alert('Error', 'Failed to load sales history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for displayed sales with backward compatibility
  const calculateTotals = (salesData) => {
    const totals = salesData.reduce(
      (acc, sale) => ({
        totalTrays: acc.totalTrays + (sale.quantity_sold || sale.trays_sold || 0),
        totalAmount: acc.totalAmount + (sale.total_amount || 0),
        totalTransactions: acc.totalTransactions + 1,
      }),
      {totalTrays: 0, totalAmount: 0, totalTransactions: 0}
    );
    setTotalSummary(totals);
  };

  // Filter sales based on selected criteria and search
  const filterSales = useCallback(() => {
    let filtered = [...sales];

    // Apply date filter
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(sale => sale.sale_date === today);
        break;
      case 'yesterday':
        filtered = filtered.filter(sale => sale.sale_date === yesterday);
        break;
      case 'week':
        filtered = filtered.filter(sale => sale.sale_date >= weekAgo);
        break;
      case 'cash':
        filtered = filtered.filter(sale => sale.payment_method === 'Cash');
        break;
      case 'credit':
        filtered = filtered.filter(sale => sale.payment_method === 'Credit');
        break;
      case 'upi':
        filtered = filtered.filter(sale => sale.payment_method === 'UPI');
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(sale =>
        sale.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSales(filtered);
    calculateTotals(filtered);
  }, [sales, selectedFilter, searchQuery]);

  // Refresh data on pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  }, []);

  // Reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [])
  );

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [filterSales]);

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // HH:MM
  };

  // Get payment method color
  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Cash':
        return '#4CAF50';
      case 'Credit':
        return '#FF9800';
      case 'UPI':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  // Handle sale item press
  const handleSalePress = (sale) => {
    setSelectedSale(sale);
    setDetailModalVisible(true);
  };

  // Handle sale deletion
  const handleDeleteSale = (sale) => {
    Alert.alert(
      'Delete Sale',
      `Are you sure you want to delete this sale?\n\nVendor: ${sale.vendor_name}\nAmount: ₹${sale.total_amount}\nDate: ${formatDate(sale.sale_date)}\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await databaseHelper.deleteSale(sale.id);
              if (success) {
                Alert.alert('Success', 'Sale deleted successfully!');
                await loadSales(); // Reload the list
              } else {
                Alert.alert('Error', 'Failed to delete sale. Please try again.');
              }
            } catch (error) {
              console.log('Error deleting sale:', error);
              Alert.alert('Error', 'Failed to delete sale. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get filter label
  const getFilterLabel = () => {
    switch (selectedFilter) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'This Week';
      case 'cash':
        return 'Cash Only';
      case 'credit':
        return 'Credit Only';
      case 'upi':
        return 'UPI Only';
      default:
        return 'All Sales';
    }
  };

  // Render sale item
  const renderSaleItem = ({item}) => (
    <Card 
      style={styles.saleCard} 
      onPress={() => handleSalePress(item)}
      onLongPress={() => handleDeleteSale(item)}
      mode="outlined">
      <Card.Content>
        <View style={styles.saleHeader}>
          <View style={styles.saleHeaderLeft}>
            <Text style={styles.vendorName}>{item.vendor_name}</Text>
            <Text style={styles.saleDate}>
              {formatDate(item.sale_date)} • {formatTime(item.sale_time)}
            </Text>
          </View>
          <View style={styles.saleHeaderRight}>
            <Chip
              mode="flat"
              textStyle={{color: getPaymentMethodColor(item.payment_method)}}
              style={{backgroundColor: `${getPaymentMethodColor(item.payment_method)}20`, marginRight: 8}}>
              {item.payment_method}
            </Chip>
            <Button
              mode="text"
              icon="delete"
              compact
              onPress={() => handleDeleteSale(item)}
              textColor="#F44336"
              style={styles.deleteButton}>
              
            </Button>
          </View>
        </View>

        <Divider style={styles.saleDivider} />

        <View style={styles.saleDetails}>
          <View style={styles.saleDetailItem}>
            <Text style={styles.detailLabel}>Units Sold</Text>
            <Text style={styles.detailValue}>
              {item.quantity_sold || item.trays_sold} {item.unit_type || 'trays'}
            </Text>
          </View>
          <View style={styles.saleDetailItem}>
            <Text style={styles.detailLabel}>Rate/Unit</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.rate_per_unit || item.rate_per_tray)}
            </Text>
          </View>
          <View style={styles.saleDetailItem}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={[styles.detailValue, styles.totalValue]}>
              {formatCurrency(item.total_amount)}
            </Text>
          </View>
        </View>
        
        {/* Show vegetable type if not tomatoes */}
        {item.vegetable_type && item.vegetable_type !== 'Tomatoes' && (
          <View style={styles.vegetableTypeContainer}>
            <Chip mode="outlined" compact>
              {item.vegetable_type}
            </Chip>
          </View>
        )}
        
        {/* Payment status indicator */}
        {item.payment_status === 'pending' && (
          <View style={styles.pendingContainer}>
            <Chip mode="outlined" textStyle={{color: '#FF9800'}} style={{borderColor: '#FF9800'}} compact>
              Payment Pending: {formatCurrency(item.due_amount || item.total_amount)}
            </Chip>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Sales Found</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all' 
          ? 'Start adding sales to see them here'
          : `No sales found for "${getFilterLabel()}"`}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('AddSale')}
        style={styles.addButton}>
        Add First Sale
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by vendor name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setFilterMenuVisible(true)}
              style={styles.filterButton}>
              {getFilterLabel()}
            </Button>
          }>
          <Menu.Item onPress={() => {setSelectedFilter('all'); setFilterMenuVisible(false);}} title="All Sales" />
          <Menu.Item onPress={() => {setSelectedFilter('today'); setFilterMenuVisible(false);}} title="Today" />
          <Menu.Item onPress={() => {setSelectedFilter('yesterday'); setFilterMenuVisible(false);}} title="Yesterday" />
          <Menu.Item onPress={() => {setSelectedFilter('week'); setFilterMenuVisible(false);}} title="This Week" />
          <Divider />
          <Menu.Item onPress={() => {setSelectedFilter('cash'); setFilterMenuVisible(false);}} title="Cash Only" />
          <Menu.Item onPress={() => {setSelectedFilter('credit'); setFilterMenuVisible(false);}} title="Credit Only" />
          <Menu.Item onPress={() => {setSelectedFilter('upi'); setFilterMenuVisible(false);}} title="UPI Only" />
        </Menu>
      </View>

      {/* Sales List */}
      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary Footer */}
      {filteredSales.length > 0 && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Summary ({getFilterLabel()})</Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalSummary.totalTransactions}</Text>
                <Text style={styles.summaryLabel}>Transactions</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalSummary.totalTrays}</Text>
                <Text style={styles.summaryLabel}>Total Trays</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.summaryAmount]}>
                  {formatCurrency(totalSummary.totalAmount)}
                </Text>
                <Text style={styles.summaryLabel}>Total Amount</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Sale Detail Modal */}
      <Portal>
        <Modal
          visible={detailModalVisible}
          onDismiss={() => setDetailModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          {selectedSale && (
            <Card>
              <Card.Content>
                <Title style={styles.modalTitle}>Sale Details</Title>
                <Divider style={styles.modalDivider} />
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Vendor Name:</Text>
                  <Text style={styles.modalValue}>{selectedSale.vendor_name}</Text>
                </View>
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Date & Time:</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedSale.sale_date)} at {formatTime(selectedSale.sale_time)}
                  </Text>
                </View>
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Trays Sold:</Text>
                  <Text style={styles.modalValue}>{selectedSale.trays_sold}</Text>
                </View>
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Rate per Tray:</Text>
                  <Text style={styles.modalValue}>{formatCurrency(selectedSale.rate_per_tray)}</Text>
                </View>
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Payment Method:</Text>
                  <Text style={styles.modalValue}>{selectedSale.payment_method}</Text>
                </View>
                
                <View style={styles.modalDetail}>
                  <Text style={styles.modalLabel}>Total Amount:</Text>
                  <Text style={[styles.modalValue, styles.modalTotal]}>
                    {formatCurrency(selectedSale.total_amount)}
                  </Text>
                </View>
                
                <Button 
                  mode="contained" 
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.modalButton}>
                  Close
                </Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Sale"
        onPress={() => navigation.navigate('AddSale')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    minWidth: 100,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  saleCard: {
    marginBottom: 12,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleHeaderLeft: {
    flex: 1,
  },
  saleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    minWidth: 40,
    marginLeft: 4,
  },
  vegetableTypeContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  pendingContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saleDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saleDivider: {
    marginVertical: 8,
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 16,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
    backgroundColor: '#E3F2FD',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  summaryAmount: {
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDivider: {
    marginBottom: 16,
  },
  modalDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalTotal: {
    color: '#4CAF50',
    fontSize: 16,
  },
  modalButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});

export default HistoryScreen;
