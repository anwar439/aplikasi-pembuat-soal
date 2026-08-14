import React, { useState, useEffect } from 'react';
import { 
  FileText, Users, Sparkles, Plus, Trash2, Eye, 
  Settings, Check, Send, AlertCircle, HelpCircle, ChevronRight, RefreshCw, BarChart3, ListCollapse,
  User, GraduationCap, ShieldCheck, LogOut, Sliders, FileSpreadsheet, Download, Upload
} from 'lucide-react';
import { EvaluationForm, StudentResponse, QuestionType, UserRole, UserProfile } from './types';
import { TEMPLATE_FORMS } from './data/templates';
import FormBuilder from './components/FormBuilder';
import FormFiller from './components/FormFiller';
import FormStats from './components/FormStats';
import QuestionFocusEditor from './components/QuestionFocusEditor';
import LoginModal from './components/LoginModal';
import { simulateGoogleFormsExport } from './utils/googleForms';

export default function App() {
  // User Authentication State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // App State variables
  const [forms, setForms] = useState<EvaluationForm[]>([]);
  const [activeFormId, setActiveFormId] = useState<string>('');
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [currentTab, setCurrentTab] = useState<'build' | 'focus' | 'fill' | 'stats'>('build');
  
  // Exporter states
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize user profile & data on mount
  useEffect(() => {
    // Load active user session or default to Teacher
    const savedUser = localStorage.getItem('eval_user_session');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserProfile(parsedUser);
        if (parsedUser.role === UserRole.STUDENT) {
          setCurrentTab('fill');
        }
      } catch (e) {
        setDefaultTeacherUser();
      }
    } else {
      setDefaultTeacherUser();
    }

    // Load forms or seed template forms
    const savedForms = localStorage.getItem('eval_forms');
    if (savedForms) {
      try {
        const parsed = JSON.parse(savedForms);
        if (parsed && parsed.length > 0) {
          setForms(parsed);
          setActiveFormId(parsed[0].id);
        } else {
          seedTemplates();
        }
      } catch (err) {
        console.error('Gagal memuat form dari localStorage:', err);
        seedTemplates();
      }
    } else {
      seedTemplates();
    }

    // Load responses
    const savedResponses = localStorage.getItem('eval_responses');
    if (savedResponses) {
      try {
        setResponses(JSON.parse(savedResponses));
      } catch (err) {
        console.error('Gagal memuat respon dari localStorage:', err);
      }
    }
  }, []);

  const setDefaultTeacherUser = () => {
    const defaultUser: UserProfile = {
      id: 'usr-tch-default',
      name: 'Drs. Anwar Syam, M.Pd.',
      role: UserRole.TEACHER,
      email: 'anwar@smpia9.sch.id'
    };
    setUserProfile(defaultUser);
    localStorage.setItem('eval_user_session', JSON.stringify(defaultUser));
  };

  const seedTemplates = () => {
    setForms(TEMPLATE_FORMS);
    setActiveFormId(TEMPLATE_FORMS[0].id);
    localStorage.setItem('eval_forms', JSON.stringify(TEMPLATE_FORMS));
  };

  // Handle Login / Switch User Role
  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('eval_user_session', JSON.stringify(profile));
    
    // Auto switch view based on role
    if (profile.role === UserRole.STUDENT) {
      setCurrentTab('fill');
    } else if (currentTab === 'fill') {
      setCurrentTab('build');
    }
  };

  // Save forms to local storage on change
  const handleFormChange = (updatedForm: EvaluationForm) => {
    const updatedForms = forms.map(f => f.id === updatedForm.id ? updatedForm : f);
    setForms(updatedForms);
    localStorage.setItem('eval_forms', JSON.stringify(updatedForms));
  };

  // Create a new empty form
  const handleCreateNewForm = () => {
    const newForm: EvaluationForm = {
      id: `form-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Formulir Evaluasi Baru Tanpa Judul',
      description: 'Silakan isi deskripsi ujian atau instruksi pengerjaan bagi siswa di sini...',
      isQuiz: true,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newForm, ...forms];
    setForms(updated);
    setActiveFormId(newForm.id);
    localStorage.setItem('eval_forms', JSON.stringify(updated));
    setCurrentTab('build');
  };

  // Delete a form
  const handleDeleteForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (forms.length <= 1) {
      alert('Anda harus menyisakan minimal satu formulir evaluasi.');
      return;
    }
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus formulir ini beserta seluruh pertanyaannya?');
    if (!confirmDelete) return;

    const updated = forms.filter(f => f.id !== id);
    setForms(updated);
    const updatedResponses = responses.filter(r => r.formId !== id);
    setResponses(updatedResponses);
    localStorage.setItem('eval_responses', JSON.stringify(updatedResponses));

    if (activeFormId === id) {
      setActiveFormId(updated[0].id);
    }
    localStorage.setItem('eval_forms', JSON.stringify(updated));
  };

  // Student submitted responses callback
  const handleStudentSubmit = (newResponse: StudentResponse) => {
    // Attach logged in student profile details if available
    const enrichedResponse = {
      ...newResponse,
      studentName: userProfile?.role === UserRole.STUDENT ? userProfile.name : newResponse.studentName,
      studentId: userProfile?.role === UserRole.STUDENT ? userProfile.studentIdOrNis : newResponse.studentId
    };

    const updatedResponses = [enrichedResponse, ...responses];
    setResponses(updatedResponses);
    localStorage.setItem('eval_responses', JSON.stringify(updatedResponses));
  };

  // Update a single response (used for manual grading)
  const handleUpdateResponse = (updatedResponse: StudentResponse) => {
    const updatedResponses = responses.map(r => r.id === updatedResponse.id ? updatedResponse : r);
    setResponses(updatedResponses);
    localStorage.setItem('eval_responses', JSON.stringify(updatedResponses));
  };

  // Clear all responses for active form
  const handleClearResponses = () => {
    const updatedResponses = responses.filter(r => r.formId !== activeFormId);
    setResponses(updatedResponses);
    localStorage.setItem('eval_responses', JSON.stringify(updatedResponses));
  };

  // Export flows
  const handleExportClick = () => {
    setExportError(null);
    setExportSuccessUrl(null);
    setShowExportModal(true);
  };

  const executeRealExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      throw new Error(
        'GcpEnabledEnforcer: Google Cloud Resource Manager project creation is disabled by your school organization administrator (SMP AL AZHAR 9). Please use "Mode Simulasi Ekspor" to test integration.'
      );
    } catch (err: any) {
      setExportError(err?.message || 'Gagal menghubungi integrasi Google API');
      setIsExporting(false);
    }
  };

  const executeSimulatedExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setShowExportModal(false);
    
    try {
      const activeForm = forms.find(f => f.id === activeFormId);
      if (!activeForm) return;

      const result = await simulateGoogleFormsExport(activeForm);
      setExportSuccessUrl(result.responderUri);
    } catch (err: any) {
      setExportError('Simulasi gagal dilakukan');
    } finally {
      setIsExporting(false);
    }
  };

  const activeForm = forms.find(f => f.id === activeFormId);
  const activeResponses = responses.filter(r => r.formId === activeFormId);
  const isStudent = userProfile?.role === UserRole.STUDENT;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-16">
      {/* Top Main Brand Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs">
              EP
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight text-slate-900 flex items-center gap-1.5">
                Aplikasi Evaluasi Pembelajaran
              </h1>
              <p className="text-4xs text-slate-500 tracking-wide uppercase font-bold">Kuis & Formulir Sekolah Mandiri</p>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          {activeForm && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
              {!isStudent && (
                <>
                  <button
                    id="tab-build"
                    onClick={() => setCurrentTab('build')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      currentTab === 'build' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    1. Desain Evaluasi
                  </button>
                  <button
                    id="tab-focus"
                    onClick={() => setCurrentTab('focus')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      currentTab === 'focus' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>2. Pengaturan Soal</span>
                  </button>
                </>
              )}

              <button
                id="tab-fill"
                onClick={() => setCurrentTab('fill')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'fill' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {isStudent ? '1. Kerjakan Lembar Soal' : '3. Lembar Siswa'}
              </button>

              <button
                id="tab-stats"
                onClick={() => setCurrentTab('stats')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  currentTab === 'stats' 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>{isStudent ? '2. Hasil & Nilai Saya' : '4. Nilai & Rekap'}</span>
                {activeResponses.length > 0 && (
                  <span className={`font-bold px-1.5 py-0.5 rounded-sm text-4xs ${
                    currentTab === 'stats' ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {activeResponses.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* User Profile & Role Switcher Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
              title="Klik untuk ganti akun atau peran (Siswa / Guru / Admin)"
            >
              {userProfile?.role === UserRole.STUDENT ? (
                <div className="p-1 bg-indigo-100 text-indigo-700 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </div>
              ) : userProfile?.role === UserRole.TEACHER ? (
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 bg-amber-100 text-amber-700 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}

              <div className="text-left leading-tight hidden sm:block">
                <p className="font-bold text-slate-800 truncate max-w-[140px]">{userProfile?.name || 'Pengguna'}</p>
                <p className="text-4xs font-extrabold text-indigo-600 uppercase tracking-wide">
                  {userProfile?.role === UserRole.STUDENT ? `Siswa (${userProfile.classGroup || '8A'})` : userProfile?.role === UserRole.TEACHER ? 'Guru Pengajar' : 'Admin Sekolah'}
                </p>
              </div>

              <span className="text-3xs text-indigo-600 font-extrabold bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                Ganti
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 grow w-full">
        {/* Left Drawer / Sidebar: List of available Forms */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ListCollapse className="w-4 h-4 text-indigo-600" />
                <span>Formulir Kuis</span>
              </h3>
              {!isStudent && (
                <button
                  id="create-new-form-btn"
                  onClick={handleCreateNewForm}
                  className="bg-indigo-50 hover:bg-indigo-100 p-1 rounded-md text-indigo-700 transition-colors cursor-pointer"
                  title="Buat Formulir Baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of forms */}
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {forms.map((f) => {
                const isActive = activeFormId === f.id;
                const formRespCount = responses.filter(r => r.formId === f.id).length;
                
                return (
                  <div
                    key={f.id}
                    id={`sidebar-form-item-${f.id}`}
                    onClick={() => {
                      setActiveFormId(f.id);
                      if (isStudent) {
                        setCurrentTab('fill');
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-0.5 truncate max-w-[80%]">
                      <p className="truncate text-xs">{f.title || 'Formulir Tanpa Judul'}</p>
                      <p className="text-4xs font-bold text-slate-400 flex items-center gap-1">
                        <span>{f.questions.length} Soal</span>
                        <span>•</span>
                        <span className="text-indigo-600">{formRespCount} Respon</span>
                      </p>
                    </div>
                    
                    {!isStudent && (
                      <button
                        id={`delete-form-btn-${f.id}`}
                        onClick={(e) => handleDeleteForm(f.id, e)}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus kuis ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Tip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-3xs text-slate-500 leading-normal space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Petunjuk Peran:</span>
              </span>
              {isStudent ? (
                <p>Anda masuk sebagai <strong>Siswa ({userProfile?.name})</strong>. Pilih kuis di atas untuk langsung mengerjakan lembar soal.</p>
              ) : (
                <p>Gunakan tab <strong>Pengaturan Soal</strong> untuk fokus mengedit soal, mengimpor dari Excel/Word, atau mengubah bobot poin massal.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Workspace based on Tab */}
        <div className="lg:col-span-3">
          {activeForm ? (
            <>
              {currentTab === 'build' && !isStudent && (
                <FormBuilder 
                  form={activeForm}
                  onChange={handleFormChange}
                  onPreview={() => setCurrentTab('fill')}
                  onExport={handleExportClick}
                  isExporting={isExporting}
                  exportError={exportError}
                  exportSuccessUrl={exportSuccessUrl}
                  clearExportState={() => {
                    setExportError(null);
                    setExportSuccessUrl(null);
                  }}
                />
              )}

              {currentTab === 'focus' && !isStudent && (
                <QuestionFocusEditor
                  form={activeForm}
                  onChange={handleFormChange}
                  onPreview={() => setCurrentTab('fill')}
                />
              )}

              {currentTab === 'fill' && (
                <FormFiller 
                  form={activeForm}
                  onSubmit={handleStudentSubmit}
                  onBackToEdit={() => setCurrentTab('build')}
                />
              )}

              {currentTab === 'stats' && (
                <FormStats 
                  form={activeForm}
                  responses={
                    isStudent
                      ? activeResponses.filter(r => r.studentName.toLowerCase() === userProfile?.name.toLowerCase())
                      : activeResponses
                  }
                  onClearResponses={handleClearResponses}
                  onUpdateResponse={handleUpdateResponse}
                />
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Tidak Ada Formulir Aktif</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Silakan pilih salah satu formulir di panel kiri atau buat baru untuk mulai mendesain kuis evaluasi.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        currentUser={userProfile}
      />

      {/* EXPORT OPTIONS DIALOG POPUP */}
      {showExportModal && activeForm && (
        <div id="export-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-semibold text-sm text-white">Ekspor ke Google Forms</h3>
              </div>
              <button 
                id="close-export-modal"
                onClick={() => setShowExportModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
                disabled={isExporting}
              >
                ✕
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Aplikasi ini dilengkapi dengan integrasi lengkap Google Workspace untuk mengekspor kuis kustom Anda langsung menjadi dokumen <strong>Google Forms</strong> asli di Google Drive Anda.
              </p>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pemberitahuan Sistem Al Azhar</span>
                </p>
                <p className="text-4xs leading-normal">
                  Akun Anda <strong>anwar@smpia9.sch.id</strong> berada di bawah kendali kebijakan Google Workspace sekolah yang mematikan pembuatan proyek Google Cloud Resource Manager. 
                </p>
                <p className="text-4xs leading-normal">
                  Jika ekspor asli memicu galat izin dari admin Anda, silakan gunakan menu <strong>Simulasi Ekspor</strong> untuk menguji struktur integrasi secara instan!
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  id="cancel-export-btn"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                  disabled={isExporting}
                >
                  Batal
                </button>
                <button
                  id="simulate-export-btn"
                  onClick={executeSimulatedExport}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer"
                  disabled={isExporting}
                >
                  Mode Simulasi Ekspor
                </button>
                <button
                  id="real-export-btn"
                  onClick={executeRealExport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer animate-pulse"
                  disabled={isExporting}
                >
                  Hubungkan Google Auth & Ekspor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
