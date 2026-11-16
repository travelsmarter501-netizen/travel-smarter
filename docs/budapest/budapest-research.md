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

## 16. Review round 4 (2026-11-14): server action, details per day, refusal message, gallery text

### 16.1 Server action and saving
- **`bud-action-save.mts` (15 pass)** runs the REAL `customizeSavedPlan`. Only the two Supabase client modules are swapped for in-memory test doubles (`fake-supabase/`, through a Node resolution hook). Test data only: a generated plan, a made-up user and plan id.
  - **Refused adds:** the cruise on a 2027 day of a trip whose 2026 days have it; the cruise on every day of a 2027-only trip; a place already in the trip; an unknown id. Each returns `add_unavailable`, the save RPC is never called, and the stored row is byte-identical.
  - **Valid add:** the save RPC is called once. Reading the row back gives the same day the action returned, and the original plan is kept beside the edits.
  - **The same add again (a stale screen):** refused, with no second save.
  - **Another user's plan / signed out:** `not_found` / `not_signed_in`, unchanged.
- **The real page (local test server + fake Supabase, test data):**
  - **Refusal:** a stale screen's add was refused, and the message was shown. The server made only reads (no `replace_owned_plan_content`), and the stored row was unchanged.
  - **Valid add:** the add called the save once, and after reopening the page the place is on its day.
- **Not covered:** a real Supabase (row-level security, the SQL function itself) and real devices.
- **Renamed:** the "save + reopen" check in `bud-mixed-dates.mts` is a JSON serialization round trip of the data, not the site's save / reopen.

### 16.2 Details opened from a day
- **Found:** `planAddOptions` kept one `details[id]` for all days (the last day won), and the plan keeps one record per place. A suggestion on one day could therefore show another day's hours.
  - On the real saved-plan path there was a second leak: `cityForSavedPlan` gave the edit functions hours already merged for the whole trip.
- **Fix (opt-in, Budapest only):**
  - `cityForSavedPlan` returns the plain place data for cities with `resolveHoursPerDay`.
  - `PlanAddOptions.detailsByDay`: each day's candidates with that day's hours.
  - `V2Plan.dayPlaceDetails`: a day's own record, only where it differs from the plan-level one.
  - `applyPlanCustomizations` keeps both for added places.
  - The action returns the edited day's records.
  - The page opens a place with the day's records on top. Without these fields (Prague, Barcelona, older plans) the page builds the same map as before.
- **Tests (`bud-mixed-dates.mts`, 307 pass):**
  - **G1:** on every day of the 7 mixed trips, every place shown (visits, meals, suggestions, add candidates) opens a record with that date's hours.
  - **G2:** the gallery offered on Wed 30 Dec (after removing it from that day), then added on Thu 31 Dec, in one plan.
  - **G3:** the Zoo suggested on 1 Jan 2027 and added on 31 Dec 2026.
  - **Generated plans** never show a place both as a visit and as a suggestion. That case therefore exists only after an edit.
- **What the page shows (screenshots):**
  - **Gallery (`variable`):** the card shows its written text, the same on every day. That text lists the holiday dates with their years.
  - **Museum of Fine Arts on Fri 1 Jan 2027 (fixed weekly table):** "ساعات يوم الجمعة: 12:00–18:00 · مفتوح هذا اليوم", that date's row (an ordinary Friday is 10:00–18:00).

### 16.3 Refusal message
- Shown only after the server refuses an add (`add_unavailable`), above the day, and cleared by the next change.
- Arabic and English as approved. **Hebrew proposed by the developer, not reviewed:** «אי אפשר להוסיף את המקום הזה ליום הזה. נסו מקום אחר.»

### 16.4 National Gallery text (applied as approved, with the requested corrections)
- **Holiday hours first, each date with its year.** Last entry per listed day: 17:00 for 18:00 days, 15:00 for 31 Dec. The 17:30 hall closing is stated only under regular hours.
- **Tip:** the dome only within the museum's hours (17:00 at the latest), and last entry is no longer repeated.
- **English** is in the reviewed catalog (`planCatalog.ts`). **Hebrew** catalog entries proposed, not reviewed.
- **Planning is unchanged:** visits on 26–30 Dec and 1 Jan still end by 17:30 (conservative); the text does not promise that for holidays.

### 16.5 Prague and Barcelona
- **Generation** on this commit: see the regression file in the package.
- **Edit functions on the Prague (82) and Barcelona (104) samples:** add options, a removal, an add, a start change and a refused add are byte-identical to the published `925512d` code (`edit-reg.mts`, both trees).

### 16.6 Still open before launch (unchanged scope)
- The Budapest texts that use "كانون / تشرين" (e.g. the Museum of Fine Arts tip).
- All other Budapest English / Hebrew translations: the card's description and price still show in Arabic in the English view.
- Compact stored hours (deferred).
- Day quality (next).

## 17. Day quality, round 1 (2026-11-14, commit 79b067c on `feature/budapest`)

### 17.1 What changed (Budapest only; shared code opt-in)
1. **Lunch place:**
   - A café is no longer lunch. Gerbeaud, the only Budapest café, is stored with coffee and cakes only; there is no evidence it serves lunch.
   - Lunch is a restaurant that fits the route, its hours and the full meal; otherwise the lunch break in the area.
   - Gerbeaud stays a coffee-break suggestion.
2. **Lunch after the last visit** (`mealStops.lunchAfterLastStop`, opt-in):
   - The lunch slot may follow the day's last visit when that gives the best lunch time.
   - The restaurant, the walk to it, its hours and the full meal are still checked by the meal choice and the timing guard; a 12:00–13:45 end alone is not enough.
   - The option reaches generation, Budapest's day check and the edit path.
3. **Order on the real clock:**
   - **Unchanged:** the same places and the same visit lengths.
   - **Constraints:** every visit inside its hours (exact cruise departures), evening places last, at most +15 min of travel per day.
   - **Gain rule:** an order is taken only for a gain of ≥ 30 idle-equivalent minutes that is ≥ twice the added travel. Idle-equivalent = 09:00 → first visit + waits + 2 × late lunch + daylight visits after dark + ½ travel.
   - Idle moved into the morning counts as idle: the morning is measured from 09:00.
   - **Bounded:** at most 6 non-evening stops, and the 120 cheapest orders by travel are tried.
- **No automatic later start** in this round.
- **Daylight:**
  - Approximate monthly sunset (planning approximation, never shown).
  - Only places seen in daylight (Margaret Island, Vajdahunyad from outside, the Zoo) count.
  - Viewpoints, bridges and lit squares after dark are not penalised.

### 17.2 Results vs ddb1b98 (53-plan review sample, 159 days; the "old" variant equals ddb1b98 byte for byte)
| Variant | 09:00 → first visit | Waits | Sum | Travel | Restaurant / lunch break / Gerbeaud | Lunch after 13:30 | Daylight visits after dark | Median / max generation |
|---|---|---|---|---|---|---|---|---|
| ddb1b98 | 4,980 | 10,032 | 15,012 | 8,038 | 117 / 42 / 16 | 24 | 310 | 239 / 952 ms |
| no café lunch | 4,980 | 10,059 | 15,039 | 7,861 | 101 / 58 / 0 | 17 | 310 | 248 / 932 ms |
| lunch after last visit | 4,980 | 8,739 | 13,719 | 8,071 | 116 / 43 / 15 | 24 | 310 | 242 / 920 ms |
| clock order | 1,140 | 8,412 | 9,552 | 8,483 | 121 / 38 / 13 | 9 | 0 | 249 / 998 ms |
| **all three** | **1,140** | **8,069** | **9,209 (−39%)** | **8,278 (+3%)** | **108 / 51 / 0** | **3** | **0** | **248 / 984 ms** |

- Visit minutes are identical in every variant (34,690); the average program end moves from 17:19 to 16:45.
- **Launch sample (108 plans, 270 days):**
  - Sum (morning + waits): 27,591 → 15,689 (−43%).
  - Travel: 14,129 → 14,334 (+1.4%).
  - Lunch after 13:30: 44 → 9.
  - Daylight visits after dark: 160 → 0.
  - Gerbeaud lunches: 26 → 0; lunch breaks: 60 → 83.
  - Generation: median 146 → 170 ms, p90 704 → 946 ms, max 952 → 2,016 ms.
- **Worse days:**
  - Idle +21 min on one Tuesday "shopping" day: Citadella first. It appears in both samples (two plans each).
  - Travel +15 to +18 min on 8 / 18 days, each with a larger idle gain.
  - No day ends 30+ min later.
  - Lists: `docs/budapest/data/launch-sample-r1/worse-and-changes.txt`.
- **Fixed times:**
  - Every Opera tour and cruise start leaves at least the 15-minute planning margin after the LONGEST transfer: tour ≥ 23 min, cruise ≥ 15 min.
  - Neither operator publishes an arrival time: Opera tour page, "starts in the entrance hall at the information desk", read 14 Nov; Legenda FAQ. The margin is the plan's own, not doubled, and separate from the visit and the transfer.

### 17.3 The examples (full timelines in the package)
| Day | 09:00 → first | Waits | Sum | Travel | Ends | Lunch |
|---|---|---|---|---|---|---|
| B 22 Nov (Sun) before → after | 240 → 0 | 23 → 99 | 263 → 99 | 27 → 36 | 18:05 → 15:30 | Gerbeaud 14:45 → Hungarikum 12:30 |
| B 23 Nov (Mon) | 0 → 0 | 185 → 108 | 185 → 108 | 55 → 67 | 17:05 → 16:00 | break → Menza 12:30 |
| B 24 Nov (Tue) | 0 → 0 | 133 → 19 | 133 → 19 | 22 → 31 | 16:30 → 14:45 | 21 Restaurant 12:30 → 13:30 (after the gallery) |
| A 4 days, 21 Nov (Sat, cruise day) | unchanged | 93 | 93 | 62 | 17:20 | lunch break |
| Food 22 Nov (Sun) | 240 → 0 | 33 → 30 | 273 → 30 | 52 → 64 | 20:00 → 16:00 | Gerbeaud 14:45 → Hungarikum 13:00 |
| Food 23 Nov (Mon, cruise day) | unchanged | 146 | 146 | 51 | 16:40 | lunch break |
| Food 24 Nov (Tue) | unchanged order | 79 | 79 | 50 → 57 | 17:15 | Menza |

- **The cruise days are unchanged.** With the same places, the gap before a 15:40–16:20 departure can only be moved into the morning.
- The later-start experiment for the A day:
  - Starting 09:30–10:00 keeps the sum at 93 (the wait becomes free morning).
  - From 10:30 the sum grows.
- So a later start is a rest choice with that effect, not a fix for missing content. Not applied.

### 17.4 Moving a place to another day (measured, not built)
- **B (22–24 Nov):** St Stephen's to Monday (it opens at 13:00 on Sundays), Citadella to Sunday.
  - Trip idle 226 → 121 at the same travel.
  - Sunday 99 → 15; Monday 108 → 87. Monday still waits for the 15:00 tour.
- **Food (22–24 Nov):** St Stephen's to Monday.
  - Trip idle 255 → 141, travel +16.
  - Sunday 30 → 25; Monday 146 → 37.
- **Conclusion:** worth a round 2 rule (weekday-dependent hours decide the day), judged on the whole trip, not one day.

### 17.5 Launch readiness after round 1 (proposal from fixed thresholds; not a decision)
- **Thresholds:** places/day ≥ 3; thin days ≤ 15%; strong match ≥ 60% (food: restaurant meals count); idle/day ≤ 90 min.
- **ok:** all cells except the ones below. Before round 1, 17 of 36 cells failed the idle threshold.
- **check:**
  - culture 4 days: two thin days;
  - popular 4 days: 58% strong match.
- **not ready:** "nature" alone at 2–4 days (2.8–3.2 places/day, thin days, 47–63% match).
- **Food interest:** 1.8–3.0 food experiences per day (restaurant lunches and dinners, the market hall).
- **Table:** `docs/budapest/data/launch-sample-r1/table-all.csv`.

### 17.6 Not changed in this round
- Automatic later start (experiment only).
- The cross-day move (17.4).
- Compact stored hours.
- The policy for hours of places added to saved plans.
- Translations.

## 18. Day quality, round 2 (2026-11-15, code commit 8e8a309 on `feature/budapest`)

### 18.1 What changed
- **One measure, before and after:** `app/lib/planner/budapest/budapestDayQuality.ts` (`finalDayQuality`) reads a FINAL day: the chosen restaurant, the meal length and every transfer, meal legs included. The planner accepts changes with it and the review tools report with it (`bud-quality-metrics.mts` is a wrapper).
- **Stage 1, order accepted on the final schedule:**
  - The clock still proposes up to 4 orders per day (same places, same lengths).
  - Each proposal is REBUILT and judged on the schedule the customer gets: resolved and passed through the timing guard.
  - Accepted only if all hold:
    - no new schedule problem;
    - no restaurant lunch turned into a lunch break;
    - final travel at most +15 min for the day (cap unchanged);
    - gain ≥ 30 idle-equivalent minutes and ≥ twice the added travel.
  - Days not reordered may change only through a shared restaurant: cost +10 at most, travel +15 at most.
  - Bounded: 6 rebuilds per plan.
