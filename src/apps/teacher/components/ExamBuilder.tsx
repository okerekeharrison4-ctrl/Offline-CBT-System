import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Plus, Trash2, Save, Lock, Eye, ArrowLeft } from 'lucide-react';
import { Exam, Question, EncryptedExamPackage } from '../../../lib/types';
import { generateId } from '../../../lib/utils';
import { encryptData } from '../../../lib/crypto';
import { ExamRunner } from '../../student/components/ExamRunner';

export const ExamBuilder = ({ onCancel }: { onCancel: () => void }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passcode, setPasscode] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // ... (keep existing addQuestion, updateQuestion, removeQuestion)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const getExamObject = (): Exam => ({
    id: generateId(),
    title: title || 'Untitled Exam',
    durationMinutes: duration,
    questions,
    settings: {
      randomizeQuestions: true,
      shuffleAnswers: true,
      showResultOnCompletion: true,
      allowReview: true,
    },
    createdAt: Date.now(),
    version: 1,
  });

  const handleExport = async () => {
    if (!title || !passcode || questions.length === 0) {
      alert('Please fill in all fields and add at least one question.');
      return;
    }

    setIsEncrypting(true);
    try {
      const exam = getExamObject();
      const { ciphertext, iv, salt } = await encryptData(exam, passcode);

      const packageData: EncryptedExamPackage = {
        salt,
        iv,
        ciphertext,
        metadata: {
          title: exam.title,
          durationMinutes: exam.durationMinutes,
          questionCount: exam.questions.length,
          examId: exam.id,
        },
      };

      const blob = new Blob([JSON.stringify(packageData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_SECURE.cbt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Exam exported successfully!\n\nIMPORTANT: Copy this .cbt file AND the 'Student App' (student.html) to your flash drives.\n\nStudents need BOTH files to take the exam.`);
      onCancel();
    } catch (error) {
      console.error(error);
      alert('Failed to encrypt exam.');
    } finally {
      setIsEncrypting(false);
    }
  };

  if (isPreviewing) {
    const previewExam = getExamObject();
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Eye size={20} />
            <span className="font-bold">Preview Mode</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setIsPreviewing(false)}>
            <ArrowLeft size={16} className="mr-2" /> Exit Preview
          </Button>
        </div>
        <ExamRunner 
          exam={previewExam} 
          studentName="Preview Student" 
          studentId="PREVIEW-001" 
          passcode={passcode || "preview"} 
          onComplete={(result) => {
            alert(`Exam Completed! Score: ${result.score}/${result.maxScore} (${result.percentage}%)`);
            setIsPreviewing(false);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exam Builder</h2>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" onClick={() => setIsPreviewing(true)} disabled={questions.length === 0}>
            <Eye size={16} className="mr-2" /> Preview
          </Button>
          <Button onClick={handleExport} disabled={isEncrypting}>
            {isEncrypting ? 'Encrypting...' : 'Encrypt & Export'}
            <Lock size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Exam Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Exam Title"
            placeholder="e.g. Mathematics Term 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Duration (Minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Input
            label="Encryption Passcode (Required)"
            type="password"
            placeholder="Set a strong passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="border-blue-300 bg-blue-50"
          />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <Button onClick={addQuestion} variant="secondary" size="sm">
            <Plus size={16} className="mr-2" /> Add Question
          </Button>
        </div>

        {questions.map((q, qIndex) => (
          <Card key={q.id} className="p-6 relative group">
            <button
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={20} />
            </button>

            <div className="space-y-4 pr-8">
              <div className="flex gap-4">
                <span className="font-mono text-gray-400 pt-2">Q{qIndex + 1}</span>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4 items-center">
                    <textarea
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter question text..."
                      rows={2}
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    />
                    <select
                      className="p-2 border rounded-md text-sm bg-white h-10"
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        let updates: Partial<Question> = { type };
                        
                        if (type === 'true_false') {
                          updates.options = ['True', 'False'];
                          updates.correctAnswer = 0; // Default to True
                        } else if (type === 'short_answer') {
                          updates.options = undefined;
                          updates.correctAnswer = '';
                        } else {
                          updates.options = ['', '', '', ''];
                          updates.correctAnswer = 0;
                        }
                        updateQuestion(qIndex, updates);
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>
                  
                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() => updateQuestion(qIndex, { correctAnswer: optIndex })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <input
                            type="text"
                            className="flex-1 p-2 border rounded-md text-sm"
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(q.options || [])];
                              newOptions[optIndex] = e.target.value;
                              updateQuestion(qIndex, { options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex gap-6">
                      {['True', 'False'].map((opt, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-gray-50">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() => updateQuestion(qIndex, { correctAnswer: optIndex })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Enter the correct answer text (case insensitive matching)"
                        value={q.correctAnswer as string}
                        onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
