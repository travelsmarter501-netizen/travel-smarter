# بودابست: بحث ومراجعة (النسخة 3 = النسخة 2 المصحّحة + تحديثات الجولة 3)

**نوع الوثيقة:** بحث للمراجعة. نموذج المحرّك المحلي على الفرع `feature/budapest` (commit `39c7ec3`)، والمدينة **غير مفعّلة**. ما في دمج ولا نشر.
- **التحقق:** 13-11-2026 (والجولة 3: 13–14-11-2026)، من المتصفح المدمج على صفحة الموقع نفسه، أو من بحث ويب حيث مذكور.
- **الصفحة اللي ما فتحت:** مذكورة كـ«ما انقرأت»، **ومش دليل إن المعلومة غير موجودة**.

**تصنيف كل معلومة:**
- **[رسمي]**: موقع المكان أو مالكه.
- **[مشغّل]**: موقع المشغّل التجاري.
- **[استنتاج]**
- **[تقدير تخطيط]**: للجدولة فقط.
- **[ثانوي]**: طرف ثالث، ما بيُعتمد.
- **[غير متحقق]**

**القواعد:**
- **السريان:** الفترة كما ذكرها المصدر. ما في تعميم بين الفصول والسنوات.
- **الأسعار:** حسب فئة التذكرة المعلنة. ما بنفترض جنسية الزبون أو إقامته. السعر المختصر = فئة «بالغ» الكاملة.

> **ملاحظة حفظ:** ملف النسخة 2 الأصلي `budapest-research.md` اختفى من مجلد العمل بين 13 و14-11، لسبب ما عرفته. هالنسخة إعادة كتابة من نص النسخة 2 اللي انبعت بالمحادثة، مع القسم 11 الجديد.

---

## 0. Git
- **الفرع:** `git worktree add -b feature/budapest ../tp-bud origin/main`، يعني فرع جديد من `925512d`، بنسخة عمل `scratchpad/tp-bud`.
- **upstream:** الأمر ربط الفرع تلقائيًا بـ`origin/main` كـ upstream. شلت هالربط بـ`git branch --unset-upstream` على `feature/budapest` بس، فانحذف `branch.feature/budapest.remote` و`.merge`.
- **ما تغيّر:** الـremote، ولا main، ولا أي فرع ثاني، وما صار push.
- **برا Git:** رابط مجلد `tp-bud/node_modules` لـ`tp-pub/node_modules`.
- **الجولة 3:** commit محلي `39c7ec3` على `feature/budapest` بس (النموذج)، بدون push.

## 1. قيود الأهلية والجلسات
- **الاستبيان** (`personalizedPlanAnswers.ts`): المدينة، نوع التاريخ، الأيام أو التواريخ، الاهتمامات، «فاجئني»، والفندق.
- **ما بيسأل عن الأعمار ولا الجنس ولا تركيبة المجموعة.**

| النشاط | القيد الرسمي | المصدر | الحالة |
|---|---|---|---|
| حمّام Széchenyi | ممنوع تحت 14 من 1-8-2025 (كل الحمّام). الاستثناء بشهادة طبية من مختص مع رمز ICD، تنبعت قبل 24 ساعة. ممكن يطلبوا هوية. لباس سباحة مخصص (منه البوركيني). مختلط | [رسمي] https://www.szechenyibath.hu/faq | خيار مشروط |
| حمّام Rudas | ممنوع تحت 14، وجلسات للرجال بس وللنساء بس حسب اليوم | [رسمي] https://www.rudasfurdo.hu/en/opening-hours | خيار مشروط (مش ضمن بيانات النموذج) |
| Hospital in the Rock | ممنوع تحت 6. تحت 12 مش منصوح فيه | [رسمي] https://www.sziklakorhaz.eu/en/information | خيار مشروط |
| حديقة الحيوان | تحت 14 مع بالغ | [رسمي] https://zoobudapest.com/en/tickets-and-passes/prices/ | مجدول |
| بيت الموسيقى | «بدون حدود عمر» | [رسمي] https://zenehaza.hu/en/location/permanent-exhibition | مجدول |
| كنيس Dohány | لباس محتشم، وفحص أمني | [رسمي] صفحة تذاكر المشغّل | اقتراح مشروط (مش ضمن بيانات النموذج) |
| برج Matthias | 197 درجة، بدون مصعد، بموعد | [رسمي] https://matyas-templom.hu/en/buy-tickets/ | معلومة بالبطاقة |
| قبة المعرض الوطني | 54 درجة، أقصى 15 شخص، حسب الطقس | [رسمي] https://en.mng.hu/the-dome/ | جزء من الزيارة |
| رحلة Legenda | تحت 10 ببلاش. المشروب ممكن مي أو غازي | [مشغّل] https://legenda.hu/en/danube-legend | مجدولة بالتواريخ المحددة |
| داخل البرلمان | غير متحقق (CAPTCHA) | — | معلومة بالبطاقة |

**الحل لاحقًا بدون تعديل الاستبيان:** النشاط المشروط بيضل اقتراحًا. وما بينعرض بزر «أضف» قبل ما الواجهة تعرض الشرط قبل الإضافة (القسم 11.4).

## 2. الأماكن

### 2.1 مؤكدة

**St Stephen** [رسمي] https://bazilikabudapest.hu/jegyarak/
- **الساعات:** الكنيسة الإثنين–السبت 9–18، الأحد 13–18. التراس والخزنة كل يوم 9–19.
- **الأسعار (من 1-12-2025):**
  - بالغ: الكنيسة 2,600 / التراس 5,000 / المشترك 6,800.
  - تحت 18 أو +65: 2,000 / 4,000 / 5,500.
  - تحت 6 ببلاش.
