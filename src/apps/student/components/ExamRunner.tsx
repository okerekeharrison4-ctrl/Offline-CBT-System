import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Exam, StudentResult, IntegrityLog, SignedResultPackage } from '../../../lib/types';
import { signData, encryptData } from '../../../lib/crypto';
import { formatDuration } from '../../../lib/utils';
import { AlertTriangle, Clock, ShieldAlert, Flag } from 'lucide-react';

interface ExamRunnerProps {
  exam: Exam;
  studentName: string;
  studentId: string;
  passcode: string;
  onComplete: (result: StudentResult) => void;
}

export const ExamRunner = ({ exam, studentName, studentId, passcode, onComplete }: ExamRunnerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [integrityLogs, setIntegrityLogs] = useState<IntegrityLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  
  const startTimeRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = `cbt_progress_${exam.id}_${studentId}`;

  // 0. Load Saved State on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.examId === exam.id && state.studentId === studentId) {
          setAnswers(state.answers);
          setTimeLeft(state.timeLeft);
          setIntegrityLogs(state.integrityLogs);
          setCurrentQuestionIndex(state.currentQuestionIndex);
          setFlaggedQuestions(state.flaggedQuestions || []);
          startTimeRef.current = state.startTime;
          console.log('Restored exam state from local storage');
        }
      } catch (e) {
        console.error('Failed to restore state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 0.5. Auto-Save Effect
  useEffect(() => {
    if (!isLoaded) return;
    
    const state = {
      examId: exam.id,
      studentId,
      answers,
      timeLeft,
      integrityLogs,
      currentQuestionIndex,
      flaggedQuestions,
      startTime: startTimeRef.current,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [answers, timeLeft, integrityLogs, currentQuestionIndex, flaggedQuestions, isLoaded]);

  // 1. Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Integrity Monitoring
  useEffect(() => {
    const logEvent = (event: IntegrityLog['event'], details?: string) => {
      setIntegrityLogs((prev) => [...prev, { timestamp: Date.now(), event, details }]);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) logEvent('focus_lost', 'Tab switched or minimized');
    };

    const handleBlur = () => logEvent('focus_lost', 'Window lost focus');
    
    // Fullscreen enforcement
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.warn('Fullscreen denied', e);
      }
    };
    
    // Attempt fullscreen on mount
    enterFullscreen();

    // Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right click

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, []);

  const handleAnswer = (answer: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [exam.questions[currentQuestionIndex].id]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Calculate Score
    let score = 0;
    let maxScore = 0;
    
    exam.questions.forEach((q) => {
      maxScore += q.points;
      const studentAnswer = answers[q.id];
      
      if (q.type === 'short_answer') {
        // Case insensitive string comparison
        if (typeof studentAnswer === 'string' && 
            typeof q.correctAnswer === 'string' && 
            studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          score += q.points;
        }
      } else {
        // MCQ and True/False (index based)
        if (studentAnswer === q.correctAnswer) {
          score += q.points;
        }
      }
    });

    const percentage = Math.round((score / maxScore) * 100);
    const endTime = Date.now();

    const result: StudentResult = {
      studentName,
      studentId,
      examId: exam.id,
      examTitle: exam.title,
      answers,
      score,
      maxScore,
      percentage,
      integrityLogs,
      startTime: startTimeRef.current,
      endTime,
      timeTakenSeconds: Math.floor((endTime - startTimeRef.current) / 1000),
    };

    // Sign Result
    try {
      // We use the passcode to derive a signing key. 
      // In a real production system, we might use a separate public/private key pair,
      // but for this offline MVP, symmetric key derived from passcode is the standard approach.
      // We need a salt. We can generate a new one or use a fixed one. 
      // Let's generate a new random salt for the signature.
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      const signature = await signData(result, passcode, saltBase64);

      const signedPackage: SignedResultPackage = {
        payload: result,
        signature,
        salt: saltBase64,
      };

      // Auto-download result file
      const blob = new Blob([JSON.stringify(signedPackage)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RESULT_${studentName.replace(/\s+/g, '_')}_${exam.title.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Clear saved state
      localStorage.removeItem(STORAGE_KEY);

      onComplete(result);
    } catch (e) {
      console.error('Signing failed', e);
      alert('Error saving result. Please call invigilator.');
    }
  };

  const toggleFlag = () => {
    const id = currentQuestion.id;
    setFlaggedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" ref={containerRef}>
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{exam.title}</h1>
          <p className="text-sm text-gray-500">Student: {studentName} ({studentId})</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
            <Clock size={20} />
            {formatDuration(timeLeft)}
          </div>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <Card className="flex-1 p-8 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </span>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleFlag}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  flaggedQuestions.includes(currentQuestion.id) 
                    ? 'text-amber-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Flag size={16} fill={flaggedQuestions.includes(currentQuestion.id) ? "currentColor" : "none"} />
                {flaggedQuestions.includes(currentQuestion.id) ? 'Flagged' : 'Flag for Review'}
              </button>
              <span className="text-sm text-gray-500">{currentQuestion.points} pts</span>
            </div>
          </div>
          
          <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3 mt-4">
            {currentQuestion.type === 'short_answer' ? (
              <div className="mt-4">
                <input
                  type="text"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                  placeholder="Type your answer here..."
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              // MCQ and True/False
              currentQuestion.options?.map((option, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === idx 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    checked={answers[currentQuestion.id] === idx}
                    onChange={() => handleAnswer(idx)}
                  />
                  <span className="ml-3 text-gray-700 font-medium text-lg">{option}</span>
                </label>
              ))
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < exam.questions.length - 1 ? (
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
          ) : (
             <div /> 
          )}
        </div>

        {/* Question Grid */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Question Navigator</h3>
          <div className="flex flex-wrap gap-2">
            {exam.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isFlagged = flaggedQuestions.includes(q.id);
              const isCurrent = currentQuestionIndex === idx;
              
              let bgClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';
              if (isCurrent) bgClass = 'ring-2 ring-blue-500 ring-offset-1 bg-white text-blue-600 font-bold';
              else if (isFlagged) bgClass = 'bg-amber-100 text-amber-700 border border-amber-200';
              else if (isAnswered) bgClass = 'bg-blue-50 text-blue-700 border border-blue-100';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-all relative ${bgClass}`}
                >
                  {idx + 1}
                  {isFlagged && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full -mt-0.5 -mr-0.5" />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-50 border border-blue-100 rounded"></div> Answered</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div> Flagged</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 rounded"></div> Unanswered</div>
          </div>
        </div>
      </main>

      {/* Integrity Warning Overlay */}
      {integrityLogs.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-amber-50 border border-amber-200 p-3 rounded-md shadow-lg flex items-center gap-2 text-amber-800 text-sm animate-bounce">
          <ShieldAlert size={16} />
          <span>Warning: Unusual activity detected ({integrityLogs.length})</span>
        </div>
      )}
    </div>
  );
};
