
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

async function debug6Ano() {
    console.log('📥 Baixando CSV...');
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    console.log(`Total de linhas: ${rows.length}`);

    let count6A = 0;
    let countTotal6 = 0;

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        // Iterar colunas
        for (let col = 1; col < row.length; col += 5) {
            const nome = row[col + 1];
            const turmaRaw = row[col + 3];
            const raRaw = row[col + 4];

            if (nome && turmaRaw) {
                if (turmaRaw.includes('6') || turmaRaw.includes('SEXTO')) {
                    countTotal6++;
                    const normalizada = normalizeTurma(turmaRaw);

                    if (normalizada === '6ºAno A') {
                        count6A++;
                        console.log(`Encontrado 6ºA: ${nome} | Raw: "${turmaRaw}" | RA: ${raRaw}`);
                    }
                }
            }
        }
    }

    console.log(`\nRESUMO:`);
    console.log(`Total de menções a '6' ou 'SEXTO' na coluna turma: ${countTotal6}`);
    console.log(`Total normalizado para '6ºAno A': ${count6A}`);
}

debug6Ano();
