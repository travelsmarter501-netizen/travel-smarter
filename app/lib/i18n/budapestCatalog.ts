/**
 * Budapest texts for the plan view (Arabic source -> English, Hebrew), the same lookup as planCatalog.ts: a text is translated only
 * when the stored Arabic is EXACTLY the source here. Budapest is not public (available: false).
 *
 * REVIEW STATUS (2026-11-15): the English and Hebrew were written by Claude (AI) and have NOT been reviewed by a person. Every entry
 * needs a native English and Hebrew review before launch (docs/budapest/texts-review.md). The Arabic sources are the place data and the
 * planner's own texts; the Arabic of the National Gallery hours and tip was approved by the owner (2026-11-14), their English and Hebrew
 * were not. No fact, time or price differs from the Arabic source.
 *
 * Generated first by docs/budapest/tools/bud-i18n.mts's extraction (round 7); edit entries here directly.
 */
import type { PlanCatalogEntry } from "./planCatalog";

/** Budapest place texts, keys `budapest/<collection>/<placeId>/<field>`. */
export const BUDAPEST_PLACE_TEXT: (PlanCatalogEntry & { keys: string[] })[] = [
  // 2026-11-16 (NOT reviewed): the gallery's year-end dates are no longer stated as fact (no kept evidence); replaces the 2026-11-14 text.
  { keys: ["budapest/attractions/hungarian-national-gallery/hours.display"], ar: "مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير): ما قدرنا نتأكد منها، تأكّد من موقع المتحف — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، آخر دخول 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر", en: "Year-end holiday hours (24–26 and 31 December, 1 January): we could not confirm them; check the museum's website — Regular hours: Tuesday–Sunday 10:00–18:00, last entry 17:00, and the halls start closing at 17:30 · closed on Mondays", he: "שעות החגים בסוף השנה (24–26 ו־31 בדצמבר, 1 בינואר): לא הצלחנו לאמת אותן; בדקו באתר המוזיאון — שעות רגילות: שלישי–ראשון 10:00–18:00, כניסה אחרונה 17:00, והאולמות מתחילים להיסגר ב־17:30 · סגור בימי שני" },
  { keys: ["budapest/attractions/house-of-music/hours.display"], ar: "الثلاثاء–الأحد 10:15–17:50، الجمعة لحد 19:50 · آخر دخول 16:15 (الجمعة 17:45) · الإثنين وأول ثلاثاء بكل شهر مسكّر · مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير) مش مؤكدة", en: "Tuesday–Sunday 10:15–17:50, Friday until 19:50 · last entry 16:15 (Friday 17:45) · closed on Mondays and on the first Tuesday of each month · year-end holiday hours (24–26 and 31 December, 1 January) not confirmed", he: "שלישי–ראשון 10:15–17:50, שישי עד 19:50 · כניסה אחרונה 16:15 (שישי 17:45) · סגור בימי שני ובשלישי הראשון של כל חודש · שעות החגים בסוף השנה (24–26 ו־31 בדצמבר, 1 בינואר) לא מאומתות" },
  { keys: ["budapest/attractions/hungarian-national-gallery/tip"], ar: "القبة مفتوحة ضمن ساعات المتحف ولحد 17:00 بالأكثر، حسب الطقس، ولحد 15 شخص بالمرة. الدخول ببلاش للكل 15 مارس و20 أغسطس و23 أكتوبر.", en: "The dome is open within the museum's hours, until 17:00 at the latest, weather permitting, for up to 15 people at a time. Entry is free for everyone on 15 March, 20 August and 23 October.", he: "הכיפה פתוחה בשעות המוזיאון ועד 17:00 לכל המאוחר, בהתאם למזג האוויר, עד 15 אנשים בכל פעם. הכניסה חופשית לכולם ב־15 במרץ, ב־20 באוגוסט וב־23 באוקטובר." },
  { keys: ["budapest/areas/lipotvaros/description"], ar: "حي البرلمان والكاتدرائية على ضفة Pest.", en: "The district of the Parliament and St Stephen's Basilica, on the Pest bank.", he: "הרובע של הפרלמנט ובזיליקת סנט סטפן, על גדת Pest." },
  { keys: ["budapest/areas/belvaros/description"], ar: "وسط Pest القديم: Váci utca والسوق المركزي.", en: "Old central Pest: Váci utca and the Great Market Hall.", he: "מרכז Pest הישן: Váci utca והשוק המרכזי." },
  { keys: ["budapest/areas/castle-hill/description"], ar: "تلة القلعة على ضفة Buda.", en: "Castle Hill, on the Buda bank.", he: "גבעת הטירה, על גדת Buda." },
  { keys: ["budapest/areas/gellert-hill/description"], ar: "تلة Gellért وCitadella فوق النهر.", en: "Gellért Hill and the Citadella above the river.", he: "גבעת Gellért וה־Citadella מעל הנהר." },
  { keys: ["budapest/areas/terezvaros/description"], ar: "شارع Andrássy ودار الأوبرا.", en: "Andrássy Avenue and the Opera House.", he: "שדרות Andrássy ובית האופרה." },
  { keys: ["budapest/areas/erzsebetvaros/description"], ar: "الحي اليهودي التاريخي.", en: "The historic Jewish Quarter.", he: "הרובע היהודי ההיסטורי." },
  { keys: ["budapest/areas/palotanegyed/description"], ar: "حي المتحف الوطني.", en: "The National Museum district.", he: "רובע המוזיאון הלאומי." },
  { keys: ["budapest/areas/city-park/description"], ar: "حديقة المدينة وساحة الأبطال.", en: "City Park and Heroes' Square.", he: "פארק העיר וכיכר הגיבורים." },
  { keys: ["budapest/areas/margaret-island/description"], ar: "الجزيرة الخضرا بنص الدانوب.", en: "The green island in the middle of the Danube.", he: "האי הירוק באמצע הדנובה." },
  { keys: ["budapest/attractions/st-stephens-basilica/description"], ar: "أكبر كنيسة ببودابست. الزيارة بالخطة: الكنيسة مع التراس البانورامي فوق القبة (تذكرة مشتركة).", en: "Budapest's largest church. The visit in the plan: the church plus the panoramic terrace above the dome (combined ticket).", he: "הכנסייה הגדולה בבודפשט. הביקור בתוכנית: הכנסייה יחד עם המרפסת הפנורמית מעל הכיפה (כרטיס משולב)." },
  { keys: ["budapest/attractions/st-stephens-basilica/whyRecommend"], ar: "من أعلى الإطلالات على Pest، وجنب البرلمان مشيًا.", en: "One of the highest viewpoints over Pest, within walking distance of the Parliament.", he: "אחת מנקודות התצפית הגבוהות ביותר על Pest, במרחק הליכה מהפרלמנט." },
  { keys: ["budapest/attractions/st-stephens-basilica/tip"], ar: "الكنيسة الإثنين–السبت 9:00–18:00 والأحد من 13:00 بس؛ التراس والخزنة كل يوم 9:00–19:00. التذكرة المشتركة 6,800 HUF للبالغ (الكنيسة لحالها 2,600). آخر دخول مش منشور.", en: "The church: Monday–Saturday 9:00–18:00, Sunday from 13:00 only; the terrace and treasury every day 9:00–19:00. The combined ticket is 6,800 HUF per adult (the church alone 2,600). Last entry is not published.", he: "הכנסייה: שני–שבת 9:00–18:00, וראשון רק מ־13:00; המרפסת והאוצר כל יום 9:00–19:00. הכרטיס המשולב 6,800 HUF למבוגר (הכנסייה לבד 2,600). שעת הכניסה האחרונה לא מפורסמת." },
  { keys: ["budapest/attractions/st-stephens-basilica/priceText"], ar: "6,800 HUF (بالغ، الكنيسة والتراس) · الكنيسة لحالها 2,600 HUF", en: "6,800 HUF (adult, church and terrace) · church only 2,600 HUF", he: "6,800 HUF (מבוגר, כנסייה ומרפסת) · כנסייה בלבד 2,600 HUF" },
  { keys: ["budapest/attractions/parliament-exterior/description"], ar: "مبنى البرلمان من الخارج، من ساحة Kossuth وضفة الدانوب. الزيارة الداخلية بجولة وحجز، ومش ضمن الخطة.", en: "The Parliament building from outside, from Kossuth Square and the Danube bank. Visiting inside needs a booked tour and is not part of the plan.", he: "בניין הפרלמנט מבחוץ, מכיכר Kossuth ומגדת הדנובה. ביקור בפנים דורש סיור בהזמנה ואינו חלק מהתוכנית." },
  { keys: ["budapest/attractions/parliament-exterior/whyRecommend"], ar: "أشهر مبنى ببودابست.", en: "Budapest's most famous building.", he: "הבניין המפורסם ביותר בבודפשט." },
  { keys: ["budapest/attractions/parliament-exterior/tip"], ar: "الجولة الداخلية بحجز مسبق من مركز الزوار؛ سعرها ومواعيدها ما قدرنا نتحقق منهم من المصدر الرسمي، فهي خيار إضافي إلك.", en: "The inside tour is booked in advance through the visitor centre; we could not confirm its price and times from the official source, so it is an extra option for you.", he: "הסיור בפנים מוזמן מראש דרך מרכז המבקרים; לא הצלחנו לאמת את המחיר והשעות שלו מהמקור הרשמי, ולכן זו אפשרות נוספת בשבילכם." },
  { keys: ["budapest/attractions/shoes-on-the-danube/description"], ar: "نصب تذكاري لضحايا 1944–1945 على ضفة الدانوب، جنب البرلمان.", en: "A memorial to the victims of 1944–1945 on the Danube bank, next to the Parliament.", he: "אנדרטה לזכר קורבנות 1944–1945 על גדת הדנובה, ליד הפרלמנט." },
  { keys: ["budapest/attractions/shoes-on-the-danube/whyRecommend"], ar: "محطة قصيرة ومؤثرة على طريق البرلمان.", en: "A short, moving stop on the way to the Parliament.", he: "עצירה קצרה ומרגשת בדרך לפרלמנט." },
  { keys: ["budapest/attractions/shoes-on-the-danube/duration"], ar: "10 دقائق", en: "10 minutes", he: "10 דקות" },
  { keys: ["budapest/attractions/shoes-on-the-danube/tip"], ar: "على الرصيف النهري، بين البرلمان وجسر السلاسل.", en: "On the riverside embankment, between the Parliament and the Chain Bridge.", he: "על הטיילת שלאורך הנהר, בין הפרלמנט לגשר השלשלאות." },
  { keys: ["budapest/attractions/chain-bridge/description"], ar: "أقدم جسر ثابت على الدانوب ببودابست، بين Pest وتلة القلعة.", en: "The oldest permanent bridge over the Danube in Budapest, between Pest and Castle Hill.", he: "הגשר הקבוע הוותיק ביותר על הדנובה בבודפשט, בין Pest לגבעת הטירה." },
  { keys: ["budapest/attractions/chain-bridge/whyRecommend"], ar: "المشي عليه طريق طبيعي من Pest للقلعة.", en: "Walking across it is the natural way from Pest to the castle.", he: "ההליכה עליו היא הדרך הטבעית מ־Pest לטירה." },
  { keys: ["budapest/attractions/chain-bridge/duration","budapest/attractions/matthias-church-exterior/duration"], ar: "15 دقيقة", en: "15 minutes", he: "15 דקות" },
  { keys: ["budapest/attractions/fishermans-bastion/description"], ar: "تراسات وأبراج فوق تلة القلعة بإطلالة على البرلمان والدانوب.", en: "Terraces and towers on Castle Hill overlooking the Parliament and the Danube.", he: "מרפסות ומגדלים על גבעת הטירה עם נוף לפרלמנט ולדנובה." },
  { keys: ["budapest/attractions/fishermans-bastion/whyRecommend"], ar: "أشهر إطلالة ببودابست.", en: "Budapest's most famous view.", he: "הנוף המפורסם ביותר בבודפשט." },
  { keys: ["budapest/attractions/fishermans-bastion/tip"], ar: "التراسات مفتوحة كل السنة. الأبراج والتراسات العليا مدفوعة بس من 9:00 لـ19:00 (من 1 يونيو لـ30 سبتمبر لـ21:00)، وببلاش برّا هالساعات وبالأعياد الوطنية و24–31 ديسمبر (جدول 2026). الدفع بالكرت.", en: "The terraces are open all year. The towers and upper terraces are paid only from 9:00 to 19:00 (from 1 June to 30 September until 21:00), and free outside those hours, on national holidays and on 24–31 December (2026 schedule). Payment by card.", he: "המרפסות פתוחות כל השנה. המגדלים והמרפסות העליונות בתשלום רק מ־9:00 עד 19:00 (מ־1 ביוני עד 30 בספטמבר עד 21:00), וללא תשלום מחוץ לשעות האלה, בחגים הלאומיים וב־24–31 בדצמבר (לוח 2026). התשלום בכרטיס." },
  { keys: ["budapest/attractions/fishermans-bastion/priceText"], ar: "1,700 HUF (التراسات العليا بساعات الدفع؛ فئة السعر مش مكتوبة)", en: "1,700 HUF (upper terraces during the paid hours; the price category is not stated)", he: "1,700 HUF (המרפסות העליונות בשעות התשלום; קטגוריית המחיר לא מצוינת)" },
  { keys: ["budapest/attractions/matthias-church-exterior/description"], ar: "الكنيسة القوطية بسقفها الملون، من الساحة جنب حصن الصيادين. الدخول لجوا خيار إضافي.", en: "The Gothic church with its colourful roof, seen from the square next to Fisherman's Bastion. Going inside is an extra option.", he: "הכנסייה הגותית עם הגג הצבעוני, מהכיכר שליד מבצר הדייגים. הכניסה פנימה היא אפשרות נוספת." },
  { keys: ["budapest/attractions/matthias-church-exterior/whyRecommend"], ar: "من أجمل مباني تلة القلعة، وعلى بعد خطوات من الحصن.", en: "One of the most beautiful buildings on Castle Hill, a few steps from the Bastion.", he: "אחד הבניינים היפים בגבעת הטירה, כמה צעדים מהמבצר." },
  { keys: ["budapest/attractions/matthias-church-exterior/tip"], ar: "الدخول لجوا 3,400 HUF (بالغ). موقع الكنيسة بينشر ساعات «اليوم» بس (13 نوفمبر: 9:00–17:00، آخر دخول 16:45)، والطقوس والوفود لها أولوية، فما حطّينا الدخول بالجدول. البرج تذكرة بموعد (197 درجة).", en: "Entry inside is 3,400 HUF (adult). The church's website publishes only “today's” hours (13 November: 9:00–17:00, last entry 16:45), and services and groups take priority, so we did not put the visit inside in the schedule. The tower is a timed ticket (197 steps).", he: "הכניסה פנימה 3,400 HUF (מבוגר). אתר הכנסייה מפרסם רק את שעות „היום“ (13 בנובמבר: 9:00–17:00, כניסה אחרונה 16:45), ולטקסים ולקבוצות יש עדיפות, ולכן לא הכנסנו את הביקור בפנים ללוח הזמנים. המגדל בכרטיס עם שעת כניסה (197 מדרגות)." },
  { keys: ["budapest/attractions/hungarian-national-gallery/description"], ar: "الفن المجري من القرون الوسطى لليوم، بقصر بودا. التذكرة بتشمل القبة (54 درجة) حسب الطقس.", en: "Hungarian art from the Middle Ages to today, in Buda Castle. The ticket includes the dome (54 steps), weather permitting.", he: "אמנות הונגרית מימי הביניים ועד היום, בארמון Buda. הכרטיס כולל את הכיפה (54 מדרגות), בהתאם למזג האוויר." },
  { keys: ["budapest/attractions/hungarian-national-gallery/whyRecommend"], ar: "أكبر مجموعة فن مجري، ومن القبة إطلالة على المدينة.", en: "The largest collection of Hungarian art, and a view of the city from the dome.", he: "האוסף הגדול ביותר של אמנות הונגרית, ומהכיפה נוף על העיר." },
  { keys: ["budapest/attractions/hungarian-national-gallery/duration"], ar: "ساعتين تقريبًا (المتحف بيقترح 1.5–3 ساعات)", en: "About 2 hours (the museum suggests 1.5–3 hours)", he: "כשעתיים (המוזיאון ממליץ על 1.5–3 שעות)" },
  { keys: ["budapest/attractions/hungarian-national-gallery/priceText"], ar: "5,800 HUF (بالغ، كامل) · مخفّض 2,900 حسب العمر", en: "5,800 HUF (adult, full price) · reduced 2,900 by age", he: "5,800 HUF (מבוגר, מחיר מלא) · מוזל 2,900 לפי גיל" },
  { keys: ["budapest/attractions/hungarian-national-museum/hours.display"], ar: "مواعيد العطلة: 24–26 ديسمبر 2026 مسكّر · 31 ديسمبر 2026 10:00–14:00 · 1 يناير 2027 مسكّر · عطلة آخر السنة بالسنين الجاية: المواعيد مش منشورة لسا — المواعيد العادية: الثلاثاء–الأحد 10:00–18:00، الشباك بيسكّر 17:00، والقاعات بتبلش تسكّر 17:30 · الإثنين مسكّر", en: "Holiday hours: closed 24–26 December 2026 · 31 December 2026 10:00–14:00 · closed 1 January 2027 · year-end holidays in later years: hours not published yet — Regular hours: Tuesday–Sunday 10:00–18:00, the ticket office closes at 17:00, and the halls start closing at 17:30 · closed on Mondays", he: "שעות החגים: סגור ב־24–26 בדצמבר 2026 · 31 בדצמבר 2026 10:00–14:00 · סגור ב־1 בינואר 2027 · חגי סוף השנה בשנים הבאות: השעות עדיין לא פורסמו — שעות רגילות: שלישי–ראשון 10:00–18:00, הקופה נסגרת ב־17:00, והאולמות מתחילים להיסגר ב־17:30 · סגור בימי שני" },
  { keys: ["budapest/attractions/hungarian-national-museum/description"], ar: "تاريخ هنغاريا من العصور القديمة لليوم، بمبنى كلاسيكي.", en: "Hungary's history from ancient times to today, in a classical building.", he: "ההיסטוריה של הונגריה מהעת העתיקה ועד היום, בבניין קלאסי." },
  { keys: ["budapest/attractions/hungarian-national-museum/whyRecommend"], ar: "أهم متحف تاريخي بالمدينة.", en: "The city's most important history museum.", he: "מוזיאון ההיסטוריה החשוב ביותר בעיר." },
  { keys: ["budapest/attractions/hungarian-national-museum/tip"], ar: "الشباك لحد 17:00. في قاعات مسكّرة للترميم من 2 ديسمبر 2025، ومعطف التتويج مسكّر حاليًا (حسب موقع المتحف).", en: "Ticket desk until 17:00. Some halls have been closed for renovation since 2 December 2025, and the Coronation Mantle display is currently closed (according to the museum's website).", he: "הקופה פתוחה עד 17:00. חלק מהאולמות סגורים לשיפוץ מ־2 בדצמבר 2025, ותצוגת גלימת ההכתרה סגורה כרגע (לפי אתר המוזיאון)." },
  { keys: ["budapest/attractions/hungarian-national-museum/priceText"], ar: "3,500 HUF (بالغ، كامل) · المخفّض لمواطني هنغاريا وEEA بس", en: "3,500 HUF (adult, full price) · reduced price only for citizens of Hungary and the EEA", he: "3,500 HUF (מבוגר, מחיר מלא) · מחיר מוזל רק לאזרחי הונגריה וה־EEA" },
  { keys: ["budapest/attractions/museum-of-fine-arts/description"], ar: "مصر القديمة والعصور الكلاسيكية والفن الأوروبي لحد 1800، بساحة الأبطال.", en: "Ancient Egypt, classical antiquity and European art up to 1800, on Heroes' Square.", he: "מצרים העתיקה, העת הקלאסית ואמנות אירופית עד 1800, בכיכר הגיבורים." },
  { keys: ["budapest/attractions/museum-of-fine-arts/whyRecommend"], ar: "من أكبر متاحف الفن بأوروبا الوسطى.", en: "One of the largest art museums in Central Europe.", he: "אחד ממוזיאוני האמנות הגדולים במרכז אירופה." },
  { keys: ["budapest/attractions/museum-of-fine-arts/tip"], ar: "الدخول لحد 17:00. جمعة واحدة بالشهر (Museum and Slow) من 12:00 والدخول لحد 19:00. مسكّر 24 و25 ديسمبر (جدول 2026).", en: "Entry until 17:00. One Friday a month (Museum and Slow): from 12:00, with entry until 19:00. Closed on 24 and 25 December (2026 schedule).", he: "הכניסה עד 17:00. יום שישי אחד בחודש (Museum and Slow): מ־12:00, וכניסה עד 19:00. סגור ב־24 וב־25 בדצמבר (לוח 2026)." },
  { keys: ["budapest/attractions/museum-of-fine-arts/priceText"], ar: "5,800 HUF (بالغ، كامل) · المخفّض لمواطني EEA وأوكرانيا بس", en: "5,800 HUF (adult, full price) · reduced price only for citizens of the EEA and Ukraine", he: "5,800 HUF (מבוגר, מחיר מלא) · מחיר מוזל רק לאזרחי ה־EEA ואוקראינה" },
  { keys: ["budapest/attractions/opera-house-tour/description"], ar: "جولة مرشدة بالإنجليزي جوّا دار الأوبرا (60 دقيقة) مع حفلة قصيرة بالآخر.", en: "A guided tour in English inside the Opera House (60 minutes) with a short performance at the end.", he: "סיור מודרך באנגלית בתוך בית האופרה (60 דקות) עם הופעה קצרה בסוף." },
  { keys: ["budapest/attractions/opera-house-tour/whyRecommend"], ar: "من أجمل دور الأوبرا بأوروبا، والجولة بتورجيك القاعات من جوا.", en: "One of the most beautiful opera houses in Europe, and the tour shows you the halls inside.", he: "אחד מבתי האופרה היפים באירופה, והסיור מראה לכם את האולמות מבפנים." },
  { keys: ["budapest/attractions/opera-house-tour/duration","budapest/attractions/hospital-in-the-rock/duration","budapest/experiences/danube-legend-cruise/duration"], ar: "ساعة", en: "1 hour", he: "שעה" },
  { keys: ["budapest/attractions/opera-house-tour/tip"], ar: "الجولات بالإنجليزي كل يوم 13:30 و15:00 و16:30، أقصى 30 شخص، وبتبدأ من مكتب المعلومات بالمدخل. التذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض، والقاعة بتسكّر وقت البروفات (المسار بيتغير).", en: "Tours in English every day at 13:30, 15:00 and 16:30, up to 30 people, starting from the information desk at the entrance. Tickets are released a week ahead. No tours during performances, and the auditorium closes during rehearsals (the route changes).", he: "סיורים באנגלית כל יום ב־13:30, 15:00 ו־16:30, עד 30 משתתפים, ומתחילים בדלפק המידע שבכניסה. הכרטיסים יוצאים למכירה שבוע מראש. אין סיורים בזמן הופעות, והאולם נסגר בזמן חזרות (המסלול משתנה)." },
  { keys: ["budapest/attractions/opera-house-tour/priceText"], ar: "12,000 HUF (للشخص، بالإنجليزي)", en: "12,000 HUF (per person, in English)", he: "12,000 HUF (לאדם, באנגלית)" },
  { keys: ["budapest/attractions/citadella/description"], ar: "الحديقة والإطلالات وتمثال الحرية فوق تلة Gellért. المعرض جوا تذكرة اختيارية.", en: "The park, the views and the Liberty Statue on Gellért Hill. The exhibition inside is an optional ticket.", he: "הפארק, הנופים ופסל החירות על גבעת Gellért. התערוכה בפנים בכרטיס נפרד, לפי בחירה." },
  { keys: ["budapest/attractions/citadella/whyRecommend"], ar: "إطلالة على الجسور والقلعة والبرلمان.", en: "A view of the bridges, the castle and the Parliament.", he: "נוף לגשרים, לטירה ולפרלמנט." },
  { keys: ["budapest/attractions/citadella/duration"], ar: "45 دقيقة", en: "45 minutes", he: "45 דקות" },
  { keys: ["budapest/attractions/citadella/tip"], ar: "الحديقة ببلاش: نوفمبر–مارس 8:00–22:00، أبريل–أكتوبر 6:00–24:00. معرض «A Szabadság Bástyája» 4,900 HUF للبالغ بموعد دخول، آخر دخول 16:40 (الجمعة 18:40).", en: "The park is free: November–March 8:00–22:00, April–October 6:00–24:00. The exhibition “A Szabadság Bástyája” is 4,900 HUF per adult with a timed entry, last entry 16:40 (Friday 18:40).", he: "הפארק בחינם: נובמבר–מרץ 8:00–22:00, אפריל–אוקטובר 6:00–24:00. התערוכה „A Szabadság Bástyája“ 4,900 HUF למבוגר עם שעת כניסה, כניסה אחרונה 16:40 (שישי 18:40)." },
  { keys: ["budapest/attractions/citadella/hours.display"], ar: "الحديقة: نوفمبر–مارس 8:00–22:00 · أبريل–أكتوبر 6:00–24:00", en: "Park: November–March 8:00–22:00 · April–October 6:00–24:00", he: "הפארק: נובמבר–מרץ 8:00–22:00 · אפריל–אוקטובר 6:00–24:00" },
  { keys: ["budapest/attractions/heroes-square/description"], ar: "الساحة الكبيرة على مدخل حديقة المدينة، بنصب الألفية.", en: "The large square at the entrance to City Park, with the Millennium Monument.", he: "הכיכר הגדולה בכניסה לפארק העיר, עם אנדרטת המילניום." },
  { keys: ["budapest/attractions/heroes-square/whyRecommend"], ar: "من أشهر ساحات المدينة، وبداية طبيعية لحديقة المدينة.", en: "One of the city's best-known squares, and a natural start to City Park.", he: "אחת הכיכרות המוכרות בעיר, ונקודת התחלה טבעית לפארק העיר." },
  { keys: ["budapest/attractions/heroes-square/duration","budapest/attractions/vajdahunyad-castle/duration"], ar: "20 دقيقة", en: "20 minutes", he: "20 דקות" },
  { keys: ["budapest/attractions/vajdahunyad-castle/description"], ar: "قلعة رومانسية على بحيرة حديقة المدينة، من برا.", en: "A romantic castle on the City Park lake, seen from outside.", he: "טירה רומנטית על אגם פארק העיר, מבחוץ." },
  { keys: ["budapest/attractions/vajdahunyad-castle/whyRecommend"], ar: "مشي جميل بالحديقة وصور.", en: "A pleasant walk in the park, and photos.", he: "הליכה נעימה בפארק, ותמונות." },
  { keys: ["budapest/attractions/budapest-zoo/description"], ar: "من أقدم حدائق الحيوان بالعالم، وفيها Biodome وبيت النخيل وأكواريوم ضمن التذكرة.", en: "One of the oldest zoos in the world, with the Biodome, the Palm House and an aquarium included in the ticket.", he: "אחד מגני החיות הוותיקים בעולם, עם ה־Biodome, בית הדקלים ואקווריום שכלולים בכרטיס." },
  { keys: ["budapest/attractions/budapest-zoo/whyRecommend"], ar: "نص يوم ممتع لكل الأعمار.", en: "A fun half day for all ages.", he: "חצי יום מהנה לכל הגילים." },
  { keys: ["budapest/attractions/budapest-zoo/tip"], ar: "مفتوحة كل يوم من السنة. الساعات حسب الشهر (من 31 أكتوبر لآخر فبراير 9:00–16:00 وآخر دخول 15:00). تحت 14 سنة ما بيدخلوا بدون بالغ.", en: "Open every day of the year. Hours depend on the month (from 31 October to the end of February 9:00–16:00, last entry 15:00). Under-14s cannot enter without an adult.", he: "פתוח כל יום בשנה. השעות לפי החודש (מ־31 באוקטובר עד סוף פברואר 9:00–16:00, כניסה אחרונה 15:00). ילדים מתחת לגיל 14 לא נכנסים בלי מבוגר." },
  { keys: ["budapest/attractions/budapest-zoo/priceText"], ar: "5,900 HUF (بالغ) · طفل 2–18: 4,200", en: "5,900 HUF (adult) · child 2–18: 4,200", he: "5,900 HUF (מבוגר) · ילד 2–18: 4,200" },
  { keys: ["budapest/attractions/budapest-zoo/hours.display"], ar: "يناير–فبراير 9–16 · مارس 9–17 (ويكند 17:30) · أبريل 9–17:30 (ويكند 18) · مايو–أغسطس 9–18 (ويكند 19) · سبتمبر 9–17:30 (ويكند 18) · أكتوبر 9–17 (ويكند 17:30) · 31 أكتوبر–ديسمبر 9–16 · آخر دخول قبل ساعة", en: "January–February 9–16 · March 9–17 (weekends 17:30) · April 9–17:30 (weekends 18) · May–August 9–18 (weekends 19) · September 9–17:30 (weekends 18) · October 9–17 (weekends 17:30) · 31 October–December 9–16 · last entry one hour before closing", he: "ינואר–פברואר 9–16 · מרץ 9–17 (סופ״ש 17:30) · אפריל 9–17:30 (סופ״ש 18) · מאי–אוגוסט 9–18 (סופ״ש 19) · ספטמבר 9–17:30 (סופ״ש 18) · אוקטובר 9–17 (סופ״ש 17:30) · 31 באוקטובר–דצמבר 9–16 · כניסה אחרונה שעה לפני הסגירה" },
  { keys: ["budapest/attractions/house-of-music/description"], ar: "معرض تفاعلي عن تاريخ الموسيقى الأوروبية والمجرية، بسماعات وبمسارك، تحت مبنى بيت الموسيقى بحديقة المدينة.", en: "An interactive exhibition on the history of European and Hungarian music, with headphones and at your own pace, under the House of Music building in City Park.", he: "תערוכה אינטראקטיבית על תולדות המוזיקה האירופית וההונגרית, עם אוזניות ובקצב שלכם, מתחת לבניין בית המוזיקה בפארק העיר." },
  { keys: ["budapest/attractions/house-of-music/whyRecommend"], ar: "تجربة صوتية مختلفة، وبدون حدود عمر.", en: "A different sound experience, with no age limit.", he: "חוויית שמע אחרת, בלי הגבלת גיל." },
  { keys: ["budapest/attractions/house-of-music/duration"], ar: "ساعتين (المتحف بيقترح 2–3 ساعات)", en: "2 hours (the museum suggests 2–3 hours)", he: "שעתיים (המוזיאון ממליץ על 2–3 שעות)" },
  { keys: ["budapest/attractions/house-of-music/tip"], ar: "الدخول بفترات كل نص ساعة (10:15، 10:45...)؛ آخر دخول 16:15 (الجمعة 17:45). مسكّر الإثنين وأول ثلاثاء بكل شهر. تذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية.", en: "Entry in half-hour slots (10:15, 10:45...); last entry 16:15 (Friday 17:45). Closed on Mondays and on the first Tuesday of every month. Weekend tickets sell out fast. The cloakroom is mandatory.", he: "הכניסה במשבצות של חצי שעה (10:15, 10:45...); כניסה אחרונה 16:15 (שישי 17:45). סגור בימי שני ובשלישי הראשון של כל חודש. כרטיסים לסופ״ש נגמרים מהר. השימוש במלתחה חובה." },
  { keys: ["budapest/attractions/margaret-island/description"], ar: "جزيرة خضرا بنص الدانوب: حدائق وممرات وبرج المي.", en: "A green island in the middle of the Danube: gardens, paths and the water tower.", he: "אי ירוק באמצע הדנובה: גנים, שבילים ומגדל המים." },
  { keys: ["budapest/attractions/margaret-island/whyRecommend"], ar: "أكبر مساحة خضرا بوسط المدينة، ومشي هادي.", en: "The largest green space in the city centre, and a calm walk.", he: "השטח הירוק הגדול ביותר במרכז העיר, והליכה שקטה." },
  { keys: ["budapest/attractions/margaret-island/tip"], ar: "النقطة بالخطة عند النافورة. مواعيد النافورة الموسيقية والحديقة اليابانية ما تحققنا منها.", en: "The point in the plan is at the fountain. We have not verified the times of the musical fountain or the Japanese Garden.", he: "הנקודה בתוכנית היא ליד המזרקה. לא אימתנו את השעות של המזרקה המוזיקלית ושל הגן היפני." },
  { keys: ["budapest/attractions/szechenyi-bath/description"], ar: "أشهر حمّام حراري ببودابست، مسابح داخلية وخارجية، مختلط بلباس سباحة.", en: "Budapest's most famous thermal bath: indoor and outdoor pools, mixed, in swimwear.", he: "המרחץ התרמי המפורסם ביותר בבודפשט: בריכות פנימיות וחיצוניות, מעורב, בבגד ים." },
  { keys: ["budapest/attractions/szechenyi-bath/whyRecommend"], ar: "تجربة الحمّامات الحرارية.", en: "The thermal bath experience.", he: "חוויית המרחצאות התרמיים." },
  { keys: ["budapest/attractions/szechenyi-bath/duration"], ar: "2.5–3 ساعات", en: "2.5–3 hours", he: "2.5–3 שעות" },
  { keys: ["budapest/attractions/szechenyi-bath/tip"], ar: "⚠️ بشرط: ممنوع تحت 14 سنة من 1 أغسطس 2025 (إلا بشهادة طبية موافق عليها مسبقًا). مختلط، بلباس سباحة مخصص بس (منه البوركيني). التذاكر الأونلاين ما بترجع ولا بتتغير.", en: "⚠️ Conditions: no entry under 14 since 1 August 2025 (unless with a medical certificate approved in advance). Mixed, in proper swimwear only (burkini included). Online tickets cannot be refunded or changed.", he: "⚠️ בתנאי: אסור מתחת לגיל 14 מ־1 באוגוסט 2025 (אלא עם אישור רפואי שאושר מראש). מעורב, רק בבגד ים ייעודי (כולל בורקיני). כרטיסים מקוונים אינם ניתנים להחזר או לשינוי." },
  { keys: ["budapest/attractions/szechenyi-bath/priceText"], ar: "13,200 HUF (الإثنين–الخميس) · 14,800 (الجمعة والويكند) · 15,800 (الأعياد)", en: "13,200 HUF (Monday–Thursday) · 14,800 (Friday and weekends) · 15,800 (holidays)", he: "13,200 HUF (שני–חמישי) · 14,800 (שישי וסופ״ש) · 15,800 (חגים)" },
  { keys: ["budapest/attractions/hospital-in-the-rock/description"], ar: "مستشفى وملجأ نووي تحت تلة القلعة، بجولة مرشدة 60 دقيقة.", en: "A hospital and nuclear bunker under Castle Hill, visited on a 60-minute guided tour.", he: "בית חולים ומקלט גרעיני מתחת לגבעת הטירה, בסיור מודרך של 60 דקות." },
  { keys: ["budapest/attractions/hospital-in-the-rock/whyRecommend"], ar: "تاريخ الحرب العالمية الثانية والحرب الباردة.", en: "History of World War II and the Cold War.", he: "ההיסטוריה של מלחמת העולם השנייה והמלחמה הקרה." },
  { keys: ["budapest/attractions/hospital-in-the-rock/tip"], ar: "⚠️ بشرط: ممنوع تحت 6 سنين، ومش منصوح فيه تحت 12. بجولة بس، كل يوم 10:00–19:00 وآخر جولة 18:00؛ مواعيد الجولات بالضبط ما تحققنا منها، فما انحطت بالجدول. البرنامج بالإنجليزي 30 EUR للبالغ بيندفع بالفورنت.", en: "⚠️ Conditions: no entry under 6, and not recommended under 12. By tour only, every day 10:00–19:00, last tour 18:00; we have not verified the exact tour times, so it is not in the schedule. The English programme is 30 EUR per adult, paid in forints.", he: "⚠️ בתנאי: אסור מתחת לגיל 6, ולא מומלץ מתחת לגיל 12. רק בסיור, כל יום 10:00–19:00, הסיור האחרון ב־18:00; לא אימתנו את שעות הסיורים המדויקות, ולכן הוא לא בלוח הזמנים. התוכנית באנגלית 30 EUR למבוגר, בתשלום בפורינטים." },
  { keys: ["budapest/attractions/hospital-in-the-rock/priceText"], ar: "30 EUR (بالغ، بالإنجليزي، بيندفع بالفورنت)", en: "30 EUR (adult, in English, paid in forints)", he: "30 EUR (מבוגר, באנגלית, בתשלום בפורינטים)" },
  { keys: ["budapest/experiences/danube-legend-cruise/description"], ar: "رحلة مسائية ساعة على الدانوب بدليل صوتي، فيها مشروب واحد (منها مي أو مشروب غازي).", en: "A one-hour evening cruise on the Danube with an audio guide, including one drink (water or a soft drink are among the choices).", he: "שייט ערב של שעה על הדנובה עם מדריך קולי, כולל משקה אחד (אפשר גם מים או משקה קל)." },
  { keys: ["budapest/experiences/danube-legend-cruise/priceText"], ar: "25 EUR (بالغ) · تحت 10 ببلاش", en: "25 EUR (adult) · under 10 free", he: "25 EUR (מבוגר) · מתחת לגיל 10 בחינם" },
  { keys: ["budapest/experiences/danube-legend-cruise/hours.display"], ar: "رحلات مسائية كل 20 دقيقة (جدول 2026 حسب الفترة): 25 أكتوبر–22 نوفمبر من 16:20 لـ21:00 · 23 نوفمبر–31 ديسمبر من 15:40 لـ21:00 · 24 ديسمبر بدون رحلات مسائية · 2027 مش منشور", en: "Evening cruises every 20 minutes (2026 schedule, by period): 25 October–22 November from 16:20 to 21:00 · 23 November–31 December from 15:40 to 21:00 · 24 December no evening cruises · 2027 not published", he: "שייט ערב כל 20 דקות (לוח 2026 לפי תקופה): 25 באוקטובר–22 בנובמבר מ־16:20 עד 21:00 · 23 בנובמבר–31 בדצמבר מ־15:40 עד 21:00 · 24 בדצמבר אין שייט ערב · 2027 לא פורסם" },
  { keys: ["budapest/foodCategories/local/label"], ar: "مطبخ هنغاري", en: "Hungarian cuisine", he: "מטבח הונגרי" },
  { keys: ["budapest/foodPlaces/hungarikum-bisztro/why"], ar: "مطبخ هنغاري بيتي قرب البرلمان، بحجز من موقعه.", en: "Home-style Hungarian cooking near the Parliament; book on its website.", he: "מטבח הונגרי ביתי ליד הפרלמנט, בהזמנה דרך האתר שלו." },
  { keys: ["budapest/foodPlaces/menza/why"], ar: "مطعم هنغاري وعالمي بساحة Liszt Ferenc، وقائمة غدا يومية.", en: "A Hungarian and international restaurant on Liszt Ferenc Square, with a daily lunch menu.", he: "מסעדה הונגרית ובינלאומית בכיכר Liszt Ferenc, עם תפריט צהריים יומי." },
  { keys: ["budapest/foodPlaces/frici-papa/why"], ar: "أكل هنغاري بيتي بسيط.", en: "Simple home-style Hungarian food.", he: "אוכל הונגרי ביתי ופשוט." },
  { keys: ["budapest/foodPlaces/21-restaurant/why"], ar: "مطبخ هنغاري معاصر بتلة القلعة.", en: "Contemporary Hungarian cuisine on Castle Hill.", he: "מטבח הונגרי עכשווי בגבעת הטירה." },
  { keys: ["budapest/foodPlaces/pierrot/why"], ar: "مطعم هنغاري عائلي بتلة القلعة.", en: "A family-run Hungarian restaurant on Castle Hill.", he: "מסעדה הונגרית משפחתית בגבעת הטירה." },
  { keys: ["budapest/foodPlaces/new-york-cafe/why"], ar: "مقهى تاريخي فخم، وفيه مطبخ ساخن من 12:00.", en: "A grand historic café, with a hot kitchen from 12:00.", he: "בית קפה היסטורי מפואר, עם מטבח חם מ־12:00." },
  { keys: ["budapest/foodPlaces/gundel/why"], ar: "مطعم للمأكولات الهنغارية قرب حديقة الحيوانات في حديقة المدينة، يقدّم قائمة غداء يومية.", en: "A Hungarian restaurant near the Zoo in City Park, with a daily lunch menu.", he: "מסעדה הונגרית ליד גן החיות בפארק העיר, עם תפריט צהריים יומי." },
  { keys: ["budapest/foodPlaces/varosliget-cafe/why"], ar: "مطعم ومقهى قرب البحيرة وقلعة فاجداهونياد في حديقة المدينة، يقدّم شوربات وأطباقًا رئيسية.", en: "A restaurant and café near the lake and Vajdahunyad Castle in City Park, serving soups and main dishes.", he: "מסעדה ובית קפה ליד האגם וטירת Vajdahunyad בפארק העיר, עם מרקים ומנות עיקריות." },
  { keys: ["budapest/foodPlaces/gerbeaud/why"], ar: "مقهى وحلويات تاريخي من القرن 19.", en: "A historic café and pastry shop from the 19th century.", he: "בית קפה וקונדיטוריה היסטוריים מהמאה ה־19." },
  { keys: ["budapest/shoppingAreas/great-market-hall/bestFor"], ar: "منتجات مجرية: فلفل أحمر وحلويات وتذكارات", en: "Hungarian products: paprika, sweets and souvenirs", he: "מוצרים הונגריים: פפריקה, ממתקים ומזכרות" },
  { keys: ["budapest/shoppingAreas/great-market-hall/description"], ar: "السوق المركزي الكبير: طابق أرضي للمنتجات وطابق علوي للتذكارات.", en: "The large central market: food on the ground floor, souvenirs upstairs.", he: "השוק המרכזי הגדול: תוצרת בקומת הקרקע ומזכרות בקומה העליונה." },
  { keys: ["budapest/shoppingAreas/vaci-utca/bestFor"], ar: "شارع مشاة ومحلات", en: "Pedestrian street and shops", he: "מדרחוב וחנויות" },
  { keys: ["budapest/shoppingAreas/vaci-utca/description"], ar: "أشهر شارع مشاة للتسوق بوسط Pest.", en: "The best-known pedestrian shopping street in central Pest.", he: "רחוב הקניות להולכי רגל המוכר ביותר במרכז Pest." },
  { keys: ["budapest/shoppingAreas/andrassy-avenue/bestFor"], ar: "ماركات عالمية", en: "International brands", he: "מותגים בינלאומיים" },
  { keys: ["budapest/shoppingAreas/andrassy-avenue/description"], ar: "الجادة الكبيرة من وسط المدينة لساحة الأبطال، فيها محلات ماركات بأولها.", en: "The grand avenue from the city centre to Heroes' Square, with brand shops along its first part.", he: "השדרה הגדולה ממרכז העיר עד כיכר הגיבורים, עם חנויות מותגים בחלקה הראשון." },
  { keys: ["budapest/shoppingAreas/gozsdu-udvar/bestFor"], ar: "ممر محلات ومقاهي", en: "A passage of shops and cafés", he: "מעבר של חנויות ובתי קפה" },
  { keys: ["budapest/shoppingAreas/gozsdu-udvar/description"], ar: "ممر بين Király utca وDob utca بالحي اليهودي.", en: "A passage between Király utca and Dob utca in the Jewish Quarter.", he: "מעבר בין Király utca ל־Dob utca ברובע היהודי." },
  { keys: ["budapest/shoppingAreas/arena-mall/description"], ar: "مركز تسوق كبير جنب محطة Keleti.", en: "A large shopping centre next to Keleti station.", he: "מרכז קניות גדול ליד תחנת Keleti." },
];

