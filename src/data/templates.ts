import { EvaluationForm, QuestionType } from '../types';

export const TEMPLATE_FORMS: EvaluationForm[] = [
  {
    id: 'template-tata-surya',
    title: 'Kuis IPA: Sistem Tata Surya (Kelas 6)',
    description: 'Evaluasi pemahaman dasar mengenai matahari, planet-planet, dan benda langit dalam sistem tata surya kita.',
    isQuiz: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        type: QuestionType.MULTIPLE_CHOICE,
        title: 'Planet manakah yang dikenal sebagai "Planet Merah"?',
        required: true,
        points: 20,
        options: [
          { id: 'opt-a', text: 'Venus' },
          { id: 'opt-b', text: 'Mars' },
          { id: 'opt-c', text: 'Yupiter' },
          { id: 'opt-d', text: 'Saturnus' }
        ],
        correctAnswer: 'opt-b'
      },
      {
        id: 'q2',
        type: QuestionType.MULTIPLE_CHOICE,
        title: 'Benda langit apa yang memancarkan cahayanya sendiri dalam tata surya kita?',
        required: true,
        points: 20,
        options: [
          { id: 'opt-q2-a', text: 'Bulan' },
          { id: 'opt-q2-b', text: 'Bintang Jatuh (Meteor)' },
          { id: 'opt-q2-c', text: 'Matahari' },
          { id: 'opt-q2-d', text: 'Komet' }
        ],
        correctAnswer: 'opt-q2-c'
      },
      {
        id: 'q3',
        type: QuestionType.CHECKBOXES,
        title: 'Pilihlah planet yang termasuk dalam kelompok Planet Luar (Gas Raksasa):',
        required: true,
        points: 30,
        options: [
          { id: 'opt-q3-a', text: 'Merkurius' },
          { id: 'opt-q3-b', text: 'Yupiter' },
          { id: 'opt-q3-c', text: 'Saturnus' },
          { id: 'opt-q3-d', text: 'Bumi' }
        ],
        correctAnswer: ['opt-q3-b', 'opt-q3-c']
      },
      {
        id: 'q4',
        type: QuestionType.SHORT_ANSWER,
        title: 'Apa nama galaksi tempat tata surya kita berada?',
        required: true,
        points: 30,
        correctAnswer: 'Bima Sakti'
      }
    ]
  },
  {
    id: 'template-reaksi',
    title: 'Umpan Balik & Refleksi Pembelajaran Siswa',
    description: 'Gunakan formulir ini untuk mengumpulkan pendapat siswa mengenai materi pelajaran minggu ini dan bagian mana yang memerlukan bimbingan ekstra.',
    isQuiz: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'rf1',
        type: QuestionType.MULTIPLE_CHOICE,
        title: 'Bagaimana tingkat pemahamanmu terhadap materi pelajaran minggu ini?',
        required: true,
        points: 0,
        options: [
          { id: 'rf-opt-1', text: 'Sangat Paham' },
          { id: 'rf-opt-2', text: 'Cukup Paham' },
          { id: 'rf-opt-3', text: 'Kurang Paham' },
          { id: 'rf-opt-4', text: 'Sangat Tidak Paham' }
        ]
      },
      {
        id: 'rf2',
        type: QuestionType.CHECKBOXES,
        title: 'Metode belajar apa saja yang paling membantumu belajar minggu ini?',
        required: false,
        points: 0,
        options: [
          { id: 'rf-opt2-1', text: 'Membaca Buku Teks / Handout' },
          { id: 'rf-opt2-2', text: 'Menonton Video Pembelajaran' },
          { id: 'rf-opt2-3', text: 'Diskusi Kelompok' },
          { id: 'rf-opt2-4', text: 'Latihan Soal Mandiri' }
        ]
      },
      {
        id: 'rf3',
        type: QuestionType.PARAGRAPH,
        title: 'Jelaskan konsep yang menurutmu paling sulit dipahami dan mengapa?',
        required: true,
        points: 0
      }
    ]
  }
];
