# 🍅 Tomato Sales Tracker

A React Native mobile application designed for wholesale tomato businesses to efficiently track daily sales, manage inventory, and monitor financial performance. Perfect for vendors selling around 50 trays daily with transactions completed by 10 AM.

## 📱 Features

### 🏠 Dashboard (Home Screen)
- Real-time Overview: View today's total trays sold, remaining trays, and total earnings
- Progress Tracking: Visual progress bar showing daily target achievement
- Smart Metrics: Average per transaction, target achievement percentage
- Greeting System: Dynamic greetings based on time of day
- Quick Actions: Fast navigation to add sales or view history

### ➕ Add Sale Screen
- Easy Form Input: Simple form for vendor name, trays sold, rate per tray
- Payment Methods: Support for Cash, Credit, and UPI transactions
- Quick Select Options: Pre-defined vendor names and common rates for faster entry
- Real-time Calculation: Automatic total amount calculation
- Form Validation: Comprehensive input validation with helpful error messages
- Confirmation Dialog: Review details before saving

### 📋 Sales History
- Complete Transaction Log: View all sales with detailed information
- Advanced Filtering: Filter by date (today, yesterday, this week) or payment method
- Search Functionality: Search sales by vendor name
- Detailed View: Tap any sale to see complete transaction details
- Summary Statistics: Real-time totals for filtered results
- Pull-to-Refresh: Easy data refresh with pull gesture

### 💾 Data Management
- Offline Storage: All data stored locally using SQLite
- No Internet Required: Works completely offline
- Automatic Backups: Data persists between app sessions
- Fast Performance: Optimized database queries for quick response

## 🛠️ Technical Stack

- Frontend: React Native 0.81.1
- Navigation: React Navigation 6.x (Bottom Tabs)
- UI Components: React Native Paper (Material Design)
- Database: SQLite (react-native-sqlite-storage)
- State Management: React Hooks (useState, useEffect)
- Platform Support: Android & iOS

## 📦 Installation Instructions

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/TomatoSalesTracker.git
cd TomatoSalesTracker
```

### Step 2: Install Dependencies
```bash
# Install npm packages
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

### Step 3: Start Metro Bundler
```bash
npx react-native start
```

### Step 4: Run the Application

#### For Android:
```bash
# Make sure you have an Android emulator running or device connected
npx react-native run-android
```

#### For iOS (macOS only):
```bash
# Make sure you have iOS Simulator running
npx react-native run-ios
```

## 📋 Project Setup Commands

Here are the complete setup commands used to create this project:

### 1. Initialize React Native Project
```bash
npx @react-native-community/cli init TomatoSalesTracker
cd TomatoSalesTracker
```

### 2. Install Required Dependencies
```bash
# Navigation dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Database
npm install react-native-sqlite-storage

# UI Components
npm install react-native-paper react-native-vector-icons
```

### 3. Project Structure
```
TomatoSalesTracker/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── AddSaleScreen.js
│   │   └── HistoryScreen.js
│   ├── database/
│   │   └── database.js
│   ├── components/
│   ├── utils/
│   └── constants/
├── App.tsx
├── package.json
└── README.md
```

## 🎯 Usage Guide

### Adding Your First Sale
1. Open the app and tap on "Add Sale" tab
2. Enter vendor name (or select from quick options)
3. Input number of trays sold
4. Set rate per tray (or use quick rate buttons)
5. Select payment method (Cash/Credit/UPI)
6. Review details and confirm

### Monitoring Daily Progress
1. Go to Dashboard/Home screen
2. View progress bar showing target achievement
3. Check key metrics: trays sold, earnings, transactions
4. Use quick actions for common tasks

### Reviewing Sales History
1. Navigate to History tab
2. Use search to find specific vendors
3. Apply filters for date range or payment method
4. Tap any sale for detailed view
5. Check summary statistics at bottom

## 🔧 Customization

### Setting Daily Target
The default daily target is 50 trays. You can modify this in the database:
```javascript
// In src/database/database.js
await databaseHelper.setDailyTarget(75); // Set to 75 trays
```

### Adding Custom Vendor Names
Edit the common vendors list in `src/screens/AddSaleScreen.js`:
```javascript
const commonVendors = [
  'Your Custom Vendor 1',
  'Your Custom Vendor 2',
  // Add more vendors here
];
```

### Modifying Rate Options
Update common rates in `src/screens/AddSaleScreen.js`:
```javascript
const commonRates = [20, 25, 30, 35, 40, 45]; // Your preferred rates
```

## 🐛 Troubleshooting

### Common Issues

#### Database Issues
- Problem: App crashes on first run
- Solution: Ensure SQLite dependencies are properly installed
- Command: `npm install react-native-sqlite-storage --save`

#### Navigation Issues  
- Problem: Navigation not working
- Solution: Check if React Navigation dependencies are installed
- Command: `npm install @react-navigation/native @react-navigation/bottom-tabs`

#### UI Issues
- Problem: Material Design components not rendering
- Solution: Verify React Native Paper installation
- Command: `npm install react-native-paper`

### Clearing Data
To clear all sales data (for testing):
```javascript
// Add this function to database.js and call it
async clearAllSales() {
  await this.db.executeSql('DELETE FROM Sales');
  console.log('All sales cleared');
}
```

## 📸 Screenshots

### Dashboard View
*Screenshot showing daily progress, key metrics, and summary cards*
- Progress bar with target achievement
- Total trays sold and earnings display
- Today's summary with transaction count

### Add Sale Form
*Screenshot of the sale entry form*
- Vendor name input with quick select chips
- Trays and rate input fields
- Payment method selection
- Total calculation display

### Sales History
*Screenshot of the history screen with filtering options*
- Sales list with vendor names and amounts
- Search bar and filter dropdown
- Summary statistics at bottom
- Sale detail modal view

### Mobile Responsive Design
*Screenshots showing app performance on different screen sizes*
- Optimized for both phones and tablets
- Consistent Material Design across all screens
- Smooth animations and transitions

## 🤝 Contributing

We welcome contributions to improve the Tomato Sales Tracker! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Development Guidelines
- Follow React Native best practices
- Use TypeScript for new components
- Add proper error handling
- Include unit tests for new features
- Update documentation for any changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- React Native Team for the amazing framework
- React Navigation for seamless navigation
- React Native Paper for beautiful Material Design components
- SQLite for reliable local storage
- Community Contributors for testing and feedback

## 📞 Support

If you encounter any issues or have questions:

1. Check the Troubleshooting Section above
2. Search existing Issues in the GitHub repository
3. Create a New Issue with detailed description
4. Join our Community for discussions and help

## 🚀 Future Enhancements

### Planned Features
- [ ] Export Functionality: Export sales data to CSV/PDF
- [ ] Backup & Restore: Cloud backup integration
- [ ] Advanced Analytics: Charts and graphs for sales trends
- [ ] Multi-language Support: Support for regional languages
- [ ] Dark Mode: Alternative theme option
- [ ] Inventory Management: Track remaining stock
- [ ] Vendor Management: Detailed vendor profiles
- [ ] Notifications: Daily target reminders

### Technical Improvements
- [ ] TypeScript Migration: Full TypeScript support
- [ ] Unit Testing: Comprehensive test coverage
- [ ] Performance Optimization: Further speed improvements
- [ ] Accessibility: Better accessibility features
- [ ] Offline Sync: Sync data when online

---

Made with ❤️ for wholesale tomato vendors

Helping businesses track sales efficiently, one tray at a time!