/** Fixed texts the Budapest planner writes into plans (transfer notes, warnings, suggestion reasons, show-window notes). */
export const BUDAPEST_PHRASES: (PlanCatalogEntry & { key: string })[] = [
  { key: "budapest/walk", ar: "المسافة من مسار مشي فعلي (OpenStreetMap)، والوقت تقدير على مشي 4.5 كم بالساعة.", en: "Distance from a real walking route (OpenStreetMap); the time is an estimate at 4.5 km/h.", he: "המרחק ממסלול הליכה אמיתי (OpenStreetMap); הזמן הוא הערכה לפי הליכה של 4.5 קמ״ש." },
  { key: "budapest/walk-climb", ar: "المسافة من مسار مشي فعلي (OpenStreetMap) وفيه طلعة أو نزلة تلة، فالوقت تقدير على مشي 4.5 كم بالساعة مع 20% زيادة.", en: "Distance from a real walking route (OpenStreetMap) with an uphill or downhill stretch, so the time is an estimate at 4.5 km/h plus 20%.", he: "המרחק ממסלול הליכה אמיתי (OpenStreetMap) עם עלייה או ירידה, ולכן הזמן הוא הערכה לפי הליכה של 4.5 קמ״ש ועוד 20%." },
  { key: "budapest/reason/szechenyi", ar: "اختياري بشرط: ممنوع تحت 14 سنة، مختلط وبلباس سباحة؛ مش ضمن الجدول", en: "Optional, with conditions: no entry under 14, mixed and in swimwear; not in the schedule", he: "אופציונלי, בתנאים: אסור מתחת לגיל 14, מעורב ובבגד ים; לא בלוח הזמנים" },
  { key: "budapest/reason/hospital", ar: "اختياري بشرط: ممنوع تحت 6 سنين، والجولة بموعد ما تحققنا منه؛ مش ضمن الجدول", en: "Optional, with conditions: no entry under 6, and the tour times are not verified; not in the schedule", he: "אופציונלי, בתנאים: אסור מתחת לגיל 6, ושעות הסיור לא אומתו; לא בלוח הזמנים" },
  { key: "budapest/reason/evening", ar: "اختياري: رحلة مسائية، مواعيدها حسب فترة سفرك؛ احجز موعد لما تعرف تاريخك", en: "Optional: an evening cruise whose times depend on your travel period; book a time once you know your date", he: "אופציונלי: שייט ערב שהשעות שלו תלויות בתקופת הנסיעה; הזמינו מועד כשתדעו את התאריך" },
  { key: "budapest/reason/cruise-unpublished", ar: "رحلة مسائية على الدانوب — خيار إضافي. تأكّد من المواعيد والتوفّر لتاريخ سفرك قبل الحجز.", en: "An evening cruise on the Danube — an extra option. Check the times and availability for your travel date before booking.", he: "שייט ערב על הדנובה — אפשרות נוספת. בדקו את השעות והזמינות לתאריך הנסיעה לפני ההזמנה." },
  { key: "budapest/warning/opera", ar: "⚠️ الجولات بس 13:30 و15:00 و16:30، حسب توفّر التذاكر، والتذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض.", en: "⚠️ Tours only at 13:30, 15:00 and 16:30, subject to ticket availability; tickets go on sale a week ahead. No tours during performances.", he: "⚠️ סיורים רק ב־13:30, 15:00 ו־16:30, בכפוף לזמינות הכרטיסים; הכרטיסים יוצאים למכירה שבוע מראש. אין סיורים בזמן הופעות." },
  { key: "budapest/warning/cruise", ar: "⚠️ الموعد المنشور مش ضمان مكان، حسب التوفّر. المشروب المشمول ممكن يكون مي أو مشروب غازي.", en: "⚠️ A published departure does not guarantee a place; it depends on availability. The included drink can be water or a soft drink.", he: "⚠️ מועד שפורסם אינו מבטיח מקום; זה תלוי בזמינות. המשקה הכלול יכול להיות מים או משקה קל." },
  { key: "budapest/warning/house-of-music", ar: "⚠️ الدخول بفترات كل نص ساعة (:15 و:45)، وتذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية.", en: "⚠️ Timed entry every 30 minutes, at :15 and :45 past the hour, and weekend tickets sell out fast. The cloakroom is mandatory.", he: "⚠️ כניסה במשבצות של חצי שעה (:15 ו־:45), וכרטיסים לסופ״ש נגמרים מהר. השימוש במלתחה חובה." },
  { key: "budapest/warning/zoo", ar: "المواعيد بتتغير حسب الشهر (بالشتا لحد 16:00 وآخر دخول 15:00).", en: "Hours change by month (in winter until 16:00, last entry 15:00).", he: "השעות משתנות לפי החודש (בחורף עד 16:00, כניסה אחרונה 15:00)." },
  { key: "budapest/warning/basilica-sunday", ar: "الأحد: الكنيسة بتفتح من 13:00 بس (التراس من 9:00).", en: "Sunday: the church opens only from 13:00 (the terrace from 9:00).", he: "ראשון: הכנסייה נפתחת רק מ־13:00 (המרפסת מ־9:00)." },
  { key: "budapest/warning/museum-halls", ar: "في قاعات مسكّرة للترميم حسب موقع المتحف.", en: "Some halls are closed for renovation, according to the museum's website.", he: "חלק מהאולמות סגורים לשיפוץ, לפי אתר המוזיאון." },
  { key: "budapest/show-window/opera", ar: "الجولات بس 13:30 و15:00 و16:30: احجز الموعد اللي بيناسب خطتك.", en: "Tours only at 13:30, 15:00 and 16:30: book the time that fits your plan.", he: "סיורים רק ב־13:30, 15:00 ו־16:30: הזמינו את המועד שמתאים לתוכנית שלכם." },
  // Owner's wording 2026-11-16 (Arabic and English; an AI language review, not a person's review). Hebrew follows it, not reviewed.
  { key: "budapest/show-window/house-of-music", ar: "مواعيد الدخول كل نص ساعة، عند الدقيقة 15 و45. احجز الموعد اللي بناسب خطتك.", en: "Timed entry every 30 minutes, at :15 and :45 past the hour. Book the entry time that fits your plan.", he: "כניסה בזמנים קבועים כל 30 דקות, ב־:15 וב־:45 בכל שעה. הזמינו את שעת הכניסה שמתאימה לתוכנית שלכם." },
  // 2026-11-16: museums whose year-end holiday hours are not published for the trip's year (budapestCityModule.ts). Not reviewed.
  { key: "budapest/reason/holiday-unconfirmed", ar: "اختياري: مواعيد العطلة لهاليوم مش مؤكدة. تأكّد من الموقع الرسمي قبل ما تروح.", en: "Optional: the holiday opening hours for this day are not confirmed. Check the official website before you go.", he: "אופציונלי: שעות הפתיחה בחג ליום הזה לא מאומתות. בדקו באתר הרשמי לפני שאתם יוצאים." },
];

