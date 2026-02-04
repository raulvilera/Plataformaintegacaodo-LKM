import React, { useState } from 'react';
import { User } from '../types';
import { login as supabaseLogin, signUpProfessor } from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'professor' | 'gestao'>('gestao');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (activeTab === 'gestao') {
        if (email.toLowerCase() !== 'gestao@escola.com') {
          setError('Acesso negado. A área de Gestão é restrita ao e-mail gestao@escola.com');
          setIsLoading(false);
          return;
        }
      }

      if (activeTab === 'professor') {
        const validDomains = ['prof.educacao.sp.gov.br'];
        const emailParts = email.split('@');
        const emailDomain = emailParts.length > 1 ? emailParts[1].toLowerCase() : '';

        if (!validDomains.includes(emailDomain)) {
          setError('Acesso restrito. Utilize seu e-mail institucional (@prof.educacao.sp.gov.br)');
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

      const { user, error: authError } = await supabaseLogin(email, password);

      if (authError || !user) {
        setError(authError || 'Erro ao fazer login. Verifique suas credenciais.');
        setIsLoading(false);
        return;
      }

      const expectedRole = activeTab === 'gestao' ? 'gestor' : 'professor';
      if (user.role !== expectedRole) {
        setError(`Este usuário não tem permissão de ${activeTab === 'gestao' ? 'Gestão' : 'Professor'}`);
        setIsLoading(false);
        return;
      }

      onLogin(user);
    } catch (err) {
      setError('Erro crítico ao conectar com o servidor. Tente novamente mais tarde.');
      setIsLoading(false);
    }
  };

  const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqAsB6ThMLLLLsuZ2yx8qAn8Koh4k4naDt3dSMtnPRxb_wWFP84Ve5mnuUTBLP2COJAi8cfYMRrN0qWKyUFJV8pjQXbhrLb2yc2K8mJ5qsqsSCor4fJcdl2IDn-Xtqtqc31I-5_BWai_JljBZIMRVr-SB5vW04GE8gefLARCWrun9gIx10lkCVN6coAV24/s229/images-removebg-preview.png";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001a35] p-4 font-sans relative overflow-hidden">

      {/* Background Decorativo - Mais Intenso */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 flex flex-col items-center border border-white/20 z-10 relative overflow-hidden">

        {/* Logo da Escola - Com Fallback Robusto */}
        {logoLoaded && (
          <div className="absolute top-6 right-6">
            <img
              src={LOGO_URL}
              alt="Logo Escola"
              className="w-16 h-16 object-contain drop-shadow-md transition-opacity duration-500"
              onError={() => setLogoLoaded(false)}
            />
          </div>
        )}

        {/* Ícone Central - Estilizado */}
        <div className="w-20 h-20 bg-[#004a99] rounded-3xl flex items-center justify-center mb-6 shadow-[0_12px_24px_-8px_rgba(0,74,153,0.5)] border-b-4 border-blue-900 transition-transform hover:scale-105 duration-300">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-[#002b5c] text-3xl font-black text-center mb-1 tracking-tighter uppercase leading-none">
          Portal 2026
        </h1>
        <p className="text-[#6c757d] text-[11px] text-center mb-8 font-bold uppercase tracking-[0.2em] opacity-80">
          Gestão de Ocorrências
        </p>

        {/* Seletor de Perfil - Design Moderno */}
        <div className="flex w-full mb-8 bg-[#f3f6fa] p-1.5 rounded-2xl border border-gray-100/50 shadow-inner">
          <button
            type="button"
            onClick={() => { setActiveTab('gestao'); setError(''); setIsSigningUp(false); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'gestao'
              ? 'bg-[#004a99] text-white shadow-lg scale-[1.02]'
              : 'text-[#adb5bd] hover:text-[#002b5c] hover:bg-white/50'
              }`}
          >
            Gestão
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('professor'); setError(''); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'professor'
              ? 'bg-[#004a99] text-white shadow-lg scale-[1.02]'
              : 'text-[#adb5bd] hover:text-[#002b5c] hover:bg-white/50'
              }`}
          >
            Professor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">

          {isSigningUp && activeTab === 'professor' && (
            <div className="space-y-2 animate-slide-down">
              <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest opacity-70">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full h-13 px-5 bg-[#f3f6fa] border-2 border-transparent rounded-2xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all shadow-sm placeholder:text-[#adb5bd] placeholder:font-medium"
                required={isSigningUp}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest opacity-70">
              {activeTab === 'gestao' ? 'E-mail de Gestão' : 'E-mail Institucional'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'gestao' ? 'gestao@escola.com' : 'usuario@prof.educacao.sp.gov.br'}
              className="w-full h-13 px-5 bg-[#f3f6fa] border-2 border-transparent rounded-2xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all shadow-sm placeholder:text-[#adb5bd] placeholder:font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#002b5c] text-[10px] font-black block ml-1 uppercase tracking-widest opacity-70">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-13 px-5 bg-[#f3f6fa] border-2 border-transparent rounded-2xl focus:border-[#004a99] focus:bg-white outline-none text-sm text-black font-bold transition-all shadow-sm placeholder:text-[#adb5bd]"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-shake">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-[10px] font-bold leading-tight uppercase tracking-tight">
                {error}
              </p>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-start gap-3 animate-fade-in">
              <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-600 text-[10px] font-bold leading-tight uppercase tracking-tight">
                {successMsg}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-[#004a99] hover:bg-[#003d80] text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,74,153,0.4)] transform active:scale-[0.98] transition-all mt-2 border-b-4 border-blue-900 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="group-hover:tracking-[0.3em] transition-all duration-300">
              {isLoading ? 'PROCESSANDO...' : (isSigningUp ? 'CRIAR CONTA' : 'ACESSAR SISTEMA')}
            </span>
          </button>

          {activeTab === 'professor' && (
            <button
              type="button"
              onClick={() => { setIsSigningUp(!isSigningUp); setError(''); setSuccessMsg(''); }}
              className="w-full text-center text-[10px] font-black text-[#004a99] hover:text-[#002b5c] uppercase tracking-widest mt-4 transition-all opacity-80 hover:opacity-100"
            >
              {isSigningUp ? 'Voltar para Login' : 'Primeiro Acesso? Cadastre-se'}
            </button>
          )}
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 w-full">
          <p className="text-[9px] text-[#adb5bd] font-black uppercase tracking-[0.3em] text-center leading-relaxed">
            Versão 2026.1.0 • Lydia Kitz Moreira<br />
            Seguro & Criptografado
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-slide-down { animation: slide-down 0.4s ease-out; }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-fade-in { animation: slide-down 0.6s ease-out; }
        
        input {
          transition: all 0.2s ease-in-out;
        }
        
        button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .h-13 { height: 3.25rem; }
      `}</style>
    </div>
  );
};

export default Login;