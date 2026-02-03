import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://zvuxzrfbmmbhuhwaofrn.supabase.co';
const supabaseAnonKey = 'sb_publishable_Lbg0ospRXAcdptl3ZSwzZA_HIyhWHhA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

/**
 * Normaliza o nome da turma para o padrão do DB (ex: "6º ano A E.F" -> "6ºAno A")
 */
function normalizeTurma(turma: string): string {
    let clean = turma.trim()
        .replace(/\s+/g, '')
        .replace(/ano/gi, 'Ano')
        .replace(/série/gi, 'Série')
        .replace(/E\.F/gi, '')
        .replace(/E\.M/gi, '')
        .replace(/ª/g, 'ª')
        .replace(/º/g, 'º');

    // Adicionar espaço antes da letra da turma se necessário (ex: "6ºAnoA" -> "6ºAno A")
    clean = clean.replace(/([0-9]ºAno|[0-9]ªSérie)([A-Z])/i, '$1 $2');

    return clean.trim();
}

/**
 * Normaliza o RA (trim, lowercase, adiciona "sp" se necessário)
 */
function normalizeRA(ra: string): string {
    let clean = ra.trim().toLowerCase();
    if (clean && !clean.endsWith('sp') && /^[0-9x]+$/i.test(clean)) {
        clean += 'sp';
    }
    return clean;
}

async function importStudents() {
    console.log('📥 Baixando CSV da planilha...');
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();

    console.log('🔍 Parseando dados...');
    const allRows = parseCSV(csvText);

    // Usar Map para garantir que a última ocorrência (turma mais atual/direita) sobrescreva as anteriores
    const studentsMap = new Map<string, { nome: string; ra: string; turma: string }>();

    for (let r = 1; r < allRows.length; r++) {
        const row = allRows[r];
        for (let col = 1; col < row.length; col += 5) {
            const nome = row[col + 1];
            const turmaRaw = row[col + 3];
            const raRaw = row[col + 4];

            if (nome && raRaw && turmaRaw && nome.trim() && raRaw.trim()) {
                const ra = normalizeRA(raRaw);
                // Pular RAs inválidos ou muito curtos
                if (ra.length < 5) continue;

                const nomeClean = nome.trim().toUpperCase();
                const turma = normalizeTurma(turmaRaw);

                // MANTÉM A PRIMEIRA OCORRÊNCIA (esquerda da planilha)
                // Isso corrige o problema onde alunos do 6ºA aparecem duplicados no 7ºD e eram sobrescritos
                if (!studentsMap.has(ra)) {
                    studentsMap.set(ra, { nome: nomeClean, ra, turma });
                }
            }
        }
    }

    const students = Array.from(studentsMap.values());
    console.log(`✨ Total de alunos únicos processados (última versão): ${students.length}`);

    const BATCH_SIZE = 50;
    let successCount = 0;

    console.log('⚡ Upserting no Supabase...');

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batch = students.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('students')
            .upsert(batch, { onConflict: 'ra' });

        if (error) {
            console.error(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        } else {
            successCount += batch.length;
            process.stdout.write(`\r✅ Progresso: ${successCount}/${students.length} alunos`);
        }
    }

    console.log(`\n\n🎯 Finalizado: ${successCount} alunos processados.`);
}

importStudents()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('💥 Erro:', err);
        process.exit(1);
    });
