import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Trash2,
  CheckCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Tag,
  Code,
} from 'lucide-react';
import { DeclutterItem, FocusTask } from '../types';
import { playChime } from '../utils/sound';

interface ScreenshotDeclutterProps {
  items: DeclutterItem[];
  onAddItem: (item: DeclutterItem) => void;
  onDeleteItem: (id: string) => void;
  onStartFocusTask: (task: FocusTask) => void;
}

export const ScreenshotDeclutter: React.FC<ScreenshotDeclutterProps> = ({
  items,
  onAddItem,
  onDeleteItem,
  onStartFocusTask,
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
      // Reset upload form
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
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-amber-500" />
            <span>مفرز ومنظّف لقطات الشاشة والصور (Digital Declutter)</span>
          </h2>
          <span className="text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            Powered by gemini-4-argon
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          لديك مئات الصور ولقطات الشاشة المتكررة في الموبايل لمقالات وأكواد وتبويبات؟ ارفع لقطة الشاشة هنا: الذكاء الاصطناعي يستخرج منها الكود أو المعلومة أو المهمة، ويعطيك الضوء الأخضر <strong>لحذف الصورة من هاتفك فوراً دون خوف من ضياعها</strong> لتنظيف ذاكرة الموبايل وتصفية فوضى التشتت.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-stone-50 dark:bg-stone-950/50"
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
                className="max-h-48 mx-auto rounded-xl object-contain shadow-xs border border-stone-200 dark:border-stone-800"
              />
              <p className="text-xs text-stone-500">اضغط أو اسحب صورة أخرى للتغيير</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-amber-50 dark:bg-stone-800 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                اضغط هنا لاختيار لقطة شاشة من هاتفك أو اسحبها وأفلتها
              </p>
              <p className="text-[11px] text-stone-400">
                يدعم صور الأكواد، تبويبات المتصفح، تذاكر المواعيد، الفواتير، وملاحظات الشاشة
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
              placeholder="ملاحظة إضافية اختيارية (مثلاً: استخرج الكود، أو قولي هل أحتاج الصورة دي؟)"
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'جارِ فحص الصورة بنموذج gemini-4-argon...' : 'تحليل واستخراج الخلاصة وتقرير الحذف'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Processed Screenshots Archive */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          الصور ولقطات الشاشة التي تم فرزها وحفظ خلاصتها ({items.length})
        </h3>

        {items.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-800 rounded-xl p-8 text-center text-xs text-stone-400">
            لم تفرز أي لقطات شاشة بعد. ارفع أول صورة متراكمة على هاتفك لتجربة التخلص من الفوضى بأمان.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.imagePreview}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-800 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5 line-clamp-1">
                        {item.summary}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-stone-400 hover:text-red-500 transition-colors shrink-0"
                    title="حذف من الأرشيف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Safe To Delete Advice Badge (The peace of mind ADHD users need!) */}
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                    item.canDeleteSafely
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p>{item.deleteAdvice}</p>
                </div>

                {/* Actionable Item if present */}
                {item.actionItem && (
                  <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-amber-600 font-bold block">مهمة مقترحة للتنفيذ:</span>
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{item.actionItem}</p>
                    </div>
                    <button
                      onClick={() => handleConvertToAction(item)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shrink-0"
                    >
                      بدء التركيز عليها
                    </button>
                  </div>
                )}

                {/* Extracted code or text */}
                {item.extractedTextOrCode && (
                  <div className="relative bg-stone-950 text-stone-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                    <button
                      onClick={() => handleCopy(item.extractedTextOrCode!, item.id)}
                      className="absolute top-2 left-2 p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] flex items-center gap-1"
                      title="نسخ"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <pre className="pr-12 whitespace-pre-wrap">{item.extractedTextOrCode}</pre>
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
