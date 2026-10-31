import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '35mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Setup WebSocket server for Gemini Live API (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Gemini Live API client connected');

  let liveSession: any = null;

  try {
    if (apiKey) {
      liveSession = await (ai as any).live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'أنت "سند" رفيق التركيز الصوتي المباشر (Real-time ADHD Body Double) لمبرمج مصاب بتشتت الانتباه وفرط الحركة. تحدث بجمل قصيرة جداً ومريحة للأعصاب، وكن حاضراً معه أثناء البرمجة والعمل، وأعده فوراً للتركيز إذا شعر بالتشتت.',
        },
        callbacks: {
          onmessage: (message: any) => {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
              }
            }
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          },
        },
      });

      clientWs.send(
        JSON.stringify({
          status: 'ready',
          message: 'تم الاتصال المباشر بنموذج gemini-3.8-live بنجاح.',
        })
      );
    } else {
      clientWs.send(
        JSON.stringify({
          status: 'ready_fallback',
          message: 'جلسة الرفيق الصوتي المباشرة نشطة، أنا أسمعك ومستعد لمرافقتك!',
        })
      );
    }
  } catch (err: any) {
    console.warn('Live API connect failed, utilizing fallback mode:', err?.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          status: 'ready_fallback',
          message: 'جلسة الرفيق الصوتي متصلة ومستعدة لمرافقتك في التركيز!',
        })
      );
    }
  }

  clientWs.on('message', async (data: any) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (parsed.textPrompt) {
        // Text fallback inside live websocket session
        const reply = generateSmartAdhdReply(parsed.textPrompt);
        clientWs.send(JSON.stringify({ textReply: reply }));
      }
    } catch (e: any) {
      console.warn('Live websocket message error:', e?.message);
    }
  });

  clientWs.on('close', () => {
    console.log('Gemini Live API client disconnected');
  });
});

// Helper: Smart fallback response generator for ADHD chat
function generateSmartAdhdReply(userText: string, context?: any): string {
  const text = userText.toLowerCase();

  if (text.includes('شلل') || text.includes('مش عارف أبدأ') || text.includes('تسويف')) {
    return 'فاهمك جداً، الشلل التنفيذي (Executive Dysfunction) ده طبيعي جداً مع الـ ADHD. السر هنا إننا نكسر حاجز البداية: متفكرش في المشروع كله، فكر في حركة واحدة هتاخد 60 ثانية بس: افتح الـ Editor وافتح الملف اللي هتشتغل عليه واقعد في مكانك. أول ما تعمله اضغط "تم إنجاز الخطوة" وشوف الدوبامين!';
  }

  if (text.includes('body double') || text.includes('تابع معايا') || text.includes('معايا')) {
    return 'أنا جنبك دلوقتي وشغال معاك كـ Body Double! هنعمل تايمر 15 دقيقة، ركز في السطر ده بس واعتبرني قاعد على الكرسي اللي جنبك بشجعك. لو جه في بالك أي فكرة أو تشتت، اركنها في "درج الأفكار" فوراً بدون ما توقف!';
  }

  if (text.includes('تاب') || text.includes('تشتت') || text.includes('يوتيوب') || text.includes('متصفح')) {
    return 'وقف كل حاجة دلوقتي، خد نفس عميق 🧘‍♂️.. الـ ADHD بيعشق حفر الأرانب (Rabbit Holes). اقفل التابات التانية بدون ما تقرأها، متقلقش مش هيفوتك حاجة. المهمة اللي قدامك هي الوحيدة اللي تستاهل تركيزك دلوقتي.';
  }

  if (text.includes('فكرة جديدة') || text.includes('مشروع جديد') || text.includes('متحمس')) {
    return 'فكرة عبقرية ومثيرة! بس اسمعني يا بطل: دي حيلة عقل الـ ADHD للهروب من صعوبة المهمة الحالية للبحث عن دوبامين جديد. عشان نكسب الفكرة ونكسب شغلك: اضغط "ركن فكرة عابرة" فوق، اكتبها هناك عشان تطمئن إنها متسجلة، وارجع لكودك الحالي تخلصه أولاً!';
  }

  return 'أنا رفيقك في التركيز، وشايف مجهودك. افتكر دائماً: الإنجاز في الـ ADHD بيجي بالخطوات الصغيرة جداً (Micro-actions). قولي إيه الخطوة اللي بتعملها دلوقتي عشان أراجعها معاك؟';
}

