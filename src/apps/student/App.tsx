import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ExamRunner } from './components/ExamRunner';
import { ResultSummary } from './components/ResultSummary';
import { EncryptedExamPackage, Exam, StudentResult } from '../../lib/types';
import { decryptData } from '../../lib/crypto';
import { Lock, Upload, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react';

type View = 'load' | 'exam' | 'result';

export default function StudentApp() {
  const [view, setView] = useState<View>('load');
  const [exam, setExam] = useState<Exam | null>(null);
  const [passcode, setPasscode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<StudentResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load Exam Handler
  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!passcode || !studentName || !studentId) {
      setError('Please fill in all details before loading the exam file.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const text = await file.text();
      const encryptedPackage: EncryptedExamPackage = JSON.parse(text);

      // Decrypt
      const decryptedExam = await decryptData<Exam>(encryptedPackage, passcode);
      
      setExam(decryptedExam);
      setView('exam');
    } catch (err) {
      console.error(err);
      setError('Failed to load exam. Invalid passcode or corrupted file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamComplete = (result: StudentResult) => {
    setResult(result);
    setView('result');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {view === 'load' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium mb-4">
              <WifiOff size={12} />
              Offline Mode Active
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CBT Exam Portal</h1>
            <p className="text-gray-500 mt-2">Secure • Offline • Tamper-Proof</p>
          </div>

          <Card className="w-full max-w-lg p-8 space-y-8 shadow-xl border-t-4 border-blue-600 bg-white">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Student Details</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                    <Input
                      label="Student ID"
                      placeholder="ST-2026-001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Exam Access</h3>
                  <div className="mt-2">
                    <Input
                      label="Exam Passcode"
                      type="password"
                      placeholder="Enter passcode from whiteboard"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Load Exam File</h3>
                  <div className="mt-2">
                    <label className={`
                      flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${isLoading ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-300 hover:bg-blue-100'}
                    `}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-3 text-blue-500" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">.cbt files only</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".cbt"
                        onChange={handleFileLoad}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm flex items-start animate-pulse">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>
          
          <p className="mt-8 text-xs text-gray-400">
            System Ready • v1.0.0 • {new Date().getFullYear()}
          </p>
        </div>
      )}

      {view === 'exam' && exam && (
        <ExamRunner
          exam={exam}
          studentName={studentName}
          studentId={studentId}
          passcode={passcode} // Needed for signing result at the end
          onComplete={handleExamComplete}
        />
      )}

      {view === 'result' && result && (
        <ResultSummary result={result} />
      )}
    </div>
  );
}
