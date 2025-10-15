import { apiService } from './api';
import { database } from '../database/sqlite';
import { Alert } from 'react-native';

class SyncService {
  constructor() {
    this.isSyncing = false;
  }

  async performSync() {
    if (this.isSyncing) {
      console.log('Sincronização já em andamento...');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('Iniciando sincronização...');

      const lastSync = await database.getLastSync();
      const lastSyncDate = lastSync ? lastSync.last_sync_date : null;

      const syncData = await apiService.syncData(lastSyncDate);

      if (syncData.clients && syncData.clients.length > 0) {
        await database.saveOrUpdateClients(syncData.clients);
        console.log(`${syncData.clients.length} clientes sincronizados`);
      }

      if (syncData.services && syncData.services.length > 0) {
        await database.saveOrUpdateServices(syncData.services);
        console.log(`${syncData.services.length} serviços sincronizados`);
      }

      await database.updateSyncMetadata('success');

      console.log('Sincronização concluída com sucesso');
      
      return {
        success: true,
        clients: syncData.clients?.length || 0,
        services: syncData.services?.length || 0
      };

    } catch (error) {
      console.error('Erro na sincronização:', error);
      await database.updateSyncMetadata('error');
      
      Alert.alert(
        'Erro de Sincronização',
        error.message || 'Falha ao sincronizar dados'
      );

      return {
        success: false,
        error: error.message
      };

    } finally {
      this.isSyncing = false;
    }
  }

  async getSyncStatus() {
    try {
      const lastSync = await database.getLastSync();
      const clientsCount = await database.getAllClients();
      const returnClients = await database.getClientsWithReturnDates();

      return {
        lastSync: lastSync?.last_sync_date || 'Nunca',
        status: lastSync?.sync_status || 'unknown',
        totalClients: clientsCount.length,
        pendingReturns: returnClients.length
      };
    } catch (error) {
      console.error('Erro ao obter status:', error);
      return {
        lastSync: 'Erro',
        status: 'error',
        totalClients: 0,
        pendingReturns: 0
      };
    }
  }
}

export const syncService = new SyncService();