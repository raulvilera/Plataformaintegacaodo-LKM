import React, { useState, useEffect } from 'react';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import ProfessorView from '../components/ProfessorView';
import { Incident, View, User } from './types';
import { fetchIncidents, createIncidents, deleteIncident as deleteIncidentService, subscribeToIncidents } from './services/incidentsService';
import { logout as supabaseLogout } from './services/authService';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar ocorrências do Supabase quando o usuário fizer login
  useEffect(() => {
    if (user) {
      loadIncidents();
    }
  }, [user]);

  // Inscrever-se para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToIncidents((updatedIncidents) => {
      setIncidents(updatedIncidents);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const loadIncidents = async () => {
    setIsLoading(true);
    const data = await fetchIncidents();
    setIncidents(data);
    setIsLoading(false);
  };

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await supabaseLogout();
    setUser(null);
    setIncidents([]);
    setView('login');
  };

  const handleSaveIncident = async (newIncident: Incident | Incident[]) => {
    const itemsToAdd = Array.isArray(newIncident) ? newIncident : [newIncident];

    const { success, error } = await createIncidents(itemsToAdd);

    if (success) {
      // A atualização será feita automaticamente via subscription em tempo real
      // Mas vamos recarregar para garantir
      await loadIncidents();
    } else {
      alert(`Erro ao salvar: ${error}`);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
      const { success, error } = await deleteIncidentService(id);

      if (success) {
        // A atualização será feita automaticamente via subscription
        await loadIncidents();
      } else {
        alert(`Erro ao deletar: ${error}`);
      }
    }
  };

  if (view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (user?.role === 'professor') {
    return (
      <ProfessorView
        user={user}
        incidents={incidents}
        onSave={handleSaveIncident}
        onDelete={handleDeleteIncident}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      user={user!}
      incidents={incidents}
      onSave={handleSaveIncident as any}
      onDelete={handleDeleteIncident}
      onLogout={handleLogout}
    />
  );
};

export default App;