// -----------------------------------------------------------------------------
// Shared Data Models
// -----------------------------------------------------------------------------

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer: string | number; // Index for MCQ, boolean string for TF, text for Short
  points: number;
}

export interface ExamSettings {
  randomizeQuestions: boolean;
  shuffleAnswers: boolean;
  showResultOnCompletion: boolean;
  allowReview: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questions: Question[];
  settings: ExamSettings;
  createdAt: number;
  version: number;
}

// The structure stored in the .cbt file
export interface EncryptedExamPackage {
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  metadata: {
    title: string;
    durationMinutes: number;
    questionCount: number;
    examId: string;
  };
}

export interface IntegrityLog {
  timestamp: number;
  event: 'focus_lost' | 'fullscreen_exit' | 'clipboard_attempt' | 'devtools_attempt' | 'time_anomaly';
  details?: string;
}

export interface StudentResult {
  studentName: string;
  studentId: string;
  examId: string;
  examTitle: string;
  answers: Record<string, string | number>; // questionId -> answer
  score: number;
  maxScore: number;
  percentage: number;
  integrityLogs: IntegrityLog[];
  startTime: number;
  endTime: number;
  timeTakenSeconds: number;
}

// The structure stored in the result .json file
export interface SignedResultPackage {
  payload: StudentResult;
  signature: string; // HMAC-SHA256 signature of the payload JSON string
  salt: string; // Salt used for key derivation (same as exam salt usually, or new)
}
