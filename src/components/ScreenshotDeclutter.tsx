import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { DeclutterItem, FocusTask } from '../types';
import { playChime } from '../utils/sound';

interface ScreenshotDeclutterProps {
  items: DeclutterItem[];
  onAddItem: (item: DeclutterItem) => void;
  onDeleteItem: (id: string) => void;
  onStartFocusTask: (task: FocusTask) => void;
  onBack?: () => void;
}

export const ScreenshotDeclutter: React.FC<ScreenshotDeclutterProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onStartFocusTask,
  onBack,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }
    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || 'image/jpeg',
          userPrompt: userPrompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('فشل تحليل لقطة الشاشة بالذكاء الاصطناعي.');
      }

      const data = await response.json();

      const newItem: DeclutterItem = {
        id: Math.random().toString(36).substring(2, 9),
        imagePreview,
        summary: data.summary || 'تم استخراج محتوى الصورة',
        category: data.category || 'عام',
        canDeleteSafely: data.canDeleteSafely ?? true,
        deleteAdvice:
          data.deleteAdvice ||
          'تم استخراج المعلومات والملاحظات بنجاح، يمكنك حذف الصورة من هاتفك الآن لتفريغ الذاكرة والتخلص من الفوضى.',
        actionItem: data.actionItem,
        extractedTextOrCode: data.extractedTextOrCode,
        tags: data.tags || [],
        createdAt: Date.now(),
      };

      onAddItem(newItem);
      playChime('success');
      setSelectedFile(null);
      setImagePreview(null);
      setUserPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء فحص الصورة. يرجى المحاولة ثانية.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playChime('pop');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConvertToAction = (item: DeclutterItem) => {
    if (!item.actionItem) return;

    const newTask: FocusTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: item.actionItem,
      category: 'برمجة',
      estimatedMinutes: 20,
      currentStepIndex: 0,
      completed: false,
      createdAt: Date.now(),
      microSteps: [
        { id: `step-1-${Date.now()}`, text: `مراجعة كود أو ملاحظة: ${item.summary.slice(0, 40)}`, completed: false },
        { id: `step-2-${Date.now()}`, text: 'تطبيق التعديل أو حفظ الخلاصة', completed: false },
      ],
    };

    onStartFocusTask(newTask);
    playChime('success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>مفرز ومنظّف لقطات الشاشة والصور</span>
          </h2>
          <span className="text-[11px] font-mono text-stone-400 border border-stone-200 dark:border-[#262626] px-2 py-0.5 rounded-full">
            gemini-4-argon
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          ارفع لقطة الشاشة: يستخرج الذكاء الاصطناعي الأكواد والملاحظات، ويعطيك الضوء الأخضر لحذفها من ألبوم هاتفك بأمان تام.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-5 shadow-xs space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-stone-300 dark:border-[#333333] hover:border-stone-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-[#0c0c0c]"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          {imagePreview ? (
            <div className="space-y-3">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-48 mx-auto rounded-xl object-contain border border-stone-200 dark:border-[#262626]"
              />
              <p className="text-xs text-stone-400">اضغط أو اسحب صورة أخرى للتغيير</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-[#1a1a1a] text-stone-600 dark:text-stone-300 flex items-center justify-center mx-auto">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                اضغط لاختيار لقطة شاشة من جهازك أو اسحبها هنا
              </p>
              <p className="text-[11px] text-stone-400">
                يدعم لقطات الأكواد، التبويبات المفتوحة، التذاكر، والملاحظات السريعة
              </p>
            </div>
          )}
        </div>

        {imagePreview && (
          <div className="space-y-3">
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="ملاحظة إضافية اختيارية (مثلاً: استخرج الكود، أو هل أحتاج حفظها؟)"
              className="w-full text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/50 dark:bg-[#0c0c0c] p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-stone-500"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'جارِ التحليل بنموذج gemini-4-argon...' : 'تحليل واستخراج الخلاصة وتقرير الحذف'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Archive */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
          الصور المفروزة والمحفوظة خلاصتها ({items.length})
        </h3>

        {items.length === 0 ? (
          <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center text-xs text-stone-400">
            لا توجد لقطات شاشة مفروزة بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.imagePreview}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-[#262626] shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 block">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {item.summary}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium bg-stone-50 dark:bg-[#181818] border border-stone-200/60 dark:border-[#222222] text-stone-700 dark:text-stone-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  <p>{item.deleteAdvice}</p>
                </div>

                {item.actionItem && (
                  <div className="p-2.5 rounded-xl border border-stone-200/60 dark:border-[#222222] text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-mono">مهمة مقترحة:</span>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{item.actionItem}</p>
                    </div>
                    <button
                      onClick={() => handleConvertToAction(item)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-[11px] shrink-0"
                    >
                      بدء التركيز
                    </button>
                  </div>
                )}

                {item.extractedTextOrCode && (
                  <div className="relative bg-black text-stone-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36 border border-[#222222]">
                    <button
                      onClick={() => handleCopy(item.extractedTextOrCode!, item.id)}
                      className="absolute top-2 left-2 p-1 rounded-md bg-[#222222] hover:bg-[#333333] text-stone-300 text-[10px] flex items-center gap-1"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <pre className="pr-10 whitespace-pre-wrap">{item.extractedTextOrCode}</pre>
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
