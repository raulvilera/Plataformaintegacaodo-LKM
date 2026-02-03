
export interface Incident {
  id: string;
  professorName?: string;
  classRoom?: string;
  studentName: string;
  ra?: string;
  date: string;
  time?: string;
  registerDate?: string;
  returnDate?: string;
  discipline?: string;
  irregularities?: string;
  description: string;
  severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  aiAnalysis?: string;
  status: 'Pendente' | 'Em Análise' | 'Resolvido';
  category?: string;
  source: 'professor' | 'gestao';
  createdBy?: string;  // UUID do usuário que criou
  createdAt?: string;  // Timestamp de criação
  updatedAt?: string;  // Timestamp de atualização
}

export type View = 'login' | 'dashboard';

export interface User {
  id?: string;  // UUID do Supabase Auth
  email: string;
  role: 'gestor' | 'professor';
  fullName?: string;
}

export interface Student {
  ra: string;
  nome: string;
  turma: string;
}
