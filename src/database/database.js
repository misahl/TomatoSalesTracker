import SQLite from 'react-native-sqlite-storage';

// Enable promises and debugging
SQLite.enablePromise(true);
SQLite.DEBUG(true);

const database_name = 'VegetableWholesale.db';
const database_version = '1.0';
const database_displayname = 'Vegetable Wholesale Database';
const database_size = 200000;

class DatabaseHelper {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async initDB() {
    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      console.log('Database OPENED');
      await this.createTables();
      return this.db;
    } catch (error) {
      console.log('Database initialization error: ', error);
      throw error;
    }
  }

  // Close database connection
  async closeDatabase() {
    if (this.db) {
      try {
        await this.db.close();
        console.log('Database CLOSED');
      } catch (error) {
        console.log('Database close error: ', error);
      }
    }
  }

  // Migrate legacy tables safely
  async migrateLegacyTables() {
    try {
      // Check if old Sales table exists with old structure
      const checkTableSQL = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='Sales';
      `;
      
      const result = await this.db.executeSql(checkTableSQL);
      
      if (result[0].rows.length > 0) {
        // Check if table has new columns
        const checkColumnsSQL = `PRAGMA table_info(Sales);`;
        const columnsResult = await this.db.executeSql(checkColumnsSQL);
        
        let hasNewColumns = false;
        for (let i = 0; i < columnsResult[0].rows.length; i++) {
          const column = columnsResult[0].rows.item(i);
          if (column.name === 'vegetable_type' || column.name === 'quantity_sold') {
            hasNewColumns = true;
            break;
          }
        }
        
        if (!hasNewColumns) {
          // Backup old data
          console.log('Migrating legacy Sales table...');
          
          // Add new columns to existing table
          const addColumnsSQL = [
            `ALTER TABLE Sales ADD COLUMN vegetable_type TEXT DEFAULT 'Tomatoes';`,
            `ALTER TABLE Sales ADD COLUMN quantity_sold INTEGER;`,
            `ALTER TABLE Sales ADD COLUMN unit_type TEXT DEFAULT 'trays';`,
            `ALTER TABLE Sales ADD COLUMN rate_per_unit REAL;`,
            `ALTER TABLE Sales ADD COLUMN payment_status TEXT DEFAULT 'paid';`,
            `ALTER TABLE Sales ADD COLUMN due_amount REAL DEFAULT 0;`,
            `ALTER TABLE Sales ADD COLUMN truck_arrival_time TEXT;`,
            `ALTER TABLE Sales ADD COLUMN distribution_time TEXT;`,
            `ALTER TABLE Sales ADD COLUMN notes TEXT;`
          ];
          
          for (const sql of addColumnsSQL) {
            try {
              await this.db.executeSql(sql);
            } catch (error) {
              // Column might already exist, continue
              console.log('Column addition error (might already exist):', error);
            }
          }
          
          // Update legacy data
          const updateLegacyDataSQL = `
            UPDATE Sales 
            SET quantity_sold = trays_sold,
                rate_per_unit = rate_per_tray
            WHERE quantity_sold IS NULL OR rate_per_unit IS NULL;
          `;
          
          await this.db.executeSql(updateLegacyDataSQL);
          console.log('Legacy data migration completed');
        }
      }
    } catch (error) {
      console.log('Migration error (this is usually safe):', error);
    }
  }

  // Create enhanced tables for wholesale vegetable business
  async createTables() {
    try {
      // First, handle legacy table migration
      await this.migrateLegacyTables();
      
      // Enhanced Sales table with new features
      const createSalesTable = `
        CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vendor_name TEXT NOT NULL,
          vegetable_type TEXT DEFAULT 'Tomatoes',
          quantity_sold INTEGER NOT NULL,
          unit_type TEXT NOT NULL DEFAULT 'trays',
          rate_per_unit REAL NOT NULL,
          total_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'paid',
          due_amount REAL DEFAULT 0,
          sale_date TEXT NOT NULL,
          sale_time TEXT NOT NULL,
          truck_arrival_time TEXT,
          distribution_time TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          -- Legacy compatibility columns
          trays_sold INTEGER,
          rate_per_tray REAL
        );
      `;

      await this.db.executeSql(createSalesTable);
      console.log('Enhanced Sales table created successfully');

      // Inventory table for daily stock management
      const createInventoryTable = `
        CREATE TABLE IF NOT EXISTS Inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vegetable_type TEXT NOT NULL,
          initial_stock INTEGER NOT NULL,
          current_stock INTEGER NOT NULL,
          unit_type TEXT NOT NULL DEFAULT 'trays',
          market_rate REAL NOT NULL,
          carry_over_from_date TEXT,
          date TEXT NOT NULL,
          truck_arrival_time TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(vegetable_type, date)
        );
      `;

      await this.db.executeSql(createInventoryTable);
      console.log('Inventory table created successfully');

      // Pending Payments table
      const createPendingPaymentsTable = `
        CREATE TABLE IF NOT EXISTS PendingPayments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vendor_name TEXT NOT NULL,
          total_due_amount REAL NOT NULL,
          last_transaction_date TEXT NOT NULL,
          payment_due_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.db.executeSql(createPendingPaymentsTable);
      console.log('PendingPayments table created successfully');

      // Settings table for configuration
      const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS Settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.db.executeSql(createSettingsTable);
      console.log('Settings table created successfully');

      // Vegetable Types table for predefined vegetables
      const createVegetableTypesTable = `
        CREATE TABLE IF NOT EXISTS VegetableTypes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          default_unit TEXT NOT NULL DEFAULT 'trays',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.db.executeSql(createVegetableTypesTable);
      console.log('VegetableTypes table created successfully');

      // Insert default vegetable types
      await this.insertDefaultVegetableTypes();
      
      // Insert default settings
      await this.insertDefaultSettings();
    } catch (error) {
      console.log('Create table error: ', error);
      throw error;
    }
  }

  // Insert default vegetable types
  async insertDefaultVegetableTypes() {
    const vegetables = [
      'Tomatoes', 'Onions', 'Potatoes', 'Carrots', 'Cabbage', 
      'Cauliflower', 'Bell Peppers', 'Green Beans', 'Brinjal', 
      'Okra', 'Cucumber', 'Spinach', 'Coriander', 'Mint'
    ];

    for (const vegetable of vegetables) {
      try {
        const insertSQL = `INSERT OR IGNORE INTO VegetableTypes (name) VALUES (?);`;
        await this.db.executeSql(insertSQL, [vegetable]);
      } catch (error) {
        console.log(`Error inserting ${vegetable}:`, error);
      }
    }
  }

  // Insert default settings
  async insertDefaultSettings() {
    const settings = [
      ['daily_target_trays', '50'],
      ['business_start_time', '05:00'],
      ['market_close_time', '12:00'],
      ['default_payment_due_days', '7']
    ];

    for (const [key, value] of settings) {
      try {
        const insertSQL = `INSERT OR IGNORE INTO Settings (key, value) VALUES (?, ?);`;
        await this.db.executeSql(insertSQL, [key, value]);
      } catch (error) {
        console.log(`Error inserting setting ${key}:`, error);
      }
    }
  }

  // Enhanced add sale method with backward compatibility
  async addSale(saleDataOrVendorName, traysSold, ratePerTray, paymentMethod) {
    try {
      // Support both old and new function signatures
      let saleData;
      
      if (typeof saleDataOrVendorName === 'object') {
        // New enhanced format
        saleData = saleDataOrVendorName;
      } else {
        // Legacy format - convert to new format
        saleData = {
          vendorName: saleDataOrVendorName,
          vegetableType: 'Tomatoes',
          quantitySold: traysSold,
          unitType: 'trays',
          ratePerUnit: ratePerTray,
          paymentMethod: paymentMethod,
          paymentStatus: 'paid',
          truckArrivalTime: null,
          distributionTime: null,
          notes: ''
        };
      }

      const {
        vendorName,
        vegetableType = 'Tomatoes',
        quantitySold,
        unitType = 'trays',
        ratePerUnit,
        paymentMethod: payMethod,
        paymentStatus = 'paid',
        truckArrivalTime,
        distributionTime,
        notes = ''
      } = saleData;

      const totalAmount = quantitySold * ratePerUnit;
      const dueAmount = paymentStatus === 'pending' ? totalAmount : 0;
      const currentDate = new Date();
      const saleDate = currentDate.toISOString().split('T')[0];
      const saleTime = currentDate.toTimeString().split(' ')[0];

      const insertSQL = `
        INSERT INTO Sales (
          vendor_name, vegetable_type, quantity_sold, unit_type, 
          rate_per_unit, total_amount, payment_method, payment_status, 
          due_amount, sale_date, sale_time, truck_arrival_time, 
          distribution_time, notes, trays_sold, rate_per_tray
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      const result = await this.db.executeSql(insertSQL, [
        vendorName, vegetableType, quantitySold, unitType,
        ratePerUnit, totalAmount, payMethod, paymentStatus,
        dueAmount, saleDate, saleTime, truckArrivalTime,
        distributionTime, notes, quantitySold, ratePerUnit // Legacy compatibility
      ]);

      // Update inventory (with error handling)
      try {
        await this.updateInventoryAfterSale(vegetableType, quantitySold, saleDate);
      } catch (inventoryError) {
        console.log('Inventory update error (non-critical):', inventoryError);
      }

      // Handle pending payments (with error handling)
      try {
        if (paymentStatus === 'pending') {
          await this.addOrUpdatePendingPayment(vendorName, totalAmount, saleDate);
        }
      } catch (paymentError) {
        console.log('Pending payment update error (non-critical):', paymentError);
      }

      console.log('Sale added successfully');
      return result[0].insertId;
    } catch (error) {
      console.log('Add sale error: ', error);
      throw error;
    }
  }

  // Inventory Management Methods
  async addDailyInventory(inventoryData) {
    try {
      const {
        vegetableType,
        initialStock,
        unitType = 'trays',
        marketRate,
        truckArrivalTime,
        carryOverFromDate = null
      } = inventoryData;

      const date = new Date().toISOString().split('T')[0];

      const insertSQL = `
        INSERT OR REPLACE INTO Inventory (
          vegetable_type, initial_stock, current_stock, unit_type,
          market_rate, carry_over_from_date, date, truck_arrival_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;

      await this.db.executeSql(insertSQL, [
        vegetableType, initialStock, initialStock, unitType,
        marketRate, carryOverFromDate, date, truckArrivalTime
      ]);

      console.log('Daily inventory added successfully');
    } catch (error) {
      console.log('Add daily inventory error: ', error);
      throw error;
    }
  }

  async updateInventoryAfterSale(vegetableType, quantitySold, date) {
    try {
      const updateSQL = `
        UPDATE Inventory 
        SET current_stock = current_stock - ?
        WHERE vegetable_type = ? AND date = ?;
      `;

      await this.db.executeSql(updateSQL, [quantitySold, vegetableType, date]);
    } catch (error) {
      console.log('Update inventory after sale error: ', error);
    }
  }

  async getInventoryByDate(date) {
    try {
      const selectSQL = `
        SELECT * FROM Inventory 
        WHERE date = ?
        ORDER BY vegetable_type;
      `;

      const result = await this.db.executeSql(selectSQL, [date]);
      const inventory = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        inventory.push(result[0].rows.item(i));
      }

      return inventory;
    } catch (error) {
      console.log('Get inventory by date error: ', error);
      return [];
    }
  }

  // Pending Payments Methods
  async addOrUpdatePendingPayment(vendorName, amount, transactionDate) {
    try {
      const selectSQL = `SELECT * FROM PendingPayments WHERE vendor_name = ?;`;
      const result = await this.db.executeSql(selectSQL, [vendorName]);

      if (result[0].rows.length > 0) {
        // Update existing pending payment
        const currentDue = result[0].rows.item(0).total_due_amount;
        const updateSQL = `
          UPDATE PendingPayments 
          SET total_due_amount = ?, last_transaction_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE vendor_name = ?;
        `;
        await this.db.executeSql(updateSQL, [currentDue + amount, transactionDate, vendorName]);
      } else {
        // Add new pending payment
        const insertSQL = `
          INSERT INTO PendingPayments (vendor_name, total_due_amount, last_transaction_date)
          VALUES (?, ?, ?);
        `;
        await this.db.executeSql(insertSQL, [vendorName, amount, transactionDate]);
      }
    } catch (error) {
      console.log('Add/Update pending payment error: ', error);
    }
  }

  async getAllPendingPayments() {
    try {
      const selectSQL = `
        SELECT * FROM PendingPayments 
        WHERE total_due_amount > 0
        ORDER BY last_transaction_date DESC;
      `;

      const result = await this.db.executeSql(selectSQL);
      const payments = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        payments.push(result[0].rows.item(i));
      }

      return payments;
    } catch (error) {
      console.log('Get pending payments error: ', error);
      return [];
    }
  }

  async markPaymentReceived(vendorName, amountPaid) {
    try {
      const selectSQL = `SELECT total_due_amount FROM PendingPayments WHERE vendor_name = ?;`;
      const result = await this.db.executeSql(selectSQL, [vendorName]);

      if (result[0].rows.length > 0) {
        const currentDue = result[0].rows.item(0).total_due_amount;
        const newDue = Math.max(0, currentDue - amountPaid);

        const updateSQL = `
          UPDATE PendingPayments 
          SET total_due_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE vendor_name = ?;
        `;
        await this.db.executeSql(updateSQL, [newDue, vendorName]);
      }
    } catch (error) {
      console.log('Mark payment received error: ', error);
    }
  }

  // Get today's enhanced summary with backward compatibility
  async getTodaysSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try new format first, fall back to legacy format
      let summarySQL = `
        SELECT 
          COALESCE(SUM(CASE WHEN quantity_sold IS NOT NULL THEN quantity_sold ELSE trays_sold END), 0) as total_quantity_sold,
          COALESCE(SUM(total_amount), 0) as total_money_earned,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE total_amount END), 0) as paid_amount,
          COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN due_amount ELSE 0 END), 0) as pending_amount,
          COUNT(*) as total_transactions
        FROM Sales 
        WHERE sale_date = ?;
      `;

      const result = await this.db.executeSql(summarySQL, [today]);
      const summary = result[0].rows.item(0);

      // Get inventory summary for today (with error handling)
      let inventorySummary = [];
      try {
        inventorySummary = await this.getTodaysInventorySummary(today);
      } catch (inventoryError) {
        console.log('Inventory summary error (non-critical):', inventoryError);
      }

      return {
        totalQuantitySold: summary.total_quantity_sold || 0,
        totalMoneyEarned: summary.total_money_earned || 0,
        paidAmount: summary.paid_amount || summary.total_money_earned || 0,
        pendingAmount: summary.pending_amount || 0,
        totalTransactions: summary.total_transactions || 0,
        inventory: inventorySummary,
        
        // Legacy compatibility
        totalTraysSold: summary.total_quantity_sold || 0,
        traysLeft: Math.max(0, 50 - (summary.total_quantity_sold || 0)),
        dailyTarget: 50
      };
    } catch (error) {
      console.log('Get today summary error: ', error);
      // Return safe defaults
      return {
        totalQuantitySold: 0,
        totalMoneyEarned: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalTransactions: 0,
        inventory: [],
        totalTraysSold: 0,
        traysLeft: 50,
        dailyTarget: 50
      };
    }
  }

  async getTodaysInventorySummary(date) {
    try {
      const summarySQL = `
        SELECT 
          vegetable_type,
          initial_stock,
          current_stock,
          (initial_stock - current_stock) as sold_quantity,
          unit_type,
          market_rate
        FROM Inventory 
        WHERE date = ?;
      `;

      const result = await this.db.executeSql(summarySQL, [date]);
      const inventory = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        inventory.push(result[0].rows.item(i));
      }

      return inventory;
    } catch (error) {
      console.log('Get today inventory summary error: ', error);
      return [];
    }
  }

  // Get all sales for history
  async getAllSales(limit = 100) {
    try {
      const selectSQL = `
        SELECT * FROM Sales 
        ORDER BY sale_date DESC, sale_time DESC 
        LIMIT ?;
      `;

      const result = await this.db.executeSql(selectSQL, [limit]);
      const sales = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        sales.push(result[0].rows.item(i));
      }

      return sales;
    } catch (error) {
      console.log('Get all sales error: ', error);
      throw error;
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate) {
    try {
      const selectSQL = `
        SELECT * FROM Sales 
        WHERE sale_date BETWEEN ? AND ? 
        ORDER BY sale_date DESC, sale_time DESC;
      `;

      const result = await this.db.executeSql(selectSQL, [startDate, endDate]);
      const sales = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        sales.push(result[0].rows.item(i));
      }

      return sales;
    } catch (error) {
      console.log('Get sales by date range error: ', error);
      throw error;
    }
  }

  // Get total summary (all time)
  async getTotalSummary() {
    try {
      const summarySQL = `
        SELECT 
          COALESCE(SUM(trays_sold), 0) as total_trays_sold,
          COALESCE(SUM(total_amount), 0) as total_money_earned,
          COUNT(*) as total_transactions
        FROM Sales;
      `;

      const result = await this.db.executeSql(summarySQL);
      return result[0].rows.item(0);
    } catch (error) {
      console.log('Get total summary error: ', error);
      throw error;
    }
  }

  // Vegetable Types Methods
  async getAllVegetableTypes() {
    try {
      const selectSQL = `
        SELECT * FROM VegetableTypes 
        WHERE is_active = 1 
        ORDER BY name;
      `;

      const result = await this.db.executeSql(selectSQL);
      const vegetables = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        vegetables.push(result[0].rows.item(i));
      }

      return vegetables;
    } catch (error) {
      console.log('Get vegetable types error: ', error);
      return [];
    }
  }

  async addVegetableType(name, defaultUnit = 'trays') {
    try {
      const insertSQL = `
        INSERT INTO VegetableTypes (name, default_unit) 
        VALUES (?, ?);
      `;

      await this.db.executeSql(insertSQL, [name, defaultUnit]);
      console.log('Vegetable type added successfully');
    } catch (error) {
      console.log('Add vegetable type error: ', error);
      throw error;
    }
  }

  // Enhanced Settings Methods
  async setSetting(key, value) {
    try {
      const upsertSQL = `
        INSERT OR REPLACE INTO Settings (key, value) 
        VALUES (?, ?);
      `;

      await this.db.executeSql(upsertSQL, [key, value.toString()]);
      console.log(`Setting ${key} updated successfully`);
    } catch (error) {
      console.log('Set setting error: ', error);
      throw error;
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const selectSQL = `
        SELECT value FROM Settings WHERE key = ?;
      `;

      const result = await this.db.executeSql(selectSQL, [key]);
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0).value;
      }
      return defaultValue;
    } catch (error) {
      console.log('Get setting error: ', error);
      return defaultValue;
    }
  }

  // Legacy methods for compatibility
  async setDailyTarget(target) {
    return this.setSetting('daily_target_trays', target);
  }

  async getDailyTarget() {
    const target = await this.getSetting('daily_target_trays', '50');
    return parseInt(target);
  }

  // Enhanced sales retrieval methods
  async getSalesByDateRangeAndFilters(startDate, endDate, filters = {}) {
    try {
      let whereConditions = ['sale_date BETWEEN ? AND ?'];
      let params = [startDate, endDate];

      if (filters.vegetableType) {
        whereConditions.push('vegetable_type = ?');
        params.push(filters.vegetableType);
      }

      if (filters.paymentStatus) {
        whereConditions.push('payment_status = ?');
        params.push(filters.paymentStatus);
      }

      if (filters.vendorName) {
        whereConditions.push('vendor_name LIKE ?');
        params.push(`%${filters.vendorName}%`);
      }

      const selectSQL = `
        SELECT * FROM Sales 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY sale_date DESC, sale_time DESC;
      `;

      const result = await this.db.executeSql(selectSQL, params);
      const sales = [];

      for (let i = 0; i < result[0].rows.length; i++) {
        sales.push(result[0].rows.item(i));
      }

      return sales;
    } catch (error) {
      console.log('Get filtered sales error: ', error);
      return [];
    }
  }

  // Carry-over inventory method
  async createCarryOverInventory(fromDate, toDate) {
    try {
      const selectSQL = `
        SELECT vegetable_type, current_stock, unit_type, market_rate
        FROM Inventory 
        WHERE date = ? AND current_stock > 0;
      `;

      const result = await this.db.executeSql(selectSQL, [fromDate]);

      for (let i = 0; i < result[0].rows.length; i++) {
        const item = result[0].rows.item(i);
        
        await this.addDailyInventory({
          vegetableType: item.vegetable_type,
          initialStock: item.current_stock,
          unitType: item.unit_type,
          marketRate: item.market_rate,
          carryOverFromDate: fromDate
        });
      }

      console.log('Carry-over inventory created successfully');
    } catch (error) {
      console.log('Create carry-over inventory error: ', error);
      throw error;
    }
  }

  // Delete a sale with inventory and payment adjustments
  async deleteSale(saleId) {
    try {
      // Get sale details first
      const getSaleSQL = `SELECT * FROM Sales WHERE id = ?;`;
      const saleResult = await this.db.executeSql(getSaleSQL, [saleId]);
      
      if (saleResult[0].rows.length === 0) {
        throw new Error('Sale not found');
      }
      
      const sale = saleResult[0].rows.item(0);
      
      // Delete the sale
      const deleteSQL = `DELETE FROM Sales WHERE id = ?;`;
      const result = await this.db.executeSql(deleteSQL, [saleId]);
      
      // Adjust inventory if available
      try {
        const vegetableType = sale.vegetable_type || 'Tomatoes';
        const quantity = sale.quantity_sold || sale.trays_sold || 0;
        const saleDate = sale.sale_date;
        
        if (vegetableType && quantity && saleDate) {
          // Add quantity back to inventory
          const updateInventorySQL = `
            UPDATE Inventory 
            SET current_stock = current_stock + ?
            WHERE vegetable_type = ? AND date = ?;
          `;
          await this.db.executeSql(updateInventorySQL, [quantity, vegetableType, saleDate]);
        }
      } catch (inventoryError) {
        console.log('Inventory adjustment error (non-critical):', inventoryError);
      }
      
      // Adjust pending payments if necessary
      try {
        if (sale.payment_status === 'pending' && sale.due_amount > 0) {
          const vendorName = sale.vendor_name;
          const dueAmount = sale.due_amount || sale.total_amount;
          
          // Reduce pending payment
          const adjustPaymentSQL = `
            UPDATE PendingPayments 
            SET total_due_amount = GREATEST(0, total_due_amount - ?),
                updated_at = CURRENT_TIMESTAMP
            WHERE vendor_name = ?;
          `;
          await this.db.executeSql(adjustPaymentSQL, [dueAmount, vendorName]);
        }
      } catch (paymentError) {
        console.log('Payment adjustment error (non-critical):', paymentError);
      }
      
      console.log('Sale deleted successfully');
      return result[0].rowsAffected > 0;
    } catch (error) {
      console.log('Delete sale error: ', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const databaseHelper = new DatabaseHelper();
export default databaseHelper;
