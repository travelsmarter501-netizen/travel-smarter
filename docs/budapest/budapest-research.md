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
