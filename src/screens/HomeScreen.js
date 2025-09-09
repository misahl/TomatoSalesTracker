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
    totalTraysSold: 0,
    totalMoneyEarned: 0,
    traysLeft: 50,
    totalTransactions: 0,
    dailyTarget: 50,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load summary data
  const loadSummary = async () => {
    try {
      setLoading(true);
      // Initialize database if not already done
      await databaseHelper.initDB();
      const todaysSummary = await databaseHelper.getTodaysSummary();
      setSummary(todaysSummary);
    } catch (error) {
      console.log('Error loading summary:', error);
      Alert.alert('Error', 'Failed to load sales data. Please try again.');
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

  // Calculate progress percentage
  const progressPercentage = summary.dailyTarget > 0 
    ? Math.min(summary.totalTraysSold / summary.dailyTarget, 1) 
    : 0;

  // Get status color based on progress
  const getStatusColor = () => {
    if (progressPercentage >= 1) return '#4CAF50'; // Green - Target achieved
    if (progressPercentage >= 0.8) return '#FF9800'; // Orange - Close to target
    return '#2196F3'; // Blue - In progress
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
              Let's track today's tomato sales
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Title style={styles.progressTitle}>Daily Progress</Title>
              <Chip 
                mode="outlined" 
                textStyle={{color: getStatusColor()}}
                style={{borderColor: getStatusColor()}}>
                {Math.round(progressPercentage * 100)}%
              </Chip>
            </View>
            
            <ProgressBar 
              progress={progressPercentage} 
              color={getStatusColor()} 
              style={styles.progressBar}
            />
            
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>
                {summary.totalTraysSold} of {summary.dailyTarget} trays sold
              </Text>
              {summary.traysLeft > 0 && (
                <Text style={styles.remainingText}>
                  {summary.traysLeft} trays remaining
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
                {summary.totalTraysSold}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Trays Sold Today
              </Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.earningsCard]}>
            <Card.Content style={styles.metricContent}>
              <Title style={styles.metricNumber}>
                {formatCurrency(summary.totalMoneyEarned)}
              </Title>
              <Paragraph style={styles.metricLabel}>
                Today's Earnings
              </Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Additional Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Today's Summary</Title>
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
              <Text style={styles.statLabel}>Target Achievement:</Text>
              <Text style={[
                styles.statValue,
                {color: progressPercentage >= 1 ? '#4CAF50' : '#757575'}
              ]}>
                {Math.round(progressPercentage * 100)}%
              </Text>
            </View>
          </Card.Content>
        </Card>

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
                Add New Sale
              </Chip>
              <Chip 
                icon="history" 
                mode="outlined" 
                onPress={() => navigation.navigate('History')}
                style={styles.actionChip}>
                View History
              </Chip>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>

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
});

export default HomeScreen;
