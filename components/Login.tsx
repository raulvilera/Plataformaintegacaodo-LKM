import React, { useState } from 'react';
import { User } from '../types';
import { login as supabaseLogin, signUpProfessor } from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'professor' | 'gestao'>('gestao'); // Padrão Gestão solicitado
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Novo campo para cadastro
  const [isSigningUp, setIsSigningUp] = useState(false); // Toggle entre Login e Cadastro
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (activeTab === 'gestao') {
        if (email !== 'gestao@escola.com') {
          setError('Área restrita. Email obrigatório: gestao@escola.com');
          setIsLoading(false);
          return;
        }
      }

      if (activeTab === 'professor') {
        // Validação de domínio obrigatória para professores
        const validDomains = ['prof.educacao.sp.gov.br', 'professor.educacao.sp.gov.br'];
        const emailDomain = email.split('@')[1];

        if (!validDomains.includes(emailDomain)) {
          setError('Acesso restrito a emails institucionais (@prof.educacao.sp.gov.br ou @professor.educacao.sp.gov.br)');
          setIsLoading(false);
          return;
        }

        if (isSigningUp) {
          if (!fullName.trim()) {
            setError('Por favor, informe seu nome completo.');
            setIsLoading(false);
            return;
          }

          const { user, error: signUpError } = await signUpProfessor(email, password, fullName);

          if (signUpError) {
            setError(signUpError);
          } else {
            setSuccessMsg('Cadastro realizado! Se o login não for automático, verifique seu email.');
            if (user) onLogin(user);
          }
          setIsLoading(false);
          return;
        }
      }

      // Login normal (Professor ou Gestão)
      const { user, error: authError } = await supabaseLogin(email, password);

      if (authError || !user) {
        setError(authError || 'Erro ao fazer login');
        setIsLoading(false);
        return;
      }

      // Verificar se o role do usuário corresponde à aba selecionada
      const expectedRole = activeTab === 'gestao' ? 'gestor' : 'professor';
      if (user.role !== expectedRole) {
        setError(`Este usuário não tem permissão de ${activeTab}`);
        setIsLoading(false);
        return;
      }

      onLogin(user);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setIsLoading(false);
    }
  };

  // URL do logotipo fornecido pelo usuário
  const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqAsB6ThMLLLLsuZ2yx8qAn8Koh4k4naDt3dSMtnPRxb_wWFP84Ve5mnuUTBLP2COJAi8cfYMRrN0qWKyUFJV8pjQXbhrLb2yc2K8mJ5qsqsSCor4fJcdl2IDn-Xtqtqc31I-5_BWai_JljBZIMRVr-SB5vW04GE8gefLARCWrun9gIx10lkCVN6coAV24/s229/images-removebg-preview.png";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001a35] p-6 font-sans relative overflow-hidden">

      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-2xl p-10 flex flex-col items-center border border-white/10 z-10 relative overflow-hidden">

        {/* Logo da Escola - Dentro da Área de Login (Canto Superior Direito) */}
        <div className="absolute top-4 right-4">
          <img
            src={LOGO_URL}
            alt="Logo EE Lydia Kitz Moreira"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Ícone Central */}
        <div className="w-16 h-16 bg-[#004a99] rounded-2xl flex items-center justify-center mb-6 shadow-lg border-b-4 border-blue-900 mt-2">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-[#002b5c] text-2xl font-black text-center mb-1 tracking-tight uppercase">
          Portal 2026
        </h1>
        <p className="text-[#6c757d] text-sm text-center mb-8 font-medium">
          Sistema de Gestão de Ocorrências
        </p>

        {/* Seletor de Perfil */}
        <div className="flex w-full mb-8 bg-[#f3f6f9] p-1.5 rounded-2xl border border-gray-100">
          <button
            type="button"
            onClick={() => { setActiveTab('professor'); setError(''); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'professor'
              ? 'bg-[#004a99] text-white shadow-lg'
              : 'text-[#adb5bd] hover:text-[#002b5c]'
              }`}
          >
            Professor
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('gestao'); setError(''); setIsSigningUp(false); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'gestao'
              ? 'bg-[#004a99] text-white shadow-lg'
              : 'text-[#adb5bd] hover:text-[#002b5c]'
              }`}
          >
            Gestão
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">

          {isSigningUp && activeTab === 'professor' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full h-12 px-5 bg-[#f3f6f9] border-2 border-transparent rounded-xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all placeholder:text-[#adb5bd]"
                required={isSigningUp}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest">
              Usuário Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@escola.com.br"
              className="w-full h-12 px-5 bg-[#f3f6f9] border-2 border-transparent rounded-xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all placeholder:text-[#adb5bd]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 px-5 bg-[#f3f6f9] border-2 border-transparent rounded-xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all placeholder:text-[#adb5bd]"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 animate-fade-in">
              <p className="text-red-600 text-[9px] font-black uppercase text-center tracking-tighter">
                {error}
              </p>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 animate-fade-in">
              <p className="text-green-600 text-[9px] font-black uppercase text-center tracking-tighter">
                {successMsg}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-[#004a99] hover:bg-[#003d80] text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl transform active:scale-[0.98] transition-all mt-2 border-b-4 border-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isSigningUp ? 'CADASTRANDO...' : 'AUTENTICANDO...') : (isSigningUp ? 'CRIAR CONTA' : 'ACESSAR SISTEMA')}
          </button>

          {activeTab === 'professor' && (
            <button
              type="button"
              onClick={() => { setIsSigningUp(!isSigningUp); setError(''); setSuccessMsg(''); }}
              className="w-full text-center text-[10px] font-bold text-[#004a99] hover:text-[#002b5c] uppercase tracking-widest mt-4 hover:underline transition-all"
            >
              {isSigningUp ? 'Já tenho conta? Fazer Login' : 'Primeiro Acesso? Cadastre-se'}
            </button>
          )}
        </form>

        <p className="mt-8 text-[9px] text-[#adb5bd] font-bold uppercase tracking-widest text-center w-full">
          Versão 2026.1.0 • Seguro & Criptografado
        </p>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
      `}</style>
    </div>
  );
};

export default Login;