- **آخر دخول:** ما انقرأ.

**Matthias** [رسمي]
- **الساعات:** بس «ساعات اليوم» (9–17، آخر دخول 16:45). الطقوس والوفود إلها الأولوية.
- **السعر:** بالغ 3,400، ومع الدليل الصوتي 5,000. https://matyas-templom.hu/en/buy-tickets/
- **البرج:** تذكرة بموعد.

**حصن الصيادين** [مشغّل] https://fishermansbastion.com/
- **الفتح:** مفتوح 365 يوم.
- **فترات الدفع 2026:** 9–19 (من 2-1 لـ31-5)، 9–21 (من 1-6 لـ30-9)، 9–19 (من 1-10 لـ23-12).
- **ببلاش:** 15-3 و20-8 و23-10، و24–31-12.
- **السعر:** 1,700، الفئة مش مكتوبة، كرت بس.

**المعرض الوطني** [رسمي] https://en.mng.hu/opening-hours/ و https://en.mng.hu/tickets-to-the-permanent-exhibition/
- **الساعات:** الثلاثاء–الأحد 10–18. **الدخول لحد 17:00.**
- **الأسعار:** كامل 5,800، مخفّض 50% بـ2,900 (حسب العمر، المرسوم 194/2000؛ صفحة التفاصيل ما انقرأت). سنوي 9,000.
- **ببلاش للكل:** 15-3 و20-8 و23-10.
- **القبة:** بأي تذكرة، 10–17، حسب الطقس.
- **الإغلاقات السنوية:** ما انقرأت.

**المتحف الوطني** [رسمي] https://mnm.hu/en و https://mnm.hu/en/tickets
- **الساعات:** الإثنين مسكّر. الثلاثاء–الأحد 10–18، الشباك لحد 17.
- **السعر:** كامل 3,500. المخفّض لهنغاريا وEEA بس.
- **تنبيه رسمي:** قاعات مسكّرة للترميم.

**الأوبرا (OperaTour)** [رسمي] https://www.opera.hu/en/services/operatour/
- **الجولة:** بالإنجليزي 60 د، كل يوم 13:30 و15:00 و16:30.
- **السعر:** 12,000 (بالهنغاري 6,400).
- **الحجز:** أقصى 30 شخص، والتذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض.

**Hospital in the Rock** [رسمي]
- **الساعات:** كل يوم 10–19، آخر جولة 18:00. مسكّر 1-1 و1-11 و24 و25 و31-12.
- **الزيارة:** بجولة 60 د.
- **السعر:** بالإنجليزي 30 EUR بالغ، بيندفع بالفورنت.

**Dohány** [رسمي، تذاكر المشغّل] https://zsinagoga.jegy.hu/program/felnott-belepojegy-61785?lang=en
- **من 2-11-2026:** الأحد–الخميس 10–16، الجمعة 10–14، السبت مسكّر. الدخول قبل النهاية بساعة.
- **مسكّر:** 1-11، و24 و25-12.
- **شتاء 2027:** مش منشور.
- **السعر:** [غير متحقق].

**Széchenyi** [رسمي]
- **الساعات:** الإثنين–الخميس 7–20، الجمعة 7–22، السبت والأحد 8–20.
- **الأسعار 2026:** 13,200 / 14,800 / 15,800. نفس التذكرة لكل الأعمار.

**Citadella** [رسمي] https://citadella.hu/hu/home و https://citadella.hu/hu/jegyinformacio
- **الحديقة:** ببلاش. تشرين الثاني–آذار 8–22، نيسان–تشرين الأول 6–24.
- **المعرض:**
  - الإثنين–الخميس والسبت والأحد 10–18، الجمعة 12–20.
  - آخر دخول 16:40 (الجمعة 18:40).
  - بالغ 4,900، مخفّض 2,450.

**القطار المعلّق** [رسمي] https://bkv.hu/en/content/buda_castle_funicular
- **الساعات:** 8–22.
- **أيام الإغلاق 2026:** لائحة منشورة.
- **السعر:** ذهاب 4,500، ذهاب وإياب 5,500.

**السوق المركزي** [رسمي] https://piaconline.hu/en/opening-hours
- الإثنين 6–17، الثلاثاء–الجمعة 6–18، السبت 6–15، **الأحد مسكّر**، ومسكّر بالأعياد. الدخول ببلاش.

**حديقة الحيوان** [رسمي] https://zoobudapest.com/en/for-visitors/opening-hours/
- **الساعات:** حسب الشهر، وآخر دخول قبل ساعة. من 31-10 لـ30-11 ولكانون الأول: 9–16.
- **السعر:** بالغ 5,900.

**بيت الموسيقى** [رسمي]: القسم 11.1 بيصحّح.

**القطار الصغير** [رسمي] https://gyermekvasut.hu/en/
- **التشغيل:** مش الإثنين من أيلول لنيسان.
- **السعر:** 1,000، كاش.
- **برج Erzsébet:** مسكّر للترميم.

**رحلة Legenda** [مشغّل]
- **الرحلة:** ساعة. السعر 25 EUR.
- **جدول 2026:** كامل بصفحة https://legenda.hu/en/timetable (الجدول منسوخ بالقسم 11.6).
- **24-12:** بدون رحلة مسائية.
- **الموعد المنشور مش ضمان مكان.**

### 2.2 أماكن عامة
جسر السلاسل، والأحذية، وساحة Kossuth، وساحة الأبطال، وVajdahunyad من برا، وجزيرة Margaret، وVáci utca، وAndrássy، وGozsdu.
- **[استنتاج]:** أماكن عامة مفتوحة. نقطها من OSM (القسم 11.3).

