import React, { useState } from 'react';
import { X, Code2, Smartphone, Layers, CheckCircle2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface DeveloperPortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperPortModal: React.FC<DeveloperPortModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reactNativeSnippet = `// App.tsx (Expo / React Native Implementation)
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RakeezMobile() {
  const [currentStep, setCurrentStep] = useState("إصلاح باج المصادقة في الـ API");
  const [minutesLeft, setMinutesLeft] = useState(20);

  const completeStepWithDopamine = () => {
    // 1. Haptic feedback (Vibration dopamine hit)
    Vibration.vibrate([0, 80, 50, 100]);
    // 2. Audio affirmation
    Speech.speak("أحسنت يا بطل! تم إنجاز الخطوة بنجاح", { language: 'ar' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>وضع التركيز الأحادي (ADHD Monotasking)</Text>
      <Text style={styles.taskTitle}>مهمتك الوحيدة الآن:</Text>
      <View style={styles.card}>
        <Text style={styles.stepText}>{currentStep}</Text>
        <TouchableOpacity style={styles.button} onPress={completeStepWithDopamine}>
          <Text style={styles.buttonText}>تم إنجاز الخطوة! ✨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09', justifyContent: 'center', padding: 24 },
  badge: { color: '#f59e0b', fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: '700' },
  taskTitle: { color: '#a8a29e', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#1c1917', borderRadius: 20, padding: 24, marginTop: 12, borderWidth: 1, borderColor: '#d97706' },
  stepText: { color: '#fafaf9', fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  button: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});`;

  const copyCode = () => {
    navigator.clipboard.writeText(reactNativeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>إجابة سؤالك: تحويل التطبيق إلى React Native 📱</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                  Dev Architecture
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                أهلاً بك كزميل مبرمج! إليك كيف تم تصميم المعمارية وكيف تنقلها إلى Mobile بسهولة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Direct Answer */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-2">
          <p className="font-bold text-sm">
            💡 نعم بالتأكيد، React Native (تحديداً مع Expo) هو الخيار المثالي والأقوى لهذا التطبيق!
          </p>
          <p>
            النسخة التي بنيناها لك هنا تعمل حالياً كـ <strong>Web Application و Progressive Web App (PWA)</strong>، ولكن كل منطق الأعمال (Business Logic) وحالات المهام والذكاء الاصطناعي تم فصلها في Hooks ومكونات معيارية نقية (Decoupled TypeScript).
          </p>
        </div>

        {/* Why React Native is Supercharged for ADHD */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>مميزات حصرية لمصابي الـ ADHD عند تشغيله على React Native:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                🔔 تنبيهات الاستعداد القسرية (Push Alarms)
              </span>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                في الويب قد تغلق التاب، لكن في الموبايل عبر <code>expo-notifications</code> يرسل لك إشعاراً صوتياً واهتزازاً قبل الموعد بـ 15 دقيقة: "اترك اللابتوب وابدأ اللبس الآن!".
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                📱 Lock Screen & Home Widgets
              </span>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                وضع المهمة الواحدة والتايمر مباشرة كـ Widget على شاشة القفل ليراها عقلك دون الحاجة لفتح الموبايل والتشتت بالسوشيال ميديا.
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                📸 Share Extension لتنظيف لقطات الشاشة
              </span>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                أي لقطة شاشة تأخذها على الموبايل، تضغط زر "Share" وتختار التطبيق ليحللها ويستخرج كودها ويقترح حذفها فوراً.
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                🎧 أصوات العزل بالخلفية (Background Audio)
              </span>
              <p className="text-stone-500 text-[11px] leading-relaxed">
                تشغيل Brown Noise أو نغمات 40Hz في الخلفية عبر <code>expo-av</code> وأنت تبرمج على جهازك وسماعتك متصلة بالموبايل.
              </p>
            </div>
          </div>
        </div>

        {/* Mapping Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span>جدول تحويل الحزم (Web vs. React Native / Expo):</span>
          </h4>
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-right">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                <tr>
                  <th className="p-2.5">الوظيفة</th>
                  <th className="p-2.5">المستخدم في تطبيقنا (Web)</th>
                  <th className="p-2.5">البديل في React Native</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-600 dark:text-stone-400">
                <tr>
                  <td className="p-2.5 font-semibold text-stone-800 dark:text-stone-200">التصميم والتنسيق</td>
                  <td className="p-2.5">Tailwind CSS</td>
                  <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">NativeWind v4</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-stone-800 dark:text-stone-200">التعرف الصوتي</td>
                  <td className="p-2.5">Web Speech API</td>
                  <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">@react-native-voice/voice</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-stone-800 dark:text-stone-200">التحدث الصوتي</td>
                  <td className="p-2.5">SpeechSynthesis</td>
                  <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">expo-speech</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-stone-800 dark:text-stone-200">حفظ البيانات</td>
                  <td className="p-2.5">localStorage</td>
                  <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">AsyncStorage أو react-native-mmkv</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-stone-800 dark:text-stone-200">الباك إند و Gemini</td>
                  <td className="p-2.5">Express server.ts</td>
                  <td className="p-2.5 text-stone-700 dark:text-stone-300">نفس السيرفر تماماً كـ API REST!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              نموذج كود جاهز لـ React Native / Expo:
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>
          <div className="bg-stone-950 text-stone-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-52">
            <pre className="whitespace-pre">{reactNativeSnippet}</pre>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs"
          >
            فهمت، شكراً لك!
          </button>
        </div>
      </div>
    </div>
  );
};
