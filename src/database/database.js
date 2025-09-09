import SQLite from 'react-native-sqlite-storage';

// Enable promises and debugging
SQLite.enablePromise(true);
SQLite.DEBUG(true);

const database_name = 'TomatoSales.db';
const database_version = '1.0';
const database_displayname = 'Tomato Sales Database';
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

  // Create sales table
  async createTables() {
    try {
      const createSalesTable = `
        CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vendor_name TEXT NOT NULL,
          trays_sold INTEGER NOT NULL,
          rate_per_tray REAL NOT NULL,
          total_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          sale_date TEXT NOT NULL,
          sale_time TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await this.db.executeSql(createSalesTable);
      console.log('Sales table created successfully');

      // Create settings table for daily targets
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

      // Insert default daily target if not exists
      await this.setDailyTarget(50);
    } catch (error) {
      console.log('Create table error: ', error);
      throw error;
    }
  }

  // Add a new sale
  async addSale(vendorName, traysSold, ratePerTray, paymentMethod) {
    try {
      const totalAmount = traysSold * ratePerTray;
      const currentDate = new Date();
      const saleDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const saleTime = currentDate.toTimeString().split(' ')[0]; // HH:MM:SS

      const insertSQL = `
        INSERT INTO Sales (vendor_name, trays_sold, rate_per_tray, total_amount, payment_method, sale_date, sale_time)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `;

      const result = await this.db.executeSql(insertSQL, [
        vendorName,
        traysSold,
        ratePerTray,
        totalAmount,
        paymentMethod,
        saleDate,
        saleTime,
      ]);

      console.log('Sale added successfully');
      return result[0].insertId;
    } catch (error) {
      console.log('Add sale error: ', error);
      throw error;
    }
  }

  // Get today's sales summary
  async getTodaysSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const summarySQL = `
        SELECT 
          COALESCE(SUM(trays_sold), 0) as total_trays_sold,
          COALESCE(SUM(total_amount), 0) as total_money_earned,
          COUNT(*) as total_transactions
        FROM Sales 
        WHERE sale_date = ?;
      `;

      const result = await this.db.executeSql(summarySQL, [today]);
      const summary = result[0].rows.item(0);

      // Get daily target
      const target = await this.getDailyTarget();
      const traysLeft = Math.max(0, target - summary.total_trays_sold);

      return {
        totalTraysSold: summary.total_trays_sold,
        totalMoneyEarned: summary.total_money_earned,
        traysLeft: traysLeft,
        totalTransactions: summary.total_transactions,
        dailyTarget: target,
      };
    } catch (error) {
      console.log('Get today summary error: ', error);
      throw error;
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

  // Set daily target
  async setDailyTarget(target) {
    try {
      const upsertSQL = `
        INSERT OR REPLACE INTO Settings (key, value) 
        VALUES ('daily_target', ?);
      `;

      await this.db.executeSql(upsertSQL, [target.toString()]);
      console.log('Daily target set successfully');
    } catch (error) {
      console.log('Set daily target error: ', error);
      throw error;
    }
  }

  // Get daily target
  async getDailyTarget() {
    try {
      const selectSQL = `
        SELECT value FROM Settings WHERE key = 'daily_target';
      `;

      const result = await this.db.executeSql(selectSQL);
      if (result[0].rows.length > 0) {
        return parseInt(result[0].rows.item(0).value);
      }
      return 50; // Default target
    } catch (error) {
      console.log('Get daily target error: ', error);
      return 50; // Default target
    }
  }

  // Delete a sale (for admin purposes)
  async deleteSale(saleId) {
    try {
      const deleteSQL = `DELETE FROM Sales WHERE id = ?;`;
      const result = await this.db.executeSql(deleteSQL, [saleId]);
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