- **Stage 2, moving a place to another day:**
  - Candidates: a place that opens 2 h or more later on its day than on another trip day (St Stephen's on a Sunday opens at 13:00).
  - It moves alone or is swapped with one of the 3 nearest places of that day; each of the two days is ordered on the clock.
  - Judged on the WHOLE trip: total gain ≥ 30, no day weaker at all (tolerance 0), no restaurant lunch lost, +15 travel at most on any day, at least 2 places per day.
  - The trip keeps the same places and lengths. Dated plans only; 12 rebuilds at most; the accommodation-anchored day 1 is not touched.
- **No automatic later start.**
- **Bug found by the independent check and fixed:**
  - In the first round-2 build, the review compared against the plan BEFORE the timing guard repaired it.
  - Where the guard later reordered the unchanged plan, the accepted order looked +19 min worse than what the customer would otherwise get (4 launch days).
  - Now every version the review compares is the guarded schedule, and the pipeline returns the reviewed data as is (opt-in `reviewResolvedPlan`; Prague and Barcelona do not set it).

### 18.2 Results (each variant in its own process, one after another, nothing else running)
- **Variants:**
  - "ddb1b98": equals that commit byte for byte; the sample file is identical to `bud-s10.json`.
  - "lunch rules": no café lunch + lunch after the last visit.
  - "order": + stage 1.
  - "all": + stage 2.
- Visits are identical in every variant.

**53-plan sample (159 days)**

| Variant | 09:00 → first | Waits | Sum | Travel | Restaurant / break / Gerbeaud | Lunch after 13:30 | Daylight after dark* | Avg visits end / lunch end | Dinners | Median / p90 / max ms |
|---|---|---|---|---|---|---|---|---|---|---|
| ddb1b98 | 4,980 | 10,032 | 15,012 | 8,038 | 117 / 42 / 16 | 24 | 310 | 17:18 / 14:22 | 39 | 527 / 1,384 / 2,054 |
| lunch rules | 4,980 | 8,733 | 13,713 | 7,912 | 101 / 58 / 0 | 17 | 310 | 16:59 / 14:24 | 39 | 450 / 1,346 / 1,834 |
| order | 1,320 | 8,231 | 9,551 | 8,154 | 106 / 53 / 0 | 3 | 0 | 16:35 / 14:14 | 39 | 464 / 1,429 / 1,869 |
| **all** | **1,260** | **8,114** | **9,374 (−38%)** | **8,161 (+1.5%)** | **106 / 53 / 0** | **3** | **0** | **16:33 / 14:14** | **39** | **482 / 1,415 / 1,822** |

**108-plan launch sample (270 days)**

| Variant | 09:00 → first | Waits | Sum | Travel | Restaurant / break / Gerbeaud | Lunch after 13:30 | Daylight after dark* | Avg visits end / lunch end | Dinners | Median / p90 / max ms |
|---|---|---|---|---|---|---|---|---|---|---|
| ddb1b98 | 8,325 | 19,266 | 27,591 | 14,129 | 210 / 60 / 26 | 44 | 160 | 17:27 / 14:22 | 84 | 334 / 1,449 / 2,909 |
| lunch rules | 8,325 | 17,205 | 25,530 | 13,831 | 183 / 87 / 0 | 32 | 160 | 17:09 / 14:24 | 84 | 299 / 1,333 / 2,234 |
| order | 2,520 | 13,134 | 15,654 | 14,309 | 187 / 83 / 0 | 2 | 0 | 16:34 / 14:14 | 88 | 281 / 1,324 / 1,753 |
| **all** | **2,340** | **13,101** | **15,441 (−44%)** | **14,332 (+1.4%)** | **187 / 83 / 0** | **2** | **0** | **16:34 / 14:14** | **88** | **302 / 1,294 / 1,846** |

\* Daylight places (Margaret Island, Vajdahunyad from outside, the Zoo) after dark, **by the monthly sunset estimate for the listed places**. The project has no sunset calculation by date, coordinates and time zone: Barcelona uses coarse monthly buckets on purpose, and no library is installed. None is proposed in this round.

- **Generation time:** the review adds no measurable cost; the spread between variants is run-to-run noise. Bounded by 6 + 12 rebuilds per plan.
- **Lunch breaks (no named restaurant) per interest, final version:**
  - Sample: A 11/29, culture 3/18, C 8/18, popular 8/18, nature 7/18, shopping 0/18, experiences 7/18, **food 7/18**, surprise 2/4.
  - Launch: A 10/30, culture 7/30, C 8/30, popular 14/30, nature 12/30, shopping 2/30, experiences 10/30, **food 11/30**, surprise 9/30.
  - The rise from ddb1b98 (launch 60 → 83) comes entirely from removing Gerbeaud as lunch (round 1); stages 1 and 2 lower it (87 → 83).

### 18.3 Each stage apart and the worse cases (`docs/budapest/data/quality-r2/<sample|launch>/diff-*.txt`)
"Worse" = any of these on that day:
- idle up;
- travel up;
- restaurant lunch lost;
- later lunch;
- daylight after dark (estimate);
- cost up;
- visits ending 60+ min later.

**Lunch rules alone (lunchRules vs ddb1b98):**
- 29 / 46 days changed. Every restaurant lunch lost is a Gerbeaud lunch (13 / 23), by design.
- The same days are the idle increases: +8 to +9 min on a Thursday or Friday whose Gerbeaud lunch became a lunch break (7 days in the sample, 12 in the launch sample).
- Travel +9 at most.

**Stage 1 (order vs lunch rules, same lunch rules):**
- 33 / 89 days changed. No day travels more than +15 (max +15); no restaurant lunch lost; no visit ends later.
- Worse beyond the accepted travel:
  - `experiences-2026-11-22` Monday (not reordered): idle 32 → 37, travel +10, because Sunday's new order takes Hungarikum and Monday gets 21 Restaurant. It is within the +10 tolerance for unchanged days; Sunday gains 113 idle.
  - `C-4d-2026-11-19` Saturday (not reordered): travel +9, cost +5, same restaurant change.
- All other "worse" days are travel increases with a larger idle gain on the same day.

**Stage 2 (all vs order):**
- 4 / 6 days changed (2 / 3 trips): `B-2026-11-22`, `popular-2027-07-17` (sample) and `popular-2d/3d-2027-07-17`, `experiences-4d-2026-11-19` (launch).
- Worse: travel +7 to +14 on one day of each trip, with a larger gain on the trip; nothing else.

**Against ddb1b98 (all stages):**
- One day above +15 travel: B Sunday 22 Nov, 27 → 45 (+18), in two steps each within the cap (stage 1 +13 against the lunch-rules day, stage 2 +13 in exchange for Monday −19). Idle on that day: 263 → 15.

**The two shopping cases (idle 37 → 58 in round 1):**
- `shopping-flex3` and `shopping-2026-11-22`, day 3.
- **Rejected now.** On the final schedule the clock's proposal (Citadella first) has idle 58 and cost 91.5 against 73.5, so it is worse; they stay at 37.
- The mirror case (`shopping-2026-11-19 / -12-24 / -2027-01-11`, day 3, idle 58) has the better order available (idle 37, +6 travel) but its gain, 18, is under the 30 threshold, so it is not taken. The rule is kept as agreed.

### 18.4 The Sunday / Monday cases and the culture day
**Culture `B-2026-11-22` (moved by stage 2):**
- **Sunday:**
  - Before: St Stephen's at 13:00 first (morning gap 240, lunch break 14:30), visits end 17:50.
  - After: Citadella 09:00 → Shoes → Parliament → Chain Bridge, visits end 12:00, Hungarikum 12:30–13:45.
  - Idle 256 → 15, travel 19 → 45.
- **Monday:**
  - Before: Citadella → Opera 15:00 → Heroes', lunch break.
  - After: Heroes' 09:00 → St Stephen's 10:15–11:30 (open from 09:00 on Mondays) → Menza 12:30 → Opera tour 15:00–16:00.
  - Idle 185 → 97, travel 55 → 48.
  - The wait before the 15:00 tour stays: the 13:30 tour does not fit after lunch, and no Monday-open culture place is left to fill it (below).
- **Tuesday, unchanged:** Fisherman's Bastion 09:00 → Matthias 10:00 → National Gallery 10:45–12:45 → 21 Restaurant 13:30–14:45; idle 19.
  - The day ends at 14:45 because the trip has few places, not because of the order.
  - Cause: this culture trip gets 10 places, where the same trip on Thursday–Saturday gets 13. The City Park day falls on Monday, when the Museum of Fine Arts and the House of Music are closed, so both are left out; the National Museum is also not chosen.
  - Fixing this means choosing which area goes on which date BEFORE places are picked (Sunday = museums, Monday = churches, squares and the tour). That changes the trip's places, so it is outside this round (same places only) and is listed as a proposal. No padding was added.

**Food `food-2026-11-22` Sunday (not changed, rejected by the cap):**
- Today: St Stephen's 13:00 first, lunch break 14:30, visits end 19:45, idle 266.
- Stage 1's four orders reach idle 29–31 and a Hungarikum lunch, but final travel is 63–83 against 44: walking to a named restaurant replaces the lunch break, which has no transfer. Over +15, so rejected.
- Stage 2's best move (St Stephen's to Monday) would take the trip from cost 683 to 218: Sunday idle 266 → 25, Monday 146 → 24 with a restaurant instead of the lunch break. It is rejected because Monday's travel rises +32 (restaurant legs again) and Tuesday's dinner restaurant changes (+3.5 cost, tolerance 0).
- The cap is kept as agreed. **Owner decision:** whether walking to a named restaurant that replaces an undetermined lunch break should count inside the +15 cap.

**Cruise days unchanged:**
- `A-4d-2026-11-19` Saturday: Market Hall 09:00 → Váci 10:30 → Citadella 12:00 → lunch break 13:00 → cruise 16:20; idle 93.
- Food Monday: Váci → Market Hall → lunch break 12:30 → cruise 15:40; idle 146.
- Same places: the wait before a fixed departure can only move into the morning.

### 18.5 Sample table (fixed thresholds; a measurement, not a launch or sales decision)
- `docs/budapest/data/quality-r2/launch/table-all.csv` (and `table-old.csv` for ddb1b98).
- Columns now include lunch breaks per cell, the average end of the visits, the end of lunch and the optional dinners apart, and the daylight estimate. "meets all" only says the thresholds are met.
- After round 2:
  - Every cell meets the idle threshold except "nature" 2 days.
  - Still missing thresholds:
    - culture 4 days: thin days;
    - popular 4 days: 58% strong match;
    - nature alone 2–4 days: few places, thin days, weak match.
- **The launch range stays open.**

