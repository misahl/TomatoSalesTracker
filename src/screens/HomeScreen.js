import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Divider,
  Text,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import databaseHelper from '../database/database';

const HomeScreen = ({navigation}) => {
  const [summary, setSummary] = useState({
    totalQuantitySold: 0,
    totalMoneyEarned: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalTransactions: 0,
    inventory: []
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load enhanced summary data
  const loadSummary = async () => {
    try {
      setLoading(true);
      // Initialize database if not already done
      await databaseHelper.initDB();
      
      // Get today's summary with inventory
      const todaysSummary = await databaseHelper.getTodaysSummary();
      setSummary(todaysSummary);
      
      // Get pending payments
      const pendingPaymentsList = await databaseHelper.getAllPendingPayments();
      setPendingPayments(pendingPaymentsList);
      
    } catch (error) {
      console.log('Error loading summary:', error);
      Alert.alert('Error', 'Failed to load business data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data on pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  }, []);

  // Reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [])
  );

  useEffect(() => {
    loadSummary();
  }, []);

  // Calculate collection rate (paid vs total sales)
  const collectionRate = summary.totalMoneyEarned > 0
    ? (summary.paidAmount / summary.totalMoneyEarned)
    : 0;

  // Get status color based on collection rate and inventory status
  const getStatusColor = () => {
    if (collectionRate >= 0.9) return '#4CAF50'; // Green - Good collection
    if (collectionRate >= 0.7) return '#FF9800'; // Orange - Moderate collection
    return '#2196F3'; // Blue - Needs attention
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Early Start';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate total inventory value
  const getTotalInventoryValue = () => {
    if (!summary.inventory || summary.inventory.length === 0) return 0;
    return summary.inventory.reduce((total, item) => {
      return total + ((item.current_stock || 0) * (item.market_rate || 0));
    }, 0);
  };

  // Get pending payments count
  const getPendingPaymentsCount = () => {
    return pendingPayments ? pendingPayments.length : 0;
  };

  // Get total pending amount
  const getTotalPendingAmount = () => {
    if (!pendingPayments || pendingPayments.length === 0) return 0;
    return pendingPayments.reduce((total, payment) => {
      return total + (payment.total_due_amount || 0);
    }, 0);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Greeting Header */}
        <Card style={styles.greetingCard}>
          <Card.Content>
            <Title style={styles.greetingTitle}>{getGreeting()}!</Title>
            <Paragraph style={styles.greetingText}>
              Wholesale Vegetable Business Dashboard
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Collection Rate & Business Overview */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Title style={styles.progressTitle}>Payment Collection</Title>
              <Chip 
                mode="outlined" 
                textStyle={{color: getStatusColor()}}
                style={{borderColor: getStatusColor()}}>
                {Math.round(collectionRate * 100)}%
              </Chip>
            </View>
            
            <ProgressBar 
              progress={collectionRate} 
              color={getStatusColor()} 
              style={styles.progressBar}
            />
            
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>
                ₹{summary.paidAmount.toFixed(0)} collected of ₹{summary.totalMoneyEarned.toFixed(0)} total sales
              </Text>
              {summary.pendingAmount > 0 && (
                <Text style={styles.remainingText}>
                  ₹{summary.pendingAmount.toFixed(0)} pending from {getPendingPaymentsCount()} vendors
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Card style={[styles.metricCard, styles.soldCard]}>
            <Card.Content style={styles.metricContent}>
              <Title style={styles.metricNumber}>
                {summary.totalQuantitySold}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Total Units Sold
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.earningsCard]}>
            <Card.Content style={styles.metricContent}>
              <Title style={styles.metricNumber}>
                {formatCurrency(summary.totalMoneyEarned)}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Today's Revenue
              </Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Inventory & Payments Overview */}
        <View style={styles.metricsContainer}>
          <Card style={[styles.metricCard, styles.inventoryCard]}>
            <Card.Content style={styles.metricContent}>
              <Title style={styles.metricNumber}>
                {formatCurrency(getTotalInventoryValue())}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Stock Value
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.pendingCard]}>
            <Card.Content style={styles.metricContent}>
              <Title style={styles.metricNumber}>
                {getPendingPaymentsCount()}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Pending Payments
              </Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Business Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Today's Business Summary</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Transactions:</Text>
              <Text style={styles.statValue}>{summary.totalTransactions}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average per Transaction:</Text>
              <Text style={styles.statValue}>
                {summary.totalTransactions > 0 
                  ? formatCurrency(summary.totalMoneyEarned / summary.totalTransactions)
                  : '₹0.00'
                }
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Collection Rate:</Text>
              <Text style={[
                styles.statValue,
                {color: collectionRate >= 0.9 ? '#4CAF50' : collectionRate >= 0.7 ? '#FF9800' : '#F44336'}
              ]}>
                {Math.round(collectionRate * 100)}%
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Vegetable Types in Stock:</Text>
              <Text style={styles.statValue}>{summary.inventory ? summary.inventory.length : 0}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Current Inventory */}
        {summary.inventory && summary.inventory.length > 0 && (
          <Card style={styles.inventoryCard}>
            <Card.Content>
              <Title style={styles.statsTitle}>Current Stock</Title>
              <Divider style={styles.divider} />
              
              {summary.inventory.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.inventoryRow}>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.vegetableName}>{item.vegetable_type}</Text>
                    <Text style={styles.inventoryDetails}>
                      {item.current_stock} {item.unit_type} remaining
                    </Text>
                  </View>
                  <View style={styles.inventoryValue}>
                    <Text style={styles.rateText}>@₹{item.market_rate}</Text>
                    <Text style={styles.valueText}>
                      ₹{(item.current_stock * item.market_rate).toFixed(0)}
                    </Text>
                  </View>
                </View>
              ))}
              
              {summary.inventory && summary.inventory.length > 5 && (
                <Text style={styles.moreText}>
                  +{summary.inventory.length - 5} more vegetables...
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.actionsTitle}>Quick Actions</Title>
            <View style={styles.actionButtons}>
              <Chip 
                icon="plus" 
                mode="outlined" 
                onPress={() => navigation.navigate('AddSale')}
                style={styles.actionChip}>
                Record Sale
              </Chip>
              <Chip 
                icon="warehouse" 
                mode="outlined" 
                onPress={() => navigation.navigate('Inventory')}
                style={styles.actionChip}>
                Manage Stock
              </Chip>
            </View>
            <View style={styles.actionButtons}>
              <Chip 
                icon="cash" 
                mode="outlined" 
                onPress={() => navigation.navigate('Payments')}
                style={styles.actionChip}>
                Payments
              </Chip>
              <Chip 
                icon="calendar" 
                mode="outlined" 
                onPress={() => navigation.navigate('History')}
                style={styles.actionChip}>
                History
              </Chip>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Quick Sale"
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  greetingCard: {
    marginBottom: 16,
    elevation: 4,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  progressCard: {
    marginBottom: 16,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressStats: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  remainingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    elevation: 4,
  },
  soldCard: {
    marginRight: 8,
    backgroundColor: '#E3F2FD',
  },
  earningsCard: {
    marginLeft: 8,
    backgroundColor: '#E8F5E8',
  },
  inventoryCard: {
    marginRight: 8,
    backgroundColor: '#FFF3E0',
  },
  pendingCard: {
    marginLeft: 8,
    backgroundColor: '#FFEBEE',
  },
  metricContent: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionChip: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inventoryInfo: {
    flex: 1,
  },
  vegetableName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inventoryDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inventoryValue: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 12,
    color: '#666',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  moreText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default HomeScreen;
