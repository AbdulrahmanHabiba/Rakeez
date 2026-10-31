export interface MicroStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface FocusTask {
  id: string;
  title: string;
  category: 'برمجة' | 'عمل' | 'شخصي' | 'دراسة' | 'أخرى';
  estimatedMinutes: number;
  microSteps: MicroStep[];
  currentStepIndex: number;
  completed: boolean;
  createdAt: number;
}

export interface ParkedIdea {
  id: string;
  title: string;
  note?: string;
  createdAt: number;
  promotedToTask?: boolean;
}

export interface Errand {
  id: string;
  title: string;
  timeOrDate?: string;
  completed: boolean;
}

export interface DeclutterItem {
  id: string;
  imagePreview: string;
  summary: string;
  category: string;
  canDeleteSafely: boolean;
  deleteAdvice: string;
  actionItem?: string;
  extractedTextOrCode?: string;
  tags?: string[];
  createdAt: number;
}

export interface TimePlan {
  id: string;
  appointmentTitle: string;
  targetArrivalTime: string; // "17:00"
  recommendedArrivalBuffer?: string;
  leaveHomeTime: string; // "16:15"
  startPrepTime: string; // "15:55"
  prepMinutes: number;
  transitMinutes: number;
  unexpectedDelayBufferMinutes: number;
  antiDelayTips: string[];
  closingLaptopRule?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
