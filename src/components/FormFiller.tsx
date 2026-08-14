import React, { useState } from 'react';
import { 
  User, CheckCircle2, AlertTriangle, ArrowLeft, 
  Send, HelpCircle, GraduationCap, XCircle, ChevronRight, CheckSquare
} from 'lucide-react';
import { EvaluationForm, StudentAnswer, StudentResponse, QuestionType } from '../types';

interface FormFillerProps {
  form: EvaluationForm;
  onSubmit: (response: StudentResponse) => void;
  onBackToEdit: () => void;
}

export default function FormFiller({ form, onSubmit, onBackToEdit }: FormFillerProps) {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [answers, setAnswers] = useState<StudentAnswer[]>(
    form.questions.map(q => ({
      questionId: q.id,
      value: q.type === QuestionType.CHECKBOXES ? [] : (q.type === QuestionType.MATCHING ? {} : '')
    }))
  );
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<StudentResponse | null>(null);

  // Shuffle matching right-side options once per form load
  const shuffledMatches = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    form.questions.forEach(q => {
      if (q.type === QuestionType.MATCHING && q.matchingPairs) {
        const rights = q.matchingPairs.map(p => p.right).filter(Boolean);
        // Shuffle rights
        const shuffled = [...rights].sort(() => Math.random() - 0.5);
        map[q.id] = shuffled;
      }
    });
    return map;
  }, [form]);

  // Handle single value answer changes (MC, Short Answer, Paragraph)
  const handleValueChange = (questionId: string, value: string) => {
    setAnswers(prev => 
      prev.map(ans => 
        ans.questionId === questionId ? { ...ans, value } : ans
      )
    );
    // Clear validation error if any
    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Handle multi value answer changes (Checkboxes)
  const handleCheckboxChange = (questionId: string, optionId: string) => {
    setAnswers(prev => 
      prev.map(ans => {
        if (ans.questionId === questionId) {
          const currentList = Array.isArray(ans.value) ? ans.value : [];
          const newList = currentList.includes(optionId)
            ? currentList.filter(id => id !== optionId)
            : [...currentList, optionId];
          return { ...ans, value: newList };
        }
        return ans;
      })
    );

    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Handle matching answer changes
  const handleMatchingChange = (questionId: string, pairId: string, selectedRight: string) => {
    setAnswers(prev => 
      prev.map(ans => {
        if (ans.questionId === questionId) {
          const currentMap = (ans.value && typeof ans.value === 'object' && !Array.isArray(ans.value))
            ? { ...(ans.value as Record<string, string>) }
            : {};
          currentMap[pairId] = selectedRight;
          return { ...ans, value: currentMap };
        }
        return ans;
      })
    );

    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Grade the evaluation
  const calculateScore = (submittedAnswers: StudentAnswer[]) => {
    let score = 0;
    let totalPointsPossible = 0;

    form.questions.forEach(q => {
      totalPointsPossible += q.points;
      const studentAns = submittedAnswers.find(ans => ans.questionId === q.id);
      if (!studentAns) return;

      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (studentAns.value === q.correctAnswer) {
          score += q.points;
        }
      } else if (q.type === QuestionType.CHECKBOXES) {
        // Compare sorted arrays
        const studentList = Array.isArray(studentAns.value) ? [...studentAns.value].sort() : [];
        const correctList = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
        
        const isCorrect = studentList.length === correctList.length && 
          studentList.every((val, idx) => val === correctList[idx]);
        
        if (isCorrect) {
          score += q.points;
        }
      } else if (q.type === QuestionType.SHORT_ANSWER) {
        const studentText = typeof studentAns.value === 'string' ? studentAns.value.trim().toLowerCase() : '';
        const correctText = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '';
        if (studentText && studentText === correctText) {
          score += q.points;
        }
      } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
        const studentMap = (studentAns.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns.value))
          ? studentAns.value as Record<string, string>
          : {};
        
        let correctCount = 0;
        q.matchingPairs.forEach(pair => {
          if (studentMap[pair.id] === pair.right) {
            correctCount++;
          }
        });

        if (q.matchingPairs.length > 0) {
          const ratio = correctCount / q.matchingPairs.length;
          const pairScore = Math.round(q.points * ratio);
          score += pairScore;
        }
      }
    });

    return { score, totalPointsPossible };
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // Validate Student Metadata
    if (!studentName.trim()) {
      errors['studentName'] = 'Nama lengkap wajib diisi.';
    }

    // Validate Required Questions
    form.questions.forEach(q => {
      const studentAns = answers.find(ans => ans.questionId === q.id);
      
      let isAnswerEmpty = false;
      if (!studentAns) {
        isAnswerEmpty = true;
      } else if (q.type === QuestionType.CHECKBOXES) {
        isAnswerEmpty = !Array.isArray(studentAns.value) || studentAns.value.length === 0;
      } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
        const studentMap = (studentAns.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns.value))
          ? (studentAns.value as Record<string, string>)
          : {};
        // Required matches means they must answer AT LEAST ONE, or let's say they must match ALL pairs
        isAnswerEmpty = q.matchingPairs.some(pair => !studentMap[pair.id]);
      } else {
        isAnswerEmpty = typeof studentAns.value === 'string' && studentAns.value.trim() === '';
      }

      if (q.required && isAnswerEmpty) {
        errors[q.id] = q.type === QuestionType.MATCHING 
          ? 'Mohon jodohkan seluruh item yang tersedia.' 
          : 'Pertanyaan ini wajib dijawab.';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(`filler-card-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Process Submission
    const scoreDetails = form.isQuiz ? calculateScore(answers) : { score: undefined, totalPointsPossible: undefined };

    const submission: StudentResponse = {
      id: `resp-${Math.random().toString(36).substr(2, 9)}`,
      formId: form.id,
      studentName: studentName.trim(),
      studentId: studentId.trim() || undefined,
      answers,
      submittedAt: new Date().toISOString(),
      ...scoreDetails
    };

    setSubmissionResult(submission);
    setIsSubmitted(true);
    onSubmit(submission);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to determine if a question was answered correctly in the final review
  const isQuestionCorrect = (qId: string) => {
    if (!submissionResult) return false;
    const q = form.questions.find(item => item.id === qId);
    const ans = submissionResult.answers.find(item => item.questionId === qId);
    if (!q || !ans) return false;

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      return ans.value === q.correctAnswer;
    } else if (q.type === QuestionType.CHECKBOXES) {
      const sList = Array.isArray(ans.value) ? [...ans.value].sort() : [];
      const cList = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
      return sList.length === cList.length && sList.every((val, idx) => val === cList[idx]);
    } else if (q.type === QuestionType.SHORT_ANSWER) {
      const sVal = typeof ans.value === 'string' ? ans.value.trim().toLowerCase() : '';
      const cVal = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '';
      return sVal === cVal;
    } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
      const studentMap = (ans.value && typeof ans.value === 'object' && !Array.isArray(ans.value))
        ? (ans.value as Record<string, string>)
        : {};
      return q.matchingPairs.every(pair => studentMap[pair.id] === pair.right);
    }
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      {!isSubmitted && (
        <button
          id="back-to-editor-btn"
          onClick={onBackToEdit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Editor Soal</span>
        </button>
      )}

      {/* SUBMISSION SUCCESS / GRADING SCREEN */}
      {isSubmitted && submissionResult ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Success Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Evaluasi Selesai Dikirim!</h2>
              <p className="text-slate-500 text-sm">
                Terima kasih, <strong className="text-slate-700">{submissionResult.studentName}</strong>. Jawaban Anda telah direkam dengan sukses.
              </p>
            </div>

            {/* Quiz Results Score Circle */}
            {form.isQuiz && submissionResult.score !== undefined && (
              <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto border border-slate-100">
                <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Nilai Hasil Kuis</span>
                </div>
                <div className="text-4xl font-black text-slate-800 mb-1">
                  {submissionResult.score} <span className="text-xl text-slate-400 font-medium">/ {submissionResult.totalPointsPossible}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Akurasi: {Math.round((submissionResult.score / (submissionResult.totalPointsPossible || 1)) * 100)}%
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-3">
              <button
                id="redo-submission-btn"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmissionResult(null);
                  setAnswers(form.questions.map(q => ({
                    questionId: q.id,
                    value: q.type === QuestionType.CHECKBOXES ? [] : (q.type === QuestionType.MATCHING ? {} : '')
                  })));
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Kirim Jawaban Lain
              </button>
              <button
                id="edit-again-success"
                onClick={onBackToEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Kembali ke Form Builder
              </button>
            </div>
          </div>

          {/* QUIZ REVIEW PANEL (ONLY IF IS QUIZ) */}
          {form.isQuiz && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">Tinjauan Hasil & Koreksi Soal</h3>
              
              {form.questions.map((q, index) => {
                const correct = isQuestionCorrect(q.id);
                const studentAns = submissionResult.answers.find(ans => ans.questionId === q.id);
                
                return (
                  <div 
                    key={q.id}
                    id={`review-card-${q.id}`}
                    className={`bg-white rounded-xl border p-5 space-y-4 transition-all ${
                      q.points === 0 
                        ? 'border-slate-100' 
                        : correct 
                          ? 'border-emerald-200 ring-2 ring-emerald-500/5 bg-emerald-50/10' 
                          : 'border-red-200 ring-2 ring-red-500/5 bg-red-50/10'
                    }`}
                  >
                    {/* Header: Status & Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                        {q.points === 0 ? (
                          <span className="text-slate-500">Materi Non-Quiz</span>
                        ) : correct ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Benar
                          </span>
                        ) : (
                          <span className="text-red-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-600" /> Salah
                          </span>
                        )}
                      </div>
                      {q.points > 0 && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          Skor: {correct ? q.points : 0} / {q.points} pt
                        </span>
                      )}
                    </div>

                    {/* Question Title */}
                    <p className="text-sm font-bold text-slate-800">
                      {index + 1}. {q.title}
                    </p>

                    {/* Display MC / Checkbox options review */}
                    {q.options && (
                      <div className="space-y-2 pl-1.5">
                        {q.options.map((opt) => {
                          const isSelected = q.type === QuestionType.MULTIPLE_CHOICE
                            ? studentAns?.value === opt.id
                            : Array.isArray(studentAns?.value) && studentAns.value.includes(opt.id);

                          const isCorrectOpt = q.type === QuestionType.MULTIPLE_CHOICE
                            ? q.correctAnswer === opt.id
                            : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id);

                          return (
                            <div 
                              key={opt.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs ${
                                isCorrectOpt 
                                  ? 'bg-emerald-50 text-emerald-900 font-medium border border-emerald-100' 
                                  : isSelected 
                                    ? 'bg-red-50 text-red-900 border border-red-100' 
                                    : 'text-slate-600'
                              }`}
                            >
                              <div className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center border ${
                                isCorrectOpt 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : isSelected 
                                    ? 'bg-red-500 border-red-500 text-white' 
                                    : 'border-slate-300'
                              }`}>
                                {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                {isSelected && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className="grow">{opt.text}</span>
                              {isCorrectOpt && <span className="text-3xs font-extrabold uppercase bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-sm">Jawaban Kunci</span>}
                              {isSelected && !isCorrectOpt && <span className="text-3xs font-extrabold uppercase bg-red-200 text-red-800 px-1.5 py-0.5 rounded-sm">Pilihan Anda</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer review */}
                    {q.type === QuestionType.SHORT_ANSWER && (
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        <p className="text-xs text-slate-600">
                          <strong>Jawaban Anda:</strong>{' '}
                          <span className={correct ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                            {studentAns?.value as string || '(Kosong)'}
                          </span>
                        </p>
                        {!correct && (
                          <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-md inline-block border border-emerald-100">
                            <strong>Kunci Jawaban yang Benar:</strong> {q.correctAnswer as string}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Essay/Paragraph review */}
                    {q.type === QuestionType.PARAGRAPH && (
                      <div className="pl-2 border-l-2 border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Jawaban Essay Anda:</p>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                          {studentAns?.value as string || '(Tidak diisi)'}
                        </p>
                        <p className="text-3xs text-slate-400 italic mt-1.5">
                          *Pertanyaan tipe Essay memerlukan penilaian manual langsung oleh Guru.
                        </p>
                      </div>
                    )}

                    {/* Matching review */}
                    {q.type === QuestionType.MATCHING && q.matchingPairs && (
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Hasil Menjodohkan Anda:</p>
                        <div className="space-y-1.5">
                          {q.matchingPairs.map((pair) => {
                            const studentMap = (studentAns?.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns.value))
                              ? (studentAns.value as Record<string, string>)
                              : {};
                            const matchedVal = studentMap[pair.id] || '(Belum Dijawab)';
                            const isPairCorrect = matchedVal === pair.right;

                            return (
                              <div 
                                key={pair.id} 
                                className={`flex flex-wrap items-center gap-2 p-2 rounded-lg text-xs ${
                                  isPairCorrect 
                                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' 
                                    : 'bg-red-50 text-red-900 border border-red-100'
                                }`}
                              >
                                <span className="font-bold">{pair.left}</span>
                                <span className="text-slate-400">⇔</span>
                                <span className="font-semibold">{matchedVal}</span>
                                
                                <div className="ml-auto flex items-center gap-1">
                                  {isPairCorrect ? (
                                    <span className="text-3xs font-extrabold uppercase bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Benar
                                    </span>
                                  ) : (
                                    <span className="text-3xs font-extrabold uppercase bg-red-200 text-red-800 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                      <XCircle className="w-3 h-3 text-red-600" /> Salah (Kunci: {pair.right})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* FILLABLE PREVIEW/ANSWERING FORM */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border-t-8 border-t-indigo-600 border-x border-b border-slate-200 shadow-sm p-6 space-y-3">
            <h1 className="text-2xl font-bold text-slate-800">{form.title || 'Evaluasi Pembelajaran'}</h1>
            {form.description && (
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{form.description}</p>
            )}
            
            {form.questions.some(q => q.required) && (
              <p className="text-2xs text-red-500 font-semibold">
                * Wajib diisi
              </p>
            )}
          </div>

          {/* Student Identity Card */}
          <div 
            id="filler-card-studentName" 
            className={`bg-white rounded-xl border p-5 space-y-4 transition-all shadow-sm ${
              formErrors['studentName'] ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Identitas Peserta Didik <span className="text-red-500">*</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="student-name-input" className="block text-xs font-semibold text-slate-600">Nama Lengkap Siswa</label>
                <input
                  id="student-name-input"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda..."
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (formErrors['studentName']) {
                      setFormErrors(prev => {
                        const copy = { ...prev };
                        delete copy['studentName'];
                        return copy;
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
                {formErrors['studentName'] && (
                  <p className="text-2xs text-red-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {formErrors['studentName']}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="student-id-input" className="block text-xs font-semibold text-slate-600">Nomor Induk / No. Absen (Opsional)</label>
                <input
                  id="student-id-input"
                  type="text"
                  placeholder="Contoh: 10452 atau Absen 12"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Render Questions */}
          {form.questions.map((q, index) => {
            const hasError = formErrors[q.id];
            const currentAnswer = answers.find(ans => ans.questionId === q.id);

            return (
              <div 
                key={q.id}
                id={`filler-card-${q.id}`}
                className={`bg-white rounded-xl border p-5 space-y-3.5 transition-all shadow-sm ${
                  hasError ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200'
                }`}
              >
                {/* Question Title & Points Header */}
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-bold text-slate-800 leading-relaxed">
                    {index + 1}. {q.title}
                    {q.required && <span className="text-red-500 ml-1 font-semibold">*</span>}
                  </span>
                  {form.isQuiz && q.points > 0 && (
                    <span className="text-3xs font-extrabold bg-slate-100 text-slate-600 px-2 py-1 rounded-sm shrink-0 uppercase tracking-wider">
                      {q.points} Poin
                    </span>
                  )}
                </div>

                {/* MCQ Type */}
                {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isChecked = currentAnswer?.value === opt.id;
                      return (
                        <label 
                          key={opt.id}
                          htmlFor={`mcq-input-${q.id}-${opt.id}`}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-medium' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            id={`mcq-input-${q.id}-${opt.id}`}
                            name={`mcq-group-${q.id}`}
                            checked={isChecked}
                            onChange={() => handleValueChange(q.id, opt.id)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                            isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          </div>
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Checkboxes Type */}
                {q.type === QuestionType.CHECKBOXES && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isChecked = Array.isArray(currentAnswer?.value) && currentAnswer.value.includes(opt.id);
                      return (
                        <label 
                          key={opt.id}
                          htmlFor={`chk-input-${q.id}-${opt.id}`}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-medium' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`chk-input-${q.id}-${opt.id}`}
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(q.id, opt.id)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                            isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            <svg className="w-2.5 h-2.5 text-white stroke-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer Type */}
                {q.type === QuestionType.SHORT_ANSWER && (
                  <div className="pt-1">
                    <input
                      id={`short-ans-input-${q.id}`}
                      type="text"
                      placeholder="Ketik jawaban singkat Anda di sini..."
                      value={currentAnswer?.value as string || ''}
                      onChange={(e) => handleValueChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Paragraph Type */}
                {q.type === QuestionType.PARAGRAPH && (
                  <div className="pt-1">
                    <textarea
                      id={`paragraph-ans-input-${q.id}`}
                      placeholder="Tuliskan jawaban lengkap Anda di sini..."
                      rows={3}
                      value={currentAnswer?.value as string || ''}
                      onChange={(e) => handleValueChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                )}

                {/* Matching Type */}
                {q.type === QuestionType.MATCHING && q.matchingPairs && (
                  <div className="space-y-3 pt-1">
                    <p className="text-3xs text-slate-400 font-bold uppercase tracking-wider mb-2">Jodohkan item di sebelah kiri dengan pilihan yang tepat di sebelah kanan:</p>
                    <div className="space-y-2.5">
                      {q.matchingPairs.map((pair) => {
                        const studentMap = (currentAnswer?.value && typeof currentAnswer.value === 'object' && !Array.isArray(currentAnswer.value))
                          ? (currentAnswer.value as Record<string, string>)
                          : {};
                        const selectedVal = studentMap[pair.id] || '';
                        const rightChoices = shuffledMatches[q.id] || [];

                        return (
                          <div key={pair.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:bg-slate-100/50">
                            <span className="text-xs font-semibold text-slate-700 sm:max-w-[45%] break-words">
                              {pair.left}
                            </span>
                            
                            <div className="hidden sm:block text-slate-400 font-black">⇔</div>

                            <select
                              value={selectedVal}
                              onChange={(e) => handleMatchingChange(q.id, pair.id, e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer sm:w-[45%]"
                            >
                              <option value="">-- Pilih Pasangan --</option>
                              {rightChoices.map((choice, cIdx) => (
                                <option key={cIdx} value={choice}>
                                  {choice}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {hasError && (
                  <p className="text-2xs text-red-500 font-semibold flex items-center gap-1 pt-1.5 border-t border-red-50">
                    <AlertTriangle className="w-3.5 h-3.5" /> {hasError}
                  </p>
                )}
              </div>
            );
          })}

          {/* Submission Buttons */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <button
              id="back-edit-bottom-btn"
              type="button"
              onClick={onBackToEdit}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Kembali ke Edit Form
            </button>
            <button
              id="submit-answers-btn"
              type="submit"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-lg font-bold shadow-xs cursor-pointer"
            >
              <span>Kirim Jawaban Evaluasi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
