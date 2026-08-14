import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionOption, MatchingPair } from '../types';

/**
 * Downloads a standardized Excel template for Bulk Question Upload
 */
export function downloadQuestionTemplateExcel() {
  const templateData = [
    {
      'No': 1,
      'Jenis Soal': 'PG',
      'Pertanyaan': 'Apa ibu kota negara Indonesia?',
      'Pilihan A': 'Bandung',
      'Pilihan B': 'Jakarta',
      'Pilihan C': 'Surabaya',
      'Pilihan D': 'Medan',
      'Kunci Jawaban': 'B',
      'Poin': 10,
      'Sisi Kanan (Menjodohkan)': ''
    },
    {
      'No': 2,
      'Jenis Soal': 'CHECKBOXES',
      'Pertanyaan': 'Pilih kota yang terletak di pulau Jawa! (Pilih lebih dari satu)',
      'Pilihan A': 'Bandung',
      'Pilihan B': 'Denpasar',
      'Pilihan C': 'Semarang',
      'Pilihan D': 'Medan',
      'Kunci Jawaban': 'A, C',
      'Poin': 10,
      'Sisi Kanan (Menjodohkan)': ''
    },
    {
      'No': 3,
      'Jenis Soal': 'SHORT_ANSWER',
      'Pertanyaan': 'Berapakah hasil dari 15 x 4?',
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': '60',
      'Poin': 10,
      'Sisi Kanan (Menjodohkan)': ''
    },
    {
      'No': 4,
      'Jenis Soal': 'PARAGRAPH',
      'Pertanyaan': 'Jelaskan secara singkat proses terjadinya hujan (siklus air)!',
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': '',
      'Poin': 20,
      'Sisi Kanan (Menjodohkan)': ''
    },
    {
      'No': 5,
      'Jenis Soal': 'MATCHING',
      'Pertanyaan': 'Jodohkan negara berikut dengan ibu kotanya:',
      'Pilihan A': 'Indonesia',
      'Pilihan B': 'Jepang',
      'Pilihan C': 'Prancis',
      'Pilihan D': 'Inggris',
      'Kunci Jawaban': 'Jakarta, Tokyo, Paris, London',
      'Poin': 20,
      'Sisi Kanan (Menjodohkan)': 'Jakarta, Tokyo, Paris, London'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Auto column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 15 }, // Jenis Soal
    { wch: 45 }, // Pertanyaan
    { wch: 20 }, // Pilihan A
    { wch: 20 }, // Pilihan B
    { wch: 20 }, // Pilihan C
    { wch: 20 }, // Pilihan D
    { wch: 25 }, // Kunci Jawaban
    { wch: 8 },  // Poin
    { wch: 35 }  // Sisi Kanan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal');

  // Add Instructions Sheet
  const instructionsData = [
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '1. Jenis Soal yang didukung: PG (Pilihan Ganda), CHECKBOXES (Kotak Centang), SHORT_ANSWER (Isian Singkat), PARAGRAPH (Essay), MATCHING (Menjodohkan).' },
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '2. Untuk PG: Isi Pilihan A s/d D. Kunci Jawaban diisi dengan huruf pilihan (misal: A, B, C, atau D).' },
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '3. Untuk CHECKBOXES: Kunci Jawaban diisi dengan huruf-huruf yang benar dipisahkan koma (misal: A, C).' },
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '4. Untuk SHORT_ANSWER: Isi teks/angka kunci jawaban yang benar.' },
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '5. Untuk MATCHING: Isi Pilihan A, B, C, D sebagai item kiri, lalu isi Sisi Kanan (Menjodohkan) secara berurutan dipisahkan koma (misal: Jakarta, Tokyo, Paris).' },
    { 'PETUNJUK PENGISIAN TEMPLATE SOAL EVALUASI': '6. Poin diisi angka positif (default: 10).' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Petunjuk Pengisian');

  XLSX.writeFile(workbook, 'Template_Soal_Evaluasi_Pembelajaran.xlsx');
}

/**
 * Downloads a simple Text / Word template guide file
 */