### 18.6 Checks on 8e8a309
- **Budapest tests:**
  - Independent check: 159 + 270 days, 0 problems; 728 + 1,277 transfers, none without data.
  - `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 pass, 0 fail; `bud-action-save` 15 pass, 0 fail.
- **Build:** tsc, eslint (changed files) and `next build --webpack` with fake values and `ALLPAY_MODE=disabled`.
- **Prague and Barcelona on 8e8a309 (clean tree):** generation byte-identical to `925512d` (prg-focus 82, prg-oneday 31, bcn104, bcn378; prg-long plans identical, timings excluded); edits (add options, remove, add, start change, refused add) byte-identical for prg-focus and bcn104. Package: `tests/prague-barcelona-generation-and-edits-8e8a309.txt`.

### 18.7 Not changed
- Automatic later start.
- The +15 cap and the gain threshold.
- Choosing which area goes on which date (proposal, 18.4).
- Compact stored hours.
- Translations.

## 19. Day quality, round 3: experiments (2026-11-15, code commit dfe4453 on `feature/budapest`)

**Status:**
- All the rules below are TEST-ONLY switches (`budapestModuleWith`). The Budapest defaults are unchanged.
- Variant A reproduces 8e8a309 byte for byte on both samples.
- Nothing here is adopted, and Budapest stays unavailable.

### 19.1 What is a validity rule, an improvement threshold, a policy
| Kind | Rules | Effect when missed |
|---|---|---|
| **Validity** (the schedule is wrong without it) | Opening hours, last entry and closures of THAT date; published departures started exactly; full visit lengths; no overlap; gap ≥ shown transfer + 15-min margin; nothing past midnight; restaurant open for the whole meal | The schedule is invalid. Measured by `scheduleProblems` and the independent check. |
| **Improvement thresholds** (reviewable) | Gain ≥ 30; added travel ≤ half the gain; +15 travel (A); the B/C allowance (recovered / k, ≤ 45, day ≤ 90); trip travel share ≤ +2 points; no restaurant lunch lost; meal equivalence; no new 60-min wait; area candidates' own limits | A valid alternative is not taken. It stays a valid alternative. |
| **Policies** (not changed in this round) | One restaurant per trip (variety); evening places last; the accommodation day; strong place = relevance ≥ 7 | Unchanged. |

### 19.2 What was tested
**Measure:**
- Known travel is split into:
  - between visits (the route around a lunch break counts here);
  - to and from named restaurants.
- A lunch break has no point. Its food access is **unknown**, flagged, and never counted as 0.
- Every travel share below is on KNOWN travel; the number of unknown-food days is shown next to it.

**Travel rules:**
- **A:** +15 per day (8e8a309).
- **B / C:**
  - The A review runs first, unchanged. Then a second pass applies only to days that still have lost time: first visit 60+ min after 09:00, or one wait of 60+ min.
  - In that pass, added travel is allowed up to recovered minutes / k (B: k = 4, C: k = 3), at most 45 min, with a day total of at most 90 min.
  - **Then:** the trip's known travel share may not grow by more than 2 points. This check applies only when a day goes above +15.
  - B and C therefore never accept less than A.
- **Am:** A with the explicit meal check instead of the 10-point tolerance:
  - same meal categories;
  - no dietary tag lost, and no "may contain pork" added;
  - not served on another day;
  - walk at most +10 min;
  - no new 30-min wait.

**Areas by date (Ba / Ca):**
- The same request without dates is planned ONCE, as a candidate source (no recursion).
- The current dated plan stays a candidate.
- Every current place is kept, including timetabled and dated ones on an open date.
- Strong places that are missing (relevance ≥ 7) are added on an open date.
- At most 6 assignments, ranked on the clock. The best 2 are built and get stage 1.
- **Accepted only if:**
  - no problem;
  - on every date: no restaurant lunch lost, travel within 90 or not above that date's current travel, no new 60-min wait, visits within 380 min;
  - trip share at most +2 points;
  - trip idle at most +30.

**Bounds per plan:**
- A: 6 + 12 rebuilds.
- B / C: the same again for the second pass.
- Areas: 1 undated generation, 2 candidates × 7 rebuilds.

### 19.3 Results
- Each variant was run 3 times, each run in its own process. All 3 runs produced identical plans.
- **Fixed baseline:** "unreviewed", meaning the same lunch rules with no review at all.
- Every change below is shown against that baseline and against A.

**53-plan sample (159 days)**
| Variant | Idle (vs unreviewed) | Known travel (vs unreviewed) | Share (known) | Unknown-food days | Restaurant lunches | Places / visit min | Days changed vs A | Days > +15 vs A | Median / p90 / max ms |
|---|---|---|---|---|---|---|---|---|---|
| unreviewed | 13,713 | 7,912 | 18.57% | 58 | 101 | 689 / 34,690 | — | — | — |
| A (8e8a309) | 9,374 (−31.6%) | 8,161 (+3.1%) | 19.05% | 53 | 106 | 689 / 34,690 | — | — | 335 / 1,007 / 1,284 |
| Am | = A | = A | 19.05% | 53 | 106 | = A | 0 | 0 | 400 / 1,094 / 1,699 |
| B | = A | = A | 19.05% | 53 | 106 | = A | 0 | 0 | 464 / 1,340 / 1,766 |
| C | 9,291 (−32.2%) | 8,184 (+3.4%) | 19.09% | 53 | 106 | = A | 1 | 1 | 445 / 1,143 / 1,717 |
| Ba | = A | = A | 19.05% | 53 | 106 | = A | 0 | 0 | 965 / 2,258 / 3,213 |
| Ca | = C | = C | 19.09% | 53 | 106 | = A | 1 | 1 | 934 / 1,929 / 2,543 |

**108-plan launch sample (270 days)**
| Variant | Idle (vs unreviewed) | Known travel (vs unreviewed) | Share (known) | Unknown-food days | Restaurant lunches | Places / visit min | Days changed vs A | Days > +15 vs A | Median / p90 / max ms |
|---|---|---|---|---|---|---|---|---|---|
| unreviewed | 25,530 | 13,831 | 18.94% | 87 | 183 | 1,189 / 59,205 | — | — | — |
| A (8e8a309) | 15,441 (−39.5%) | 14,332 (+3.6%) | 19.49% | 83 | 187 | 1,189 / 59,205 | — | — | 213 / 934 / 1,278 |
| Am | = A | = A | 19.49% | 83 | 187 | = A | 0 | 0 | 250 / 1,038 / 1,550 |
| B | 15,193 (−40.5%) | 14,370 (+3.9%) | 19.53% | 83 | 187 | = A | 3 | 2 | 247 / 1,004 / 1,321 |
| C | 15,110 (−40.8%) | 14,393 (+4.1%) | 19.56% | 83 | 187 | = A | 4 | 3 | 248 / 1,122 / 2,187 |
| Ba | 14,906 (−41.6%) | 14,484 (+4.7%) | 19.54% | 83 | 187 | 1,196 / 59,655 | 13 | 6 | 405 / 1,344 / 2,556 |
| Ca | 14,823 (−41.9%) | 14,507 (+4.9%) | 19.56% | 83 | 187 | 1,196 / 59,655 | 14 | 7 | 401 / 1,265 / 2,506 |

- **Generation time:** the median per plan over 3 runs. Each run's own median moves by up to ±30% (A sample: 320–443 ms). Am builds exactly the same plans as A and still shows +20% on the sample, which is the noise level.
- **Validity:** the independent check finds 0 problems in every variant on both samples.
- **Daylight places after the monthly sunset estimate:** 0 everywhere.

**Every changed day, B and C (launch):**
| Trip, day | Unreviewed → A → X: idle | Known travel | Note |
|---|---|---|---|
| nature 4 days, Monday 19 Jul 2027 | 180 → 180 → 37 | 0 → 0 → 23 | St Stephen's moved from Sunday; food access unknown on both sides |
| nature 4 days, Sunday 18 Jul 2027 | 253 → 19 → 13 | 42 → 51 → 42 | the other day of that move |
| experiences 4 days (no dates), day 4 | 116 → 116 → 17 | 34 → 34 → 58 | Menza on both sides |
| shopping 4 days (no dates), day 1 (C only) | 192 → 192 → 109 | 33 → 33 → 56 | Hungarikum on both sides |

The sample's single C change is shopping 3 days (no dates), day 1: idle 192 → 109, known travel 33 → 56.

### 19.4 Each rejection condition on its own
"Blocked by one condition only" = a VALID alternative (no schedule problem) that this one threshold alone kept out. File: `docs/budapest/data/quality-r3/<sample|launch>/compare.json`, `blockedByOneConditionOnly`, with what each one would have changed.

| Condition (variant C) | Sample | Launch |
|---|---|---|
| Day gain below 30 | 52 | 73 |
| Travel above +15 (A pass) | 18 | 21 |
| Restaurant lunch lost | 6 | 12 |
| Trip travel share above +2 points | 6 | 2 |
| Travel above the B/C allowance | 4 | 2 |
| A changed day weaker (stage 2) | 4 | 2 |
| Meal not equivalent | 2 | 2 |
| Travel above +15 with no lost time | 1 | 0 |

**The trip share alone, alternatives worth knowing:**
- **Food 22–24 Nov, Sunday:** see 19.5.
- **Nature 17–19 Jul 2027 (3 days):** St Stephen's moved Sunday → Monday.
  - Monday idle 180 → 37, known travel 0 → 23. The food access is unknown on both sides.
  - Share 16.3% → 18.6%.
  - The same move IS accepted on the 4-day trip (above): the share is diluted there.
  - **The condition depends on trip length.**
- **Shopping 3 days (no dates):** the same day-1 order that C takes on the 4-day trip. Share 20.2% → 22.4%.
- **Experiences 22–24 Nov:** St Stephen's ↔ Parliament.
  - Sunday idle 188 → 121, known travel 57 → 79.
  - Monday 37 → 22, lunch 21 Restaurant → Hungarikum.
  - Share 18.1% → 20.2%.

### 19.5 Food 22–24 Nov, Sunday (valid alternative, kept out by the trip share)
- **Current (A):**
  - St Stephen's 13:00–14:15 (75 min) → lunch break 14:30–15:45 → Chain Bridge 16:15 (15) → Shoes 17:00 (10) → Parliament 17:30 (20) → Fisherman's 18:30 (40) → Matthias 19:30–19:45 (15) → dinner 21 Restaurant 20:15–21:45.
  - Idle 266 (morning 240). Known travel 44.
  - **Food access unknown.** Visits end 19:45, day ends 21:45.
- **Alternative (B and C accept it for the day; the trip share then rejects it):**
  - Fisherman's 09:00–09:40 (40) → Matthias 10:00–10:15 (15) → Shoes 11:00 (10) → Parliament 11:30 (20) → Chain Bridge 12:15–12:30 (15) → **Hungarikum 13:00–14:15** → St Stephen's 14:45–16:00 (75) → dinner Menza 18:00–19:30.
  - Idle 30. Known travel 64: 32 between visits, 32 restaurants.
  - Visits end 16:00, day ends 19:30.
- **Order vs restaurant (same order, built again with no lunch restaurant, the planner's own build):**
  - **The order alone:**
    - Idle 266 → 24.
    - Known travel 44 → 51: between visits 39 → 41, restaurants 5 → 10 (the dinner walk).
    - Food access unknown on both sides.
    - The trip's known travel would be 145 → 148, share 19.9% → 20.2%. **That passes every threshold.**
  - **The named restaurant then adds 6 idle and 13 known travel:**
    - That is the walk to and from Hungarikum, which a lunch break also has but cannot count.
    - It also moves the dinners: Sunday Menza, Tuesday New York Café.
    - That walk is what takes the trip share above +2.
  - The planner always names a restaurant when one fits, so the lunch-break version is not offered.
- **Trip:**
  - Idle 491 → 255.
  - Known travel 145 → 172 (+20 Sunday, +7 Tuesday dinner).
  - Share 19.9% → 22.7%.
- **The comparison is uneven on food:**
  - The current trip has 2 unknown-food days, the alternative 1.
  - Part of the share increase is restaurant walking that the current plan simply does not measure. This is not a reason to accept it, but it is not a clean comparison either.
- **Tuesday dinner:**
  - It changes from Hungarikum to New York Café: open Tuesday 12:00–23:00, same tags plus "dessert", category restaurant.
  - Walk 14 → 21 min (+7).
  - The explicit meal check accepts it (walk within +10).
  - It changes only because restaurants are unique per trip: Hungarikum becomes Sunday's lunch, while Menza and Frici Papa are taken.
- **Stage 2 alternative (St Stephen's to Monday):**
  - Sunday idle 266 → 25, Monday 146 → 24 with Hungarikum instead of a lunch break (food access becomes known on both days).
  - Monday known travel 51 → 83 (+32).
  - B: above its allowance (30). C: within it (40). Both are then stopped by the share, 19.9% → 23.6%.

### 19.6 Culture 22–24 Nov: restoring the Monday-closed museums
- **Dropped by the date of their area:**
  - Museum of Fine Arts and House of Music: closed Monday, open Sunday and Tuesday 10:00/10:15–18:00/17:50.
  - Vajdahunyad: open, relevance 5, so not a "strong" place and not restored.
- **Engine candidates (Ba / Ca):**
  - 6 assignments: 2 invalid (a day with 7 places and a day with 1), 2 not built (search limit: 2 built), 2 built.
  - **Both built candidates were rejected:**
    - the City Park date loses its restaurant lunch (no restaurant fits that area's lunch: lunch break);
    - trip idle 131 → 168.
  - **The current plan stays.**
- **Why 168 here and 64–70 in the earlier simulation (same three dates):**

  | | Places | Order of each day | Idle |
  |---|---|---|---|
  | Earlier simulation (planning, not engine) | 13: Vajdahunyad included (fills 09:00–10:00 before the museums open) | every order tried on the final schedule | 64–70 |
  | Engine candidate | 12 (strong places only) | one order per day from the clock estimate, then stage 1 (gain ≥ 30, +15). Tuesday starts with the Gallery at 10:00 (60 min morning) | 168 |
  | Swap experiment, areas only | 12 | every order tried | 62–90 |

  - The restaurants are the same in all three (the City Park day always has a lunch break).
  - The difference is the order search, plus Vajdahunyad.
- **Limited swap experiment** (`bud-r3-swap.mts`, script only, not in the engine):
  - **Search:**
    - every assignment of the undated areas to the dates that needs no move;
    - every single swap of one place between two days;
    - every order of the changed days on the final schedule.
  - **Size:** 66 candidates, 6,666 builds.
  - **Accepted: 0.** Each of the best candidates fails on ONE thing: the date that gets the City Park museums has a lunch break instead of the restaurant it has now.
  - **Best by idle:** Citadella ↔ Heroes' Square.

    | Day | Plan | Idle | Known travel | Lunch |
    |---|---|---|---|---|
    | Sunday | Chain Bridge, Gallery 10:00, Matthias, Fisherman's | 31 | 44 | 21 Restaurant |
    | Monday | Heroes', St Stephen's, Shoes, Parliament, Opera 15:00 | 18 | 67 | Hungarikum |
    | Tuesday | Citadella, House of Music 10:45, Fine Arts 14:45 | 13 | 47 | **lunch break**, food access unknown |

    - Trip idle 62, share 19.3%.
  - **The blocker is the meal, not the route or the hours.**
  - **This does not prove that no better distribution exists.** The engine built only 2 of 6 assignments. The experiment tried single swaps only, and skipped assignments that need a closed place moved.

### 19.7 Areas by date on the launch sample (Ba / Ca): 6 trips get places back, none in the 53-plan sample
| Trip | Restored | Trip idle | Trip share | Day changes worth noting |
|---|---|---|---|---|
| A 2 days, 19 Nov | Opera tour (Thu), Market Hall (Fri) | 136 → 88 | 22.5 → 21.7 | Friday idle 35 → 58; lunches swap between the days |
| A 2 days, 17 Jul 2027 | Market Hall (Sat) | 75 → 87 | 21.9 → 23.8 | Sunday idle 34 → 57 (**a weaker day**) |
| nature 1 day, 19 Nov | Margaret Island 09:00–10:30 | 76 → 32 | 23.4 → 21.7 | Known travel 64 → 83 |
| shopping 1 day, 19 Nov | Opera tour | 45 → 39 | 21.3 → 20.2 | Lunch Frici Papa → Menza |
| food 2 days, 19 Nov | Opera tour (Fri) | 135 → 46 | 25.0 → 23.1 | Thursday idle 100 → 16 |
| food 2 days, 17 Jul 2027 | Market Hall (Sat) | 221 → 109 | 22.2 → 22.5 | Saturday known travel 45 → 80 |

- **Flagged by the post-hoc check:**
  - The check applies the reorder rule (+15 without lost time; the allowance) to EVERY changed day. It flags 3 of these trips (A 2 days 19 Nov, nature 1 day 19 Nov, food 2 days 2027).
  - Those days have more places, so their travel grows with the added visit.
  - The areas criteria (day ≤ 90, share, trip idle) accepted them.
  - They stay listed: `compare.txt`, "acceptance failures".
- **Not acceptable by your rule "no day made weaker":** the two days whose idle rises by 23 min. The areas criteria checked the trip's idle, not each day's.

### 19.8 Recommendation (from the tables above)
- **Schedule validity:** every variant is valid (0 problems). The choice is about the improvement thresholds only.
- **B and C:**
  - **Gain:**
    - Launch idle −1.6% (B) / −2.1% (C) against A; 3 to 4 days changed out of 270.
    - The sample: 0 (B) / 1 (C) of 159 days.
  - **Cost:** generation time +16% (launch) to +35% (sample).
  - **Why so small:** the 2-point trip share decides, and it is length-dependent (the nature move is accepted on 4 days, rejected on 3). On days with a lunch break it compares a restaurant's measured walk with an unmeasured one.
  - C is the better of the two (more gain, no acceptance failure).
  - **Not recommended as the default in this form.**
  - The next measurement, if wanted, is a trip limit that does not depend on trip length: added known minutes per day, shown with the unknown-food days.
- **Am (explicit meal check):**
  - The same plans as A on both samples, at no measurable cost.
  - It replaces the arbitrary 10-point tolerance with the criteria you set.
  - **Recommended as the default whenever the next change is approved.** It changes no plan today.
- **Areas by date (Ba / Ca):**
  - 6 of 108 launch trips get a strong place back (+450 visit minutes), 0 of 53 in the sample.
  - The culture case stays blocked by the lunch rule.
  - Generation time is about 2× (median).
  - 2 trips make one day weaker.
  - **Not recommended as the default.** It would need a per-day "not weaker" check and a cheaper construction first.
- **Launch range:** not changed.

### 19.9 Checks on dfe4453
- **Validity and Budapest tests:**
  - Independent check: 0 problems for A, Am, B, C, Ba and Ca on both samples (Ba/Ca launch: 1,554 visits and meals, 1,284 transfers, 0 without data).
  - `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 / 0; `bud-action-save` 15 / 0.
  - Default (A) byte-identical to 8e8a309 on both samples.
- **Build:** tsc, eslint (changed files) and `next build --webpack` (fake values, `ALLPAY_MODE=disabled`) all pass.
- **Prague and Barcelona on dfe4453 (clean tree):** generation byte-identical to `925512d` (prg-focus 82, prg-oneday 31, bcn104, bcn378; prg-long plans identical, timings excluded); edits byte-identical (prg-focus, bcn104). `docs/budapest/data/quality-r3/tests/prague-barcelona-generation-and-edits-dfe4453.txt`.
- **Files:**
  - `docs/budapest/data/quality-r3/` holds the inputs, per-day metrics of every variant, summaries, timings over 3 runs, comparisons, examples and test outputs.
  - The package adds the full plans, the review logs (every decision with its reasons) and the swap experiment's candidates.

## 20. Day quality, round 4: City Park lunch, travel candidate B1 (2026-11-15, code commit c73ae93 on `feature/budapest`)

**Status:**
- B1 is a TEST-ONLY switch. The Budapest default stays rule A.
- The new restaurants are product data on the branch, so they change rule A's plans too (20.3).
- Budapest stays unavailable.

### 20.1 City Park lunch (data)
**Added**, both read on the official sites on 2026-11-15, with OSM points:

