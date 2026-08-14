import React, { useState } from 'react';
import { 
  BarChart, Users, Award, TrendingUp, HelpCircle, 
  Trash2, RefreshCw, Eye, Calendar, User, Search, ChevronRight, X, CheckSquare, CheckCircle2, XCircle
} from 'lucide-react';
import { EvaluationForm, StudentResponse, QuestionType } from '../types';

interface FormStatsProps {
  form: EvaluationForm;
  responses: StudentResponse[];
  onClearResponses: () => void;
  onUpdateResponse: (updatedResponse: StudentResponse) => void;
}

export default function FormStats({ form, responses, onClearResponses, onUpdateResponse }: FormStatsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<StudentResponse | null>(null);

  // Recalculates total score for a response after manual corrections
  const recalculateResponseScore = (resp: StudentResponse): StudentResponse => {
    let newScore = 0;
    form.questions.forEach(q => {
      const studentAns = resp.answers.find(ans => ans.questionId === q.id);
      if (!studentAns) return;

      if (studentAns.manualPoints !== undefined) {
        newScore += studentAns.manualPoints;
        return;
      }

      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (studentAns.value === q.correctAnswer) {
          newScore += q.points;
        }
      } else if (q.type === QuestionType.CHECKBOXES) {
        const studentList = Array.isArray(studentAns.value) ? [...studentAns.value].sort() : [];
        const correctList = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
        const isCorrect = studentList.length === correctList.length && 
          studentList.every((val, idx) => val === correctList[idx]);
        if (isCorrect) {
          newScore += q.points;
        }
      } else if (q.type === QuestionType.SHORT_ANSWER) {
        const studentText = typeof studentAns.value === 'string' ? studentAns.value.trim().toLowerCase() : '';
        const correctText = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '';
        if (studentText && studentText === correctText) {
          newScore += q.points;
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
          newScore += Math.round(q.points * ratio);
        }
      }
    });

    return {
      ...resp,
      score: newScore
    };
  };

  const handleManualPointsChange = (questionId: string, value: number) => {
    if (!selectedResponse) return;

    const q = form.questions.find(item => item.id === questionId);
    if (!q) return;
    const maxPoints = q.points;
    const constrainedValue = Math.min(Math.max(0, value), maxPoints);

    const updatedAnswers = selectedResponse.answers.map(ans => {
      if (ans.questionId === questionId) {
        return { ...ans, manualPoints: constrainedValue };
      }
      return ans;
    });

    const updatedResp = recalculateResponseScore({
      ...selectedResponse,
      answers: updatedAnswers
    });

    setSelectedResponse(updatedResp);
    onUpdateResponse(updatedResp);
  };

  const handleResetManualPoints = (questionId: string) => {
    if (!selectedResponse) return;

    const updatedAnswers = selectedResponse.answers.map(ans => {
      if (ans.questionId === questionId) {
        const copy = { ...ans };
        delete copy.manualPoints;
        return copy;
      }
      return ans;
    });

    const updatedResp = recalculateResponseScore({
      ...selectedResponse,
      answers: updatedAnswers
    });

    setSelectedResponse(updatedResp);
    onUpdateResponse(updatedResp);
  };

  // Filters responses based on search name
  const filteredResponses = responses.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.studentId && r.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Compute metrics
  const totalResponses = responses.length;
  const isQuiz = form.isQuiz;
  
  const scoreStats = React.useMemo(() => {
    if (!isQuiz || totalResponses === 0) return { avg: 0, max: 0, min: 0 };
    
    const scores = responses.map(r => r.score || 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / totalResponses;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    
    return { avg: Math.round(avg * 10) / 10, max, min };
  }, [responses, isQuiz, totalResponses]);

  // Total possible quiz points
  const totalPointsPossible = form.questions.reduce((sum, q) => sum + q.points, 0);

  // Question Difficulty Analysis (% Correct for MC, Checkboxes, Short Answer)
  const questionAnalysis = React.useMemo(() => {
    if (totalResponses === 0) return [];

    return form.questions.map((q, qIdx) => {
      let correctCount = 0;
      let totalAnswered = 0;

      responses.forEach(r => {
        const studentAns = r.answers.find(ans => ans.questionId === q.id);
        if (!studentAns) return;
        totalAnswered++;

        if (q.type === QuestionType.MULTIPLE_CHOICE) {
          if (studentAns.value === q.correctAnswer) correctCount++;
        } else if (q.type === QuestionType.CHECKBOXES) {
          const sList = Array.isArray(studentAns.value) ? [...studentAns.value].sort() : [];
          const cList = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
          const isCorrect = sList.length === cList.length && sList.every((val, idx) => val === cList[idx]);
          if (isCorrect) correctCount++;
        } else if (q.type === QuestionType.SHORT_ANSWER) {
          const sText = typeof studentAns.value === 'string' ? studentAns.value.trim().toLowerCase() : '';
          const cText = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '';
          if (sText && sText === cText) correctCount++;
        } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
          const studentMap = (studentAns.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns.value))
            ? studentAns.value as Record<string, string>
            : {};
          const isCorrect = q.matchingPairs.every(pair => studentMap[pair.id] === pair.right);
          if (isCorrect) correctCount++;
        }
      });

      const successRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      
      return {
        id: q.id,
        title: q.title,
        type: q.type,
        index: qIdx + 1,
        successRate,
        correctCount,
        totalAnswered
      };
    });
  }, [form.questions, responses, totalResponses]);

  // Score distribution bins (0-25%, 26-50%, 51-75%, 76-100%)
  const scoreDistribution = React.useMemo(() => {
    if (!isQuiz || totalResponses === 0 || totalPointsPossible === 0) {
      return [
        { label: '0-25%', count: 0 },
        { label: '26-50%', count: 0 },
        { label: '51-75%', count: 0 },
        { label: '76-100%', count: 0 }
      ];
    }

    let bin1 = 0; // 0-25%
    let bin2 = 0; // 26-50%
    let bin3 = 0; // 51-75%
    let bin4 = 0; // 76-100%

    responses.forEach(r => {
      const scorePercentage = ((r.score || 0) / totalPointsPossible) * 100;
      if (scorePercentage <= 25) bin1++;
      else if (scorePercentage <= 50) bin2++;
      else if (scorePercentage <= 75) bin3++;
      else bin4++;
    });

    return [
      { label: 'Kurang (0-25%)', count: bin1, percent: Math.round((bin1 / totalResponses) * 100) },
      { label: 'Cukup (26-50%)', count: bin2, percent: Math.round((bin2 / totalResponses) * 100) },
      { label: 'Baik (51-75%)', count: bin3, percent: Math.round((bin3 / totalResponses) * 100) },
      { label: 'Sangat Baik (76-100%)', count: bin4, percent: Math.round((bin4 / totalResponses) * 100) }
    ];
  }, [responses, isQuiz, totalResponses, totalPointsPossible]);

  const handleClearClick = () => {
    const confirmClear = window.confirm(
      'Apakah Anda yakin ingin menghapus semua respons siswa? Tindakan ini permanen dan tidak dapat dibatalkan.'
    );
    if (confirmClear) {
      onClearResponses();
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Responden</p>
            <p className="text-xl font-bold text-slate-800">{totalResponses} <span className="text-xs text-slate-400 font-medium">Siswa</span></p>
          </div>
        </div>

        {/* Metric 2 */}
        {/* Metric 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Rerata Nilai</p>
            <p className="text-xl font-bold text-slate-800">
              {isQuiz && totalResponses > 0 ? `${scoreStats.avg} ` : '-'}
              <span className="text-xs text-slate-400 font-medium">{isQuiz && totalResponses > 0 ? `/ ${totalPointsPossible}` : 'Non-Kuis'}</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Nilai Tertinggi</p>
            <p className="text-xl font-bold text-emerald-700">
              {isQuiz && totalResponses > 0 ? `${scoreStats.max} ` : '-'}
              <span className="text-xs text-slate-400 font-medium">{isQuiz && totalResponses > 0 ? 'Poin' : 'Non-Kuis'}</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Nilai Terendah</p>
            <p className="text-xl font-bold text-rose-700">
              {isQuiz && totalResponses > 0 ? `${scoreStats.min} ` : '-'}
              <span className="text-xs text-slate-400 font-medium">{isQuiz && totalResponses > 0 ? 'Poin' : 'Non-Kuis'}</span>
            </p>
          </div>
        </div>
      </div>

      {totalResponses === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
          <BarChart className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-700 text-sm">Belum Ada Jawaban Masuk</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Formulir evaluasi pembelajaran ini belum memiliki respon dari siswa. Bagikan kuis Anda ke siswa menggunakan tombol <strong>Pratinjau Kuis</strong> lalu lakukan simulasi pengiriman jawaban.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List Table (Left Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700">Daftar Hasil Belajar Siswa</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 left-2.5" />
                    <input
                      id="stats-search-input"
                      type="text"
                      placeholder="Cari nama siswa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden bg-white w-40 sm:w-48"
                    />
                  </div>
                  <button
                    id="clear-responses-btn"
                    onClick={handleClearClick}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer bg-white"
                    title="Hapus semua respon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-3xs font-extrabold text-slate-400 uppercase bg-slate-50/20">
                      <th className="py-3 px-4">Nama Lengkap</th>
                      {isQuiz && <th className="py-3 px-4 text-center">Skor Akhir</th>
                      }
                      <th className="py-3 px-4 hidden sm:table-cell">Waktu Submit</th>
                      <th className="py-3 px-4 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                          Tidak ditemukan siswa dengan pencarian "{searchTerm}"
                        </td>
                      </tr>
                    ) : (
                      filteredResponses.map((r) => (
                        <tr 
                          key={r.id} 
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs text-slate-600"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>{r.studentName}</span>
                              {r.studentId && <span className="text-3xs text-slate-400 font-medium">NIS: {r.studentId}</span>}
                            </div>
                          </td>
                          {isQuiz && (
                            <td className="py-3.5 px-4 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded-sm ${
                                (r.score || 0) >= totalPointsPossible * 0.75 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : (r.score || 0) >= totalPointsPossible * 0.5 
                                    ? 'bg-amber-50 text-amber-700' 
                                    : 'bg-red-50 text-red-700'
                              }`}>
                                {r.score} / {totalPointsPossible}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-slate-400 hidden sm:table-cell">
                            {new Date(r.submittedAt).toLocaleDateString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              id={`view-detail-btn-${r.id}`}
                              onClick={() => setSelectedResponse(r)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-1 rounded-md transition-colors cursor-pointer"
                              title="Lihat Lembar Ujian"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Difficulty Analysis Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Analisis Butir Soal (% Sukses Siswa)</h3>
                <p className="text-3xs text-slate-400">Menampilkan persentase siswa yang menjawab setiap nomor soal dengan benar</p>
              </div>

              <div className="space-y-3.5 pt-1">
                {questionAnalysis.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-3xs font-semibold text-slate-500">
                      <span className="truncate max-w-[80%]">Soal {item.index}: {item.title}</span>
                      <span className={`${
                        item.successRate >= 75 
                          ? 'text-emerald-600' 
                          : item.successRate >= 45 
                            ? 'text-amber-600' 
                            : 'text-rose-600'
                      }`}>
                        {item.successRate}% Benar ({item.correctCount}/{item.totalAnswered} siswa)
                      </span>
                    </div>
                    {/* SVG Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.successRate >= 75 
                            ? 'bg-emerald-500' 
                            : item.successRate >= 45 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.successRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Charts / Right column (Grade Distribution SVG) */}
          <div className="space-y-4">
            {isQuiz && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Distribusi Rentang Nilai</h3>
                  <p className="text-3xs text-slate-400">Pengelompokan performa siswa berdasarkan persentase nilai</p>
                </div>

                {/* Custom SVG/HTML Bar Chart */}
                <div className="space-y-4 pt-2">
                  {scoreDistribution.map((bin, idx) => {
                    const maxBinCount = Math.max(...scoreDistribution.map(b => b.count)) || 1;
                    const barWidth = (bin.count / maxBinCount) * 100;
                    
                    // Assign colors
                    const colors = [
                      'bg-rose-400 text-rose-700',
                      'bg-amber-400 text-amber-700',
                      'bg-blue-400 text-blue-700',
                      'bg-emerald-400 text-emerald-700'
                    ];

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-3xs font-semibold text-slate-500">
                          <span>{bin.label}</span>
                          <span>{bin.count} Siswa ({bin.percent}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="grow bg-slate-200 h-6 rounded-md overflow-hidden relative">
                            {bin.count > 0 && (
                              <div 
                                className={`h-full rounded-md flex items-center justify-end pr-2 font-bold text-4xs transition-all duration-500 ${colors[idx]}`}
                                style={{ width: `${barWidth}%` }}
                              >
                                {bin.count}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Template Card for quick references */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Tips Guru Evaluasi</span>
              </h4>
              <ul className="text-3xs text-slate-600 space-y-2 list-disc pl-3.5 leading-relaxed">
                <li>Gunakan <strong>"Analisis Butir Soal"</strong> untuk mengetahui topik mana saja yang masih belum dikuasai oleh mayoritas kelas (sukses rate di bawah 50%).</li>
                <li>Klik tombol pratinjau di baris tabel siswa untuk meninjau secara mendalam jawaban essay tertulis mereka.</li>
                <li>Gunakan menu <strong>"Ekspor ke Google Forms"</strong> di Form Builder jika ingin memindahkan kuis kustom ini ke ekosistem awan Google secara langsung.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL SHEET MODAL POPUP */}
      {selectedResponse && (
        <div id="student-detail-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-semibold text-sm text-white">Lembar Jawaban Siswa</h3>
                  <p className="text-4xs text-slate-400">Lembar Ujian Digital Mandiri</p>
                </div>
              </div>
              <button 
                id="close-student-detail"
                onClick={() => setSelectedResponse(null)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body scroll */}
            <div className="p-6 overflow-y-auto space-y-5 grow">
              {/* Profile Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Nama Lengkap Siswa</p>
                  <p className="text-sm font-bold text-slate-800">{selectedResponse.studentName}</p>
                  {selectedResponse.studentId && (
                    <p className="text-3xs text-slate-500 font-medium">Nomor Induk: {selectedResponse.studentId}</p>
                  )}
                </div>
                {isQuiz && selectedResponse.score !== undefined && (
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg px-4 py-2 text-right shrink-0">
                    <p className="text-4xs font-bold uppercase tracking-wider text-indigo-500">Skor Diperoleh</p>
                    <p className="text-lg font-black text-slate-800">
                      {selectedResponse.score} <span className="text-xs text-slate-400 font-semibold">/ {totalPointsPossible} pt</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Answers Grid */}
              <div className="space-y-4">
                <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Detail Jawaban Siswa per Butir</h4>
                
                {form.questions.map((q, idx) => {
                  const studentAns = selectedResponse.answers.find(ans => ans.questionId === q.id);
                  let isCorrect = false;

                  if (q.type === QuestionType.MULTIPLE_CHOICE) {
                    isCorrect = studentAns?.value === q.correctAnswer;
                  } else if (q.type === QuestionType.CHECKBOXES) {
                    const sList = Array.isArray(studentAns?.value) ? [...studentAns.value].sort() : [];
                    const cList = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
                    isCorrect = sList.length === cList.length && sList.every((val, idx) => val === cList[idx]);
                  } else if (q.type === QuestionType.SHORT_ANSWER) {
                    const sVal = typeof studentAns?.value === 'string' ? studentAns.value.trim().toLowerCase() : '';
                    const cVal = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '';
                    isCorrect = sVal === cVal;
                  } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
                    const studentMap = (studentAns?.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns?.value))
                      ? (studentAns.value as Record<string, string>)
                      : {};
                    isCorrect = q.matchingPairs.every(pair => studentMap[pair.id] === pair.right);
                  }

                  return (
                    <div 
                      key={q.id} 
                      className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                        !isQuiz || q.points === 0
                          ? 'border-slate-200 bg-slate-50/20'
                          : isCorrect 
                            ? 'border-emerald-200 bg-emerald-50/10' 
                            : 'border-rose-200 bg-rose-50/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-bold text-slate-800">Soal {idx + 1}. {q.title}</span>
                        {isQuiz && q.points > 0 && (
                          <span className={`text-4xs font-bold px-2 py-0.5 rounded-sm ${
                            studentAns?.manualPoints !== undefined
                              ? 'bg-amber-100 text-amber-800'
                              : isCorrect 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            Skor: {studentAns?.manualPoints !== undefined ? studentAns.manualPoints : (isCorrect ? q.points : 0)} / {q.points}
                          </span>
                        )}
                      </div>

                      {/* Answer details based on type */}
                      {q.type === QuestionType.MATCHING && q.matchingPairs ? (
                        <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                          <p className="text-3xs text-slate-400 font-bold uppercase mb-1">Hasil Menjodohkan Siswa:</p>
                          <div className="space-y-1">
                            {q.matchingPairs.map(pair => {
                              const studentMap = (studentAns?.value && typeof studentAns.value === 'object' && !Array.isArray(studentAns.value))
                                ? (studentAns.value as Record<string, string>)
                                : {};
                              const matchedVal = studentMap[pair.id] || '(Belum Dijawab)';
                              const isPairCorrect = matchedVal === pair.right;

                              return (
                                <div 
                                  key={pair.id}
                                  className={`flex items-center gap-2 p-1.5 rounded-md border text-3xs ${
                                    isPairCorrect 
                                      ? 'bg-emerald-50/50 text-emerald-950 border-emerald-100/30' 
                                      : 'bg-rose-50/50 text-rose-950 border-rose-100/30'
                                  }`}
                                >
                                  <span className="font-bold">{pair.left}</span>
                                  <span className="text-slate-400">⇔</span>
                                  <span className="font-semibold">{matchedVal}</span>
                                  {!isPairCorrect && (
                                    <span className="ml-auto text-4xs bg-emerald-100 text-emerald-800 px-1 rounded-xs font-bold uppercase">Kunci: {pair.right}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : q.options ? (
                        <div className="space-y-1.5 pl-1">
                          {q.options.map(opt => {
                            const isSelectedOpt = q.type === QuestionType.MULTIPLE_CHOICE
                              ? studentAns?.value === opt.id
                              : Array.isArray(studentAns?.value) && studentAns.value.includes(opt.id);
                            
                            const isCorrectOpt = q.type === QuestionType.MULTIPLE_CHOICE
                              ? q.correctAnswer === opt.id
                              : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id);

                            return (
                              <div 
                                key={opt.id}
                                className={`flex items-center gap-2 p-1.5 rounded-md ${
                                  isCorrectOpt 
                                    ? 'bg-emerald-100/50 text-emerald-900 border border-emerald-100/30' 
                                    : isSelectedOpt 
                                      ? 'bg-rose-100/50 text-rose-900 border border-rose-100/30' 
                                      : 'text-slate-500'
                                  }`}
                              >
                                <span className="font-medium text-3xs">{opt.text}</span>
                                {isCorrectOpt && <span className="ml-auto text-4xs bg-emerald-200 text-emerald-800 px-1 rounded-xs font-bold uppercase">Kunci</span>}
                                {isSelectedOpt && !isCorrectOpt && <span className="ml-auto text-4xs bg-rose-200 text-rose-800 px-1 rounded-xs font-bold uppercase">Dipilih</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pl-2 border-l-2 border-slate-200 space-y-1">
                          <p className="text-slate-600">
                            <strong>Jawaban Siswa:</strong>{' '}
                            <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              {studentAns?.value as string || '(Tidak dijawab)'}
                            </span>
                          </p>
                          {isQuiz && !isCorrect && q.type === QuestionType.SHORT_ANSWER && (
                            <p className="text-emerald-700 font-semibold text-3xs">
                              Kunci Jawaban Benar: {q.correctAnswer as string}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Manual Grading Field */}
                      {isQuiz && (
                        <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-4xs font-bold text-slate-500 uppercase tracking-wider">Koreksi Nilai Guru:</span>
                          <input 
                            type="number"
                            className="w-12 px-1 py-0.5 text-xs text-center border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
                            min="0"
                            max={q.points}
                            value={studentAns?.manualPoints !== undefined ? studentAns.manualPoints : (isCorrect ? q.points : 0)}
                            onChange={(e) => handleManualPointsChange(q.id, Number(e.target.value))}
                          />
                          <span className="text-4xs text-slate-400 font-medium">/ Maks {q.points} pt</span>
                          
                          {studentAns?.manualPoints !== undefined && (
                            <button
                              type="button"
                              onClick={() => handleResetManualPoints(q.id)}
                              className="text-4xs text-indigo-600 hover:text-indigo-800 font-extrabold ml-auto uppercase tracking-wide cursor-pointer"
                              title="Kembalikan ke penilaian kuis otomatis"
                            >
                              Reset Otomatis
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button 
                id="close-student-detail-footer"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Tutup Lembar Jawaban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
