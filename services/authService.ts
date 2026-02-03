import { supabase } from './supabaseClient';
import type { User } from '../types';

export interface AuthResponse {
    user: User | null;
    error: string | null;
}

/**
 * Faz login com email e senha
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Usuário não encontrado' };
        }

        // Buscar dados adicionais do usuário na tabela users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError || !userData) {
            return { user: null, error: 'Erro ao carregar dados do usuário' };
        }

        return {
            user: {
                id: userData.id,
                email: userData.email,
                role: userData.role as 'gestor' | 'professor',
                fullName: userData.full_name,
            },
            error: null,
        };
    } catch (err) {
        return { user: null, error: 'Erro ao fazer login' };
    }
}

/**
 * Faz logout do usuário atual
 */
export async function logout(): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.signOut();
        return { error: error ? error.message : null };
    } catch (err) {
        return { error: 'Erro ao fazer logout' };
    }
}

/**
 * Obtém o usuário atualmente autenticado
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!userData) return null;

        return {
            id: userData.id,
            email: userData.email,
            role: userData.role as 'gestor' | 'professor',
            fullName: userData.full_name,
        };
    } catch (err) {
        return null;
    }
}

/**
 * Verifica se há uma sessão ativa
 */
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Realiza o cadastro de um novo professor
 */
export async function signUpProfessor(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'professor'
                }
            }
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (data.user) {
            return {
                user: {
                    id: data.user.id,
                    email: email,
                    role: 'professor',
                    fullName
                },
                error: null
            };
        }

        return { user: null, error: 'Verifique seu email para confirmar o cadastro.' };
    } catch (err) {
        return { user: null, error: 'Erro ao realizar cadastro.' };
    }
}
