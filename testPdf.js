import { generateStudentPdf } from './src/utils/generateStudentPdf.js';
import fs from 'fs';

const student = {
  name: 'João Silva',
  applyType: 'Regular',
  shift: 'Matutino',
  legacyStudent: false,
  disabledStudent: false,
  recordlessStudent: false,
  birthDate: '01/01/2000',
  cpf: '123.456.789-00',
  nationality: 'Brasileiro',
  state: 'DF',
  idNumber: 'MG-12.345.678',
  idExpDate: '01/01/2025',
  idIssuingBody: 'SSP',
  ethnicity: 'Pardo',
  cep: '70000-000',
  address: 'Rua Exemplo, 123',
  cellphoneNumber: '(61) 99999-9999',
  landlinePhone: '(61) 3333-3333',
  emergencyPhone: '(61) 98888-8888',
  responsibleName: 'Maria Silva',
  responsibleId: 'MG-87.654.321',
  gender: 'Masculino',
  // coloque caminhos absolutos para imagens ou deixe vazio
  studentPhoto: '',
  studentId: '',
  studentProofOfResidence: '',
  studentMedicalReport: '',
  studentAcademicRecord: '',
};

(async () => {
  const pdfBuffer = await generateStudentPdf(student);
  fs.writeFileSync('output.pdf', pdfBuffer);
  console.log('PDF gerado: output.pdf');
})();