### 2.3 خارج الجدول
| المكان | السبب |
|---|---|
| داخل البرلمان | CAPTCHA (ما بنتخطّاه)، وصفحة التذاكر بلا سعر |
| House of Terror | «مسكّر مؤقتًا» |
| حمّام Gellért | مسكّر من 1-10-2025 [ثانوي] |
| برج Erzsébet | مسكّر للترميم |
| Puskás Aréna | شهادة الموقع فيها خطأ، والجولة بالهنغاري [ثانوي، 2025] |
| Szimpla وWestEnd | ما في مصدر |

### 2.4 المطاعم (مصدر = موقع المطعم أو مجموعته)
| المطعم | الساعات | المصدر |
|---|---|---|
| Hungarikum Bisztró | 12–14:30 و18–22 | https://hungarikumbisztro.hu/ |
| Menza | المطبخ 11:30–22:30 | https://menzaetterem.hu/ |
| Frici Papa | الإثنين–السبت 11–22 | https://www.fricipapa.hu/ |
| 21 | 11:30–23 | https://zsidai.com/hu/21-restaurant/ |
| Pierrot | الأربعاء–الأحد 11:30–23 | https://zsidai.com/hu/pierrot/ |
| New York Café | مطبخ ساخن من 12 | https://newyorkcafe.hu/ |
| Gerbeaud (مقهى) | 9–20 أو 9–21 | https://gerbeaud.hu/en/ |
| Robinson | الأيام مش مكتوبة | **مش وجبة مؤكدة** |

- **حلال:** Szeráj وTitiz وAl Amir بدون مصدر مناسب، فبدون وصف حلال وبدون ساعات مؤكدة.
- **ما راسلت أي جهة.**

## 3–9 (من النسخة 2)
- مسار St Stephen → حصن الصيادين.
- التغطية، والنماذج الأولية اليدوية.
- النواقص، والقرارات، والموانع.

**مكانها الآن:** النماذج اليدوية انحلّت محلها نماذج المحرّك (القسم 11.7). النقاط والمسارات صارت بالملفات (`transfers/`).

## 11. تحديثات الجولة 3 (13–14-11-2026)

### 11.1 بيت الموسيقى
- **صفحة الفعالية الرسمية:** https://zenehaza.hu/en/occasion/dimensions-of-sound-musical-journey-through-space-and-time
  - الدخول بفترات كل 30 دقيقة.
  - المدة «حوالي ساعتين»، ونوصي بساعتين لثلاث.
  - الثلاثاء والأربعاء والخميس والسبت والأحد 10:15–17:50، آخر دخول 16:15.
  - الجمعة 10:15–19:50، آخر دخول 17:45.
  - الإثنين مسكّر.
- **صفحة الموقع** (location page) بتضيف «مسكّر أول ثلاثاء من كل شهر». اعتمدنا الأشد: الإغلاق محفوظ كاستثناءات بالتواريخ.
- **متجر التذاكر الرسمي** ligetplusz.hu/jegyek/hangdimenziok (قُرئ 13-11، رفضنا كوكيز غير الضرورية):
  - 19-11-2026 فيه فترات **10:15 لـ16:15 كل 30 د**.
  - **السعر ما ظهر قبل الدفع، فهو مجهول.**
- **بالنموذج:** المدة 120 د. البداية مربوطة بفترة :15/:45 (`showWindow.offsetMinutes`). **ما في تحويل لوقفة خارجية.**

### 11.2 متحف الفنون الجميلة [رسمي]
**الصفحات:** https://www.mfab.hu/opening-hours-3/ و https://www.mfab.hu/tickets/

**الساعات 2026:**
- الإثنين مسكّر. الثلاثاء–الأحد من 10:00، الدخول لحد 17:00، والإغلاق من 17:30.
- **«Museum and Slow»** (13-11 و11-12): من 12:00، والدخول لحد 19:00.

**استثناءات 2026:**
- 15-3: 10–14 ببلاش.
- 23-10: مسكّر. 24 و25-12: مسكّر.
- 26-12: مفتوح. 31-12: 10–16. 1-1-2027: 12–18.

**الأسعار:**
- كامل 5,800.
- مخفّض 2,900 **لمواطني EEA وأوكرانيا بس**.
- مجموعة 5,200.
- ببلاش لتحت 6.

**بالنموذج:** مكان ثقافي بأولوية 7، **مش مفروض على كل خطة**.

### 11.3 النقاط والمداخل (OSM: Nominatim / Overpass)
- **رصيف Legenda:** node/4816567424 «Legenda kikötő», Jane Haining rakpart 7 = **47.4941437, 19.0488902**. النقطة السابقة كانت نقطة شارع، وبتبعد حوالي 450 م.
- **المداخل المثبّتة:**

  | المكان | العقدة | الإحداثيات |
  |---|---|---|
  | St Stephen | node/11172119967 | |
  | المعرض الوطني (مدخل C) | node/5842060882 | 47.496282, 19.039849 |
  | المتحف الوطني | node/9195573290 | |
  | الأوبرا | node/12449555202 | |
  | حديقة الحيوان | node/9104208377 | |
  | Széchenyi | node/2753450424 | |
  | بيت الموسيقى | node/9344029111 | |
  | السوق المركزي | node/2508882191 | |
  | Citadella | node/1488958235 | |
  | الفنون الجميلة | node/10463806599 | |
  | Hospital in the Rock | node/5124313362 | |

