# Budapest texts: review list (2026-11-15, round 7)

**Status of every text below: NOT reviewed by a person.** The English and Hebrew were written by Claude (AI). Before launch, a native
English and a native Hebrew reader should check each row; the owner should check the new Arabic texts in section 1. No fact, time, price
or date differs between the languages (checked by `docs/budapest/tools/bud-i18n.mts` for structure and data, and by reading).

Source of truth in code: `app/lib/i18n/budapestCatalog.ts` (exact texts and templates), `app/lib/planner/budapest/budapestCityModule.ts`
(Arabic title labels), `budapestDaylight.ts` (sunset note).

## 1. New or changed Arabic (owner review)

| Text | Where | Status |
|---|---|---|
| «الأفضل تزوره بضوّ النهار. الغروب حوالي {time} حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.» | daylight note | **approved by the owner (2026-11-15)** |
| «البرلمان» · «الكاتدرائية» · «ضفة الدانوب» | day title, area Lipótváros when the day has only one of the Parliament / St Stephen's, or neither | new, needs review |
| «الأوبرا» · «شارع Andrássy» | day title, area Terézváros when the day has only the Opera tour or only Andrássy | new, needs review |
| «و » with a space before a Latin name (e.g. «حديقة المدينة و Andrássy والأوبرا», «… و Gozsdu Udvar.») | day titles and summaries | new convention, needs review |
| Month names in place texts: «يناير … ديسمبر» instead of «كانون الثاني … كانون الأول» (32 words on 10 lines; numbers unchanged) | tips, hours | aligned with the site's month names |

## 2. Templates (texts with a value)

| Arabic | English | Hebrew |
|---|---|---|
| الأفضل تزوره بضوّ النهار. الغروب حوالي 16:15 حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك. | Best visited in daylight. Sunset is around 16:15 by the month's estimate, and it may differ on your travel date. | עדיף לבקר באור יום. השקיעה בסביבות 16:15 לפי הערכה חודשית, ועשויה להיות שונה בתאריך הנסיעה שלכם. |
| وقت المواصلات من مخطط Google Maps بهالاتجاه، لانطلاق الإثنين 23/11/2026 الساعة 10:15 (توقيت بودابست)، من الباب للباب؛ بموعد تاني بيتغير حسب الخط والانتظار. | Public transport time from the Google Maps planner in this direction, for a departure on Monday 23/11/2026 at 10:15 (Budapest time), door to door; at another time it changes with the line and the wait. | זמן התחבורה הציבורית מהמתכנן של Google Maps בכיוון הזה, ליציאה ביום שני 23/11/2026 בשעה 10:15 (שעון בודפשט), מדלת לדלת; בשעה אחרת הוא משתנה לפי הקו וההמתנה. |
| قدرنا نبني خطة قوية لـ 3 أيام من البيانات المتاحة حاليًا لبودابست. | We could build a strong plan for 3 days from the data currently available for Budapest. | הצלחנו לבנות תוכנית חזקה ל־3 ימים מהנתונים שזמינים כרגע לבודפשט. |
| حديقة المدينة و Andrássy والأوبرا | City Park & Andrássy and the Opera | פארק העיר ו־Andrássy והאופרה |
| البرلمان والكاتدرائية وجزيرة Margaret | Parliament and St Stephen's & Margaret Island | הפרלמנט וסנט סטפן והאי Margaret |
| يوم تلة القلعة | Castle Hill | גבעת הטירה |
| تلة القلعة وضفة الدانوب: Fisherman's Bastion (Halászbástya) | Castle Hill & Danube bank: Fisherman's Bastion (Halászbástya) | גבעת הטירה וגדת הדנובה: Fisherman's Bastion (Halászbástya) |

Day summaries («محطات اليوم: A، B و C.») use the shared template of `localizePlan.ts` (Latin place names stay as written).

## 3. Planner phrases (14)

| Key | Arabic | English | Hebrew |
|---|---|---|---|
| budapest/walk | المسافة من مسار مشي فعلي (OpenStreetMap)، والوقت تقدير على مشي 4.5 كم بالساعة. | Distance from a real walking route (OpenStreetMap); the time is an estimate at 4.5 km/h. | המרחק ממסלול הליכה אמיתי (OpenStreetMap); הזמן הוא הערכה לפי הליכה של 4.5 קמ״ש. |
| budapest/walk-climb | المسافة من مسار مشي فعلي (OpenStreetMap) وفيه طلعة أو نزلة تلة، فالوقت تقدير على مشي 4.5 كم بالساعة مع 20% زيادة. | Distance from a real walking route (OpenStreetMap) with an uphill or downhill stretch, so the time is an estimate at 4.5 km/h plus 20%. | המרחק ממסלול הליכה אמיתי (OpenStreetMap) עם עלייה או ירידה, ולכן הזמן הוא הערכה לפי הליכה של 4.5 קמ״ש ועוד 20%. |
| budapest/reason/szechenyi | اختياري بشرط: ممنوع تحت 14 سنة، مختلط وبلباس سباحة؛ مش ضمن الجدول | Optional, with conditions: no entry under 14, mixed and in swimwear; not in the schedule | אופציונלי, בתנאים: אסור מתחת לגיל 14, מעורב ובבגד ים; לא בלוח הזמנים |
| budapest/reason/hospital | اختياري بشرط: ممنوع تحت 6 سنين، والجولة بموعد ما تحققنا منه؛ مش ضمن الجدول | Optional, with conditions: no entry under 6, and the tour times are not verified; not in the schedule | אופציונלי, בתנאים: אסור מתחת לגיל 6, ושעות הסיור לא אומתו; לא בלוח הזמנים |
| budapest/reason/evening | اختياري: رحلة مسائية، مواعيدها حسب فترة سفرك؛ احجز موعد لما تعرف تاريخك | Optional: an evening cruise whose times depend on your travel period; book a time once you know your date | אופציונלי: שייט ערב שהשעות שלו תלויות בתקופת הנסיעה; הזמינו מועד כשתדעו את התאריך |
| budapest/reason/cruise-unpublished | رحلة مسائية على الدانوب — خيار إضافي. تأكّد من المواعيد والتوفّر لتاريخ سفرك قبل الحجز. | An evening cruise on the Danube — an extra option. Check the times and availability for your travel date before booking. | שייט ערב על הדנובה — אפשרות נוספת. בדקו את השעות והזמינות לתאריך הנסיעה לפני ההזמנה. |
| budapest/warning/opera | ⚠️ مشروطة بالحجز: الجولات بس 13:30 و15:00 و16:30، والتذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض. | ⚠️ Depends on booking: tours only at 13:30, 15:00 and 16:30, and tickets are released a week ahead. No tours during performances. | ⚠️ בכפוף להזמנה: סיורים רק ב־13:30, 15:00 ו־16:30, והכרטיסים יוצאים למכירה שבוע מראש. אין סיורים בזמן הופעות. |
| budapest/warning/cruise | ⚠️ مشروطة بالحجز: الموعد المنشور مش ضمان مكان. المشروب المشمول ممكن يكون مي أو مشروب غازي. | ⚠️ Depends on booking: a published departure does not guarantee a place. The included drink can be water or a soft drink. | ⚠️ בכפוף להזמנה: מועד שפורסם אינו מבטיח מקום. המשקה הכלול יכול להיות מים או משקה קל. |
| budapest/warning/house-of-music | ⚠️ الدخول بفترة محجوزة كل نص ساعة (:15 و:45)، وتذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية. | ⚠️ Entry by a booked half-hour slot (:15 and :45), and weekend tickets sell out fast. The cloakroom is mandatory. | ⚠️ כניסה במשבצת מוזמנת של חצי שעה (:15 ו־:45), וכרטיסים לסופ״ש נגמרים מהר. השימוש במלתחה חובה. |
| budapest/warning/zoo | المواعيد بتتغير حسب الشهر (بالشتا لحد 16:00 وآخر دخول 15:00). | Hours change by month (in winter until 16:00, last entry 15:00). | השעות משתנות לפי החודש (בחורף עד 16:00, כניסה אחרונה 15:00). |
| budapest/warning/basilica-sunday | الأحد: الكنيسة بتفتح من 13:00 بس (التراس من 9:00). | Sunday: the church opens only from 13:00 (the terrace from 9:00). | ראשון: הכנסייה נפתחת רק מ־13:00 (המרפסת מ־9:00). |
| budapest/warning/museum-halls | في قاعات مسكّرة للترميم حسب موقع المتحف. | Some halls are closed for renovation, according to the museum's website. | חלק מהאולמות סגורים לשיפוץ, לפי אתר המוזיאון. |
| budapest/show-window/opera | الجولات بس 13:30 و15:00 و16:30: احجز الموعد اللي بيناسب خطتك. | Tours only at 13:30, 15:00 and 16:30: book the time that fits your plan. | סיורים רק ב־13:30, 15:00 ו־16:30: הזמינו את המועד שמתאים לתוכנית שלכם. |
| budapest/show-window/house-of-music | الدخول بفترات كل نص ساعة (:15 و:45): احجز الفترة اللي بتناسب خطتك. | Entry in half-hour slots (:15 and :45): book the slot that fits your plan. | הכניסה במשבצות של חצי שעה (:15 ו־:45): הזמינו את המשבצת שמתאימה לתוכנית שלכם. |

