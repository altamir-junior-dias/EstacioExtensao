import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ReturnClientsScreen from './src/screens/ReturnClientsScreen';
import ClientDetailScreen from './src/screens/ClientDetailScreen';
import AllClientsScreen from './src/screens/AllClientsScreen';
import SyncScreen from './src/screens/SyncScreen';

import { COLORS } from './src/config/settings';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ReturnClientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ReturnClients" 
        component={ReturnClientsScreen}
        options={{ title: 'Retornos Previstos' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ title: 'Detalhes do Cliente' }}
      />
    </Stack.Navigator>
  );
}

function AllClientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AllClients" 
        component={AllClientsScreen}
        options={{ title: 'Todos os Clientes' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ title: 'Detalhes do Cliente' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Retornos"
        component={ReturnClientsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TodosClientes"
        component={AllClientsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
          headerShown: false,
          title: 'Todos os Clientes'
        }}
      />
      <Tab.Screen
        name="Sincronizar"
        component={SyncScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sync" color={color} size={size} />
          ),
          title: 'Sincronização'
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}