- **الباقي:** نقطة الكائن نفسه (ساحات وجسور وجزيرة وشوارع). التفاصيل لكل مكان بـ`data/places.json`.

### 11.4 زر «أضف» (فحص الكود)
- **بطاقة الإضافة** بتعرض الاسم والصورة والفئة والعنوان بس. الزر بيضيف **بدون ما يعرض الشرط** (الشرط بيظهر بس إذا فتح الزبون التفاصيل).
- **السيرفر بيتحقق من:**
  - إنه مكان إله بيانات تخطيط ومش مقيّد باهتمام.
  - إنه ما بيتعدّى 8 محطات و4 خيارات.
  - إنه، لما ينضاف بآخر اليوم، ما بياخد تحذير الوقت (ساعات الفتح).
- **ما بيتحقق** من العمر أو الجلسة أو الحجز.
- **النتيجة:** الأنشطة المشروطة **بدون بيانات تخطيط**، فما بتنعرض بزر «أضف».

### 11.5 Matthias وHospital in the Rock
- **Matthias:** صفحة التذاكر بتعرض «Today's church opening hours» ثابتة، ما بتتغير مع التاريخ المختار. ساعات أيام الرحلة **غير متحققة**. فالداخل معلومة بالبطاقة، والوقفة من برا (15 د) مجدولة.
- **Hospital in the Rock:** صفحة التذاكر عليها فحص روبوت (403)، ما بنتخطّاه. مواعيد الجولات **غير متحققة**، فما في نسخة «مع Hospital» بموعد متحقق.

### 11.6 جدول Legenda 2026 كامل [مشغّل]
**أول وآخر رحلة مسائية بكل فترة (كل 20 د):**

| الفترة | أول رحلة | آخر رحلة |
|---|---|---|
| 1–4 كانون الثاني | 15:40 ثم 16:20 | 21:00 |
| 5 كانون الثاني – 11 شباط | 16:20 | 21:00 |
| 12–24 شباط | 16:40 | 21:00 |
| 25 شباط – 9 آذار | 17:00 | 21:00 |
| 10–28 آذار | 17:40 | 21:00 |
| 29 آذار – 5 نيسان | 19:00 | 22:00 |
| 6 نيسان – 21 أيار | 19:20 | 22:00 |
| 22 أيار – 23 تموز | غير منتظم (19:30، 20:15، 20:20، 20:30، 20:45، 21:30، 21:40، 21:45، 22:00) | |
| 24 تموز – 3 أيلول | 19:20 | 22:00 |
| 4–13 أيلول | 19:00 | 22:00 |
| 14–22 أيلول | 18:40 | 22:00 |
| 23 أيلول – 2 تشرين الأول | 18:20 | 22:00 |
| 3–24 تشرين الأول | 17:40 | 22:00 |
| 25 تشرين الأول – 22 تشرين الثاني | 16:20 | 21:00 |
| 23 تشرين الثاني – 31 كانون الأول | 15:40 ثم 16:20 | 21:00 |

**الاستثناءات:** 24-12 رحلات نهارية بس. 20-8 «ممكن يتغيّر». **2027 مش منشور.**

**بالنموذج (قديم، استبدله القسم 13.3):**
- بس رحلات **الساعة الكاملة**، لأن ساعة الخطة بتمشي بأرباع، و:20/:40 ما بتقع عليها.
- فترة 22-5 لـ23-7 بدون رحلة، وكمان 24-12 و20-8 و2027.
- **بالتواريخ المرنة:** اقتراح بس.

### 11.7 مسار St Stephen → حصن الصيادين (من نقاط محددة)
- **النقاط:** من 47.5007189, 19.0533363 لـ47.5023053, 19.0346998.
- **OSRM foot:** 1,772 م، عبر جسر السلاسل ثم درج Jezsuita (مدة OSRM 23.8 د).
- **Google WALK:** 1,844 م. فككت خط المسار، وبيعبر الدانوب عند خط العرض 47.49925، يعني جسر السلاسل. مدة Google 27.9 د.
- **Google TRANSIT** (الخميس 19-11 الساعة 09:00): 2,255 م / 13.6 د.
- **المعروف:** المسار والجسر. **المدة غير مؤكدة** بين المصدرين. النموذج بيحسب المدة تقديرًا: 4.5 كم/س، +20% لأن المسار بيطلع التلة. هاد قاعدة تخطيط، مش قياس.

## 12. Stage 1 corrections (2026-11-14, on `feature/budapest`)

### 12.1 National Gallery: holiday hours (superseded by 13.1)
- **The page:** the official holidays page https://en.mng.hu/opening-hours-during-holidays/ returned Cloudflare 520 on 13 and 14 November 2026 (several tries). The Hungarian pages on mng.hu returned the same error.
- **Archive:** the Wayback copy of 4 November 2026 stores the same error. The newest readable copy (2025-06-24) is from an earlier season and is not used.
- **What changed:** the earlier entry stored 24–26 December as closed, "assumed". That assumption is removed.
- **New entry:**
  - A planning exclusion covering 24 Dec 2026 – 1 Jan 2027, marked UNVERIFIED (not a closure fact).
  - The planner does not schedule the gallery on those dates, under the owner's rule that unknown hours are not scheduled at a guessed time.
  - The customer sees no "closed" text.
  - It must be replaced with the official dates once the page can be read.
- **What the independent reviewer read (14 Nov):** 24–25 Dec closed, 26 and 28 Dec open, 31 Dec shorter, 1 Jan from noon. We have **not re-read** this ourselves, so it is not stored as fact.

