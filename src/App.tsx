/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Target,
  Clock,
  FileImage,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FocusTask, ParkedIdea, Errand, DeclutterItem, TimePlan, ChatMessage } from './types';
import { Header } from './components/Header';
import { BrainDump } from './components/BrainDump';
import { FocusMonotasker } from './components/FocusMonotasker';
import { TimeBlindnessCalc } from './components/TimeBlindnessCalc';
import { ScreenshotDeclutter } from './components/ScreenshotDeclutter';
import { GeminiCoachChat } from './components/GeminiCoachChat';
import { ParkedIdeasVault } from './components/ParkedIdeasVault';
import { DeveloperPortModal } from './components/DeveloperPortModal';
import { playChime } from './utils/sound';

export default function App() {
  // Local storage keys
  const STORAGE_KEY = 'rakeez_adhd_data_v1';

  // State
  const [activeTab, setActiveTab] = useState<'braindump' | 'focus' | 'time' | 'declutter' | 'chat' | 'ideas'>('braindump');
  const [activeTask, setActiveTask] = useState<FocusTask | null>(null);
  const [parkedIdeas, setParkedIdeas] = useState<ParkedIdea[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [declutterItems, setDeclutterItems] = useState<DeclutterItem[]>([]);
  const [timePlans, setTimePlans] = useState<TimePlan[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [completedStepsToday, setCompletedStepsToday] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [isDevGuideOpen, setIsDevGuideOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Time planner pre-fill
  const [prefilledTripTitle, setPrefilledTripTitle] = useState('');
  const [prefilledTripTime, setPrefilledTripTime] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeTask) setActiveTask(parsed.activeTask);
        if (parsed.parkedIdeas) setParkedIdeas(parsed.parkedIdeas);
        if (parsed.errands) setErrands(parsed.errands);
        if (parsed.declutterItems) setDeclutterItems(parsed.declutterItems);
        if (parsed.timePlans) setTimePlans(parsed.timePlans);
        if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
        if (parsed.completedStepsToday) setCompletedStepsToday(parsed.completedStepsToday);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
      }
    } catch (e) {
      console.warn('Failed to load saved state from localStorage:', e);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    try {
      const stateToSave = {
        activeTask,
        parkedIdeas,
        errands,
        declutterItems,
        timePlans,
        chatMessages,
        completedStepsToday,
        darkMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [activeTask, parkedIdeas, errands, declutterItems, timePlans, chatMessages, completedStepsToday, darkMode]);

  // Sync dark mode class on HTML document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handlers
  const handleStartFocusTask = (task: FocusTask) => {
    setActiveTask(task);
    setActiveTab('focus');
  };

  const handleUpdateTask = (updatedTask: FocusTask) => {
    setActiveTask(updatedTask);
  };

  const handleCompleteTask = (taskId: string) => {
    // Keep in state but mark done
    setCompletedStepsToday((prev) => prev + 1);
  };

  const handleAddParkedIdeas = (newIdeas: ParkedIdea[]) => {
    setParkedIdeas((prev) => [...newIdeas, ...prev]);
  };

  const handleAddSingleParkedIdea = (idea: ParkedIdea) => {
    setParkedIdeas((prev) => [idea, ...prev]);
  };

  const handleDeleteParkedIdea = (id: string) => {
    setParkedIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePromoteIdeaToTask = (idea: ParkedIdea) => {
    const newTask: FocusTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: idea.title,
      category: 'برمجة',
      estimatedMinutes: 20,
      currentStepIndex: 0,
      completed: false,
      createdAt: Date.now(),
      microSteps: [
        { id: `step-1-${Date.now()}`, text: 'تحديد الهدف الأساسي لهذه الفكرة في جملة واحدة', completed: false },
        { id: `step-2-${Date.now()}`, text: 'إنشاء أول ملف أو كتابة الخطوط العريضة', completed: false },
        { id: `step-3-${Date.now()}`, text: 'التحقق من أول نتيجة سريعة (MVP)', completed: false },
      ],
    };
    handleDeleteParkedIdea(idea.id);
    handleStartFocusTask(newTask);
    playChime('success');
  };

  const handleAddErrands = (newErrands: Errand[]) => {
    setErrands((prev) => [...newErrands, ...prev]);
  };

  const handleSendErrandToTimePlanner = (title: string, time?: string) => {
    setPrefilledTripTitle(title);
    if (time) setPrefilledTripTime(time);
    setActiveTab('time');
  };

  const handleAddTimePlan = (plan: TimePlan) => {
    setTimePlans((prev) => [plan, ...prev]);
  };

  const handleDeleteTimePlan = (id: string) => {
    setTimePlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddDeclutterItem = (item: DeclutterItem) => {
    setDeclutterItems((prev) => [item, ...prev]);
  };

  const handleDeleteDeclutterItem = (id: string) => {
    setDeclutterItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Chat Handler
  const handleSendMessage = async (userMessage: string, modelName: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          taskContext: activeTask
            ? {
                title: activeTask.title,
                currentStep: activeTask.microSteps[activeTask.currentStepIndex]?.text,
                remainingSteps: activeTask.microSteps.filter((s) => !s.completed).length,
              }
            : null,
          modelName,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الرد من الخادم.');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.reply || 'أنا معك يا صديقي، خطوة بخطوة سننهي كل شيء.',
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      playChime('step');
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: 'عذراً، حدث خطأ مؤقت في الاتصال. لكن أنا ما زلت هنا معك، فلنركز على أصغر خطوة الآن!',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-200 dark:selection:bg-amber-900">
      {/* Top Header */}
      <Header
        completedMicroStepsCount={completedStepsToday}
        onOpenDevGuide={() => setIsDevGuideOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs - Distraction Free */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar py-1 gap-1.5 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab('braindump')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'braindump'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>تفريغ الأفكار</span>
          </button>

          <button
            onClick={() => setActiveTab('focus')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
              activeTab === 'focus'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>وضع التركيز</span>
            {activeTask && !activeTask.completed && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('time')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'time'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>حاسبة عمى الوقت</span>
            {timePlans.length > 0 && (
              <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 rounded-full font-mono">
                {timePlans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('declutter')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'declutter'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <FileImage className="w-4 h-4" />
            <span>تنظيف لقطات الشاشة</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>رفيق التركيز (سند)</span>
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ideas'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>درج الأفكار</span>
            {parkedIdeas.length > 0 && (
              <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 rounded-full font-mono">
                {parkedIdeas.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'braindump' && (
          <BrainDump
            onStartFocusTask={handleStartFocusTask}
            onAddParkedIdeas={handleAddParkedIdeas}
            onAddErrands={handleAddErrands}
            onSendErrandToTimePlanner={handleSendErrandToTimePlanner}
          />
        )}

        {activeTab === 'focus' && (
          <div>
            {activeTask ? (
              <FocusMonotasker
                task={activeTask}
                onUpdateTask={handleUpdateTask}
                onCompleteTask={handleCompleteTask}
                onExitFocusMode={() => setActiveTab('braindump')}
                onAddParkedIdea={handleAddSingleParkedIdea}
                onIncrementDopamineStreak={() => setCompletedStepsToday((prev) => prev + 1)}
              />
            ) : (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                <div className="w-14 h-14 bg-amber-50 dark:bg-stone-800 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  لا توجد مهمة نشطة في وضع التركيز حالياً
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  وضع التركيز مصمم لعرض <strong>مهمة واحدة فقط</strong> في كل مرة مع تايمر وبدون أي مشتتات. ابدأ بتفريغ أفكارك الآن وسيقوم الذكاء الاصطناعي بتوليد أول مهمة وخطواتها فوراً.
                </p>
                <button
                  onClick={() => setActiveTab('braindump')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
                >
                  <span>تفريغ الأفكار الآن</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'time' && (
          <TimeBlindnessCalc
            timePlans={timePlans}
            onAddTimePlan={handleAddTimePlan}
            onDeleteTimePlan={handleDeleteTimePlan}
            initialAppointmentTitle={prefilledTripTitle}
            initialAppointmentTime={prefilledTripTime}
          />
        )}

        {activeTab === 'declutter' && (
          <ScreenshotDeclutter
            items={declutterItems}
            onAddItem={handleAddDeclutterItem}
            onDeleteItem={handleDeleteDeclutterItem}
            onStartFocusTask={handleStartFocusTask}
          />
        )}

        {activeTab === 'chat' && (
          <GeminiCoachChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            activeTask={activeTask}
            isLoading={chatLoading}
          />
        )}

        {activeTab === 'ideas' && (
          <ParkedIdeasVault
            ideas={parkedIdeas}
            onDeleteIdea={handleDeleteParkedIdea}
            onPromoteToTask={handlePromoteIdeaToTask}
          />
        )}
      </main>

      {/* Developer React Native Modal */}
      <DeveloperPortModal isOpen={isDevGuideOpen} onClose={() => setIsDevGuideOpen(false)} />

      {/* Subtle calm footer */}
      <footer className="border-t border-stone-200/60 dark:border-stone-800/80 py-4 text-center text-xs text-stone-400">
        <p>ركّز (Rakeez) • صُمم خصيصاً لمساعدة عقول الـ ADHD والمطورين على الوصول إلى التدفق الذهني (Flow State)</p>
      </footer>
    </div>
  );
}
