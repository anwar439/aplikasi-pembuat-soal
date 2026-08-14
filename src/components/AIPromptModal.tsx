import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import { Question, QuestionType } from '../types';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (newQuestions: Question[]) => void;
}

export default function AIPromptModal({ isOpen, onClose, onGenerate }: AIPromptModalProps) {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('SMP Kelas 7');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Harap masukkan topik pembelajaran.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          gradeLevel,
          questionCount,
          questionType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Terjadi kesalahan saat menghubungi server AI');
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        // Transform the correct answers from server schema if needed
        const questions: Question[] = data.questions.map((q: any) => {
          let correctAnswer: string | string[] | undefined = undefined;
          if (q.type === QuestionType.CHECKBOXES) {
            correctAnswer = q.correctAnswers || q.correctAnswer || [];
          } else {
            correctAnswer = q.correctAnswer;
          }
          return {
            id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
            type: q.type as QuestionType,
            title: q.title || 'Pertanyaan Tanpa Judul',
            required: q.required !== undefined ? q.required : true,
            points: Number(q.points) || 10,
            options: q.options || [],
            correctAnswer,
          };
        });

        onGenerate(questions);
        onClose();
      } else {
        throw new Error('Format respon AI tidak sesuai harapan.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal menghasilkan kuis dengan AI. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div id="ai-modal-container" className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
            <h3 className="font-semibold text-lg text-white">Buat Soal dengan AI</h3>
          </div>
          <button 
            id="close-ai-modal"
            onClick={onClose} 
            className="text-indigo-200 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm border border-red-100 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Topik Pembelajaran</label>
            <input
              id="ai-topic-input"
              type="text"
              placeholder="Contoh: Energi Terbarukan, Trigonometri Dasar, Proklamasi Kemerdekaan"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Tingkat Kelas</label>
              <select
                id="ai-grade-select"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={isLoading}
              >
                <option value="SD Kelas 1-3">SD Kelas 1-3</option>
                <option value="SD Kelas 4-6">SD Kelas 4-6</option>
                <option value="SMP Kelas 7">SMP Kelas 7</option>
                <option value="SMP Kelas 8">SMP Kelas 8</option>
                <option value="SMP Kelas 9">SMP Kelas 9</option>
                <option value="SMA Kelas 10">SMA Kelas 10</option>
                <option value="SMA Kelas 11-12">SMA Kelas 11-12</option>
                <option value="Umum">Umum / Universitas</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Jumlah Pertanyaan</label>
              <select
                id="ai-count-select"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={isLoading}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} Pertanyaan
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Tipe Pertanyaan Utama</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: QuestionType.MULTIPLE_CHOICE, label: 'Pilihan Ganda' },
                { type: QuestionType.CHECKBOXES, label: 'Kotak Centang' },
                { type: QuestionType.SHORT_ANSWER, label: 'Jawaban Singkat' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  id={`ai-type-btn-${opt.type}`}
                  type="button"
                  onClick={() => setQuestionType(opt.type)}
                  className={`py-2 px-3 border rounded-lg text-xs font-medium text-center transition-all ${
                    questionType === opt.type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="cancel-ai-generation"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              id="submit-ai-generation"
              type="submit"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Soal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Hasilkan Soal AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