### 12.2 House of Music: first Tuesday (superseded by 13.2)
- **The rule:** "closed the first Tuesday of each month" (location page). It is now generated by code for every month from November 2026 to December 2040 (170 dates).
- **Why that range:** the questionnaire sets no upper limit on travel dates.
- **Tests:** the closed day and the open Wednesday after it, for 2026-12, 2027-01, 2027-07, 2027-08, 2033-03 and 2040-12. Plus a second Tuesday open and a Monday closed.

### 12.3 Coordinate sources in the export
- **Margaret Island:** the coordinates were already right: OSM way/180740489, the musical fountain. The export copied the basilica's comment because the area "margaret-island" was found first. The export script is fixed (it searches the attraction block itself), and the coordinates are unchanged.
- **Legenda pier:** the export now shows the source of the point actually used: OSM node/4816567424 "Legenda kikötő", Jane Haining rakpart 7, at 47.4941437, 19.0488902.
- **Heroes' Square and Vajdahunyad:** now carry their source comment (OSM way/25217448, node/275019091).
- **Menza, Pierrot and Gerbeaud:** the export now reads their comments.

### 12.4 Checked public transport
- **Format:** each check is now a record per direction with `minutes`, `departureLocal`, `timeZone: Europe/Budapest`, `checkedOn`, `distanceMeters`, `durationSeconds` and `source`.
- **No reverse direction:** an unchecked direction falls back to the labelled estimate.
- **The note** names the checked direction and departure (weekday, date, time, Budapest time) and says the time changes at other times.
- **Before this:** 5 legs in the sample showed "Google" on a direction that was never checked.

## 13. Stage 1 follow-up and stage 2 (2026-11-14, on `feature/budapest`)

### 13.1 National Gallery: holiday hours (replaces 12.1)
- **Source:** https://en.mng.hu/opening-hours-during-holidays/ **as read by the independent reviewer on 14 Nov 2026** and relayed by the owner. Our own tool still could not open the page (Cloudflare 520 on 13 and 14 Nov); we did **not** read it ourselves.
- **Stored dates:** 24–25 Dec 2026 closed. 26–30 Dec, Monday 28 Dec included: 10:00–18:00, last entry 17:00. 31 Dec: 10:00–16:00, last entry 15:00. 1 Jan 2027: 12:00–18:00, last entry 17:00.
- **The whole-period exclusion is removed.**
- **Hall closing:** the regular hours page (read by us on 13 Nov) says the halls start closing at 17:30. The plan therefore ends a visit by 17:30 on every 18:00 day, holidays included. For 31 Dec (building closes 16:00) the source gives no hall-closing time, so the plan uses 16:00.
- **How it is stored:** the place is now `variable` (planning hours per season and date), so the plan can end at 17:30 while the card shows the building's 10:00–18:00. The card text is new and listed for review (see 13.6).
- **Monday 28 Dec:** opened with an `override` exception. A trip with another Monday that is not covered (e.g. 26 Dec – 4 Jan) keeps Mondays closed, because the plan has one schedule per weekday (conservative).
- **Last entry per trip:** one value per place. A trip that includes 31 Dec uses 15:00 for the whole trip (conservative, as for the Museum of Fine Arts).

### 13.2 House of Music: first Tuesday (replaces 12.2)
- **The rule** "closed the first Tuesday of each month" (location page, read 13 Nov 2026) is stored once, as a rule (`recurringClosures`), and computed for the trip's own dates. No end year, no stored date list.
- **Verification vs recurrence:** only the rule was read on the source. Individual future first Tuesdays (2040 and later included) are computed from the rule, not confirmed one by one.
- **Not purely local:** the planner had no monthly rule, so a small opt-in field was added to the shared hours code. A place without the field is unchanged.

### 13.3 Cruise timetable (stage 2)
- **Every published 2026 departure** is stored as published, including :20 / :40 and the irregular 22 May – 23 Jul list. Each departure is one interval [departure, +60 min].
- **Exact start:** `startsAtOpening` makes the plan start the cruise exactly at one departure. The quarter-hour rounding never moves it. A start that is not a departure is rejected ("closed") by the shared schedule check.
- **Year binding:** the periods are 2026 periods. 2027 and later: no timetable published, so a **planning exclusion** (labelled "not a closure"): the cruise is not put on the clock, and nothing tells the customer it is closed. 20 Aug ("might change"): the same. 24 Dec: published daytime cruises only, so the evening cruise has no departure that day.
- **Trips across two periods:** per weekday, only the departures that every relevant period publishes. Plans without dates: only 20:20 (the one departure common to every 2026 period); the cruise then becomes the existing optional suggestion for flexible dates.
- **Arrival before sailing:** the operator FAQ (read 14 Nov) publishes no check-in or arrival time; reservations are "not required" but recommended. The plan keeps only its own 15-minute margin before every visit: a **planning margin, not an operator rule**.
- **Pier point:** OSM node/4816567424 is about 190 m south of Vigadó tér, while the FAQ's walking directions (from Vigadó tér: down the stairs, across at the lights, left about 50 m) point closer to the square. Unresolved; the OSM point is kept.
- **Create / edit / add:** one rule. The add path used the place's stored hours instead of the trip's hours, so an added cruise landed off the timetable (17:15) without a warning. Fixed with an opt-in module flag (`tripHoursForAddedPlaces`, Budapest only). **Prague has the same pre-existing pattern** for its seasonal places; not changed (Prague stays identical).
- **Budapest day check:** the lunch-detour allowance (+15 min) was added to the cruise's start, which then was no longer a departure, so the day balance stripped stops (first run: 67 days changed). The cruise now takes the next departure after its estimated arrival + the allowance.