export function downloadQuestionTemplateWord() {
  const content = `=====================================================
PETUNJUK & FORMAT TEMPLATE SOAL WORD / TEKS BIASA
Aplikasi Evaluasi Pembelajaran (Kuis Sekolah)
=====================================================

Anda dapat menyalin teks berformat di bawah ini, mengeditnya di Microsoft Word atau Notepad, lalu menempelkannya (paste) ke dalam aplikasi pada menu "Unggah Soal Massal -> Teks / Word".

-----------------------------------------------------
CONTOH FORMAT SOAL PILIHAN GANDA (PG):
-----------------------------------------------------
1. Apa nama ibu kota negara Indonesia?
A. Bandung
B. Jakarta
C. Surabaya
D. Medan
Kunci: B
Poin: 10

2. Planet terbesar dalam sistem tata surya kita adalah...
A. Mars
B. Bumi
C. Yupiter
D. Saturnus
Kunci: C
Poin: 10

-----------------------------------------------------
CONTOH FORMAT SOAL ISIAN SINGKAT (SHORT_ANSWER):
-----------------------------------------------------
3. Berapakah hasil dari 25 x 4?
Kunci: 100
Poin: 10

-----------------------------------------------------
CONTOH FORMAT SOAL ESSAY / PARAGRAF:
-----------------------------------------------------
4. Jelaskan secara singkat penyebab terjadinya peristiwa Sumpah Pemuda pada tahun 1928!
Poin: 20

-----------------------------------------------------
CONTOH FORMAT SOAL MENJODOHKAN (MATCHING):
-----------------------------------------------------
5. Jodohkan nama negara berikut dengan nama ibu kotanya:
Indonesia = Jakarta
Jepang = Tokyo
Prancis = Paris
Inggris = London
Poin: 20
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Format_Soal_Word_Teks.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded Excel File (.xlsx or .csv) into Question objects
 */
export async function parseQuestionExcelFile(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const parsedQuestions: Question[] = [];

        rawRows.forEach((row, idx) => {
          const rawType = String(row['Jenis Soal'] || row['JENIS SOAL'] || row['Type'] || 'PG').trim().toUpperCase();
          const title = String(row['Pertanyaan'] || row['PERTANYAAN'] || row['Question'] || '').trim();

          if (!title) return; // skip empty rows

          let type: QuestionType = QuestionType.MULTIPLE_CHOICE;
          if (rawType.includes('CHECKBOX') || rawType.includes('CENTANG')) {
            type = QuestionType.CHECKBOXES;
          } else if (rawType.includes('SHORT') || rawType.includes('ISIAN') || rawType.includes('SINGKAT')) {
            type = QuestionType.SHORT_ANSWER;
          } else if (rawType.includes('PARA') || rawType.includes('ESSAY') || rawType.includes('URAIAN')) {
            type = QuestionType.PARAGRAPH;
          } else if (rawType.includes('MATCH') || rawType.includes('JODOH')) {
            type = QuestionType.MATCHING;
          }

          const points = Number(row['Poin'] || row['POIN'] || row['Points']) || 10;
          const rawKey = String(row['Kunci Jawaban'] || row['KUNCI JAWABAN'] || row['Kunci'] || '').trim();

          let options: QuestionOption[] | undefined = undefined;
          let matchingPairs: MatchingPair[] | undefined = undefined;
          let correctAnswer: any = '';

          if (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES) {
            const optA = String(row['Pilihan A'] || row['A'] || '').trim();
            const optB = String(row['Pilihan B'] || row['B'] || '').trim();
            const optC = String(row['Pilihan C'] || row['C'] || '').trim();
            const optD = String(row['Pilihan D'] || row['D'] || '').trim();

            const rawOptions = [optA, optB, optC, optD].filter(Boolean);
            options = rawOptions.map((text, i) => ({
              id: `opt-${Math.random().toString(36).substr(2, 6)}-${i}`,
              text
            }));

            if (type === QuestionType.MULTIPLE_CHOICE) {
              // Convert letter A, B, C, D to Option ID
              const letterIndex = ['A', 'B', 'C', 'D'].indexOf(rawKey.toUpperCase());
              if (letterIndex !== -1 && options[letterIndex]) {
                correctAnswer = options[letterIndex].id;
              } else {
                // If typed raw text, find matching option
                const matchedOpt = options.find(o => o.text.toLowerCase() === rawKey.toLowerCase());
                correctAnswer = matchedOpt ? matchedOpt.id : (options[0]?.id || '');
              }
            } else {
              // Checkboxes answer array
              const keys = rawKey.split(',').map(s => s.trim().toUpperCase());
              const selectedIds: string[] = [];
              keys.forEach(k => {
                const letterIndex = ['A', 'B', 'C', 'D'].indexOf(k);
                if (letterIndex !== -1 && options![letterIndex]) {
                  selectedIds.push(options![letterIndex].id);
                }
              });
              correctAnswer = selectedIds;
            }
          } else if (type === QuestionType.MATCHING) {
            const optA = String(row['Pilihan A'] || row['A'] || '').trim();
            const optB = String(row['Pilihan B'] || row['B'] || '').trim();
            const optC = String(row['Pilihan C'] || row['C'] || '').trim();
            const optD = String(row['Pilihan D'] || row['D'] || '').trim();

            const leftItems = [optA, optB, optC, optD].filter(Boolean);
            
            const rawRights = String(row['Sisi Kanan (Menjodohkan)'] || row['Sisi Kanan'] || rawKey).split(',');
            const rightItems = rawRights.map(r => r.trim()).filter(Boolean);

            matchingPairs = leftItems.map((leftText, i) => ({
              id: `pair-${Math.random().toString(36).substr(2, 6)}-${i}`,
              left: leftText,
              right: rightItems[i] || `Jawaban ${i + 1}`
            }));

            correctAnswer = {};
          } else {
            // Short Answer / Paragraph
            correctAnswer = rawKey;
          }

          parsedQuestions.push({
            id: `q-excel-${Math.random().toString(36).substr(2, 7)}-${idx}`,
            type,
            title,
            required: true,
            points,
            options,
            matchingPairs,
            correctAnswer
          });
        });

        resolve(parsedQuestions);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses copy-pasted text (from Word / Notepad / Text) into Question objects
 */
export function parseQuestionFromText(text: string): Question[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions: Question[] = [];

  let currentTitle = '';
  let currentType: QuestionType = QuestionType.MULTIPLE_CHOICE;
  let optionsText: { letter: string; text: string }[] = [];
  let keyText = '';
  let points = 10;
  let matchingPairsList: { left: string; right: string }[] = [];

  const finalizeQuestion = () => {
    if (!currentTitle) return;

    let options: QuestionOption[] | undefined = undefined;
    let matchingPairs: MatchingPair[] | undefined = undefined;
    let correctAnswer: any = '';

    if (matchingPairsList.length > 0) {
      currentType = QuestionType.MATCHING;
      matchingPairs = matchingPairsList.map((p, idx) => ({
        id: `pair-${Math.random().toString(36).substr(2, 6)}-${idx}`,
        left: p.left,
        right: p.right
      }));
      correctAnswer = {};
    } else if (optionsText.length > 0) {
      options = optionsText.map((o, idx) => ({
        id: `opt-${Math.random().toString(36).substr(2, 6)}-${idx}`,
        text: o.text
      }));

      if (currentType === QuestionType.CHECKBOXES) {
        const keys = keyText.split(',').map(k => k.trim().toUpperCase());
        correctAnswer = keys.map(k => {
          const found = optionsText.findIndex(o => o.letter === k);
          return found !== -1 ? options![found].id : null;
        }).filter(Boolean);
      } else {
        const found = optionsText.findIndex(o => o.letter === keyText.toUpperCase());
        if (found !== -1 && options[found]) {
          correctAnswer = options[found].id;
        } else {
          correctAnswer = options[0]?.id || '';
        }
      }
    } else {
      if (!currentType || currentType === QuestionType.MULTIPLE_CHOICE) {
        currentType = QuestionType.SHORT_ANSWER;
      }
      correctAnswer = keyText;
    }

    questions.push({
      id: `q-text-${Math.random().toString(36).substr(2, 7)}-${questions.length}`,
      type: currentType,
      title: currentTitle,
      required: true,
      points,
      options,
      matchingPairs,
      correctAnswer
    });

    // Reset
    currentTitle = '';
    currentType = QuestionType.MULTIPLE_CHOICE;
    optionsText = [];
    keyText = '';
    points = 10;
    matchingPairsList = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check line for Question Title start (e.g. "1. ", "2) ", "Soal 1:")
    const qNumMatch = line.match(/^(\d+[\.\)]|Soal \d+:?)\s*(.+)/i);
    if (qNumMatch) {
      finalizeQuestion();
      currentTitle = qNumMatch[2].trim();
      continue;
    }

    // Check matching line (e.g. "Indonesia = Jakarta")
    if (line.includes('=')) {
      const parts = line.split('=');
      if (parts.length === 2 && currentTitle) {
        matchingPairsList.push({
          left: parts[0].trim(),
          right: parts[1].trim()
        });
        continue;
      }
    }

    // Check option choice (e.g. "A. Bandung", "b) Jakarta")
    const optMatch = line.match(/^([A-Da-d])[\.\)]\s*(.+)/);
    if (optMatch) {
      optionsText.push({
        letter: optMatch[1].toUpperCase(),
        text: optMatch[2].trim()
      });
      continue;
    }

    // Check Key Answer line (e.g. "Kunci: B", "Jawaban: A, C")
    const keyMatch = line.match(/^(Kunci|Jawaban|Answer):\s*(.+)/i);
    if (keyMatch) {
      keyText = keyMatch[2].trim();
      if (keyText.includes(',')) {
        currentType = QuestionType.CHECKBOXES;
      }
      continue;
    }

    // Check Points line (e.g. "Poin: 15")
    const pointMatch = line.match(/^(Poin|Points|Skor):\s*(\d+)/i);
    if (pointMatch) {
      points = Number(pointMatch[2]) || 10;
      continue;
    }

    // If continuation of question title
    if (!currentTitle) {
      currentTitle = line;
    } else if (optionsText.length === 0 && matchingPairsList.length === 0) {
      currentTitle += ' ' + line;
    }
  }

  finalizeQuestion();
  return questions;
}
