export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  studentIdOrNis?: string;
  classGroup?: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOXES = 'CHECKBOXES',
  SHORT_ANSWER = 'SHORT_ANSWER',
  PARAGRAPH = 'PARAGRAPH',
  MATCHING = 'MATCHING'
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[]; // Only for multiple choice and checkboxes
  matchingPairs?: MatchingPair[]; // Only for matching questions
  correctAnswer?: string | string[] | Record<string, string>; // Correct answer(s) for auto-grading
  points: number; // Score for answering correctly
}

export interface EvaluationForm {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  isQuiz: boolean; // Enables scoring and feedback
}

export interface StudentAnswer {
  questionId: string;
  value: string | string[] | Record<string, string>; // Answer text, array of option IDs, or mapping of left-item ID to right-item ID
  manualPoints?: number; // Custom graded points by teacher
}

export interface StudentResponse {
  id: string;
  formId: string;
  studentName: string;
  studentId?: string; // Optional student register number
  answers: StudentAnswer[];
  submittedAt: string;
  score?: number; // Calculated automatic score
  totalPointsPossible?: number; // Total possible score
}

export interface AIPromptInput {
  topic: string;
  gradeLevel: string;
  questionCount: number;
  questionType: QuestionType;
}
