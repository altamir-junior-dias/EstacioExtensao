import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Appbar, Searchbar, FAB, ActivityIndicator } from 'react-native-paper';
import { database } from '../database/sqlite';
import { syncService } from '../services/syncService';
import ClientCard from '../components/ClientCard';
import { COLORS } from '../config/settings';

const ReturnClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({});

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const clientsData = await database.getClientsWithReturnDates();
      setClients(clientsData);
      setFilteredClients(clientsData);

      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Falha ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setRefreshing(true);
    const result = await syncService.performSync();
    
    if (result.success) {
      Alert.alert(
        'Sincronização Concluída',
        `${result.clients} clientes e ${result.services} serviços sincronizados`
      );
      await loadClients();
    }
    
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.client_id.toLowerCase().includes(query.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
        (client.phone && client.phone.includes(query))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  };

  const handleClientPress = (client) => {
    navigation.navigate('ClientDetail', { clientId: client.client_id });
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const renderClientItem = ({ item }) => (
    <ClientCard
      client={item}
      onPress={() => handleClientPress(item)}
      showReturnDate={true}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {loading ? 'Carregando...' : 'Nenhum cliente com retorno previsto no período'}
      </Text>
      <Text style={styles.emptySubtext}>
        Período: hoje -7 dias até hoje +14 dias
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title="Retornos Previstos"
          subtitle={`${syncStatus.pendingReturns || 0} clientes | Última sync: ${syncStatus.lastSync || 'Nunca'}`}
        />
        <Appbar.Action icon="sync" onPress={handleSync} />
      </Appbar.Header>

      <Searchbar
        placeholder="Buscar clientes..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando clientes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.client_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        style={styles.fab}
        icon="sync"
        onPress={handleSync}
        label="Sincronizar"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchbar: {
    margin: 8,
    elevation: 2,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default ReturnClientsScreen;