### 13.4 Effect on the 53-plan sample (159 days)
| Comparison | same | other places | order | meals | times only | notes only |
|---|---|---|---|---|---|---|
| Stage-1 correction only (MNG + House of Music) vs stage 1 | 91 | 4 | 4 | 0 | 0 | 60 |
| Stage 2 only (cruise) vs stage 1 | 136 | 0 | 0 | 0 | 21 | 2 |
| Both vs stage 1 | 68 | 4 | 4 | 0 | 21 | 62 |

The two effects are independent: "both" is exactly the sum. Independent check: 0 problems in every file; 23 cruise starts checked exactly against the departures. Prague (82 / 31 / 20 plans) and Barcelona (104 / 378) are byte-identical to `925512d`.

### 13.5 Transfers shown in the combined sample (710 transitions)
| Category | Count |
|---|---|
| Walk (routed OSM path, time estimated) | 562 |
| Transit checked in that direction (Google, dated) | 43 |
| Transit estimate where only the reverse was checked | 14 |
| Transit estimate (distance model × 1.3) | 56 |
| Into a lunch break with no place (no line shown) | 35 |
| **Total** | **710** |

The 675 lines a customer sees are the first four rows. The transfer line shows mode, "≈" for an estimate, minutes and distance. The Google note (direction, weekday, date, time) appears only in the details sheet opened from that line.

### 13.6 Open items from this round
- **New customer texts (for review, not added to the plan UI):** the National Gallery hours text (13.1). A reason for the cruise on unpublished dates was **not** added (it would be new plan text); 2027 trips show no cruise at all.
- **Plan size:** a plan with the cruise stores the full departure table: average 128 KB (was 79 KB). Plans without the cruise shrank from 62 to 48 KB (no more 170-date list).
- **Quality of the 20 days reordered in stage 1:** waits beyond travel + margin over those days: 1,569 min before stage 1, 1,841 after, 1,532 with stage 2. Worst: B 22 Nov day 2 (Monday): Citadella 09:00 then 150 min before a 12:30 lunch break (before stage 1 it started 13:30 with the Opera tour).
- **Waits before the cruise (whole sample):** 21 days → 16, total 2,249 → 1,024 min, median 113 → 73.
- **Citadella after dark:** 4 of 36 Citadella visits start after sunset (e.g. 20:15 in November): an evening view, never to be described as a daytime visit.
- **Paper examples:** Andrássy → Opera is a 1–2 min walk (estimate); the plan keeps ≥ 15 min before the tour, so "Andrássy until 14:45, tour 15:00" would need Andrássy to end by 14:43. National Museum → pier: 1.55 km walk, 19–24 min (estimate, to the uncertain OSM pier point); museum until 16:15 gives the 17:00 departure (16:20/16:40 are too early), about 21 min before sailing after the longest walk.

## 14. Review corrections (2026-11-14, owner's second review of stage 2)

### 14.1 Hours per day (NOT built: design waiting for approval)
- **The defect:** hours are resolved once per trip and per weekday (`tripHours.ts`). Measured with `docs/budapest/tools/bud-mixed-dates.mts` (correct behaviour as expectations): 7 pass, **7 KNOWN failures**:
  - 31 Dec in the trip makes the gallery's last entry 15:00 on every day (30 Dec, 1 Jan, and 27 Dec in a generated plan).
  - A trip with Monday 28 Dec (published open) and Monday 4 Jan (ordinary, closed) plans every Monday closed.
  - House of Music: a trip with the first Tuesday (closed) and an ordinary Tuesday closes both.
  - Cruise: a trip with Thursday 24 Dec (no evening cruise) and Thursday 31 Dec (published) gets no departure on 31 Dec.
- **Already per day:** a place the customer ADDS is resolved for that day's date (`tripHoursForAddedPlaces`). So today adding and creating can disagree: the gallery can be added on Monday 28 Dec, while creation treats Monday as closed.
- **Smallest design (opt-in flag `resolveHoursPerDay`, Budapest only):**
  1. `v2CityPipeline.ts`: places resolved for each day's own date (`resolvePlacesForTrip(places, [date])`, cached per date). The date eligibility uses that day's hours.
  2. `cityPlannerModule.ts` + `v2CityPipeline.ts`: the repair context gains `hoursForPlaceOnDay(placeId, dayNumber)`; Budapest's day check uses it.
  3. `barcelonaV2Resolve.ts` (`resolveV2Plan`): an optional `cityForDay(dayNumber)`; the stops, meals and suggestions of a day are resolved with it. The place details sheet keeps the trip-level copy.
  4. Nothing else: the timing guard and the edit path read the hours stored on each stop, which become that day's hours.
- **Scope:** about 40 lines in 3 shared files + the Budapest module. Prague and Barcelona unchanged (flag unset), proven by the byte comparison. Acceptance: every case in `bud-mixed-dates.mts` passes.

### 14.2 Plans without dates and the cruise
- **Before this round (where 20:20 was used):** without dates the cruise was in the request's place list.
  - The day builder could put it on a day (counting its 60 minutes).
  - The day balance tried that day on the clock with the 20:20 departure, and moved or dropped places.
  - Only at the end was the cruise taken off the day and shown as a suggestion.
  - Measured: **22 of 31 days** of the sample's plans without dates had other places or another order than the same request without the cruise.
- **Now:**
  - Without dates the cruise has **no departure**. A time common to every 2026 period says nothing about an unknown date or year.
  - It is removed from the request's place list before any pass runs (`datedOnlyPlaceIds`, opt-in). On dated trips the same applies when no trip day has a published departure (e.g. 2027).
  - It is shown only as a suggestion, when it matches the request (same relevance rule as any place), on the day with the most time by the river.
  - The "add" button never offers it, and a forced add is flagged (no departure to start at).
