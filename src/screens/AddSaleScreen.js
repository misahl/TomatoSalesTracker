import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  RadioButton,
  Text,
  Divider,
  Chip,
  HelperText,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import databaseHelper from '../database/database';

const AddSaleScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    vegetableType: '',
    quantitySold: '',
    unitType: 'trays',
    ratePerUnit: '',
    paymentMethod: 'Cash',
    paymentStatus: 'paid',
    truckArrivalTime: '',
    distributionTime: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [vegetableTypes, setVegetableTypes] = useState([]);
  const [currentInventory, setCurrentInventory] = useState([]);

  // Common vendor names for quick selection
  const commonVendors = [
    'City Retail Store',
    'Local Vegetable Shop',
    'Market Vendor A',
    'Market Vendor B',
    'Restaurant Supply',
    'Hotel Chain',
    'Grocery Store',
  ];

  // Common rates for quick selection (vary by vegetable)
  const getCommonRates = (vegetableType) => {
    const rateRanges = {
      'Tomatoes': [20, 25, 30, 35, 40],
      'Onions': [15, 18, 22, 25, 28],
      'Potatoes': [12, 15, 18, 20, 25],
      'Carrots': [25, 30, 35, 40, 45],
      'Cabbage': [8, 10, 12, 15, 18],
      'default': [15, 20, 25, 30, 35]
    };
    return rateRanges[vegetableType] || rateRanges.default;
  };

  // Unit type options
  const unitTypes = ['trays', 'sacks', 'boxes', 'kg', 'quintals'];

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load vegetable types
      const vegetables = await databaseHelper.getAllVegetableTypes();
      setVegetableTypes(vegetables);

      // Load today's inventory
      const today = new Date().toISOString().split('T')[0];
      const inventory = await databaseHelper.getInventoryByDate(today);
      setCurrentInventory(inventory);
      
      // Auto-fill truck arrival time with current time if empty
      const now = new Date();
      const timeString = now.toTimeString().substring(0, 5);
      if (!formData.truckArrivalTime) {
        setFormData(prev => ({...prev, truckArrivalTime: timeString}));
      }
    } catch (error) {
      console.log('Error loading initial data:', error);
    }
  };

  // Get current stock for selected vegetable
  const getCurrentStock = () => {
    const stockItem = currentInventory.find(item => 
      item.vegetable_type === formData.vegetableType
    );
    return stockItem ? stockItem.current_stock : 0;
  };

  // Get market rate for selected vegetable
  const getMarketRate = () => {
    const stockItem = currentInventory.find(item => 
      item.vegetable_type === formData.vegetableType
    );
    return stockItem ? stockItem.market_rate : 0;
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate vendor name
    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    } else if (formData.vendorName.length < 2) {
      newErrors.vendorName = 'Vendor name must be at least 2 characters';
    }

    // Validate trays sold
    if (!formData.traysSold.trim()) {
      newErrors.traysSold = 'Number of trays is required';
    } else {
      const trays = parseInt(formData.traysSold);
      if (isNaN(trays) || trays <= 0) {
        newErrors.traysSold = 'Enter a valid number of trays';
      } else if (trays > 100) {
        newErrors.traysSold = 'Number of trays seems too high. Please verify.';
      }
    }

    // Validate rate per tray
    if (!formData.ratePerTray.trim()) {
      newErrors.ratePerTray = 'Rate per tray is required';
    } else {
      const rate = parseFloat(formData.ratePerTray);
      if (isNaN(rate) || rate <= 0) {
        newErrors.ratePerTray = 'Enter a valid rate';
      } else if (rate < 10 || rate > 200) {
        newErrors.ratePerTray = 'Rate seems unusual. Please verify.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const trays = parseInt(formData.traysSold);
      const rate = parseFloat(formData.ratePerTray);
      const totalAmount = trays * rate;

      // Show confirmation before adding
      Alert.alert(
        'Confirm Sale',
        `Vendor: ${formData.vendorName}\nTrays: ${trays}\nRate: ₹${rate}\nTotal: ₹${totalAmount.toFixed(2)}\nPayment: ${formData.paymentMethod}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
          {
            text: 'Add Sale',
            onPress: async () => {
              try {
                await databaseHelper.addSale(
                  formData.vendorName.trim(),
                  trays,
                  rate,
                  formData.paymentMethod
                );

                Alert.alert(
                  'Success',
                  'Sale added successfully!',
                  [
                    {
                      text: 'Add Another',
                      onPress: () => {
                        resetForm();
                        setLoading(false);
                      },
                    },
                    {
                      text: 'Go to Home',
                      onPress: () => {
                        resetForm();
                        setLoading(false);
                        navigation.navigate('Home');
                      },
                    },
                  ]
                );
              } catch (error) {
                console.log('Error adding sale:', error);
                Alert.alert('Error', 'Failed to add sale. Please try again.');
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log('Error processing sale:', error);
      Alert.alert('Error', 'Failed to process sale. Please try again.');
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vendorName: '',
      traysSold: '',
      ratePerTray: '',
      paymentMethod: 'Cash',
    });
    setErrors({});
  };

  // Calculate total amount
  const getTotalAmount = () => {
    const trays = parseFloat(formData.traysSold) || 0;
    const rate = parseFloat(formData.ratePerTray) || 0;
    return trays * rate;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Add New Sale</Title>
            <Text style={styles.headerSubtitle}>
              Record tomato tray sales quickly and easily
            </Text>
          </Card.Content>
        </Card>

        {/* Main Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            
            {/* Vendor Name Input */}
            <View style={styles.inputSection}>
              <TextInput
                label="Vendor Name *"
                value={formData.vendorName}
                onChangeText={(text) => {
                  setFormData({...formData, vendorName: text});
                  if (errors.vendorName) {
                    setErrors({...errors, vendorName: null});
                  }
                }}
                mode="outlined"
                style={styles.input}
                error={!!errors.vendorName}
                left={<TextInput.Icon icon="account" />}
              />
              <HelperText type="error" visible={!!errors.vendorName}>
                {errors.vendorName}
              </HelperText>
              
              {/* Quick vendor selection */}
              <Text style={styles.quickSelectLabel}>Quick Select:</Text>
              <View style={styles.chipContainer}>
                {commonVendors.map((vendor) => (
                  <Chip
                    key={vendor}
                    mode="outlined"
                    selected={formData.vendorName === vendor}
                    onPress={() => setFormData({...formData, vendorName: vendor})}
                    style={styles.chip}>
                    {vendor}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Trays Sold Input */}
            <View style={styles.inputSection}>
              <TextInput
                label="Number of Trays Sold *"
                value={formData.traysSold}
                onChangeText={(text) => {
                  setFormData({...formData, traysSold: text});
                  if (errors.traysSold) {
                    setErrors({...errors, traysSold: null});
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.traysSold}
                left={<TextInput.Icon icon="package-variant" />}
              />
              <HelperText type="error" visible={!!errors.traysSold}>
                {errors.traysSold}
              </HelperText>
            </View>

            <Divider style={styles.divider} />

            {/* Rate Per Tray Input */}
            <View style={styles.inputSection}>
              <TextInput
                label="Rate per Tray (₹) *"
                value={formData.ratePerTray}
                onChangeText={(text) => {
                  setFormData({...formData, ratePerTray: text});
                  if (errors.ratePerTray) {
                    setErrors({...errors, ratePerTray: null});
                  }
                }}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
                error={!!errors.ratePerTray}
                left={<TextInput.Icon icon="currency-inr" />}
              />
              <HelperText type="error" visible={!!errors.ratePerTray}>
                {errors.ratePerTray}
              </HelperText>
              
              {/* Quick rate selection */}
              <Text style={styles.quickSelectLabel}>Common Rates:</Text>
              <View style={styles.chipContainer}>
                {commonRates.map((rate) => (
                  <Chip
                    key={rate}
                    mode="outlined"
                    selected={formData.ratePerTray === rate.toString()}
                    onPress={() => setFormData({...formData, ratePerTray: rate.toString()})}
                    style={styles.chip}>
                    ₹{rate}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Payment Method Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Payment Method *</Text>
              <RadioButton.Group
                onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                value={formData.paymentMethod}>
                <View style={styles.radioContainer}>
                  <View style={styles.radioItem}>
                    <RadioButton value="Cash" />
                    <Text style={styles.radioLabel}>Cash</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="Credit" />
                    <Text style={styles.radioLabel}>Credit</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="UPI" />
                    <Text style={styles.radioLabel}>UPI</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

          </Card.Content>
        </Card>

        {/* Total Amount Display */}
        {getTotalAmount() > 0 && (
          <Card style={styles.totalCard}>
            <Card.Content>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>₹{getTotalAmount().toFixed(2)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={resetForm}
            style={[styles.button, styles.resetButton]}
            disabled={loading}>
            Reset Form
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton]}
            loading={loading}
            disabled={loading}>
            Add Sale
          </Button>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formCard: {
    marginBottom: 16,
    elevation: 4,
  },
  inputSection: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalCard: {
    marginBottom: 16,
    elevation: 4,
    backgroundColor: '#E8F5E8',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  resetButton: {
    borderColor: '#757575',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
});

export default AddSaleScreen;
