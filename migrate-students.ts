import { createClient } from '@supabase/supabase-js';
import { STUDENTS_DB } from './studentsData.js';

// Configuração do Supabase
const supabaseUrl = 'https://zvuxzrfbmmbhuhwaofrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dXh6cmZibW1iaHVod2FvZnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODkxNDEsImV4cCI6MjA4MjI2NTE0MX0.GpA8qLVeLF01x0baSALC1AmRTcKL90ALpxt35qKLVTQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script para migrar apenas os alunos que ainda não estão no banco
 * Ignora duplicatas automaticamente
 */
async function migrateRemainingStudents() {
    console.log(`Total de alunos no arquivo: ${STUDENTS_DB.length}`);

    // Buscar todos os RAs que já existem no banco
    console.log('Buscando alunos já cadastrados...');
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('ra');

    if (fetchError) {
        console.error('Erro ao buscar alunos existentes:', fetchError);
        return;
    }

    const existingRAs = new Set(existingStudents?.map(s => s.ra) || []);
    console.log(`Alunos já cadastrados: ${existingRAs.size}`);

    // Filtrar apenas os alunos que ainda não existem
    const studentsToMigrate = STUDENTS_DB.filter(student => !existingRAs.has(student.ra));
    console.log(`Alunos a migrar: ${studentsToMigrate.length}\n`);

    if (studentsToMigrate.length === 0) {
        console.log('✅ Todos os alunos já foram migrados!');
        return { successCount: 0, errorCount: 0, skipped: STUDENTS_DB.length };
    }

    // Migrar em lotes
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    console.log('Iniciando migração dos alunos restantes...\n');

    for (let i = 0; i < studentsToMigrate.length; i += BATCH_SIZE) {
        const batch = studentsToMigrate.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        try {
            const { data, error } = await supabase
                .from('students')
                .insert(batch)
                .select();

            if (error) {
                console.error(`❌ Erro no lote ${batchNumber}:`, error.message);
                errorCount += batch.length;
            } else {
                successCount += batch.length;
                console.log(`✅ Lote ${batchNumber} concluído: ${batch.length} alunos inseridos`);
            }
        } catch (err) {
            console.error(`❌ Exceção no lote ${batchNumber}:`, err);
            errorCount += batch.length;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 RESULTADO DA MIGRAÇÃO:');
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Sucesso: ${successCount} alunos`);
    console.log(`❌ Erros: ${errorCount} alunos`);
    console.log(`⏭️  Já existiam: ${existingRAs.size} alunos`);
    console.log(`📈 Total no banco: ${existingRAs.size + successCount} alunos`);
    console.log(`${'='.repeat(50)}\n`);

    return { successCount, errorCount, skipped: existingRAs.size };
}

// Executar migração
migrateRemainingStudents()
    .then((result) => {
        if (result) {
            console.log('✨ Migração concluída com sucesso!');
        }
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Erro fatal:', err);
        process.exit(1);
    });