## 4. Place texts (102)

The two National Gallery rows: Arabic approved by the owner (2026-11-14); English and Hebrew checked against it on 2026-11-15 (every date,
time and number identical), still not reviewed by a native reader.

| Keys | Arabic | English | Hebrew |
|---|---|---|---|
| attractions/hungarian-national-gallery/hours.display | مواعيد العطلة: 24–25 ديسمبر 2026 مسكّر · 26–30 ديسمبر 2026 (ومعها الإثنين 28) 10:00–18:00، آخر دخول 17:00 · 31 ديسمبر 2026 10:00–16:00، آخر دخول 15:00 · 1 يناير 2027 12:00–18:00، آخر دخول 17:00 — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، آخر دخول 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر | Holiday hours: closed 24–25 December 2026 · 26–30 December 2026 (including Monday 28) 10:00–18:00, last entry 17:00 · 31 December 2026 10:00–16:00, last entry 15:00 · 1 January 2027 12:00–18:00, last entry 17:00 — Regular hours: Tuesday–Sunday 10:00–18:00, last entry 17:00, and the halls start closing at 17:30 · closed on Mondays | שעות החגים: סגור ב־24–25 בדצמבר 2026 · 26–30 בדצמבר 2026 (כולל יום שני 28) 10:00–18:00, כניסה אחרונה 17:00 · 31 בדצמבר 2026 10:00–16:00, כניסה אחרונה 15:00 · 1 בינואר 2027 12:00–18:00, כניסה אחרונה 17:00 — שעות רגילות: שלישי–ראשון 10:00–18:00, כניסה אחרונה 17:00, והאולמות מתחילים להיסגר ב־17:30 · סגור בימי שני |
| attractions/hungarian-national-gallery/tip | القبة مفتوحة ضمن ساعات المتحف ولحد 17:00 بالأكثر، حسب الطقس، ولحد 15 شخص بالمرة. الدخول ببلاش للكل 15 مارس و20 أغسطس و23 أكتوبر. | The dome is open within the museum's hours, until 17:00 at the latest, weather permitting, for up to 15 people at a time. Entry is free for everyone on 15 March, 20 August and 23 October. | הכיפה פתוחה בשעות המוזיאון ועד 17:00 לכל המאוחר, בהתאם למזג האוויר, עד 15 אנשים בכל פעם. הכניסה חופשית לכולם ב־15 במרץ, ב־20 באוגוסט וב־23 באוקטובר. |
| areas/lipotvaros/description | حي البرلمان والكاتدرائية على ضفة Pest. | The district of the Parliament and St Stephen's Basilica, on the Pest bank. | הרובע של הפרלמנט ובזיליקת סנט סטפן, על גדת Pest. |
| areas/belvaros/description | وسط Pest القديم: Váci utca والسوق المركزي. | Old central Pest: Váci utca and the Great Market Hall. | מרכז Pest הישן: Váci utca והשוק המרכזי. |
| areas/castle-hill/description | تلة القلعة على ضفة Buda. | Castle Hill, on the Buda bank. | גבעת הטירה, על גדת Buda. |
| areas/gellert-hill/description | تلة Gellért وCitadella فوق النهر. | Gellért Hill and the Citadella above the river. | גבעת Gellért וה־Citadella מעל הנהר. |
| areas/terezvaros/description | شارع Andrássy ودار الأوبرا. | Andrássy Avenue and the Opera House. | שדרות Andrássy ובית האופרה. |
| areas/erzsebetvaros/description | الحي اليهودي التاريخي. | The historic Jewish Quarter. | הרובע היהודי ההיסטורי. |
| areas/palotanegyed/description | حي المتحف الوطني. | The National Museum district. | רובע המוזיאון הלאומי. |
| areas/city-park/description | حديقة المدينة وساحة الأبطال. | City Park and Heroes' Square. | פארק העיר וכיכר הגיבורים. |
| areas/margaret-island/description | الجزيرة الخضرا بنص الدانوب. | The green island in the middle of the Danube. | האי הירוק באמצע הדנובה. |
| attractions/st-stephens-basilica/description | أكبر كنيسة ببودابست. الزيارة بالخطة: الكنيسة مع التراس البانورامي فوق القبة (تذكرة مشتركة). | Budapest's largest church. The visit in the plan: the church plus the panoramic terrace above the dome (combined ticket). | הכנסייה הגדולה בבודפשט. הביקור בתוכנית: הכנסייה יחד עם המרפסת הפנורמית מעל הכיפה (כרטיס משולב). |
| attractions/st-stephens-basilica/whyRecommend | من أعلى الإطلالات على Pest، وجنب البرلمان مشيًا. | One of the highest viewpoints over Pest, within walking distance of the Parliament. | אחת מנקודות התצפית הגבוהות ביותר על Pest, במרחק הליכה מהפרלמנט. |
| attractions/st-stephens-basilica/tip | الكنيسة الإثنين–السبت 9:00–18:00 والأحد من 13:00 بس؛ التراس والخزنة كل يوم 9:00–19:00. التذكرة المشتركة 6,800 HUF للبالغ (الكنيسة لحالها 2,600). آخر دخول مش منشور. | The church: Monday–Saturday 9:00–18:00, Sunday from 13:00 only; the terrace and treasury every day 9:00–19:00. The combined ticket is 6,800 HUF per adult (the church alone 2,600). Last entry is not published. | הכנסייה: שני–שבת 9:00–18:00, וראשון רק מ־13:00; המרפסת והאוצר כל יום 9:00–19:00. הכרטיס המשולב 6,800 HUF למבוגר (הכנסייה לבד 2,600). שעת הכניסה האחרונה לא מפורסמת. |
| attractions/st-stephens-basilica/priceText | 6,800 HUF (بالغ، الكنيسة والتراس) · الكنيسة لحالها 2,600 HUF | 6,800 HUF (adult, church and terrace) · church only 2,600 HUF | 6,800 HUF (מבוגר, כנסייה ומרפסת) · כנסייה בלבד 2,600 HUF |
| attractions/parliament-exterior/description | مبنى البرلمان من الخارج، من ساحة Kossuth وضفة الدانوب. الزيارة الداخلية بجولة وحجز، ومش ضمن الخطة. | The Parliament building from outside, from Kossuth Square and the Danube bank. Visiting inside needs a booked tour and is not part of the plan. | בניין הפרלמנט מבחוץ, מכיכר Kossuth ומגדת הדנובה. ביקור בפנים דורש סיור בהזמנה ואינו חלק מהתוכנית. |
| attractions/parliament-exterior/whyRecommend | أشهر مبنى ببودابست. | Budapest's most famous building. | הבניין המפורסם ביותר בבודפשט. |
| attractions/parliament-exterior/tip | الجولة الداخلية بحجز مسبق من مركز الزوار؛ سعرها ومواعيدها ما قدرنا نتحقق منهم من المصدر الرسمي، فهي خيار إضافي إلك. | The inside tour is booked in advance through the visitor centre; we could not confirm its price and times from the official source, so it is an extra option for you. | הסיור בפנים מוזמן מראש דרך מרכז המבקרים; לא הצלחנו לאמת את המחיר והשעות שלו מהמקור הרשמי, ולכן זו אפשרות נוספת בשבילכם. |
| attractions/shoes-on-the-danube/description | نصب تذكاري لضحايا 1944–1945 على ضفة الدانوب، جنب البرلمان. | A memorial to the victims of 1944–1945 on the Danube bank, next to the Parliament. | אנדרטה לזכר קורבנות 1944–1945 על גדת הדנובה, ליד הפרלמנט. |
| attractions/shoes-on-the-danube/whyRecommend | محطة قصيرة ومؤثرة على طريق البرلمان. | A short, moving stop on the way to the Parliament. | עצירה קצרה ומרגשת בדרך לפרלמנט. |
| attractions/shoes-on-the-danube/duration | 10 دقائق | 10 minutes | 10 דקות |
| attractions/shoes-on-the-danube/tip | على الرصيف النهري، بين البرلمان وجسر السلاسل. | On the riverside embankment, between the Parliament and the Chain Bridge. | על הטיילת שלאורך הנהר, בין הפרלמנט לגשר השלשלאות. |
| attractions/chain-bridge/description | أقدم جسر ثابت على الدانوب ببودابست، بين Pest وتلة القلعة. | The oldest permanent bridge over the Danube in Budapest, between Pest and Castle Hill. | הגשר הקבוע הוותיק ביותר על הדנובה בבודפשט, בין Pest לגבעת הטירה. |
| attractions/chain-bridge/whyRecommend | المشي عليه طريق طبيعي من Pest للقلعة. | Walking across it is the natural way from Pest to the castle. | ההליכה עליו היא הדרך הטבעית מ־Pest לטירה. |
| attractions/chain-bridge/duration<br>attractions/matthias-church-exterior/duration | 15 دقيقة | 15 minutes | 15 דקות |
| attractions/fishermans-bastion/description | تراسات وأبراج فوق تلة القلعة بإطلالة على البرلمان والدانوب. | Terraces and towers on Castle Hill overlooking the Parliament and the Danube. | מרפסות ומגדלים על גבעת הטירה עם נוף לפרלמנט ולדנובה. |
| attractions/fishermans-bastion/whyRecommend | أشهر إطلالة ببودابست. | Budapest's most famous view. | הנוף המפורסם ביותר בבודפשט. |
| attractions/fishermans-bastion/tip | التراسات مفتوحة كل السنة. الأبراج والتراسات العليا مدفوعة بس من 9:00 لـ19:00 (من 1 يونيو لـ30 سبتمبر لـ21:00)، وببلاش برّا هالساعات وبالأعياد الوطنية و24–31 ديسمبر (جدول 2026). الدفع بالكرت. | The terraces are open all year. The towers and upper terraces are paid only from 9:00 to 19:00 (from 1 June to 30 September until 21:00), and free outside those hours, on national holidays and on 24–31 December (2026 schedule). Payment by card. | המרפסות פתוחות כל השנה. המגדלים והמרפסות העליונות בתשלום רק מ־9:00 עד 19:00 (מ־1 ביוני עד 30 בספטמבר עד 21:00), וללא תשלום מחוץ לשעות האלה, בחגים הלאומיים וב־24–31 בדצמבר (לוח 2026). התשלום בכרטיס. |
| attractions/fishermans-bastion/priceText | 1,700 HUF (التراسات العليا بساعات الدفع؛ فئة السعر مش مكتوبة) | 1,700 HUF (upper terraces during the paid hours; the price category is not stated) | 1,700 HUF (המרפסות העליונות בשעות התשלום; קטגוריית המחיר לא מצוינת) |
| attractions/matthias-church-exterior/description | الكنيسة القوطية بسقفها الملون، من الساحة جنب حصن الصيادين. الدخول لجوا خيار إضافي. | The Gothic church with its colourful roof, seen from the square next to Fisherman's Bastion. Going inside is an extra option. | הכנסייה הגותית עם הגג הצבעוני, מהכיכר שליד מבצר הדייגים. הכניסה פנימה היא אפשרות נוספת. |
| attractions/matthias-church-exterior/whyRecommend | من أجمل مباني تلة القلعة، وعلى بعد خطوات من الحصن. | One of the most beautiful buildings on Castle Hill, a few steps from the Bastion. | אחד הבניינים היפים בגבעת הטירה, כמה צעדים מהמבצר. |
| attractions/matthias-church-exterior/tip | الدخول لجوا 3,400 HUF (بالغ). موقع الكنيسة بينشر ساعات «اليوم» بس (13 نوفمبر: 9:00–17:00، آخر دخول 16:45)، والطقوس والوفود لها أولوية، فما حطّينا الدخول بالجدول. البرج تذكرة بموعد (197 درجة). | Entry inside is 3,400 HUF (adult). The church's website publishes only “today's” hours (13 November: 9:00–17:00, last entry 16:45), and services and groups take priority, so we did not put the visit inside in the schedule. The tower is a timed ticket (197 steps). | הכניסה פנימה 3,400 HUF (מבוגר). אתר הכנסייה מפרסם רק את שעות „היום“ (13 בנובמבר: 9:00–17:00, כניסה אחרונה 16:45), ולטקסים ולקבוצות יש עדיפות, ולכן לא הכנסנו את הביקור בפנים ללוח הזמנים. המגדל בכרטיס עם שעת כניסה (197 מדרגות). |
| attractions/hungarian-national-gallery/description | الفن المجري من القرون الوسطى لليوم، بقصر بودا. التذكرة بتشمل القبة (54 درجة) حسب الطقس. | Hungarian art from the Middle Ages to today, in Buda Castle. The ticket includes the dome (54 steps), weather permitting. | אמנות הונגרית מימי הביניים ועד היום, בארמון Buda. הכרטיס כולל את הכיפה (54 מדרגות), בהתאם למזג האוויר. |
| attractions/hungarian-national-gallery/whyRecommend | أكبر مجموعة فن مجري، ومن القبة إطلالة على المدينة. | The largest collection of Hungarian art, and a view of the city from the dome. | האוסף הגדול ביותר של אמנות הונגרית, ומהכיפה נוף על העיר. |
| attractions/hungarian-national-gallery/duration | ساعتين تقريبًا (المتحف بيقترح 1.5–3 ساعات) | About 2 hours (the museum suggests 1.5–3 hours) | כשעתיים (המוזיאון ממליץ על 1.5–3 שעות) |
| attractions/hungarian-national-gallery/priceText | 5,800 HUF (بالغ، كامل) · مخفّض 2,900 حسب العمر | 5,800 HUF (adult, full price) · reduced 2,900 by age | 5,800 HUF (מבוגר, מחיר מלא) · מוזל 2,900 לפי גיל |
| attractions/hungarian-national-museum/description | تاريخ هنغاريا من العصور القديمة لليوم، بمبنى كلاسيكي. | Hungary's history from ancient times to today, in a classical building. | ההיסטוריה של הונגריה מהעת העתיקה ועד היום, בבניין קלאסי. |
| attractions/hungarian-national-museum/whyRecommend | أهم متحف تاريخي بالمدينة. | The city's most important history museum. | מוזיאון ההיסטוריה החשוב ביותר בעיר. |
| attractions/hungarian-national-museum/tip | الشباك لحد 17:00. في قاعات مسكّرة للترميم من 2 ديسمبر 2025، ومعطف التتويج مسكّر حاليًا (حسب موقع المتحف). | Ticket desk until 17:00. Some halls have been closed for renovation since 2 December 2025, and the Coronation Mantle display is currently closed (according to the museum's website). | הקופה פתוחה עד 17:00. חלק מהאולמות סגורים לשיפוץ מ־2 בדצמבר 2025, ותצוגת גלימת ההכתרה סגורה כרגע (לפי אתר המוזיאון). |
| attractions/hungarian-national-museum/priceText | 3,500 HUF (بالغ، كامل) · المخفّض لمواطني هنغاريا وEEA بس | 3,500 HUF (adult, full price) · reduced price only for citizens of Hungary and the EEA | 3,500 HUF (מבוגר, מחיר מלא) · מחיר מוזל רק לאזרחי הונגריה וה־EEA |
| attractions/museum-of-fine-arts/description | مصر القديمة والعصور الكلاسيكية والفن الأوروبي لحد 1800، بساحة الأبطال. | Ancient Egypt, classical antiquity and European art up to 1800, on Heroes' Square. | מצרים העתיקה, העת הקלאסית ואמנות אירופית עד 1800, בכיכר הגיבורים. |
| attractions/museum-of-fine-arts/whyRecommend | من أكبر متاحف الفن بأوروبا الوسطى. | One of the largest art museums in Central Europe. | אחד ממוזיאוני האמנות הגדולים במרכז אירופה. |
| attractions/museum-of-fine-arts/tip | الدخول لحد 17:00. جمعة واحدة بالشهر (Museum and Slow) من 12:00 والدخول لحد 19:00. مسكّر 24 و25 ديسمبر (جدول 2026). | Entry until 17:00. One Friday a month (Museum and Slow): from 12:00, with entry until 19:00. Closed on 24 and 25 December (2026 schedule). | הכניסה עד 17:00. יום שישי אחד בחודש (Museum and Slow): מ־12:00, וכניסה עד 19:00. סגור ב־24 וב־25 בדצמבר (לוח 2026). |
| attractions/museum-of-fine-arts/priceText | 5,800 HUF (بالغ، كامل) · المخفّض لمواطني EEA وأوكرانيا بس | 5,800 HUF (adult, full price) · reduced price only for citizens of the EEA and Ukraine | 5,800 HUF (מבוגר, מחיר מלא) · מחיר מוזל רק לאזרחי ה־EEA ואוקראינה |
| attractions/opera-house-tour/description | جولة مرشدة بالإنجليزي جوّا دار الأوبرا (60 دقيقة) مع حفلة قصيرة بالآخر. | A guided tour in English inside the Opera House (60 minutes) with a short performance at the end. | סיור מודרך באנגלית בתוך בית האופרה (60 דקות) עם הופעה קצרה בסוף. |
| attractions/opera-house-tour/whyRecommend | من أجمل دور الأوبرا بأوروبا، والجولة بتورجيك القاعات من جوا. | One of the most beautiful opera houses in Europe, and the tour shows you the halls inside. | אחד מבתי האופרה היפים באירופה, והסיור מראה לכם את האולמות מבפנים. |
| attractions/opera-house-tour/duration<br>attractions/hospital-in-the-rock/duration<br>experiences/danube-legend-cruise/duration | ساعة | 1 hour | שעה |
| attractions/opera-house-tour/tip | الجولات بالإنجليزي كل يوم 13:30 و15:00 و16:30، أقصى 30 شخص، وبتبدأ من مكتب المعلومات بالمدخل. التذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض، والقاعة بتسكّر وقت البروفات (المسار بيتغير). | Tours in English every day at 13:30, 15:00 and 16:30, up to 30 people, starting from the information desk at the entrance. Tickets are released a week ahead. No tours during performances, and the auditorium closes during rehearsals (the route changes). | סיורים באנגלית כל יום ב־13:30, 15:00 ו־16:30, עד 30 משתתפים, ומתחילים בדלפק המידע שבכניסה. הכרטיסים יוצאים למכירה שבוע מראש. אין סיורים בזמן הופעות, והאולם נסגר בזמן חזרות (המסלול משתנה). |
| attractions/opera-house-tour/priceText | 12,000 HUF (للشخص، بالإنجليزي) | 12,000 HUF (per person, in English) | 12,000 HUF (לאדם, באנגלית) |
| attractions/citadella/description | الحديقة والإطلالات وتمثال الحرية فوق تلة Gellért. المعرض جوا تذكرة اختيارية. | The park, the views and the Liberty Statue on Gellért Hill. The exhibition inside is an optional ticket. | הפארק, הנופים ופסל החירות על גבעת Gellért. התערוכה בפנים בכרטיס נפרד, לפי בחירה. |
| attractions/citadella/whyRecommend | إطلالة على الجسور والقلعة والبرلمان. | A view of the bridges, the castle and the Parliament. | נוף לגשרים, לטירה ולפרלמנט. |
| attractions/citadella/duration | 45 دقيقة | 45 minutes | 45 דקות |
| attractions/citadella/tip | الحديقة ببلاش: نوفمبر–مارس 8:00–22:00، أبريل–أكتوبر 6:00–24:00. معرض «A Szabadság Bástyája» 4,900 HUF للبالغ بموعد دخول، آخر دخول 16:40 (الجمعة 18:40). | The park is free: November–March 8:00–22:00, April–October 6:00–24:00. The exhibition “A Szabadság Bástyája” is 4,900 HUF per adult with a timed entry, last entry 16:40 (Friday 18:40). | הפארק בחינם: נובמבר–מרץ 8:00–22:00, אפריל–אוקטובר 6:00–24:00. התערוכה „A Szabadság Bástyája“ 4,900 HUF למבוגר עם שעת כניסה, כניסה אחרונה 16:40 (שישי 18:40). |
| attractions/citadella/hours.display | الحديقة: نوفمبر–مارس 8:00–22:00 · أبريل–أكتوبر 6:00–24:00 | Park: November–March 8:00–22:00 · April–October 6:00–24:00 | הפארק: נובמבר–מרץ 8:00–22:00 · אפריל–אוקטובר 6:00–24:00 |
| attractions/heroes-square/description | الساحة الكبيرة على مدخل حديقة المدينة، بنصب الألفية. | The large square at the entrance to City Park, with the Millennium Monument. | הכיכר הגדולה בכניסה לפארק העיר, עם אנדרטת המילניום. |
| attractions/heroes-square/whyRecommend | من أشهر ساحات المدينة، وبداية طبيعية لحديقة المدينة. | One of the city's best-known squares, and a natural start to City Park. | אחת הכיכרות המוכרות בעיר, ונקודת התחלה טבעית לפארק העיר. |
| attractions/heroes-square/duration<br>attractions/vajdahunyad-castle/duration | 20 دقيقة | 20 minutes | 20 דקות |
| attractions/vajdahunyad-castle/description | قلعة رومانسية على بحيرة حديقة المدينة، من برا. | A romantic castle on the City Park lake, seen from outside. | טירה רומנטית על אגם פארק העיר, מבחוץ. |
| attractions/vajdahunyad-castle/whyRecommend | مشي جميل بالحديقة وصور. | A pleasant walk in the park, and photos. | הליכה נעימה בפארק, ותמונות. |
| attractions/budapest-zoo/description | من أقدم حدائق الحيوان بالعالم، وفيها Biodome وبيت النخيل وأكواريوم ضمن التذكرة. | One of the oldest zoos in the world, with the Biodome, the Palm House and an aquarium included in the ticket. | אחד מגני החיות הוותיקים בעולם, עם ה־Biodome, בית הדקלים ואקווריום שכלולים בכרטיס. |
| attractions/budapest-zoo/whyRecommend | نص يوم ممتع لكل الأعمار. | A fun half day for all ages. | חצי יום מהנה לכל הגילים. |
| attractions/budapest-zoo/tip | مفتوحة كل يوم من السنة. الساعات حسب الشهر (من 31 أكتوبر لآخر فبراير 9:00–16:00 وآخر دخول 15:00). تحت 14 سنة ما بيدخلوا بدون بالغ. | Open every day of the year. Hours depend on the month (from 31 October to the end of February 9:00–16:00, last entry 15:00). Under-14s cannot enter without an adult. | פתוח כל יום בשנה. השעות לפי החודש (מ־31 באוקטובר עד סוף פברואר 9:00–16:00, כניסה אחרונה 15:00). ילדים מתחת לגיל 14 לא נכנסים בלי מבוגר. |
| attractions/budapest-zoo/priceText | 5,900 HUF (بالغ) · طفل 2–18: 4,200 | 5,900 HUF (adult) · child 2–18: 4,200 | 5,900 HUF (מבוגר) · ילד 2–18: 4,200 |
| attractions/budapest-zoo/hours.display | يناير–فبراير 9–16 · مارس 9–17 (ويكند 17:30) · أبريل 9–17:30 (ويكند 18) · مايو–أغسطس 9–18 (ويكند 19) · سبتمبر 9–17:30 (ويكند 18) · أكتوبر 9–17 (ويكند 17:30) · 31 أكتوبر–ديسمبر 9–16 · آخر دخول قبل ساعة | January–February 9–16 · March 9–17 (weekends 17:30) · April 9–17:30 (weekends 18) · May–August 9–18 (weekends 19) · September 9–17:30 (weekends 18) · October 9–17 (weekends 17:30) · 31 October–December 9–16 · last entry one hour before closing | ינואר–פברואר 9–16 · מרץ 9–17 (סופ״ש 17:30) · אפריל 9–17:30 (סופ״ש 18) · מאי–אוגוסט 9–18 (סופ״ש 19) · ספטמבר 9–17:30 (סופ״ש 18) · אוקטובר 9–17 (סופ״ש 17:30) · 31 באוקטובר–דצמבר 9–16 · כניסה אחרונה שעה לפני הסגירה |
| attractions/house-of-music/description | معرض تفاعلي عن تاريخ الموسيقى الأوروبية والمجرية، بسماعات وبمسارك، تحت مبنى بيت الموسيقى بحديقة المدينة. | An interactive exhibition on the history of European and Hungarian music, with headphones and at your own pace, under the House of Music building in City Park. | תערוכה אינטראקטיבית על תולדות המוזיקה האירופית וההונגרית, עם אוזניות ובקצב שלכם, מתחת לבניין בית המוזיקה בפארק העיר. |
| attractions/house-of-music/whyRecommend | تجربة صوتية مختلفة، وبدون حدود عمر. | A different sound experience, with no age limit. | חוויית שמע אחרת, בלי הגבלת גיל. |
| attractions/house-of-music/duration | ساعتين (المتحف بيقترح 2–3 ساعات) | 2 hours (the museum suggests 2–3 hours) | שעתיים (המוזיאון ממליץ על 2–3 שעות) |
| attractions/house-of-music/tip | الدخول بفترات كل نص ساعة (10:15، 10:45...)؛ آخر دخول 16:15 (الجمعة 17:45). مسكّر الإثنين وأول ثلاثاء بكل شهر. تذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية. | Entry in half-hour slots (10:15, 10:45...); last entry 16:15 (Friday 17:45). Closed on Mondays and on the first Tuesday of every month. Weekend tickets sell out fast. The cloakroom is mandatory. | הכניסה במשבצות של חצי שעה (10:15, 10:45...); כניסה אחרונה 16:15 (שישי 17:45). סגור בימי שני ובשלישי הראשון של כל חודש. כרטיסים לסופ״ש נגמרים מהר. השימוש במלתחה חובה. |
| attractions/margaret-island/description | جزيرة خضرا بنص الدانوب: حدائق وممرات وبرج المي. | A green island in the middle of the Danube: gardens, paths and the water tower. | אי ירוק באמצע הדנובה: גנים, שבילים ומגדל המים. |
| attractions/margaret-island/whyRecommend | أكبر مساحة خضرا بوسط المدينة، ومشي هادي. | The largest green space in the city centre, and a calm walk. | השטח הירוק הגדול ביותר במרכז העיר, והליכה שקטה. |
| attractions/margaret-island/tip | النقطة بالخطة عند النافورة. مواعيد النافورة الموسيقية والحديقة اليابانية ما تحققنا منها. | The point in the plan is at the fountain. We have not verified the times of the musical fountain or the Japanese Garden. | הנקודה בתוכנית היא ליד המזרקה. לא אימתנו את השעות של המזרקה המוזיקלית ושל הגן היפני. |
| attractions/szechenyi-bath/description | أشهر حمّام حراري ببودابست، مسابح داخلية وخارجية، مختلط بلباس سباحة. | Budapest's most famous thermal bath: indoor and outdoor pools, mixed, in swimwear. | המרחץ התרמי המפורסם ביותר בבודפשט: בריכות פנימיות וחיצוניות, מעורב, בבגד ים. |
| attractions/szechenyi-bath/whyRecommend | تجربة الحمّامات الحرارية. | The thermal bath experience. | חוויית המרחצאות התרמיים. |
| attractions/szechenyi-bath/duration | 2.5–3 ساعات | 2.5–3 hours | 2.5–3 שעות |
| attractions/szechenyi-bath/tip | ⚠️ بشرط: ممنوع تحت 14 سنة من 1 أغسطس 2025 (إلا بشهادة طبية موافق عليها مسبقًا). مختلط، بلباس سباحة مخصص بس (منه البوركيني). التذاكر الأونلاين ما بترجع ولا بتتغير. | ⚠️ Conditions: no entry under 14 since 1 August 2025 (unless with a medical certificate approved in advance). Mixed, in proper swimwear only (burkini included). Online tickets cannot be refunded or changed. | ⚠️ בתנאי: אסור מתחת לגיל 14 מ־1 באוגוסט 2025 (אלא עם אישור רפואי שאושר מראש). מעורב, רק בבגד ים ייעודי (כולל בורקיני). כרטיסים מקוונים אינם ניתנים להחזר או לשינוי. |
| attractions/szechenyi-bath/priceText | 13,200 HUF (الإثنين–الخميس) · 14,800 (الجمعة والويكند) · 15,800 (الأعياد) | 13,200 HUF (Monday–Thursday) · 14,800 (Friday and weekends) · 15,800 (holidays) | 13,200 HUF (שני–חמישי) · 14,800 (שישי וסופ״ש) · 15,800 (חגים) |
| attractions/hospital-in-the-rock/description | مستشفى وملجأ نووي تحت تلة القلعة، بجولة مرشدة 60 دقيقة. | A hospital and nuclear bunker under Castle Hill, visited on a 60-minute guided tour. | בית חולים ומקלט גרעיני מתחת לגבעת הטירה, בסיור מודרך של 60 דקות. |
| attractions/hospital-in-the-rock/whyRecommend | تاريخ الحرب العالمية الثانية والحرب الباردة. | History of World War II and the Cold War. | ההיסטוריה של מלחמת העולם השנייה והמלחמה הקרה. |
| attractions/hospital-in-the-rock/tip | ⚠️ بشرط: ممنوع تحت 6 سنين، ومش منصوح فيه تحت 12. بجولة بس، كل يوم 10:00–19:00 وآخر جولة 18:00؛ مواعيد الجولات بالضبط ما تحققنا منها، فما انحطت بالجدول. البرنامج بالإنجليزي 30 EUR للبالغ بيندفع بالفورنت. | ⚠️ Conditions: no entry under 6, and not recommended under 12. By tour only, every day 10:00–19:00, last tour 18:00; we have not verified the exact tour times, so it is not in the schedule. The English programme is 30 EUR per adult, paid in forints. | ⚠️ בתנאי: אסור מתחת לגיל 6, ולא מומלץ מתחת לגיל 12. רק בסיור, כל יום 10:00–19:00, הסיור האחרון ב־18:00; לא אימתנו את שעות הסיורים המדויקות, ולכן הוא לא בלוח הזמנים. התוכנית באנגלית 30 EUR למבוגר, בתשלום בפורינטים. |
| attractions/hospital-in-the-rock/priceText | 30 EUR (بالغ، بالإنجليزي، بيندفع بالفورنت) | 30 EUR (adult, in English, paid in forints) | 30 EUR (מבוגר, באנגלית, בתשלום בפורינטים) |
| experiences/danube-legend-cruise/description | رحلة مسائية ساعة على الدانوب بدليل صوتي، فيها مشروب واحد (منها مي أو مشروب غازي). | A one-hour evening cruise on the Danube with an audio guide, including one drink (water or a soft drink are among the choices). | שייט ערב של שעה על הדנובה עם מדריך קולי, כולל משקה אחד (אפשר גם מים או משקה קל). |
| experiences/danube-legend-cruise/priceText | 25 EUR (بالغ) · تحت 10 ببلاش | 25 EUR (adult) · under 10 free | 25 EUR (מבוגר) · מתחת לגיל 10 בחינם |
| experiences/danube-legend-cruise/hours.display | رحلات مسائية كل 20 دقيقة (جدول 2026 حسب الفترة): 25 أكتوبر–22 نوفمبر من 16:20 لـ21:00 · 23 نوفمبر–31 ديسمبر من 15:40 لـ21:00 · 24 ديسمبر بدون رحلات مسائية · 2027 مش منشور | Evening cruises every 20 minutes (2026 schedule, by period): 25 October–22 November from 16:20 to 21:00 · 23 November–31 December from 15:40 to 21:00 · 24 December no evening cruises · 2027 not published | שייט ערב כל 20 דקות (לוח 2026 לפי תקופה): 25 באוקטובר–22 בנובמבר מ־16:20 עד 21:00 · 23 בנובמבר–31 בדצמבר מ־15:40 עד 21:00 · 24 בדצמבר אין שייט ערב · 2027 לא פורסם |
| foodCategories/local/label | مطبخ هنغاري | Hungarian cuisine | מטבח הונגרי |
| foodPlaces/hungarikum-bisztro/why | مطبخ هنغاري بيتي قرب البرلمان، بحجز من موقعه. | Home-style Hungarian cooking near the Parliament; book on its website. | מטבח הונגרי ביתי ליד הפרלמנט, בהזמנה דרך האתר שלו. |
| foodPlaces/menza/why | مطعم هنغاري وعالمي بساحة Liszt Ferenc، وقائمة غدا يومية. | A Hungarian and international restaurant on Liszt Ferenc Square, with a daily lunch menu. | מסעדה הונגרית ובינלאומית בכיכר Liszt Ferenc, עם תפריט צהריים יומי. |
| foodPlaces/frici-papa/why | أكل هنغاري بيتي بسيط. | Simple home-style Hungarian food. | אוכל הונגרי ביתי ופשוט. |
| foodPlaces/21-restaurant/why | مطبخ هنغاري معاصر بتلة القلعة. | Contemporary Hungarian cuisine on Castle Hill. | מטבח הונגרי עכשווי בגבעת הטירה. |
| foodPlaces/pierrot/why | مطعم هنغاري عائلي بتلة القلعة. | A family-run Hungarian restaurant on Castle Hill. | מסעדה הונגרית משפחתית בגבעת הטירה. |
| foodPlaces/new-york-cafe/why | مقهى تاريخي فخم، وفيه مطبخ ساخن من 12:00. | A grand historic café, with a hot kitchen from 12:00. | בית קפה היסטורי מפואר, עם מטבח חם מ־12:00. |
| foodPlaces/gundel/why | مطعم للمأكولات الهنغارية قرب حديقة الحيوانات في حديقة المدينة، يقدّم قائمة غداء يومية. | A Hungarian restaurant near the Zoo in City Park, with a daily lunch menu. | מסעדה הונגרית ליד גן החיות בפארק העיר, עם תפריט צהריים יומי. |
| foodPlaces/varosliget-cafe/why | مطعم ومقهى قرب البحيرة وقلعة فاجداهونياد في حديقة المدينة، يقدّم شوربات وأطباقًا رئيسية. | A restaurant and café near the lake and Vajdahunyad Castle in City Park, serving soups and main dishes. | מסעדה ובית קפה ליד האגם וטירת Vajdahunyad בפארק העיר, עם מרקים ומנות עיקריות. |
| foodPlaces/gerbeaud/why | مقهى وحلويات تاريخي من القرن 19. | A historic café and pastry shop from the 19th century. | בית קפה וקונדיטוריה היסטוריים מהמאה ה־19. |
| shoppingAreas/great-market-hall/bestFor | منتجات مجرية: فلفل أحمر وحلويات وتذكارات | Hungarian products: paprika, sweets and souvenirs | מוצרים הונגריים: פפריקה, ממתקים ומזכרות |
| shoppingAreas/great-market-hall/description | السوق المركزي الكبير: طابق أرضي للمنتجات وطابق علوي للتذكارات. | The large central market: food on the ground floor, souvenirs upstairs. | השוק המרכזי הגדול: תוצרת בקומת הקרקע ומזכרות בקומה העליונה. |
| shoppingAreas/vaci-utca/bestFor | شارع مشاة ومحلات | Pedestrian street and shops | מדרחוב וחנויות |
| shoppingAreas/vaci-utca/description | أشهر شارع مشاة للتسوق بوسط Pest. | The best-known pedestrian shopping street in central Pest. | רחוב הקניות להולכי רגל המוכר ביותר במרכז Pest. |
| shoppingAreas/andrassy-avenue/bestFor | ماركات عالمية | International brands | מותגים בינלאומיים |
| shoppingAreas/andrassy-avenue/description | الجادة الكبيرة من وسط المدينة لساحة الأبطال، فيها محلات ماركات بأولها. | The grand avenue from the city centre to Heroes' Square, with brand shops along its first part. | השדרה הגדולה ממרכז העיר עד כיכר הגיבורים, עם חנויות מותגים בחלקה הראשון. |
| shoppingAreas/gozsdu-udvar/bestFor | ممر محلات ومقاهي | A passage of shops and cafés | מעבר של חנויות ובתי קפה |
| shoppingAreas/gozsdu-udvar/description | ممر بين Király utca وDob utca بالحي اليهودي. | A passage between Király utca and Dob utca in the Jewish Quarter. | מעבר בין Király utca ל־Dob utca ברובע היהודי. |
| shoppingAreas/arena-mall/description | مركز تسوق كبير جنب محطة Keleti. | A large shopping centre next to Keleti station. | מרכז קניות גדול ליד תחנת Keleti. |

## 5. Display issues seen in the UI check

**Fixed in round 8 (709278c), display only:** times and number ranges inside texts are isolated left-to-right runs in the Budapest
plan view, so both rows below now read correctly in Arabic and Hebrew (measured in the browser). The stored texts are unchanged.

| Text | Issue (before round 8) |
|---|---|
| «⚠️ مشروطة بالحجز: الجولات بس 13:30 و15:00 و16:30 …», «الجولات بس 13:30 و15:00 و16:30: …» | «و» glued to a time renders out of order in RTL («15:00و»). A space after «و» (as in titles) would fix the display; it changes the Arabic source, so the English / Hebrew entries would move with it. |
| «⚠️ الدخول بفترة محجوزة كل نص ساعة (:15 و:45) …», «الدخول بفترات كل نص ساعة (:15 و:45): …» | A time written as «:15» renders «15:» in RTL. |

## 6. New interface texts, round 8 (all cities' place cards unless noted; NOT reviewed by a person)

| Where | Arabic | English | Hebrew |
|---|---|---|---|
| Tour times (cards of places with listed sessions: today the Opera) | 🕒 مواعيد الجولات: | 🕒 Tour times: | 🕒 שעות הסיורים: |
| Under the tour times | الدخول بجولة بس، بموعد محجوز مسبقًا | Entry by tour only, booked in advance | כניסה בסיור בלבד, בהזמנה מראש |
| Badge on «must see» places (was English «Must See» in every language) | لا تفوّته | Must see | חובה לראות |
| Tickets counter, 1 / 2 / 3–10 / 11+ | + سعر واحد غير متوفر / + سعرين غير متوفرين / + N أسعار غير متوفرة / + N سعر غير متوفر | + 1 price not available / + N prices not available | + מחיר אחד לא זמין / + N מחירים לא זמינים |
| Photo credit under a place photo (Budapest; existing label) | 📷 حقوق الصورة: author · licence | 📷 Photo credit: … | 📷 קרדיט לתמונה: … |
| Credits page, under Budapest | كل صورة نسخة مصغّرة (960 بكسل) من الملف الأصلي على Wikimedia Commons، بدون أي تعديل تاني. | Each photo is a resized copy (960 px) of the original file on Wikimedia Commons, with no other change. | (page is Arabic + English) |

## 7. Close-out round (2026-11-16)

**Status:** the owner's wording (House of Music, the two English titles) is an AI language review, not a person's review, and not a new fact check. Everything else below is new and NOT reviewed by a person.

**Changed as the owner asked:**

| Where | Arabic | English | Hebrew (follows; not reviewed) |
|---|---|---|---|
| House of Music, slot note (`showWindow.missNoteAr`) | مواعيد الدخول كل نص ساعة، عند الدقيقة 15 و45. احجز الموعد اللي بناسب خطتك. | Timed entry every 30 minutes, at :15 and :45 past the hour. Book the entry time that fits your plan. | כניסה בזמנים קבועים כל 30 דקות, ב־:15 וב־:45 בכל שעה. הזמינו את שעת הכניסה שמתאימה לתוכנית שלכם. |
| Day title, 3+ parts (English only; two parts keep «&») | حديقة المدينة و Andrássy والأوبرا | City Park, Andrássy Avenue and the Opera | unchanged |
| Day title, 3+ parts | البرلمان والكاتدرائية وجزيرة Margaret | Parliament, St Stephen’s Basilica and Margaret Island | unchanged |

- **Not changed: "Depends on booking" → "Advance booking required"** (Opera warning, cruise warning). Advance booking is not a documented condition for either:
  - Opera: opera.hu (OperaTour page, read 2026-11-16) says «Tickets are available one week in advance at the box offices or online»; our data says «يفضل مسبقًا»;
  - cruise: the operator says reservations are "not required" but recommended (data `conflict`).
- **Unchanged on purpose:** the House of Music warning «⚠️ الدخول بفترة محجوزة كل نص ساعة (:15 و:45)، وتذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية.» (not part of the owner's wording).

**New texts:**

| Where | Arabic | English | Hebrew |
|---|---|---|---|
| Questionnaire, limit by city | خطط {city} حاليًا لحد {days}. | {city} plans are currently up to {days}. | התוכניות ל{city} הן כרגע עד {days}. |
| Questionnaire, limit by interests | إذا اخترت «{interests}» بس، خطة {city} حاليًا لحد {days}. | With only “{interests}”, a {city} plan is currently up to {days}. | עם „{interests}” בלבד, תוכנית ל{city} היא כרגע עד {days}. |
| Options, flexible dates | اختار {days} أو أقل. / اختار {days} أو أقل، أو ضيف اهتمام تاني. | Choose {days} or fewer. / Choose {days} or fewer, or add another interest. | בחרו {days} או פחות. / בחרו {days} או פחות, או הוסיפו תחום עניין נוסף. |
| Options, specific dates | قصّر التواريخ لحد {days}. / قصّر التواريخ لحد {days}، أو ضيف اهتمام تاني. | Shorten your dates to {days} or fewer. / … or add another interest. | קצרו את התאריכים עד {days}. / … או הוסיפו תחום עניין נוסף. |
| Buttons | خلّيها {days} · غيّر التواريخ | Make it {days} · Change dates | לקבוע {days} · שינוי תאריכים |
| Day counts | يوم واحد · يومين · {n} أيام | 1 day · 2 days · {n} days | יום אחד · יומיים · {n} ימים |
| National Museum hours (card) | مواعيد العطلة: 24–26 ديسمبر 2026 مسكّر · 31 ديسمبر 2026 10:00–14:00 · 1 يناير 2027 مسكّر · عطلة آخر السنة بالسنين الجاية: المواعيد مش منشورة لسا — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، الشباك بيسكّر 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر | Holiday hours: closed 24–26 December 2026 · 31 December 2026 10:00–14:00 · closed 1 January 2027 · year-end holidays in later years: hours not published yet — Regular hours: Tuesday–Sunday 10:00–18:00, the ticket office closes at 17:00, and the halls start closing at 17:30 · closed on Mondays | (catalog) |
| Suggestion reason, holiday hours not published (National Museum / National Gallery, Dec 2027 onwards) | اختياري: مواعيد العطلة لهاليوم مش منشورة لسا. تأكّد من موقع المتحف قبل ما تروح. | Optional: the holiday opening hours for this day are not published yet. Check the museum's website before you go. | אופציונלי: שעות הפתיחה בחג ליום הזה עדיין לא פורסמו. בדקו באתר המוזיאון לפני שאתם יוצאים. |

## 8. Before the Preview push (2026-11-16, owner's approval message)

**Status:** the owner's wording (Opera line, one-day text, "nature" label) is used as written. Everything else below is new and NOT reviewed by a person (the English and Hebrew are AI-written).

| Where | Arabic | English | Hebrew |
|---|---|---|---|
| Questionnaire, 1-day limit, flexible dates | اختار يوم واحد أو ضيف اهتمام تاني. (without interests: اختار يوم واحد.) | Choose 1 day, or add another interest. / Choose 1 day. | בחרו יום אחד, או הוסיפו תחום עניין נוסף. / בחרו יום אחד. |
| Questionnaire, 1-day limit, specific dates | خلّي الوصول والمغادرة بنفس اليوم، أو ضيف اهتمام تاني. (without interests: … بنفس اليوم.) | Make arrival and departure the same day, or add another interest. | קבעו הגעה ועזיבה באותו יום, או הוסיפו תחום עניין נוסף. |
| Interest group label, Budapest only (internal keys unchanged) | طبيعة وإطلالات | Nature & views | טבע ונופים |
| Opera card, under the tour times (shared text; today only the Opera lists tour times) | الدخول بجولة فقط، حسب المواعيد وتوفّر التذاكر. | Entry by guided tour only, subject to tour times and ticket availability. | כניסה בסיור מודרך בלבד, בהתאם לשעות הסיורים ולזמינות הכרטיסים. |
| Opera warning (was «⚠️ مشروطة بالحجز: …») | ⚠️ الجولات بس 13:30 و15:00 و16:30، حسب توفّر التذاكر، والتذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض. | ⚠️ Tours only at 13:30, 15:00 and 16:30, subject to ticket availability; tickets go on sale a week ahead. No tours during performances. | ⚠️ סיורים רק ב־13:30, 15:00 ו־16:30, בכפוף לזמינות הכרטיסים; הכרטיסים יוצאים למכירה שבוע מראש. אין סיורים בזמן הופעות. |
| Cruise warning (was «⚠️ مشروطة بالحجز: …»; reservations "not required") | ⚠️ الموعد المنشور مش ضمان مكان، حسب التوفّر. المشروب المشمول ممكن يكون مي أو مشروب غازي. | ⚠️ A published departure does not guarantee a place; it depends on availability. The included drink can be water or a soft drink. | ⚠️ מועד שפורסם אינו מבטיח מקום; זה תלוי בזמינות. המשקה הכלול יכול להיות מים או משקה קל. |
| House of Music warning (was «بفترة محجوزة») | ⚠️ الدخول بفترات كل نص ساعة (:15 و:45)، وتذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية. | ⚠️ Entry in half-hour slots (:15 and :45), and weekend tickets sell out fast. The cloakroom is mandatory. | ⚠️ כניסה במשבצות של חצי שעה (:15 ו־:45), וכרטיסים לסופ״ש נגמרים מהר. השימוש במלתחה חובה. |
| Suggestion reason, holiday hours unconfirmed (replaces the section 7 text) | اختياري: مواعيد العطلة لهاليوم مش مؤكدة. تأكّد من الموقع الرسمي قبل ما تروح. | Optional: the holiday opening hours for this day are not confirmed. Check the official website before you go. | אופציונלי: שעות הפתיחה בחג ליום הזה לא מאומתות. בדקו באתר הרשמי לפני שאתם יוצאים. |
| National Gallery hours (card; replaces the text approved 2026-11-14) | مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير): ما قدرنا نتأكد منها، تأكّد من موقع المتحف — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، آخر دخول 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر | Year-end holiday hours (24–26 and 31 December, 1 January): we could not confirm them; check the museum's website — Regular hours: … | שעות החגים בסוף השנה (24–26 ו־31 בדצמבר, 1 בינואר): לא הצלחנו לאמת אותן; בדקו באתר המוזיאון — שעות רגילות: … |
| House of Music hours (card; was a weekly table) | الثلاثاء–الأحد 10:15–17:50، الجمعة لحد 19:50 · آخر دخول 16:15 (الجمعة 17:45) · الإثنين وأول ثلاثاء بكل شهر مسكّر · مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير) مش مؤكدة | Tuesday–Sunday 10:15–17:50, Friday until 19:50 · last entry 16:15 (Friday 17:45) · closed on Mondays and on the first Tuesday of each month · year-end holiday hours (24–26 and 31 December, 1 January) not confirmed | שלישי–ראשון 10:15–17:50, שישי עד 19:50 · … · שעות החגים בסוף השנה … לא מאומתות |

**Kept on purpose:**
- «احجز الموعد اللي بيناسب خطتك» (Opera) and «احجز الموعد اللي بناسب خطتك» (House of Music, the owner's wording): advice, not a condition.
- The Parliament interior tip (a tour outside the plan, booked through the visitor centre).
- Prague's «مشروطة بالحجز» warnings (a published city, out of scope).
