import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import CustomerNavigator from './CustomerNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <LoadingScreen message="Starting up..." />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.role === 'admin' ? (
        <Stack.Screen name="AdminRoot" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