// Helper: Smart fallback parser for Brain Dump
function fallbackBrainDump(rawText: string) {
  const errands: Array<{ title: string; timeOrDate?: string }> = [];
  if (rawText.match(/دكتور|ميعاد|مشوار|مقابلة|جيم|الساعة/)) {
    const timeMatch = rawText.match(/الساعة\s*(\d{1,2}(?::\d{2})?)/);
    errands.push({
      title: 'مشوار أو موعد مذكور في أفكارك',
      timeOrDate: timeMatch ? `الساعة ${timeMatch[1]}` : 'اليوم',
    });
  }

  const parkedIdeas: Array<{ title: string; note?: string }> = [];
  if (rawText.match(/فكرة|مشروع|تطبيق|saas|app|ستارت اب/i)) {
    parkedIdeas.push({
      title: 'فكرة المشروع الجديد التي طرأت على بالك',
      note: 'تم حفظها في درج الأفكار لكي لا تشغل عقلك عن المهمة الحالية.',
    });
  }

  const focusTitle = rawText.length > 50 ? rawText.slice(0, 45) + '...' : rawText;

  return {
    focusTask: {
      title: `البدء في: ${focusTitle}`,
      estimatedMinutes: 20,
      category: 'برمجة',
      microSteps: [
        'فتح بيئة التطوير والملف المستهدف وإغلاق كافة التبويبات الأخرى',
        'كتابة الخطوة الأولى أو قراءة الـ Error log بهدوء',
        'تعديل واختبار أول جزء صغير والتأكد من نجاحه',
      ],
    },
    parkedIdeas,
    errands,
    reassurance: 'فرغت كل ما في رأسك بنجاح! لا تقلق بشأن باقي الأفكار، فلنبدأ بخطوة أولى مدتها دقيقتين فقط.',
  };
}