- **Test:** `docs/budapest/tools/bud-cruise-suggest.mts`. Every plan without dates (9 interest sets, 1–4 days, Surprise Me) and 4 trips in 2027 are **identical** to the same request on a test-only copy with the cruise removed from the data. 95 checks, all pass.

### 14.3 Boarding point
- **Operator:** "Dock 7 Jane Haining rakpart, Budapest" (legenda.hu/en/contact, read 14 Nov).
- **OSM:** the floating pontoon "Vigadó 7. ponton" (name:en "Vigadó Dock 7", way/375465291). The stored point (node/4816567424 "Legenda kikötő", Jane Haining rakpart 7) is its shore end: 21–25 m from the pontoon's three nodes.
- **Last part of the walk:** OSRM snaps the destination 0 m from the point. The last 178 m are the riverside sidewalk (way/246187225: footway, lit, sett), then 3 m to the point.
- **Still open:**
  - The FAQ says "walk down the stairs and cross at the traffic lights… take a left and walk another 50 meters". The nearest signal crossing (node/2532573591) is about 124 m from the point in a straight line, so the "50 m" does not match Dock 7 exactly.
  - Which gangway on the pontoon is used is not published.
  - The walking note does not claim door to pier.
- **Earlier "190 m":** it was measured from the middle of Vigadó tér, not from the crossing, and did not show the point was wrong.

### 14.4 Customer texts
- **Approved and used (2026-11-14):** «رحلة مسائية على الدانوب — خيار إضافي. تأكّد من المواعيد والتوفّر لتاريخ سفرك قبل الحجز.» It is shown for the cruise on dated trips with no published timetable. Plans without dates keep the existing evening-cruise text.
- **National Gallery card (NOT approved yet):** sent to the owner as it would appear, in Arabic and English.
  - **English:** it would currently show the Arabic text. There are no Budapest entries in `planCatalog.ts`, and the page shows a stored text as it is when it has no reviewed translation.
- **Issues found while preparing it:**
  - The hours line says "Monday closed" and does not mention 26–30 Dec (with Monday 28 open).
  - The holiday dates have no year: a 2027 traveller would read them as 2027 dates.
  - The tip ends with "the yearly closures are on a separate page we did not read", which is out of date.

### 14.5 Plan size (analysis only; nothing changed, no database change)
- **Measured** (`docs/budapest/tools/bud-plan-size.mjs`, 53-plan sample): a plan with the cruise averages 119 KB, of which 87 KB are hours objects.
  - The cruise's hours are 48.7 KB per copy, stored twice: on the day's stop and in the place details.
  - Of the 3.9 MB of hours in the sample, the full season list (`seasonalSchedules`) is 3.3 MB, dated exceptions 0.1 MB, and internal maintenance notes (`conflict`) 0.1 MB.
- **Why it is all stored:** each generated plan freezes the resolved place data with it (`generated_plan_json`).
- **What is read back:** the plan view and its edits read only the customer text (display / weekly table), the planning schedule, last entry, `startsAtOpening` and the source fields. Nothing reads the season list, the dated exceptions, the monthly rule or the notes after the plan is made (checked in the code).
- **Smallest design:**
  - When a plan is made, store a compact hours copy. **Keep:** the customer text, the planning schedule for the trip's own days, last entry, `startsAtOpening`, the source fields, and a data version (source, timetable year, read date). **Drop:** what was already applied.
  - Estimated result: 119 → about 43 KB for a plan with the cruise; the whole sample 5.96 → 2.28 MB.
  - Edits keep working from the frozen copy.
  - A place added later is resolved from the current data, and its version is recorded with the edit. A changed timetable is then visible, and never silently applied to an old plan.

### 14.6 Corrections to the previous report
- The culture day with the 150-minute wait is request `B-2026-11-22` (interests: culture; dates 22–24 Nov 2026), **day 2 = Monday 23 Nov 2026**, not "Monday 22 Nov".

### 14.7 Kept for the next stage (not changed now)
- Long waits: before a lunch break, around tour slots, and before the cruise.
- Gerbeaud used as a lunch place.
- Late first visits: the Opera tour at 13:30 as the first stop; Citadella first at 12:00.
- Citadella visits after dark.
- Passing the schedule tests does not prove a day is good.

## 15. Hours per day and the add request (2026-11-14, approved by the owner; branch only)

### 15.1 What was built (opt-in `resolveHoursPerDay`, Budapest only)
Every day of a dated trip is planned with ITS OWN date's hours: opening, last entry, dated exceptions, monthly rule and cruise departures.

**Where it applies:**
- **Selection:** a place open on some trip days stays a candidate for exactly those days. The date eligibility now asks the hours of that day's date.
- **Day check:** Budapest's day check uses `hoursForPlaceOnDay`.
- **Timeline and stop records:** resolved per day (`resolveV2Plan(…, cityForDay)`).
- **Final check:** the timing guard reads the hours stored on each stop.
- **Stop details:** the details record of a stop is the record of its own day; a suggestion of the same place on another day does not overwrite it.
- **Editing (start, order, length):** works from the stored per-day hours.
- **Adding:** already resolved for the day's date; the add candidates' details now are too.
- **Save, reopen, restore:** the stored plan carries the per-day hours.

**Shared files:**
- `barcelonaV2DateEligibility.ts`: the lookup receives the day's date as an optional second argument. Barcelona's and Prague's lookups ignore it.
- `v2CityPipeline.ts`
- `barcelonaV2Resolve.ts`
- `cityPlannerModule.ts`
- `planCustomizations.ts`

