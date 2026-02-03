import { jsPDF } from "jspdf";
import { Incident } from "../types";

const LOGO_LEFT_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjykf2XR5oaSfsFcRACAhTy496azPL_xCqxQURFdyxG3NL1xrNYzuEFKVEZMoQu-nmAIzVlZNbqKx57OOPSTdvZY6E-eXvEtYq-93aFE8Z0t_P0QzHdO1TU4hib3YbXPOvKnI93fFDtNBMDRJBg5XMHK2vE9xHgVG9rmYyB4l8WJcJhCPJA1pCben6Vf5F2/s231/Capturar.PNG";
const LOGO_RIGHT_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqAsB6ThMLLLLsuZ2yx8qAn8Koh4k4naDt3dSMtnPRxb_wWFP84Ve5mnuUTBLP2COJAi8cfYMRrN0qWKyUFJV8pjQXbhrLb2yc2K8mJ5qsqsSCor4fJcdl2IDn-Xtqtqc31I-5_BWai_JljBZIMRVr-SB5vW04GE8gefLARCWrun9gIx10lkCVN6coAV24/s229/images-removebg-preview.png";

const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
};

export const generateIncidentPDF = async (incident: Incident, action: 'view' | 'download' = 'download') => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Pré-carregamento das imagens
  let logoLeftBase64 = "";
  let logoRightBase64 = "";

  try {
    logoLeftBase64 = await getBase64Image(LOGO_LEFT_URL);
  } catch (e) {
    console.warn("Falha ao carregar logo esquerda:", e);
  }

  try {
    logoRightBase64 = await getBase64Image(LOGO_RIGHT_URL);
  } catch (e) {
    console.warn("Falha ao carregar logo direita:", e);
  }

  // Imagem Superior Esquerda
  if (logoLeftBase64) {
    try {
      doc.addImage(logoLeftBase64, 'PNG', margin, 10, 25, 25);
    } catch (e) {
      console.warn("Erro ao inserir logo esquerda no PDF:", e);
    }
  }

  // Imagem Inferior Direita
  if (logoRightBase64) {
    try {
      doc.addImage(logoRightBase64, 'PNG', pageWidth - margin - 30, pageHeight - 40, 30, 30);
    } catch (e) {
      console.warn("Erro ao inserir logo direita no PDF:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const textX = margin + 30;
  doc.text("ESTADO DE SÃO PAULO", textX, 20);
  doc.setFontSize(12);
  doc.text("SECRETARIA DA EDUCAÇÃO", textX, 26);
  doc.text("EE LYDIA KITZ MOREIRA", textX, 32);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  // Dados de endereço e telefone atualizados conforme solicitação
  doc.text("R. Dorezopolis, 294 - Jardim Santa Clara, Guarulhos - SP, 07123-120", textX, 38);
  doc.text("Telefone: (11) 2403-3105", textX, 42);

  doc.setLineWidth(0.5);
  doc.line(margin, 48, pageWidth - margin, 48);

  // Título do Documento
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const title = incident.category === "SUSPENSÃO" ? "TERMO DE SUSPENSÃO DISCIPLINAR" : "REGISTRO DE OCORRÊNCIA ESCOLAR";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 60);

  // Dados do Aluno
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO ALUNO:", margin, 75);

  doc.setFont("helvetica", "normal");
  doc.text(`NOME: ${incident.studentName}`, margin, 82);
  doc.text(`RA: ${incident.ra || 'N/A'}`, margin, 87);
  doc.text(`SÉRIE/TURMA: ${incident.classRoom}`, margin, 92);

  // Detalhes da Ocorrência
  doc.setFont("helvetica", "bold");
  doc.text("DETALHES DO EVENTO:", margin, 105);

  doc.setFont("helvetica", "normal");
  doc.text(`DATA DO OCORRIDO: ${incident.date}`, margin, 112);
  doc.text(`HORÁRIO: ${incident.time || 'N/A'}`, margin + 80, 112);
  doc.text(`PROFESSOR/RESPONSÁVEL: ${incident.professorName}`, margin, 117);
  doc.text(`DISCIPLINA: ${incident.discipline || 'N/A'}`, margin, 122);

  // Relato
  doc.setFont("helvetica", "bold");
  doc.text("RELATO DOS FATOS:", margin, 135);
  doc.setFont("helvetica", "normal");
  const splitDescription = doc.splitTextToSize(incident.description, pageWidth - (margin * 2));
  doc.text(splitDescription, margin, 142);

  // Medida Aplicada
  const currentY = 142 + (splitDescription.length * 5) + 10;
  doc.setFont("helvetica", "bold");
  doc.text("MEDIDA APLICADA / CONDUTA:", margin, currentY);
  doc.setFont("helvetica", "normal");

  let measureText = incident.category === "SUSPENSÃO"
    ? `SUSPENSÃO DISCIPLINAR COM RETORNO PREVISTO PARA: ${incident.returnDate || '___/___/___'}`
    : "ADVERTÊNCIA E REGISTRO EM PRONTUÁRIO ESCOLAR.";

  if (incident.irregularities && incident.irregularities !== "NENHUMA") {
    measureText += `\nIRREGULARIDADES: ${incident.irregularities}`;
  }

  const splitMeasure = doc.splitTextToSize(measureText, pageWidth - (margin * 2));
  doc.text(splitMeasure, margin, currentY + 7);

  // Assinaturas
  const footerY = 240;
  doc.setLineWidth(0.2);

  doc.line(margin, footerY, margin + 70, footerY);
  doc.text("Assinatura do Aluno", margin + 10, footerY + 5);

  doc.line(pageWidth - margin - 70, footerY, pageWidth - margin, footerY);
  doc.text("Assinatura do Responsável", pageWidth - margin - 65, footerY + 5);

  doc.line((pageWidth / 2) - 35, footerY + 25, (pageWidth / 2) + 35, footerY + 25);
  doc.text("Direção / Gestão Escolar", (pageWidth / 2) - 20, footerY + 30);

  // Data do Registro
  doc.setFontSize(8);
  doc.text(`Guarulhos, ${incident.date} - Registro gerado via Sistema de Gestão LKM`, margin, 285);

  const fileName = `Ocorrencia_${incident.studentName.replace(/\s+/g, '_')}_${incident.date.replace(/\//g, '-')}.pdf`;

  if (action === 'view') {
    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
  } else {
    doc.save(fileName);
  }
};