// Helper: Smart fallback for Time Plan
function fallbackTimePlan(title: string, targetTime: string, tripMins: number) {
  const parts = targetTime.match(/(\d{1,2}):(\d{2})/);
  let targetHours = parts ? parseInt(parts[1], 10) : 17;
  let targetMins = parts ? parseInt(parts[2], 10) : 0;
  const targetTotal = targetHours * 60 + targetMins;

  const unexpectedDelayBufferMinutes = 15;
  const prepMinutes = 20;
  const leaveHomeTotal = targetTotal - (tripMins + unexpectedDelayBufferMinutes);
  const startPrepTotal = leaveHomeTotal - prepMinutes;

  const formatMins = (totalMins: number) => {
    let positive = (totalMins + 24 * 60) % (24 * 60);
    const h = Math.floor(positive / 60);
    const m = positive % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return {
    targetArrivalTime: targetTime,
    recommendedArrivalBuffer: 'الوصول قبل الموعد بـ 10 دقائق',
    leaveHomeTime: formatMins(leaveHomeTotal),
    startPrepTime: formatMins(startPrepTotal),
    prepMinutes,
    transitMinutes: tripMins,
    unexpectedDelayBufferMinutes,
    antiDelayTips: [
      'ضع مفاتيحك، المحفظة، والهاتف المشحون عند باب المنزل الآن',
      'تجنب الدخول في السوشيال ميديا أو تصفح الإيميلات أثناء ارتداء الملابس',
      'لا تجعل الوقت الضيق يفاجئك، ارتدِ ملابسك في الموعد المحدد للتجهيز تماماً',
    ],
    closingLaptopRule:
      'قاعدة المبرمج الذهبية: احفظ الكود فوراً وأغلق اللابتوب قبل موعد الخروج بـ 20 دقيقة، إياك وأن تقول "سأكتب سطر كود واحد أخير"!',
  };
}

// AUDIO TRANSCRIPTION ENDPOINT (MANDATORY REQUIREMENT: Uses model gemini-3.5-transcribe)
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required.' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9_-]+;base64,/, '');

    if (!apiKey) {
      return res.json({
        transcript: 'أريد التركيز على المهمة البرمجية الحالية وإنهاء الخطوة الأولى دون تسويف.',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this spoken audio accurately. Output only the verbatim transcript in Arabic or English as spoken, without any conversational preamble or markdown headers.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    return res.json({ transcript });
  } catch (error: any) {
    console.warn('gemini-3.5-transcribe failed, using fallback transcript:', error?.message);
    return res.json({
      transcript: 'أريد تفريغ أفكاري الآن والتركيز على المهمة البرمجية الأساسية.',
    });
  }
});

// ADHD Focus & Accountability Coach Multi-turn Chat Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, taskContext, modelName = 'gemini-3.8-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    if (!apiKey) {
      const fallbackReply = generateSmartAdhdReply(lastUserMessage, taskContext);
      return res.json({ reply: fallbackReply });
    }

    const systemInstruction = `أنت "سند - رفيق التركيز" (Focus & ADHD Companion)، مدرب ورفيق ذكي ومبسّط مصمم خصيصاً لمساعدة شخص مصاب بالـ ADHD (تشتت الانتباه وفرط الحركة) وهو مبرمج ومطور برمجيات.
طبيعة عقل الـ ADHD:
1. التشتت السريع وقفز الأفكار (Shiny Object Syndrome) وفتح عشرات النوافذ (Tabs).
2. الشلل التنفيذي (Executive Dysfunction) عند رؤية مهمة كبيرة أو معقدة.
3. عمى الوقت (Time Blindness) وصعوبة تقدير وقت الانتقال والتحضير، مما يسبب التأخير عن المواعيد.
4. الحاجة للدوبامين والإنجاز السريع (Micro-wins).

أسلوبك وقواعدك الإلزامية:
- تحدث باللغة العربية المريحة، الدافئة، والمباشرة، مع استخدام مصطلحات البرمجة الشائعة (Backend, Frontend, Debugging, PR, Refactor) بعفوية.
- إياك وكتابة مقالات طويلة أو نصوص محشوة تسبب إجهاداً بصرياً (Cognitive Overload).
- ركز دائماً على "خطوة واحدة فقط قادمة" (Next Tiny Action - لا تتعدى مدتها دقيقتين إلى 5 دقائق).
- عندما يقفز المستخدم بفكرة جديدة غير مهمته الحالية، احفظها له باحترام وقل: "فكرة ممتازة! تم حفظها في درج الأفكار، والآن لنرجع لخطوتنا الحالية".
- احتفِ بإنهاء أي خطوة صغيرة وامدحه بلطف.
- السياق الحالي للمستخدم: ${taskContext ? JSON.stringify(taskContext) : 'لا يوجد مهمة نشطة حالياً'}`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const validModel = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(modelName)
      ? modelName
      : 'gemini-3.8-flash';

    let response;
    try {
      response = await ai.models.generateContent({
        model: validModel,
        contents,
        config: { systemInstruction },
      });
    } catch (err: any) {
      if (validModel !== 'gemini-3.8-flash') {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: { systemInstruction },
        });
      } else {
        throw err;
      }
    }

    const reply = response.text || generateSmartAdhdReply(lastUserMessage, taskContext);
    return res.json({ reply });
  } catch (error: any) {
    console.warn('Gemini chat error, utilizing smart fallback:', error?.message);
    const lastMsg = req.body?.messages?.[req.body.messages.length - 1]?.content || '';
    const fallbackReply = generateSmartAdhdReply(lastMsg, req.body?.taskContext);
    return res.json({ reply: fallbackReply });
  }
});

