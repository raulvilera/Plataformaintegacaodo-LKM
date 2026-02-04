
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Incident, User, Student } from '../types';
import { generateIncidentPDF } from '../services/pdfService';
import { fetchStudents } from '../services/studentsService';

interface DashboardProps {
  user: User;
  incidents: Incident[];
  onSave: (incident: Incident) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

const DATA_TURMAS = [
  '6ºAno A', '6ºAno B', '6ºAno C', '6ºAno D', '6ºAno E', '6ºAno F',
  '7ºAno A', '7ºAno B', '7ºAno C', '7ºAno D', '7ºAno E', '7ºAno F',
  '8ºAno A', '8ºAno B', '8ºAno C', '8ºAno D', '8ºAno E',
  '9ºAno A', '9ºAno B', '9ºAno C', '9ºAno D',
  '1ª Série A', '1ª Série B', '1ª Série C', '1ª Série D', '1ª Série E', '1ª Série F',
  '2ª Série A', '2ª Série B', '2ª Série C', '2ª Série D', '2ª Série E', '2ª Série F', '2ª Série G', '2ª Série H',
  '3ª Série A', '3ª Série B', '3ª Série C', '3ª Série D', '3ª Série E', '3ª Série F', '3ª Série G'
];

const LISTA_IRREGULARIDADES = [
  'ATRASO', 'SEM MATERIAL', 'USO DE CELULAR', 'CONVERSA', 'DESRESPEITO',
  'INDISCIPLINA', 'DESACATO', 'SEM TAREFA', 'SAIU SEM PERMISSÃO'
];

const Dashboard: React.FC<DashboardProps> = ({ user, incidents, onSave, onDelete, onLogout }) => {
  const [classRoom, setClassRoom] = useState('');
  const [studentName, setStudentName] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [ra, setRa] = useState('');
  const [classification, setClassification] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [selectedIrregularities, setSelectedIrregularities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchStudents().then(data => setAllStudents(data));
  }, []);