/** `enParts` (two-place labels): their parts, so a title of three or more parts reads as one list in English (owner, 2026-11-16). */
type Pair = { en: string; he: string; enParts?: [string, string] };

/** Budapest area labels of day titles (budapestCityModule.ts), without an article, for titles. Not reviewed by a person (see above). */
const AREA_TITLE: Record<string, Pair> = {
  "البرلمان والكاتدرائية": { en: "Parliament and St Stephen's", he: "הפרלמנט וסנט סטפן", enParts: ["Parliament", "St Stephen’s Basilica"] },
  البرلمان: { en: "Parliament", he: "הפרלמנט" },
  الكاتدرائية: { en: "St Stephen's Basilica", he: "בזיליקת סנט סטפן" },
  "ضفة الدانوب": { en: "Danube bank", he: "גדת הדנובה" },
  "وسط Pest": { en: "Central Pest", he: "מרכז Pest" },
  "تلة القلعة": { en: "Castle Hill", he: "גבעת הטירה" },
  "تلة Gellért": { en: "Gellért Hill", he: "גבעת Gellért" },
  "Andrássy والأوبرا": { en: "Andrássy and the Opera", he: "Andrássy והאופרה", enParts: ["Andrássy Avenue", "the Opera"] },
  الأوبرا: { en: "Opera House", he: "בית האופרה" },
  "شارع Andrássy": { en: "Andrássy Avenue", he: "שדרות Andrássy" },
  "الحي اليهودي": { en: "Jewish Quarter", he: "הרובע היהודי" },
  "حي المتحف": { en: "Museum Quarter", he: "רובע המוזיאון" },
  "حديقة المدينة": { en: "City Park", he: "פארק העיר" },
  "جزيرة Margaret": { en: "Margaret Island", he: "האי Margaret" },
  Keleti: { en: "Keleti", he: "Keleti" },
};
const AREAS_LONGEST_FIRST = Object.keys(AREA_TITLE).sort((a, b) => b.length - a.length);