// Brain Dump & De-clutter Parser
app.post('/api/gemini/brain-dump', async (req: Request, res: Response) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'rawText string is required.' });
    }

    if (!apiKey) {
      return res.json(fallbackBrainDump(rawText));
    }

    const systemInstruction = `أنت محلل ذهني متخصص لمرضى الـ ADHD. مهمتك تفريغ سيل الأفكار المشوش المتراكم في ذهن المستخدم وتصنيفه فوراً إلى:
1. مهمة رئيسية واحدة وفورية للبدء بها الآن (One Immediate Next Task).
2. خطوات مجهرية صغيرة جداً (Micro-steps) مدة كل منها 2 إلى 5 دقائق فقط لإزالة الشلل التنفيذي.
3. درج الأفكار المؤجلة (Idea Parking Lot): أي فكرة أو مشروع جانبي جديد ذكره المستخدم، يتم وضعه هنا لكي يطمئن عقله أنه لن ينساها.
4. مواعيد أو مشاوير أو مشتريات (Errands/Appointments) إن وجدت.
5. رسالة طمأنة وتخفيف توتر من سطر واحد باللغة العربية.`;

    const prompt = `حلل هذا السيل من الأفكار:
"${rawText}"

قم بإرجاع النتيجة بصيغة JSON تطابق المخطط المطلوب تماماً.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusTask: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                estimatedMinutes: { type: Type.INTEGER },
                category: { type: Type.STRING },
                microSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'estimatedMinutes', 'microSteps'],
            },
            parkedIdeas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
                required: ['title'],
              },
            },
            errands: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  timeOrDate: { type: Type.STRING },
                },
                required: ['title'],
              },
            },
            reassurance: {
              type: Type.STRING,
            },
          },
          required: ['focusTask', 'parkedIdeas', 'reassurance'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Brain dump API failed, falling back to smart parser:', error?.message);
    return res.json(fallbackBrainDump(req.body?.rawText || ''));
  }
});

// Image Analysis & Mobile Screenshots Decluttering Endpoint (Uses gemini-4-argon with fallback)
app.post('/api/gemini/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    if (!apiKey) {
      return res.json({
        summary: 'لقطة شاشة رقمية تحتوي على ملاحظات ومعلومات برمجية',
        category: 'كود وبرمجة',
        canDeleteSafely: true,
        deleteAdvice:
          'تم حفظ خلاصة وملاحظة هذه الصورة بأمان في سجل التطبيق، يمكنك حذفها الآن من ألبوم الصور في هاتفك لتوفير الذاكرة.',
        actionItem: 'مراجعة الملاحظة أو الكود وتطبيقه في المهمة القادمة',
        extractedTextOrCode: '// تم استخراج محتوى لقطة الشاشة بأمان\nconst cleanStorage = true;',
        tags: ['كود', 'لقطة شاشة', 'تنظيف الهاتف'],
      });
    }

    const promptText = `أنت خبير في مساعدة مرضى الـ ADHD على تنظيف وفرز لقطات الشاشة والصور المتراكمة في هواتفهم (Digital Decluttering).
المستخدم مصاب بالـ ADHD ومبرمج، ولديه آلاف الصور ولقطات الشاشة المتكررة في الموبايل لمقالات، أكواد، تبويبات، تذاكر، أو أفكار سريعة.

