import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Sparkles, Navigation, AlertTriangle, CheckCircle, Trash2, Bell } from 'lucide-react';
import { TimePlan } from '../types';
import { playChime } from '../utils/sound';

interface TimeBlindnessCalcProps {
  timePlans: TimePlan[];
  onAddTimePlan: (plan: TimePlan) => void;
  onDeleteTimePlan: (id: string) => void;
  initialAppointmentTitle?: string;
  initialAppointmentTime?: string;
}

export const TimeBlindnessCalc: React.FC<TimeBlindnessCalcProps> = ({
  timePlans,
  onAddTimePlan,
  onDeleteTimePlan,
  initialAppointmentTitle = '',
  initialAppointmentTime = '',
}) => {
  const [appointmentTitle, setAppointmentTitle] = useState(initialAppointmentTitle);
  const [appointmentTime, setAppointmentTime] = useState(initialAppointmentTime || '17:00');
  const [estimatedTripMinutes, setEstimatedTripMinutes] = useState(30);
  const [prepType, setPrepType] = useState('عادي (لبس، تجهيز الأغراض، البحث عن المفاتيح)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if initial props change
  useEffect(() => {
    if (initialAppointmentTitle) {
      setAppointmentTitle(initialAppointmentTitle);
    }
    if (initialAppointmentTime) {
      // Clean time if formatted like "5 مساء"
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

  // Live countdown component for a plan
  const renderPlanCountdown = (plan: TimePlan) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    // Parse startPrepTime e.g. "16:20" or "4:20 PM"
    const prepParts = plan.startPrepTime.match(/(\d{1,2}):(\d{2})/);
    if (!prepParts) {
      return (
        <span className="text-xs bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md text-stone-600">
          ابدأ الاستعداد: {plan.startPrepTime}
        </span>
      );
    }

    let prepHours = parseInt(prepParts[1], 10);
    const prepMins = parseInt(prepParts[2], 10);
    // If format had PM or if time is less than current in 12hr representation
    if (plan.startPrepTime.toLowerCase().includes('pm') && prepHours < 12) {
      prepHours += 12;
    }

    const prepTotalMinutes = prepHours * 60 + prepMins;
    const diffMinutes = prepTotalMinutes - currentTotalMinutes;

    if (diffMinutes < -60) {
      return (
        <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded-md">
          مشوار منتهي أو موعد مضى
        </span>
      );
    }

    if (diffMinutes <= 0) {
      return (
        <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>حان وقت الخروج الآن! اترك اللابتوب فوراً</span>
        </div>
      );
    }

    if (diffMinutes <= 15) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg text-xs font-bold">
          <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          <span>متبقي {diffMinutes} دقيقة على بدء الاستعداد! احفظ عملك</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold">
        <Clock className="w-3.5 h-3.5 text-emerald-600" />
        <span>متبقي {diffMinutes} دقيقة قبل بدء الاستعداد</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <span>حاسبة "عمى الوقت" وجدول المشاوير الواقعي</span>
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          عقل الـ ADHD يحسب فقط وقت الطريق على Google Maps (مثلاً 30 دقيقة)، وينسى وقت (ارتداء الملابس، تجميع المفاتيح والمحفظة، إغلاق اللابتوب، ركن السيارة، والمشي للمكان). هذه الحاسبة تضيف هوامش الأمان الذكية لكي تصل دائماً قبل موعدك دون توتر!
        </p>
      </div>

      {/* Form Input */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              المشوار أو الموعد
            </label>
            <input
              type="text"
              value={appointmentTitle}
              onChange={(e) => setAppointmentTitle(e.target.value)}
              placeholder="مثلاً: دكتور الأسنان / مقابلة عمل / ميعاد مع أصدقاء"
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
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
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex justify-between">
              <span>وقت الطريق التقريبي (بالسيارة/المواصلات)</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">{estimatedTripMinutes} دقيقة</span>
            </label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={estimatedTripMinutes}
              onChange={(e) => setEstimatedTripMinutes(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>10 دقائق</span>
              <span>60 دقيقة</span>
              <span>ساعتان</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              طبيعة التجهيز واللبس
            </label>
            <select
              value={prepType}
              onChange={(e) => setPrepType(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="عادي (لبس، تجهيز الأغراض، المفاتيح)">عادي (لبس وتجميع الأغراض والمفاتيح)</option>
              <option value="رسمي أو مقابلة (شياكة، تجميع أوراق، حلاقة/كي)">رسمي أو مقابلة (يحتاج وقت مضاعف)</option>
              <option value="سريع جداً (كاجوال جاهز في 5 دقائق)">سريع جداً (كاجوال)</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleCalculate}
          disabled={!appointmentTitle.trim() || isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'جارِ بناء خطة الأمان الزمني...' : 'احسب موعد الخروج وهامش الأمان الواقعي'}</span>
        </button>
      </div>

      {/* Saved Time Plans List */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          مشاويرك ومواعيدك المحمية بهوامش الأمان ({timePlans.length})
        </h3>

        {timePlans.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-800 rounded-xl p-8 text-center text-xs text-stone-400">
            لا توجد مشاوير مسجلة حالياً. أضف موعدك القادم لمعرفة وقت بدء الاستعداد بالضبط وتفادي التأخير.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timePlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden"
              >
                {/* Header & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {plan.appointmentTitle}
                    </h4>
                    <p className="text-xs text-stone-500">
                      موعد الوصول: <span className="font-bold text-stone-700 dark:text-stone-300">{plan.targetArrivalTime}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteTimePlan(plan.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Countdown banner */}
                <div>{renderPlanCountdown(plan)}</div>

                {/* The Timeline Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                      ⏰ ابدأ التجهيز واللبس:
                    </span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-100 text-sm">
                      {plan.startPrepTime}
                    </span>
                    <span className="text-[10px] text-stone-400 block">({plan.prepMinutes} دقيقة للتجهيز)</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">
                      🚪 افتح الباب واخرج:
                    </span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-100 text-sm">
                      {plan.leaveHomeTime}
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      ({plan.transitMinutes} د طريق + {plan.unexpectedDelayBufferMinutes} د أمان)
                    </span>
                  </div>
                </div>

                {/* Anti-delay tips */}
                {plan.antiDelayTips && plan.antiDelayTips.length > 0 && (
                  <div className="text-[11px] space-y-1 text-stone-600 dark:text-stone-400">
                    <span className="font-bold text-stone-700 dark:text-stone-300 block">
                      نصائح قبل الخروج لمنع التأخير:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 pr-1">
                      {plan.antiDelayTips.slice(0, 2).map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Golden Rule for Programmers */}
                {plan.closingLaptopRule && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg text-[11px] text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-900">
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
