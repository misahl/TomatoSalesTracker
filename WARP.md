# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Project Setup
```bash
# Install dependencies
npm install

# For iOS development (macOS only)
cd ios && pod install && cd ..
```

### Running the Application
```bash
# Start Metro bundler (always run this first)
npm start

# Run on Android (requires Android emulator or device)
npm run android

# Run on iOS (macOS only, requires iOS Simulator)
npm run ios
```

### Development Tools
```bash
# Run linting
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run single test file
npm test -- __tests__/App.test.tsx
```

### Database Management
The app uses SQLite for local storage. Database operations are handled through the DatabaseHelper singleton in `src/database/database.js`.

```javascript
// Access database helper in any screen
import databaseHelper from '../database/database';

// Initialize database (usually done in screens)
await databaseHelper.initDB();

// Common database operations
await databaseHelper.addSale(vendorName, traysSold, ratePerTray, paymentMethod);
await databaseHelper.getTodaysSummary();
await databaseHelper.getAllSales();
```

## Architecture Overview

### Application Structure
This is a React Native 0.81.1 app with a three-tab bottom navigation structure:

1. **Home/Dashboard** - Daily sales summary and progress tracking
2. **Add Sale** - Form for recording new tomato tray sales
3. **History** - Sales history with filtering and search

### Core Technologies
- **UI Framework**: React Native Paper (Material Design)
- **Navigation**: React Navigation 6.x with bottom tabs
- **Database**: SQLite via react-native-sqlite-storage
- **State Management**: React Hooks (useState, useEffect)
- **Platform Support**: Android & iOS

### Key Components

#### Database Layer (`src/database/database.js`)
- Singleton pattern database helper class
- Two main tables: `Sales` and `Settings`
- Handles all CRUD operations for sales data
- Manages daily targets and application settings

#### Screen Components
- **HomeScreen**: Dashboard with progress visualization, key metrics, and summary statistics
- **AddSaleScreen**: Form with validation, quick-select options, and confirmation dialogs  
- **HistoryScreen**: Sales list with search, filtering, and detailed views

### Data Flow
1. Database is initialized on first screen access
2. Each screen loads data using `useFocusEffect` for real-time updates
3. Sales data flows: AddSale → Database → HomeScreen summary updates
4. All screens use pull-to-refresh for manual data updates

### Business Logic
- **Daily Target System**: Default 50 trays, configurable via database
- **Real-time Calculations**: Progress percentages, totals, averages
- **Sales Validation**: Input validation for vendor names, tray quantities, and rates
- **Payment Methods**: Cash, Credit, UPI support

### Customization Points
- Daily targets: Modify via `databaseHelper.setDailyTarget()`
- Common vendors: Edit `commonVendors` array in AddSaleScreen.js
- Rate presets: Modify `commonRates` array in AddSaleScreen.js
- Theme colors: Update theme object in App.tsx

### Testing Setup
- Jest configuration for React Native
- Basic smoke test in `__tests__/App.test.tsx`
- ESLint with React Native rules
- Prettier formatting

### Platform-Specific Notes
- Icons use emoji fallbacks (no vector icons configured)
- KeyboardAvoidingView handles iOS keyboard properly
- StatusBar styling matches app theme
- Supports both Android and iOS navigation patterns

### Development Workflow
1. Always start Metro bundler first (`npm start`)
2. Use `useFocusEffect` for data loading in screens that need real-time updates
3. Database operations should include proper error handling
4. Form validation should be client-side with user-friendly error messages
5. Use confirmation dialogs for destructive operations

### Common Patterns
- Singleton database helper accessed via import
- Screen-level state management with useState
- Progress tracking with visual feedback (progress bars, color coding)
- Pull-to-refresh on data-heavy screens
- Form validation with real-time error clearing
