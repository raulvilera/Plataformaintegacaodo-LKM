import { supabase } from './supabaseClient';
import { Student } from '../types';

/**
 * Busca todos os alunos do banco de dados
 */
export async function fetchStudents(): Promise<Student[]> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('ra, nome, turma')
            .order('nome')
            .range(0, 5000); // Garantir que busca todos, default é 1000

        if (error) {
            console.error('Erro ao buscar alunos:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Erro ao buscar alunos:', err);
        return [];
    }
}
