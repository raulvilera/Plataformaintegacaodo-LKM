function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const ss = SpreadsheetApp.getActiveSpreadsheet();

        let sheetName = "";
        let values = [];

        if (data.source === 'gestao') {
            sheetName = "BANCODEALUNOS";
            // Mapeamento: NOME, SÉRIE, PROFESSOR, RA, DISCIPLINA, DATA DO REGISTRO/HORA, DESCRIÇÃO, URL DO DOCUMENTO, DATA DE RETORNO
            values = [
                data.studentName,
                data.classRoom,
                data.professorName,
                data.ra,
                data.discipline,
                data.registerDate || (data.date + " " + (data.time || "")),
                data.description,
                data.documentUrl || "",
                data.returnDate || ""
            ];
        } else {
            sheetName = "OCORRENCIASDOSPROFESSORES";
            // Mapeamento: DATA, PROFESSOR, TURMA, ALUNO, RA, DISCIPLINA, IRREGULARIDADES, DESCRIÇÃO
            values = [
                data.date,
                data.professorName,
                data.classRoom,
                data.studentName,
                data.ra,
                data.discipline,
                data.irregularities,
                data.description
            ];
        }

        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            return ContentService.createTextOutput(JSON.stringify({
                "result": "error",
                "error": "Aba " + sheetName + " não encontrada"
            })).setMimeType(ContentService.MimeType.JSON);
        }

        sheet.appendRow(values);

        return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            "result": "error",
            "error": error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
