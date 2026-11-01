/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { FocusTask, ParkedIdea, Errand, DeclutterItem, TimePlan, ChatMessage, JournalEntry, AppTheme } from './types';
import {
  TimerSession,
  createInitialSession,
  startSession,
  pauseSession,
  resetSession,
  getRemainingSeconds,
} from './utils/timerLogic';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { HomeScreen } from './components/HomeScreen';
import { BrainDump } from './components/BrainDump';
import { ImmersiveFocusMode } from './components/ImmersiveFocusMode';
import { MinimizedFocusBar } from './components/MinimizedFocusBar';
import { ToolsHub, ToolId } from './components/ToolsHub';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsModal } from './components/SettingsModal';
import { TimeBlindnessCalc } from './components/TimeBlindnessCalc';
import { ScreenshotDeclutter } from './components/ScreenshotDeclutter';
import { GeminiCoachChat } from './components/GeminiCoachChat';
import { GeminiLiveVoice } from './components/GeminiLiveVoice';
import { ArcadeHub } from './components/game/ArcadeHub';
import { ExtensionsHub } from './components/extensions/ExtensionsHub';
import { ParkedIdeasVault } from './components/ParkedIdeasVault';
import { DeveloperPortModal } from './components/DeveloperPortModal';
import { FloatingTimerWidget } from './components/FloatingTimerWidget';
import { Language, translations } from './utils/i18n';
import { playChime } from './utils/sound';

