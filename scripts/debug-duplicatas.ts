
import { createClient } from '@supabase/supabase-js';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1u7qMsMHkZT47OZdar5qvshQDRA8XJrLgDjAZVOViAio/gviz/tq?tqx=out:csv&gid=6707938';

function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentToken = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentToken += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentToken += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentToken.trim());
                currentToken = '';
            } else if (char === '\n' || char === '\r') {
                if (currentToken || currentRow.length > 0) {
                    currentRow.push(currentToken.trim());
                    rows.push(currentRow);
                    currentToken = '';
                    currentRow = [];
                }
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentToken += char;
            }
        }
    }

    if (currentToken || currentRow.length > 0) {
        currentRow.push(currentToken.trim());
        rows.push(currentRow);
    }

    return rows;
}

function normalizeTurma(turma: string): string {
    let clean = turma.trim()
        .replace(/\s+/g, '')
        .replace(/ano/gi, 'Ano')
        .replace(/série/gi, 'Série')
        .replace(/E\.F/gi, '')
        .replace(/E\.M/gi, '')
        .replace(/ª/g, 'ª')
        .replace(/º/g, 'º');
    clean = clean.replace(/([0-9]ºAno|[0-9]ªSérie)([A-Z])/i, '$1 $2');
    return clean.trim();
}

function normalizeRA(ra: string): string {
    let clean = ra.trim().toLowerCase();
    if (clean && !clean.endsWith('sp') && /^[0-9x]+$/i.test(clean)) {
        clean += 'sp';
    }
    return clean;
}

async function debugDuplicates() {
    console.log('📥 Baixando CSV...');
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Map para rastrear aparições: RA -> Array de turmas
    const appearances = new Map<string, string[]>();
    const names = new Map<string, string>();

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        for (let col = 1; col < row.length; col += 5) {
            const nome = row[col + 1];
            const turmaRaw = row[col + 3];
            const raRaw = row[col + 4];

            if (nome && raRaw && turmaRaw && nome.trim() && raRaw.trim()) {
                const ra = normalizeRA(raRaw);
                const turma = normalizeTurma(turmaRaw);

                if (!appearances.has(ra)) {
                    appearances.set(ra, []);
                    names.set(ra, nome.trim());
                }
                appearances.get(ra)?.push(turma);
            }
        }
    }

    console.log('🔍 Buscando duplicatas conflitantes...');
    let conflicts = 0;

    // Alunos alvo para verificação
    const targets = ['1165006170sp', '1164949780sp', '1158802304sp'];

    appearances.forEach((turmas, ra) => {
        // Se aparecer em mais de 1 turma diferente
        const uniqueTurmas = [...new Set(turmas)];
        if (uniqueTurmas.length > 1) {
            conflicts++;
            if (targets.includes(ra) || conflicts < 5) {
                console.log(`⚠️ ALUNO DUPLICADO: ${names.get(ra)} (${ra})`);
                console.log(`   Encontrado nas turmas: ${turmas.join(' -> ')}`);
            }
        }
    });

    console.log(`\nTotal de alunos com turmas conflitantes: ${conflicts}`);
}

debugDuplicates();
