import { Incident } from '../types';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL;

/**
 * Envia uma ocorrência para a planilha Google Sheets via Apps Script
 */
export async function sendToGoogleSheets(incident: Incident): Promise<{ success: boolean; error?: string }> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_')) {
        console.warn('Google Sheets Script URL não configurado.');
        return { success: false, error: 'URL do Script não configurada' };
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requer no-cors para POST simples ou redirecionamento
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incident),
        });

        // Como usamos 'no-cors', não conseguimos ler o corpo da resposta (será opaque)
        // Mas se não lançar erro, assumimos que foi enviado.
        return { success: true };
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
}

/**
 * Envia múltiplas ocorrências para a planilha
 */
export async function sendMultipleToGoogleSheets(incidents: Incident[]): Promise<{ success: boolean; error?: string }> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_')) {
        return { success: false, error: 'URL do Script não configurada' };
    }

    try {
        // Para simplificar o script, enviamos um por um. 
        // Em produção, seria melhor enviar em lote, mas o Apps Script é lento para lotes grandes.
        const promises = incidents.map(incident => sendToGoogleSheets(incident));
        await Promise.all(promises);

        return { success: true };
    } catch (error) {
        console.error('Erro ao enviar lote para Google Sheets:', error);
        return { success: false, error: 'Erro no envio em lote' };
    }
}