  const regDateInputRef = useRef<HTMLInputElement>(null);
  const retDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (studentName && classRoom) {
      const sel = allStudents.find(a => a.nome === studentName && a.turma === classRoom);
      setRa(sel ? sel.ra : '---');
    } else {
      setRa('');
    }
  }, [studentName, classRoom]);

  const toggleIrregularity = (item: string) => {
    setSelectedIrregularities(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const openCalendar = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      try {
        if ((ref.current as any).showPicker) {
          (ref.current as any).showPicker();
        } else {
          ref.current.focus();
        }
      } catch (err) {
        ref.current.focus();
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !description || !classRoom || !classification || !professorName) {
      alert("Preencha todos os campos obrigatórios, incluindo o nome do Responsável.");
      return;
    }

    setIsSaving(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const formatDateBr = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const newInc: Incident = {
      id: `gest-${Date.now()}`,
      classRoom,
      studentName: studentName.toUpperCase(),
      professorName: professorName.toUpperCase(),
      ra,
      date: formatDateBr(registerDate),
      time: timeStr,
      registerDate: formatDateBr(registerDate),
      returnDate: classification === 'SUSPENSÃO' ? formatDateBr(returnDate) : undefined,
      discipline: (discipline || 'N/A').toUpperCase(),
      irregularities: selectedIrregularities.join(', '),
      description: description.toUpperCase(),
      severity: 'Média',
      status: 'Pendente',
      category: classification,
      source: 'gestao'
    };

    onSave(newInc);
    setStudentName('');
    setRa('');
    setDescription('');
    setReturnDate('');
    setDiscipline('');
    setSelectedIrregularities([]);
    setClassification('');
    setProfessorName('');
    setIsSaving(false);
  };

  const combinedHistory = useMemo(() => {
    if (!incidents) return [];
    const term = searchTerm.toLowerCase();
    return incidents.filter(i =>
      (i.studentName || "").toLowerCase().includes(term) ||
      (i.classRoom || "").toLowerCase().includes(term) ||
      (i.professorName || "").toLowerCase().includes(term)
    );
  }, [incidents, searchTerm]);

  return (
    <div className="min-h-screen bg-[#001a35] font-sans pb-12">
      <header className="bg-[#002b5c] text-white px-8 py-3 flex justify-between items-center border-b border-white/10 shadow-lg sticky top-0 z-[50]">
        <div className="flex flex-col">
          <h1 className="text-sm font-black uppercase">Gestão Lydia Kitz Moreira 2026</h1>
          <p className="text-[9px] font-bold text-blue-200/60 uppercase tracking-widest leading-none">Portal Administrativo</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold text-white/70">{user.email}</span>
          <button onClick={onLogout} className="bg-white text-[#002b5c] px-4 py-1.5 rounded text-[10px] font-black uppercase hover:bg-gray-100 transition-all shadow-md">Sair</button>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto mt-8 px-6 space-y-10">
        <div className="bg-[#001a35] rounded-xl shadow-2xl overflow-hidden border border-white/5">
          <div className="bg-[#004a99] py-3 text-center border-b border-white/10">
            <h2 className="text-white font-black text-xs uppercase tracking-widest">REGISTRO DE OCORRÊNCIA / SUSPENSÃO</h2>
          </div>
          <div className="p-8 bg-gradient-to-br from-[#115e59] via-[#14b8a6] to-[#ea580c]">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">TURMA</label>
                  <select value={classRoom} onChange={e => { setClassRoom(e.target.value); setStudentName(''); }} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Selecione...</option>
                    {DATA_TURMAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">ALUNO</label>
                  <select value={studentName} onChange={e => setStudentName(e.target.value)} disabled={!classRoom} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Selecione...</option>
                    {allStudents.filter(a => a.turma === classRoom).map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">RA DO ALUNO</label>
                  <div className="h-12 flex items-center px-4 bg-black/30 rounded-xl border border-white/10 text-white font-black font-mono">{ra || '---'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">RESPONSÁVEL PELO REGISTRO (DIGITE O NOME)</label>
                  <input
                    type="text"
                    value={professorName}
                    onChange={e => setProfessorName(e.target.value)}
                    placeholder="Digite o nome do responsável..."
                    className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">CATEGORIA DO REGISTRO</label>
                  <select value={classification} onChange={e => setClassification(e.target.value)} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Selecione...</option>
                    <option value="OCORRÊNCIA">OCORRÊNCIA</option>
                    <option value="SUSPENSÃO">SUSPENSÃO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest">DISCIPLINA / SETOR</label>
                  <input
                    type="text"
                    value={discipline}
                    onChange={e => setDiscipline(e.target.value)}
                    placeholder="Ex: Secretaria, Pátio, Matemática..."
                    className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Ajuste de Datas Lado a Lado */}
                <div className={`grid gap-4 ${classification === 'SUSPENSÃO' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-1 cursor-pointer" onClick={() => openCalendar(regDateInputRef)}>
                    <label className="text-[10px] font-black text-white uppercase tracking-widest block cursor-pointer">DATA DE REGISTRO DA OCORRÊNCIA</label>
                    <input
                      ref={regDateInputRef}
                      type="date"
                      value={registerDate}
                      onChange={e => setRegisterDate(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    />
                  </div>
                  {classification === 'SUSPENSÃO' && (
                    <div className="space-y-1 animate-fade-in cursor-pointer" onClick={() => openCalendar(retDateInputRef)}>
                      <label className="text-[10px] font-black text-white uppercase tracking-widest block cursor-pointer">DATA PREVISTA DE RETORNO (SUSPENSÃO)</label>
                      <input
                        ref={retDateInputRef}
                        type="date"
                        value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        className="w-full h-12 px-4 bg-white border border-yellow-400 rounded-xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white uppercase tracking-widest">IRREGULARIDADES OBSERVADAS</label>
                <div className="flex flex-wrap gap-2">
                  {LISTA_IRREGULARIDADES.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleIrregularity(item)}
                      className={`px-4 py-2 rounded-lg border transition-all text-[10px] font-bold ${selectedIrregularities.includes(item) ? 'bg-black text-white border-transparent' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-white uppercase tracking-widest">RELATO DOS FATOS (DESCRIÇÃO)</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-black outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Descreva o ocorrido de forma técnica e objetiva..."
                ></textarea>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-20 py-5 bg-[#f97316] hover:bg-[#ea580c] text-blue-900 font-black text-[13px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all border-b-[6px] border-orange-800 disabled:opacity-50"
                >
                  {isSaving ? 'SALVANDO...' : 'EFETUAR REGISTRO'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <section className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-300">
          <div className="px-8 py-5 border-b border-gray-300 flex items-center justify-between bg-[#004a99]">
            <h3 className="text-white font-black text-xs uppercase tracking-widest">HISTÓRICO DE OCORRÊNCIAS / SUSPENSÕES</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por aluno, turma ou responsável..."
                className="bg-white/10 border border-white/20 rounded px-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:text-black w-80 text-white placeholder:text-white/40 shadow-inner"
              />
            </div>
          </div>

          <div className="max-h-[800px] overflow-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#f8fafc] z-20 shadow-sm">
                <tr className="bg-gray-100 text-gray-600">
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-center w-[110px]">DATA</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-left w-[80px]">TURMA</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-left">ALUNO / RA</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-left">CATEGORIA</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-left">RESPONSÁVEL</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-left">DESCRIÇÃO</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-center w-[120px]">DOCUMENTO</th>
                  <th className="border-b border-gray-300 px-4 py-4 text-[10px] font-black uppercase text-center w-[100px]">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combinedHistory.length > 0 ? combinedHistory.map((inc) => (
                  <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-4 text-[10px] font-bold text-gray-500 text-center whitespace-nowrap">{inc.date}</td>
                    <td className="px-4 py-4 text-[10px] font-black text-blue-900 text-center bg-blue-50/20">{inc.classRoom}</td>
                    <td className="px-4 py-4">
                      <div className="text-[10px] font-black text-gray-900 uppercase">{inc.studentName}</div>
                      <div className="text-[9px] font-bold text-blue-600 font-mono">{inc.ra}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${inc.category === 'SUSPENSÃO' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {inc.category}
                      </span>
                      {inc.returnDate && (
                        <div className="text-[8px] font-bold text-red-500 mt-1 uppercase">Retorno: {inc.returnDate}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[10px] font-bold text-gray-700 uppercase">{inc.professorName}</td>
                    <td className="px-4 py-4">
                      <div className="text-[10px] font-medium text-gray-500 max-w-[300px] truncate" title={inc.description}>
                        {inc.description}
                      </div>
                      <div className="text-[8px] font-bold text-gray-400 mt-1 uppercase italic">{inc.irregularities}</div>
                    </td>
                    <td className="px-4 py-4 text-center relative">
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          onClick={() => setActivePdfId(activePdfId === inc.id ? null : inc.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors border border-red-100 flex items-center justify-center mx-auto"
                          title="Opções de PDF"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                        </button>
                        {activePdfId === inc.id && (
                          <div className="absolute top-full mt-1 z-[60] bg-white border border-gray-200 shadow-2xl rounded-xl p-1 w-32 animate-fade-in">
                            <button
                              onClick={() => { generateIncidentPDF(inc, 'view'); setActivePdfId(null); }}
                              className="w-full text-left px-3 py-2 text-[9px] font-black uppercase hover:bg-gray-50 rounded-lg text-blue-600 border-b border-gray-100"
                            >
                              Visualizar
                            </button>
                            <button
                              onClick={() => { generateIncidentPDF(inc, 'download'); setActivePdfId(null); }}
                              className="w-full text-left px-3 py-2 text-[9px] font-black uppercase hover:bg-gray-50 rounded-lg text-green-600"
                            >
                              Baixar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => onDelete(inc.id)}
                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                        title="Excluir Permanentemente"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-gray-400 text-[11px] font-black uppercase italic tracking-widest">
                      Nenhum registro encontrado para os critérios informados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 7px; width: 7px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #004a99; border-radius: 20px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Dashboard;
