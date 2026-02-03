import { supabase } from './supabaseClient';
import type { Incident } from '../types';

/**
 * Busca todas as ocorrências do banco de dados
 */
export async function fetchIncidents(): Promise<Incident[]> {
    try {
        const { data, error } = await supabase
            .from('incidents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar ocorrências:', error);
            return [];
        }

        return (data || []).map(mapDatabaseToIncident);
    } catch (err) {
        console.error('Erro ao buscar ocorrências:', err);
        return [];
    }
}

/**
 * Cria uma nova ocorrência
 */
export async function createIncident(incident: Incident): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('incidents')
            .insert([mapIncidentToDatabase(incident, user?.id)]);

        if (error) {
            console.error('Erro ao criar ocorrência:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Erro ao criar ocorrência:', err);
        return { success: false, error: 'Erro desconhecido' };
    }
}

/**
 * Cria múltiplas ocorrências de uma vez
 */
export async function createIncidents(incidents: Incident[]): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('incidents')
            .insert(incidents.map(inc => mapIncidentToDatabase(inc, user?.id)));

        if (error) {
            console.error('Erro ao criar ocorrências:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Erro ao criar ocorrências:', err);
        return { success: false, error: 'Erro desconhecido' };
    }
}

/**
 * Atualiza uma ocorrência existente
 */
export async function updateIncident(id: string, updates: Partial<Incident>): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('incidents')
            .update(mapIncidentToDatabase(updates as Incident))
            .eq('id', id);

        if (error) {
            console.error('Erro ao atualizar ocorrência:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Erro ao atualizar ocorrência:', err);
        return { success: false, error: 'Erro desconhecido' };
    }
}

/**
 * Deleta uma ocorrência
 */
export async function deleteIncident(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('incidents')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar ocorrência:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Erro ao deletar ocorrência:', err);
        return { success: false, error: 'Erro desconhecido' };
    }
}

/**
 * Inscreve-se para receber atualizações em tempo real
 */
export function subscribeToIncidents(callback: (incidents: Incident[]) => void) {
    const channel = supabase
        .channel('incidents-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'incidents',
            },
            async () => {
                // Quando houver mudanças, buscar todos os dados novamente
                const incidents = await fetchIncidents();
                callback(incidents);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Funções auxiliares para mapear entre o formato do banco e o formato da aplicação
function mapDatabaseToIncident(dbIncident: any): Incident {
    return {
        id: dbIncident.id,
        professorName: dbIncident.professor_name,
        classRoom: dbIncident.class_room,
        studentName: dbIncident.student_name,
        ra: dbIncident.ra,
        date: dbIncident.date,
        time: dbIncident.time,
        registerDate: dbIncident.register_date,
        returnDate: dbIncident.return_date,
        discipline: dbIncident.discipline,
        irregularities: dbIncident.irregularities,
        description: dbIncident.description,
        severity: dbIncident.severity,
        aiAnalysis: dbIncident.ai_analysis,
        status: dbIncident.status,
        category: dbIncident.category,
        source: dbIncident.source,
        createdBy: dbIncident.created_by,
        createdAt: dbIncident.created_at,
        updatedAt: dbIncident.updated_at,
    };
}

function mapIncidentToDatabase(incident: Incident, userId?: string): any {
    return {
        id: incident.id,
        professor_name: incident.professorName,
        class_room: incident.classRoom,
        student_name: incident.studentName,
        ra: incident.ra,
        date: incident.date,
        time: incident.time,
        register_date: incident.registerDate,
        return_date: incident.returnDate,
        discipline: incident.discipline,
        irregularities: incident.irregularities,
        description: incident.description,
        severity: incident.severity,
        ai_analysis: incident.aiAnalysis,
        status: incident.status,
        category: incident.category,
        source: incident.source,
        created_by: userId || incident.createdBy,
    };
}
