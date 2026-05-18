import { API_BASE_URL } from '@/constants/Config';

export interface Question {
  id: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string | null;
  content: string;
  createdAt: number;
  answerCount: number;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string | null;
  content: string;
  createdAt: number;
}

export interface QuestionDetail {
  question: Question;
  answers: Answer[];
}

async function apiRequest<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const questionsApi = {
  list: (token: string) =>
    apiRequest<Question[]>('/api/questions', token),

  getDetail: (id: string, token: string) =>
    apiRequest<QuestionDetail>(`/api/questions/${id}`, token),

  create: (content: string, token: string) =>
    apiRequest<Question>('/api/questions', token, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  createAnswer: (questionId: string, content: string, token: string) =>
    apiRequest<Answer>(`/api/questions/${questionId}/answers`, token, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
