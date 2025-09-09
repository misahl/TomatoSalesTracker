/**
 * Tomato Sales Tracker App
 * A React Native app for tracking wholesale tomato sales
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider as PaperProvider, MD3LightTheme} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AddSaleScreen from './src/screens/AddSaleScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

// Custom theme colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50',
    primaryContainer: '#C8E6C9',
    secondary: '#2196F3',
    secondaryContainer: '#E3F2FD',
    background: '#f5f5f5',
    surface: '#ffffff',
  },
};

// Tab bar icons configuration
const getTabBarIcon = (route, focused, color, size) => {
  let iconName;

  if (route.name === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (route.name === 'AddSale') {
    iconName = focused ? 'plus-circle' : 'plus-circle-outline';
  } else if (route.name === 'History') {
    iconName = focused ? 'history' : 'history';
  }

  // You can use react-native-vector-icons here
  // For now, we'll use a simple text representation
  const icons = {
    'home': '🏠',
    'home-outline': '🏠',
    'plus-circle': '➕',
    'plus-circle-outline': '➕',
    'history': '📋',
  };

  return icons[iconName] || '📱';
};

function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor={theme.colors.primary}
          />
          
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => 
                getTabBarIcon(route, focused, color, size),
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#ffffff',
                elevation: 8,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: {width: 0, height: -2},
                borderTopWidth: 0,
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              headerStyle: {
                backgroundColor: theme.colors.primary,
                elevation: 4,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: {width: 0, height: 2},
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            })}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{
                title: 'Dashboard',
                headerTitle: 'Wholesale Vegetable Business',
              }}
            />
            <Tab.Screen 
              name="AddSale" 
              component={AddSaleScreen}
              options={{
                title: 'Record Sale',
                headerTitle: 'Record Vegetable Sale',
              }}
            />
            <Tab.Screen 
              name="History" 
              component={HistoryScreen}
              options={{
                title: 'History',
                headerTitle: 'Business History',
              }}
            />
          </Tab.Navigator>
          
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
