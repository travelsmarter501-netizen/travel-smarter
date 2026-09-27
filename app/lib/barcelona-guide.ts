import type { DestinationGuideContent } from "./guideTypes";

const WIKIMEDIA = "Wikimedia Commons";

export const barcelonaGuide: DestinationGuideContent = {
  slug: "barcelona",
  priceILS: 29,
  subtitle: "كل ما تحتاجه لرحلتك — بدون قراءة طويلة. افتح القسم اللي يهمك الحين وخلص.",

  quickFacts: [
    { icon: "💶", label: "العملة", value: "Euro (€)" },
    { icon: "🗣", label: "اللغة", value: "Spanish / Catalan" },
    { icon: "✈️", label: "المطار الرئيسي", value: "Barcelona–El Prat (BCN)" },
    { icon: "📅", label: "أفضل مدة للزيارة", value: "4–5 أيام" },
    { icon: "☀️", label: "أفضل وقت للزيارة", value: "4–6 / 9–10" },
    { icon: "🚇", label: "التنقل", value: "مترو + مشي" },
    { icon: "🚶", label: "مناسبة للمشي؟", value: "نعم، غالبية الأحياء المركزية" },
    { icon: "💰", label: "متوسط مستوى الأسعار", value: "متوسط" },
  ],

  categories: [
    { id: "attractions", icon: "⭐", label: "أهم الأماكن", subtitle: "المعالم اللي ما لازم تفوّتها" },
    { id: "areas", icon: "🗺️", label: "حسب المنطقة", subtitle: "شو قريب من شو" },
    { id: "food", icon: "🍽️", label: "وين ناكل؟", subtitle: "Breakfast، Tapas، Cafés وأكثر" },
    { id: "stay", icon: "🏨", label: "وين تسكن؟", subtitle: "كل حي وشو يناسبه" },
    { id: "hotels", icon: "🛏️", label: "أفضل الفنادق", subtitle: "خيارات مختارة، من الفخم للبوتيك" },
    { id: "transport", icon: "🚇", label: "كيف تتنقل؟", subtitle: "Metro، مشي، أو Taxi؟" },
    { id: "shopping", icon: "🛍️", label: "التسوق", subtitle: "من الماركات للـ Outlet" },
    { id: "beaches", icon: "🌊", label: "الشواطئ", subtitle: "اختار الشاطئ اللي يناسب جوّك" },
    { id: "photo-spots", icon: "📸", label: "أماكن التصوير", subtitle: "أفضل Views وSunset spots" },
    { id: "nightlife", icon: "🌙", label: "Barcelona بالليل", subtitle: "بارات، أسطح، وأجواء هادئة" },
    { id: "casino", icon: "🎰", label: "الكازينو", subtitle: "مكان قمار مرخّص وحقيقي" },
    { id: "experiences", icon: "🔥", label: "فعاليات وتجارب", subtitle: "أشياء تسويها، مش بس تشوفها" },
    { id: "free", icon: "🆓", label: "Barcelona ببلاش", subtitle: "تجارب حلوة بدون ما تدفع" },
    { id: "save-money", icon: "💸", label: "وفر مصاري", subtitle: "نصائح عملية وسريعة" },
    { id: "mistakes", icon: "⚠️", label: "أخطاء تجنبها", subtitle: "قبل ما تكررها" },
    { id: "checklist", icon: "✅", label: "قبل السفر", subtitle: "تشيك ليست جاهزة" },
    { id: "favorites", icon: "❤️", label: "المحفوظات", subtitle: "كل اللي حفظته بمكان واحد" },
  ],

  attractions: [
    {
      id: "sagrada-familia",
      name: "Sagrada Família",
      image:
        "/images-barcelona/sagrada-familia.jpg",
      imagePosition: "center 25%",
      imageSource: WIKIMEDIA,
      description: "كنيسة Gaudí الأسطورية — لسا قيد البناء من أكثر من قرن.",
      whyRecommend: "إذا أول مرة بـBarcelona، هاي من الأماكن اللي صعب تتخطاها.",
      areaId: "eixample",
      duration: "1.5–2 ساعة",
      priceType: "paid",
      bookingStatus: "ضروري مسبقًا",
      bestTime: "الصباح الباكر",
      tip: "احجز موعدك مسبقًا ووصل قبله بشوي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sagrada+Familia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Sagrada+Familia+Barcelona",
      officialUrl: "https://sagradafamilia.org",
      ticketsUrl: "https://sagradafamilia.org/en/tickets",
      priceText: "من €26 — حسب نوع التذكرة",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          sunday: [
            {
              open: "10:30",
              close: "18:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.8,
      reviewCount: 328574,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: true,
      address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
      coordinates: { lat: 41.40369, lng: 2.17433 },
    },
    {
      id: "park-guell",
      name: "Park Güell",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Parc_guell_-_panoramio.jpg/1280px-Parc_guell_-_panoramio.jpg",
      imageSource: WIKIMEDIA,
      description: "حديقة Gaudí الملوّنة بإطلالة بانورامية على المدينة.",
      whyRecommend: "إطلالة بانورامية مجانية عمليًا على المدينة بأسلوب Gaudí ما رح تلقاه بمكان تاني.",
      areaId: "gracia",
      duration: "1.5–2 ساعة",
      priceType: "paid",
      bookingStatus: "ضروري مسبقًا",
      bestTime: "الصباح الباكر أو قبل الغروب",
      tip: "التذاكر محدودة يوميًا — احجزها بدري.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Park+Guell+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Park+Guell+Barcelona",
      officialUrl: "https://parkguell.barcelona",
      ticketsUrl: "https://parkguell.barcelona/en/tickets",
      priceText: "من €18",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "20:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.4,
      reviewCount: 239451,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: true,
      address: "Carrer d'Olot, 08024 Barcelona, Spain",
      coordinates: { lat: 41.41361, lng: 2.15278 },
    },
    {
      id: "casa-batllo",
      name: "Casa Batlló",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Casa_Batllo_Overview_Barcelona_Spain_cut.jpg/1280px-Casa_Batllo_Overview_Barcelona_Spain_cut.jpg",
      imageSource: WIKIMEDIA,
      description: "واجهة منزل موجية بأسلوب Gaudí، من أشهر مباني Passeig de Gràcia.",
      whyRecommend: "أشهر واجهة معمارية بالمدينة، وصورة لازم تكون بألبومك.",
      areaId: "eixample",
      duration: "ساعة وربع تقريبًا",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "بعد الظهر",
      tip: "شوفها ليلًا كمان — الإضاءة مختلفة تمامًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Batllo+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Casa+Batllo+Barcelona",
      officialUrl: "https://www.casabatllo.es",
      ticketsUrl: "https://www.casabatllo.es/en/tickets/",
      priceText: "من €29",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          saturday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
          sunday: [
            {
              open: "08:30",
              close: "22:30",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.7,
      reviewCount: 215216,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: true,
      address: "Passeig de Gràcia, 43, 08007 Barcelona, Spain",
      coordinates: { lat: 41.39158, lng: 2.16492 },
    },
    {
      id: "casa-mila",
      name: "Casa Milà – La Pedrera",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Casa_Mil%C3%A0%2C_general_view.jpg/1280px-Casa_Mil%C3%A0%2C_general_view.jpg",
      imageSource: WIKIMEDIA,
      description: "مبنى Gaudí الحجري المموّج، يلقّبونه La Pedrera (المحجر).",
      whyRecommend: "نموذج تاني لعبقرية Gaudí، وسطحه بمداخنه المموّجة من أغرب المشاهد اللي رح تشوفها.",
      areaId: "eixample",
      duration: "1–1.5 ساعة",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "أي وقت",
      tip: "السطح فيه مداخن رهيبة للتصوير — لا تفوته.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Mila+La+Pedrera+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Casa+Mila+La+Pedrera+Barcelona",
      officialUrl: "https://www.lapedrera.com",
      priceText: "ابتداءً من €29",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "23:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.6,
      reviewCount: 113024,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Passeig de Gràcia, 92, 08008 Barcelona, Spain",
      coordinates: { lat: 41.39528, lng: 2.16167 },
    },
    {
      id: "gothic-quarter",
      name: "Gothic Quarter",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg/1280px-Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg",
      imageSource: WIKIMEDIA,
      description: "أزقة حجرية من العصور الوسطى — قلب برشلونة القديم.",
      whyRecommend: "أزقة تاريخية تحسّ فيها بروح برشلونة القديمة من غير ما تدفع أي تذكرة.",
      areaId: "gothic-quarter",
      duration: "2–3 ساعات",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح للهدوء، المساء للأجواء",
      tip: "خلي الخريطة جنب وتوه بالأزقة — أحلى طريقة تكتشفها.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gothic+Quarter+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gothic+Quarter+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: true,
      address: "Plaça Nova, 08002 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.38278, lng: 2.17694 },
    },
    {
      id: "barcelona-cathedral",
      name: "Barcelona Cathedral",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Barcelona_Cathedral_Saint_Eulalia.jpg/1280px-Barcelona_Cathedral_Saint_Eulalia.jpg",
      imageSource: WIKIMEDIA,
      description: "كاتدرائية قوطية بفناء داخلي فيه إوز يعيش هناك من قرون.",
      whyRecommend: "كاتدرائية قوطية مميزة وقريبة كتير من مسارك بالـGothic Quarter.",
      areaId: "gothic-quarter",
      duration: "45 دقيقة – 1 ساعة",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "الصباح الباكر",
      tip: "اطلع للسطح لو متاح — الإطلالة تستاهل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barcelona+Cathedral",
      appleMapsUrl: "https://maps.apple.com/?q=Barcelona+Cathedral",
      officialUrl: "https://www.catedralbcn.org",
      ticketsUrl: "https://tickets.catedralbcn.org",
      priceText: "€16",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:30",
              close: "17:45",
            },
          ],
          tuesday: [
            {
              open: "09:30",
              close: "17:45",
            },
          ],
          wednesday: [
            {
              open: "09:30",
              close: "17:45",
            },
          ],
          thursday: [
            {
              open: "09:30",
              close: "17:45",
            },
          ],
          friday: [
            {
              open: "09:30",
              close: "17:45",
            },
          ],
          saturday: [
            {
              open: "09:30",
              close: "17:15",
            },
          ],
          sunday: [
            {
              open: "14:00",
              close: "16:30",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.6,
      reviewCount: 84238,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Pla de la Seu, s/n, 08002 Barcelona, Spain",
      coordinates: { lat: 41.38389, lng: 2.17639 },
    },
    {
      id: "la-rambla",
      name: "La Rambla",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lascar_La_Rambla_street_%284469806880%29.jpg/1280px-Lascar_La_Rambla_street_%284469806880%29.jpg",
      imageSource: WIKIMEDIA,
      description: "الشارع الأشهر بالمدينة، يوصل Plaça de Catalunya بالميناء.",
      whyRecommend: "الشارع اللي بيوصلك بين أهم مناطق المدينة، ومحطة أساسية بأي زيارة.",
      areaId: "gothic-quarter",
      duration: "30–45 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح — مزدحم جدًا مساءً",
      tip: "دير بالك على أغراضك؛ من أكثر مناطق النشل ازدحامًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=La+Rambla+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=La+Rambla+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: true,
      address: "Pla de la Boqueria, La Rambla, 08002 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.38139, lng: 2.17306 },
    },
    {
      id: "boqueria",
      name: "Mercat de la Boqueria",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Barcelona_-_Mercat_de_Sant_Josep_%28la_Boqueria%29_-_Entrance.jpg/1280px-Barcelona_-_Mercat_de_Sant_Josep_%28la_Boqueria%29_-_Entrance.jpg",
      imageSource: WIKIMEDIA,
      description: "سوق طعام حيوي وملوّن على La Rambla.",
      whyRecommend: "سوق حيوي ممتاز لتجربة أكل محلي وسط جو ملوّن — خليه محطة سريعة مش وجبة كاملة.",
      areaId: "gothic-quarter",
      duration: "30–45 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح الباكر",
      tip: "روح للأكشاك الداخلية البعيدة عن المدخل — أرخص عادة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mercat+de+la+Boqueria",
      appleMapsUrl: "https://maps.apple.com/?q=Mercat+de+la+Boqueria",
      officialUrl: "https://www.boqueria.barcelona",
      priceText: "مجاني (تدفع بس على اللي تشتريه)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          tuesday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          wednesday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          thursday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          friday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          saturday: [
            {
              open: "08:00",
              close: "20:30",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      rating: 4.5,
      reviewCount: 214596,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "La Rambla, 91, 08001 Barcelona, Spain",
      coordinates: { lat: 41.38194, lng: 2.17194 },
    },
    {
      id: "mercat-sagrada-familia",
      name: "Mercat de la Sagrada Família",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/035_Mercat_de_la_Sagrada_Fam%C3%ADlia%2C_c._Padilla_255_%28Barcelona%29.jpg/1280px-035_Mercat_de_la_Sagrada_Fam%C3%ADlia%2C_c._Padilla_255_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enric",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:035_Mercat_de_la_Sagrada_Fam%C3%ADlia,_c._Padilla_255_(Barcelona).jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      description: "سوق حي محلي صغير على خطوات من Sagrada Família — خضار وفواكه ولحوم وأسماك طازة.",
      whyRecommend: "سوق حي أصيل بعيد عن الزحمة السياحية — منيح لوقفة سريعة بعد زيارة Sagrada Família.",
      areaId: "eixample",
      duration: "15–20 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح",
      tip: "أوقات الأكشاك الفردية ممكن تختلف عن أوقات السوق العامة أدناه.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mercat+de+la+Sagrada+Familia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Mercat+de+la+Sagrada+Familia+Barcelona",
      officialUrl: "https://mercatdelasagradafamilia.com",
      priceText: "مجاني (تدفع بس على اللي تشتريه)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "08:00", close: "14:00" }],
          tuesday: [
            { open: "08:00", close: "14:00" },
            { open: "16:30", close: "20:00" },
          ],
          wednesday: [
            { open: "08:00", close: "14:00" },
            { open: "16:30", close: "20:00" },
          ],
          thursday: [
            { open: "08:00", close: "14:00" },
            { open: "16:30", close: "20:00" },
          ],
          friday: [{ open: "07:00", close: "20:00" }],
          saturday: [{ open: "07:00", close: "15:00" }],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      rating: 4.2,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Carrer de Padilla, 255, 08013 Barcelona, Spain",
      coordinates: { lat: 41.40561, lng: 2.17698 },
    },
    {
      id: "mercat-sant-antoni",
      name: "Mercat de Sant Antoni",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Mercat_de_Sant_Antoni%2C_Barcelona.jpg/1280px-Mercat_de_Sant_Antoni%2C_Barcelona.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Julian Lupyan",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Mercat_de_Sant_Antoni,_Barcelona.jpg",
      imageLicense: "CC0 1.0",
      imageLicenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      description: "أضخم أسواق برشلونة التاريخية — مبنى حديدي بشكل صليب من 1882، وسوق كتب يوم الأحد.",
      whyRecommend: "سوق ضخم بعمارة حديدية مميزة من القرن 19 — تجربة سوق محلي أصيلة بعيدة عن زحمة Boqueria.",
      areaId: "eixample",
      duration: "30–45 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح",
      tip: "يوم الأحد يتحول المكان لسوق كتب ومقتنيات (Mercat Dominical) بدل سوق الطعام — وأكشاك Encants (ملابس) إلها جدول منفصل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mercat+de+Sant+Antoni+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Mercat+de+Sant+Antoni+Barcelona",
      officialUrl: "https://mercatdesantantoni.com",
      priceText: "مجاني (تدفع بس على اللي تشتريه)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "08:30", close: "20:00" }],
          tuesday: [{ open: "08:30", close: "20:00" }],
          wednesday: [{ open: "08:30", close: "20:00" }],
          thursday: [{ open: "08:30", close: "20:00" }],
          friday: [{ open: "08:30", close: "20:00" }],
          saturday: [{ open: "08:30", close: "20:00" }],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      rating: 4.4,
      reviewCount: 38718,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Carrer del Comte d'Urgell, 1, 08011 Barcelona, Spain",
      coordinates: { lat: 41.37864, lng: 2.16205 },
    },
    {
      id: "palau-musica",
      name: "Palau de la Música Catalana",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/22_11_01_Palau_DSCF2611_52502512616_cc1e7db845_k.jpg/1280px-22_11_01_Palau_DSCF2611_52502512616_cc1e7db845_k.jpg",
      imageSource: WIKIMEDIA,
      description: "قاعة حفلات مودرنيست مصنّفة UNESCO، بزجاج ملوّن وزخرفة داخلية خيالية.",
      whyRecommend: "قاعة موسيقى مودرنيست مذهلة، وأحلى طريقة تجربها هي حضور حفلة مش بس جولة سريعة.",
      areaId: "el-born",
      duration: "50 دقيقة (جولة) — أطول لو حفلة",
      priceType: "paid",
      bookingStatus: "ضروري مسبقًا",
      bestTime: "احجز حسب جدول الحفلات",
      tip: "لو تقدر، احجز تذكرة حفلة بدل الجولة العادية — التجربة مختلفة تمامًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Palau+de+la+Musica+Catalana",
      appleMapsUrl: "https://maps.apple.com/?q=Palau+de+la+Musica+Catalana",
      officialUrl: "https://www.palaumusica.cat",
      ticketsUrl: "https://www.palaumusica.cat/en/visit-palau",
      priceText: "من €20 (جولة ذاتية) — من €24 (جولة مع مرشد)",
      hours: {
        type: "variable",
        display: "حسب جدول الجولات",
        lastVerified: "2026-08",
      },
      rating: 4.7,
      reviewCount: 55225,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Carrer Palau de la Música, 4-6, 08003 Barcelona, Spain",
      coordinates: { lat: 41.3875, lng: 2.17556 },
    },
    {
      id: "sant-pau",
      name: "Recinte Modernista de Sant Pau",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Hospital_Sant_Pau%2C_main_facade.jpg/1280px-Hospital_Sant_Pau%2C_main_facade.jpg",
      imageSource: WIKIMEDIA,
      description: "مجمع مستشفى مودرنيست سابق مصنّف UNESCO، بأجنحة مزخرفة وحدائق هادئة.",
      whyRecommend: "مجمع مودرنيست UNESCO أقل زحمة من الأماكن التانية — خيار ممتاز لعمارة Gaudí-era بعيد عن الزحمة.",
      areaId: "eixample",
      duration: "1–1.5 ساعة",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "الصباح",
      tip: "دمجه بزيارة Sagrada Família — المسافة بينهم مشي معقول.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Recinte+Modernista+de+Sant+Pau",
      appleMapsUrl: "https://maps.apple.com/?q=Recinte+Modernista+de+Sant+Pau",
      officialUrl: "https://www.santpaubarcelona.org",
      priceText: "من €17",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          tuesday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          wednesday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          thursday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          friday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          saturday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
          sunday: [
            {
              open: "09:30",
              close: "17:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      rating: 4.6,
      reviewCount: 61689,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Carrer de Sant Antoni Maria Claret, 167, 08025 Barcelona, Spain",
      coordinates: { lat: 41.41278, lng: 2.17444 },
    },
    {
      id: "arc-de-triomf",
      name: "Arc de Triomf",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arc_de_Triomf%2C_Barcelona_2716.jpg/1280px-Arc_de_Triomf%2C_Barcelona_2716.jpg",
      imageSource: WIKIMEDIA,
      description: "قوس نصر من الطوب الأحمر، بُني كمدخل لمعرض 1888.",
      whyRecommend: "وقفة تصوير سريعة بطريقك لـ Parc de la Ciutadella.",
      areaId: "el-born",
      duration: "15–20 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بطريقك لـ Parc de la Ciutadella",
      tip: "امشِ منه للحديقة مباشرة — المسافة قصيرة وحلوة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Arc+de+Triomf+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Arc+de+Triomf+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Passeig de Lluís Companys, 08018 Barcelona, Spain",
      coordinates: { lat: 41.39111, lng: 2.18056 },
    },
    {
      id: "ciutadella",
      name: "Parc de la Ciutadella",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ciutadella_Park_fountain.jpg/1280px-Ciutadella_Park_fountain.jpg",
      imageSource: WIKIMEDIA,
      description: "أكبر حدائق وسط المدينة، فيها نافورة Gaudí المبكرة وبحيرة تجديف.",
      whyRecommend: "حديقة واسعة وهادئة، ممتازة لاستراحة وسط يوم مليان مشي.",
      areaId: "el-born",
      duration: "1–1.5 ساعة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بعد الظهر",
      tip: "مكان ممتاز لاستراحة وسط يوم مزدحم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parc+de+la+Ciutadella",
      appleMapsUrl: "https://maps.apple.com/?q=Parc+de+la+Ciutadella",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Passeig de Picasso, 08003 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.38806, lng: 2.1875 },
    },
    {
      // Guide gap-fill (verified 2026-08): a real, extremely highly-rated (4.7★/40k+ reviews)
      // Gothic basilica in El Born -- genuinely one of Barcelona's most-loved churches, not
      // added as a geographic filler. Verified via the official site
      // (santamariadelmarbarcelona.org: hours, prices) and Google Maps (name, address,
      // current open status, rating). areaId "el-born" matches its real location, a 12min/
      // 900m flat walk from ciutadella (confirmed live) -- added to el-born's attractionIds
      // below.
      id: "santa-maria-del-mar",
      name: "Basílica de Santa Maria del Mar",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Bas%C3%ADlica_de_Santa_Mar%C3%ADa_del_Mar_%28Barcelona%29_-_Nave_Central_%28vista_desde_el_Altar%29.jpg/1280px-Bas%C3%ADlica_de_Santa_Mar%C3%ADa_del_Mar_%28Barcelona%29_-_Nave_Central_%28vista_desde_el_Altar%29.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "JnCrlsMG",
      imageSourceUrl:
        "https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_Santa_Mar%C3%ADa_del_Mar_(Barcelona)_-_Nave_Central_(vista_desde_el_Altar).jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      description: "كنيسة قوطية من القرن الـ14 بناها أهل الحي بنفسهم — أعمدة نحيلة وسقف مرتفع يعطي إحساس فراغ وضوء نادر.",
      whyRecommend: "من أجمل كنائس برشلونة الحقيقية — أهدأ وأصيل أكثر من الكاتدرائية، وبخطوات من Ciutadella.",
      areaId: "el-born",
      duration: "30–45 دقيقة",
      priceType: "paid",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح الباكر أو بعد الساعة 6 مساءً",
      tip: "الدخول العام مجاني بعد ساعات الزيارة الثقافية (بعد 18:00 تقريبًا) — الزيارة المدفوعة بتشمل صعود البرج.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+de+Santa+Maria+del+Mar+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Basilica+de+Santa+Maria+del+Mar+Barcelona",
      officialUrl: "https://www.santamariadelmar.barcelona/en/",
      priceText: "€5 (زيارة ثقافية 10:00–18:00) — €10 (تشمل صعود البرج) — مجاني خارج ساعات الزيارة الثقافية",
      hours: {
        type: "variable",
        display: "يوميًا 10:00–20:30 — الزيارة الثقافية المدفوعة 10:00–18:00 (الأحد من 13:30)",
        lastVerified: "2026-08",
      },
      rating: 4.7,
      reviewCount: 40379,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Plaça de Santa Maria, 1, 08003 Barcelona, Spain",
      coordinates: { lat: 41.38361, lng: 2.18194 },
    },
    {
      id: "montjuic",
      name: "Montjuïc",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fale_-_Spain_-_Barcelona_-_8.jpg/1280px-Fale_-_Spain_-_Barcelona_-_8.jpg",
      imageSource: WIKIMEDIA,
      description: "تلة مطلة على المدينة والميناء، فيها قلعة وحدائق ونافورة موسيقية.",
      whyRecommend: "إطلالة، قلعة، وحدائق بمكان واحد — يستاهل نص يوم كامل.",
      areaId: "montjuic",
      duration: "3–4 ساعات",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بعد الظهر لحد الغروب",
      tip: "خذ التلفريك بدل ما تطلع مشي — يوفر عليك وقت وطاقة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Montjuic+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Montjuic+Barcelona",
      priceText: "مجاني (التلة) — بعض المتاحف والقلعة لها تذكرة",
      hours: {
        type: "always-open",
      },
      mustSee: true,
      address: "Plaça d'Espanya, 08038 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.36417, lng: 2.16083 },
    },
    {
      // Added for the Smart Planner's Montjuïc identity cleanup — verified 2026-08 via
      // Google Maps (name, address, coordinates) and museunacional.cat (hours, prices).
      // A precise, single-point anchor at the foot of Montjuïc, distinct from the existing
      // "montjuic" entry above (which stays untouched — see that task's report for why).
      id: "mnac",
      name: "Museu Nacional d'Art de Catalunya (MNAC)",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Museu_nacional_d%27art_de_catalunya_2.jpg/1280px-Museu_nacional_d%27art_de_catalunya_2.jpg",
      imageSource: WIKIMEDIA,
      description: "متحف ضخم برأس تلة Montjuïc، فيه فن كتالوني من القرن 11 لحد القرن 20، وإطلالة مجانية من الـRooftop.",
      whyRecommend: "أوضح نقطة وصول لـMontjuïc — مبنى مهيب، فن كتالوني مميز، وإطلالة بانورامية على المدينة من السطح.",
      areaId: "montjuic",
      duration: "1.5–2.5 ساعة",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "الصباح — أقل ازدحامًا",
      tip: "تذكرة أساسية بـ€2 توصلك للمبنى والـRooftop Viewpoint بدون لازم تزور كل المعرض — خيار سريع لو وقتك محدود.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Museu+Nacional+d%27Art+de+Catalunya",
      appleMapsUrl: "https://maps.apple.com/?q=Museu+Nacional+d%27Art+de+Catalunya",
      officialUrl: "https://www.museunacional.cat/en",
      ticketsUrl: "https://tickets.museunacional.cat/muslinkIV/index.jsp?nom_cache=MUSEU&property=MUSEU&lang=4&codiActiv=256",
      priceText: "€12 (تذكرة عامة) — €2 (تذكرة أساسية: المبنى + Rooftop Viewpoint)",
      hours: {
        type: "variable",
        display: "ثلاثاء–سبت من 10:00 (وقت الإغلاق يختلف حسب الموسم) — الأحد والأعياد 10:00–15:00 — مسكّر الإثنين",
        seasons: [
          { monthRange: "10–4", display: "ثلاثاء–سبت 10:00–18:00، أحد وأعياد 10:00–15:00" },
          { monthRange: "5–9", display: "ثلاثاء–سبت 10:00–20:00، أحد وأعياد 10:00–15:00" },
        ],
        // Operational Hours Integrity Audit: both seasons above already agree MNAC is closed
        // Monday every week (only the Tue-Sat closing TIME varies by season) -- this was already
        // stated in `display` and in the planner's own operational-warning text, just never
        // structurally enforced. See hours.ts's own doc comment on `closedWeekdays`.
        closedWeekdays: ["monday"],
        lastVerified: "2026-08",
      },
      rating: 4.7,
      ratingSource: "Google",
      mustSee: true,
      address: "Palau Nacional, Parc de Montjuïc, s/n, 08038 Barcelona, Spain",
      coordinates: { lat: 41.3684399, lng: 2.15357 },
    },
    {
      id: "barceloneta-beach",
      name: "Barceloneta Beach",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beach%2C_Barcelona_%28P1170713%29.jpg/1280px-Beach%2C_Barcelona_%28P1170713%29.jpg",
      imageSource: WIKIMEDIA,
      description: "أقرب وأشهر شاطئ للمركز، بأجواء حيوية ومطاعم على البحر.",
      whyRecommend: "أقرب شاطئ للمركز، بأجواء حيوية ومطاعم عالبحر.",
      areaId: "barceloneta",
      duration: "2+ ساعة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح للهدوء، بعد الظهر للأجواء",
      tip: "دير بالك على أغراضك على الرمل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barceloneta+Beach",
      appleMapsUrl: "https://maps.apple.com/?q=Barceloneta+Beach",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      rating: 4.4,
      reviewCount: 16209,
      ratingSource: "Google",
      mustSee: true,
      address: "Passeig Marítim de la Barceloneta, 08003 Barcelona, Spain",
      locationLabel: "نقطة الوصول",
      coordinates: { lat: 41.37939, lng: 2.18919 },
    },
    {
      // Guide gap-fill (verified 2026-08): a real museum in the Palau de Mar building, right
      // on the Port Vell waterfront -- verified live to be only 7min/450m flat walk from
      // barceloneta-beach (vs 17min/1.2km to ciutadella), so areaId "barceloneta" reflects
      // where it actually sits, not "el-born". Verified via the official site (mhcat.cat:
      // hours, prices) and Google Maps (name, address, current open status, rating).
      id: "museu-historia-catalunya",
      name: "Museu d'Història de Catalunya",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/014_Port_Vell%2C_moll_del_Dip%C3%B2sit_i_Palau_de_Mar.JPG/1280px-014_Port_Vell%2C_moll_del_Dip%C3%B2sit_i_Palau_de_Mar.JPG",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enfo",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:014_Port_Vell,_moll_del_Dip%C3%B2sit_i_Palau_de_Mar.JPG",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      description: "متحف تاريخ كتالونيا داخل مخزن ميناء قديم من القرن الـ19 على واجهة Port Vell البحرية، وفيه تراس مطعم بإطلالة على المرسى.",
      whyRecommend: "أنسب نقطة تربط الحي القوطي وBorn بشاطئ Barceloneta — خطوات من البحر مباشرة.",
      areaId: "barceloneta",
      duration: "1–1.5 ساعة",
      priceType: "paid",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح أو بعد الظهر",
      tip: "التراس بالطابق العلوي مفتوح مجانًا حتى بدون تذكرة — إطلالة حلوة على المرسى.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Museu+d%27Historia+de+Catalunya",
      appleMapsUrl: "https://maps.apple.com/?q=Museu+d%27Historia+de+Catalunya",
      officialUrl: "https://www.mhcat.cat/enmhc/about_the_museum",
      priceText: "€4.50 (تذكرة عامة) — €3.50 (مخفضة) — مجاني تحت 8 سنوات",
      hours: {
        type: "variable",
        display: "ثلاثاء–سبت 10:00–19:00 (الأربعاء لحد 20:00) — الأحد والأعياد 10:00–14:30 — مسكّر الإثنين",
        // Operational Hours Integrity Audit: `display` already states a weekly Monday closure
        // (already echoed verbatim in the planner's own operational-warning text) -- never
        // structurally enforced before. See hours.ts's own doc comment on `closedWeekdays`.
        closedWeekdays: ["monday"],
        lastVerified: "2026-08",
      },
      rating: 4.5,
      reviewCount: 6303,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Plaça de Pau Vila, 3, 08039 Barcelona, Spain",
      coordinates: { lat: 41.3809, lng: 2.185693 },
    },
    {
      id: "bunkers-carmel",
      name: "Bunkers del Carmel",
      image: "/images-barcelona/bunkers-del-carmel.jpg",
      imageSource: "local-image",
      description: "تحصينات قديمة تحوّلت لأفضل Sunset spot مجاني بالمدينة.",
      whyRecommend: "أفضل Sunset spot مجاني بالمدينة، بس يحتاج شوي مشي وطلعة.",
      areaId: "gracia",
      duration: "1–1.5 ساعة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "قبل الغروب بساعة",
      tip: "خذ ماء معك — ما فيه محلات قريبة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bunkers+del+Carmel",
      appleMapsUrl: "https://maps.apple.com/?q=Bunkers+del+Carmel",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      rating: 4.7,
      reviewCount: 3961,
      ratingSource: "Google",
      mustSee: false,
      address: "Carrer de Marià Labèrnia, s/n, 08032 Barcelona, Spain",
      coordinates: { lat: 41.41928, lng: 2.16171 },
    },
    {
      id: "placa-catalunya",
      name: "Plaça de Catalunya",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Catalunya_Barcelona1_tango7174.jpg/1280px-Catalunya_Barcelona1_tango7174.jpg",
      imageSource: WIKIMEDIA,
      description: "الميدان المركزي اللي يربط المدينة القديمة بـ Eixample.",
      whyRecommend: "ميدان مركزي مفيد كنقطة تجمّع أكتر منه وجهة بحد ذاتها.",
      areaId: "gothic-quarter",
      duration: "15–20 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "أي وقت",
      tip: "نقطة تجمّع ومرجع سهل لتحديد اتجاهك بالمدينة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+de+Catalunya",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+de+Catalunya",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Plaça de Catalunya, 08002 Barcelona, Spain",
      coordinates: { lat: 41.38667, lng: 2.17 },
    },
    {
      id: "placa-reial",
      name: "Plaça Reial",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Barcellona_Pla%C3%A7a_Reial.jpg/1280px-Barcellona_Pla%C3%A7a_Reial.jpg",
      imageSource: WIKIMEDIA,
      description: "ساحة أنيقة بعمارة موحّدة ونخيل، خطوات بس عن La Rambla.",
      whyRecommend: "ساحة حلوة بعمارة موحّدة ومطاعم وبارات — منيحة لقعدة مسائية إذا كنت بالمنطقة.",
      areaId: "gothic-quarter",
      duration: "20–30 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "المساء",
      tip: "روح لها مع نزلة La Rambla — سهل تدمجها بنفس الجولة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+Reial+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+Reial+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Plaça Reial, 08002 Barcelona, Spain",
      coordinates: { lat: 41.38, lng: 2.175 },
    },
    {
      id: "camp-nou",
      name: "Camp Nou",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Camp_Nou_aerial.jpg/1280px-Camp_Nou_aerial.jpg",
      imageSource: WIKIMEDIA,
      description: "ملعب FC Barcelona — تجربة لازمة لمحبي كرة القدم.",
      whyRecommend: "لازم لمحبي كرة القدم، بس مش أولوية لغير المهتمين.",
      areaId: "other",
      duration: "1.5–2.5 ساعة",
      priceType: "paid",
      bookingStatus: "ضروري مسبقًا",
      bestTime: "يعتمد على جدول المباريات وساعات الجولة",
      tip: "الملعب لسا قيد التجديد الكبير (Espai Barça) وبسعة جزئية — الجولات رجعت من 27/1/2026، تحقق من التوفر قبل ما تحجز.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Camp+Nou+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Camp+Nou+Barcelona",
      officialUrl: "https://www.fcbarcelona.com",
      ticketsUrl: "https://www.fcbarcelona.com/en/tickets",
      priceText: "متغيّر — شوف السعر الحالي (الملعب قيد التجديد)",
      hours: {
        type: "variable",
        display: "جولات يومية: 09:30، 12:15، 14:30، 17:00 (تحقق من التوفر بسبب أعمال التجديد)",
        lastVerified: "2026-08",
      },
      rating: 4.6,
      reviewCount: 169144,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Carrer d'Arístides Maillol, 12, 08028 Barcelona, Spain",
      coordinates: { lat: 41.3808, lng: 2.1228 },
    },
    {
      id: "tibidabo",
      name: "Tibidabo",
      image: "/images-barcelona/tibidabo.jpg",
      imageSource: "local_image",
      description: "أعلى تلة بالمدينة، فيها كنيسة ومدينة ملاهي قديمة وأعلى إطلالة على Barcelona.",
      whyRecommend: "إطلالة عالية حلوة، بس بعيدة عن المركز وساعاتها موسمية — خليها إذا فاضلك وقت.",
      areaId: "other",
      duration: "2–3 ساعات (بما فيها المواصلات)",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "بعد الظهر لحد الغروب",
      tip: "تحقق من أيام وساعات الفتح قبل ما تطلع — موسمية ومحدودة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tibidabo+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Tibidabo+Barcelona",
      officialUrl: "https://www.tibidabo.cat",
      priceText: "من €39 (المدينة كاملة) — من €21.50 (المنطقة البانورامية فقط)",
      hours: {
        type: "variable",
        display: "موسمية ومحدودة — تحقق من الموقع الرسمي",
        lastVerified: "2026-08",
      },
      rating: 4.4,
      reviewCount: 48481,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Plaça del Tibidabo, 3, 08035 Barcelona, Spain",
      coordinates: { lat: 41.4225, lng: 2.11861 },
    },
    {
      // Guide gap-fill (verified 2026-08): a real, existing Gothic monastery -- the only
      // genuine visitor-worthy heritage site in the Les Corts/Pedralbes district beyond
      // Camp Nou. Verified via the official site (monestirpedralbes.barcelona: hours, prices)
      // and Google Maps (name, address, current open status, rating). areaId "other" matches
      // the same fallback already used for camp-nou/tibidabo -- no existing curated Area
      // covers Pedralbes.
      id: "monestir-pedralbes",
      name: "Monestir de Pedralbes",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/088_Monestir_de_Pedralbes_%28Barcelona%29%2C_claustre%2C_l%27ala_est_des_de_la_galeria_nord.jpg/1280px-088_Monestir_de_Pedralbes_%28Barcelona%29%2C_claustre%2C_l%27ala_est_des_de_la_galeria_nord.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enric",
      imageSourceUrl:
        "https://commons.wikimedia.org/wiki/File:088_Monestir_de_Pedralbes_(Barcelona),_claustre,_l%27ala_est_des_de_la_galeria_nord.jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      description: "دير قوطي من القرن الـ14، بعيد عن زحمة السياحة، بكلويستر (ساحة داخلية) ثلاثي الطوابق من أهدأ أركان برشلونة.",
      whyRecommend: "لو رايح Camp Nou، هاد أقرب معلم تاريخي حقيقي تضيفه لنفس اليوم — مختلف كليًا عن أجواء الملعب.",
      areaId: "other",
      duration: "45–60 دقيقة",
      priceType: "paid",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح — أقل ازدحامًا",
      tip: "دخول مجاني كل يوم أحد بعد الساعة 3، وأول أحد بكل شهر طول اليوم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Reial+Monestir+de+Santa+Maria+de+Pedralbes",
      appleMapsUrl: "https://maps.apple.com/?q=Reial+Monestir+de+Santa+Maria+de+Pedralbes",
      officialUrl: "https://www.monestirpedralbes.barcelona/en",
      priceText: "€5.20 (تذكرة عامة) — €3.70 (مخفضة) — مجاني تحت 16 سنة",
      hours: {
        type: "variable",
        display: "ثلاثاء–أحد (وقت الإغلاق يختلف حسب الموسم) — مسكّر الإثنين",
        seasons: [
          { monthRange: "10–3", display: "ثلاثاء–جمعة 10:00–14:00، سبت–أحد 10:00–17:00 (أحد بعد 15:00 مجاني)" },
          { monthRange: "4–9", display: "ثلاثاء–جمعة 10:00–17:00، سبت 10:00–19:00، أحد 10:00–20:00 (بعد 15:00 مجاني)" },
        ],
        // Operational Hours Integrity Audit: both seasons already agree on a weekly Monday
        // closure (`display` already states it) -- never structurally enforced before. See
        // hours.ts's own doc comment on `closedWeekdays`.
        closedWeekdays: ["monday"],
        lastVerified: "2026-08",
      },
      rating: 4.7,
      reviewCount: 6536,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Baixada del Monestir, 9, 08034 Barcelona, Spain",
      coordinates: { lat: 41.39556, lng: 2.11222 },
    },
    {
      // Guide gap-fill (verified 2026-08): a real, free public garden directly across
      // Avinguda Diagonal from Camp Nou -- much closer to the stadium than the monastery
      // above (confirmed via live Google Maps: ~20min walk/transit vs ~28min). Verified via
      // barcelona.cat (the city's own official listing for the garden) and Google Maps
      // (address, current open status, rating). "Always-open" hours matches this guide's own
      // established convention for free public parks with no ticket (see ciutadella/montjuic)
      // rather than asserting an exact seasonal closing time not independently verified here.
      id: "jardins-palau-pedralbes",
      name: "Jardins del Palau Reial de Pedralbes",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/03_Jardins_del_palau_de_Pedralbes_%28Barcelona%29.jpg/1280px-03_Jardins_del_palau_de_Pedralbes_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enric",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:03_Jardins_del_palau_de_Pedralbes_(Barcelona).jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      description: "حدائق ملكية واسعة خلف سور مغطى بالبوغنفيليا — نافورة Gaudí المبكرة (Font d'Hèrcules) وأجواء هادئة كليًا.",
      whyRecommend: "مجانية وعلى بعد دقايق من Camp Nou — استراحة هادئة قبل أو بعد الملعب.",
      areaId: "other",
      duration: "30–45 دقيقة",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بعد الظهر",
      tip: "دور على نافورة Font d'Hèrcules — من أعمال Gaudí المبكرة، قبل شهرته.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jardins+del+Palau+Reial+de+Pedralbes",
      appleMapsUrl: "https://maps.apple.com/?q=Jardins+del+Palau+Reial+de+Pedralbes",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      rating: 4.5,
      reviewCount: 7769,
      ratingSource: "Google",
      lastVerified: "8/2026",
      mustSee: false,
      address: "Av. Diagonal, 686, 08034 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.38839, lng: 2.11703 },
    },
    {
      // Barcelona Candidate Pool Expansion (2026-09): promoted from live-web research, not the
      // pre-existing Guide dataset -- verified via museupicassobcn.cat (official) 2026-09.
      // No image sourced/licensed in this task -- see this project's image fallback (an empty
      // string renders the existing placeholder card, e.g. ReadyPlanPlaceCard.tsx) rather than
      // blocking implementation. Candidate Wikimedia Commons files identified for a follow-up
      // image task: "Museu Picasso Barcelona.JPG", "Carrer Montcada- Museu Picasso.jpg".
      id: "museu-picasso",
      name: "Museu Picasso de Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museu-Picasso_Barcelona.jpg/1280px-Museu-Picasso_Barcelona.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "haitham alfalah",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Museu-Picasso_Barcelona.jpg",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      description: "متحف بيكاسو الرسمي في El Born — مجموعة ضخمة من أعماله المبكرة، جوه 5 قصور من العصور الوسطى.",
      whyRecommend: "أكبر مجموعة لأعمال بيكاسو المبكرة بالعالم، وجوه مبنى تاريخي مميز بحد ذاته.",
      areaId: "el-born",
      duration: "1.5–2 ساعة تقريبًا (تقدير)",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "الصباح الباكر لتفادي الزحمة",
      tip: "دخول مجاني كل أحد أول بالشهر ومساء الخميس — لازم حجز مسبق لهالأوقات تحديدًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Museu+Picasso+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Museu+Picasso+Barcelona",
      officialUrl: "https://museupicassobcn.cat/en/plan-your-visit/buy-tickets-and-opening-hours",
      priceText: "€14 أونلاين / €15 بالموقع",
      hours: {
        type: "variable",
        display: "ثلاثاء–أحد، الساعات تختلف حسب الموسم — مسكّر الإثنين",
        seasons: [
          { monthRange: "3–9", display: "ثلاثاء/أربعاء/أحد 9:00–20:00، خميس/جمعة/سبت 9:00–21:00" },
          { monthRange: "10–2", display: "ثلاثاء–أحد 10:00–19:00" },
        ],
        closedWeekdays: ["monday"],
        source: "museupicassobcn.cat",
        sourceUrl: "https://museupicassobcn.cat/en/plan-your-visit/buy-tickets-and-opening-hours",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Carrer de Montcada, 15-23, 08003 Barcelona, Spain",
      coordinates: { lat: 41.3851039, lng: 2.1812015 },
    },
    {
      id: "fundacio-joan-miro",
      name: "Fundació Joan Miró",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Fundaci%C3%B3_Joan_Mir%C3%B3.JPG/1280px-Fundaci%C3%B3_Joan_Mir%C3%B3.JPG",
      imageSource: WIKIMEDIA,
      imageAuthor: "Arnaucc",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Fundaci%C3%B3_Joan_Mir%C3%B3.JPG",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      description: "متحف Joan Miró على تلة Montjuïc — مبنى أبيض من تصميم Josep Lluís Sert، مع تراس فيه منحوتات وإطلالة على المدينة.",
      whyRecommend: "من أهم متاحف الفن الحديث ببرشلونة، وسهل تدمجه مع MNAC ونفس يوم Montjuïc.",
      areaId: "montjuic",
      duration: "2 ساعة تقريبًا (تقدير)",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "الصباح",
      tip: "لا تفوت الـRooftop Terrace — منحوتات ملونة وإطلالة حلوة على Montjuïc.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Fundacio+Joan+Miro+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Fundacio+Joan+Miro+Barcelona",
      officialUrl: "https://www.fmirobcn.org/en/visit-us/plan-your-visit/",
      priceText: "€17 أونلاين / €18 بالموقع",
      hours: {
        type: "variable",
        display: "ثلاثاء–أحد، الساعات تختلف حسب الموسم — مسكّر الإثنين (عدا استثناءات محدودة)",
        seasons: [
          { monthRange: "4–10", display: "ثلاثاء–سبت 10:00–20:00، أحد 10:00–19:00" },
          { monthRange: "11–3", display: "ثلاثاء–أحد 10:00–19:00" },
        ],
        closedWeekdays: ["monday"],
        source: "fmirobcn.org",
        sourceUrl: "https://www.fmirobcn.org/en/visit-us/plan-your-visit/",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Avinguda de Miramar, 1, 08038 Barcelona, Spain",
      coordinates: { lat: 41.3682613, lng: 2.160125 },
    },
    {
      id: "poble-espanyol",
      name: "Poble Espanyol de Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Barcelona_Poble_Espanyol.JPG/1280px-Barcelona_Poble_Espanyol.JPG",
      imageSource: WIKIMEDIA,
      imageAuthor: "Corradox",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Barcelona_Poble_Espanyol.JPG",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      description: "قرية بمساحة كبيرة على Montjuïc فيها نسخ حقيقية الحجم من عمارة أسبانية من كل المناطق — ورش حرفيين ومطاعم جواها.",
      whyRecommend: "تجربة نصف يوم كاملة — عمارة، حرف يدوية، وأكل — مناسبة كمرساة طويلة ليوم أطول بالرحلة.",
      areaId: "montjuic",
      duration: "2.5 ساعة تقريبًا (تقدير)",
      priceType: "paid",
      bookingStatus: "يفضل مسبقًا",
      bestTime: "بعد الظهر لين المساء",
      tip: "مفتوح لين منتصف الليل أغلب الأيام — خيار حلو ليوم يمتد للمساء.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Poble+Espanyol+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Poble+Espanyol+Barcelona",
      officialUrl: "https://poble-espanyol.com/el-poble-espanyol/informacion-practica/",
      priceText: "€13.50 (بالغين)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "10:00", close: "20:00" }],
          tuesday: [{ open: "10:00", close: "00:00" }],
          wednesday: [{ open: "10:00", close: "00:00" }],
          thursday: [{ open: "10:00", close: "00:00" }],
          friday: [{ open: "10:00", close: "00:00" }],
          saturday: [{ open: "10:00", close: "00:00" }],
          sunday: [{ open: "10:00", close: "00:00" }],
        },
        source: "poble-espanyol.com",
        sourceUrl: "https://poble-espanyol.com/el-poble-espanyol/informacion-practica/",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Av. de Francesc Ferrer i Guàrdia, 13, 08038 Barcelona, Spain",
      coordinates: { lat: 41.369117, lng: 2.146725 },
    },
    {
      id: "cosmocaixa",
      name: "CosmoCaixa Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Cosmocaixa.jpg/960px-Cosmocaixa.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Esv",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Cosmocaixa.jpg",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      description: "متحف علوم تفاعلي جنب Tibidabo — غابة استوائية داخلية حقيقية، وأقسام تفاعلية تناسب العائلات.",
      whyRecommend: "خيار تفاعلي/عائلي نادر بالمقارنة مع باقي المتاحف التاريخية ببرشلونة.",
      areaId: "other",
      duration: "2.5 ساعة تقريبًا (تقدير)",
      priceType: "paid",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح",
      tip: "الغابة الاستوائية جوا المتحف قسم لازم تشوفه — مو بس أقسام العلوم العادية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=CosmoCaixa+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=CosmoCaixa+Barcelona",
      officialUrl: "https://cosmocaixa.org/es/info-centro",
      priceText: "€8",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "10:00", close: "20:00" }],
          tuesday: [{ open: "10:00", close: "20:00" }],
          wednesday: [{ open: "10:00", close: "20:00" }],
          thursday: [{ open: "10:00", close: "20:00" }],
          friday: [{ open: "10:00", close: "20:00" }],
          saturday: [{ open: "10:00", close: "20:00" }],
          sunday: [{ open: "10:00", close: "20:00" }],
        },
        source: "cosmocaixa.org",
        sourceUrl: "https://cosmocaixa.org/es/info-centro",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Carrer d'Isaac Newton, 26, 08022 Barcelona, Spain",
      coordinates: { lat: 41.4124532, lng: 2.1316655 },
    },
    {
      // Real address/hours confirmed directly on the official site; the exact CLOSING time had
      // minor cross-source disagreement in research (some third-party aggregators suggested a
      // later evening close) -- the weekly-open-every-day fact itself is solid, only the precise
      // last hour should be re-checked before this candidate is treated as fully locked.
      id: "museu-maritim",
      name: "Museu Marítim de Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Museu_Mar%C3%ADtim_de_Barcelona_2._Edifici_de_les_Drasanes_Reials.jpg/1280px-Museu_Mar%C3%ADtim_de_Barcelona_2._Edifici_de_les_Drasanes_Reials.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Pilardenou999",
      imageSourceUrl:
        "https://commons.wikimedia.org/wiki/File:Museu_Mar%C3%ADtim_de_Barcelona_2._Edifici_de_les_Drasanes_Reials.jpg",
      imageLicense: "CC0 1.0",
      imageLicenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      description: "متحف بحري جوه Drassanes Reials — أحواض بناء سفن ملكية من العصور الوسطى، من أهم المباني الصناعية التاريخية بأوروبا.",
      whyRecommend: "المبنى نفسه (أحواض بناء سفن قوطية) تجربة تاريخية نادرة، ومختلف كليًا عن أي متحف ثاني بالقائمة.",
      areaId: "gothic-quarter",
      duration: "1.5–2 ساعة تقريبًا (تقدير)",
      priceType: "paid",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح",
      tip: "دخول مجاني كل أحد بعد الساعة 15:00.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Museu+Maritim+de+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Museu+Maritim+de+Barcelona",
      officialUrl: "https://www.mmb.cat/en/",
      priceText: "سعر عام — مجاني الأحد بعد 15:00",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "10:00", close: "19:00" }],
          tuesday: [{ open: "10:00", close: "19:00" }],
          wednesday: [{ open: "10:00", close: "19:00" }],
          thursday: [{ open: "10:00", close: "19:00" }],
          friday: [{ open: "10:00", close: "19:00" }],
          saturday: [{ open: "10:00", close: "19:00" }],
          sunday: [{ open: "10:00", close: "19:00" }],
        },
        source: "mmb.cat",
        sourceUrl: "https://www.mmb.cat/en/",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Avinguda de les Drassanes, s/n, 08001 Barcelona, Spain",
      coordinates: { lat: 41.3753299, lng: 2.1758663 },
    },
    {
      id: "mercat-santa-caterina",
      name: "Mercat de Santa Caterina",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Mercado_de_Santa_Caterina.jpg/1280px-Mercado_de_Santa_Caterina.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Boca Dorada",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Mercado_de_Santa_Caterina.jpg",
      imageLicense: "CC BY-SA 2.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
      description: "سوق محلي حقيقي (مو سياحي زي Boqueria) بسقف موزاييك ملون مشهور — أول سوق مغطى ببرشلونة.",
      whyRecommend: "بديل محلي أصيل لسوق Boqueria، وسقفه الملون تصميم معماري مميز بحد ذاته.",
      areaId: "el-born",
      duration: "30–40 دقيقة تقريبًا (تقدير)",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "الصباح",
      tip: "مسكّر يوم الأحد — خطط ليوم ثاني بالأسبوع.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mercat+de+Santa+Caterina+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Mercat+de+Santa+Caterina+Barcelona",
      officialUrl: "https://www.mercatdesantacaterina.com/en/where-we-are",
      priceText: "مجاني الدخول",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "07:30", close: "15:30" }],
          tuesday: [{ open: "07:30", close: "20:30" }],
          wednesday: [{ open: "07:30", close: "15:30" }],
          thursday: [{ open: "07:30", close: "20:30" }],
          friday: [{ open: "07:30", close: "20:30" }],
          saturday: [{ open: "07:30", close: "15:30" }],
          sunday: [],
        },
        source: "mercatdesantacaterina.com",
        sourceUrl: "https://www.mercatdesantacaterina.com/en/where-we-are",
        lastVerified: "2026-09",
      },
      mustSee: false,
      address: "Avinguda de Francesc Cambó, 16, 08003 Barcelona, Spain",
      coordinates: { lat: 41.3863594, lng: 2.1781611 },
    },
    {
      // AREA EXPERIENCE, not a ticketed POI -- see this task's own "Neighborhood Walk Model"
      // instruction. Modeled exactly like the existing Gothic Quarter / La Rambla entries:
      // hours "always-open" (never a fabricated business schedule), locationLabel marks it as a
      // suggested starting point rather than a single exact address, and duration is an explicit
      // planner estimate for a self-guided walk around the square and Gràcia's nearby streets --
      // not sourced from any official duration figure (none exists for an open neighborhood).
      id: "placa-vila-gracia",
      name: "Plaça de la Vila de Gràcia",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Pla%C3%A7a_de_la_Vila_de_Gr%C3%A0cia.jpg/1280px-Pla%C3%A7a_de_la_Vila_de_Gr%C3%A0cia.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Nicholas Gemini",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Pla%C3%A7a_de_la_Vila_de_Gr%C3%A0cia.jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      description: "الساحة المركزية لحي Gràcia — برج ساعة Rovira i Trias، محاطة بمقاهي محلية بعيدة عن الزحمة السياحية.",
      whyRecommend: "نقطة انطلاق طبيعية لتجول حر بأزقة Gràcia الهادئة — أجواء محلية مختلفة عن الحي القوطي.",
      areaId: "gracia",
      duration: "1.5 ساعة تقريبًا (تقدير لتجول حر)",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بعد الظهر لين المساء",
      tip: "تجول بدون خطة محددة بالأزقة المحيطة — أغلب سحر Gràcia بالمشي العشوائي مو بمعلم محدد.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+de+la+Vila+de+Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+de+la+Vila+de+Gracia+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Plaça de la Vila de Gràcia, 08012 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.400087, lng: 2.1574228 },
    },
    {
      // AREA EXPERIENCE, same honest modeling as placa-vila-gracia above -- see this task's own
      // "Neighborhood Walk Model" instruction. Anchor verified via live geocoding (Geoapify) as a
      // real, central point on Rambla del Poblenou; duration is a planner estimate for a stroll
      // along the promenade, not an official sourced figure.
      id: "rambla-poblenou",
      name: "Rambla del Poblenou",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Rambla_del_Poblenou_%28Barcelona%29_October_2023.JPG/1280px-Rambla_del_Poblenou_%28Barcelona%29_October_2023.JPG",
      imageSource: WIKIMEDIA,
      imageAuthor: "Benoît Prieur",
      imageSourceUrl:
        "https://commons.wikimedia.org/wiki/File:Rambla_del_Poblenou_%28Barcelona%29_October_2023.JPG",
      imageLicense: "CC0 1.0",
      imageLicenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      description: "الممشى الرئيسي لحي Poblenou — طابع محلي وحديث، بعيد عن المسار السياحي التقليدي، قريب من شواطئ Bogatell وNova Icària.",
      whyRecommend: "أفضل مدخل لبرشلونة الحديثة/الصناعية سابقًا (منطقة 22@) بعيدًا عن Gothic Quarter وGaudí.",
      areaId: "other",
      duration: "45–60 دقيقة تقريبًا (تقدير لتجول حر)",
      priceType: "free",
      bookingStatus: "بدون حجز",
      bestTime: "بعد الظهر لين المساء",
      tip: "كمّل المشي لين الشاطئ (Bogatell) — نفس الاتجاه، يعطيك يوم متكامل بين حي محلي وشاطئ.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rambla+del+Poblenou+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Rambla+del+Poblenou+Barcelona",
      priceText: "مجاني",
      hours: {
        type: "always-open",
      },
      mustSee: false,
      address: "Rambla del Poblenou, 08005 Barcelona, Spain",
      locationLabel: "نقطة مقترحة للبدء",
      coordinates: { lat: 41.398151, lng: 2.2052196 },
    },
  ],

  areas: [
    {
      id: "eixample",
      name: "Eixample",
      description: "شوارع واسعة ومستقيمة، ومباني Gaudí الشهيرة على Passeig de Gràcia.",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg/1280px-Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Eixample+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Eixample+Barcelona",
      address: "Passeig de Gràcia, 08007 Barcelona, Spain",
      coordinates: { lat: 41.39158, lng: 2.16492 },
      attractionIds: ["sagrada-familia", "casa-batllo", "casa-mila", "sant-pau"],
    },
    {
      id: "gothic-quarter",
      name: "Gothic Quarter",
      description: "قلب المدينة التاريخي — الكاتدرائية، La Rambla، وسوق Boqueria كلها قريبة.",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg/1280px-Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gothic+Quarter+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gothic+Quarter+Barcelona",
      address: "Plaça Nova, 08002 Barcelona, Spain",
      coordinates: { lat: 41.38278, lng: 2.17694 },
      attractionIds: ["gothic-quarter", "barcelona-cathedral", "la-rambla", "boqueria", "placa-catalunya", "placa-reial", "museu-maritim"],
    },
    {
      id: "el-born",
      name: "El Born",
      description: "حي أنيق جنب الحي القوطي — سهل تدمجه مع قوس النصر وحديقة Ciutadella.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arc_de_Triomf%2C_Barcelona_2716.jpg/1280px-Arc_de_Triomf%2C_Barcelona_2716.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Born+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Born+Barcelona",
      address: "Passeig del Born, 08003 Barcelona, Spain",
      coordinates: { lat: 41.38473, lng: 2.18286 },
      attractionIds: ["arc-de-triomf", "ciutadella", "palau-musica", "santa-maria-del-mar", "museu-picasso", "mercat-santa-caterina"],
    },
    {
      id: "gracia",
      name: "Gràcia",
      description: "حي هادئ نسبيًا، فيه Park Güell وBunkers del Carmel لمشاهدة الغروب.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Parc_guell_-_panoramio.jpg/1280px-Parc_guell_-_panoramio.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gracia+Barcelona",
      address: "Plaça de la Vila de Gràcia, 08012 Barcelona, Spain",
      coordinates: { lat: 41.40011, lng: 2.15764 },
      attractionIds: ["park-guell", "bunkers-carmel", "placa-vila-gracia"],
    },
    {
      id: "montjuic",
      name: "Montjuïc",
      description: "تلة قائمة بذاتها — خصص لها وقت مستقل، مو بطريقك لمكان ثاني.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fale_-_Spain_-_Barcelona_-_8.jpg/1280px-Fale_-_Spain_-_Barcelona_-_8.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Montjuic+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Montjuic+Barcelona",
      address: "Plaça d'Espanya, 08038 Barcelona, Spain",
      coordinates: { lat: 41.37504, lng: 2.14911 },
      attractionIds: ["montjuic", "mnac", "fundacio-joan-miro", "poble-espanyol"],
    },
    {
      id: "barceloneta",
      name: "Barceloneta",
      description: "منطقة الشاطئ والواجهة البحرية — مثالية تختم فيها يوم استكشاف.",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beach%2C_Barcelona_%28P1170713%29.jpg/1280px-Beach%2C_Barcelona_%28P1170713%29.jpg",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barceloneta+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Barceloneta+Barcelona",
      address: "Passeig Marítim de la Barceloneta, 08003 Barcelona, Spain",
      coordinates: { lat: 41.37939, lng: 2.18919 },
      attractionIds: ["barceloneta-beach", "museu-historia-catalunya"],
    },
  ],

  foodCategories: [
    { id: "breakfast", icon: "🥐", label: "Breakfast" },
    { id: "local", icon: "🥘", label: "Local Food" },
    { id: "tapas", icon: "🍢", label: "Tapas" },
    { id: "cafes", icon: "☕", label: "Cafés" },
    { id: "desserts", icon: "🍰", label: "Desserts" },
    { id: "casual", icon: "🍔", label: "Casual" },
    { id: "view", icon: "🌅", label: "أجواء / إطلالة" },
    { id: "restaurants", icon: "🍴", label: "مطاعم" },
  ],

  foodPlaces: [
    // ── Breakfast ──────────────────────────────────────────────
    {
      id: "federal-cafe",
      name: "Federal Café",
      image: "/images-barcelona/federal-cafe.jpg",
      imageSource: "LOCAL_IMAGES",
      categoryId: "breakfast",
      area: "Sant Antoni",
      address: "Carrer del Parlament, 39, 08015 Barcelona, Spain",
      priceLevel: "$$",
      why: "فطور وبرنش بأجواء عصرية — من أشهر أماكن الـ brunch بالمدينة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Federal+Cafe+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Federal+Cafe+Barcelona",
      officialUrl: "https://federalcafe.es",
      rating: 3.9,
      reviewCount: 3993,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "18:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "vegetarian"],
      badges: ["popular"],
    },
    {
      id: "brunch-and-cake",
      name: "Brunch & Cake",
      image:"/images-barcelona/brunch - cake.jpg",
      imageSource: "LOCAL_IMAGES",
      categoryId: "breakfast",
      area: "Eixample",
      address: "Carrer d'Enric Granados, 19, 08007 Barcelona, Spain",
      priceLevel: "$$",
      why: "سلسلة برانش شهيرة بأطباق ملونة وأجواء مريحة — خيار مضمون دايمًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Brunch+%26+Cake+Enric+Granados+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Brunch+and+Cake+Enric+Granados+Barcelona",
      officialUrl: "https://brunchandcake.com/enric-granados/",
      rating: 4.4,
      reviewCount: 9725,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "09:00", close: "17:00" }],
          tuesday: [{ open: "09:00", close: "17:00" }],
          wednesday: [{ open: "09:00", close: "17:00" }],
          thursday: [{ open: "09:00", close: "17:00" }],
          friday: [{ open: "08:30", close: "17:00" }],
          saturday: [{ open: "08:30", close: "17:00" }],
          sunday: [{ open: "08:30", close: "17:00" }],
        },
        source: "official",
        sourceUrl: "https://brunchandcake.com/enric-granados/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "vegetarian", "dessert"],
      badges: ["popular"],
    },
    {
      id: "milk-bar-bistro",
      name: "Milk Bar & Bistro",
      image:"/images-barcelona/milk-bar-bistro.jpg",
      imageSource: "LOCAL_IMAGES",
      categoryId: "breakfast",
      area: "El Born",
      address: "Carrer d'en Gignàs, 21, 08002 Barcelona, Spain",
      priceLevel: "$$",
      why: "برنش أيرلندي-كتالوني بأجواء دافئة، خيار ممتاز لفطور بطيء.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Milk+Bar+and+Bistro+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Milk+Bar+and+Bistro+Barcelona",
      rating: 4.5,
      reviewCount: 2833,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "16:00",
            },
            {
              open: "19:00",
              close: "23:30",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "16:00",
            },
            {
              open: "19:00",
              close: "23:30",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "16:00",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "coffee"],
    },
    {
      id: "satans-coffee-corner",
      name: "Satan's Coffee Corner",
      image:"/images-barcelona/satans-coffee.jpg",
      imageSource:"LOCAL_IMAGES",
      categoryId: "breakfast",
      area: "Gothic Quarter",
      address: "Carrer de l'Arc de Sant Ramon del Call, 11, 08002 Barcelona, Spain",
      priceLevel: "$",
      why: "قهوة اختصاصية + فطور خفيف بمكان صغير وهادئ وسط الحي القوطي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Satans+Coffee+Corner+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Satans+Coffee+Corner+Barcelona",
      rating: 4.2,
      ratingSource: "Google",
      hours: {
        type: "temporarily-closed",
        display: "مغلق مؤقتًا",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "vegetarian"],
    },
    {
      id: "baluard-barceloneta",
      name: "Baluard Barceloneta",
      image:"/images-barcelona/Bakkerij-Baluard.jpg",
      imageSource:"LOCAL_IMAGES",
      categoryId: "breakfast",
      area: "Barceloneta",
      address: "Carrer del Baluard, 38, 08003 Barcelona, Spain",
      priceLevel: "$",
      why: "مخبز محلي معروف بخبزه الطازج — خيار اقتصادي وسريع لبداية يومك.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Baluard+Barceloneta+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Baluard+Barceloneta+Barcelona",
      officialUrl: "https://baluardbarceloneta.com",
      rating: 4.5,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          tuesday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          wednesday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          thursday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          friday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          saturday: [
            {
              open: "07:30",
              close: "20:30",
            },
          ],
          sunday: [
            {
              open: "07:30",
              close: "15:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["vegetarian", "dessert"],
      badges: ["great-value"],
    },
    {
      id: "bar-lobo",
      name: "Bar Lobo",
      image: "/images-barcelona/bar-lobo.jpg",
      imageSource: "LOCAL_IMAGE",
      categoryId: "breakfast",
      area: "Raval",
      address: "Carrer del Pintor Fortuny, 3, 08001 Barcelona, Spain",
      priceLevel: "$$",
      why: "فطور كلاسيكي بأجواء نهارية مريحة قريب من La Rambla.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bar+Lobo+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Bar+Lobo+Barcelona",
      officialUrl: "https://barlobo.com",
      rating: 4.0,
      reviewCount: 3223,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "coffee"],
    },

    // ── Local Food ─────────────────────────────────────────────
    {
      id: "can-culleretes",
      name: "Can Culleretes",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Barcelona_-_entrance_of_Can_Culleretes_01.jpg/1280px-Barcelona_-_entrance_of_Can_Culleretes_01.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "local",
      area: "Gothic Quarter",
      address: "Carrer d'en Quintana, 5, 08002 Barcelona, Spain",
      priceLevel: "$$",
      why: "أقدم مطعم في برشلونة (منذ 1786) — مطبخ كتالوني تقليدي بأجواء نوستالجية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Can+Culleretes+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Can+Culleretes+Barcelona",
      officialUrl: "https://culleretes.com",
      rating: 4.2,
      reviewCount: 9867,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "13:00",
              close: "15:45",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "15:45",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "15:45",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "seafood", "pork-maybe"],
      badges: ["local-experience"],
    },
    {
      id: "7-portes",
      name: "7 Portes",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cantonada_del_restaurant_7_Portes.JPG/1280px-Cantonada_del_restaurant_7_Portes.JPG",
      imageSource: WIKIMEDIA,
      categoryId: "local",
      area: "Port Vell / Barceloneta",
      address: "Passeig d'Isabel II, 14, 08003 Barcelona, Spain",
      priceLevel: "$$$",
      why: "مطعم تاريخي من 1836 — مشهور بالأرز والمأكولات البحرية الكتالونية الأصيلة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=7+Portes+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=7+Portes+Barcelona",
      officialUrl: "https://www.7portes.com",
      rating: 4.3,
      reviewCount: 36013,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          tuesday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat"],
      badges: ["best-overall", "local-experience"],
    },
    {
      id: "els-quatre-gats",
      name: "Els Quatre Gats",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/113_Centenari_dels_4_Gats%2C_c._Montsi%C3%B3.jpg/1280px-113_Centenari_dels_4_Gats%2C_c._Montsi%C3%B3.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "local",
      area: "Gothic Quarter",
      address: "Carrer de Montsió, 3, 08002 Barcelona, Spain",
      priceLevel: "$$$",
      why: "مقهى-مطعم تاريخي ارتبط اسمه بـ Picasso — مطبخ كتالوني بمبنى مودرنيستي مذهل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Els+Quatre+Gats+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Els+Quatre+Gats+Barcelona",
      officialUrl: "https://www.4gats.com",
      rating: 4.1,
      reviewCount: 7812,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          wednesday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          thursday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          friday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "17:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "pork-maybe"],
      badges: ["popular"],
    },
    {
      id: "can-sole",
      name: "Can Solé",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Barcelona_%28La_Barceloneta%29._Restaurant_%E2%80%9CCan_Sol%C3%A9%E2%80%9D._Wall_painting-_fisherwomen_and_fishermen._1949._Alexandre_Cirici%2C_painter_%2830250710881%29.jpg/1280px-Barcelona_%28La_Barceloneta%29._Restaurant_%E2%80%9CCan_Sol%C3%A9%E2%80%9D._Wall_painting-_fisherwomen_and_fishermen._1949._Alexandre_Cirici%2C_painter_%2830250710881%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "local",
      area: "Barceloneta",
      address: "Carrer de Sant Carles, 4, 08003 Barcelona, Spain",
      priceLevel: "$$$",
      why: "مطعم بحريات وأرز عائلي منذ 1903 في قلب Barceloneta — من كلاسيكيات المدينة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Can+Sole+Barceloneta+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Can+Sole+Barceloneta+Barcelona",
      rating: 4.3,
      reviewCount: 1841,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "13:00",
              close: "16:00",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "16:00",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "16:00",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "16:00",
            },
            {
              open: "20:30",
              close: "23:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "16:00",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "16:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood"],
      badges: ["local-experience"],
    },
    {
      id: "agut",
      name: "Agut",
      image: "/images-barcelona/agut.jpg",
      imageSource:"local_image",
      categoryId: "local",
      area: "Gothic Quarter",
      address: "Carrer d'en Gignàs, 16, 08002 Barcelona, Spain",
      priceLevel: "$$",
      why: "حانة كتالونية تقليدية منذ 1924 — أكل بيتي أصيل بعيد عن الزحمة السياحية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Restaurant+Agut+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Restaurant+Agut+Barcelona",
      rating: 4.6,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "22:30",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "15:45",
            },
            {
              open: "20:00",
              close: "23:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "15:45",
            },
          ],
      },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "pork-maybe"],
      badges: ["less-touristy"],
    },
    // ── Tapas ──────────────────────────────────────────────────
    {
      id: "quimet-y-quimet",
      name: "Quimet y Quimet",
      image: "/images-barcelona/Quimet.jpg",
      imageSource: "local_image",
      categoryId: "tapas",
      area: "Poble Sec",
      address: "Carrer del Poeta Cabanyes, 25, 08004 Barcelona, Spain",
      priceLevel: "$$",
      why: "بار صغير واقفًا بس — مونتاديتوس وتاباس مبتكرة من أفضل ما بالمدينة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Quimet+y+Quimet+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Quimet+y+Quimet+Barcelona",
      officialUrl: "https://quimetiquimet.com",
      rating: 4.6,
      reviewCount: 3716,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "16:00",
            },
            {
              open: "18:00",
              close: "22:30",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "16:00",
            },
            {
              open: "18:00",
              close: "22:30",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "16:00",
            },
            {
              open: "18:00",
              close: "22:30",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "16:00",
            },
            {
              open: "18:00",
              close: "22:30",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "16:00",
            },
            {
              open: "18:00",
              close: "22:30",
            },
          ],
          saturday: [],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "pork-maybe"],
      badges: ["best-overall"],
    },
    {
      id: "el-xampanyet",
      name: "El Xampanyet",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/053_El_Xampanyet%2C_c._Montcada_22_%28Barcelona%29.jpg/1280px-053_El_Xampanyet%2C_c._Montcada_22_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "tapas",
      area: "El Born",
      address: "Carrer de Montcada, 22, 08003 Barcelona, Spain",
      priceLevel: "$$",
      why: "بار كافا وتاباس عمره قرابة 100 سنة — أنشوجة وأطباق كلاسيكية بأجواء صاخبة ودّية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Xampanyet+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Xampanyet+Barcelona",
      rating: 4.6,
      reviewCount: 6373,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "12:00",
              close: "15:30",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "15:30",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "15:30",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "15:30",
            },
            {
              open: "19:00",
              close: "23:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "15:30",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "pork-maybe"],
      badges: ["best-overall"],
    },
    {
      id: "cerveceria-catalana",
      name: "Cerveceria Catalana",
      image: "/images-barcelona/cerveceria.jpg",
      imageSource: "local_image",
      categoryId: "tapas",
      area: "Eixample",
      address: "Carrer de Mallorca, 236, 08008 Barcelona, Spain",
      priceLevel: "$$",
      why: "من أعرق بارات التاباس بالمدينة — دايمًا مزدحم بالمحليين، وهذا مؤشر جيد.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cerveceria+Catalana+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cerveceria+Catalana+Barcelona",
      rating: 4.5,
      reviewCount: 24571,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "01:30",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "pork-maybe"],
      badges: ["best-overall"],
    },
    {
      id: "bar-mut",
      name: "Bar Mut",
      image: "/images-barcelona/Bar-Mut.jpg",
      imageSource: "local_image",
      categoryId: "tapas",
      area: "Eixample",
      address: "Carrer de Pau Claris, 192, 08037 Barcelona, Spain",
      priceLevel: "$$$",
      why: "تاباس راقية بمكونات ممتازة — خيار Modern لمن يريد تجربة أرقى من البار التقليدي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bar+Mut+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Bar+Mut+Barcelona",
      rating: 3.9,
      reviewCount: 1400,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          tuesday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "pork-maybe"],
    },
    {
      id: "ciutat-comtal",
      name: "Ciutat Comtal",
      image: "/images-barcelona/ciutat.jpg",
      imageSource: "local_image",
      categoryId: "tapas",
      area: "Rambla de Catalunya",
      address: "Rambla de Catalunya, 18, 08007 Barcelona, Spain",
      priceLevel: "$$",
      why: "بار تاباس كلاسيكي دايمًا مزدحم — واجهة أطباق ضخمة تختار منها مباشرة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ciutat+Comtal+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Ciutat+Comtal+Barcelona",
      rating: 4.4,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "01:30",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "01:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "pork-maybe"],
    },
    {
      id: "la-cova-fumada",
      name: "La Cova Fumada",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/La_Cova_Fumada.jpg/1280px-La_Cova_Fumada.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "tapas",
      area: "Barceloneta",
      address: "Carrer del Baluard, 56, 08003 Barcelona, Spain",
      priceLevel: "$$",
      why: "المكان اللي وُلدت فيه تاباس 'la bomba' — بار صغير أصيل بلا أي رتوش سياحية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=La+Cova+Fumada+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=La+Cova+Fumada+Barcelona",
      rating: 4.6,
      reviewCount: 5416,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "15:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "15:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "15:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "18:00",
              close: "20:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "15:00",
            },
            {
              open: "18:00",
              close: "20:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "13:00",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "pork-maybe"],
      badges: ["local-experience", "less-touristy"],
    },

    // ── Cafés ──────────────────────────────────────────────────
    {
      id: "cafe-de-lopera",
      name: "Café de l'Òpera",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/129_Caf%C3%A8_de_l%27%C3%92pera%2C_Rambla_74_%28Barcelona%29.jpg/1280px-129_Caf%C3%A8_de_l%27%C3%92pera%2C_Rambla_74_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "cafes",
      area: "La Rambla",
      address: "La Rambla, 74, 08002 Barcelona, Spain",
      priceLevel: "$$",
      why: "مقهى تاريخي مفتوح من 1929 مقابل Liceu Theatre — مشهور بالتشوروس والشوكولاتة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+de+l+Opera+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cafe+de+l+Opera+Barcelona",
      rating: 3.5,
      reviewCount: 827,
      ratingSource: "TripAdvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          saturday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
          sunday: [
            {
              open: "08:30",
              close: "02:30",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "dessert"],
    },
    {
      id: "nomad-coffee",
      name: "Nomad Coffee",
      image: "/images-barcelona/nomad-coffee.jpg",
      imageSource: "local_image",
      categoryId: "cafes",
      area: "El Born",
      address: "Passatge de Sert, 12, 08003 Barcelona, Spain",
      priceLevel: "$$",
      why: "قهوة اختصاصية من أفضل ما بالمدينة — حبوب مختارة بعناية وأجواء هادئة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nomad+Coffee+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Nomad+Coffee+Barcelona",
      officialUrl: "https://nomadcoffee.es",
      rating: 4.6,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          saturday: [],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee"],
      badges: ["best-overall"],
    },
    {
      id: "slowmov",
      name: "SlowMov",
      image: "/images-barcelona/slowmov.jpg",
      imageSource: "local_image",
      categoryId: "cafes",
      area: "Gràcia",
      address: "Carrer de Neptú, 36, 08006 Barcelona, Spain",
      priceLevel: "$$",
      why: "مقهى اختصاصي هادئ ومصمم بعناية — مكان ممتاز لاستراحة بعيدة عن الزحمة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=SlowMov+Coffee+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=SlowMov+Coffee+Barcelona",
      rating: 4.5,
      reviewCount: 1234,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:00",
              close: "17:00",
            },
          ],
          tuesday: [
            {
              open: "08:00",
              close: "17:00",
            },
          ],
          wednesday: [
            {
              open: "08:00",
              close: "17:00",
            },
          ],
          thursday: [
            {
              open: "08:00",
              close: "17:00",
            },
          ],
          friday: [
            {
              open: "08:00",
              close: "17:00",
            },
          ],
          saturday: [
            {
              open: "08:30",
              close: "16:00",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee"],
    },
    {
      id: "cafes-el-magnifico",
      name: "Cafés El Magnífico",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Barcelona_2013_%2811732559635%29.jpg/1280px-Barcelona_2013_%2811732559635%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "cafes",
      area: "El Born",
      address: "Carrer de l'Argenteria, 64, 08003 Barcelona, Spain",
      priceLevel: "$",
      why: "محمصة قهوة عائلية تاريخية منذ 1919 — للي يحب يجرب قهوة أصيلة بطابع محلي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafes+El+Magnifico+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cafes+El+Magnifico+Barcelona",
      officialUrl: "https://cafeselmagnifico.com",
      rating: 4.7,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "10:00",
              close: "20:00",
            },
          ],
          tuesday: [
            {
              open: "10:00",
              close: "20:00",
            },
          ],
          wednesday: [
            {
              open: "10:00",
              close: "20:00",
            },
          ],
          thursday: [
            {
              open: "10:00",
              close: "20:00",
            },
          ],
          friday: [
            {
              open: "10:00",
              close: "20:00",
            },
          ],
          saturday: [],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee"],
      badges: ["local-experience"],
    },
    {
      id: "el-noa-noa",
      name: "El Noa Noa",
      image: "/images-barcelona/el-noa.jpg",
      imageSource: "local_image",
      categoryId: "cafes",
      area: "Gràcia",
      address: "Carrer de Torrijos, 22, 08012 Barcelona, Spain",
      priceLevel: "$$",
      why: "مقهى ومكتبة صغيرة بأجواء Gràcia الهادئة — بعيد عن المسار السياحي المزدحم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Noa+Noa+Cafe+Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Noa+Noa+Cafe+Gracia+Barcelona",
      rating: 4.8,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "19:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          sunday: [
            {
              open: "10:00",
              close: "18:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "vegetarian"],
    },
    // ── Desserts ───────────────────────────────────────────────
    {
      id: "escriba",
      name: "Escribà",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/038_Pastisseria_Escriv%C3%A0_%28la_Rambla%29%2C_aparador.jpg/1280px-038_Pastisseria_Escriv%C3%A0_%28la_Rambla%29%2C_aparador.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "desserts",
      area: "La Rambla",
      address: "La Rambla, 83, 08002 Barcelona, Spain",
      priceLevel: "$$",
      why: "محل حلويات وشوكولاتة عائلي عريق منذ 1906 — واجهته المودرنيستية وحدها تستاهل زيارة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Escriba+La+Rambla+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Escriba+La+Rambla+Barcelona",
      officialUrl: "https://escriba.es",
      rating: 4.1,
      reviewCount: 4118,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "21:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["dessert", "vegetarian"],
      badges: ["popular"],
    },
    {
      id: "granja-viader",
      name: "Granja M. Viader",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/466_Granja_Viader%2C_c._Xucl%C3%A0_4-6_%28Barcelona%29.jpg/1280px-466_Granja_Viader%2C_c._Xucl%C3%A0_4-6_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "desserts",
      area: "Raval",
      address: "Carrer d'en Xuclà, 4-6, 08001 Barcelona, Spain",
      priceLevel: "$",
      why: "أقدم 'غرانخا' بالمدينة (منذ 1870) — شوكولاتة ساخنة وتشوروس وأجواء عتيقة أصيلة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Granja+M+Viader+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Granja+M+Viader+Barcelona",
      rating: 4.4,
      reviewCount: 6430,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "09:00",
              close: "13:30",
            },
            {
              open: "17:00",
              close: "20:30",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "13:30",
            },
            {
              open: "17:00",
              close: "20:30",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "13:30",
            },
            {
              open: "17:00",
              close: "20:30",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "13:30",
            },
            {
              open: "17:00",
              close: "20:30",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "13:30",
            },
            {
              open: "17:00",
              close: "20:30",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["dessert", "vegetarian"],
      badges: ["local-experience"],
    },
    {
      id: "bubo",
      name: "Bubó",
      image: "/images-barcelona/bubo.jpg",
      imageSource: "local_image",
      categoryId: "desserts",
      area: "El Born",
      address: "Carrer de les Caputxes, 10, 08003 Barcelona, Spain",
      priceLevel: "$$",
      why: "بوتيك حلويات مودرن لشيف حلويات معروف — تجربة بصرية بقدر ما هي طعم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bubo+Barcelona+Dessert",
      appleMapsUrl: "https://maps.apple.com/?q=Bubo+Barcelona+Dessert",
      officialUrl: "https://www.bubo.es",
      rating: 4.3,
      reviewCount: 3426,
      ratingSource: "Restaurant Guru",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          tuesday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          wednesday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          thursday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          friday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          saturday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
          sunday: [
            {
              open: "08:00",
              close: "21:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["dessert"],
    },
    {
      id: "oriol-balaguer",
      name: "Oriol Balaguer",
      image: "/images-barcelona/Oriol.jpg",
      imageSource: "local_image",
      categoryId: "desserts",
      area: "Sant Gervasi",
      address: "Plaça de Sant Gregori Taumaturg, 2, 08021 Barcelona, Spain",
      priceLevel: "$$$",
      why: "بوتيك حلويات لأحد أشهر شيفات الحلويات في إسبانيا — للي يبحث عن شي مميز.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Oriol+Balaguer+Placa+Sant+Gregori+Taumaturg+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Oriol+Balaguer+Placa+Sant+Gregori+Taumaturg+Barcelona",
      officialUrl: "https://oriolbalaguershop.com/es/stores",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:00",
              close: "14:00",
            },
            {
              open: "16:00",
              close: "20:30",
            },
          ],
          tuesday: [
            {
              open: "08:00",
              close: "14:00",
            },
            {
              open: "16:00",
              close: "20:30",
            },
          ],
          wednesday: [
            {
              open: "08:00",
              close: "14:00",
            },
            {
              open: "16:00",
              close: "20:30",
            },
          ],
          thursday: [
            {
              open: "08:00",
              close: "14:00",
            },
            {
              open: "16:00",
              close: "20:30",
            },
          ],
          friday: [
            {
              open: "08:00",
              close: "14:00",
            },
            {
              open: "16:00",
              close: "20:30",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "14:30",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "14:30",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      dietaryTags: ["dessert"],
    },
    {
      id: "gelaaati-di-marco",
      name: "Gelaaati di Marco",
      image: "/images-barcelona/gelaato.jpg",
      imageSource: "local_image",
      categoryId: "desserts",
      area: "El Born",
      address: "Carrer de la Llibreteria, 7, 08002 Barcelona, Spain",
      priceLevel: "$",
      why: "جيلاتو إيطالي محلي الصنع من أشهر الخيارات بالمدينة — طابور دايم مؤشر جودة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gelaaati+di+Marco+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gelaaati+di+Marco+Barcelona",
      rating: 4.7,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "11:30",
              close: "00:00",
            },
          ],
          tuesday: [
            {
              open: "11:30",
              close: "00:00",
            },
          ],
          wednesday: [
            {
              open: "11:30",
              close: "00:00",
            },
          ],
          thursday: [
            {
              open: "11:30",
              close: "00:00",
            },
          ],
          friday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "11:00",
              close: "00:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["dessert", "vegetarian"],
    },

    // ── Casual ─────────────────────────────────────────────────
    {
      id: "conesa-entrepans",
      name: "Conesa Entrepans",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Conesa_Entrepans%2C_entrada.jpg/1280px-Conesa_Entrepans%2C_entrada.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "casual",
      area: "Gothic Quarter",
      address: "Carrer de la Llibreteria, 1, 08002 Barcelona, Spain",
      priceLevel: "$",
      why: "محل سندويشات عائلي منذ 1951 — سريع، رخيص، ولذيذ. طابور محليين مؤشر ثقة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Conesa+Entrepans+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Conesa+Entrepans+Barcelona",
      rating: 4.5,
      reviewCount: 5748,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          tuesday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          wednesday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          thursday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          friday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          saturday: [
            {
              open: "08:30",
              close: "22:15",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "vegetarian", "pork-maybe"],
      badges: ["great-value"],
    },
    {
      id: "kiosko-universal",
      name: "Kiosko Universal",
      image: "/images-barcelona/kiosko.jpg",
      imageSource: "local_image",
      categoryId: "casual",
      area: "داخل Mercat de la Boqueria",
      address: "La Rambla, 91, 08001 Barcelona, Spain",
      priceLevel: "$$",
      why: "كشك بحريات داخل سوق Boqueria — غداء سريع وطازج وسط أجواء السوق الحيوية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kiosko+Universal+Boqueria+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Kiosko+Universal+Boqueria+Barcelona",
      rating: 4.5,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "17:00",
            },
          ],
          sunday: [],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood"],
    },
    {
      id: "100-montaditos",
      name: "100 Montaditos",
      image: "/images-barcelona/Montaditos.jpg",
      imageSource: "local_image",
      categoryId: "casual",
      area: "Eixample",
      address: "Rambla de Catalunya, 11, 08007 Barcelona, Spain",
      priceLevel: "$",
      why: "سلسلة سندويشات صغيرة اقتصادية جدًا — خيار سريع ومضمون لأي وقت باليوم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=100+Montaditos+Rambla+de+Catalunya+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=100+Montaditos+Rambla+de+Catalunya+Barcelona",
      officialUrl: "https://www.100montaditos.com",
      rating: 3.8,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "09:30", close: "00:30" }],
          tuesday: [{ open: "09:30", close: "00:30" }],
          wednesday: [{ open: "09:30", close: "00:30" }],
          thursday: [{ open: "09:30", close: "00:30" }],
          friday: [{ open: "10:00", close: "01:00" }],
          saturday: [{ open: "10:00", close: "01:00" }],
          sunday: [{ open: "09:00", close: "00:30" }],
        },
        source: "google",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "vegetarian", "pork-maybe"],
      badges: ["great-value"],
    },
    {
      id: "la-bodegueta",
      name: "La Bodegueta",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/5d/La_Bodegueta%2C_Rambla_de_Catalunya_100_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "casual",
      area: "Eixample",
      address: "Rambla de Catalunya, 100, 08008 Barcelona, Spain",
      priceLevel: "$$",
      why: "حانة كلاسيكية تحت الأرض — أجواء بسيطة وأكل يومي بسعر معقول.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=La+Bodegueta+Rambla+Catalunya+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=La+Bodegueta+Rambla+Catalunya+Barcelona",
      rating: 4.1,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "01:45",
            },
          ],
          sunday: [
            {
              open: "18:30",
              close: "01:45",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["meat", "pork-maybe"],
    },
    {
      id: "flax-and-kale",
      name: "Flax & Kale",
      image: "/images-barcelona/flax-kale.jpg",
      imageSource: "local_image",
      categoryId: "casual",
      area: "Raval",
      address: "Carrer dels Tallers, 74b, 08001 Barcelona, Spain",
      priceLevel: "$$",
      why: "مطعم صحي عصري بخيارات نباتية وvegan واسعة — بديل خفيف وسريع.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Flax+and+Kale+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Flax+and+Kale+Barcelona",
      officialUrl: "https://flaxandkale.com",
      rating: 4.4,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          tuesday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          wednesday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          thursday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          friday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "09:00",
              close: "00:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["vegetarian", "vegan"],
    },

    // ── View / Atmosphere ──────────────────────────────────────
    {
      id: "el-nacional",
      name: "El Nacional",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Via_Barcelona_Casa_Mil%C3%A0.JPG/1280px-Via_Barcelona_Casa_Mil%C3%A0.JPG",
      imageSource: WIKIMEDIA,
      categoryId: "view",
      area: "Passeig de Gràcia",
      address: "Passeig de Gràcia, 24 Bis, 08007 Barcelona, Spain",
      priceLevel: "$$$",
      why: "قاعة طعام ضخمة بديكور كلاسيكي — عدة مطاعم بمكان واحد، أجواء مميزة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Nacional+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Nacional+Barcelona",
      officialUrl: "https://www.elnacionalbcn.com",
      rating: 4.0,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat", "coffee"],
      badges: ["best-atmosphere"],
    },
    {
      id: "miramar-barcelona",
      name: "Studio Miramar",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Miramar_Restaurante_-_panoramio.jpg/1280px-Miramar_Restaurante_-_panoramio.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "view",
      area: "Montjuïc",
      address: "Plaça de Carlos Ibáñez, 3, 08038 Barcelona, Spain",
      priceLevel: "$$$",
      why: "إطلالة على المدينة والميناء من تلة Montjuïc — تجربة مطعم بمنظر بانورامي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Miramar+Barcelona+Restaurant+Montjuic",
      appleMapsUrl: "https://maps.apple.com/?q=Miramar+Barcelona+Restaurant+Montjuic",
      officialUrl: "https://hotelmiramarbarcelona.com/gastronomia",
      rating: 4.2,
      reviewCount: 186,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "13:00", close: "22:00" }],
          tuesday: [{ open: "13:00", close: "22:00" }],
          wednesday: [{ open: "13:00", close: "22:00" }],
          thursday: [{ open: "13:00", close: "22:00" }],
          friday: [{ open: "13:00", close: "22:00" }],
          saturday: [{ open: "13:00", close: "22:00" }],
          sunday: [{ open: "13:00", close: "22:00" }],
        },
        source: "official",
        sourceUrl: "https://hotelmiramarbarcelona.com/gastronomia",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat"],
      badges: ["best-atmosphere"],
    },
    {
      id: "sky-bar-grand-central",
      name: "La Terraza del Central — Grand Hotel Central",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Grand_Hotel_Central_Barcelona.jpg/1280px-Grand_Hotel_Central_Barcelona.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Grand_Hotel_Central_Barcelona.jpg",
      categoryId: "view",
      area: "Gothic Quarter",
      address: "Via Laietana, 30, 08003 Barcelona, Spain",
      priceLevel: "$$$",
      why: "روفتوب فيه مسبح بإطلالة مباشرة على الكاتدرائية — من أجمل مناظر المدينة القديمة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sky+Bar+Grand+Hotel+Central+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Sky+Bar+Grand+Hotel+Central+Barcelona",
      officialUrl: "https://www.grandhotelcentral.com",
      rating: 4.0,
      ratingSource: "TripAdvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "10:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee"],
      badges: ["best-atmosphere"],
    },
    {
      id: "la-isabela-rooftop",
      name: "RoofTop Ohla Barcelona",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Ohla_Barcelona.jpg/1280px-Ohla_Barcelona.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Ohla_Barcelona.jpg",
      categoryId: "view",
      area: "Gothic Quarter (فندق Ohla Barcelona)",
      address: "Via Laietana, 49, 08003 Barcelona, Spain",
      priceLevel: "$$$",
      why: "روفتوب أنيق بإطلالة 360 درجة على وسط المدينة — مثالي وقت الغروب.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=RoofTop+Ohla+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=RoofTop+Ohla+Barcelona",
      rating: 3.5,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "13:00",
              close: "23:00",
            },
          ],
          tuesday: [
            {
              open: "13:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "00:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "23:00",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      dietaryTags: ["coffee", "meat"],
      badges: ["best-atmosphere"],
    },
    {
      id: "1881-sagardi",
      name: "1881 per Sagardi",
      image: "/images-barcelona/1881.jpg",
      imageSource: "local_image",
      categoryId: "view",
      area: "Barceloneta (Palau de Mar)",
      address: "Plaça de Pau Vila, 3, 08039 Barcelona, Spain",
      priceLevel: "$$$",
      why: "مطعم باسكي-كتالوني بإطلالة على ميناء برشلونة — أجواء هادئة بعيدة عن الزحمة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=1881+per+Sagardi+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=1881+per+Sagardi+Barcelona",
      officialUrl: "https://www.sagardi.com",
      rating: 3.8,
      ratingSource: "Tripadvisor",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "10:00", close: "00:00" }],
          tuesday: [{ open: "10:00", close: "00:00" }],
          wednesday: [{ open: "10:00", close: "00:00" }],
          thursday: [{ open: "10:00", close: "00:00" }],
          friday: [{ open: "10:00", close: "00:00" }],
          saturday: [{ open: "10:00", close: "00:00" }],
          sunday: [{ open: "10:00", close: "00:00" }],
        },
      },
      lastVerified: "8/2026",
      dietaryTags: ["seafood", "meat"],
      badges: ["best-atmosphere", "less-touristy"],
    },

    // ── Restaurants (manual content addition, verified 2026-08 — exact data as given) ──
    {
      id: "disfrutar",
      name: "Disfrutar",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Disfrutar.jpg/1280px-Disfrutar.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Disfrutar.jpg",
      imagePosition: "center 20%",
      categoryId: "restaurants",
      area: "Eixample",
      address: "Carrer de Villarroel, 163, Eixample, 08036 Barcelona, Spain",
      priceLevel: "$$$",
      why: "مطعم إبداعي حاصل على نجوم ميشلان، من أعلى المطاعم تصنيفًا عالميًا — قائمة تذوق تجريبية غير تقليدية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Disfrutar+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Disfrutar+Barcelona",
      officialUrl: "http://www.disfrutarbarcelona.com/",
      phone: "+34 933 48 68 96",
      rating: 4.8,
      reviewCount: 3776,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            { open: "12:30", close: "13:00" },
            { open: "19:30", close: "20:00" },
          ],
          tuesday: [
            { open: "12:30", close: "13:00" },
            { open: "19:30", close: "20:00" },
          ],
          wednesday: [
            { open: "12:30", close: "13:00" },
            { open: "19:30", close: "20:00" },
          ],
          thursday: [
            { open: "12:30", close: "13:00" },
            { open: "19:30", close: "20:00" },
          ],
          friday: [
            { open: "12:30", close: "13:00" },
            { open: "19:30", close: "20:00" },
          ],
        },
        lastVerified: "2026-08",
      },
      dietaryTags: [],
    },
    {
      id: "canete",
      name: "Cañete",
      image: "/images-barcelona/canete.jpg",
      imageSource: "local_image",
      categoryId: "restaurants",
      area: "Ciutat Vella",
      address: "Carrer de la Unió, 17, Ciutat Vella, 08001 Barcelona, Spain",
      priceLevel: "$$$",
      why: "بار-مطعم تاباس راقي بأجواء حيوية، من أشهر أماكن الأكل بمنطقة Raval/Gothic Quarter.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Canete+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Canete+Barcelona",
      officialUrl: "http://www.barcanete.com/",
      phone: "+34 932 70 34 58",
      rating: 4.6,
      reviewCount: 8073,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "13:00", close: "00:00" }],
          tuesday: [{ open: "13:00", close: "00:00" }],
          wednesday: [{ open: "13:00", close: "00:00" }],
          thursday: [{ open: "13:00", close: "00:00" }],
          friday: [{ open: "13:00", close: "00:00" }],
          saturday: [{ open: "13:00", close: "00:00" }],
        },
        lastVerified: "2026-08",
      },
      dietaryTags: [],
    },
    {
      id: "cal-pep",
      name: "Cal Pep",
      image: "/images-barcelona/cal pep.jpg",
      imageSource: "local_image",
      categoryId: "restaurants",
      area: "Ciutat Vella",
      address: "Plaça de les Olles, 8, Ciutat Vella, 08003 Barcelona, Spain",
      priceLevel: "$$",
      why: "بار تاباس أسطوري بحي El Born منذ 1989 — مأكولات بحرية طازجة وأجواء محلية أصيلة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cal+Pep+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cal+Pep+Barcelona",
      officialUrl: "https://www.calpep.com/",
      phone: "+34 933 10 79 61",
      rating: 4.4,
      reviewCount: 3119,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "19:30", close: "23:30" }],
          tuesday: [
            { open: "13:00", close: "15:45" },
            { open: "19:30", close: "23:30" },
          ],
          wednesday: [
            { open: "13:00", close: "15:45" },
            { open: "19:30", close: "23:30" },
          ],
          thursday: [
            { open: "13:00", close: "15:45" },
            { open: "19:30", close: "23:30" },
          ],
          friday: [
            { open: "13:00", close: "15:45" },
            { open: "19:30", close: "23:30" },
          ],
          saturday: [
            { open: "13:15", close: "15:45" },
            { open: "19:30", close: "23:30" },
          ],
        },
        lastVerified: "2026-08",
      },
      dietaryTags: ["seafood"],
    },
  ],

  mustTryDishes: [
    {
      name: "Paella",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/01_Paella_Valenciana_original.jpg/1280px-01_Paella_Valenciana_original.jpg",
      imageSource: WIKIMEDIA,
      description: "أرز بالزعفران مع بحريات أو لحوم — أصلها فالنسي بس منتشرة بقوة هون.",
      dietary: "depends-ask",
    },
    {
      name: "Pa amb tomàquet",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pa_amb_tomaquet.jpg/1280px-Pa_amb_tomaquet.jpg",
      imageSource: WIKIMEDIA,
      description: "خبز بالطماطم وزيت زيتون — طبق كتالوني بسيط يرافق أغلب الوجبات.",
      dietary: "usually-pork-free",
    },
    {
      name: "Jamón ibérico",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jamon_iberico_de_bellota_2_%28cinco_jotas%29.jpg/1280px-Jamon_iberico_de_bellota_2_%28cinco_jotas%29.jpg",
      imageSource: WIKIMEDIA,
      description: "لحم خنزير مقدد إسباني فاخر، يُقدَّم مقطعًا رقيقًا.",
      dietary: "usually-pork",
    },
    {
      name: "Crema Catalana",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Creme_catalane.jpg/1280px-Creme_catalane.jpg",
      imageSource: WIKIMEDIA,
      description: "حلى كريمة بقشرة سكر محروقة — نسخة كتالونية من الكريم بروليه.",
      dietary: "usually-pork-free",
    },
    {
      name: "Patatas bravas",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Patatas_Bravas.JPG/1280px-Patatas_Bravas.JPG",
      imageSource: WIKIMEDIA,
      description: "بطاطا مقرمشة مع صوص حار ومايونيز — من أشهر أطباق التاباس.",
      dietary: "usually-pork-free",
    },
  ],

  stayAreas: [
    {
      id: "eixample",
      name: "Eixample",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg/1280px-Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg",
      imageSource: WIKIMEDIA,
      bestFor: ["أول زيارة", "هدوء نسبي"],
      pros: ["مركزي", "Metro ممتاز", "قريب من معالم Gaudí"],
      cons: ["أبعد عن البحر"],
      priceLevel: "€€–€€€",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Eixample+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Eixample+Barcelona",
    },
    {
      id: "gothic-quarter",
      name: "Gothic Quarter",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg/1280px-Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg",
      imageSource: WIKIMEDIA,
      bestFor: ["أجواء تاريخية", "المشي لكل مكان"],
      pros: ["بقلب الأحداث", "مطاعم بكل زاوية", "ما تحتاج مترو كثير"],
      cons: ["ضجيج ليلي ببعض الشوارع", "غرف أصغر وأقدم"],
      priceLevel: "€€–€€€",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gothic+Quarter+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gothic+Quarter+Barcelona",
    },
    {
      id: "el-born",
      name: "El Born",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arc_de_Triomf%2C_Barcelona_2716.jpg/1280px-Arc_de_Triomf%2C_Barcelona_2716.jpg",
      imageSource: WIKIMEDIA,
      bestFor: ["أجواء أنيقة", "هدوء نسبي قريب من المركز"],
      pros: ["أنيق وهادئ نسبيًا", "مطاعم عصرية", "قريب من الشاطئ"],
      cons: ["أسعار أعلى", "خيارات اقتصادية أقل"],
      priceLevel: "€€€",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Born+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Born+Barcelona",
    },
    {
      id: "gracia",
      name: "Gràcia",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Parc_guell_-_panoramio.jpg/1280px-Parc_guell_-_panoramio.jpg",
      imageSource: WIKIMEDIA,
      bestFor: ["الشباب", "بعيد عن الزحمة"],
      pros: ["أجواء محلية أصيلة", "أسعار أفضل", "مقاهٍ هادئة"],
      cons: ["يحتاج مترو للمركز", "فنادق فاخرة أقل"],
      priceLevel: "€–€€",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gracia+Barcelona",
    },
    {
      id: "barceloneta",
      name: "Barceloneta",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beach%2C_Barcelona_%28P1170713%29.jpg/1280px-Beach%2C_Barcelona_%28P1170713%29.jpg",
      imageSource: WIKIMEDIA,
      bestFor: ["قريب من البحر"],
      pros: ["دقايق من الشاطئ", "أجواء بحرية", "مطاعم مأكولات بحرية"],
      cons: ["أبعد عن معالم Gaudí", "مزدحم جدًا صيفًا"],
      priceLevel: "€€",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barceloneta+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Barceloneta+Barcelona",
    },
  ],

  transportModes: [
    { id: "metro", icon: "🚇", name: "Metro", whenToUse: "غالبًا أفضل خيار للمسافات المتوسطة والبعيدة.", officialUrl: "https://www.tmb.cat" },
    { id: "walking", icon: "🚶", name: "Walking", whenToUse: "ممتاز داخل Gothic Quarter وEl Born." },
    { id: "taxi", icon: "🚕", name: "Taxi", whenToUse: "مفيد مع شنط أو بالليل — مش لازم لكل مشوار." },
    { id: "bus", icon: "🚌", name: "Bus", whenToUse: "يغطي مسارات ما يوصلها المترو مباشرة.", officialUrl: "https://www.tmb.cat" },
    {
      id: "airport",
      icon: "✈️",
      name: "من المطار للمدينة",
      whenToUse: "Aerobús أو خط المترو R2 Nord أرخص بكثير من Taxi وبفرق وقت بسيط.",
      officialUrl: "https://www.aena.es",
    },
  ],

  shoppingAreas: [
    {
      id: "passeig-de-gracia",
      name: "Passeig de Gràcia",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Via_Barcelona_Casa_Mil%C3%A0.JPG/1280px-Via_Barcelona_Casa_Mil%C3%A0.JPG",
      imageSource: WIKIMEDIA,
      bestFor: "Luxury",
      description: "شارع الماركات العالمية الفاخرة، وفيه Casa Batlló وCasa Milà كمان.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Passeig+de+Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Passeig+de+Gracia+Barcelona",
      address: "Passeig de Gràcia, 08007 Barcelona, Spain",
      locationLabel: "نقطة مقترحة",
    },
    {
      id: "portal-angel",
      name: "Portal de l'Àngel",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Portal_de_l%27%C3%80ngel_-_Barcelona_%28Catalunya%29.jpg/1280px-Portal_de_l%27%C3%80ngel_-_Barcelona_%28Catalunya%29.jpg",
      imageSource: WIKIMEDIA,
      bestFor: "Popular brands",
      description: "شارع مزدحم بالماركات المتوسطة والشائعة، قريب من Plaça de Catalunya.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Portal+de+l+Angel+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Portal+de+l+Angel+Barcelona",
      address: "Portal de l'Àngel, 08002 Barcelona, Spain",
      locationLabel: "نقطة مقترحة",
    },
    {
      id: "placa-catalunya-area",
      name: "منطقة Plaça de Catalunya",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Catalunya_Barcelona1_tango7174.jpg/1280px-Catalunya_Barcelona1_tango7174.jpg",
      imageSource: WIKIMEDIA,
      bestFor: "Souvenirs",
      description: "نقطة انطلاق جيدة للتسوق العام والهدايا قبل ما تروح لحي ثاني.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+de+Catalunya+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+de+Catalunya+Barcelona",
      address: "Plaça de Catalunya, 08002 Barcelona, Spain",
      locationLabel: "نقطة مقترحة",
    },
    {
      id: "la-roca-village",
      name: "La Roca Village",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/La_Roca_Village_Chic_Outlet_Shopping_%2815275593127%29.jpg/1280px-La_Roca_Village_Chic_Outlet_Shopping_%2815275593127%29.jpg",
      imageSource: WIKIMEDIA,
      bestFor: "Outlet",
      description: "قرية أوتلت خارج المدينة بأسعار مخفضة — تحتاج مواصلات مخصصة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=La+Roca+Village",
      appleMapsUrl: "https://maps.apple.com/?q=La+Roca+Village",
      address: "La Roca Village, s/n, 08430 Santa Agnès de Malanyanes, Barcelona, Spain",
      officialUrl: "https://www.thebicestercollection.com/la-roca-village/en/",
      rating: 4.2,
      reviewCount: 41343,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          tuesday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          wednesday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          thursday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          friday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          saturday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
          sunday: [
            {
              open: "10:00",
              close: "22:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://www.thebicestercollection.com/la-roca-village",
        lastVerified: "2026-08",
      },
    },

    // ── Manual content additions (verified 2026-08 — exact data as given) ──
    {
      id: "diagonal-mar",
      name: "Diagonal Mar",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Diagonal_Mar_shopping_center_%28Barcelona%29.jpg/1280px-Diagonal_Mar_shopping_center_%28Barcelona%29.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Oh-Barcelona.com",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Diagonal_Mar_shopping_center_(Barcelona).jpg",
      imageLicense: "CC BY 2.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      bestFor: "Shopping mall",
      description: "أضخم مول تسوق بمنطقة Diagonal Mar/Poblenou — أكثر من 200 محل موزعة على 3 طوابق.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Diagonal+Mar+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Diagonal+Mar+Barcelona",
      officialUrl: "https://www.diagonalmarcentre.es/",
      address: "Av. Diagonal, 3, Sant Martí, 08019 Barcelona, Spain",
      phone: "+34 935 67 76 41",
      rating: 4.3,
      reviewCount: 66531,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          sunday: [{ open: "12:00", close: "20:00" }],
          monday: [{ open: "09:30", close: "22:00" }],
          tuesday: [{ open: "09:30", close: "22:00" }],
          wednesday: [{ open: "09:30", close: "22:00" }],
          thursday: [{ open: "09:30", close: "22:00" }],
          friday: [{ open: "09:30", close: "22:00" }],
          saturday: [{ open: "09:30", close: "22:00" }],
        },
        lastVerified: "2026-08",
      },
    },
    {
      // Reuses the SAME real neighborhood already present in this guide's `areas` and
      // `stayAreas` arrays (same id "el-born", same image/address) — this is a NEW entry in
      // the shoppingAreas array specifically (none existed here before), not a duplicate of
      // either of those unrelated sections. No hours: a whole neighborhood has no single
      // opening time, and inventing one for it would be dishonest.
      id: "el-born",
      name: "El Born",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arc_de_Triomf%2C_Barcelona_2716.jpg/1280px-Arc_de_Triomf%2C_Barcelona_2716.jpg",
      imageSource: WIKIMEDIA,
      bestFor: "Independent boutiques",
      description: "حي أنيق فيه محلات مستقلة وماركات محلية صغيرة، بعيد عن زحمة السلاسل العالمية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Born+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Born+Barcelona",
      address: "Passeig del Born, 08003 Barcelona, Spain",
      locationLabel: "نقطة مقترحة",
    },
    {
      id: "maremagnum",
      name: "Maremagnum",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/018_Rambla_de_Mar_i_Marem%C3%A0gnum_%28Barcelona%29%2C_des_del_moll_de_les_Drassanes.jpg/1280px-018_Rambla_de_Mar_i_Marem%C3%A0gnum_%28Barcelona%29%2C_des_del_moll_de_les_Drassanes.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enric",
      imageSourceUrl:
        "https://commons.wikimedia.org/wiki/File:018_Rambla_de_Mar_i_Marem%C3%A0gnum_(Barcelona),_des_del_moll_de_les_Drassanes.jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      bestFor: "Shopping mall",
      description: "مول تسوق على الماء بميناء Port Vell — محلات، مطاعم، وسينما بإطلالة بحرية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Maremagnum+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Maremagnum+Barcelona",
      officialUrl: "https://maremagnum.klepierre.es/",
      address: "Moll d'Espanya, 5, Ciutat Vella, 08039 Barcelona, Spain",
      phone: "+34 930 12 91 39",
      priceLevel: "$$",
      rating: 4.2,
      reviewCount: 38743,
      ratingSource: "Google",
      hours: {
        type: "fixed",
        schedule: {
          sunday: [{ open: "10:00", close: "22:00" }],
          monday: [{ open: "10:00", close: "22:00" }],
          tuesday: [{ open: "10:00", close: "22:00" }],
          wednesday: [{ open: "10:00", close: "22:00" }],
          thursday: [{ open: "10:00", close: "22:00" }],
          friday: [{ open: "10:00", close: "22:00" }],
          saturday: [{ open: "10:00", close: "22:00" }],
        },
        lastVerified: "2026-08",
      },
    },
  ],

  beaches: [
    {
      id: "barceloneta-beach",
      name: "Barceloneta Beach",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beach%2C_Barcelona_%28P1170713%29.jpg/1280px-Beach%2C_Barcelona_%28P1170713%29.jpg",
      imageSource: WIKIMEDIA,
      vibe: "حيوي وشبابي — أقرب شاطئ للمركز",
      bestFor: ["🏖️ أول تجربة شاطئ", "🍽️ مطاعم قريبة"],
      crowdLevel: "high",
      area: "Barceloneta",
      bestTime: "الصباح للهدوء، بعد الظهر للأجواء",
      tip: "ابدأ فيه لو وقتك محدود — الأقرب والأسهل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barceloneta+Beach",
      appleMapsUrl: "https://maps.apple.com/?q=Barceloneta+Beach",
      address: "Passeig Marítim de la Barceloneta, 08003 Barcelona, Spain",
      rating: 4.4,
      reviewCount: 16209,
      ratingSource: "Google",
    },
    {
      id: "bogatell",
      name: "Bogatell Beach",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Platja_del_Bogatell_%28Barcelona%29_01.JPG/1280px-Platja_del_Bogatell_%28Barcelona%29_01.JPG",
      imageSource: WIKIMEDIA,
      vibe: "أهدأ شوي من Barceloneta",
      bestFor: ["🏖️ استرخاء", "👫 Couples", "🏃 Active travelers"],
      crowdLevel: "medium",
      area: "Poblenou",
      bestTime: "بعد الظهر",
      tip: "خيار ممتاز لو لقيت Barceloneta مزدحمة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bogatell+Beach+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Bogatell+Beach+Barcelona",
      address: "Passeig Marítim del Bogatell, 08005 Barcelona, Spain",
      rating: 4.4,
      reviewCount: 3700,
      ratingSource: "Google",
    },
    {
      id: "nova-icaria",
      name: "Nova Icària Beach",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Platja_de_la_Nova_Ic%C3%A0ria_02.JPG/1280px-Platja_de_la_Nova_Ic%C3%A0ria_02.JPG",
      imageSource: WIKIMEDIA,
      vibe: "عائلية وهادئة، قريبة من Port Olímpic",
      bestFor: ["👨‍👩‍👧 عائلات", "😌 هدوء نسبي"],
      crowdLevel: "low",
      area: "شرق Barceloneta باتجاه Poblenou",
      bestTime: "بعد الظهر",
      tip: "خيار محلي أكثر من سياحي — تجربة أهدأ.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nova+Icaria+Beach+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Nova+Icaria+Beach+Barcelona",
      address: "Passeig Marítim de la Nova Icària, 08005 Barcelona, Spain",
      rating: 4.4,
      reviewCount: 1653,
      ratingSource: "Google",
    },
  ],

  nightlifeCategories: [
    { id: "beach", icon: "🌊", title: "Beach nightlife", description: "بارات وأجواء ساحلية حول Barceloneta، خصوصًا صيفًا." },
    { id: "bars", icon: "🍸", title: "Bars", description: "El Born وGothic Quarter مليانين بارات صغيرة بطابع محلي." },
    { id: "rooftops", icon: "🌇", title: "Rooftops", description: "أسطح فنادق ومباني بوسط المدينة بإطلالات مسائية." },
    { id: "clubs", icon: "🎉", title: "Clubs", description: "مناطق قريبة من الشاطئ والمركز تنشط بعطلات نهاية الأسبوع." },
    { id: "chill", icon: "😌", title: "Chill", description: "Gràcia خيار ممتاز لأمسية هادئة بمقاهٍ وبارات صغيرة." },
  ],

  nightlifeVenues: [
    // ── Bars ───────────────────────────────────────────────────
    {
      id: "paradiso",
      name: "Paradiso",
      image: "/images-barcelona/paradiso.jpg",
      imageSource: "local_image",
      categoryId: "bars",
      area: "El Born",
      address: "Carrer de Rera Palau, 4, 08003 Barcelona, Spain",
      description: "بار سري خلف محل ساندويشات — واحد من أفضل بارات الكوكتيل بالعالم.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Paradiso+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Paradiso+Barcelona",
      officialUrl: "https://paradiso.cat",
      rating: 4.2,
      ratingSource: "Trip.com",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "17:00",
              close: "02:30",
            },
          ],
          tuesday: [
            {
              open: "17:00",
              close: "02:30",
            },
          ],
          wednesday: [
            {
              open: "17:00",
              close: "02:30",
            },
          ],
          thursday: [
            {
              open: "16:30",
              close: "02:30",
            },
          ],
          friday: [
            {
              open: "16:30",
              close: "02:30",
            },
          ],
          saturday: [
            {
              open: "16:30",
              close: "02:30",
            },
          ],
          sunday: [
            {
              open: "16:30",
              close: "02:30",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://grupconfiteria.com/grup/paradiso/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Cocktail", "Premium", "حجز مسبق يُنصح فيه"],
    },
    {
      id: "dry-martini",
      name: "Dry Martini",
      image: "/images-barcelona/dry.jpg",
      imageSource: "local_image",
      categoryId: "bars",
      area: "Eixample",
      address: "Carrer d'Aribau, 162, 08036 Barcelona, Spain",
      description: "بار كوكتيل كلاسيكي من 1978 — أجواء أنيقة وخدمة احترافية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dry+Martini+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Dry+Martini+Barcelona",
      officialUrl: "https://www.drymartinibarcelona.com/",
      rating: 4.4,
      reviewCount: 3100,
      ratingSource: "Google",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "13:00",
              close: "02:30",
            },
          ],
          tuesday: [
            {
              open: "13:00",
              close: "02:30",
            },
          ],
          wednesday: [
            {
              open: "13:00",
              close: "02:30",
            },
          ],
          thursday: [
            {
              open: "13:00",
              close: "02:30",
            },
          ],
          friday: [
            {
              open: "13:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "03:00",
            },
          ],
          sunday: [
            {
              open: "16:30",
              close: "01:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://www.drymartinibarcelona.com/eng/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Cocktail", "Premium", "أنيق"],
    },
    {
      id: "boadas",
      name: "Boadas Cocktails",
      address: "Carrer dels Tallers, 1, 08001 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/36_Boadas_Cocktail_Bar%2C_placa.jpg/1280px-36_Boadas_Cocktail_Bar%2C_placa.jpg",
      imageSource: "Wikimedia Commons",
      categoryId: "bars",
      area: "قرب La Rambla",
      description: "أقدم بار كوكتيل ببرشلونة (منذ 1933) — بدون قائمة، ثق بالبارمن.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Boadas+Cocktails+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Boadas+Cocktails+Barcelona",
      rating: 4.2,
      reviewCount: 9649,
      ratingSource: "Google",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "01:30",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "01:30",

            }
          ],
        },
        source: "google",
        sourceUrl: "https://www.timeout.com/barcelona/bars-and-pubs/boadas",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Historic", "Cocktail", "كلاسيكي"],
    },
    {
      id: "two-schmucks",
      name: "Two Schmucks",
      image: "/images-barcelona/Two.jpg",
      imageSource: "local_image",
      categoryId: "bars",
      area: "Raval",
      address: "Carrer de Joaquin Costa, 52, 08001 Barcelona, Spain",
      description: "بار كوكتيل عصري بأجواء مرحة وقوائم إبداعية — من أفضل بارات العالم بالتصنيفات.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Two+Schmucks+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Two+Schmucks+Barcelona",
      rating: 4.3,
      reviewCount: 600,
      ratingSource: "Google",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          tuesday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          wednesday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          thursday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          friday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          sunday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
        },
        source: "google",
        sourceUrl:
          "https://www.novacircle.com/spots/europe/spain/catalunya/barcelona-municipality/barcelona/two-schmucks-3c4fba/opening-hours",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Cocktail", "عصري", "حيوي"],
    },
    {
      id: "bobby-gin",
      name: "Bobby Gin",
      image: "/images-barcelona/bobby gin.JPG",
      imageSource: "local_image",
      categoryId: "bars",
      area: "Gràcia",
      address: "Carrer de Francisco Giner, 47, 08012 Barcelona, Spain",
      description: "بار متخصص بالجن — قوائم طويلة وأجواء مريحة بحي Gràcia.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bobby+Gin+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Bobby+Gin+Barcelona",
      officialUrl: "https://www.bobbygin.com",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "19:00",
              close: "02:00",
            },
          ],
          tuesday: [
            {
              open: "19:00",
              close: "02:00",
            },
          ],
          wednesday: [
            {
              open: "19:00",
              close: "02:00",
            },
          ],
          thursday: [
            {
              open: "19:00",
              close: "02:00",
            },
          ],
          friday: [
            {
              open: "19:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "19:00",
              close: "03:00",
            },
          ],
          sunday: [
            {
              open: "19:00",
              close: "02:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://www.bobbygin.com/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Gin", "Gràcia", "هادئ نسبيًا"],
    },
    {
      id: "guzzo",
      name: "Guzzo",
      image: "/images-barcelona/Guzzo.jpg",
      imageSource: "local_image",
      categoryId: "bars",
      area: "El Born",
      address: "Plaça Comercial, 10, 08003 Barcelona, Spain",
      description: "بار-مطعم بديكور مسرحي مميز — خيار حيوي لسهرة بداية الليل.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Guzzo+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Guzzo+Barcelona",
      rating: 4.4,
      reviewCount: 3237,
      ratingSource: "Google",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "18:00",
              close: "02:00",
            },
          ],
          saturday: [
            {
              open: "13:00",
              close: "02:00",
            },
          ],
          sunday: [
            {
              open: "13:00",
              close: "01:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://guzzobcn.es/contacto/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["أجواء", "عشاء وسهرة"],
    },
    {
      id: "milano",
      name: "Milano Barcelona",
      image: "/images-barcelona/milano.jpg",
      imageSource: "local_image",
      categoryId: "bars",
      area: "Eixample",
      address: "Ronda Universitat, 35, 08007 Barcelona, Spain",
      description: "بار تحت الأرض بطابع Speakeasy — موسيقى جاز حية بعض الليالي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Milano+Barcelona+Cocktail+Bar",
      appleMapsUrl: "https://maps.apple.com/?q=Milano+Barcelona+Cocktail+Bar",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "18:00", close: "02:00" }],
          tuesday: [{ open: "18:00", close: "02:00" }],
          wednesday: [{ open: "18:00", close: "02:00" }],
          thursday: [{ open: "18:00", close: "02:00" }],
          friday: [{ open: "18:00", close: "02:00" }],
          saturday: [{ open: "18:00", close: "02:00" }],
          sunday: [{ open: "18:00", close: "02:00" }],
        },
        source: "google",
        lastVerified: "2026-08",
      },
      entryPriceText: "بدون رسوم دخول، لكن حد أدنى للاستهلاك €15 للمشروب الأول",
      lastVerified: "8/2026",
      tags: ["Speakeasy", "Live music", "هادئ نسبيًا"],
    },

    // ── Rooftops ───────────────────────────────────────────────
    {
      id: "la-isabela-rooftop",
      name: "RoofTop Ohla Barcelona",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Ohla_Barcelona.jpg/1280px-Ohla_Barcelona.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Ohla_Barcelona.jpg",
      categoryId: "rooftops",
      area: "Gothic Quarter (فندق Ohla Barcelona)",
      address: "Via Laietana, 49, 08003 Barcelona, Spain",
      description: "إطلالة 360 درجة على وسط المدينة — رائع وقت الغروب.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=RoofTop+Ohla+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=RoofTop+Ohla+Barcelona",
      officialUrl: "https://www.ohlabarcelona.com",
      rating: 3.5,
      ratingSource: "Tripadvisor",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          saturday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
          sunday: [
            {
              open: "19:00",
              close: "01:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://www.ohlaboutiquehotels.com/en/ohla-barcelona/rooftop/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Sunset", "Views", "Central"],
    },
    {
      id: "sky-bar-grand-central",
      name: "La Terraza del Central — Grand Hotel Central",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Grand_Hotel_Central_Barcelona.jpg/1280px-Grand_Hotel_Central_Barcelona.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Grand_Hotel_Central_Barcelona.jpg",
      categoryId: "rooftops",
      area: "Gothic Quarter",
      address: "Via Laietana, 30, 08003 Barcelona, Spain",
      description: "روفتوب فيه مسبح مطل مباشرة على الكاتدرائية — من أجمل مناظر المدينة القديمة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sky+Bar+Grand+Hotel+Central+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Sky+Bar+Grand+Hotel+Central+Barcelona",
      officialUrl: "https://www.grandhotelcentral.com",
      rating: 4.0,
      ratingSource: "TripAdvisor",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "22:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://www.grandhotelcentral.com/en/rooftop-barcelona/",
        lastVerified: "2026-08",
      },
      entryPriceText: "€20 (يشمل مشروبًا)",
      lastVerified: "8/2026",
      tags: ["Views", "Couples", "Central"],
    },
    {
      id: "terrat",
      name: "Terrat — Hotel Serras",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Serras_Barcelona.jpg/1280px-Serras_Barcelona.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Pere prlpz",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Serras_Barcelona.jpg",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      categoryId: "rooftops",
      area: "Barceloneta / Port Vell",
      address: "Passeig de Colom, 9, 08002 Barcelona, Spain",
      description: "روفتوب هادئ بإطلالة على الميناء — خيار أرقى وأقل ازدحامًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Terrat+Hotel+Serras+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Terrat+Hotel+Serras+Barcelona",
      officialUrl: "https://www.hotelserras.com",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          tuesday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          wednesday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          thursday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          friday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          saturday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
          sunday: [
            {
              open: "12:30",
              close: "18:30",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://serrasbarcelona.com/en/gastronomy/rooftop/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Sea view", "هادئ", "Drinks"],
    },
    {
      id: "eclipse-bar-w-hotel",
      name: "Eclipse Bar — W Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/W_Barcelona_%28Hotel_Vela%29_des_del_mar_02.jpg/1280px-W_Barcelona_%28Hotel_Vela%29_des_del_mar_02.jpg",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Jordiferrer",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:W_Barcelona_(Hotel_Vela)_des_del_mar_02.jpg",
      categoryId: "rooftops",
      area: "Barceloneta (على الشاطئ)",
      address: "Plaça de la Rosa dels Vents, 1, 08039 Barcelona, Spain",
      description: "بار بانورامي بالطابق 26 من فندق W — إطلالة بحر مباشرة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Eclipse+Bar+W+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Eclipse+Bar+W+Barcelona",
      officialUrl: "https://www.marriott.com/en-us/hotels/bcnwh-w-barcelona",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "18:00",
              close: "02:00",
            },
          ],
          tuesday: [
            {
              open: "18:00",
              close: "02:30",
            },
          ],
          wednesday: [
            {
              open: "18:00",
              close: "02:00",
            },
          ],
          thursday: [
            {
              open: "18:00",
              close: "02:30",
            },
          ],
          friday: [
            {
              open: "17:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "17:00",
              close: "06:00",
            },
          ],
          sunday: [
            {
              open: "17:00",
              close: "02:30",
            },
          ],
        },
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Sea view", "Premium", "Sunset"],
    },
    {
      id: "moom-rooftop",
      name: "Terrassa 360º — Hotel Barceló Raval",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Rambla_del_raval_-_barcel%C3%B3_raval.JPG/1280px-Rambla_del_raval_-_barcel%C3%B3_raval.JPG",
      imageSource: "Wikimedia Commons",
      imageAuthor: "Ravalejo",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Rambla_del_raval_-_barcel%C3%B3_raval.JPG",
      categoryId: "rooftops",
      area: "Raval",
      address: "Rambla del Raval, 17-21, 08001 Barcelona, Spain",
      description: "روفتوب بالطابق الحادي عشر بإطلالة 360 درجة على المدينة القديمة — دخول مجاني بدون حجز.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Terrassa+360+Barcelo+Raval+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Terrassa+360+Barcelo+Raval+Barcelona",
      entryPriceText: "مجاني",
      priceLevel: "$$",
      hours: {
        type: "variable",
        display: "مفتوحة طوال السنة، بدون حجز مسبق",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Views", "مجاني", "360°"],
    },

    // ── Clubs ──────────────────────────────────────────────────
    {
      id: "razzmatazz",
      name: "Razzmatazz",
      address: "Carrer dels Almogàvers, 122, 08018 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Barcelona_-_Sala_Razzmatazz.jpg/1280px-Barcelona_-_Sala_Razzmatazz.jpg",
      imageSource: "Wikimedia Commons",
      categoryId: "clubs",
      area: "Poblenou",
      description: "أشهر نادي بالمدينة — مستودع ضخم بعدة صالات وأنواع موسيقى مختلفة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Razzmatazz+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Razzmatazz+Barcelona",
      officialUrl: "https://www.salarazzmatazz.com",
      rating: 4.2,
      reviewCount: 21736,
      ratingSource: "Google",
      entryPriceText: "من €10 حسب الليلة",
      musicStyle: "Mixed",
      hours: {
        type: "event",
        display: "حسب الليلة — شوف الموقع الرسمي",
        source: "official",
        sourceUrl: "https://www.salarazzmatazz.com",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Iconic", "متعدد الصالات", "Live + DJ"],
    },
    {
      id: "sala-apolo",
      name: "Sala Apolo",
      address: "Carrer Nou de la Rambla, 111-115, 08004 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Cap_d%27Any_2019-2020_a_la_Sala_Apolo.jpg/1280px-Cap_d%27Any_2019-2020_a_la_Sala_Apolo.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "clubs",
      area: "Poble Sec",
      description: "قاعة تاريخية بحفلات وليالي DJ أسبوعية — كل ليلة جمهور وأسلوب مختلف.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sala+Apolo+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Sala+Apolo+Barcelona",
      officialUrl: "https://www.sala-apolo.com",
      rating: 4.2,
      ratingSource: "Google",
      musicStyle: "Mixed",
      entryPriceText: "متغيّر حسب الفعالية",
      hours: {
        type: "event",
        display: "حسب الليلة — شوف الموقع الرسمي",
        source: "official",
        sourceUrl: "https://www.sala-apolo.com",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Historic", "متنوع", "Live music"],
    },
    {
      id: "input-barcelona",
      name: "Input Barcelona",
      image: "/images-barcelona/input.jpg",
      imageSource: "local_image",
      categoryId: "clubs",
      area: "Poble Sec",
      address: "Avinguda de Francesc Ferrer i Guàrdia, 13, 08038 Barcelona, Spain",
      description: "من أهم نوادي الموسيقى الإلكترونية بالمدينة — لعشاق الـ techno وHouse.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Input+Barcelona+Club",
      appleMapsUrl: "https://maps.apple.com/?q=Input+Barcelona+Club",
      musicStyle: "Electronic",
      entryPriceText: "متغيّر حسب الفعالية",
      hours: {
        type: "event",
        display: "حسب الليلة — شوف الموقع الرسمي",
        source: "official",
        sourceUrl: "https://inputbcn.com/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Electronic", "Techno"],
    },
    {
      id: "city-hall",
      name: "City Hall",
      image: "/images-barcelona/city hall.jpg",
      imageSource: "local_image",
      categoryId: "clubs",
      area: "Eixample (قرب Plaça Catalunya)",
      address: "Rambla de Catalunya, 2-4, 08007 Barcelona, Spain",
      description: "نادي مركزي بموسيقى تجارية وحفلات متنوعة — خيار سهل الوصول ليلة الويكند.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=City+Hall+Barcelona+Club",
      appleMapsUrl: "https://maps.apple.com/?q=City+Hall+Barcelona+Club",
      musicStyle: "Commercial",
      entryPriceText: "€12–20 حسب الوقت (غالبًا يشمل مشروب) — دخول مجاني قبل 01:30",
      hours: {
        type: "event",
        display: "حسب الليلة — شوف الموقع الرسمي",
        source: "official",
        sourceUrl: "https://www.cityhallbarcelona.com/en-us",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Commercial", "Central"],
    },
    {
      id: "otto-zutz",
      name: "Otto Zutz",
      image: "/images-barcelona/otto-zutz.jpg",
      imageSource: "local_image",
      categoryId: "clubs",
      area: "Sant Gervasi",
      address: "Carrer de Lincoln, 15, 08006 Barcelona, Spain",
      description: "نادي كلاسيكي راقٍ من أيام برشلونة القديمة — أجواء أرقى وجمهور أكبر سنًا نسبيًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Otto+Zutz+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Otto+Zutz+Barcelona",
      rating: 3.2,
      reviewCount: 5131,
      ratingSource: "Google",
      musicStyle: "Mixed",
      entryPriceText: "€20 (يشمل مشروبين)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [],
          wednesday: [
            {
              open: "00:00",
              close: "05:00",
            },
          ],
          thursday: [
            {
              open: "00:00",
              close: "05:00",
            },
          ],
          friday: [
            {
              open: "00:00",
              close: "06:00",
            },
          ],
          saturday: [
            {
              open: "00:00",
              close: "06:00",
            },
          ],
          sunday: [],
        },
        source: "google",
        sourceUrl: "https://www.barcelona-tourist-guide.com/en/club/otto-zutz-club-barcelona.html",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Premium", "كلاسيكي"],
    },

    // ── Beach nightlife ────────────────────────────────────────
    {
      id: "opium-barcelona",
      name: "Opium Barcelona",
      address: "Passeig Marítim de la Barceloneta, 34, 08005 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Discoteca_Opium_Barcelona.jpg/1280px-Discoteca_Opium_Barcelona.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "beach",
      area: "Port Olímpic (جنب Hotel Arts)",
      description: "بيتش كلوب وناد مباشرة على الشاطئ — من أشهر أسماء الليل الساحلي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Opium+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Opium+Barcelona",
      officialUrl: "https://opiumbarcelona.com",
      rating: 3.3,
      reviewCount: 884,
      ratingSource: "TripAdvisor",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
      
        schedule: {
          sunday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "06:00" },
          ],
      
          monday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "05:00" },
          ],
      
          tuesday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "05:00" },
          ],
      
          wednesday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "05:00" },
          ],
      
          thursday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "05:00" },
          ],
      
          friday: [
            { open: "00:00", close: "05:00" },
            { open: "12:00", close: "06:00" },
          ],
      
          saturday: [
            { open: "00:00", close: "06:00" },
            { open: "12:00", close: "06:00" },
          ],
        },
        source: "google",
        sourceUrl: "https://youbarcelona.com/en/club/opium-mar-barcelona",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Beach club", "على الشاطئ مباشرة"],
    },
    {
      id: "cdlc-barcelona",
      name: "CDLC — Carpe Diem Lounge Club",
      image: "/images-barcelona/CDLC.jpg",
      imageSource: "local_image",
      categoryId: "beach",
      area: "Barceloneta",
      address: "Passeig Marítim de la Barceloneta, 32, 08003 Barcelona, Spain",
      description: "لاونج وناد على الواجهة البحرية — أجواء راقية وسهرة تبدأ عشاء وتنتهي رقص.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=CDLC+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=CDLC+Barcelona",
      officialUrl: "https://cdlcbarcelona.com",
      rating: 4.1,
      reviewCount: 1108,
      ratingSource: "TripAdvisor",
      priceLevel: "$$$",
      entryPriceText: "€15–25 (يشمل مشروبًا عادة)",
      hours: {
        type: "fixed",
        schedule: {
          monday: [{ open: "00:00", close: "03:00" }],
          tuesday: [{ open: "00:00", close: "03:00" }],
          wednesday: [{ open: "00:00", close: "03:00" }],
          thursday: [{ open: "00:00", close: "03:00" }],
          friday: [{ open: "00:00", close: "06:00" }],
          saturday: [{ open: "00:00", close: "06:00" }],
          sunday: [{ open: "20:00", close: "03:00" }],
        },
        source: "google",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Beach club", "Restaurant + club", "Premium"],
    },
    {
      id: "shoko-barcelona",
      name: "Shôko",
      address: "Passeig Marítim de la Barceloneta, 36, 08005 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Terraza_Sh%C3%B4ko.jpg/1280px-Terraza_Sh%C3%B4ko.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "beach",
      area: "Barceloneta",
      description: "مطعم آسيوي يتحول لنادي ليلي على الشاطئ — أجواء عشاء ثم سهرة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Shoko+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Shoko+Barcelona",
      rating: 3.8,
      ratingSource: "TripAdvisor",
      priceLevel: "$$$",
      entryPriceText: "€20 عند الباب مساءً",
      hours: {
        type: "fixed",
      
        schedule: {
          sunday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          monday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          tuesday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          wednesday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          thursday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          friday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
      
          saturday: [
            { open: "00:00", close: "06:00" },
            { open: "11:00", close: "00:00" },
          ],
        },
        source: "google",
        sourceUrl: "https://www.barcelona-tourist-guide.com/en/club/shoko-club-barcelona.html",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Restaurant + club", "Beach"],
    },
    {
      id: "pacha-barcelona",
      name: "Ku Barcelona (Pacha)",
      image: "/images-barcelona/pacha.jpg",
      imageSource: "local_image",
      categoryId: "beach",
      area: "Port Olímpic",
      address: "Carrer de Ramon Trias Fargas, 2, 08005 Barcelona, Spain",
      description:
        "بيتش كلوب مشهور تغيّرت هويته من Pacha إلى Ku Barcelona بـ9/2025 (نفس المكان، إدارة Costa Este) — انتبه على أغراضك ومشروبك، مراجعات حديثة ذكرت مشاكل ازدحام أحيانًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ku+Barcelona+Port+Olimpic",
      appleMapsUrl: "https://maps.apple.com/?q=Ku+Barcelona+Port+Olimpic",
      officialUrl: "https://grupocostaeste.com/en/club/ku-barcelona/",
      rating: 3.7,
      reviewCount: 731,
      ratingSource: "Tripadvisor",
      priceLevel: "$$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "23:30",
              close: "05:00",
            },
          ],
          tuesday: [
            {
              open: "23:30",
              close: "05:00",
            },
          ],
          wednesday: [
            {
              open: "23:30",
              close: "05:00",
            },
          ],
          thursday: [
            {
              open: "23:30",
              close: "05:00",
            },
          ],
          friday: [
            {
              open: "23:30",
              close: "06:00",
            },
          ],
          saturday: [
            {
              open: "23:30",
              close: "06:00",
            },
          ],
          sunday: [
            {
              open: "23:30",
              close: "05:00",
            },
          ],
        },
        source: "google",
        sourceUrl: "https://youbarcelona.com/en/club/ku-barcelona",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Beach club", "أعيد افتتاحه 2025"],
    },
    {
      id: "chiringuito-escriba",
      name: "Chiringuito Escribà",
      image: "/images-barcelona/Escribà-Barcelona.jpg",
      imageSource: "local_image",
      categoryId: "beach",
      area: "Bogatell Beach / Poblenou",
      address: "Av. del Litoral, 62, 08005 Barcelona, Spain",
      description: "مطعم-بار شاطئي مريح — خيار أهدأ من النوادي الكبيرة، عشاء ومشروب بأجواء بحر.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Chiringuito+Escriba+Barceloneta",
      appleMapsUrl: "https://maps.apple.com/?q=Chiringuito+Escriba+Barceloneta",
      rating: 4.2,
      reviewCount: 8600,
      ratingSource: "Google",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "23:00",
            },
          ],
        },
        source: "official",
        sourceUrl: "https://restaurantsescriba.com/en/xiringuito-escriba/",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Bar", "Relaxed", "Beachfront"],
    },

    // ── Chill ──────────────────────────────────────────────────
    {
      id: "va-de-vi",
      name: "Va de Vi",
      image: "/images-barcelona/va de vi.jpg",
      imageSource: "local-image",
      categoryId: "chill",
      area: "El Born",
      address: "Carrer dels Banys Vells, 16, 08003 Barcelona, Spain",
      description: "بار نبيذ بمبنى قديم بأقواس حجرية — أمسية هادئة بكأس نبيذ إسباني.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Va+de+Vi+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Va+de+Vi+Barcelona",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "18:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "18:00",
              close: "02:00",
            },
          ],
          friday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "18:00",
              close: "03:00",
            },
          ],
          sunday: [],
        },
        source: "google",
        sourceUrl: "https://www.bcnrestaurantes.com/eng/barcelona.asp?restaurante=va-de-vi",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Wine bar", "هادئ", "Historic"],
    },
    {
      id: "el-paraigua",
      name: "El Paraigua",
      address: "Carrer del Pas de l'Ensenyança, 2, 08002 Barcelona, Spain",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Cafeteria_el_Paraigua.jpg/1280px-Cafeteria_el_Paraigua.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "chill",
      area: "Gothic Quarter",
      description: "بار داخل محل مظلات قديم بديكور مودرنيستي فريد — أحيانًا موسيقى جاز حية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Paraigua+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=El+Paraigua+Barcelona",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "12:00",
              close: "02:00",
            },
          ],
          friday: [
            {
              open: "12:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "12:00",
              close: "03:00",
            },
          ],
          sunday: [
            {
              open: "12:00",
              close: "01:00",
            },
          ],
        },
        source: "google",
        sourceUrl: "https://www.yelp.com/biz/el-paraigua-barcelona",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Unique", "Live music", "هادئ"],
    },
    {
      id: "vinilo-bar",
      name: "Vinilo Bar",
      image: "/images-barcelona/vinilo.jpg",
      imageSource: "local_image",
      categoryId: "chill",
      area: "Gràcia",
      address: "Carrer de Matilde, 2, 08012 Barcelona, Spain",
      description: "بار صغير بديكور فينيل قديم — أجواء دافئة ومريحة لسهرة هادئة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Vinilo+Bar+Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Vinilo+Bar+Gracia+Barcelona",
      priceLevel: "$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "20:00",
              close: "02:00",
            },
          ],
          tuesday: [
            {
              open: "20:00",
              close: "02:00",
            },
          ],
          wednesday: [
            {
              open: "20:00",
              close: "02:00",
            },
          ],
          thursday: [
            {
              open: "20:00",
              close: "02:00",
            },
          ],
          friday: [
            {
              open: "20:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "20:00",
              close: "03:00",
            },
          ],
          sunday: [],
        },
        source: "google",
        sourceUrl: "https://m.yelp.com/biz/bar-vinilo-barcelona",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Cozy", "Gràcia", "هادئ"],
    },
    {
      id: "cafe-del-sol",
      name: "Café del Sol",
      image: "/images-barcelona/del sol.jpg",
      imageSource: "local_image",
      categoryId: "chill",
      area: "Plaça de la Vila de Gràcia",
      address: "Plaça del Sol, 16, 08012 Barcelona, Spain",
      description: "تراس على ميدان Gràcia الشهير — قهوة أو مشروب وسط أجواء الحي المحلية.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+del+Sol+Placa+Vila+de+Gracia+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cafe+del+Sol+Placa+Vila+de+Gracia+Barcelona",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [
            {
              open: "13:00",
              close: "01:00",
            },
          ],
          tuesday: [
            {
              open: "10:00",
              close: "01:00",
            },
          ],
          wednesday: [
            {
              open: "10:00",
              close: "01:00",
            },
          ],
          thursday: [
            {
              open: "10:00",
              close: "01:00",
            },
          ],
          friday: [
            {
              open: "10:00",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "10:00",
              close: "03:00",
            },
          ],
          sunday: [
            {
              open: "10:00",
              close: "01:00",
            },
          ],
        },
        source: "google",
        sourceUrl: "https://wanderlog.com/place/details/1965539/caf%C3%A8-del-sol",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Terrace", "Gràcia", "محلي"],
    },
    {
      id: "ginger-bar",
      name: "Ginger",
      image: "/images-barcelona/ginger.jpg",
      imageSource: "local_image",
      categoryId: "chill",
      area: "Gothic Quarter",
      address: "Carrer de la Palma de Sant Just, 1, 08002 Barcelona, Spain",
      description: "بار كوكتيل ونبيذ هادئ بزاوية بعيدة عن ضجة الحي القوطي — مدخلين: بار كوكتيل وبار نبيذ.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ginger+Barcelona+Gothic+Quarter",
      appleMapsUrl: "https://maps.apple.com/?q=Ginger+Barcelona+Gothic+Quarter",
      rating: 4.4,
      ratingSource: "Tripadvisor",
      priceLevel: "$$",
      hours: {
        type: "fixed",
        schedule: {
          monday: [],
          tuesday: [
            {
              open: "19:30",
              close: "02:30",
            },
          ],
          wednesday: [
            {
              open: "19:30",
              close: "02:30",
            },
          ],
          thursday: [
            {
              open: "19:30",
              close: "02:30",
            },
          ],
          friday: [
            {
              open: "19:30",
              close: "03:00",
            },
          ],
          saturday: [
            {
              open: "19:30",
              close: "03:00",
            },
          ],
          sunday: [],
        },
        source: "google",
        sourceUrl: "https://www.yelp.com/biz/ginger-barcelona",
        lastVerified: "2026-08",
      },
      lastVerified: "8/2026",
      tags: ["Courtyard", "هادئ", "Central"],
    },
  ],

  photoSpots: [
    {
      id: "bunkers-photo",
      name: "Bunkers del Carmel",
      image: "/images-barcelona/bunkers-del-carmel.jpg",
      imageSource: "local-image",
      bestTime: "🌅 Sunset",
      whySpecial: "بانوراما 360 درجة مجانية على المدينة كلها.",
      tip: "جرب توصل قبل الغروب بوقت.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bunkers+del+Carmel",
      appleMapsUrl: "https://maps.apple.com/?q=Bunkers+del+Carmel",
      address: "Carrer de Marià Labèrnia, s/n, 08032 Barcelona, Spain",
    },
    {
      id: "park-guell-photo",
      name: "Park Güell",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Parc_guell_-_panoramio.jpg/1280px-Parc_guell_-_panoramio.jpg",
      imageSource: WIKIMEDIA,
      bestTime: "☀️ الصباح الباكر",
      whySpecial: "فسيفساء Gaudí الملوّنة وإطلالة المدينة من الشرفة.",
      tip: "الإضاءة الصباحية أفضل للألوان وأقل ازدحامًا.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Park+Guell+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Park+Guell+Barcelona",
      address: "Carrer d'Olot, 08024 Barcelona, Spain",
    },
    {
      id: "gothic-quarter-photo",
      name: "Gothic Quarter",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg/1280px-Barri_Gotic%2C_Barcelona_%28P1170658%29.jpg",
      imageSource: WIKIMEDIA,
      bestTime: "🌆 الصباح الباكر أو بعد الغروب",
      whySpecial: "أزقة حجرية ضيقة بإضاءة دافئة وتفاصيل قديمة.",
      tip: "دور على الأزقة الجانبية البعيدة عن المسار السياحي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gothic+Quarter+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gothic+Quarter+Barcelona",
      address: "Plaça Nova, 08002 Barcelona, Spain",
    },
    {
      id: "arc-de-triomf-photo",
      name: "Arc de Triomf",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arc_de_Triomf%2C_Barcelona_2716.jpg/1280px-Arc_de_Triomf%2C_Barcelona_2716.jpg",
      imageSource: WIKIMEDIA,
      bestTime: "☀️ أي وقت نهارًا",
      whySpecial: "تناظر معماري مثالي بنهاية ممشى واسع.",
      tip: "صوّر من منتصف الممشى لأفضل تناظر.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Arc+de+Triomf+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Arc+de+Triomf+Barcelona",
      address: "Passeig de Lluís Companys, 08018 Barcelona, Spain",
    },
    {
      id: "montjuic-photo",
      name: "Montjuïc",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fale_-_Spain_-_Barcelona_-_8.jpg/1280px-Fale_-_Spain_-_Barcelona_-_8.jpg",
      imageSource: WIKIMEDIA,
      bestTime: "🌅 قبل الغروب لحد بعده",
      whySpecial: "إطلالة على الميناء والمدينة من ارتفاع عالٍ.",
      tip: "ابقَ لحد بعد الغروب لسماء دافئة فوق المدينة.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Montjuic+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Montjuic+Barcelona",
      address: "Ctra. de Montjuïc, 43, 08038 Barcelona, Spain",
    },
    {
      id: "barceloneta-photo",
      name: "Barceloneta",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beach%2C_Barcelona_%28P1170713%29.jpg/1280px-Beach%2C_Barcelona_%28P1170713%29.jpg",
      imageSource: WIKIMEDIA,
      bestTime: "🌇 شروق الشمس",
      whySpecial: "شاطئ مدينة نادر يجمع البحر مع أفق المباني.",
      tip: "الصباح الباكر يعطيك شاطئ شبه فاضي.",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Barceloneta+Beach",
      appleMapsUrl: "https://maps.apple.com/?q=Barceloneta+Beach",
      address: "Passeig Marítim de la Barceloneta, 08003 Barcelona, Spain",
    },
  ],

  freeExperiences: [
    { id: "gothic-walk", name: "التجول في Gothic Quarter", description: "استكشاف الأزقة التاريخية بالكامل مجاني ومن أحلى تجارب المدينة." },
    { id: "bunkers-free", name: "Bunkers del Carmel", description: "أفضل إطلالة بانورامية بالمدينة، وبدون أي تذكرة." },
    { id: "ciutadella-free", name: "Parc de la Ciutadella", description: "حديقة واسعة مع نافورة Gaudí المبكرة، دخولها مجاني بالكامل." },
    { id: "beach-free", name: "الشواطئ", description: "كل شواطئ برشلونة عامة ومجانية بالكامل." },
    { id: "montjuic-free", name: "تلة Montjuïc", description: "التجول والحدائق والإطلالات مجانية؛ بس بعض المتاحف والقلعة لها تذكرة." },
  ],

  experienceCategories: [
    { id: "adventure", icon: "🏎️", label: "مغامرات" },
    { id: "sea", icon: "🌊", label: "بحر" },
    { id: "boats", icon: "🚤", label: "قوارب" },
    { id: "football", icon: "⚽", label: "كرة قدم" },
    { id: "food-experience", icon: "🍳", label: "أكل وتجارب" },
    { id: "culture", icon: "🎨", label: "ثقافة" },
    { id: "tours", icon: "🚲", label: "جولات" },
    { id: "entertainment", icon: "🎢", label: "ترفيه" },
  ],

  experiences: [
    {
      id: "teleferic-montjuic",
      name: "تلفريك Montjuïc (Telefèric de Montjuïc)",
      image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Telef%C3%A8ric_montju%C3%AFc1.JPG",
      imageSource: WIKIMEDIA,
      categoryId: "tours",
      tags: ["إطلالة", "Sunset", "Family"],
      description: "رحلة تلفريك قصيرة من حديقة Montjuïc لقلعة Montjuïc، بإطلالة كاملة على المدينة والميناء.",
      area: "Montjuïc",
      address: "Avinguda de Miramar, 30, 08038 Barcelona, Spain",
      duration: "10 دقائق (اتجاه واحد)",
      priceText: "€15 (ذهاب وعودة)",
      priceVaries: false,
      bookingRequired: false,
      hours: {
        type: "variable",
        display: "حسب الشهر — عادة 10:00 صباحًا لحد المساء",
        seasons: [
          { monthRange: "1–2", display: "10:00–18:00" },
          { monthRange: "3–5", display: "10:00–19:00" },
          { monthRange: "6–9", display: "10:00–21:00" },
          { monthRange: "10", display: "10:00–19:00" },
          { monthRange: "11–12", display: "10:00–18:00" },
        ],
        lastVerified: "2026-08",
      },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Telef%C3%A8ric+de+Montju%C3%AFc",
      appleMapsUrl: "https://maps.apple.com/?q=Teleferic+de+Montjuic",
      officialUrl: "https://www.telefericdemontjuic.cat/en",
      lastVerified: "8/2026",
    },
    {
      id: "sunset-catamaran-sail",
      name: "جولة إبحار Sunset بقارب كتاماران",
      image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Boat%2C_Barcelona_%28P1170704%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "boats",
      tags: ["Sunset", "Couples", "بحر"],
      description: "من التجارب اللي عليها مدح متكرر من المسافرين — إبحار بقارب كتاماران وقت الغروب مع إطلالة على أفق برشلونة من البحر.",
      area: "Port Olímpic / Port Vell",
      duration: "2–2.5 ساعة",
      priceText: "من €69",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "event", display: "رحلة مسائية — الأوقات حسب الموسم وشركة التشغيل", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Port+Olimpic+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Port+Olimpic+Barcelona",
      officialUrl: "https://www.barcelonavela.com",
      bookingUrl: "https://www.barcelonavela.com",
      lastVerified: "8/2026",
    },
    {
      id: "jetski-port-forum",
      name: "جت سكي بدون رخصة قيادة",
      image: "https://upload.wikimedia.org/wikipedia/commons/6/66/Jet_Ski_Speeding_to_Shore_%2848803291711%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "adventure",
      tags: ["بحر", "أدرينالين"],
      description: "تجربة جت سكي على ساحل برشلونة، بدون حاجة لرخصة قيادة بحرية — بتعطيك الشركة تعليمات قبل ما تبلش.",
      area: "Port Fòrum",
      duration: "30 دقيقة – ساعة",
      priceText: "من €100 (نص ساعة، بدون رخصة)",
      priceVaries: true,
      bookingRequired: true,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Port+Forum+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Port+Forum+Barcelona",
      lastVerified: "8/2026",
    },
    {
      id: "paddleboard-kayak-barceloneta",
      name: "تأجير Paddleboard / Kayak — شاطئ Barceloneta",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Paddleboarding_at_Trincomalee_%28Unsplash%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "sea",
      tags: ["Family", "نشاط خفيف"],
      description: "تأجير لوح Paddleboard أو كاياك ساعة أو أكثر مباشرة من شاطئ Barceloneta — مناسب حتى لو أول مرة تجرب.",
      area: "Barceloneta",
      address: "Carrer de Meer, 47-49, 08003 Barcelona, Spain",
      duration: "ساعة (أو حسب الباقة)",
      priceText: "من €15 (الساعة)",
      priceVaries: true,
      bookingRequired: false,
      hours: { type: "variable", display: "عادة 9:00–14:00 و17:00–19:00", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Manihi+Surf+School+Barceloneta",
      appleMapsUrl: "https://maps.apple.com/?q=Manihi+Surf+School+Barceloneta",
      officialUrl: "https://www.manihisurfschool.com",
      lastVerified: "8/2026",
    },
    {
      id: "montserrat-day-trip",
      name: "رحلة يوم لدير Montserrat",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Abbey_of_Montserrat_02.jpg/1280px-Abbey_of_Montserrat_02.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "tours",
      tags: ["طبيعة", "ثقافة"],
      description: "دير جبلي شهير وإطلالات طبيعية خلابة، على بعد ساعة تقريبًا بالقطار من برشلونة — من أكثر رحلات اليوم الواحد اللي بتتكرر بنصائح المسافرين.",
      area: "خارج برشلونة — Monistrol de Montserrat",
      duration: "نصف يوم إلى يوم كامل",
      priceText: "من €13.80 (قطار فقط) حتى €28.80 (قطار + تلفريك)",
      priceVaries: true,
      bookingRequired: false,
      hours: { type: "variable", display: "قطارات كل ساعة تقريبًا من محطة Plaça Espanya", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+Espanya+Station+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+Espanya+Station+Barcelona",
      officialUrl: "https://www.fgc.cat/en",
      lastVerified: "8/2026",
    },
    {
      id: "portaventura-day-trip",
      name: "PortAventura World — رحلة يوم",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/a8/El_huerto_encantado_-_PortAventura.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "entertainment",
      tags: ["Family", "ملاهي"],
      description: "أكبر مدينة ملاهي بإسبانيا، على حوالي ساعة ونص من برشلونة بالقطار أو الباص — خيار قوي ليوم عائلي كامل.",
      area: "خارج برشلونة — Salou",
      duration: "يوم كامل",
      priceText: "من €40 (حسب الموسم)",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "variable", display: "حسب الموسم — تحقق من الموقع الرسمي قبل الزيارة", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=PortAventura+World",
      appleMapsUrl: "https://maps.apple.com/?q=PortAventura+World",
      officialUrl: "https://www.portaventuraworld.com/en",
      bookingUrl: "https://www.portaventuraworld.com/en",
      lastVerified: "8/2026",
    },
    {
      id: "cook-and-taste-paella-class",
      name: "ورشة طبخ Paella + جولة سوق La Boqueria",
      image: "https://upload.wikimedia.org/wikipedia/commons/e/ed/01_Paella_Valenciana_original.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "food-experience",
      tags: ["Couples", "ثقافة محلية"],
      description: "تجول مع الشيف بسوق Boqueria لشراء المكونات، وبعدها ورشة عملية تطبخ فيها Paella وTapas بنفسك.",
      area: "Gothic Quarter",
      address: "Carrer del Paradís, 3, 08002 Barcelona, Spain",
      duration: "3–4 ساعات",
      priceText: "من €70",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "variable", display: "جلستان يوميًا تقريبًا (صباحية ومسائية) — تحقق من التوفر", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cook+and+Taste+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Cook+and+Taste+Barcelona",
      officialUrl: "https://cookandtaste.net/en/",
      bookingUrl: "https://cookandtaste.net/en/cooking-classes-tours/half-day-cooking-class-market-tour-barcelona/",
      lastVerified: "8/2026",
    },
    {
      id: "tablao-cordobes-flamenco",
      name: "عرض Flamenco — Tablao Cordobés",
      image: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Flamenco_dancer_%2835342176546%29.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "culture",
      tags: ["Couples", "مساء"],
      description: "من أشهر وأقدم مسارح الفلامنكو ببرشلونة، شغال على La Rambla من سنة 1970 — تجربة موسيقى ورقص حية أصيلة.",
      area: "La Rambla",
      address: "La Rambla, 35, 08002 Barcelona, Spain",
      duration: "ساعة تقريبًا (العرض)",
      priceText: "من €48 (عرض + مشروب)",
      priceVaries: true,
      bookingRequired: true,
      rating: 4.7,
      ratingSource: "Google",
      ratingLastVerified: "2026-08",
      hours: { type: "variable", display: "عروض يومية: 5:40، 7:15، 9:00، 10:30 مساءً", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tablao+Cordobes+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Tablao+Cordobes+Barcelona",
      officialUrl: "https://www.tablaocordobes.com",
      bookingUrl: "https://www.tablaocordobes.com",
      lastVerified: "8/2026",
    },
    {
      id: "fc-barcelona-match-tickets",
      name: "حضور مباراة FC Barcelona — Spotify Camp Nou",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Camp_Nou_aerial.jpg/1280px-Camp_Nou_aerial.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "football",
      tags: ["أجواء", "موسمي"],
      description: "غير جولة الملعب العادية — هاي تجربة حضور مباراة حية بأجواء الجمهور. لو بتحب كرة القدم، من التجارب اللي بتستاهل.",
      area: "Les Corts",
      duration: "ساعتين تقريبًا (المباراة)",
      priceText: "من €50",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "event", display: "ضمن موسم الدوري (8–5) — التواريخ حسب الجدول الرسمي", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Camp+Nou+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Camp+Nou+Barcelona",
      officialUrl: "https://www.fcbarcelona.com/en/tickets",
      bookingUrl: "https://www.fcbarcelona.com/en/tickets",
      lastVerified: "8/2026",
    },
    {
      id: "gaudi-bike-tour",
      name: "جولة دراجة على آثار Gaudí",
      image: "https://upload.wikimedia.org/wikipedia/commons/b/bb/6_Water_St_bike_tour_group_jeh.jpg",
      imageSource: WIKIMEDIA,
      categoryId: "tours",
      tags: ["نشاط خفيف", "ثقافة"],
      description: "جولة مجموعة صغيرة بالدراجة على أبرز مباني Gaudí ومعالم المدينة مع مرشد محلي — طريقة ممتعة تشوف فيها مسافة أكبر بوقت أقل من المشي.",
      area: "Gothic Quarter",
      address: "Plaça Reial, 08002 Barcelona, Spain",
      duration: "3–4 ساعات",
      priceText: "من €39",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "variable", display: "جولات يومية — تحقق من الأوقات المتاحة بالموقع", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Placa+Reial+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Placa+Reial+Barcelona",
      officialUrl: "https://gaudibiketours.com",
      bookingUrl: "https://gaudibiketours.com",
      lastVerified: "8/2026",
    },
    {
      id: "gothic-quarter-tapas-wine-tour",
      name: "جولة Tapas ونبيذ بالـ Gothic Quarter",
      image: "https://upload.wikimedia.org/wikipedia/commons/4/46/TapasenBarcelona.JPG",
      imageSource: WIKIMEDIA,
      categoryId: "food-experience",
      tags: ["مساء", "ثقافة"],
      description: "جولة مشي بين عدة بارات Tapas محلية بأزقة الحي القوطي، مع تذوق نبيذ وCava وحكايات عن تاريخ المدينة من مرشد محلي.",
      area: "Gothic Quarter",
      duration: "حوالي 3 ساعات",
      priceText: "من €65",
      priceVaries: true,
      bookingRequired: true,
      hours: { type: "variable", display: "غالبًا مسائية — تحقق من الأوقات المتاحة بالحجز", lastVerified: "2026-08" },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gothic+Quarter+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Gothic+Quarter+Barcelona",
      officialUrl: "https://thebarcelonataste.com",
      bookingUrl: "https://thebarcelonataste.com/barcelona-food-tours/gothic-quarter-tapas-tour/",
      lastVerified: "8/2026",
    },
  ],

  saveMoneyTips: [
    {
      id: "airport-metro-vs-taxi",
      icon: "✈️",
      title: "لا تاخد Taxi من المطار دغري",
      tip: "مترو L9 Sud بيوصلك من المطار بـ€5.90 بدل تاكسي بأضعاف السعر، والفرق بالوقت مش كبير إذا فندقك قريب من محطة مترو.",
      estimatedSaving: "توفير حوالي €20-25 عن التاكسي",
      bestFor: "فندق قريب من خط مترو",
      warning: "T-Casual ما تغطي رحلة المطار — لازم تذكرة منفصلة (€5.90) أو Hola BCN Card.",
      sourceUrl: "https://www.tmb.cat/en/barcelona-fares-metro-bus/transport-ticket-fares",
    },
    {
      id: "hola-bcn-vs-t-casual",
      icon: "🎫",
      title: "قارن Hola BCN Card مع T-Casual قبل ما تشتري",
      tip: "إذا رايح تستخدم المواصلات كثير و2-5 أيام، Hola BCN (تشمل رحلة المطار ومواصلات بلا حدود) غالبًا أوفر من تذاكر فردية أو حتى T-Casual.",
      bestFor: "رحلة 2-5 أيام مع استخدام مواصلات يومي",
      warning: "إذا رايح تمشي أغلب الوقت وتستخدم المترو نادرًا، وفر فلوسك ولا تشتري أي بطاقة.",
      sourceUrl: "https://www.tmb.cat/en/barcelona-fares-metro-bus/transport-ticket-fares",
    },
    {
      id: "park-guell-free-zone",
      icon: "🌳",
      title: "95% من Park Güell مجاني",
      tip: "بس المنطقة المحاطة (Monumental Zone) — الدرج والموزاييك المشهور — هي اللي إلها تذكرة. باقي الحديقة والممرات والإطلالات مفتوحة بدون أي رسوم.",
      bestFor: "ميزانية محدودة بس بدك تشوف الحديقة",
      warning: "إذا بدك الصورة المشهورة عالموزاييك، لازم تحجز تذكرة Monumental Zone مسبقًا.",
      sourceUrl: "https://www.parkguell.barcelona",
    },
    {
      id: "menu-del-dia",
      icon: "🍽️",
      title: "كل غدا، مو بس عشا",
      tip: "أغلب المطاعم المحلية عندها 'Menú del día' وقت الغدا: 2-3 أطباق + خبز + مشروب بسعر ثابت — أرخص بكثير من نفس الأكل عشاء.",
      estimatedSaving: "€10-15 عن وجبة عشا مشابهة",
      bestFor: "أكل محلي بميزانية محدودة",
    },
    {
      id: "official-tickets-only",
      icon: "🎟️",
      title: "احجز تذاكر المعالم من الموقع الرسمي فقط",
      tip: "Sagrada Família وPark Güell وغيرهم — احجز من موقعهم الرسمي مباشرة. مواقع الوسطاء بتضيف عمولة فوق السعر الأصلي بدون أي ميزة حقيقية.",
      warning: "احذر مواقع تشبه الاسم الرسمي بس مو هي — تأكد من الدومين قبل ما تدفع.",
    },
    {
      id: "free-museum-sunday",
      icon: "🖼️",
      title: "متاحف مجانية أول أحد كل شهر",
      tip: "أول أحد بكل شهر، معظم متاحف المدينة الكبيرة (Picasso، MNAC، MACBA، CaixaForum وغيرها) مجانية بالكامل. وكمان حوالي 12 متحف مجاني كل أحد من الساعة 3 عصرًا.",
      estimatedSaving: "€12-16 لكل متحف",
      bestFor: "جدول مرن بتاريخ الزيارة",
      sourceUrl: "https://www.barcelona.cat/museusbarcelona/en",
    },
    {
      id: "atm-choose-euro",
      icon: "💳",
      title: "بالصراف الآلي، اختار الدفع باليورو مش بعملتك",
      tip: "لما الشاشة تسألك 'ادفع باليورو أو بعملتك؟' اختار EUR دايمًا. اختيار عملتك (Dynamic Currency Conversion) بيدي سعر صرف أسوأ من بنكك بفرق ممكن يوصل 10-12%.",
      estimatedSaving: "حتى 10-12% من قيمة كل سحب",
      warning: "ابتعد عن أجهزة Euronet وTravelex وCardpoint المنتشرة بالمناطق السياحية — عمولاتها من الأعلى.",
    },
    {
      id: "tap-water",
      icon: "🚰",
      title: "مي الحنفية آمنة تمامًا للشرب",
      tip: "مافيش داعي تشتري مي معبأة كل شوي — مي برشلونة مطابقة لمعايير الاتحاد الأوروبي. جيب قنينة قابلة لإعادة التعبئة ووفرها عليك.",
      estimatedSaving: "€1-2 يوميًا لكل شخص",
    },
    {
      id: "barcelona-card-worth-it",
      icon: "🗺️",
      title: "بطاقة Barcelona Card تستاهل بس لو رايح بمتحف يوميًا",
      tip: "لو خطتك تشمل متحف أو أكثر كل يوم + مواصلات بلا حدود، البطاقة توفر. لو Sagrada Família وPark Güell هم أولويتك، خذ بعين الاعتبار إنهم مش مشمولين بالبطاقة أصلًا.",
      bestFor: "مهتم بالمتاحف أكثر من العمارة الشهيرة",
    },
    {
      id: "shopping-rebajas",
      icon: "🛍️",
      title: "مواسم التخفيضات الرسمية (Rebajas)",
      tip: "بشهر 1 وشهر 7، المحلات بتنزل أسعارها رسميًا وبنسب كبيرة. إذا رحلتك بهالفترة، خطط للتسوق فيها بدل الأسعار العادية.",
      bestFor: "التسوق جزء أساسي من رحلتك",
    },
  ],

  touristMistakes: [
    {
      id: "sagrada-park-guell-late-booking",
      title: "لا تترك حجز Sagrada Família وPark Güell لآخر لحظة",
      explanation: "بموسم الذروة (4-10) التذاكر بتخلص لأسابيع كاملة، وحتى الفترات الصباحية ممكن تخلص قبل بأيام. احجز أونلاين بمجرد ما تحدد تاريخ رحلتك.",
    },
    {
      id: "atm-currency-conversion",
      title: "لا توافق على تحويل العملة من الصراف الآلي قبل ما تفهم السعر",
      explanation: "لما الجهاز يسألك 'ادفع باليورو أو بعملتك؟' اختار اليورو دايمًا — غير هيك بتدفع سعر صرف أسوأ بفرق ممكن يوصل 10-12%.",
    },
    {
      id: "taxi-from-airport",
      title: "لا تفترض إنه التاكسي أسرع أو أوفر من المطار",
      explanation: "مترو L9 Sud بـ€5.90 غالبًا أوفر بكثير من التاكسي، والفرق بالوقت بسيط إذا فندقك قريب من محطة مترو.",
    },
    {
      id: "t-casual-airport-gap",
      title: "T-Casual ما تشتغل من وإلى المطار",
      explanation: "بطاقة الـ10 رحلات المشهورة مستثناة رحلة المطار؛ لازم تذكرة مطار منفصلة أو Hola BCN Card اللي بتغطيها ضمن السعر.",
    },
    {
      id: "la-rambla-petition-scam",
      title: "دير بالك من 'التوقيع على عريضة' بـ La Rambla",
      explanation: "تكتيك نشل معروف: مجموعة توقفك للتوقيع على عريضة (غالبًا باسم جمعية خيرية)، وبينما يشغلونك حدا تاني بيوصل لشنطتك. الرد الأسلم: تجاهل واستمر بالمشي.",
    },
    {
      id: "restaurant-next-to-landmark",
      title: "لا تختار مطعم بس لأنه مقابل المعلم مباشرة",
      explanation: "الأسعار أعلى والجودة أقل عادة؛ ابعد شارع أو شارعين عن أي معلم سياحي وبتلاقي خيارات أفضل بسعر أقل.",
    },
    {
      id: "park-guell-free-zone-unknown",
      title: "لا تدفع على كل Park Güell وانت مش لازم",
      explanation: "95% من الحديقة مجاني بالكامل؛ بس المنطقة المحاطة (الدرج والموزاييك) هي اللي إلها تذكرة. إذا بس بدك تتمشى بالحديقة، وفر مصاريك.",
    },
    {
      id: "sunday-closures",
      title: "لا تفترض إنه كل شي مفتوح يوم الأحد",
      explanation: "كثير محلات ومطاعم صغيرة سكرانة الأحد بالكامل أو بساعات محدودة. تأكد من ساعات العمل قبل ما تخطط يوم كامل حوالين منطقة معينة.",
    },
    {
      id: "club-dress-code",
      title: "لا تروح لنادي ليلي بدون فحص الـ Dress code",
      explanation: "حتى لو اسمك على الـ guest list، أغلب الأندية برفضوا الدخول للبسة الرياضية أو الشورت أو الصنادل — خصوصًا من الخميس للسبت.",
    },
    {
      id: "barcelona-card-without-plan",
      title: "لا تشتري بطاقة سياحية بدون ما تحسب إذا بتستاهل",
      explanation: "Barcelona Card مفيدة بس لو رايح تزور متحف يوميًا — وهي أصلًا ما بتشمل تذاكر Sagrada Família أو Park Güell. احسب خطتك الفعلية قبل ما تشتريها.",
    },
  ],

  checklist: [
    { id: "documents", label: "وثائق السفر (جواز، تأشيرة إن لزم)" },
    { id: "accommodation", label: "حجز الإقامة" },
    { id: "airport-transport", label: "خطة التنقل من المطار" },
    { id: "sagrada-booking", label: "حجز موعد Sagrada Família" },
    { id: "park-guell-booking", label: "حجز موعد Park Güell" },
    { id: "esim", label: "إنترنت / eSIM" },
    { id: "insurance", label: "تأمين السفر" },
    { id: "cards", label: "بطاقات الدفع جاهزة للاستخدام بالخارج" },
    { id: "offline-maps", label: "تحميل خرائط أوفلاين" },
    { id: "weather", label: "التحقق من حالة الطقس قبل السفر" },
  ],

  // ── Hotels (new top-level section, manual content addition — researched 2026-08) ──
  // Individual bookable properties, distinct from `stayAreas` above (which describes whole
  // NEIGHBORHOODS, not specific hotels). Verified via Google Maps (name, address, rating,
  // phone, current status) and each hotel's own official site. priceText is intentionally
  // free-text, never a fixed number — see the Hotel type's own doc comment in guideTypes.ts.
  hotels: [
    {
      id: "hotel-arts-barcelona",
      name: "Hotel Arts Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/028_Hotel_Arts_%28Barcelona%29%2C_des_del_c._Salvador_Espriu.jpg/1280px-028_Hotel_Arts_%28Barcelona%29%2C_des_del_c._Salvador_Espriu.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Enric",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:028_Hotel_Arts_(Barcelona),_des_del_c._Salvador_Espriu.jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      address: "Carrer de la Marina, 19-21, Ciutat Vella, 08005 Barcelona, Spain",
      area: "Ciutat Vella",
      coordinates: { lat: 41.38667, lng: 2.19611 },
      bestFor: "برج أيقوني على الشاطئ، بإطلالة بحر مباشرة",
      priceText: "الأسعار تتغير حسب الموسم — شوف السعر الحالي بالموقع الرسمي",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Arts+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Hotel+Arts+Barcelona",
      officialUrl: "https://www.hotelartsbarcelona.com",
      rating: 4.5,
      reviewCount: 4740,
      ratingSource: "Google",
    },
    {
      id: "w-barcelona",
      name: "W Barcelona",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/W_Barcelona_%28Hotel_Vela%29_des_del_mar_02.jpg/1280px-W_Barcelona_%28Hotel_Vela%29_des_del_mar_02.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Jordiferrer",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:W_Barcelona_(Hotel_Vela)_des_del_mar_02.jpg",
      imageLicense: "CC BY-SA 4.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      address: "Plaça Rosa Del Vents, 1, Barceloneta, 08039 Barcelona, Spain",
      area: "Barceloneta",
      coordinates: { lat: 41.368472, lng: 2.1902389 },
      bestFor: "شكل شراع مميز (Hotel Vela)، مسابح وأجواء سهر على الواجهة البحرية",
      priceText: "الأسعار تتغير حسب الموسم — شوف السعر الحالي بالموقع الرسمي",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=W+Barcelona+Hotel",
      appleMapsUrl: "https://maps.apple.com/?q=W+Barcelona+Hotel",
      officialUrl: "https://www.marriott.com/en-us/hotels/bcnwh-w-barcelona/overview/",
      rating: 4.4,
      reviewCount: 18879,
      ratingSource: "Google",
    },
    {
      id: "casa-fuster-hotel",
      name: "Hotel Casa Fuster",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Dom%C3%A8nech.i.Montaner.Casa.Fuster.1.Barcelona.JPG/1280px-Dom%C3%A8nech.i.Montaner.Casa.Fuster.1.Barcelona.JPG",
      imageSource: WIKIMEDIA,
      imageAuthor: "Josep Panadero",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Dom%C3%A8nech.i.Montaner.Casa.Fuster.1.Barcelona.JPG",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      address: "Pg. de Gràcia, 132, Gràcia, 08008 Barcelona, Spain",
      area: "Gràcia",
      coordinates: { lat: 41.39817, lng: 2.15812 },
      bestFor: "مبنى مودرنيست تاريخي، مباشرة على Passeig de Gràcia",
      priceText: "الأسعار تتغير حسب الموسم — شوف السعر الحالي بالموقع الرسمي",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Hotel+Casa+Fuster+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Hotel+Casa+Fuster+Barcelona",
      officialUrl: "https://www.hotelcasafuster.com",
      rating: 4.5,
      reviewCount: 3459,
      ratingSource: "Google",
    },
    {
      id: "ohla-barcelona",
      name: "Ohla Barcelona",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Barcelona_-_Hotel_Ohla_Barcelona.jpg/1280px-Barcelona_-_Hotel_Ohla_Barcelona.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Fred Romero",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Barcelona_-_Hotel_Ohla_Barcelona.jpg",
      imageLicense: "CC BY 2.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      address: "Via Laietana, 49, Ciutat Vella, 08003 Barcelona, Spain",
      area: "Ciutat Vella",
      coordinates: { lat: 41.3870568, lng: 2.1743356 },
      bestFor: "بوتيك فاخر بقلب الحي القوطي، بمسبح على السطح",
      priceText: "الأسعار تتغير حسب الموسم — شوف السعر الحالي بالموقع الرسمي",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ohla+Barcelona+Hotel",
      appleMapsUrl: "https://maps.apple.com/?q=Ohla+Barcelona+Hotel",
      officialUrl: "https://www.ohlabarcelona.com",
      rating: 4.6,
      reviewCount: 2028,
      ratingSource: "Google",
    },
    {
      id: "mandarin-oriental-barcelona",
      name: "Mandarin Oriental, Barcelona",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mandarin_Oriental_Barcelona.jpg/1280px-Mandarin_Oriental_Barcelona.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Mandarin Oriental Hotel Group",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Mandarin_Oriental_Barcelona.jpg",
      imageLicense: "CC BY-SA 3.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      address: "Pg. de Gràcia, 38-40, Eixample, 08007 Barcelona, Spain",
      area: "Eixample",
      coordinates: { lat: 41.391361, lng: 2.166889 },
      bestFor: "فخامة عالمية على أرقى نقطة بـPasseig de Gràcia",
      priceText: "الأسعار تتغير حسب الموسم — شوف السعر الحالي بالموقع الرسمي",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandarin+Oriental+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Mandarin+Oriental+Barcelona",
      officialUrl: "https://www.mandarinoriental.com/barcelona/",
      rating: 4.7,
      reviewCount: 4211,
      ratingSource: "Google",
    },
  ],

  // ── Casino (new top-level section, manual content addition — researched 2026-08) ──
  // Only ONE real, legitimate, licensed full casino venue (table games + slots + a
  // professional poker room hosting real tournaments like EPT Barcelona) exists within
  // Barcelona city proper — confirmed via research. Other results surfaced during research
  // ("Bingo Billares", "GoldenPark") are a bingo hall and a sports-betting outlet
  // respectively, not real casinos, and were deliberately excluded per this task's own
  // instruction to exclude betting shops/arcades. Reporting 1 honestly rather than padding
  // to 4 with venues that don't actually qualify.
  casinos: [
    {
      id: "casino-barcelona",
      name: "Casino Barcelona",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Casino_Barcelona_%2829559926106%29.jpg/1280px-Casino_Barcelona_%2829559926106%29.jpg",
      imageSource: WIKIMEDIA,
      imageAuthor: "Jorge Franganillo",
      imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Casino_Barcelona_(29559926106).jpg",
      imageLicense: "CC BY 2.0",
      imageLicenseUrl: "https://creativecommons.org/licenses/by/2.0/",
      address: "Carrer de la Marina, 19-21, Ciutat Vella, 08005 Barcelona, Spain",
      coordinates: { lat: 41.38667, lng: 2.19611 },
      description: "الكازينو المرخّص الرئيسي في برشلونة، داخل مجمع Hotel Arts على الواجهة البحرية — روليت، بلاك جاك، وغرفة بوكر حقيقية تستضيف بطولات مثل EPT Barcelona. سن الدخول 18+.",
      phone: "+34 932 25 78 78",
      hours: {
        type: "always-open",
      },
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Casino+Barcelona",
      appleMapsUrl: "https://maps.apple.com/?q=Casino+Barcelona",
      officialUrl: "https://www.casinobarcelona.com",
      rating: 4.0,
      reviewCount: 8212,
      ratingSource: "Google",
    },
  ],
};
