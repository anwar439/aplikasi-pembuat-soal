import React, { useState } from 'react';
import { 
  FileText, Plus, Trash2, ArrowUp, ArrowDown, Copy, Check, 
  Settings, HelpCircle, CheckSquare, Sparkles, Upload, Download, 
  Search, SlidersHorizontal, Eye, Save
} from 'lucide-react';
import { EvaluationForm, Question, QuestionType, QuestionOption, MatchingPair } from '../types';
import BulkQuestionModal from './BulkQuestionModal';
import AIPromptModal from './AIPromptModal';

interface QuestionFocusEditorProps {
  form: EvaluationForm;
  onChange: (updatedForm: EvaluationForm) => void;
  onPreview: () => void;
}

export default function QuestionFocusEditor({ form, onChange, onPreview }: QuestionFocusEditorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [bulkPoints, setBulkPoints] = useState<number>(10);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Apply bulk points
  const handleApplyBulkPoints = () => {
    if (bulkPoints < 0) return;
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

  // Question manipulation handlers
  const handleUpdateQuestion = (questionId: string, fields: Partial<Question>) => {
    const updatedQuestions = form.questions.map(q => {
      if (q.id === questionId) {
        return { ...q, ...fields };
      }
      return q;
    });
    onChange({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: 'Tuliskan teks pertanyaan di sini...',
      required: true,
      points: 10,
      options: (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES)
        ? [
            { id: `opt-${Math.random().toString(36).substr(2, 5)}`, text: 'Pilihan A' },
            { id: `opt-${Math.random().toString(36).substr(2, 5)}`, text: 'Pilihan B' }
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

    const updated = [...form.questions, newQuestion];
    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updated = form.questions.filter(q => q.id !== questionId);
    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDuplicateQuestion = (question: Question) => {
    const copy: Question = {
      ...question,
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      title: `${question.title} (Salinan)`,
      options: question.options ? question.options.map(o => ({ ...o, id: `opt-${Math.random().toString(36).substr(2, 5)}` })) : undefined,
      matchingPairs: question.matchingPairs ? question.matchingPairs.map(p => ({ ...p, id: `pair-${Math.random().toString(36).substr(2, 5)}` })) : undefined
    };
    const index = form.questions.findIndex(q => q.id === question.id);
    const updated = [...form.questions];
    updated.splice(index + 1, 0, copy);

    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === form.questions.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...form.questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Bulk import callback
  const handleBulkImport = (newQuestions: Question[]) => {
    const updated = [...form.questions, ...newQuestions];
    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // AI Generated callback
  const handleAIGenerated = (newQuestions: Question[]) => {
    const updated = [...form.questions, ...newQuestions];
    onChange({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
  };

  // Filtered list
  const filteredQuestions = form.questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPoints = form.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner Control Panel for Focused Question Settings */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-3xs font-extrabold uppercase tracking-widest">
              <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Menu Pengaturan Soal (Focus Editor)</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {form.title || 'Pengaturan Soal Evaluasi'}
            </h2>
            <p className="text-xs text-slate-400">
              Kelola, ubah poin, urutkan, dan tambah soal dengan nyaman dalam satu tampilan terfokus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Uji Lembar Siswa</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Soal Excel / Word</span>
            </button>
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Soal AI</span>
            </button>
          </div>
        </div>

        {/* Quick Bulk Settings Toolbar */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <span>Total: <strong>{form.questions.length}</strong> Soal</span>
            <span>•</span>
            <span>Total Poin: <strong className="text-emerald-400">{totalPoints}</strong> pt</span>
          </div>

          {/* Bulk point apply */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Samakan Poin Semua Soal:</span>
            <input 
              type="number"
              value={bulkPoints}
              min="0"
              onChange={(e) => setBulkPoints(Math.max(0, Number(e.target.value)))}
              className="w-14 px-2 py-1 bg-slate-900 border border-slate-600 rounded-lg text-center font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={handleApplyBulkPoints}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-2xs px-3 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Terapkan Ke Semua
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative grow max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text"
            placeholder="Cari teks soal dalam daftar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Filter Jenis:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Semua Jenis Soal</option>
            <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda (PG)</option>
            <option value={QuestionType.CHECKBOXES}>Kotak Centang</option>
            <option value={QuestionType.SHORT_ANSWER}>Isian Singkat</option>
            <option value={QuestionType.PARAGRAPH}>Uraian / Essay</option>
            <option value={QuestionType.MATCHING}>Menjodohkan</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-xs">Tidak Ada Soal Yang Sesuai Filter</p>
            <p className="text-3xs text-slate-500 max-w-sm mx-auto">
              Silakan tambahkan soal baru di bawah, atau gunakan menu "Impor Soal Excel/Word" untuk mengisi soal secara cepat.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const originalIndex = form.questions.findIndex(item => item.id === q.id);

            return (
              <div 
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-indigo-200 transition-colors"
              >
                {/* Item Header Toolbar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-extrabold text-xs">
                      #{originalIndex + 1}
                    </span>
                    
                    {/* Question Type Selector */}
                    <select
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as QuestionType })}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg text-2xs font-bold bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={QuestionType.MULTIPLE_CHOICE}>Pilihan Ganda</option>
                      <option value={QuestionType.CHECKBOXES}>Kotak Centang</option>
                      <option value={QuestionType.SHORT_ANSWER}>Isian Singkat</option>
                      <option value={QuestionType.PARAGRAPH}>Essay / Uraian</option>
                      <option value={QuestionType.MATCHING}>Menjodohkan</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Points Editor */}
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <span className="text-3xs font-bold text-emerald-800">Poin:</span>
                      <input 
                        type="number"
                        min="0"
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(q.id, { points: Math.max(0, Number(e.target.value)) })}
                        className="w-12 text-center text-xs font-bold bg-white border border-emerald-300 rounded text-emerald-950 focus:outline-hidden"
                      />
                    </div>

                    {/* Move Up / Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(originalIndex, 'up')}
                      disabled={originalIndex === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md disabled:opacity-30 cursor-pointer"
                      title="Geser Ke Atas"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(originalIndex, 'down')}
                      disabled={originalIndex === form.questions.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md disabled:opacity-30 cursor-pointer"
                      title="Geser Ke Bawah"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer"
                      title="Duplikat Soal"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Title Textarea */}
                <div>
                  <textarea
                    value={q.title}
                    onChange={(e) => handleUpdateQuestion(q.id, { title: e.target.value })}
                    rows={2}
                    placeholder="Tuliskan isi pertanyaan..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                {/* Question Specific Editors */}
                {/* Options (PG / CHECKBOXES) */}
                {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOXES) && q.options && (
                  <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Pilihan Jawaban & Kunci Benar:</p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOption = q.type === QuestionType.MULTIPLE_CHOICE
                          ? q.correctAnswer === opt.id
                          : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id);

                        return (
                          <div key={opt.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (q.type === QuestionType.MULTIPLE_CHOICE) {
                                  handleUpdateQuestion(q.id, { correctAnswer: opt.id });
                                } else {
                                  const currentKeys = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];
                                  const exists = currentKeys.indexOf(opt.id);
                                  if (exists !== -1) currentKeys.splice(exists, 1);
                                  else currentKeys.push(opt.id);
                                  handleUpdateQuestion(q.id, { correctAnswer: currentKeys });
                                }
                              }}
                              className={`p-1.5 rounded-md font-bold text-3xs cursor-pointer transition-colors ${
                                isCorrectOption
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                              title="Tandai sebagai kunci jawaban benar"
                            >
                              {isCorrectOption ? '✓ KUNCI' : 'PILIH KUNCI'}
                            </button>

                            <input 
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updatedOpts = q.options!.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o);
                                handleUpdateQuestion(q.id, { options: updatedOpts });
                              }}
                              className="grow px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matching Pairs */}
                {q.type === QuestionType.MATCHING && q.matchingPairs && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Pasangan Menjodohkan (Kiri & Kanan Benar):</p>
                    <div className="space-y-2">
                      {q.matchingPairs.map((pair) => (
                        <div key={pair.id} className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const updatedPairs = q.matchingPairs!.map(p => p.id === pair.id ? { ...p, left: e.target.value } : p);
                              handleUpdateQuestion(q.id, { matchingPairs: updatedPairs });
                            }}
                            placeholder="Sisi Kiri"
                            className="grow px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          />
                          <span className="text-xs font-bold text-slate-400">⇔</span>
                          <input 
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const updatedPairs = q.matchingPairs!.map(p => p.id === pair.id ? { ...p, right: e.target.value } : p);
                              handleUpdateQuestion(q.id, { matchingPairs: updatedPairs });
                            }}
                            placeholder="Sisi Kanan (Jawaban Benar)"
                            className="grow px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer / Paragraph Key */}
                {(q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.PARAGRAPH) && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Kunci Jawaban Singkat / Referensi Penilaian:</p>
                    <input 
                      type="text"
                      value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                      onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder="Masukkan kata kunci jawaban benar..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add New Question Quick Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">Tambah Pertanyaan Baru:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            + Pilihan Ganda
          </button>
          <button
            onClick={() => handleAddQuestion(QuestionType.CHECKBOXES)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            + Kotak Centang
          </button>
          <button
            onClick={() => handleAddQuestion(QuestionType.SHORT_ANSWER)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            + Isian Singkat
          </button>
          <button
            onClick={() => handleAddQuestion(QuestionType.PARAGRAPH)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            + Essay
          </button>
          <button
            onClick={() => handleAddQuestion(QuestionType.MATCHING)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            + Menjodohkan
          </button>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <BulkQuestionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
      />

      {/* AI Prompt Modal */}
      <AIPromptModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerated}
      />
    </div>
  );
}
