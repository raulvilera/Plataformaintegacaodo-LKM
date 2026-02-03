import { supabase } from './supabaseClient';
import { STUDENTS_DB } from '../studentsData';

/**
 * Script para migrar dados de alunos para o Supabase
 * Executa inserção em lotes para melhor performance
 */
export async function migrateStudents() {
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    console.log(`Iniciando migração de ${STUDENTS_DB.length} alunos...`);

    for (let i = 0; i < STUDENTS_DB.length; i += BATCH_SIZE) {
        const batch = STUDENTS_DB.slice(i, i + BATCH_SIZE);

        try {
            const { data, error } = await supabase
                .from('students')
                .insert(batch)
                .select();

            if (error) {
                console.error(`Erro no lote ${i / BATCH_SIZE + 1}:`, error);
                errorCount += batch.length;
            } else {
                successCount += batch.length;
                console.log(`Lote ${i / BATCH_SIZE + 1} concluído: ${batch.length} alunos inseridos`);
            }
        } catch (err) {
            console.error(`Exceção no lote ${i / BATCH_SIZE + 1}:`, err);
            errorCount += batch.length;
        }
    }

    console.log(`\nMigração concluída:`);
    console.log(`- Sucesso: ${successCount} alunos`);
    console.log(`- Erros: ${errorCount} alunos`);

    return { successCount, errorCount };
}

// Executar se chamado diretamente
if (require.main === module) {
    migrateStudents()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Erro fatal:', err);
            process.exit(1);
        });
}
