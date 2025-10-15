import axios from 'axios';
import { API_CONFIG } from '../config/settings';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  async syncData(lastSyncDate = null) {
    try {
      const params = lastSyncDate ? { since: lastSyncDate } : {};
      
      const response = await this.client.get('/sync', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Falha na sincronização: ${error.message}`);
    }
  }

  async getClients() {
    try {
      const response = await this.client.get('/clients');
      return response.data;
    } catch (error) {
      throw new Error(`Falha ao buscar clientes: ${error.message}`);
    }
  }

  async getServices(clientId) {
    try {
      const response = await this.client.get(`/clients/${clientId}/services`);
      return response.data;
    } catch (error) {
      throw new Error(`Falha ao buscar serviços: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Falha na conexão: ${error.message}`);
    }
  }
}

export const apiService = new ApiService();