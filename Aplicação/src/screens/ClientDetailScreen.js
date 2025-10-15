import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Appbar, List, Divider, IconButton, Chip } from 'react-native-paper';
import { database } from '../database/sqlite';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../config/settings';

const ClientDetailScreen = ({ route, navigation }) => {
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      const clients = await database.getAllClients();
      const currentClient = clients.find(c => c.client_id === clientId);
      setClient(currentClient);

      const clientServices = await database.getClientServices(clientId);
      setServices(clientServices);

    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleCall = () => {
    if (client?.phone) {
      const phoneNumber = client.phone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (client?.phone) {
      const phoneNumber = client.phone.replace(/\D/g, '');
      const message = `Olá ${client.name}, tudo bem?`;
      Linking.openURL(`https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`);
    }
  };

  if (loading || !client) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Detalhes do Cliente" />
        <Appbar.Action icon="refresh" onPress={loadClientData} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <List.Section>
          <List.Subheader>Informações do Cliente</List.Subheader>
          
          <List.Item
            title="Nome"
            description={client.name}
            left={props => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title="ID"
            description={client.client_id}
            left={props => <List.Icon {...props} icon="identifier" />}
          />
          
          <List.Item
            title="Email"
            description={client.email || 'Não informado'}
            left={props => <List.Icon {...props} icon="email" />}
            right={props => 
              client.email && <IconButton {...props} icon="send" onPress={handleEmail} />
            }
          />
          
          <List.Item
            title="Telefone"
            description={client.phone || 'Não informado'}
            left={props => <List.Icon {...props} icon="phone" />}
            right={props => 
              client.phone && (
                <View style={styles.phoneActions}>
                  <IconButton icon="phone" onPress={handleCall} />
                  <IconButton icon="whatsapp" onPress={handleWhatsApp} />
                </View>
              )
            }
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>
            Serviços Realizados ({services.length})
          </List.Subheader>

          {services.length === 0 ? (
            <List.Item
              title="Nenhum serviço encontrado"
              description="Este cliente ainda não possui serviços registrados"
              left={props => <List.Icon {...props} icon="information" />}
            />
          ) : (
            services.map((service, index) => (
              <List.Item
                key={service.id}
                title={service.service_type}
                description={service.description || 'Sem descrição'}
                left={props => <List.Icon {...props} icon="tools" />}
                right={props => (
                  <View style={styles.serviceInfo}>
                    <Chip mode="outlined" style={styles.serviceStatus}>
                      {service.status}
                    </Chip>
                    <Text style={styles.serviceDate}>
                      {formatDate(service.service_date)}
                    </Text>
                  </View>
                )}
              />
            ))
          )}
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneActions: {
    flexDirection: 'row',
  },
  serviceInfo: {
    alignItems: 'flex-end',
  },
  serviceStatus: {
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default ClientDetailScreen;