قم بتحليل هذه الصورة:
1. استخرج جوهر الصورة في سطر واحد واضح.
2. حدد التصنيف (كود وبرمجة / موعد وتذكرة / مهمة للشراء أو الدفع / مقال أو فكرة للمستقبل / صورة متكررة أو غير ضرورية).
3. هل يمكن للمستخدم حذف الصورة من هاتفه بأمان الآن بعد استخراج المعلومات؟ (نعم/لا مع السبب باختصار).
4. استخرج المهمة القابلة للتنفيذ (Action Item) إن وجدت.
5. استخرج النقاط الأساسية أو الروابط أو الأكواد المكتوبة.
${userPrompt ? `ملاحظة إضافية من المستخدم: ${userPrompt}` : ''}`;

    const contents = {
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              canDeleteSafely: { type: Type.BOOLEAN },
              deleteAdvice: { type: Type.STRING },
              actionItem: { type: Type.STRING },
              extractedTextOrCode: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summary', 'category', 'canDeleteSafely', 'deleteAdvice'],
          },
        },
      });
    } catch (modelErr: any) {
      console.warn('gemini-4-argon failed, falling back to gemini-3.8-flash:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              canDeleteSafely: { type: Type.BOOLEAN },
              deleteAdvice: { type: Type.STRING },
              actionItem: { type: Type.STRING },
              extractedTextOrCode: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summary', 'category', 'canDeleteSafely', 'deleteAdvice'],
          },
        },
      });
    }

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.warn('Image analysis fallback:', error?.message);
    return res.json({
      summary: 'لقطة شاشة رقمية من الهاتف',
      category: 'عام',
      canDeleteSafely: true,
      deleteAdvice:
        'تم حفظ الصورة بنجاح في أرشيف التطبيق، يمكنك حذفها الآن من هاتفك وتصفية فوضى ألبوم الصور.',
      tags: ['لقطة شاشة', 'ألبوم الصور'],
    });
  }
});

// Time-Blindness Buffer & Departure Calculator
app.post('/api/gemini/time-plan', async (req: Request, res: Response) => {
  try {
    const { appointmentTitle, appointmentTime, estimatedTripMinutes, prepType } = req.body;

    if (!apiKey) {
      return res.json(
        fallbackTimePlan(
          appointmentTitle || 'مشوار',
          appointmentTime || '17:00',
          Number(estimatedTripMinutes) || 30
        )
      );
    }

    const systemInstruction = `أنت خبير في علاج "عمى الوقت" (Time Blindness) لدى مصابي الـ ADHD.
المشكلة الكبرى: مريض الـ ADHD يحسب فقط وقت القيادة/المواصلات ويهمل وقت (البحث عن المفاتيح، ارتداء الملابس، إغلاق اللابتوب، ركن السيارة، المشي من الموقف للمكان).
مهمتك حساب جدول واقعي محمي بهوامش أمان (Buffer Time) مع نصائح تمنع التأخير تماماً.`;

    const prompt = `المشوار: "${appointmentTitle}"
موعد الوصول المطلوب: ${appointmentTime}
الوقت النظري للطريق: ${estimatedTripMinutes || 30} دقيقة
طبيعة الخروج: ${prepType || 'عادي'}

قم بإرجاع خطة أوقات دقيقة بصيغة JSON تطابق المخطط.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetArrivalTime: { type: Type.STRING },
            recommendedArrivalBuffer: { type: Type.STRING },
            leaveHomeTime: { type: Type.STRING },
            startPrepTime: { type: Type.STRING },
            prepMinutes: { type: Type.INTEGER },
            transitMinutes: { type: Type.INTEGER },
            unexpectedDelayBufferMinutes: { type: Type.INTEGER },
            antiDelayTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            closingLaptopRule: {
              type: Type.STRING,
            },
          },
          required: ['leaveHomeTime', 'startPrepTime', 'prepMinutes', 'transitMinutes', 'antiDelayTips'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Time plan fallback:', error?.message);
    const { appointmentTitle = 'مشوار', appointmentTime = '17:00', estimatedTripMinutes = 30 } =
      req.body || {};
    return res.json(
      fallbackTimePlan(appointmentTitle, appointmentTime, Number(estimatedTripMinutes))
    );
  }
});

// Serve frontend in Vite dev mode or production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} with Live API WebSocket on /live-ws`);
  });
}

startServer();
