import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProfessorView from './components/ProfessorView';
import { Incident, View, User } from './types';
import { fetchIncidents, createIncidents, deleteIncident as deleteIncidentService, subscribeToIncidents } from './services/incidentsService';
import { logout as supabaseLogout, getCurrentUser } from './services/authService';
import { sendToGoogleSheets, sendMultipleToGoogleSheets } from './services/googleSheetsService';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Verificar se variáveis de ambiente existem
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const isConfigMissing = !url || !key || url.includes('YOUR_') || key.includes('YOUR_') || url === 'https://placeholder.supabase.co';

        if (isConfigMissing) {
          setConfigError('Configuração do Supabase ausente ou inválida. Verifique as variáveis de ambiente no seu painel de deploy (Netlify/Vercel).');
          setIsLoading(false);
          return;
        }

        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setView('dashboard');
        }
      } catch (err) {
        console.error("Erro ao inicializar app:", err);
        // Não travar o app se apenas o getCurrentUser falhar, deixar cair no login
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  // Carregar ocorrências do Supabase quando o usuário fizer login
  useEffect(() => {
    if (user) {
      loadIncidents();
    }
  }, [user]);

  // Inscrever-se para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    try {
      const unsubscribe = subscribeToIncidents((updatedIncidents) => {
        setIncidents(updatedIncidents);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.error("Erro ao assinar realtime:", err);
    }
  }, [user]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await fetchIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error("Erro ao carregar ocorrências:", err);
    } finally {
      setIsLoading(false);
    }
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

    try {
      const { success, error } = await createIncidents(itemsToAdd);

      if (success) {
        // Enviar para Google Sheets após salvar no Supabase
        if (Array.isArray(newIncident)) {
          await sendMultipleToGoogleSheets(newIncident);
        } else {
          await sendToGoogleSheets(newIncident);
        }

        // A atualização será feita automaticamente via subscription em tempo real
        // Mas vamos recarregar para garantir
        await loadIncidents();
      } else {
        alert(`Erro ao salvar: ${error}`);
      }
    } catch (err) {
      alert(`Erro inesperado ao salvar: ${err}`);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
      try {
        const { success, error } = await deleteIncidentService(id);

        if (success) {
          await loadIncidents();
        } else {
          alert(`Erro ao deletar: ${error}`);
        }
      } catch (err) {
        alert(`Erro inesperado ao deletar: ${err}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#001a35] flex flex-col items-center justify-center p-6">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-[#004a99]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#004a99] rounded-full animate-spin"></div>
        </div>
        <p className="text-white/60 font-black animate-pulse tracking-[0.3em] text-[10px] uppercase">
          Portal 2026 • Inicializando
        </p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-[#001a35] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-white text-3xl font-black mb-4 uppercase tracking-tighter">Erro de Sistema</h1>
        <p className="text-white/40 max-w-md mb-10 text-sm leading-relaxed">{configError}</p>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-left max-w-sm">
          <p className="text-[10px] font-black text-[#004a99] uppercase mb-2 tracking-widest">Guia de Correção:</p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Certifique-se de que as variáveis <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b> estão definidas corretamente no ambiente de produção.
          </p>
        </div>
      </div>
    );
  }

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