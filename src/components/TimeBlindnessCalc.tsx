import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Sparkles, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { TimePlan } from '../types';
import { playChime } from '../utils/sound';

interface TimeBlindnessCalcProps {
  timePlans: TimePlan[];
  onAddTimePlan: (plan: TimePlan) => void;
  onDeleteTimePlan: (id: string) => void;
  initialAppointmentTitle?: string;
  initialAppointmentTime?: string;
  onBack?: () => void;
}

export const TimeBlindnessCalc: React.FC<TimeBlindnessCalcProps> = ({
  timePlans,
  onAddTimePlan,
  onDeleteTimePlan,
  initialAppointmentTitle = '',
  initialAppointmentTime = '',
  onBack,
}) => {
  const [appointmentTitle, setAppointmentTitle] = useState(initialAppointmentTitle);
  const [appointmentTime, setAppointmentTime] = useState(initialAppointmentTime || '17:00');
  const [estimatedTripMinutes, setEstimatedTripMinutes] = useState(30);
  const [prepType, setPrepType] = useState('عادي (لبس، تجهيز الأغراض، المفاتيح)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAppointmentTitle) {
      setAppointmentTitle(initialAppointmentTitle);
    }
    if (initialAppointmentTime) {
      const timeMatch = initialAppointmentTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        setAppointmentTime(`${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`);
      }
    }
  }, [initialAppointmentTitle, initialAppointmentTime]);

  const handleCalculate = async () => {
    if (!appointmentTitle.trim() || !appointmentTime) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/time-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentTitle: appointmentTitle.trim(),
          appointmentTime,
          estimatedTripMinutes: Number(estimatedTripMinutes),
          prepType,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل حساب أوقات المشوار.');
      }

      const data = await response.json();

      const newPlan: TimePlan = {
        id: Math.random().toString(36).substring(2, 9),
        appointmentTitle: appointmentTitle.trim(),
        targetArrivalTime: appointmentTime,
        recommendedArrivalBuffer: data.recommendedArrivalBuffer,
        leaveHomeTime: data.leaveHomeTime,
        startPrepTime: data.startPrepTime,
        prepMinutes: data.prepMinutes || 20,
        transitMinutes: data.transitMinutes || Number(estimatedTripMinutes),
        unexpectedDelayBufferMinutes: data.unexpectedDelayBufferMinutes || 15,
        antiDelayTips: data.antiDelayTips || ['ضع المفاتيح والمحفظة عند الباب الآن'],
        closingLaptopRule:
          data.closingLaptopRule || 'احفظ الكود واغلق اللابتوب فوراً؛ لا تبدأ في كتابة سطر كود جديد أبداً قبل المشوار!',
        createdAt: Date.now(),
      };

      onAddTimePlan(newPlan);
      playChime('success');
      setAppointmentTitle('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanCountdown = (plan: TimePlan) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const prepParts = plan.startPrepTime.match(/(\d{1,2}):(\d{2})/);
    if (!prepParts) {
      return (
        <span className="text-xs bg-stone-100 dark:bg-[#1a1a1a] px-2.5 py-1 rounded-md text-stone-500">
          ابدأ الاستعداد: {plan.startPrepTime}
        </span>
      );
    }

    let prepHours = parseInt(prepParts[1], 10);
    const prepMins = parseInt(prepParts[2], 10);
    if (plan.startPrepTime.toLowerCase().includes('pm') && prepHours < 12) {
      prepHours += 12;
    }

    const prepTotalMinutes = prepHours * 60 + prepMins;
    const diffMinutes = prepTotalMinutes - currentTotalMinutes;

    if (diffMinutes < -60) {
      return (
        <span className="text-xs bg-stone-100 dark:bg-[#1a1a1a] text-stone-400 px-2 py-0.5 rounded-md font-mono">
          موعد مضى
        </span>
      );
    }

    if (diffMinutes <= 0) {
      return (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>حان وقت الخروج الآن! اترك اللابتوب فوراً</span>
        </div>
      );
    }

    if (diffMinutes <= 15) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>متبقي {diffMinutes} دقيقة على بدء الاستعداد!</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#262626] text-stone-700 dark:text-stone-300 px-3 py-1 rounded-lg text-xs font-mono">
        <Clock className="w-3.5 h-3.5 text-stone-400" />
        <span>متبقي {diffMinutes} دقيقة قبل بدء الاستعداد</span>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top back link if opened from tools */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
          <span>العودة لجميع الأدوات</span>
        </button>
      )}

      {/* Intro */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>حاسبة عمى الوقت وجدول المشاوير</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          عقل الـ ADHD يحسب وقت الطريق فقط وينسى وقت اللبس وجمع المفاتيح وإغلاق اللابتوب. هذه الحاسبة تضيف هوامش الأمان الذكية لمنع التأخير.
        </p>
      </div>

      {/* Form Input */}
      <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              المشوار أو الموعد
            </label>
            <input
              type="text"
              value={appointmentTitle}
              onChange={(e) => setAppointmentTitle(e.target.value)}
              placeholder="مثلاً: دكتور الأسنان / مقابلة عمل / لقاء أصدقاء"
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/50 dark:bg-[#0c0c0c] p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-stone-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              موعد الوصول المطلوب
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/50 dark:bg-[#0c0c0c] p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-stone-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex justify-between">
              <span>وقت الطريق التقريبي</span>
              <span className="font-mono text-stone-900 dark:text-stone-100">{estimatedTripMinutes} دقيقة</span>
            </label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={estimatedTripMinutes}
              onChange={(e) => setEstimatedTripMinutes(Number(e.target.value))}
              className="w-full accent-stone-900 dark:accent-white cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>10د</span>
              <span>60د</span>
              <span>120د</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              طبيعة التجهيز واللبس
            </label>
            <select
              value={prepType}
              onChange={(e) => setPrepType(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/50 dark:bg-[#0c0c0c] p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-stone-500"
            >
              <option value="عادي (لبس، تجهيز الأغراض، المفاتيح)">عادي (لبس وتجميع الأغراض والمفاتيح)</option>
              <option value="رسمي أو مقابلة (شياكة، تجميع أوراق، حلاقة/كي)">رسمي أو مقابلة (يحتاج وقت مضاعف)</option>
              <option value="سريع جداً (كاجوال جاهز في 5 دقائق)">سريع جداً (كاجوال في 5 دقائق)</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleCalculate}
          disabled={!appointmentTitle.trim() || isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoading ? 'جارِ الحساب...' : 'حساب موعد الخروج وهامش الأمان الواقعي'}</span>
        </button>
      </div>

      {/* Saved Time Plans */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
          مواعيدك المحمية بهوامش الأمان ({timePlans.length})
        </h3>

        {timePlans.length === 0 ? (
          <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center text-xs text-stone-400">
            لا توجد مشاوير مسجلة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timePlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {plan.appointmentTitle}
                    </h4>
                    <p className="text-xs text-stone-500 font-mono">
                      موعد الوصول: <span className="font-bold text-stone-800 dark:text-stone-200">{plan.targetArrivalTime}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteTimePlan(plan.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>{renderPlanCountdown(plan)}</div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50/60 dark:bg-[#0c0c0c] p-3 rounded-xl border border-stone-200/60 dark:border-[#222222]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-500 font-bold block">
                      ⏰ ابدأ التجهيز واللبس:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {plan.startPrepTime}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">({plan.prepMinutes} د لبس)</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-500 font-bold block">
                      🚪 افتح الباب واخرج:
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {plan.leaveHomeTime}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      ({plan.transitMinutes} د + {plan.unexpectedDelayBufferMinutes} د أمان)
                    </span>
                  </div>
                </div>

                {plan.closingLaptopRule && (
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#181818] text-[11px] text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-[#262626]">
                    <strong>💻 قاعدة المبرمج:</strong> {plan.closingLaptopRule}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
