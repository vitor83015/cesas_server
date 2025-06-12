import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";
import path from "path";
import fs from "fs";

const writeImage = (doc, imgPath, field) => {
  const maxWidth = doc.page.width - 50;
  const maxHeight = doc.page.height / 3;
  const availableHeight = doc.page.height - doc.y - 50;

  if (availableHeight < maxHeight) {
    doc.addPage();
  }

  try {
    if (!fs.existsSync(imgPath)) throw new Error("Imagem não encontrada: " + imgPath);
    const image = doc.openImage(imgPath);
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const imgWidth = image.width * scale;
    const imgHeight = image.height * scale;

    // Usa a fonte OpenSans nos textos da imagem
    doc.font("OpenSans").fontSize(12);
    doc.text(field);

    doc.image(image, (doc.page.width - imgWidth) / 2, doc.y, {
      width: imgWidth,
    });

    doc.y += imgHeight + 10;
    doc.moveDown();
  } catch (error) {
    doc.font("OpenSans").fontSize(12);
    doc.text(field);
    doc.moveDown();
    doc.fillColor("red").text(`Erro ao carregar imagem: ${error.message}`, { align: "center" });
    doc.fillColor("black");
    doc.moveDown();
  }
};

export const generateStudentPdf = async (student) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffer = new streamBuffers.WritableStreamBuffer();

    doc.pipe(buffer);

    // Registrar e carregar a fonte OpenSans
    const fontPath = path.resolve("src/fonts/OpenSans-VariableFont_wdth,wght.ttf");
    if (fs.existsSync(fontPath)) {
      doc.registerFont("OpenSans", fontPath);
      doc.font("OpenSans"); // Setar a fonte inicial como OpenSans
    } else {
      console.warn("Arquivo da fonte Open Sans não encontrado em:", fontPath);
      // Vai usar a fonte padrão do PDFKit
    }

    // === Desenhar bordas na página ===
    const drawBorders = () => {
      const margin = 20;
      doc.lineWidth(1);
      doc.rect(margin, margin, doc.page.width - 2 * margin, doc.page.height - 2 * margin).stroke();
    };
    drawBorders();

    // === Inserir logo no topo ===
    let logoLoaded = false;
    const tryLogoPaths = [
      path.resolve("src/Logo.png"),
      path.resolve("src/Logo.jpg"),
      path.resolve("src/logo.png"),
      path.resolve("src/logo.jpg"),
    ];

    for (const logoPath of tryLogoPaths) {
      try {
        if (!fs.existsSync(logoPath)) continue;

        const logoImage = doc.openImage(logoPath);

        const logoMaxHeight = 50;
        const scale = logoMaxHeight / logoImage.height;
        const logoWidth = logoImage.width * scale;

        doc.image(logoImage, (doc.page.width - logoWidth) / 2, 30, {
          width: logoWidth,
          height: logoMaxHeight,
        });

        doc.moveDown(2);
        logoLoaded = true;
        break;
      } catch (error) {
        console.error(`Erro ao carregar a logo (${logoPath}):`, error.message);
      }
    }

    if (!logoLoaded) {
      doc.fillColor("red").fontSize(12).text("Logo não encontrada ou falha ao carregar", { align: "center" });
      doc.fillColor("black");
      doc.moveDown(2);
    }

    // === Título ===
    doc.fontSize(20).font("OpenSans").text("Ficha do Aluno", { align: "center" });
    doc.moveDown();

    // === Cabeçalho destacado ===
    const startX = 50;
    const startY = doc.y;
    const headerMargin = 10;

    const headerInfo = [
      `Nome: ${student.name}`,
      `Data de nascimento: ${student.birthDate}`,
      `Turno: ${student.shift}`,
      `Tipo: ${student.applyType}`,
      `CPF: ${student.cpf}`,
    ];

    doc.fontSize(12).fillColor("black").font("OpenSans");

    // Medir altura do bloco do cabeçalho para desenhar retângulo
    const lineHeight = 15;
    const headerHeight = lineHeight * headerInfo.length + headerMargin * 2;
    const headerWidth = doc.page.width - startX * 2;

    // Desenhar retângulo de fundo e borda
    doc.rect(startX - headerMargin, startY - headerMargin, headerWidth + headerMargin * 2, headerHeight).fillAndStroke("#f0f0f0", "black");

    // Escrever as infos dentro do retângulo
    doc.fillColor("black");
    headerInfo.forEach((info, i) => {
      doc.text(info, startX, startY + i * lineHeight);
    });

    doc.y = startY + headerHeight + 20;

    // === Demais campos, sempre com fonte OpenSans ===
    const yesNo = (bool) => (bool ? "Sim" : "Não");

    doc.text(`Já foi estudante: ${yesNo(student.legacyStudent)}`);
    doc.text(`Tem problemas de saúde?: ${yesNo(student.disabledStudent)}`);
    doc.text(`Necessita de exame de classificação ou reclassificação? ${yesNo(student.recordlessStudent)}`);
    if (student.socialName) doc.text(`Nome social: ${student.socialName}`);

    doc.text(`Nacionalidade: ${student.nationality}`);
    doc.text(`Estado: ${student.state}`);
    doc.text(`Número do RG: ${student.idNumber}`);
    doc.text(`Data de expedição do RG: ${student.idExpDate}`);
    doc.text(`Órgão de expedição do RG: ${student.idIssuingBody}`);
    doc.text(`Raça/Etnia: ${student.ethnicity}`);
    doc.text(`CEP: ${student.cep}`);
    doc.text(`Endereço: ${student.address}`);
    doc.text(`Celular: ${student.cellphoneNumber}`);
    doc.text(`Telefone: ${student.landlinePhone}`);
    doc.text(`Telefone de emergência: ${student.emergencyPhone}`);
    doc.text(`Nome do responsável: ${student.responsibleName}`);
    doc.text(`RG do responsável: ${student.responsibleId}`);
    doc.text(`Gênero: ${student.gender}`);

    doc.moveDown();

    // === Imagens adicionais usando writeImage, que também usa OpenSans ===
    if (student.studentPhoto) {
      writeImage(doc, student.studentPhoto, "Foto do estudante:");
    } else {
      doc.font("OpenSans").text("Foto do estudante:");
      doc.moveDown();
      doc.fillColor("red").text("Imagem não encontrada.", { align: "center" });
      doc.fillColor("black");
      doc.moveDown();
    }

    if (student.studentId) {
      writeImage(doc, student.studentId, "Foto do RG do estudante:");
    } else {
      doc.font("OpenSans").text("Foto do RG do estudante:");
      doc.moveDown();
      doc.fillColor("red").text("Imagem não encontrada.", { align: "center" });
      doc.fillColor("black");
      doc.moveDown();
    }

    if (student.studentProofOfResidence) {
      writeImage(doc, student.studentProofOfResidence, "Foto do comprovante de residência:");
    } else {
      doc.font("OpenSans").text("Foto do comprovante de residência:");
      doc.moveDown();
      doc.fillColor("red").text("Imagem não encontrada.", { align: "center" });
      doc.fillColor("black");
      doc.moveDown();
    }

    if (student.studentMedicalReport) {
      writeImage(doc, student.studentMedicalReport, "Laudo médico:");
    } else {
      doc.font("OpenSans").text("Laudo médico:");
      doc.moveDown();
      doc.fillColor("red").text("Imagem não encontrada.", { align: "center" });
      doc.fillColor("black");
      doc.moveDown();
    }

    if (student.studentAcademicRecord) {
      writeImage(doc, student.studentAcademicRecord, "Histórico escolar:");
    } else {
      doc.font("OpenSans").text("Histórico escolar:");
      doc.moveDown();
      doc.fillColor("red").text("Imagem não encontrada.", { align: "center" });
      doc.fillColor("black");
      doc.moveDown();
    }

    doc.end();

    buffer.on("finish", () => resolve(buffer.getContents()));
    buffer.on("error", reject);
  });
};