Prague and Barcelona do not set the flag.

### 15.2 Add request for a place the day cannot take
- `decidePlanChange` is now the decision `customizeSavedPlan` makes **before** any write. A rejected add returns `add_unavailable`, and nothing is saved.
- The page treats `add_unavailable` like the earlier `invalid`: it reloads, and no new text is shown. The add button only offers places that fit, so this code is reached only by a stale screen or a request that bypasses the page.
- **Before this round** the same request was already refused (`invalid`), because `applyPlanChange` accepts only add candidates. The previous test, however, only checked the warning on a forced edit, not the request path.
- **Showing an OLD saved plan** whose stored edits already contain such a place is a separate case: the place is shown with the "time is tight" warning, never dropped silently.

### 15.3 Tests (all must pass; a regression fails the run)
- **`bud-mixed-dates.mts`: 294 pass, 0 fail**, on 7 generated mixed trips (`bud-mixed-cases.mts`).
  - **A.** Every visit and meal is checked independently against its own date's hours, read from the place data.
  - **B.** Stored stop hours = details = that date's hours.
  - **C.** Edits: every offered start, a reversed order and a first visit 30 minutes longer. Warnings appear exactly where the independent check finds a problem.
  - **D.** The 7 cases that failed before:
    - Wed 30 Dec and Fri 1 Jan in a trip with 31 Dec.
    - Mon 28 Dec open and Mon 4 Jan closed in one trip.
    - First Tuesday and an ordinary Tuesday.
    - 24 and 31 Dec.
    - The cruise around 22/23 Nov and around the year end.
  - **E.** Restore, reset, save and reopen.
  - **F.** Timeline = details on 28 Dec, 31 Dec 2026 and 1 Jan 2027.
  - **The same test on the previous code (`3f74074`) fails 13 checks:**
    - section B: created stops stored another day's last entry (gallery, Museum of Fine Arts, Zoo);
    - D1 and D3: the gallery on 30 Dec.
  - **Limit:** D4–D7 passed on the old code too, because they go through the add path, which was already per day. For created stops the proof is section B.
- **`bud-cruise-suggest.mts`: 157 pass.** The add request is rejected (`add_unavailable`) and the stored edits are unchanged, both with no edits and with an existing edit on that day. The old-plan display is checked separately.
- **`bud-boundary.mts`:** 86 pass.
- **Independent check:** 0 problems on the 53-plan sample and the 12 prototypes.

### 15.4 Effect on plans
- **7 mixed trips (before = `3f74074`, after = this round):** no change in places, order, meals or times. 17 of 54 days changed only in stored data: the hours stored on stops and in details (gallery, Museum of Fine Arts, cruise, Zoo, House of Music) now carry that date's opening and last entry.
- **53-plan sample:** no change in places, order, meals or times; 20 days changed only in stored hours.
- **12 prototypes:** 3 days changed, notes only.

### 15.5 Schedule validity vs. source correctness
- **Schedule validity (what the tests prove):** every planned visit, meal and departure fits the hours STORED in our data for its own date.
- **Source correctness (not proven by any test):**
  - The gallery's holiday dates were read by the independent reviewer on 14 Nov 2026; our own access failed (HTTP 520).
  - The House of Music rule was read by us on 13 Nov 2026. Future first Tuesdays are computed, not confirmed one by one.
  - The cruise timetable is the operator's 2026 table, read 13–14 Nov 2026; nothing is published for 2027.
  - The Museum of Fine Arts' 31 Dec last entry is assumed (one hour before closing).
  - The Zoo: weekend last entry is not modelled.

### 15.6 Fields read after a plan is made (for the deferred size work)
| Reader | Hours fields it reads |
|---|---|
| Place card / details sheet (`OpeningHours.tsx`) | `type`, `display`, `seasons` (display, month range), `schedule` |
| Timeline, edits, start choices (`barcelonaV2Timeline.ts`, `planCustomizations.ts`) | `type`, `schedule`, `lastEntry`, `startsAtOpening`, through `planningHoursOf`: `planningSchedule`, `planningLastEntry` |
| Final check (`plannerTimingGuard.ts`) | same as the timeline |
| Closed-day check (`barcelonaV2DateEligibility.ts`) | `type`, `schedule`, `closedWeekdays` |
| Translation (`localizePlan.ts`) | every display string, by exact catalog match (`display`, `seasons[].display`) |
| Copied into planning copies (`hours.ts`) | `source`, `sourceUrl`, `lastVerified` |

- **Not read from a stored plan:** `seasonalSchedules`, `dateExceptions`, `recurringClosures`, `planningOpenFrom` and `conflict`. They are only read from the current place data, when a plan is made or a place is added.
- **Nothing is removed in this round.**
- **Source and version, when the size work starts:**
  - Keep `source`, `sourceUrl` and `lastVerified` on every stored copy.
  - Add a data version (e.g. the timetable year and read date).
  - Record the version with an added place, because added places are resolved from the CURRENT data at every view, and their hours are not stored in the edits.

### 15.7 National Gallery card text (proposal, NOT applied)
- **Month names:** the site's plan and day headers use "ديسمبر / يناير". The Budapest data uses "كانون / تشرين" in 12 lines; aligning them is pre-launch text work.
- **Current UI limit:** for this place type (`variable`) the card shows the written text, not a row for the visit date. The holiday dates therefore come first in the text, each with its year.
- **Pre-launch work:** the Budapest English (and Hebrew) translations are still missing for every Budapest text. Only the texts proposed here have English.