export default function App() {
  const STORAGE_KEY = 'rakeez_production_state_v2';

  // Navigation state
  const [activeSection, setActiveSection] = useState<'home' | 'braindump' | 'focus' | 'tools' | 'history'>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);

  // Focus Session & Tasks state
  const [activeTask, setActiveTask] = useState<FocusTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<FocusTask[]>([]);
  const [focusSession, setFocusSession] = useState<TimerSession>(() => createInitialSession(20));
  const [isFocusImmersiveOpen, setIsFocusImmersiveOpen] = useState(false);
  const [completedStepsCount, setCompletedStepsCount] = useState(0);

  // Tools Data
  const [parkedIdeas, setParkedIdeas] = useState<ParkedIdea[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [declutterItems, setDeclutterItems] = useState<DeclutterItem[]>([]);
  const [timePlans, setTimePlans] = useState<TimePlan[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Time planner prefill
  const [prefilledTripTitle, setPrefilledTripTitle] = useState('');
  const [prefilledTripTime, setPrefilledTripTime] = useState('');

  // Floating Minimized Timer Widget state (PIP)
  const [minimizedTimer, setMinimizedTimer] = useState<{
    type: 'pomodoro' | 'seconds' | 'visual' | 'clock';
    timeDisplay: string;
    isRunning: boolean;
    remainingSeconds?: number;
  } | null>(null);

  // Swipe navigation between tabs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Detect intentional horizontal swipe (> 60px, horizontally dominant)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      const sections: ('home' | 'braindump' | 'focus' | 'tools' | 'history')[] = [
        'home',
        'braindump',
        'focus',
        'tools',
        'history',
      ];
      const currentIndex = sections.indexOf(activeSection);
      if (currentIndex === -1) return;

      // In Arabic (RTL): swipe left advances in reading direction (1), swipe right goes back (-1)
      const direction = deltaX < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < sections.length) {
        setActiveSection(sections[nextIndex]);
        setActiveToolId(null);
        playChime('step');
      }
    }
  };

  // Minimized timer background tick
  useEffect(() => {
    if (!minimizedTimer || !minimizedTimer.isRunning) return;
    const interval = setInterval(() => {
      setMinimizedTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        if (prev.type === 'clock') {
          const now = new Date();
          return {
            ...prev,
            timeDisplay: now.toLocaleTimeString('en-US', { hour12: false }),
          };
        }
        if (prev.remainingSeconds !== undefined) {
          const nextSec = Math.max(0, prev.remainingSeconds - 1);
          const m = Math.floor(nextSec / 60);
          const s = nextSec % 60;
          return {
            ...prev,
            remainingSeconds: nextSec,
            timeDisplay: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
          };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [minimizedTimer]);

  // 3D Game & Arcade state
  const [isGameActive, setIsGameActive] = useState(false);

  // Daily Reflection & Journal state
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevGuideOpen, setIsDevGuideOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('dark');
  const [appTheme, setAppTheme] = useState<AppTheme>('amoled');
  const [lang, setLang] = useState<Language>('ar');
  const [defaultDuration, setDefaultDuration] = useState(20);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.activeTask) setActiveTask(p.activeTask);
        if (p.completedTasks) setCompletedTasks(p.completedTasks);
        if (p.focusSession) setFocusSession(p.focusSession);
        if (p.completedStepsCount !== undefined) setCompletedStepsCount(p.completedStepsCount);
        if (p.parkedIdeas) setParkedIdeas(p.parkedIdeas);
        if (p.errands) setErrands(p.errands);
        if (p.declutterItems) setDeclutterItems(p.declutterItems);
        if (p.timePlans) setTimePlans(p.timePlans);
        if (p.chatMessages) setChatMessages(p.chatMessages);
        if (p.journal) setJournal(p.journal);
        if (p.themeMode) setThemeMode(p.themeMode);
        if (p.appTheme) setAppTheme(p.appTheme);
        if (p.lang) setLang(p.lang);
        if (p.defaultDuration) setDefaultDuration(p.defaultDuration);
        if (p.soundEnabled !== undefined) setSoundEnabled(p.soundEnabled);
      }
    } catch (e) {
      console.warn('Failed to load local state:', e);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      const stateToSave = {
        activeTask,
        completedTasks,
        focusSession,
        completedStepsCount,
        parkedIdeas,
        errands,
        declutterItems,
        timePlans,
        chatMessages,
        journal,
        themeMode,
        appTheme,
        lang,
        defaultDuration,
        soundEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [
    activeTask,
    completedTasks,
    focusSession,
    completedStepsCount,
    parkedIdeas,
    errands,
    declutterItems,
    timePlans,
    chatMessages,
    journal,
    themeMode,
    appTheme,
    lang,
    defaultDuration,
    soundEnabled,
  ]);

  // Sync theme (AMOLED, Neon, Synth, Forest, Solar, Nordic)
  const ALL_THEMES: AppTheme[] = ['amoled', 'neon', 'synth', 'forest', 'solar', 'nordic'];

  const handleCycleTheme = () => {
    setAppTheme((cur) => {
      const idx = ALL_THEMES.indexOf(cur);
      const nextTheme = ALL_THEMES[(idx + 1) % ALL_THEMES.length];
      return nextTheme;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', appTheme);
    if (['solar', 'nordic'].includes(appTheme)) {
      root.classList.remove('dark');
      setThemeMode('light');
    } else {
      root.classList.add('dark');
      setThemeMode('dark');
    }
  }, [appTheme]);

  // Save Daily Reflection (Supports multiple wins per day)
  const handleSaveReflection = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...entry,
      timestamp: Date.now(),
    };
    setJournal((prev) => [newEntry, ...prev]);
  };

  const handleDeleteReflection = (id: string) => {
    setJournal((prev) => prev.filter((j) => j.id !== id));
  };

  // Sync language and document direction (RTL / LTR)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Start a new focus task
  const handleStartFocusTask = (task: FocusTask) => {
    setActiveTask(task);
    const newSession = startSession(createInitialSession(task.estimatedMinutes || defaultDuration));
    setFocusSession(newSession);
    setIsFocusImmersiveOpen(true);
  };

  const handleStartExistingTask = () => {
    if (!activeTask) return;
    if (!focusSession.isRunning) {
      setFocusSession(startSession(focusSession));
    }
    setIsFocusImmersiveOpen(true);
  };

  const handleCompleteTask = (taskId: string) => {
    if (!activeTask || activeTask.id !== taskId) return;
    const completed = { ...activeTask, completed: true };
    setCompletedTasks((prev) => [completed, ...prev]);
    setActiveTask(null);
    setCompletedStepsCount((prev) => prev + 1);
  };

  const handleQuickCapture = (text: string) => {
    const newIdea: ParkedIdea = {
      id: Math.random().toString(36).substring(2, 9),
      title: text,
      createdAt: Date.now(),
    };
    setParkedIdeas((prev) => [newIdea, ...prev]);
  };

  const handlePromoteIdeaToTask = (idea: ParkedIdea) => {
    const newTask: FocusTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: idea.title,
      category: 'برمجة',
      estimatedMinutes: defaultDuration,
      currentStepIndex: 0,
      completed: false,
      createdAt: Date.now(),
      microSteps: [
        { id: `step-1-${Date.now()}`, text: 'تحديد الهدف الأساسي في جملة واحدة', completed: false },
        { id: `step-2-${Date.now()}`, text: 'البدء بأول خطوة صغيرة دون تشتت', completed: false },
      ],
    };
    setParkedIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    handleStartFocusTask(newTask);
    playChime('success');
  };

  const handleSendErrandToTimePlanner = (title: string, time?: string) => {
    setPrefilledTripTitle(title);
    if (time) setPrefilledTripTime(time);
    setActiveSection('tools');
    setActiveToolId('time');
  };

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
              }
            : null,
          modelName,
        }),
      });

      if (!response.ok) throw new Error('فشل الرد.');

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

  const handleClearAllData = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات؟')) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveTask(null);
      setCompletedTasks([]);
      setParkedIdeas([]);
      setErrands([]);
      setDeclutterItems([]);
      setTimePlans([]);
      setChatMessages([]);
      setCompletedStepsCount(0);
      setFocusSession(createInitialSession(20));
      setIsSettingsOpen(false);
      setActiveSection('home');
    }
  };

  // 1. IF ARCADE / GAMES ACTIVE: Fullscreen Arcade Shell
  if (isGameActive) {
    return (
      <ArcadeHub
        onExitHub={() => setIsGameActive(false)}
        onDopamineEarned={(amount) => setCompletedStepsCount((prev) => prev + amount)}
      />
    );
  }

  // 2. IF IMMERSIVE FOCUS MODE OPEN: Fullscreen True AMOLED Focus Screen!
  if (isFocusImmersiveOpen && activeTask) {
    return (
      <ImmersiveFocusMode
        task={activeTask}
        session={focusSession}
        onUpdateSession={setFocusSession}
        onUpdateTask={setActiveTask}
        onCompleteTask={handleCompleteTask}
        onMinimize={() => setIsFocusImmersiveOpen(false)}
        onExit={() => setIsFocusImmersiveOpen(false)}
        onAddParkedIdea={(idea) => setParkedIdeas((prev) => [idea, ...prev])}
        onIncrementDopamine={() => setCompletedStepsCount((prev) => prev + 1)}
        lang={lang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] text-stone-900 dark:text-[#f5f5f5] flex flex-col font-sans transition-colors pb-16 md:pb-6">
      {/* Top Header */}
      <Header
        activeSection={activeSection}
        onSelectSection={(s) => {
          setActiveSection(s);
          setActiveToolId(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        completedStepsCount={completedStepsCount}
        hasActiveTask={!!activeTask && !activeTask.completed}
        lang={lang}
        appTheme={appTheme}
        onCycleTheme={handleCycleTheme}
      />

      {/* Main Container with Horizontal Swipe Gestures */}
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 touch-pan-y"
      >
        {/* SECTION 1: HOME */}
        {activeSection === 'home' && (
          <HomeScreen
            activeTask={activeTask}
            onStartFocus={handleStartExistingTask}
            onNavigateToBrainDump={() => setActiveSection('braindump')}
            onQuickCapture={handleQuickCapture}
            completedStepsCount={completedStepsCount}
            parkedIdeasCount={parkedIdeas.length}
            lang={lang}
            journal={journal}
            onSaveReflection={handleSaveReflection}
            onDeleteReflection={handleDeleteReflection}
          />
        )}

        {/* SECTION 2: BRAIN DUMP */}
        {activeSection === 'braindump' && (
          <BrainDump
            onStartFocusTask={handleStartFocusTask}
            onAddParkedIdeas={(ideas) => setParkedIdeas((prev) => [...ideas, ...prev])}
            onAddErrands={(e) => setErrands((prev) => [...e, ...prev])}
            onSendErrandToTimePlanner={handleSendErrandToTimePlanner}
            lang={lang}
          />
        )}

        {/* SECTION 3: FOCUS TAB (If opened directly from nav) */}
        {activeSection === 'focus' && (
          <div className="max-w-2xl mx-auto py-8">
            {activeTask && !activeTask.completed ? (
              <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center space-y-5 shadow-xs">
                <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">
                  وضع التركيز الأحادي
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {activeTask.title}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  الخطوة القادمة: "{activeTask.microSteps[activeTask.currentStepIndex]?.text || 'البدء'}"
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleStartExistingTask}
                    className="py-3 px-6 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-bold text-sm shadow-sm cursor-pointer"
                  >
                    دخول وضع التركيز الغامر (AMOLED Fullscreen)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-10 text-center space-y-4">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  لا توجد مهمة قيد التركيز حالياً.
                </p>
                <button
                  onClick={() => setActiveSection('braindump')}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-xs"
                >
                  تفريغ الأفكار لاختيار مهمة
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: TOOLS HUB & INDIVIDUAL TOOLS */}
        {activeSection === 'tools' && (
          <div>
            {activeToolId === null ? (
              <ToolsHub
                onSelectTool={(id) => {
                  if (id === 'game') {
                    setIsGameActive(true);
                  } else {
                    setActiveToolId(id);
                  }
                }}
                parkedIdeasCount={parkedIdeas.length}
                timePlansCount={timePlans.length}
                declutterItemsCount={declutterItems.length}
                lang={lang}
              />
            ) : activeToolId === 'time' ? (
              <TimeBlindnessCalc
                timePlans={timePlans}
                onAddTimePlan={(p) => setTimePlans((prev) => [p, ...prev])}
                onDeleteTimePlan={(id) => setTimePlans((prev) => prev.filter((p) => p.id !== id))}
                initialAppointmentTitle={prefilledTripTitle}
                initialAppointmentTime={prefilledTripTime}
                onBack={() => setActiveToolId(null)}
              />
            ) : activeToolId === 'declutter' ? (
              <ScreenshotDeclutter
                items={declutterItems}
                onAddItem={(item) => setDeclutterItems((prev) => [item, ...prev])}
                onDeleteItem={(id) => setDeclutterItems((prev) => prev.filter((i) => i.id !== id))}
                onStartFocusTask={handleStartFocusTask}
                onBack={() => setActiveToolId(null)}
              />
            ) : activeToolId === 'chat' ? (
              <GeminiCoachChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onClearChat={() => setChatMessages([])}
                activeTask={activeTask}
                isLoading={chatLoading}
                onBack={() => setActiveToolId(null)}
              />
            ) : activeToolId === 'live' ? (
              <GeminiLiveVoice
                onClose={() => setActiveToolId(null)}
                activeTaskTitle={activeTask?.title}
              />
            ) : activeToolId === 'ideas' ? (
              <ParkedIdeasVault
                ideas={parkedIdeas}
                onDeleteIdea={(id) => setParkedIdeas((prev) => prev.filter((i) => i.id !== id))}
                onPromoteToTask={handlePromoteIdeaToTask}
                onBack={() => setActiveToolId(null)}
              />
            ) : activeToolId === 'extensions' ? (
              <ExtensionsHub
                onClose={() => setActiveToolId(null)}
                onDopamineEarned={(amount) => setCompletedStepsCount((prev) => prev + amount)}
                onMinimizeExtension={(type) => {
                  setMinimizedTimer({
                    type,
                    timeDisplay: type === 'pomodoro' ? '25:00' : type === 'clock' ? new Date().toLocaleTimeString('en-US', { hour12: false }) : '00:00',
                    isRunning: true,
                    remainingSeconds: type === 'pomodoro' ? 25 * 60 : undefined,
                  });
                }}
              />
            ) : null}
          </div>
        )}

        {/* SECTION 5: HISTORY / PROGRESS */}
        {activeSection === 'history' && (
          <HistoryScreen
            completedTasks={completedTasks}
            parkedIdeas={parkedIdeas}
            declutterItems={declutterItems}
            completedStepsCount={completedStepsCount}
            onClearCompletedTasks={() => setCompletedTasks([])}
            lang={lang}
          />
        )}
      </main>

      {/* Floating Picture-in-Picture Timer Widget */}
      {minimizedTimer && (
        <FloatingTimerWidget
          type={minimizedTimer.type}
          timeDisplay={minimizedTimer.timeDisplay}
          isRunning={minimizedTimer.isRunning}
          onTogglePlay={() => {
            setMinimizedTimer((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : null));
          }}
          onStop={() => {
            setMinimizedTimer(null);
          }}
          onMaximize={() => {
            setActiveSection('tools');
            setActiveToolId('extensions');
            setMinimizedTimer(null);
          }}
        />
      )}

      {/* Minimized Focus Session Bar (When session running in background) */}
      {!isFocusImmersiveOpen && activeTask && !activeTask.completed && focusSession.isRunning && (
        <MinimizedFocusBar
          task={activeTask}
          session={focusSession}
          onUpdateSession={setFocusSession}
          onRestore={() => setIsFocusImmersiveOpen(true)}
          onExit={() => {
            setFocusSession(pauseSession(focusSession));
          }}
        />
      )}

      {/* Bottom Mobile Navigation */}
      <MobileNav
        activeSection={activeSection}
        onSelectSection={(s) => {
          setActiveSection(s);
          setActiveToolId(null);
        }}
        hasActiveTask={!!activeTask && !activeTask.completed}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onSelectLang={setLang}
        themeMode={themeMode}
        onSelectThemeMode={setThemeMode}
        appTheme={appTheme}
        onSelectAppTheme={setAppTheme}
        defaultDuration={defaultDuration}
        onSelectDefaultDuration={setDefaultDuration}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenDevGuide={() => setIsDevGuideOpen(true)}
        onClearAllData={handleClearAllData}
      />

      {/* Developer Port Guide Modal */}
      <DeveloperPortModal
        isOpen={isDevGuideOpen}
        onClose={() => setIsDevGuideOpen(false)}
      />
    </div>
  );
}
