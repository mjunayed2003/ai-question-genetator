export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface Document {
  id: string;
  originalName: string;
  fileName?: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  extractedText?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
  questionSets?: Array<{
    id: string;
    topic: string;
    mcqCount: number;
    cqCount: number;
    createdAt: string;
  }>;
}

export interface MCQ {
  id: string;
  questionSetId: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CQ {
  id: string;
  questionSetId: string;
  stimulus: string;
  questionA: string;
  questionB: string;
  questionC: string;
  questionD: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface QuestionSet {
  id: string;
  documentId: string | null;
  document?: {
    id: string;
    originalName: string;
    mimeType: string;
  } | null;
  topic: string | null;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  mcqCount: number;
  cqCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  mcqs: MCQ[];
  cqs: CQ[];
  _count?: {
    mcqs: number;
    cqs: number;
  };
}

export interface GenerateQuestionsPayload {
  documentId?: string;
  topic?: string;
  mcqCount: number;
  cqCount: number;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
}

export interface UpdateQuestionSetPayload {
  topic?: string;
  difficulty?: string;
}

export interface UpdateMcqPayload {
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  difficulty?: string;
}

export interface UpdateCqPayload {
  stimulus?: string;
  questionA?: string;
  questionB?: string;
  questionC?: string;
  questionD?: string;
  difficulty?: string;
}

export interface ExportResponse {
  questionSet: QuestionSet;
  exportText: string;
}
