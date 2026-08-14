import React, { useState } from 'react';
import { 
  FileSpreadsheet, FileText, Download, Upload, 
  CheckCircle2, AlertCircle, Trash2, Plus, Sparkles, X, ListPlus
} from 'lucide-react';
import { Question } from '../types';
import { 
  downloadQuestionTemplateExcel, 
  downloadQuestionTemplateWord, 
  parseQuestionExcelFile, 
  parseQuestionFromText 
} from '../utils/excelImportExport';

interface BulkQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}

export default function BulkQuestionModal({ isOpen, onClose, onImport }: BulkQuestionModalProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'text'>('excel');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = await parseQuestionExcelFile(file);
      if (parsed.length === 0) {
        setParseError('Tidak ditemukan pertanyaan valid dalam file Excel tersebut. Pastikan mengikuti struktur template.');
      } else {
        setPreviewQuestions(parsed);
      }
    } catch (err: any) {
      console.error(err);
      setParseError('Gagal membaca file Excel/CSV. Pastikan format file sesuai.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Text parse
  const handleTextParse = () => {
    if (!pastedText.trim()) {
      setParseError('Silakan tempel teks soal terlebih dahulu.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = parseQuestionFromText(pastedText);
      if (parsed.length === 0) {
        setParseError('Tidak dapat mendeteksi nomor atau format pertanyaan dari teks. Pastikan menggunakan format berpenomoran (misal: "1. Pertanyaan...").');
      } else {
        setPreviewQuestions(parsed);
      }
    } catch (err) {
      setParseError('Terjadi kesalahan saat memproses teks soal.');
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (previewQuestions.length === 0) return;
    onImport(previewQuestions);
    setPreviewQuestions([]);
    setPastedText('');
    onClose();
  };

  // Delete item from preview list
  const handleRemovePreviewItem = (index: number) => {
    setPreviewQuestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div id="bulk-upload-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Unggah & Impor Soal Secara Massal</h3>
              <p className="text-4xs text-slate-400 font-medium">Tambah belasan soal sekaligus dari Excel, CSV, atau Word</p>
            </div>
          </div>
          <button 
            id="close-bulk-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Templates Download bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => { setActiveTab('excel'); setParseError(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'excel' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>File Excel / CSV</span>
            </button>
            <button
              onClick={() => { setActiveTab('text'); setParseError(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'text' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Salin-Tempel Teks / Word</span>
            </button>
          </div>

          {/* Download Templates Actions */}
          <div className="flex items-center gap-2">
            <button
              id="download-excel-template-btn"
              type="button"
              onClick={downloadQuestionTemplateExcel}
              className="flex items-center gap-1.5 text-2xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template Excel (.xlsx)</span>
            </button>
            <button
              id="download-word-template-btn"
              type="button"
              onClick={downloadQuestionTemplateWord}
              className="flex items-center gap-1.5 text-2xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Format Word (.txt)</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-8 text-center space-y-3 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-indigo-500 mx-auto animate-bounce" style={{ animationDuration: '3s' }} />
                <div>
                  <p className="font-bold text-xs text-slate-800">Pilih atau Seret File Excel / CSV Soal Anda</p>
                  <p className="text-3xs text-slate-500 mt-1">Mendukung format .xlsx, .xls, dan .csv yang berisi data pertanyaan</p>
                </div>

                <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Cari & Pilih File Excel</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                Tempel Teks Soal (Microsoft Word / Notepad):
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Contoh Format:\n1. Apa nama ibu kota negara Indonesia?\nA. Bandung\nB. Jakarta\nC. Surabaya\nD. Medan\nKunci: B\nPoin: 10\n\n2. Berapakah 25 x 4?\nKunci: 100\nPoin: 10`}
                className="w-full h-44 p-3 border border-slate-300 rounded-xl text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <button
                type="button"
                onClick={handleTextParse}
                disabled={isParsing || !pastedText.trim()}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analisis & Konversi Teks Menjadi Soal</span>
              </button>
            </div>
          )}

          {/* Parsing Status or Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Questions Preview Table */}
          {previewQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Terdeteksi {previewQuestions.length} Soal Siap Diimpor:</span>
                </span>
                <span className="text-3xs text-slate-400 font-semibold">
                  Total Poin: {previewQuestions.reduce((sum, q) => sum + q.points, 0)} pt
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {previewQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="space-y-1 grow">
                      <p className="font-bold text-slate-800">
                        {idx + 1}. {q.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-3xs">
                        <span className="bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-sm uppercase">
                          {q.type}
                        </span>
                        <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-sm">
                          {q.points} pt
                        </span>
                        {q.options && (
                          <span className="text-slate-500 font-medium">
                            {q.options.length} Pilihan Jawaban
                          </span>
                        )}
                        {q.matchingPairs && (
                          <span className="text-slate-500 font-medium">
                            {q.matchingPairs.length} Pasangan Menjodohkan
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePreviewItem(idx)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Hapus dari daftar impor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="confirm-bulk-import-btn"
            onClick={handleConfirmImport}
            disabled={previewQuestions.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            <span>Masukkan {previewQuestions.length} Soal ke Kuis</span>
          </button>
        </div>
      </div>
    </div>
  );
}
