import React, { useState } from 'react';
import { 
  Plus, Trash, ArrowUp, ArrowDown, Settings, Sparkles, 
  Check, FileText, CheckSquare, ListPlus, ToggleLeft, 
  HelpCircle, Eye, RefreshCw, Send, AlertCircle
} from 'lucide-react';
import { Question, QuestionType, EvaluationForm, QuestionOption } from '../types';
import AIPromptModal from './AIPromptModal';

interface FormBuilderProps {
  form: EvaluationForm;
  onChange: (updatedForm: EvaluationForm) => void;
  onPreview: () => void;
  onExport: (form: EvaluationForm) => void;
  isExporting: boolean;
  exportError: string | null;
  exportSuccessUrl: string | null;
  clearExportState: () => void;
}

export default function FormBuilder({
  form,
  onChange,
  onPreview,
  onExport,
  isExporting,
  exportError,
  exportSuccessUrl,
  clearExportState
}: FormBuilderProps) {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [bulkPoints, setBulkPoints] = useState<number>(10);

  // Bulk Apply Points to All Questions
  const handleApplyBulkPoints = () => {
    if (bulkPoints === undefined || bulkPoints < 0) return;
    const updatedQuestions = form.questions.map(q => ({
      ...q,
      points: bulkPoints
    }));
    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };

  // Update Form Metadata
  const handleMetaChange = (field: 'title' | 'description', value: string) => {
    onChange({
      ...form,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  // Toggle isQuiz status
  const handleQuizToggle = () => {
    onChange({
      ...form,
      isQuiz: !form.isQuiz,
      updatedAt: new Date().toISOString()
    });
  };

  // Add a new manual question
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: '',
      required: true,
      points: form.isQuiz ? 10 : 0,
      options: type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES
        ? [
            { id: `opt-${Math.random().toString(36).substr(2, 5)}`, text: 'Opsi 1' },
            { id: `opt-${Math.random().toString(36).substr(2, 5)}`, text: 'Opsi 2' }
          ]
        : undefined,
      matchingPairs: type === QuestionType.MATCHING
        ? [
            { id: `pair-${Math.random().toString(36).substr(2, 5)}`, left: 'Item Kiri 1', right: 'Item Kanan 1' },
            { id: `pair-${Math.random().toString(36).substr(2, 5)}`, left: 'Item Kiri 2', right: 'Item Kanan 2' }
          ]
        : undefined,
      correctAnswer: type === QuestionType.CHECKBOXES ? [] : (type === QuestionType.MATCHING ? {} : '')
    };

    const updatedQuestions = [...form.questions, newQuestion];
    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
    setActiveQuestionId(newQuestion.id);
  };

  // Add matching pair
  const handleAddMatchingPair = (questionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question) return;
    const currentPairs = question.matchingPairs || [];
    const newPair = {
      id: `pair-${Math.random().toString(36).substr(2, 5)}`,
      left: `Item Kiri ${currentPairs.length + 1}`,
      right: `Item Kanan ${currentPairs.length + 1}`
    };
    handleQuestionChange(questionId, {
      matchingPairs: [...currentPairs, newPair]
    });
  };

  // Delete matching pair
  const handleDeleteMatchingPair = (questionId: string, pairId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question || !question.matchingPairs) return;
    const updatedPairs = question.matchingPairs.filter(p => p.id !== pairId);
    handleQuestionChange(questionId, {
      matchingPairs: updatedPairs
    });
  };

  // Update matching pair text
  const handleMatchingPairTextChange = (questionId: string, pairId: string, side: 'left' | 'right', text: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question || !question.matchingPairs) return;
    const updatedPairs = question.matchingPairs.map(p => {
      if (p.id === pairId) {
        return { ...p, [side]: text };
      }
      return p;
    });
    handleQuestionChange(questionId, {
      matchingPairs: updatedPairs
    });
  };

  // AI Generated questions callback
  const handleAIGeneratedQuestions = (newQuestions: Question[]) => {
    // Correct the points if needed based on current quiz status
    const finalizedQuestions = newQuestions.map(q => ({
      ...q,
      points: form.isQuiz ? q.points || 10 : 0
    }));

    onChange({
      ...form,
      questions: [...form.questions, ...finalizedQuestions],
      updatedAt: new Date().toISOString()
    });
  };

  // Delete a question
  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = form.questions.filter(q => q.id !== id);
    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  // Modify question property
  const handleQuestionChange = (id: string, updates: Partial<Question>) => {
    const updatedQuestions = form.questions.map(q => {
      if (q.id === id) {
        return { ...q, ...updates };
      }
      return q;
    });
    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };

  // Re-order questions (Up/Down)
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === form.questions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedQuestions = [...form.questions];
    const temp = updatedQuestions[index];
    updatedQuestions[index] = updatedQuestions[newIndex];
    updatedQuestions[newIndex] = temp;

    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };

  // Add Option to a question
  const handleAddOption = (questionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const newOption: QuestionOption = {
      id: `opt-${Math.random().toString(36).substr(2, 5)}`,
      text: `Opsi ${question.options.length + 1}`
    };

    handleQuestionChange(questionId, {
      options: [...question.options, newOption]
    });
  };

  // Delete Option from a question
  const handleDeleteOption = (questionId: string, optionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const updatedOptions = question.options.filter(opt => opt.id !== optionId);

    // Also clear correctAnswer if it matches the deleted option
    let updatedAnswer = question.correctAnswer;
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.correctAnswer === optionId) {
      updatedAnswer = '';
    } else if (question.type === QuestionType.CHECKBOXES && Array.isArray(question.correctAnswer)) {
      updatedAnswer = question.correctAnswer.filter(ansId => ansId !== optionId);
    }

    handleQuestionChange(questionId, {
      options: updatedOptions,
      correctAnswer: updatedAnswer
    });
  };

  // Change Option text
  const handleOptionTextChange = (questionId: string, optionId: string, text: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const updatedOptions = question.options.map(opt => {
      if (opt.id === optionId) return { ...opt, text };
      return opt;
    });

    handleQuestionChange(questionId, { options: updatedOptions });
  };

  // Toggle correct answer selection (quiz answer key)
  const handleToggleCorrectAnswer = (questionId: string, optionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Toggle or set
      const newAnswer = question.correctAnswer === optionId ? '' : optionId;
      handleQuestionChange(questionId, { correctAnswer: newAnswer });
    } else if (question.type === QuestionType.CHECKBOXES) {
      const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      handleQuestionChange(questionId, { correctAnswer: newAnswers });
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE: return 'Pilihan Ganda';
      case QuestionType.CHECKBOXES: return 'Kotak Centang';
      case QuestionType.SHORT_ANSWER: return 'Jawaban Singkat';
      case QuestionType.PARAGRAPH: return 'Paragraf';
      case QuestionType.MATCHING: return 'Menjodohkan';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Pembuat Formulir Evaluasi</h2>
            <p className="text-xs text-slate-500">Rancang kuis & kumpulkan respons nilai secara otomatis</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            id="open-ai-prompt-modal"
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs border border-indigo-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Buat dengan AI</span>
          </button>
          
          <button
            id="preview-form-btn"
            onClick={onPreview}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Pratinjau Kuis</span>
          </button>

          <button
            id="export-to-google-forms"
            onClick={() => onExport(form)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengekspor...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ekspor ke Google Forms</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Success/Error Alerts */}
      {exportError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm">Gagal Mengekspor ke Google Forms</p>
            <p className="text-xs text-red-600 leading-relaxed">{exportError}</p>
            <div className="pt-2">
              <button 
                onClick={clearExportState} 
                className="text-xs underline text-red-700 hover:text-red-800 font-medium"
              >
                Tutup Peringatan
              </button>
            </div>
          </div>
        </div>
      )}

      {exportSuccessUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3 animate-fadeIn">
          <Check className="w-5 h-5 shrink-0 mt-0.5 bg-emerald-100 text-emerald-700 rounded-full p-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm">Berhasil Diekspor!</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Formulir evaluasi pembelajaran telah berhasil dibuat langsung di Google Drive & Google Forms Anda.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <a 
                href={exportSuccessUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors shadow-xs"
              >
                Buka di Google Forms
              </a>
              <button 
                onClick={clearExportState} 
                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white rounded-2xl border-t-8 border-t-indigo-600 border-x border-b border-slate-200 shadow-sm overflow-hidden">
        {/* Settings header */}
        <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan Evaluasi</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label htmlFor="toggle-quiz" className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-medium text-slate-600">Jadikan Kuis (Penilaian Otomatis)</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="toggle-quiz" 
                  className="sr-only" 
                  checked={form.isQuiz}
                  onChange={handleQuizToggle}
                />
                <div className={`w-9 h-5 rounded-full transition-colors ${form.isQuiz ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${form.isQuiz ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </label>

            {form.isQuiz && (
              <div className="flex items-center gap-2 sm:border-l sm:border-slate-300 sm:pl-3">
                <span className="text-xs text-slate-600 font-medium">Atur Poin Semua Soal:</span>
                <input 
                  type="number"
                  id="bulk-points-input"
                  className="w-12 px-1.5 py-0.5 text-xs text-center border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="10"
                  min="0"
                  value={bulkPoints}
                  onChange={(e) => setBulkPoints(Math.max(0, Number(e.target.value)))}
                />
                <button
                  type="button"
                  id="apply-bulk-points-btn"
                  onClick={handleApplyBulkPoints}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-3xs px-2.5 py-1 rounded font-bold cursor-pointer transition-all"
                  title="Samakan poin semua soal sekaligus"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title and Description fields */}
        <div className="p-6 space-y-4">
          <input
            id="form-title-input"
            type="text"
            value={form.title}
            onChange={(e) => handleMetaChange('title', e.target.value)}
            placeholder="Judul Formulir Evaluasi Baru"
            className="w-full text-2xl font-bold text-slate-800 placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-indigo-600 focus:outline-hidden pb-1.5 transition-all"
          />
          <textarea
            id="form-desc-input"
            value={form.description}
            onChange={(e) => handleMetaChange('description', e.target.value)}
            placeholder="Tambahkan deskripsi instruksi ujian atau penjelasan singkat di sini..."
            rows={2}
            className="w-full text-slate-600 placeholder-slate-300 border border-transparent hover:border-slate-100 focus:border-slate-200 focus:bg-slate-50/30 focus:outline-hidden p-2 rounded-lg text-sm transition-all resize-none"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {form.questions.length === 0 ? (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-700 text-sm">Belum Ada Pertanyaan</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tambahkan pertanyaan baru secara manual menggunakan panel kontrol di bawah atau gunakan tombol <strong className="text-indigo-600">"Buat dengan AI"</strong> untuk membuat soal kuis instan secara otomatis.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button 
                id="add-blank-mc"
                onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
                className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pilihan Ganda</span>
              </button>
              <button 
                id="add-blank-short"
                onClick={() => handleAddQuestion(QuestionType.SHORT_ANSWER)}
                className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Jawaban Singkat</span>
              </button>
            </div>
          </div>
        ) : (
          form.questions.map((q, index) => {
            const isActive = activeQuestionId === q.id;
            return (
              <div 
                key={q.id}
                id={`builder-question-card-${q.id}`}
                onClick={() => setActiveQuestionId(q.id)}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-indigo-600/80 shadow-md border-indigo-100' 
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Top line of question: Reorder buttons, type selector, and score */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button 
                        type="button"
                        id={`move-up-btn-${q.id}`}
                        onClick={(e) => { e.stopPropagation(); handleMoveQuestion(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        title="Geser ke atas"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        id={`move-down-btn-${q.id}`}
                        onClick={(e) => { e.stopPropagation(); handleMoveQuestion(index, 'down'); }}
                        disabled={index === form.questions.length - 1}
                        className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        title="Geser ke bawah"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-slate-500 ml-1">Pertanyaan {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Question Type Selector */}
                      <select
                        id={`question-type-select-${q.id}`}
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as QuestionType;
                          const updates: Partial<Question> = { type: newType };
                          if (newType === QuestionType.MULTIPLE_CHOICE || newType === QuestionType.CHECKBOXES) {
                            if (!q.options || q.options.length === 0) {
                              updates.options = [
                                { id: `opt-1`, text: 'Opsi 1' },
                                { id: `opt-2`, text: 'Opsi 2' }
                              ];
                            }
                            updates.correctAnswer = newType === QuestionType.CHECKBOXES ? [] : '';
                          } else {
                            updates.options = undefined;
                            updates.correctAnswer = '';
                          }
                          handleQuestionChange(q.id, updates);
                        }}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda</option>
                        <option value={QuestionType.CHECKBOXES}>Kotak Centang</option>
                        <option value={QuestionType.SHORT_ANSWER}>Jawaban Singkat</option>
                        <option value={QuestionType.PARAGRAPH}>Jawaban Paragraf</option>
                      </select>

                      {/* Points / Skor */}
                      {form.isQuiz && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                          <span className="text-2xs font-bold text-slate-500">Skor:</span>
                          <input
                            id={`question-points-input-${q.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={q.points}
                            onChange={(e) => handleQuestionChange(q.id, { points: Number(e.target.value) || 0 })}
                            className="w-10 bg-transparent text-center text-xs font-bold text-slate-700 focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Title input */}
                  <div className="space-y-1">
                    <input
                      id={`question-title-input-${q.id}`}
                      type="text"
                      value={q.title}
                      onChange={(e) => handleQuestionChange(q.id, { title: e.target.value })}
                      placeholder="Tulis pertanyaan atau deskripsi soal di sini..."
                      className="w-full text-sm font-semibold text-slate-800 placeholder-slate-300 border-b border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:outline-hidden pb-1 transition-all"
                    />
                  </div>

                  {/* Options (For Multiple Choice & Checkboxes) */}
                  {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOXES) && q.options && (
                    <div className="space-y-2.5 pl-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isMC = q.type === QuestionType.MULTIPLE_CHOICE;
                        const isCorrect = isMC
                          ? q.correctAnswer === opt.id
                          : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id);

                        return (
                          <div key={opt.id} className="flex items-center gap-3 animate-fadeIn">
                            {/* Quiz indicator / click correct answer trigger */}
                            {form.isQuiz ? (
                              <button
                                type="button"
                                id={`set-correct-btn-${q.id}-${opt.id}`}
                                onClick={() => handleToggleCorrectAnswer(q.id, opt.id)}
                                className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-500'
                                }`}
                                title={isCorrect ? "Jawaban Benar (Klik untuk hapus kunci)" : "Tandai sebagai Jawaban Benar"}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className={`w-4 h-4 rounded-xs border border-slate-300 shrink-0 ${isMC ? 'rounded-full' : ''}`}></div>
                            )}

                            {/* Option input */}
                            <input
                              id={`option-input-${q.id}-${opt.id}`}
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(q.id, opt.id, e.target.value)}
                              placeholder={`Opsi ${optIdx + 1}`}
                              className="grow text-xs text-slate-700 placeholder-slate-300 border-b border-transparent hover:border-slate-100 focus:border-slate-200 focus:outline-hidden py-0.5"
                            />

                            {/* Delete Option */}
                            {q.options!.length > 1 && (
                              <button
                                type="button"
                                id={`delete-option-${q.id}-${opt.id}`}
                                onClick={() => handleDeleteOption(q.id, opt.id)}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Opsi"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Option button */}
                      <button
                        type="button"
                        id={`add-option-btn-${q.id}`}
                        onClick={() => handleAddOption(q.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors mt-1.5 cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>Tambah Opsi</span>
                      </button>

                      {/* Kunci Jawaban Help Tip */}
                      {form.isQuiz && (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-2xs leading-normal flex items-start gap-1.5 mt-2">
                          <CheckSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                          <span>
                            <strong>Kunci Jawaban:</strong> Klik lingkaran centang berwarna hijau di sebelah kiri opsi di atas untuk menandai jawaban yang benar demi penilaian otomatis.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correct Answer settings (For Short Answer) */}
                  {q.type === QuestionType.SHORT_ANSWER && form.isQuiz && (
                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kunci Jawaban (Siswa Harus Menuliskan Persis)</span>
                      </div>
                      <input
                        id={`correct-short-answer-input-${q.id}`}
                        type="text"
                        value={q.correctAnswer as string || ''}
                        onChange={(e) => handleQuestionChange(q.id, { correctAnswer: e.target.value })}
                        placeholder="Contoh: Bima Sakti"
                        className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Paragraph Indicator (For Paragraph / Answer text) */}
                  {q.type === QuestionType.PARAGRAPH && (
                    <div className="text-slate-300 italic text-xs pl-2 border-l-2 border-slate-200 py-1">
                      (Siswa akan menuliskan jawaban essay panjang di bagian ini)
                    </div>
                  )}

                  {/* Matching Pairs UI (For MATCHING questions) */}
                  {q.type === QuestionType.MATCHING && q.matchingPairs && (
                    <div className="space-y-3 pl-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fadeIn">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Daftar Pasangan Menjodohkan (Kiri & Kanan Benar)</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.matchingPairs.map((pair, pairIdx) => (
                          <div key={pair.id} className="flex items-center gap-2 animate-fadeIn">
                            <span className="text-2xs font-bold text-slate-400 w-5 text-right">{pairIdx + 1}.</span>
                            
                            {/* Left Side Prompt */}
                            <input
                              type="text"
                              value={pair.left}
                              onChange={(e) => handleMatchingPairTextChange(q.id, pair.id, 'left', e.target.value)}
                              placeholder="Premis / Sisi Kiri"
                              className="grow bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />

                            <span className="text-xs text-slate-400 font-bold">⇔</span>

                            {/* Right Side Match */}
                            <input
                              type="text"
                              value={pair.right}
                              onChange={(e) => handleMatchingPairTextChange(q.id, pair.id, 'right', e.target.value)}
                              placeholder="Jawaban / Sisi Kanan"
                              className="grow bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />

                            {/* Delete Pair Button */}
                            {q.matchingPairs!.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMatchingPair(q.id, pair.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Pasangan"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Pair Button */}
                      <button
                        type="button"
                        onClick={() => handleAddMatchingPair(q.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors mt-1 cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>Tambah Pasangan</span>
                      </button>

                      {form.isQuiz && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-3xs leading-normal">
                          <strong>Kunci Jawaban Otomatis:</strong> Pasangkan langsung pernyataan di sebelah kiri dengan jawaban benarnya di sebelah kanan. Sistem akan mengacak pilihan sebelah kanan ketika ditampilkan ke siswa.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions line (Wajib diisi, Delete Question) */}
                  <div className="flex items-center justify-end gap-4 pt-3.5 border-t border-slate-200 text-slate-400">
                    <label htmlFor={`toggle-required-${q.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer select-none">
                      <span>Wajib diisi</span>
                      <div className="relative">
                        <input
                          id={`toggle-required-${q.id}`}
                          type="checkbox"
                          className="sr-only"
                          checked={q.required}
                          onChange={(e) => handleQuestionChange(q.id, { required: e.target.checked })}
                        />
                        <div className={`w-7 h-4 rounded-full transition-colors ${q.required ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-2xs ${q.required ? 'translate-x-3' : 'translate-x-0'}`}></div>
                      </div>
                    </label>

                    <div className="h-4 w-px bg-slate-200"></div>

                    <button
                      type="button"
                      id={`delete-question-btn-${q.id}`}
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Pertanyaan"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating/Bottom Action Panel to Add Questions */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-center gap-2 flex-wrap shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Tambah Soal Baru:</span>
        <button
          id="add-mc-btn"
          onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pilihan Ganda</span>
        </button>
        <button
          id="add-checkbox-btn"
          onClick={() => handleAddQuestion(QuestionType.CHECKBOXES)}
          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kotak Centang</span>
        </button>
        <button
          id="add-short-answer-btn"
          onClick={() => handleAddQuestion(QuestionType.SHORT_ANSWER)}
          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Isian Singkat</span>
        </button>
        <button
          id="add-paragraph-btn"
          onClick={() => handleAddQuestion(QuestionType.PARAGRAPH)}
          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Paragraf / Essay</span>
        </button>
        <button
          id="add-matching-btn"
          onClick={() => handleAddQuestion(QuestionType.MATCHING)}
          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Menjodohkan</span>
        </button>
      </div>

      <AIPromptModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGeneratedQuestions}
      />
    </div>
  );
}
