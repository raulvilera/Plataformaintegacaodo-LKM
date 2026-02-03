import { STUDENTS_DB } from '../studentsData';

// Script para migrar dados de alunos para o Supabase
// Este script gera SQL para inserção em massa

const generateInsertSQL = () => {
  const values = STUDENTS_DB.map(student => {
    const nome = student.nome.replace(/'/g, "''"); // Escape single quotes
    const ra = student.ra.replace(/'/g, "''");
    const turma = student.turma.replace(/'/g, "''");
    return `('${ra}', '${nome}', '${turma}')`;
  }).join(',\n  ');

  const sql = `
INSERT INTO public.students (ra, nome, turma)
VALUES
  ${values}
ON CONFLICT (ra) DO NOTHING;
`;

  return sql;
};

console.log(generateInsertSQL());