/** Hebrew "and": ו attaches to a Hebrew word and takes a maqaf before a Latin one (same rule as localizePlan.ts). */
const heAnd = (word: string) => (/^[\u0590-\u05FF]/.test(word) ? `ו${word}` : `ו־${word}`);

function budapestTitle(text: string, lang: "en" | "he"): string | null {
  let core = text;
  let suffix = "";
  const colon = text.indexOf(": ");
  if (colon > 0) {
    const stop = text.slice(colon + 2);
    if (/[\u0600-\u06FF]/.test(stop)) return null;
    core = text.slice(0, colon);
    suffix = `: ${stop}`;
  }
  if (core.startsWith("يوم ")) {
    const area = AREA_TITLE[core.slice(4)];
    return area ? area[lang] + suffix : null;
  }
  for (const a of AREAS_LONGEST_FIRST) {
    if (!core.startsWith(`${a} و`)) continue;
    const b = AREA_TITLE[core.slice(a.length + 2).trimStart()];
    if (!b) continue;
    const A = AREA_TITLE[a][lang];
    if (lang === "he") return `${A} ${heAnd(b.he)}` + suffix;
    // English: two parts keep "A & B"; three or more read as a list, "City Park, Andrássy Avenue and the Opera".
    const parts = [...(AREA_TITLE[a].enParts ?? [A]), ...(b.enParts ?? [b.en])];
    return (parts.length > 2 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : `${A} & ${b.en}`) + suffix;
  }
  return null;
}

