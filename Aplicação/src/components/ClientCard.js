import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLORS } from '../config/settings';

const ClientCard = ({ client, onPress, showReturnDate = false }) => {
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getReturnStatus = (expectedReturnDate) => {
    const today = new Date();
    const returnDate = parseISO(expectedReturnDate);
    const diffDays = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'atrasado', color: COLORS.error, text: `Atrasado ${Math.abs(diffDays)} dias` };
    } else if (diffDays === 0) {
      return { status: 'hoje', color: COLORS.warning, text: 'Retorna hoje' };
    } else if (diffDays <= 7) {
      return { status: 'proximo', color: COLORS.secondary, text: `Retorna em ${diffDays} dias` };
    } else {
      return { status: 'futuro', color: COLORS.success, text: `Retorna em ${diffDays} dias` };
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.clientName}>{client.name}</Text>
            {showReturnDate && client.expected_return_date && (
              <View style={[
                styles.returnBadge,
                { backgroundColor: getReturnStatus(client.expected_return_date).color }
              ]}>
                <Text style={styles.returnText}>
                  {getReturnStatus(client.expected_return_date).text}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{client.client_id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Telefone:</Text>
              <Text style={styles.detailValue}>{client.phone || 'Não informado'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{client.email || 'Não informado'}</Text>
            </View>

            {client.last_service_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Último serviço:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(client.last_service_date)}
                </Text>
              </View>
            )}

            {showReturnDate && client.expected_return_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Retorno previsto:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(client.expected_return_date)}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  returnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  returnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: '40%',
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
});

export default ClientCard;