| Restaurant | Evidence of lunch and hours (official) | Planned hours | Address / OSM | Walk to Fine Arts / House of Music / Heroes' Sq. |
|---|---|---|---|---|
| Gundel | gundel.hu/en: "Lunch menu every day: 11:30-18:00", dinner every day 18:00-22:00, "Kitchen closing time every day: 21:00" | Every day 11:30–21:00 (meals end by the kitchen's close) | Gundel Károly út 4, 1146; OSM way/25227262 | 0.25 / 0.82 / 0.29 km |
| Városliget Café | varosligetcafe.hu: "Hétfőtől vasárnapig: 12:00 - 22:00"; menu (autumn / winter 2026) with soups and main courses | Every day 12:00–22:00 | Olof Palme sétány 5, 1146 (official; OSM node/3409063948 gives no. 6) | 0.36 / 0.39 / 0.40 km |

- **Not added: Robinson** (official site: lunch 12:00–16:00, dinner 18:00–23:00). The page names no days, and the booking page shows none either, so its days are not assumed.
- **Classification:** Városliget Café is a "restaurant" because of its published menu of main courses, not its name. A cafe category alone is never taken as a meal.
- **Dietary tags:** "meat" and "pork-maybe", the project's existing cautious tags (the menu has pork). They make no suitability claim.
- **Walks:** 126 new pairs from the same router (FOSSGIS OSRM foot). None of the 930 existing pairs would change; they keep their 2026-11-13 values.
- **New customer text:** the two Arabic "why" sentences are proposals awaiting the owner's review.

### 20.2 What changed in the review (test-only unless stated)
**Travel candidate B1:**
- The A review first, unchanged.
- **Then, only on days with lost time:** first visit 60+ min after 09:00, or one wait of 60+ min.
- **Allowance:** recovered minutes / 4, at most +45, day total at most 90.
- **Counted cumulatively against the day's fixed baseline** (the day as it entered the review), not against the last stage. Once a day is more than 15 above its baseline, the whole increase must fit.
- **The trip travel share:** no longer a reason to reject. It is reported, on known travel, next to the number of days whose food access is unknown.

**Explicit meal check (used by B1; not the default):**
- **What is checked:** category, no restaurant served twice, walk at most +10 min, no new 30-min wait, a restaurant lunch never turned into a lunch break.
- **No dietary judgement:** the request has no dietary preference, the previous restaurant's tags are not the customer's preference, and a missing warning tag proves nothing.
- **Added after the first run:** a day whose places did not change may gain at most 10 min of idle (20.4).

**Areas by date:** documented that permutations come in lexicographic order. For a 4-day trip the first 6 all keep the undated plan's first group on day 1, so the search is bounded and a rejection proves nothing. Not the default.

### 20.3 Results (3 runs each, one process per variant and run; plans identical across runs)
- **Fixed baseline:** "unreviewed", meaning the same lunch rules with no review, on the new data.
- **"A, old data"** = 8e8a309.
- **Share** = known travel / (visits + known travel).
- **Food unknown** = days whose lunch is a lunch break (no point, so the walk to food is unknown).

| 53-plan sample | Idle (vs unreviewed) | Known travel (vs unreviewed) | Share | Food unknown | Restaurant lunches | Median / p90 / max ms |
|---|---|---|---|---|---|---|
| Unreviewed (new data) | 13,676 | 7,937 | 18.62% | 36 | 123 | — |
| A, old data (8e8a309) | 9,374 | 8,161 | 19.05% | 53 | 106 | — |
| A, new data | 9,422 (−31.1%) | 8,166 (+2.9%) | 19.05% | 31 | 128 | 235 / 719 / 917 |
| **B1, new data** | **8,814 (−35.6%)** | **8,265 (+4.1%)** | **19.24%** | **30** | **129** | **245 / 736 / 953** |

| 108-plan launch sample | Idle (vs unreviewed) | Known travel (vs unreviewed) | Share | Food unknown | Restaurant lunches | Median / p90 / max ms |
|---|---|---|---|---|---|---|
| Unreviewed (new data) | 25,466 | 13,865 | 18.98% | 51 | 219 | — |
| A, old data (8e8a309) | 15,441 | 14,332 | 19.49% | 83 | 187 | — |
| A, new data | 15,472 (−39.2%) | 14,366 (+3.6%) | 19.53% | 47 | 223 | 148 / 675 / 914 |
| **B1, new data** | **15,075 (−40.8%)** | **14,418 (+4.0%)** | **19.58%** | **47** | **223** | **159 / 712 / 959** |

- **Generation time (B1 against A):** median +4% (sample) and +7% (launch), measured in the same session. Earlier rounds ran on a busier machine; compare times within one table only.
- **Validity:**
  - The independent check finds 0 problems for A and B1 on both samples.
  - Daylight places after the monthly sunset estimate: 0.
  - Visit minutes are the same in every variant.

### 20.4 Every case that got worse
**The new data (A old data → A new data):**
- 24 / 42 days changed. Most turn a lunch break into Városliget Café or Gundel.
- Known travel +1 on most of them: the walk is now counted, where the lunch break counted none.
- **Worse in substance:**
  - Culture (3 / 4 days and no dates), day 3:
    - Lunch break 13:00 → Városliget Café 13:15–14:30.
    - Idle 17 → 51 (+34), visits end 16:45 → 17:15.
    - Same on B-3d-2026-11-19, B-2027-01-11 and B-4d-2027-07-17.
  - Popular 3 days 2027-07-17, Monday: Gundel lunch, idle 80 → 41, known travel +14.
  - Experiences 4 days from 19 Nov, Sunday: idle 114 → 59, known travel +25 (Menza → Hungarikum after restaurants moved).
- Lists: `docs/budapest/data/quality-r4/<sample|launch>/diff-data.txt`.

**The rule (A → B1, same new data):**
- 8 days in 4 trips (sample), 5 days in 3 trips (launch). 0 acceptance failures.

| Day | Idle | Known travel (cumulative vs baseline) | Note |
|---|---|---|---|
| Food 22 Nov, Sunday | 266 → 30 | 44 → 64 (+20) | Lunch break → Hungarikum (food access now known) |
| Food 24 Nov, Tuesday (places unchanged) | 79 → 71 | 50 → 65 (+15) | Lunch Menza → Városliget Café, dinner Hungarikum → New York Café; each walk within +10 |
| Shopping 22 Nov, Sunday | 192 → 59 | 33 → 61 (+28) | Allowed: recovered 133 / 4 = 33 |
| Shopping 24 Nov, Tuesday | 37 → 37 | 73 → 73 | Visits end 17:15 → 18:15 (lunch 13:30 → 12:45) |
| Experiences 22 Nov, Sunday | 188 → 121 (baseline 301) | 44 → 79 (+35 cumulative) | Allowed: recovered 180 / 4 = 45 |
| Experiences 23 Nov, Monday | 37 → 22 | 73 → 73 | Lunch 21 Restaurant → Hungarikum |
| Nature 17–19 Jul 2027 (3 / 4 days), Monday | 180 → 37 | 0 → 23 | St Stephen's moved from Sunday; food access unknown on both sides |
| Experiences 4 days (no dates), day 4 | 118 → 19 | 32 → 56 (+24) | Gundel on both sides |

- **First run (kept in `first-run/`):**
  - Shopping 3 days (no dates), day 3: idle 37 → 58 (+21), the same in the 3- and 4-day trips.
  - Day 1's new order moved restaurants, and the timing guard rebuilt day 3, whose places did not change, with Citadella first.
  - The explicit meal check had no idle limit for such a day.
  - Fixed by the 10-min idle limit, then the run was repeated. That day no longer changes.
- **The "+23 idle" day of round 3 (Ba / Ca):**
  - It is ONE day, the same in Ba and Ca: A 2 days 17 Jul 2027, Sunday, 34 → 57.
  - The second day reported in round 3 (19 Nov, Friday, 35 → 58) was a reading error: the log's last candidate, not the chosen one. That day ends at 35 → 30.

### 20.5 The food plan, 22–24 Nov: before (8e8a309) and after (B1)
- **Before (A; the same on the new data):**

  | Day | Idle | Known travel | Plan |
  |---|---|---|---|
  | Sunday | 266 | 44, food access unknown | St Stephen's 13:00–14:15 (75 min) → lunch break 14:30 → Chain Bridge 16:15 (15) → Shoes 17:00 (10) → Parliament 17:30 (20) → Fisherman's 18:30 (40) → Matthias 19:30–19:45 (15) → dinner 21 Restaurant 20:15–21:45 |
  | Monday | 146 | 51, food access unknown | Váci 09:00 (45) → Market Hall 10:15 (60) → lunch break 12:30 → cruise 15:40–16:40 → dinner Frici Papa 18:00 |
  | Tuesday | 79 | 50 | Heroes' 09:00 (20) → House of Music 10:15–12:15 (120) → Menza 13:00 → Opera tour 15:00 (60) → Andrássy 16:30 (45) → dinner Hungarikum 18:00 |

  - Trip: idle 491, known travel 145, share 19.9% (2 unknown-food days).
- **After (B1):**

  | Day | Idle | Known travel | Plan |
  |---|---|---|---|
  | Sunday | 30 | 64 = 32 between visits + 32 restaurants | Fisherman's 09:00–09:40 → Matthias 10:00 → Shoes 11:00 → Parliament 11:30 → Chain Bridge 12:15 → Hungarikum 13:00–14:15 → St Stephen's 14:45–16:00 → dinner Menza 18:00. Visits end 16:00, day 19:30 |
  | Monday | 146 | 51 | Unchanged; the wait before the 15:40 cruise stays, because the places are the same |
  | Tuesday | 71 | 65 | Heroes' 09:00 → House of Music 10:15–12:15 → Városliget Café 12:45–14:00 → Opera tour 15:00 → Andrássy 16:30 → dinner New York Café 18:00 |

  - Trip: idle 247 (−244), known travel 180 (+35), share 23.5% (1 unknown-food day).
- **Order vs restaurant on Sunday (same order rebuilt with no lunch restaurant):** idle 24, known travel 51. The named restaurant adds 6 idle and 13 known travel, the walk to and from Hungarikum.

### 20.6 The culture plan, 22–24 Nov
- **Current plan, unchanged by A and B1 on either data set:**

  | Day | Plan | Idle |
  |---|---|---|
  | Sunday | Citadella 09:00 → Shoes → Parliament → Chain Bridge 11:45–12:00 → Hungarikum 12:30–13:45 | 15 |
  | Monday | Heroes' 09:00 → St Stephen's 10:15–11:30 → Menza 12:30 → Opera tour 15:00–16:00 | 97 |
  | Tuesday | Fisherman's 09:00 → Matthias 10:00 → National Gallery 10:45–12:45 → 21 Restaurant 13:30–14:45 | 19 |

  - Trip: 10 places, 420 visit min, idle 131, known travel 124, share 22.8%.
- **Engine, areas by date (Ba), with the new restaurants:**
  - The City Park date now gets a restaurant.
  - Both built candidates are still rejected: trip idle 131 → 167.
  - **The cause is the order:** one clock-estimate order per day, then stage 1.
  - Search: 6 assignments; 2 invalid (a day with 7 places, a day with 1); 2 not built (limit); 2 built.
- **Limited swap experiment (script only, `bud-r3-swap.mts`), every order tried, 66 candidates, 6,666 builds: 15 accepted.**
- **Best by idle (Citadella ↔ Heroes' Square), NOT adopted:**

  | Day | Plan | Idle | Known travel |
  |---|---|---|---|
  | Sunday | Chain Bridge 09:00 → National Gallery 10:00–12:00 → Matthias 12:30 → 21 Restaurant 13:15–14:30 → Fisherman's 15:00–15:40 | 31 | 44 |
  | Monday | Heroes' 09:00 → St Stephen's 10:15–11:30 → Shoes 12:00 → Parliament 12:30 → Hungarikum 13:15–14:30 → Opera tour 15:00–16:00 | 18 | 67 |
  | Tuesday | Citadella 09:00–09:45 → House of Music 10:45–12:45 → Városliget Café 13:15–14:30 → Museum of Fine Arts 15:00–17:00 | 27 | 48 |

  - Trip: 12 places (+ Fine Arts, + House of Music), 660 visit min, idle 76, share 19.4%, a restaurant lunch every day.
  - **Per date:**
    - Sunday idle 15 → 31 and Tuesday 19 → 27, each with more visits (90 → 190, 175 → 285 min).
    - Monday 97 → 18.
  - By your rule ("no day weaker") this would need a decision: those two dates have more idle AND more content.
- **The restoration is not extended in this round.** It is not the default. The rejections prove nothing about better distributions.

### 20.7 Recommendation (from the tables above)
- **Schedule validity:** A and B1 are both valid (0 problems). The choice is about improvement thresholds only.
- **B1:**
  - **Gain:** idle −6.5% (sample) and −2.6% (launch) against A; known travel +1.2% / +0.4%; time +4–7%.
  - **No silent accumulation:** every day above +15 is within its allowance against the fixed baseline.
  - **Clearest case:** the food Sunday (266 → 30).
  - **Recommended as the next default candidate**, together with the explicit meal check including the 10-min idle limit for days whose places did not change. Switching the default is the owner's decision; nothing is switched here.
- **Data (Gundel, Városliget Café):** valid, with the evidence above. Before publishing, the owner reviews the two Arabic texts and the culture day-3 trade-off: a known restaurant lunch at +34 idle on that day.
- **Areas by date:** not recommended in this round. The engine's construction loses to ordering; the script finds valid plans, but each makes two dates longer.
- **Launch range:** not changed.

### 20.8 Checks on c73ae93
- **Validity and Budapest tests:**
  - Independent check: 0 problems for A and B1 on both samples (launch: 534 visits and meals checked against hours, 1,277 transfers, 0 without data).
  - `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 / 0; `bud-action-save` 15 / 0.
- **Build:** tsc, eslint (changed files) and `next build --webpack` all pass.
- **Prague and Barcelona on c73ae93 (clean tree):** generation byte-identical to `925512d` (prg-focus 82, prg-oneday 31, bcn104, bcn378; prg-long plans identical, timings excluded); edits byte-identical (prg-focus, bcn104). `docs/budapest/data/quality-r4/tests/prague-barcelona-generation-and-edits-c73ae93.txt`.

## 21. Day quality, round 5: B1 as the Budapest default, finalised (2026-11-15; code e248511, 4ba9904, 19c33e0 on `feature/budapest`)

**Status:**
- Owner decision: B1 with the explicit meal check is the Budapest default on the branch.
- Areas by date stays a test-only switch.
- No push, merge or publish. Budapest stays unavailable.

### 21.1 What changed
- **Default = B1 + explicit meals** (`BUDAPEST_QUALITY_DEFAULTS`).
  - **Pass 1:** rule A, counted against the same fixed baseline (A1). Two stages can no longer add +15 each.
  - **Days whose places did not change:** held to +15 against that baseline.
  - **Pass 2 (only days with lost time):** the allowance (recovered / 4, at most +45, day total at most 90), cumulative against the baseline.
  - **The 90-min ceiling is a condition of that exceptional increase only.** Many days are longer without using it: 6 of 159 and 12 of 270 days exceed 90 min of known travel, all of them before any review.
  - **Meals:** no dietary judgement, because the request has no dietary preference.
- **Gundel:**
  - **Shown to the customer:** the restaurant's hours, every day 11:30–22:00. The source text names the 21:00 kitchen close.
  - **Planning:** meals end by 21:00 through `planningSchedule`, the same pattern as Prague's Mlýnec. It is never shown as a closing time; checked in the UI ("ساعات يوم السبت: 11:30–22:00").
- **Approved texts:**
  - **Gundel:** «مطعم للمأكولات الهنغارية قرب حديقة الحيوانات في حديقة المدينة، يقدّم قائمة غداء يومية.»
  - **Városliget Café:** «مطعم ومقهى قرب البحيرة وقلعة فاجداهونياد في حديقة المدينة، يقدّم شوربات وأطباقًا رئيسية.»
- **Accepted as is (not a general rule):** the culture day-3 lunch (idle 17 → 51 for a named restaurant).
- **Areas by date (separate commit 4ba9904, still a switch):** a bounded single-swap search on the clock (21.4).

### 21.2 Proof that the allowance is cumulative (`bud-travel-proof.mjs`, final results)
| Sample | Days | Increase vs fixed baseline ≤15 / 16–30 / 31–45 / >45 | Days above +15 | Violations | Days > 90 min travel (none from the allowance) |
|---|---|---|---|---|---|
| 53 plans | 159 | 154 / 4 / 1 / 0 | 5 | 0 | 6 |
| 108 plans | 270 | 267 / 3 / 0 / 0 | 3 | 0 | 12 |

Every day above +15 had lost time in its baseline, fits recovered / 4 (at most 45), and stays at most 90:
- culture 22 Nov, Sunday: +26;
- nature 19 Jul 2027, Monday: +23;
- shopping 22 Nov, Sunday: +28;
- experiences 22 Nov, Sunday: +35;
- food 22 Nov, Sunday: +20;
- launch: nature 3 / 4 days, Monday +23; experiences 4 days, day 4: +24.

### 21.3 Results (3 runs each, one process per variant and run; identical plans across runs)
| | Unreviewed | A (8e8a309 rules) | **B1 (default)** | B1 + areas (switch) |
|---|---|---|---|---|
| 53 plans: idle / known travel | 13,676 / 7,937 | 9,422 / 8,166 | **8,814 / 8,265** | 8,496 / 8,298 (+5 places, +525 visit min) |
| 108 plans: idle / known travel | 25,466 / 13,865 | 15,472 / 14,366 | **15,136 / 14,402** | 14,818 / 14,474 (+5 places, +480 visit min) |
| Median / p90 / max ms (53) | — | 269 / 744 / 960 | **246 / 755 / 979** | 744 / 1,648 / 3,018 |
| Median / p90 / max ms (108) | — | 161 / 707 / 978 | **168 / 741 / 984** | 283 / 1,245 / 3,103 |

- **Validity:** the independent check finds 0 problems for A, B1 and B1a on both samples.
- **Rule A:** exactly the plans of round 4. The new display hours of Gundel change no plan.

**Every worse day, B1 against A:**
- 6 days in the 53 sample, 5 in the 108 sample.
- Known travel up with a large idle recovery (food, shopping, experiences and culture Sundays, nature Monday, experiences day 4).
- Shopping Tuesday: different content (21.5).
- **New against round 4 (the cumulative first pass):**
  - experiences 4 days from 19 Nov, Sunday: idle 59 (A) → 114.
  - A reaches 59 in two stages of +15, a cumulative +25 in travel. B1 refuses it: the recovered 55 min allow 13. This is the rule working as intended, not an accident.
  - The Saturday of that trip: idle +6, travel +9, from the moved meals.
- Lists: `quality-r5/<sample|launch>/diff-rule.txt`.

### 21.4 Culture 22–24 Nov: the bounded search (switch `datedAreas`, not the default)
**The search:**
- The best 2 area assignments on the clock also get every single swap of one place between two days (both open on their new date, no evening place, at most 150).
- Every variant is ranked on the CLOCK only (each day's best order, memoized, no build). The 3 best are built and get stage 1.
- The accepted candidate with the least idle + known travel wins.
- No place names or request inputs in code.
- **Cost on this trip:** 64 swaps, 63 candidates on the clock, 3 built.

| | Sunday | Monday | Tuesday | Trip |
|---|---|---|---|---|
| **Current (B1 default, from the UI)** | Citadella 09:00 → Shoes → Parliament → Chain Bridge → Hungarikum 12:30 | Heroes' 09:00 → St Stephen's 10:15 → Menza 12:30 → Opera 15:00 | Fisherman's → Matthias → Gallery 10:45–12:45 → 21 Restaurant 13:30 | 10 places, idle 131, travel 124 |
| **Search result** | Fisherman's 09:00 → Matthias → Gallery 10:45–12:45 → 21 Restaurant 13:30 → Citadella 15:30 | Parliament 09:00 → Chain Bridge → St Stephen's 10:30 → Shoes → Menza 13:15 → Opera 15:00 | Heroes' 09:00 → Fine Arts 10:00–12:00 → Városliget Café 12:30 → House of Music 14:15–16:15 | 12 places, idle 94, travel 131 |
| Owner's preferred (swap experiment) | City Park museums | Centre + Chain Bridge | Castle + Citadella | 12 places, idle 89, travel 136 |

- The search finds the owner's grouping in mirror (Castle on Sunday, City Park on Tuesday). The two are tied on idle + travel (225 each); both were accepted.
- **Areas on the samples:** places restored in 7 trips (53) and 9 trips (108).
- **Cost:** median ×3.0 (53) and ×1.7 (108); slowest about 3.1 s. The swap limit was reached in 2 of 41 searches (16 in the 53 sample, 25 in the 108).
- **Flagged restored days:** known travel +26 to +48 on a day that gained places (B 17 Jul 2027, experiences 19–20 Nov), and days with more idle and more visits. They are listed in `compare-areas.txt` / `diff-areas.txt`.
- **Not recommended as the default yet**, because of the cost and those days. A rejection still proves nothing about better plans.

### 21.5 Shopping 22–24 Nov, Tuesday (corrected)
**What happened under B1:** stage 2 moved St Stephen's from Sunday to Tuesday in exchange for the Chain Bridge, and reordered Sunday. It is not the same day an hour later.

| | Sunday | Monday | Tuesday | Trip |
|---|---|---|---|---|
| **A** | Parliament 09:00 → Shoes → Hungarikum 12:30 → St Stephen's 14:15 → Opera 16:30 → Andrássy to 18:45 | Market Hall → Váci → Gozsdu → New York Café → Arena → cruise 17:20 | Fisherman's → Matthias → Gallery → 21 Restaurant 13:30 → Chain Bridge 15:30 → Citadella 16:30–17:15 | Idle 257, travel 203 |
| **B1** | Andrássy 09:00 → Parliament → Chain Bridge → Shoes → Hungarikum 12:45 → Opera 15:00–16:00 | Same | St Stephen's 09:00–10:15 → Fisherman's → Matthias → 21 Restaurant 12:45 → Gallery 14:45–16:45 → Citadella 17:30–18:15 | Idle 124, travel 231 |

**Citadella in the evening is NOT intended:**
- The place's own data says «أفضل وقت: قبل الغروب» (before sunset).
- The November sunset estimate is 16:15, so Citadella ends after dark in A (17:15) and in B1 (18:15).
- The daylight check covers only three listed places and does not read the "best time" field.
- **A decision for the owner:** let places marked "before sunset" join the daylight check. That is a new rule, not applied in this round.

### 21.6 UI check (local only)
**Setup:** `next dev --webpack` with fake values, `ALLPAY_MODE=disabled`, the in-memory Supabase test double (`review/mock-bud.mjs`), and a test session.

**Food 22–24 Nov:**
- **Create:** questionnaire → plan generated and saved (the double recorded `begin_owner_plan_generation`, the insert, `end_owner_plan_generation`).
- **Days in the UI:** match the measured plan.
  - Sunday: Fisherman's 09:00 … Hungarikum 13:00 … St Stephen's 14:45, dinner Menza.
  - Tuesday: Városliget Café 12:45, dinner New York Café.
- **Edit day 3:**
  - Removed Andrássy and added Vajdahunyad; each saved through `replace_owned_plan_content` (2 calls).
  - **Reopened:** the edits stayed.
- **English:** the interface switches (headings, buttons, times). Budapest's own texts stay in Arabic: day titles, notes, a food category label, suggestion reasons.

**Other plans:**
- **Culture 22–24 Nov and shopping 22–24 Nov:** created from the UI; the days match the measured plans (shopping Tuesday ends with Citadella 17:30–18:15).
- **Culture 17–19 Jul 2027:** Gundel lunch 12:30; its details show «ساعات يوم السبت: 11:30–22:00» and the approved text.

**Observed, not fixed:**
- **Daylight when adding:** an added Vajdahunyad (a daylight place) was placed 16:45–17:05 in November, after the sunset estimate. The add path does not check daylight.
- **The leg after an added place:** Opera → Vajdahunyad showed "walk 39 min" in edit mode and "transit ≈ 28 min" after reopening.

**Limits:**
- Emulated desktop viewport in the built-in browser; not real Safari or a phone.
- Real Supabase / Vercel Preview not exercised.

### 21.7 Range supported by the results (108-plan table, B1; a measurement, not a launch decision)
- **1–4 days meet all thresholds:** A, C, shopping, experiences, food, surprise.
- **1–3 days:** culture (4 days: thin days), popular (4 days: 58% strong match).
- **1 day only:** nature alone (2–4 days: few places, thin days, weak match).

### 21.8 What still blocks a launch
1. Budapest English (and Hebrew) content: day titles, notes, category labels, suggestion reasons.
2. Daylight:
   - places marked "before sunset" (Citadella) can end after dark;
   - adding a daylight place does not check daylight.
3. The leg-mode difference between edit mode and the reopened plan.
4. Texts awaiting review:
   - the Hebrew gallery card text;
   - month names in Budapest data (كانون/تشرين vs the site's).
5. The policy for hours of places added to saved plans (stored hours vs current data), not decided.
6. Launch range per interest: owner decision (21.7).
7. Not yet run: a Vercel Preview with a test Supabase, real phones.

### 21.9 Checks
- **On 19c33e0:**
  - Independent check: 0 problems for A, B1 and B1a on both samples.
  - `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 / 0 (including start-time edits); `bud-action-save` 15 / 0.
  - tsc, eslint and `next build --webpack` pass.
- **Prague and Barcelona, generation and edits:** byte-identical to `925512d` (`quality-r5/tests/prague-barcelona-generation-and-edits-19c33e0.txt`).

## 22. Two fixes on top of B1 (2026-11-15; df53b31 transport, 943b6df daylight)

B1 stays the fixed point. Areas by date stays off, and no threshold of the review changed.

**A "0 problems" schedule is not "0 quality or data problems":** the independent check only proves the schedule against hours, lengths and transfers. The open quality and data items are listed in 22.4.

### 22.1 Fix 1: one transport decision for the schedule, the connector and its links (df53b31)
**Reproduced** (old = 4ba9904, phone viewport, food 22–24 Nov, day 3: remove Andrássy, add Vajdahunyad).

| Path | Connector after the Opera | Sheet | Schedule |
|---|---|---|---|
| Old, in edit mode | «🚶 ≈ 39 دقيقة · 2.8 كم» | walking selected; Google / Apple walking; OSM walking route | Opera 15:00–16:00 → Vajdahunyad 16:45 (computed with transit 28 + 15 margin) |
| Old, reopened | «🚇 ≈ 28 دقيقة» | transit | same |
| New: edit, saved, reopened, start 10:00 | «🚇 ≈ 28 دقيقة» in every state | transit selected; Google `travelmode=transit`, Apple `dirflg=r`, between the leg's own points; no OSM walking route | same; with the 10:00 start the tour moves to 16:30 |

**Causes:**
1. **Display only, not the schedule.** The connector kept the previous leg's chosen mode at the same position (`useState` at mount); the schedule was right.
2. **The walking route offered with transit.** Every Budapest leg carries the OSM foot route of its walking distance, including the 77 + 52 transit legs on the 53 sample (stop-to-stop + meal legs = the reviewer's 129; 212 on the 108). The sheet offered it with any mode. All of them reach the UI, in the connector sheet.
3. **Links built from text addresses or a fallback.**
   - The shared summary keeps coordinates for attractions only, so restaurant / shopping / experience links used text addresses ("Andrássy út, 1061", "Váci utca, 1052" are whole streets).
   - The link after a lunch break (no point) became «استراحة غدا بالمنطقة, Barcelona, Spain».

**Changes:**
- The connector resets to the new leg's recommended mode (the schedule's mode).
- The OSM route is offered only with walking.
- Budapest legs carry `fromPoint` / `toPoint` (the points they were computed between), used by the Google / Apple links.
- After a lunch break the links start at the place before it, where the server computes that leg.
- Estimated times keep «≈» and their notes («تقدير حسب المسافة، مش من تطبيق خرائط»); only checked legs name a Google check.

**Effect:**
- No schedule changed (53 and 108 samples: 0 days).
- Budapest plan data gains the two points per leg.
- Prague / Barcelona: shared UI fixes only.

**Test:** `bud-transport-links.mts` renders the real sheet for every leg of the samples:
- new: 2,304 legs, 0 failures;
- old: 1,617 failures.

### 22.2 Fix 2: daylight policy (943b6df)
**Classification** (`budapestDaylight.ts`, by hand with evidence; nothing read from descriptive text at run time):

| Class | Places | Evidence | Planning decision |
|---|---|---|---|
| needs | Budapest Zoo | official hours close 16:00–19:00 by season (December 16:00 is 5 min after the 15:55 estimate, 23.2) | held by its own hours; the test reports closing vs the estimate every month |
| prefers | Citadella | place data «قبل الغروب»; park open to 22:00 / 24:00 | soft: avoided after the estimate when creating; note; best add position |
| prefers | Vajdahunyad (outside) | no official source on night lighting; data «أي وقت» | same, as a cautious soft preference |
| prefers | Margaret Island | park walk, open at all hours | same |
| evening | bridges, Parliament / Matthias exteriors, Heroes' Square, Shoes, Fisherman's Bastion, Andrássy, Váci, Gozsdu | data «أي وقت» or no daylight-only content | no rule |

- **The time:** the MONTHLY sunset estimate (one rounded time per month), always named an estimate; its error for a date is not measured (the earlier "about ±20 min" is withdrawn, 23.2). Proposed note at the time: «⏳ الأفضل قبل الغروب. الغروب بهالشهر تقريبًا 16:15 (تقدير شهري، مش الوقت الدقيق لتاريخك).» Replaced by the approved text (23.2).
- **Same rule in every path:**
  - **Creation:** the quality cost counts minutes after the estimate for "needs" / "prefers" places. Citadella was added; nothing was removed from the list.
  - **Edit and new start:** the note appears or disappears with the schedule.
  - **Adding such a place:** the position that ends before the estimate, if the day holds it with no schedule problem and no visit already in the day starting more than 30 min later. Otherwise the end of the day, with the note. Never refused for daylight.

**Shopping 22–24 Nov (Citadella), creation:**
- **Before:** St Stephen's had moved to Tuesday (swap with the Chain Bridge); Citadella 17:30–18:15, after the 16:15 estimate, no note.
- **After:** the swap is no longer chosen, because Citadella after dark now counts.
  - Tuesday: Fisherman's → Matthias → Gallery → 21 Restaurant 13:30 → **Citadella 15:30–16:15** → Chain Bridge 17:00. Known travel +7.
  - Sunday: St Stephen's comes back (16:30–17:45), idle 59 → 119.
  - This is the only trip whose schedule changed (3 days); the 108 sample has 0 changes.

**Vajdahunyad added (food 22–24 Nov, day 3):**
- **Before:** appended at the end, 16:45–17:05, no note.
- **After:** the same position, now with the note. Every earlier position pushes the 15:00 Opera tour to 16:30 (+90), so the end is kept.
- **With the 10:00 start:** 18:15–18:35 with the note.
- **Saved plans:** the customer's saved order is never moved; only the note appears.

**Remaining after-dark case on the samples:** experiences 24 Dec, Citadella 17:15–18:00 (no position before the 15:55 estimate), shown with the note.

**Test:** `bud-daylight.mts`:
- new: 0 failures;
- old: 5 failures (2 Citadella stops after dark with no note; the add placed after dark although a position existed; the 10:00 start with no note).

### 22.3 Checks on 943b6df
- **Validity:** the independent check finds 0 problems (159 + 270 days, 1,277 transfers with data).
- **Cumulative-allowance proof:** 0 violations.
- **Tests:** link test 0 / 2,304; daylight test 0 failures; `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 / 0; `bud-action-save` 15 / 0.
- **Build:** tsc, eslint and `next build --webpack` pass.
- **UI, phone viewport 375×812 (emulated, not a real phone):**
  - create, edit (remove / add), save, reopen, start change;
  - connector, sheet links and schedule agree in every state;
  - the daylight note appears as expected.
- **Prague / Barcelona on 943b6df (clean tree):** generation and edits byte-identical to 925512d (`quality-r6/tests/prague-barcelona-generation-and-edits-943b6df.txt`).

### 22.4 Everything that still blocks a launch (full list)
1. **Photos and their rights:** 0 of 42 Budapest places have a photo, and the photo-credits page has no Budapest entry. Photos have to be chosen with a documented licence before launch.
2. **Translations:**
   - Budapest content shows in Arabic in the English view: day titles, notes, a food category label, suggestion reasons.
   - Hebrew content is not written.
   - The Hebrew gallery card text is not approved.
   - Month names in the Budapest data (كانون / تشرين) differ from the site's (نوفمبر …).
3. **Texts awaiting review:** the daylight note (22.2).
4. **Saved plans:**
   - The hours of a place a customer adds are recomputed from current data on every open (not stored with the edit); policy not decided.
   - Compact stored hours are deferred (plan size).
   - Plans saved before a rule change keep the stored base plan and its notes until a day is edited.
   - After an edit the day title can still name a removed place (seen: «حديقة المدينة وAndrássy والأوبرا»); the mixed Arabic / Latin title renders «Andrássyو».
5. **Daylight:**
   - Vajdahunyad's class rests on caution, not a source (no official night-lighting information).
   - The sunset is a monthly estimate, not per date.
6. **Transport:**
   - Most transit times are distance estimates (only some legs are checked in Google Maps, in one direction, for one departure).
   - Budapest summaries still carry text addresses (links now use the legs' points).
7. **Range per interest:** an owner decision after the translations and the Preview test. The table supports 1–4 days for A, C, shopping, experiences, food, surprise; 1–3 culture and popular; 1 day nature alone. The questionnaire is unchanged.
8. **Not yet run:**
   - a Vercel Preview with a test Supabase (real auth, real saves, real RLS);
   - real phones and Safari;
   - Budapest stays `available: false`.

## 23. Round 7: corrections, then content (2026-11-15; `feature/budapest`)

B1 stays the fixed point, areas by date stays off, and no threshold changed. No push, merge or publish; Budapest stays `available: false`.

### 23.1 Fixed sessions kept when an add is placed earlier (c6e4867)
**The gap:** the daylight add rule accepted an earlier position when no visit already in the day started more than 30 min later. A tour or admission slot can be 30 min away or less, so the limit alone let an add move a fixed session.

**Found by a search of 523 adds on 943b6df** (10 interests × 10 start dates × 2–4 days; every "prefers daylight" place offered on every day; `docs/budapest/tools/bud-fixed-session-search.mts`): 12 adds moved a fixed session.
- House of Music 14:45 → 15:15 (its next admission slot, +30), nightlife 4-day trips from 19 Nov – 6 Dec, day 3, adding Vajdahunyad before it.
- The Legenda cruise 17:40 → 18:00 (its next departure, +20), October 1–4 day trips, day 1, adding Margaret Island or Vajdahunyad before it.

**Rule now:** an earlier position also needs every visit held to a fixed session to keep exactly its start. Fixed session = a tour or admission slot (metadata `showWindow`: Opera tour, House of Music) or a timetabled departure (hours `startsAtOpening`: the cruise). The general 30-min limit stays as well. Only cities with a daylight policy use this path (Budapest), so the add policy of the other cities is unchanged.

**Effect on the cases:** the place goes to the end of the day, with the daylight note.
- House of Music keeps 14:45; Vajdahunyad 17:15–17:35.
- The cruise keeps 17:40; Margaret Island 19:30–21:00 or Vajdahunyad 19:30–19:50, after the evening cruise. This is the add-at-the-end behaviour that existed before the daylight rule; it is reported, not changed.
- The Opera case (food 22–24 Nov, day 3) is unchanged: Vajdahunyad at the end 16:45–17:05 with the note, the tour at 15:00.

**Test** (`bud-daylight.mts`, part 5 plus the Opera assertions): new 0 failures; 943b6df 4 failures (the 4 cases above).

### 23.2 The sunset note: approved text, no ±20 claim (ad57678)
- **Text (owner, 2026-11-15):** «الأفضل تزوره بضوّ النهار. الغروب حوالي {time} حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.»
- **The ±20 min claim is removed** from the code comments and from section 22: there is no measurement of the estimate's error for a given date. No astronomical calculation was added.
- **The Zoo ("needs") check** no longer passes within a +20 margin. It reports the official closing time next to the month's estimate: at or before it in 11 months; December closes 16:00, 5 min after the 15:55 estimate. The Zoo is held by its official hours only, as before. This is a reported fact, not a new rule.
- Classes and the measured list are unchanged.

### 23.3 Shopping 22–24 Nov: the full effect of the daylight rule (943b6df)
Before = B1 with the transport fix (round 5 sample, run 1); after = 943b6df. Same definitions as `finalDayQuality`: a wait is the gap minus the known transfer minus 15; travel counts known transfers, meals included. Script and output: `quality-r7/shopping-compare.mjs`, `shopping-compare.txt`.

| Day | Before | After |
|---|---|---|
| Sunday 22 | Andrássy 09:00 → Parliament (outside) 10:30 → Chain Bridge 11:15 → Shoes 12:00–12:10 → lunch Hungarikum 12:45–14:00 → Opera tour 15:00–16:00. **Idle 59, travel 61, longest wait 30** (lunch → Opera) | Parliament (outside) 09:00 → Shoes 09:45 → Andrássy 10:45–11:30 → lunch Menza 12:30–13:45 → Opera tour 15:00–16:00 → St Stephen's 16:30–17:45. **Idle 119, travel 46, longest wait 54** (lunch → Opera) |
| Monday 23 | Market Hall 09:00 → Váci 10:30 → Gozsdu 11:45 → lunch New York Café 12:45–14:00 → Arena 14:45–16:15 → cruise 17:20–18:20. **Idle 28, travel 97, longest wait 17** | Same visits; lunch Frici Papa 12:45–14:00 (restaurants are not repeated in a trip, and Menza moved to Sunday). **Idle 30, travel 95, longest wait 17** |
| Tuesday 24 | St Stephen's 09:00–10:15 → Fisherman's 11:00 → Matthias 12:00 → lunch 21 Restaurant 12:45–14:00 → Gallery 14:45–16:45 → Citadella 17:30–18:15 (after the 16:15 estimate). **Idle 37, travel 73, longest wait 14** | Fisherman's 09:00 → Matthias 10:00 → Gallery 10:45–12:45 → lunch 21 Restaurant 13:30–14:45 → Citadella 15:30–16:15 → Chain Bridge 17:00–17:15. **Idle 30, travel 80, longest wait 14** |
| **Trip** | **Idle 124, travel 231** | **Idle 179, travel 221** |

**What it is and is not:**
- Citadella now ends at the estimate instead of 2 hours after it.
- The price: the trip has 55 more idle minutes, and Sunday's longest wait grows from 30 to 54 min.
- Known travel is 10 min lower.
- **Not an overall improvement:** it trades idle time for daylight at one viewpoint.
- No new search for orders was run.
- Section 22.2 said "Sunday idle 59 → 119" and "this trip changed 3 days". Both are right, but the Monday lunch change and the trip totals were missing; they are added here.

### 23.4 Day title and summary describe the places the day has now (0bf0c5b)
**Before:**
- The title and summary were written once, when the plan was made.
- An edited day kept them, so a removed place stayed named (seen: «حديقة المدينة وAndrássy والأوبرا» after removing Andrássy).
- Two more findings:
  - **Generated titles also named absent places:** an area label is built from places («البرلمان والكاتدرائية», «Andrássy والأوبرا»), but the day only had to visit the area. A day with only the Chain Bridge and the Shoes was titled «… والبرلمان والكاتدرائية».
  - **«و» glued to a Latin name** rendered against its last letter in RTL («Andrássyو»).

**Now:**
- **One function** (`budapestDayText`) builds the title and summary for the places a day has. Creation uses it, and so does every day whose places or order the customer changed, through the opt-in hook `editedDayText`.
- **Recomputed from the stored edits on every open**, so save and reopen give the same text.
- **A repeated title** still gets the first stop, as at creation.
- **Place-named area labels** name only what the day has. New labels are flagged for the owner's review in `texts-review.md`:
  - «البرلمان», «الكاتدرائية», or «ضفة الدانوب» when neither;
  - «الأوبرا», «شارع Andrássy».
- **«و» before a Latin name** gets a space: «حديقة المدينة و Andrássy والأوبرا», «… و Gozsdu Udvar.».
- **User-written titles:** the product has no such feature (no title field in the stored edits), so there was nothing to preserve.
- **Prague and Barcelona** do not set the hook: unchanged.

**Effect:**
- **Generation:** 75 of 159 sample titles and 158 summaries change (the summaries only by the space); schedules identical.

**Test** (`bud-day-text.mts`):
- Every day of the samples: removing each stop, adding the first candidate, and a save and reopen through JSON.
- New code: 0 failures on 159 days, 688 removals and 139 adds.
- 7341d67: 2,111 failures.

### 23.5 Translations (57387a5)
- **Coverage:** every Budapest text a plan can show is now in English and Hebrew:
  - 102 place texts (descriptions, reasons, tips, durations, prices, hours, booking labels, shopping, food);
  - 14 planner phrases (transfer notes, warnings, suggestion reasons, tour-slot notes);
  - templates for the day titles, the daylight note, the checked-transit note (weekday, date, time) and the capacity message.
  - File: `app/lib/i18n/budapestCatalog.ts`.
- **Review status:**
  - **Not reviewed by a person:** all English and Hebrew were written by Claude. Every row is listed in `docs/budapest/texts-review.md` (Arabic, English, Hebrew) for a native review. Nothing is described as reviewed.
  - **National Gallery:** the owner approved its Arabic hours and tip (2026-11-14). Their English and Hebrew were checked against it: every date, time and number is the same. They moved from `planCatalog.ts` to the Budapest file unchanged, and still need a native reader.
- **No other city can change:**
  - Budapest entries are added only where the Arabic is not already a catalog source.
  - The Budapest templates run after all other templates.
  - Summaries accept «و » with a space.
  - Prague / Barcelona translation in en and he is identical to 925512d (23.8).
- **Month names:** the Budapest data used «كانون / تشرين / شباط …». They are now the site's «يناير … ديسمبر» (32 words on 10 lines). A line-by-line check shows no number or time changed.
- **Facts:** no fact, time or price differs between the languages. The test also checks that the translated plan has the same data (structure, ids, numbers, times, links).
- **Test** (`bud-i18n.mts`):
  - All 156 Arabic data texts.
  - The 53 + 108 sample plans and their edited versions: remove, drag, every add candidate, new start. 2,221 plans, en and he.
  - New code: 0 untranslated, 0 data differences.
  - 0bf0c5b: 382 failures (174 texts).
- **Limit:** a saved plan whose stored Arabic differs from today's (an older wording) is shown as stored and logged, never guessed. That is the rule of every city. Budapest has no customer plans.

### 23.6 Photos and their rights (cdcc399)
- **The rule (same as Prague):**
  - Wikimedia Commons files whose file page gives a free license allowing commercial use (public domain, "Attribution", CC BY, CC BY-SA) and a named author.
  - A photo on an official site is never taken as permission.
  - No similar landmark, no generated image.
- **Coverage:** 28 of the 33 places a plan can show (the 9 area entries have no photo in any city).
  - Each was matched through the place's Wikidata item near its own point, or a Commons file named after the place and its address, and looked at.
  - Rejected after looking:
    - the Wikidata photo of Andrássy (1896);
    - a far view of the Arena with its old name;
    - the pre-redevelopment Citadella photo (the 2026 photo is used);
    - the only Menza file (a coffee cup);
    - the only Frici Papa file (the menu cover).
- **Missing, recorded instead of a substitute:**
  - the Legenda cruise and Hungarikum: no Commons file found;
  - Menza and Frici Papa: no file showing the place;
  - Városliget Café: the building could not be confirmed.
- **Record:** `docs/budapest/photo-rights.md` — source link, author as credited, license and its link, terms, and how it was matched, per photo. Special credits:
  - Heroes' Square: the credit its file page asks for;
  - Parliament: a derivative, both names;
  - Váci utca: the uploader's own work, empty Artist field.
- **Credits on the site:**
  - The plan cards show no credit next to the photo. The credits are on `/photo-credits`, linked from the footer (the same arrangement as Prague).
  - Budapest is listed there only while the city can be chosen (public, or the local / Preview switch), so an unreleased city is not shown.
  - Plans saved before the photos get them for display, as Prague's do (`planPhotos.ts`).
- **Files:** `public/images-budapest`, 6.4 MB (Commons' own 960px thumbnails, not edited).
- **Test:** `bud-photos.mts`.

### 23.7 Saved plans: current behaviour (documented, not changed; to decide before the Preview)
- **Stored:** the generated plan (`base`, with every place's details and hours as of the day it was made) plus the customer's edits per day (order, durations, start). Nothing else.
- **On every open:**
  - **Unedited days:** shown as stored (stored timeline, notes, title, summary).
  - **Edited days:** rebuilt from the stored places with their stored hours; the schedule and its notes (including the timing warning) are computed again.
  - **A place the customer added:** its details and hours come from the CURRENT data for that day's date (`tripHoursForAddedPlaces`), not stored with the edit. If the data changes, an added place's hours can change on the next open. **Policy not decided.**
  - **The title and summary of an edited day** are recomputed from its places (23.4); unedited days keep the stored ones.
  - **Notes on an edited day** come from today's rules (daylight, tour slots, timing); unedited days keep the notes they were saved with. A Budapest plan saved before 23.2 keeps the proposed «⏳ …» sunset text on unedited days, and that text has no translation.
  - **Photos:** filled in for display when the stored place has none (nothing written back).
  - **Translation:** exact match of the stored Arabic only.
- **Compact stored hours:** deferred (plan size); not a launch blocker by itself (owner, 2026-11-15).

### 23.8 Checks on the final commit
Run on 512e19f (clean tree); 46793fc after it changes comments and documents only. Outputs: `quality-r7/tests/`.
- **Schedule validity:**
  - Independent check, 0 problems: 159 days and 728 transfers (53 sample); 270 days and 1,277 transfers (108 sample).
  - Cumulative-allowance proof: 0 violations on both samples.
- **Budapest tests:**
  - `bud-boundary` ALL PASS; `bud-cruise-suggest` ALL PASS; `bud-mixed-dates` 307 / 0; `bud-action-save` 15 / 0.
  - `bud-daylight` 0 failures (including the fixed-session cases).
  - `bud-transport-links` 2,304 legs / 0.
  - `bud-day-text`: 429 days, 1,871 removals, 365 adds / 0.
  - `bud-i18n`: 156 data texts, 2,221 plans en / he / 0.
  - `bud-photos` 0.
- **Build:** `tsc`, `npm run lint`, `next build --webpack` pass.
- **Prague / Barcelona against 925512d:** generation of 5 sets (82 + 31 + 20 long Prague plans, 104 + 378 Barcelona requests), edits of 82 Prague and 104 Barcelona plans, and their English and Hebrew translation: all byte-identical (`quality-r7/tests/prague-barcelona-generation-edits-translation.txt`; generation times were not compared, the run shared the machine with the UI check).
- **UI on a phone viewport** (`quality-r7/ui-check.md`; emulated, not a real phone):
  - create → edit (remove, add) → save → reopen in Arabic;
  - the same plan in English and Hebrew (Hebrew switched on in the working copy for the check only);
  - place cards; the photo-credits page.

### 23.9 What still blocks a launch / a Preview
**Done in this round (no longer blockers):**
- titles naming removed places and the «Andrássyو» rendering;
- missing English / Hebrew content and the month names;
- the sunset note text (approved);
- photos for 28 places with their rights.

**Before a Vercel Preview (decisions and checks):**
1. **Saved plans, added places:** keep recomputing their hours from current data on every open, or store them with the edit (23.7). The owner's decision.
2. **Text review:**
   - a native English and Hebrew reading of `texts-review.md` (all AI-written);
   - the owner's review of the new Arabic title labels and the «و » convention.
3. **Hebrew on the site** is switched off (`releaseScope.ts`); deciding whether the Preview offers it.
4. **A test Supabase for the Preview** (separate from production) and the preview switch set for the Preview environment only. Owner's setup; nothing was created.

**Before a launch (still open):**
1. **Photos:**
   - 5 places without one (Legenda cruise, Hungarikum, Menza, Frici Papa, Városliget Café);
   - plan cards show no credit next to a photo (credits page only, as for Prague): an owner decision whether that is enough.
2. **Display:** «و» glued to times in two warning texts, and «:15» in RTL (`texts-review.md` section 5).
3. **Daylight:**
   - Vajdahunyad's class rests on caution;
   - the sunset is a monthly estimate;
   - the Zoo closes 5 min after the December estimate.
4. **Transport:** most transit times are distance estimates.
5. **Range per interest:** an owner decision (21.7); the questionnaire is unchanged.
6. **Not yet run:** a Vercel Preview with a test Supabase (real auth, saves, RLS); real phones and Safari.
7. **Compact stored hours:** deferred; not a blocker by itself.

**Budapest stays `available: false`.**

## 24. Round 8: display fixes, photo credits, Preview preparation (2026-11-16; code 709278c on `feature/budapest`)

B1 fixed, areas by date off, no threshold or distribution change, no publish.

### 24.1 The Opera card
- **Before:** the card showed the planning window «13:30–17:30» as the day's opening hours.
- **Now:**
  - The card lists «مواعيد الجولات: 13:30 · 15:00 · 16:30» with «الدخول بجولة بس، بموعد محجوز مسبقًا» (en / he the same).
  - The times are computed at load from the existing structured data: the tour slots of its `showWindow` (every 90 min), now marked `listSessions`, that fit a 60-min visit inside the stored window.
  - Display only (`hours.sessionStarts`). The window and the planner are unchanged.
- **Other places with fixed sessions** (checked for the same display error, nothing changed):

| Place | Shows | Same error? |
|---|---|---|
| House of Music | 10:15–17:50, its real opening hours (entry in slots, explained by its warning and tip) | no |
| Legenda cruise | its departures as text | no |
| Prague Vltava cruise | the season range «10:00–18:00» although departures are on the hour | **same class; another city, reported only** |
| Prague Kafka head | 09:00–23:00, when it can be seen | no |

### 24.2 Times in texts, the price counter, the badge
- **Times inside texts:** "13:30", ":15", "9–16", "24–25", "8:00–22:00" are shown as isolated left-to-right runs (`<bdi dir="ltr">`) in the plan view: stop notes, descriptions, tips, prices, hours texts.
  - The stored texts are not changed.
  - Opt-in per destination (`planDisplay.tsx`, Budapest only), so Prague / Barcelona and the guide pages render as before.
  - Measured in the browser: with isolation «:15» and «:45» show the colon before the digits, without it «15:» / «45:»; all isolated runs read left to right in Arabic and Hebrew.
  - The pattern has no lookbehind (older iPhone Safari lacks it).
- **«+ 2 price not available»:** now by number:
  - Arabic: «سعر واحد / سعرين غير متوفرين / N أسعار غير متوفرة»;
  - English: «1 price / N prices not available»;
  - Hebrew: «מחיר אחד / N מחירים לא זמינים».
  - Shared text, all cities.
- **Must See badge** by language: «لا تفوّته» / «Must see» / «חובה לראות». Selection rules unchanged.
  - Shared card: the Arabic guide pages show the Arabic badge too.
  - The guide's "Must See" filter button was left as it is.
- **New texts awaiting review:** the two tour-time lines, the badge, the counters.

### 24.3 Photo credits
- **Each place's details** show «📷 حقوق الصورة: author · licence» under the photo, linked to that photo's entry on `/photo-credits` (`#photo-<id>`).
  - Budapest only (display option); the general credits page stays.
  - The page says under Budapest that each photo is a resized copy with no other change.
- **Every file page re-read** (licence templates, credit lines, "please credit as"). Two credits corrected:
  - St Stephen's Basilica and the Parliament named the uploader «Godot13». The photographer's pages require «Andrew Shiva / Wikipedia / CC-BY-SA-4.0»; the Parliament file is MathKnight's derivative of his photo (CC BY-SA 4.0), both named.
  - Heroes' Square already used its requested credit.
  - Full record: `photo-rights.md`.
- **The 5 places without a photo** stay without one.

### 24.4 Saved plans: added places
- Design only: `added-place-snapshot-design.md`.
- **The idea:** snapshot of the added place's stop and details (hours used for that date) with the city data version, inside the day's edit.
- **Change size:** no storage or RLS change, no migration. Old plans keep today's behaviour until that day is next edited.
- **Not implemented.** The Preview can run with the documented current behaviour.

### 24.5 Preview
- Steps in `preview-setup.md`, built on the Prague release's `supabase/preview-setup/` (empty test database, guard, entitlement for test users).
- **Checked from here:**
  - payments fail closed off Production;
  - sign-in redirects stay on the Preview address;
  - the saved-plan RLS policies were REVIEWED (`user_id = auth.uid()`). Isolation is not proven by that: the two-account test (B reads and edits A's plan directly) is still required on the test environment;
  - Budapest's preview switch is honoured on a Preview;
  - the new Hebrew switch is Preview-only and fails closed.
- **The Vercel connector has no access to the team (403)**, so no setting was read or changed.
- **Unknown:** whether today's Preview values point to the production or a test database. The last known Preview build (2026-11-07) returned 500, consistent with no Supabase values on Preview then; that proves nothing about today. Isolate the Preview before any push (`preview-env-vars.md`).
- **Budapest switch in the browser, fixed in 4c39288:**
  - **Before:** in the browser it was not tied to the Vercel environment. If it were set for Production, the questionnaire would list Budapest while the server refused it.
  - **Now:** a build whose Vercel environment is known and is not a Preview lists no preview city.
  - **Unchanged:** Preview deployments, local builds and tests keep the preview; published cities are not affected.
  - **Test** (`bud-preview-gates.mts`, browser and server, Hebrew and Budapest, with the Preview values set on Production): 0 failures on 4c39288; 709278c fails the browser case.
  - **Limit:** it relies on Vercel exposing `NEXT_PUBLIC_VERCEL_ENV` (its default). Keep the variable Preview-only.
  - **Browser check on 4c39288** (`next dev`, phone viewport):
    - **Local preview** (variable `budapest`, no Vercel environment): the questionnaire lists Budapest «(معاينة)», with Prague and Barcelona.
    - **Simulated Production** (`VERCEL_ENV` and `NEXT_PUBLIC_VERCEL_ENV` = production, the Preview variables `budapest` / `he` set): only Barcelona and Prague selectable, even with `?destination=budapest`; Budapest only under «قريبًا»; the language menu offers Arabic and English, no Hebrew. Screenshots 09, 10.

### 24.6 Checks
- **Budapest schedules (161 plans, both samples) against round 7:** every timeline, order, meal, leg, title and note identical. Plans differ only in the display field `sessionStarts` and the two corrected credits.
- **Validity:** independent check 0 problems (159 + 270 days).
- **Budapest tests:** `bud-i18n` 0 untranslated (2,221 plans); `bud-photos` 0; `bud-daylight` 0; `bud-action-save` 15 / 0.
- **Build of 709278c itself** (clean worktree at that commit, after the shell came back):
  - `npm run lint` passes; `next build --webpack` passes.
  - `tsc --noEmit` run FIRST in that fresh worktree failed with 8 errors, all `Cannot find name 'PageProps'`: a type Next.js generates during the build in `.next/types`, which a fresh worktree does not have yet. Run after the build, tsc passes (exit 0).
- **Final code 4c39288:** results in `quality-r8/tests-4c39288/` (build, tsc after the build, lint, gating test, Budapest tests, Prague / Barcelona).
- **Prague / Barcelona against 925512d:** generation (5 sets), edits (82 + 104) and translation (en, he) byte-identical. This compares plan DATA only; it is no proof that their screens are unchanged.
- **Shared interface changes in every city:**
  - the tickets counter wording;
  - the badge «لا تفوّته» / «Must see» / «חובה לראות» (also on the Arabic guide pages);
  - anchors on every entry of `/photo-credits`.

  The time isolation and the credit line under photos are Budapest-only.
- **UI, phone viewport (emulated):**
  - a food plan created and opened in Arabic, English and Hebrew;
  - Hebrew through the new Preview switch in `next dev`;
  - screenshots: day 3 times and the counter (ar, he), the Opera card (ar, en, he), place details with credit and badge (ar, en), the credits page at the Opera's entry.
  - Not a real phone, not Safari.

## 25. Close-out round (2026-11-16; owner's instructions after the Preview run)

No engine tuning, no merge, no deploy. Budapest stays unavailable in Production; Hebrew stays off there.

### 25.1 Trip length (owner decision, from the launch table in 21.7)
- **Rule** (`app/lib/planner/tripLengthLimits.ts`, one function for the questionnaire and the server):
  - Budapest at most 4 days;
  - culture only, or popular only: at most 3;
  - nature / relaxation only (the "nature" group): 1 day.
  - An interest rule applies only when every chosen interest is inside it. "Surprise me" has none.
  - Prague, Barcelona: no entry, so only the general 10-day limit.
- **Server:** `normalizePersonalizedAnswers` refuses longer answers, on the day count it derives itself (flexible or dated). Every way to create a plan passes through it: owner creation, plan edit, checkout, complimentary, stored drafts. `generateBarcelonaPlanV2` is not a server action; its only caller passes normalized answers.
- **Questionnaire** (`PersonalizedPlanWizard.tsx`):
  - day buttons over the limit are disabled, with the reason under them («خطط بودابست حاليًا لحد 4 أيام.»);
  - an answer that stops fitting (other dates, a city change, interests changed after the days) blocks "next" with the reason and the options:
    - «اختار 3 أيام أو أقل، أو ضيف اهتمام تاني» with a «خلّيها 3 أيام» button (flexible dates);
    - «قصّر التواريخ لحد يوم واحد، أو ضيف اهتمام تاني» with «غيّر التواريخ» (specific dates).
  - Nothing is shortened and no interest is changed without the visitor's click.

### 25.2 Holiday hours: the two museums, each on its own source
| | National Museum (`hungarian-national-museum`, Múzeum krt., Pest) | National Gallery (`hungarian-national-gallery`, Buda Castle) |
|---|---|---|
| Source | `https://mnm.hu/nyitvatartas` (Hungarian page), table «Magyar Nemzeti Múzeum ünnepi nyitvatartása 2026-ban», read by us 2026-11-16. The English opening-hours page has no holiday table (its «HOLIDAY OPENING HOURS … HERE» links lead to the regular hours and to "Getting here"). | `en.mng.hu/opening-hours-during-holidays/`: still HTTP 520 (Cloudflare) on 16 Nov, as on 13 and 14 Nov; `mng.hu` and `szepmuveszeti.hu` (the same institution) also 520. Searches found no official 2026 table. The 2026/27 dates stay the reviewer's reading (14 Nov), relayed by the owner. |
| 2026/27 | 24, 25, 26 Dec closed · 27 open · 28 closed (Monday) · 29, 30 open · 31 Dec 10:00–14:00 · 1 Jan 2027 closed. Other 2026 holidays (15 Mar, Easter, 1 May, Whitsun, 20 Aug, 23 Oct, 1 Nov) open or a Monday. | unchanged: 24–25 Dec closed; 26–30 Dec 10:00–18:00 (Monday 28 included); 31 Dec 10:00–16:00; 1 Jan 12:00–18:00 |
| Code before | `fixed` regular hours: it could be planned on 24–26 Dec and 1 Jan (the mixed trip M7 put it on Thu 24 Dec 2026) | as above for 2026/27; regular hours for later years |
| Code now | `variable`: the card shows the holiday text (no weekly table that calls it "open" on a holiday); planning keeps the same regular hours (Tue–Sun 10:00–18:00, last entry 17:00); 2026/27 dates as the table (31 Dec: last entry 13:00 assumed, one hour before closing, as the regular ticket office) | unchanged for 2026/27 |
| Later years | 24–26 Dec, 31 Dec, 1 Jan from Dec 2027 to 2040 (the dates that changed in 2026): **planning exclusions, not closures**. Never on the clock on those dates. When the museum matches the request (the cruise's relevance rule) and is not on another trip day, it is a **conditional suggestion** on one of those days: «اختياري: مواعيد العطلة لهاليوم مش منشورة لسا. تأكّد من موقع المتحف قبل ما تروح.» Nothing calls it closed. | the same rule |

- **Plan size:** a plan that includes either museum grows by about 11.5 KB (the 28 dated entries of each museum are stored with its details). Largest in the 53 sample: 176 → 188 KB.
- **Not modelled, reported only:** other places' holiday hours (the Opera tour, the House of Music, Fine Arts after 1 Jan 2027, the Zoo's public holidays). A culture trip on 24–25 Dec 2026 still schedules the Opera tour and the House of Music with their regular hours.

### 25.3 Texts (an AI language review, not a person's review, not a new fact check)
- **House of Music** slot note: the owner's Arabic and English (Hebrew follows). Durations and slots unchanged.
- **English titles of three or more parts read as a list:**
  - «City Park, Andrássy Avenue and the Opera»;
  - «Parliament, St Stephen’s Basilica and Margaret Island».
  - Two-part titles keep «&». Hebrew unchanged.
- **"Depends on booking" not replaced:** advance booking is not a documented condition (the Opera: «Tickets are available one week in advance at the box offices or online»; the cruise: reservations "not required"). See `texts-review.md` section 7.

### 25.4 Checks
Outputs: `data/quality-close/`.
- **Budapest schedules against `1e2d278`** (53 sample, 12 prototypes, 7 mixed-date trips):
  - identical except the hours records of the two museums;
  - the mixed trip from 23 Dec 2026 now visits the National Museum on Tue 29 Dec instead of the closed Thu 24 Dec, and its days are rearranged.
- **Independent schedule check:** 0 problems (159 + 54 + 26 days).
- **`bud-closeout.mts`, new, 91 checks, all pass:**
  - the limit matrix;
  - 22 server cases (Budapest flexible and dated, Prague and Barcelona to 10 days);
  - the National Museum's hours on 15 dates;
  - generated holiday trips 2026 / 2027 / 2029;
  - the relevance rule of the suggestion;
  - titles, House of Music.
- **Existing tests, all pass:**
  - `bud-boundary`, `bud-cruise-suggest`, `bud-fixed-session-search`;
  - `bud-mixed-dates` 307 / 0; `bud-action-save` 15 / 0; `bud-photos` 0;
  - `bud-i18n`: 157 data texts, 1,355 plans, 0 untranslated;
  - `bud-day-text`: 278 days / 0;
  - `bud-daylight` 0; `bud-transport-links`: 1,343 legs / 0.
- **Prague / Barcelona against `925512d`:** generation (5 sets: 82 + 31 + 20 long Prague, 104 + 378 Barcelona), edits (82 + 104) and translation (en, he) byte-identical.
- **Build:** `tsc`, `npm run lint`, `next build --webpack` pass.
- **UI** (`next dev`, local Supabase test double, phone viewport 375×812 emulated, not a real phone):
  - Budapest dates step: 1–4 selectable, 5–10 disabled, the note;
  - culture only after 4 days: the block, "next" disabled, «خلّيها 3 أيام» fixes it; adding food lifts it;
  - nature only: «لحد يوم واحد»;
  - specific dates 1–5 Dec refused, 1–4 accepted; nature only on those dates: «غيّر التواريخ» back to the dates step.
  - Direct server-action calls:
    - over the limit: refused (`invalid_answers` / `invalid_planner_answers`, nothing generated);
    - a valid 3-day culture plan and a 10-day Prague plan: accepted.
  - A card with no photo (Hungarikum) and its details: no empty image box, no broken image, no overflow.
- **Environment note:** during the run the shared `node_modules` (in the Windows temp folder, last installed 9 Nov) lost files: a cleanup outside this work, cause not confirmed. It was reinstalled from the unchanged lockfile (`npm ci`), and the tests that had stopped on "module not found" were re-run.

### 25.5 Before the Preview push (owner's approval message, 2026-11-16)
**Texts:**
- the one-day limit no longer says "or fewer": «اختار يوم واحد أو ضيف اهتمام تاني»; with dates: «خلّي الوصول والمغادرة بنفس اليوم، أو ضيف اهتمام تاني»;
- the "nature" group reads «طبيعة وإطلالات» / "Nature & views" in Budapest (label only; internal keys and selection unchanged, as for Prague).

**Booking, no contradiction left:**
- **Opera card line:** «الدخول بجولة فقط، حسب المواعيد وتوفّر التذاكر.» / "Entry by guided tour only, subject to tour times and ticket availability."
- **No booking condition in the warnings:**
  - the Opera and cruise warnings lose «مشروطة بالحجز»;
  - the House of Music warning loses «محجوزة».
- Tour times, slots and durations unchanged.

**Holiday evidence, checked place by place (16 Nov):**

| Place | What exists | Decision |
|---|---|---|
| National Museum | official table read by us on `mnm.hu/nyitvatartas` (2026) | 2026/27 as the table; from Dec 2027 unconfirmed |
| National Gallery | no kept copy: the research files hold only the reviewer's relayed reading (sections 12.1, 13.1). Today: `en.mng.hu` 520 again; the newest Wayback copy (4 Nov) is the same error page | year-end dates unconfirmed from Dec 2026: the reviewer's dates are not used as confirmed hours (no Monday 28 Dec opening either) |
| Opera tour | `opera.hu` OperaTour page and FAQ: no holiday tour hours (only "not available during performances") | year-end dates unconfirmed from Dec 2026 |
| House of Music | `zenehaza.hu/en/opening-hours` and `/nyitvatartas`: no holiday hours | year-end dates unconfirmed from Dec 2026 |

**How the unconfirmed dates are handled:**
- **Dates:** 24–26 Dec, 31 Dec and 1 Jan.
- **Rule:** never on the clock; a conditional suggestion when relevant, never called closed («اختياري: مواعيد العطلة لهاليوم مش مؤكدة. تأكّد من الموقع الرسمي قبل ما تروح.»).
- **Other trip days are not blocked:** a Budapest trip is at most 4 days, so no weekday repeats inside it.
- **House of Music:** now `variable` (its card is a text, not a weekly table that would say "open" on such a date). Planning hours unchanged, with the 16:15 last entry kept in its season.
- **Opera:** stays `fixed`. Its card lists only the tour times, with no "open that day" claim.

**Checks** (outputs: `data/quality-close/preview/`):
- **Budapest schedules against `f909f51`:**
  - unchanged except trips with year-end dates: 8 of 53 sample plans (all the 24–26 Dec 2026 window) and 5 of 7 mixed trips;
  - the 12 prototypes unchanged;
  - elsewhere only the hours records and the warning texts differ.
  - In those trips the four places are never on the clock on 24–26 / 31 Dec / 1 Jan and appear as the conditional suggestion when relevant. A culture-only day on 25 Dec 2026 has two places.
- **Tests (all pass):**
  - `bud-closeout`, 215 checks: the rule for the four places on 13 generated trips, planning hours on 30 dates, the cards, the texts;
  - `bud-boundary` (gallery section rewritten for the unconfirmed dates; House of Music: no first-Tuesday list);
  - `bud-mixed-dates` 311 / 0 (per-date checks moved to the National Museum's official hours);
  - `bud-cruise-suggest`;
  - `bud-i18n`: 158 data texts, 1,365 plans, 0 untranslated;
  - `bud-day-text`: 282 days / 0; `bud-daylight` 0; `bud-transport-links`: 1,309 legs / 0.
- **Independent check:** 0 problems (159 + 54 + 30 days).
- **Build:** `tsc`, lint and `next build --webpack` pass.
- **Not re-run:** Prague / Barcelona. The changes touch no shared engine code: a Budapest-only label, a card line shown only where tour times are listed (the Opera), and questionnaire texts used only under a Budapest limit.

### 25.6 Temporary launch scope by date (owner decision, 2026-11-16)
**Why:** two 25 Dec cases were not acceptable as a full paid plan:
- the culture trip 25–27 Dec: 4 visits, 80 min, last visit 11:45;
- 25 Dec in the Preview plan 24–26 Dec: 2 visits, 95 min, last visit 11:15.

No padding, no shorter visits, no engine work.

**The scope:**
- **Refused:** Budapest requests with **specific dates** that touch 24–26 Dec 2026, 31 Dec 2026 or 1 Jan 2027.
- **What it means:** a limit on our product's readiness for these holidays, not a claim that the city or every place is closed.
- **Only these dates:** not generalised to other years, and no claim that every other date was checked.

**How it works:**
- **One function:** `unavailableTripDates` in `tripLengthLimits.ts`.
- **Server:** used in `normalizePersonalizedAnswers`. That check runs before any order (checkout, complimentary) and before any plan generation (owner creation, plan edit).
- **Questionnaire:**
  - shows «خطط بودابست مش متاحة حاليًا لهالتواريخ بسبب تغيّر مواعيد الأماكن بالأعياد. اختار تواريخ ثانية أو مدينة ثانية.» and blocks "next";
  - the dates are never changed for the visitor;
  - after the dates step (an edited plan) a «غيّر التواريخ» button leads back.
- **Plans without dates:** a short note in the questionnaire (flexible dates) and in the plan view:
  - the plan does not check holiday closures;
  - the scope above is not supported.
- **Unchanged:**
  - saved plans keep opening (nothing deleted or blocked);
  - Prague, Barcelona and payment settings;
  - the engine's holiday rules from 25.2 and 25.5, still used for every dated plan, e.g. Dec 2027.

**Checks:**
- **`bud-closeout`: 246 checks.** 14 date cases on the function and on the server:
  - the day before / the day after;
  - a trip from 21 Dec into 24 Dec;
  - 27–30 Dec between the windows (allowed);
  - 28–31 Dec, 30 Dec–1 Jan and 1–2 Jan;
  - 24–26 Dec 2027 and 2025 (allowed);
  - Prague and Barcelona on the same dates (allowed);
  - Budapest flexible (allowed).
- **Refusal before any order:** the checkout action called directly as a visitor on the local server with the Supabase test double (which records every database call):
  - dates 21–24 Dec 2026 → `invalid_planner_answers` and no database call at all;
  - the control 27–30 Dec 2026 → `create_personalized_plan_order` recorded, then `payment_setup_failed` because Allpay is `disabled`; nothing external contacted.

### 25.7 Launch commit (2026-11-16; branch only, not merged or deployed)
**What changes:**
- `plannerDestinations.ts`: Budapest `available: true`, the same mechanism as Prague on 2026-11-08.
- The preview switch no longer decides Budapest; Vienna stays release-excluded.
- Site copy that named "Barcelona and Prague" now names Barcelona, Prague and Budapest, in Arabic and English:
  - meta descriptions, the questionnaire note, the price line, the FAQ line, the comparison hint;
  - Hebrew copy left as it is: off in Production, and already out of date for Prague.
- Unchanged: payments, prices, permissions, database (destination ids are checked by pattern only), Prague, Barcelona.
- `bud-preview-gates.mts` updated: Budapest available in every environment; Hebrew still only on a Preview or `next dev`.

**Simulated Production** (local production build and `next start`):
- **Values:** `VERCEL=1`, `VERCEL_ENV=production`, `NEXT_PUBLIC_VERCEL_ENV=production`, the Preview switches set by mistake (`he`, `budapest`), `ALLPAY_MODE=disabled`, the local Supabase test double. Test values only.
- **Questionnaire:**
  - Barcelona, Prague and Budapest selectable, with no "preview" label;
  - languages Arabic and English only (no Hebrew);
  - Budapest days 5–10 disabled;
  - dates 21–24 Dec 2026 refused with the message, 27–30 Dec accepted.
- **Server actions called directly:**
  - Budapest 3-day culture accepted;
  - 5 days, culture 4 days and 21–24 Dec 2026 refused (`invalid_answers`);
  - 27–30 Dec 2026 accepted;
  - Prague 10 days and Barcelona 24–26 Dec 2026 accepted;
  - a visitor checkout for Budapest 21–24 Dec refused with no database call.

### 25.8 Rollback review (from the code, 2026-11-16; nothing changed)
**What a revert of the launch commit (`84a5e79`, Budapest `available: false`) does to people who bought a Budapest plan.** Ownership itself is product-level, so they stay owners and keep every other city.

| Path | Gate in the code | After the revert | After a Vercel Instant Rollback to `925512d` (no Budapest module) |
|---|---|---|---|
| Open a saved Budapest plan | saved page: `cityForSavedPlan` = engine module only | opens | opens, read-only |
| Edit the days of a saved plan (start, length, order, remove / add) | `customizeSavedPlan`: owner check + `cityForSavedPlan` | works | not offered (no module) |
| "Edit answers" (regenerate the plan in place) | `parsePlannerDraft` → `normalizePersonalizedAnswers` → `isAvailablePlannerDestinationId`; server `isGeneratableDestination` | **blocked**: the draft is rejected and the server answers `unsupported_destination` / `invalid_answers` | **blocked** |
| Build a PAID Budapest request not yet built (e.g. a guest who pays, then claims and builds) | `generatePersonalizedPlanAction` → `generatePersonalizedPlanForRequest` → `isGeneratableDestination` (available AND module) | **blocked**: `unsupported_destination`, the paid plan cannot be built | **blocked** |
| New Budapest plans | questionnaire + server | refused (intended) | refused |

**Result:** the revert is **not a safe rollback** once a Budapest purchase exists.
- Opening and day edits survive.
- A buyer whose paid request is not built yet gets nothing, and the answers of existing Budapest plans can no longer be edited.
- An Instant Rollback to `925512d` is worse: no day edits either.

**When the revert is safe:** only while no Budapest purchase exists. The owner can check this in production with a read-only query (counts only, no customer data):
```sql
select
  (select count(*) from public.personalized_plan_requests where destination_id = 'budapest') as budapest_requests,
  (select count(*) from public.personalized_plan_requests where destination_id = 'budapest' and saved_plan_id is null) as budapest_requests_not_built,
  (select count(*) from public.smart_planner_saved_plans where destination_slug = 'budapest') as budapest_saved_plans;
```
- All three must be 0 for the plain revert to be safe.
- Otherwise a safe rollback needs a code change, NOT made here, because it touches purchase / generation gating: a "closed to new requests" state where the questionnaire and new requests refuse Budapest, while a paid Budapest request and the regeneration of an existing Budapest plan still pass.
- That needs its own approved task, ideally before the merge.
