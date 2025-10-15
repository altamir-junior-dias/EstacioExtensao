import * as SQLite from 'expo-sqlite';
import { format, parseISO } from 'date-fns';

const DATABASE_NAME = 'ClientSync.db';

export class SQLiteDatabase {
  constructor() {
    this.db = SQLite.openDatabase(DATABASE_NAME);
    this.init();
  }

  init() {
    this.db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          extraction_date TEXT,
          last_sync TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS servicos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT NOT NULL,
          service_date TEXT NOT NULL,
          service_type TEXT NOT NULL,
          description TEXT,
          status TEXT,
          extraction_date TEXT,
          last_sync TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (client_id) REFERENCES clientes (client_id)
        );`
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sync_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          last_sync_date TEXT,
          sync_status TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );`
      );
    });
  }

  executeSql(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  async saveOrUpdateClients(clients) {
    const now = new Date().toISOString();
    
    for (const client of clients) {
      await this.executeSql(
        `INSERT OR REPLACE INTO clientes 
        (client_id, name, email, phone, extraction_date, last_sync) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          client.client_id,
          client.name,
          client.email || null,
          client.phone || null,
          client.extraction_date,
          now
        ]
      );
    }
  }

  async saveOrUpdateServices(services) {
    const now = new Date().toISOString();
    
    for (const service of services) {
      await this.executeSql(
        `INSERT OR REPLACE INTO servicos 
        (client_id, service_date, service_type, description, status, extraction_date, last_sync) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          service.client_id,
          service.service_date,
          service.service_type,
          service.description || '',
          service.status || 'Desconhecido',
          service.extraction_date,
          now
        ]
      );
    }
  }

  async getClientsWithReturnDates() {
    const sql = `
      SELECT 
        c.client_id,
        c.name,
        c.email,
        c.phone,
        MAX(s.service_date) as last_service_date,
        date(MAX(s.service_date), '+30 days') as expected_return_date
      FROM clientes c
      LEFT JOIN servicos s ON c.client_id = s.client_id
      WHERE s.service_date IS NOT NULL
      GROUP BY c.client_id, c.name, c.email, c.phone
      HAVING expected_return_date BETWEEN date('now', '-7 days') AND date('now', '+14 days')
      ORDER BY expected_return_date ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          sql,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async getAllClients() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM clientes ORDER BY name',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async getClientServices(clientId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM servicos WHERE client_id = ? ORDER BY service_date DESC',
          [clientId],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async updateSyncMetadata(status) {
    const now = new Date().toISOString();
    await this.executeSql(
      'INSERT INTO sync_metadata (last_sync_date, sync_status) VALUES (?, ?)',
      [now, status]
    );
  }

  async getLastSync() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM sync_metadata ORDER BY id DESC LIMIT 1',
          [],
          (_, { rows }) => resolve(rows._array[0]),
          (_, error) => reject(error)
        );
      });
    });
  }
}

export const database = new SQLiteDatabase();