const WEEKDAY: Record<string, Pair> = {
  الأحد: { en: "Sunday", he: "ראשון" },
  الإثنين: { en: "Monday", he: "שני" },
  الثلاثاء: { en: "Tuesday", he: "שלישי" },
  الأربعاء: { en: "Wednesday", he: "רביעי" },
  الخميس: { en: "Thursday", he: "חמישי" },
  الجمعة: { en: "Friday", he: "שישי" },
  السبت: { en: "Saturday", he: "שבת" },
};

/**
 * Budapest engine texts that carry a value: day titles, the daylight note (budapestDaylight.ts), the checked-transit note
 * (budapestCheckedTransit.ts) and the capacity warning. Returns null when the text is not one of them. Not reviewed by a person.
 */
export function budapestTemplate(text: string, lang: "en" | "he"): string | null {
  let m = /^الأفضل تزوره بضوّ النهار\. الغروب حوالي (\d{2}:\d{2}) حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك\.$/.exec(text);
  if (m)
    return lang === "en"
      ? `Best visited in daylight. Sunset is around ${m[1]} by the month's estimate, and it may differ on your travel date.`
      : `עדיף לבקר באור יום. השקיעה בסביבות ${m[1]} לפי הערכה חודשית, ועשויה להיות שונה בתאריך הנסיעה שלכם.`;
  m = /^وقت المواصلات من مخطط Google Maps بهالاتجاه، لانطلاق (\S+) (\d{1,2}\/\d{1,2}\/\d{4}) الساعة (\d{2}:\d{2}) \(توقيت بودابست\)، من الباب للباب؛ بموعد تاني بيتغير حسب الخط والانتظار\.$/.exec(text);
  if (m && WEEKDAY[m[1]])
    return lang === "en"
      ? `Public transport time from the Google Maps planner in this direction, for a departure on ${WEEKDAY[m[1]].en} ${m[2]} at ${m[3]} (Budapest time), door to door; at another time it changes with the line and the wait.`
      : `זמן התחבורה הציבורית מהמתכנן של Google Maps בכיוון הזה, ליציאה ביום ${WEEKDAY[m[1]].he} ${m[2]} בשעה ${m[3]} (שעון בודפשט), מדלת לדלת; בשעה אחרת הוא משתנה לפי הקו וההמתנה.`;
  m = /^قدرنا نبني خطة قوية لـ (\d+) أيام من البيانات المتاحة حاليًا لبودابست\.$/.exec(text);
  if (m)
    return lang === "en"
      ? `We could build a strong plan for ${m[1]} days from the data currently available for Budapest.`
      : `הצלחנו לבנות תוכנית חזקה ל־${m[1]} ימים מהנתונים שזמינים כרגע לבודפשט.`;
  return budapestTitle(text, lang);
}
