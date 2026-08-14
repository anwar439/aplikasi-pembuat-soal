import React, { useState } from 'react';
import { 
  User, GraduationCap, ShieldCheck, LogIn, KeyRound, Sparkles, X, CheckCircle2
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
  currentUser: UserProfile | null;
}

export default function LoginModal({ isOpen, onClose, onLogin, currentUser }: LoginModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Student inputs
  const [studentName, setStudentName] = useState('');
  const [studentNis, setStudentNis] = useState('');
  const [studentClass, setStudentClass] = useState('8A');

  // Teacher inputs
  const [teacherName, setTeacherName] = useState('Drs. Anwar Syam, M.Pd.');
  const [teacherEmail, setTeacherEmail] = useState('anwar@smpia9.sch.id');

  // Admin inputs
  const [adminName, setAdminName] = useState('Admin Kurikulum SMP IA 9');
  const [adminPin, setAdminPin] = useState('1234');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === UserRole.STUDENT) {
      if (!studentName.trim()) return;
      onLogin({
        id: `usr-std-${Math.random().toString(36).substr(2, 6)}`,
        name: studentName.trim(),
        role: UserRole.STUDENT,
        studentIdOrNis: studentNis.trim() || 'NIS-2026',
        classGroup: studentClass
      });
    } else if (selectedRole === UserRole.TEACHER) {
      if (!teacherName.trim()) return;
      onLogin({
        id: `usr-tch-${Math.random().toString(36).substr(2, 6)}`,
        name: teacherName.trim(),
        role: UserRole.TEACHER,
        email: teacherEmail.trim() || 'guru@smpia9.sch.id'
      });
    } else if (selectedRole === UserRole.ADMIN) {
      if (adminPin !== '1234' && adminPin !== 'admin') {
        setPinError('PIN Admin salah (Gunakan PIN Demo: 1234)');
        return;
      }
      onLogin({
        id: `usr-adm-${Math.random().toString(36).substr(2, 6)}`,
        name: adminName.trim(),
        role: UserRole.ADMIN,
        email: 'admin@smpia9.sch.id'
      });
    }
    onClose();
  };

  // Demo Login Quick Action
  const handleQuickDemo = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      onLogin({
        id: 'usr-std-demo',
        name: 'Ahmad Fauzi',
        role: UserRole.STUDENT,
        studentIdOrNis: 'NISN-8820491',
        classGroup: '8A'
      });
    } else if (role === UserRole.TEACHER) {
      onLogin({
        id: 'usr-tch-demo',
        name: 'Drs. Anwar Syam, M.Pd.',
        role: UserRole.TEACHER,
        email: 'anwar@smpia9.sch.id'
      });
    } else {
      onLogin({
        id: 'usr-adm-demo',
        name: 'Administrator Kurikulum',
        role: UserRole.ADMIN,
        email: 'admin@smpia9.sch.id'
      });
    }
    onClose();
  };

  return (
    <div id="login-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base">
              EP
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Masuk / Ganti Peran Pengguna</h3>
              <p className="text-4xs text-slate-400 font-medium">Sistem Evaluasi Pembelajaran Sekolah</p>
            </div>
          </div>
          {currentUser && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Switcher Tabs */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setSelectedRole(UserRole.STUDENT); setPinError(null); }}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all cursor-pointer ${
                selectedRole === UserRole.STUDENT ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Murid / Siswa</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setSelectedRole(UserRole.TEACHER); setPinError(null); }}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all cursor-pointer ${
                selectedRole === UserRole.TEACHER ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Guru / Pengajar</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRole(UserRole.ADMIN); setPinError(null); }}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all cursor-pointer ${
                selectedRole === UserRole.ADMIN ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Admin Sekolah</span>
            </button>
          </div>

          {/* Login Form based on role */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === UserRole.STUDENT && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-3xs text-indigo-900 leading-normal">
                  <strong>Akses Siswa:</strong> Anda dapat mengerjakan evaluasi/soal yang ditugaskan oleh guru dan langsung melihat hasil skor milik Anda sendiri.
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Siswa:
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Fauzi"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NIS / NISN:
                    </label>
                    <input 
                      type="text"
                      placeholder="8820491"
                      value={studentNis}
                      onChange={(e) => setStudentNis(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kelas:
                    </label>
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="7A">7A</option>
                      <option value="7B">7B</option>
                      <option value="8A">8A</option>
                      <option value="8B">8B</option>
                      <option value="9A">9A</option>
                      <option value="9B">9B</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === UserRole.TEACHER && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-3xs text-emerald-900 leading-normal">
                  <strong>Akses Guru:</strong> Buat & edit kuis evaluasi, buat soal AI, impor massal dari Excel/Word, serta rekap nilai & analisis statistik seluruh siswa.
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Guru:
                  </label>
                  <input 
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Sekolah / Google Account:
                  </label>
                  <input 
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {selectedRole === UserRole.ADMIN && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-3xs text-amber-900 leading-normal">
                  <strong>Akses Admin Sekolah:</strong> Manajemen penuh formulir, reset data nilai siswa, serta ekspor/impor seluruh data kuis sekolah.
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Administrator:
                  </label>
                  <input 
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PIN Keamanan Admin (Demo PIN: 1234):
                  </label>
                  <input 
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => { setAdminPin(e.target.value); setPinError(null); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {pinError && <p className="text-3xs text-rose-600 font-bold mt-1">{pinError}</p>}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sebagai {selectedRole === UserRole.STUDENT ? 'Siswa' : selectedRole === UserRole.TEACHER ? 'Guru' : 'Admin'}</span>
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-4xs font-extrabold text-slate-400 uppercase tracking-wider block">
              Akses Cepat Demo Skenario:
            </span>
            <div className="grid grid-cols-3 gap-2 text-3xs font-bold">
              <button
                type="button"
                onClick={() => handleQuickDemo(UserRole.STUDENT)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 p-2 rounded-lg transition-colors cursor-pointer text-center"
              >
                Demo Siswa
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo(UserRole.TEACHER)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-2 rounded-lg transition-colors cursor-pointer text-center"
              >
                Demo Guru
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo(UserRole.ADMIN)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 p-2 rounded-lg transition-colors cursor-pointer text-center"
              >
                Demo Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
