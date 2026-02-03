import { createClient } from '@supabase/supabase-js';
import { STUDENTS_DB } from './studentsData.js';

// Configuração do Supabase
const supabaseUrl = 'https://zvuxzrfbmmbhuhwaofrn.supabase.co';
const supabaseAnonKey = 'sb_publishable_Lbg0ospRXAcdptl3ZSwzZA_HIyhWHhA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script final para migrar alunos restantes
 * Remove duplicatas do próprio arquivo antes de migrar
 */
async function migrateFinalStudents() {
    console.log(`📚 Total de alunos no arquivo: ${STUDENTS_DB.length}`);

    // Remover duplicatas do próprio arquivo (manter apenas a primeira ocorrência de cada RA)
    const uniqueStudentsMap = new Map();
    STUDENTS_DB.forEach(student => {
        if (!uniqueStudentsMap.has(student.ra)) {
            uniqueStudentsMap.set(student.ra, student);
        }
    });

    const uniqueStudents = Array.from(uniqueStudentsMap.values());
    const duplicatesInFile = STUDENTS_DB.length - uniqueStudents.length;

    console.log(`🔍 Duplicatas encontradas no arquivo: ${duplicatesInFile}`);
    console.log(`✨ Alunos únicos no arquivo: ${uniqueStudents.length}\n`);

    // Buscar todos os RAs que já existem no banco
    console.log('🔎 Buscando alunos já cadastrados no banco...');
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('ra');

    if (fetchError) {
        console.error('❌ Erro ao buscar alunos existentes:', fetchError);
        return;
    }

    const existingRAs = new Set(existingStudents?.map(s => s.ra) || []);
    console.log(`📊 Alunos já cadastrados no banco: ${existingRAs.size}`);

    // Filtrar apenas os alunos que ainda não existem
    const studentsToMigrate = uniqueStudents.filter(student => !existingRAs.has(student.ra));
    console.log(`🚀 Alunos a migrar: ${studentsToMigrate.length}\n`);

    if (studentsToMigrate.length === 0) {
        console.log('✅ Todos os alunos únicos já foram migrados!');
        console.log(`\n${'='.repeat(50)}`);
        console.log('📊 RESUMO FINAL:');
        console.log(`${'='.repeat(50)}`);
        console.log(`📚 Total no arquivo original: ${STUDENTS_DB.length}`);
        console.log(`🔄 Duplicatas no arquivo: ${duplicatesInFile}`);
        console.log(`✨ Alunos únicos: ${uniqueStudents.length}`);
        console.log(`💾 Total no banco de dados: ${existingRAs.size}`);
        console.log(`${'='.repeat(50)}\n`);
        return { successCount: 0, errorCount: 0, skipped: existingRAs.size };
    }

    // Migrar em lotes
    const BATCH_SIZE = 50; // Reduzido para evitar problemas
    let successCount = 0;
    let errorCount = 0;

    console.log('⚡ Iniciando migração dos alunos restantes...\n');

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
                console.log(`✅ Lote ${batchNumber}/${Math.ceil(studentsToMigrate.length / BATCH_SIZE)} concluído: ${batch.length} alunos inseridos`);
            }
        } catch (err) {
            console.error(`❌ Exceção no lote ${batchNumber}:`, err);
            errorCount += batch.length;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 RESULTADO DA MIGRAÇÃO:');
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Migrados agora: ${successCount} alunos`);
    console.log(`❌ Erros: ${errorCount} alunos`);
    console.log(`⏭️  Já existiam: ${existingRAs.size} alunos`);
    console.log(`📈 Total no banco: ${existingRAs.size + successCount} alunos`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 RESUMO COMPLETO:');
    console.log(`${'='.repeat(50)}`);
    console.log(`📚 Total no arquivo original: ${STUDENTS_DB.length}`);
    console.log(`🔄 Duplicatas no arquivo: ${duplicatesInFile}`);
    console.log(`✨ Alunos únicos: ${uniqueStudents.length}`);
    console.log(`💾 Total final no banco: ${existingRAs.size + successCount}`);
    console.log(`${'='.repeat(50)}\n`);

    return { successCount, errorCount, skipped: existingRAs.size };
}

// Executar migração
migrateFinalStudents()
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
