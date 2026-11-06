import type { Language } from "./homepageTranslations";

/**
 * Words for the sign-in family of pages (/login, /signup, /forgot-password, /reset-password) and for the Google button,
 * in both site languages. Kept in one file so the pages stay readable and the two languages cannot drift apart.
 */
export type AuthCopy = {
  common: {
    or: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    googleStartFailed: string;
    /** Inside an embedded browser (TikTok, Instagram, ...) the Google action is replaced by these two lines. {browser} = Safari / Chrome. */
    googleEmbeddedOpenIn: string;
    googleEmbeddedUseEmail: string;
    /** Names used for {browser}. */
    browserNames: { safari: string; chrome: string; any: string };
    /** Embedded browser + a purchase waiting to be linked: finish in THIS browser (title / explanation / Google hint; {browser} = Safari / Chrome). */
    claimSameBrowserTitle: string;
    claimSameBrowserBody: string;
    claimSameBrowserGoogle: string;
    /** Extra line under the disabled Google action when a purchase is waiting to be linked. */
    googleEmbeddedClaimWarning: string;
    backToLogin: string;
  };
  login: {
    title: string;
    subtitle: string;
    submit: string;
    submitting: string;
    google: string;
    forgot: string;
    noAccount: string;
    signupLink: string;
    wrongCredentials: string;
    emailNotConfirmed: string;
    genericError: string;
    /** /auth/callback sent the visitor back because Google / the email link did not complete. */
    callbackFailed: string;
    /** ...specifically because the sign-in was started in a different browser than the one that returned (e.g. TikTok -> Safari). {browser} = Safari / Chrome. */
    callbackBrowserMismatch: string;
  };
  signup: {
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    google: string;
    haveAccount: string;
    loginLink: string;
    errors: { alreadyRegistered: string; weakPassword: string; rateLimited: string; emailNotAllowed: string; sendFailed: string; invalidEmail: string; generic: string };
    checkEmail: {
      title: string;
      body: string;
      confirmThenReturn: string;
      spam: string;
      resend: string;
      resending: string;
      resent: string;
      resendFailed: string;
      toLogin: string;
    };
  };
  forgot: {
    title: string;
    subtitle: string;
    submit: string;
    submitting: string;
    sentTitle: string;
    sentBody: string;
    sameBrowserNote: string;
    rateLimited: string;
    generic: string;
  };
  reset: {
    title: string;
    subtitle: string;
    newPassword: string;
    confirmPassword: string;
    submit: string;
    submitting: string;
    mismatch: string;
    tooShort: string;
    saveFailed: string;
    successTitle: string;
    successBody: string;
    expiredTitle: string;
    expiredBody: string;
    requestNew: string;
  };
};

export const authCopy: Record<Language, AuthCopy> = {
  ar: {
    common: {
      or: "أو",
      email: "البريد الإلكتروني",
      emailPlaceholder: "example@email.com",
      password: "كلمة المرور",
      passwordPlaceholder: "••••••••",
      googleStartFailed: "تعذّر بدء تسجيل الدخول عبر Google. حاول مرة أخرى.",
      googleEmbeddedOpenIn: "للمتابعة عبر Google، افتح الموقع في {browser}.",
      googleEmbeddedUseEmail: "أو استخدم البريد الإلكتروني وكلمة المرور من هنا.",
      browserNames: { safari: "Safari", chrome: "Chrome", any: "متصفح هاتفك (Safari أو Chrome)" },
      claimSameBrowserTitle: "تم الدفع بنجاح ✓",
      claimSameBrowserBody: "لربط مشترياتك بحسابك، أكمل تسجيل الدخول أو إنشاء الحساب من نفس المتصفح.",
      claimSameBrowserGoogle: "إذا أردت استخدام Google، افتح {browser} قبل بدء عملية الشراء.",
      googleEmbeddedClaimWarning: "ملاحظة: إذا انتقلت إلى متصفح آخر بعد الدفع، فقد لا يرتبط شراؤك تلقائيًا إلا إذا فتحت رابط هذه الصفحة نفسه في ذلك المتصفح.",
      backToLogin: "العودة لتسجيل الدخول",
    },
    login: {
      title: "تسجيل الدخول",
      subtitle: "سجّل دخولك للوصول إلى حسابك في مسارك.",
      submit: "تسجيل الدخول",
      submitting: "جاري تسجيل الدخول...",
      google: "متابعة عبر Google",
      forgot: "نسيت كلمة المرور؟",
      noAccount: "ليس لديك حساب؟",
      signupLink: "إنشاء حساب جديد",
      wrongCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      emailNotConfirmed: "لم يتم تأكيد بريدك الإلكتروني بعد. افتح رسالة التأكيد التي أرسلناها لك ثم سجّل دخولك.",
      genericError: "تعذّر تسجيل الدخول. حاول مرة أخرى.",
      callbackFailed: "تعذّر إكمال تسجيل الدخول. إذا كنت قد أكدت بريدك الإلكتروني للتو، سجّل دخولك الآن وسنكمل من حيث توقفت. وإلا حاول مرة أخرى.",
      callbackBrowserMismatch: "بدأ تسجيل الدخول في متصفح مختلف. افتح Travel Smarter في {browser} وابدأ تسجيل الدخول عبر Google من هناك.",
    },
    signup: {
      title: "إنشاء حساب",
      subtitle: "انضم إلى مسارك لتخطيط رحلاتك بسهولة.",
      name: "الاسم",
      namePlaceholder: "اسمك الكامل",
      passwordHint: "6 أحرف على الأقل",
      submit: "إنشاء حساب",
      submitting: "جاري إنشاء الحساب...",
      google: "التسجيل عبر Google",
      haveAccount: "لديك حساب بالفعل؟",
      loginLink: "تسجيل الدخول",
      errors: {
        alreadyRegistered: "هذا البريد الإلكتروني مسجّل مسبقًا. سجّل دخولك، أو استخدم «نسيت كلمة المرور؟» إذا لم تعد تتذكرها.",
        weakPassword: "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل ولا تستخدم كلمة شائعة.",
        rateLimited: "أرسلنا عددًا كبيرًا من الرسائل مؤخرًا. انتظر قليلًا ثم حاول مرة أخرى.",
        emailNotAllowed: "لا يمكننا إرسال رسالة تأكيد إلى هذا البريد حاليًا. جرّب بريدًا آخر أو سجّل عبر Google.",
        sendFailed: "تعذّر إرسال رسالة التأكيد. حاول بعد قليل أو سجّل عبر Google.",
        invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
        generic: "تعذّر إنشاء الحساب. حاول مرة أخرى.",
      },
      checkEmail: {
        title: "تحقق من بريدك الإلكتروني",
        body: "أرسلنا رابط تأكيد إلى",
        confirmThenReturn: "افتح الرابط لتأكيد بريدك الإلكتروني، وسنعيدك إلى مسارك لإكمال ما بدأته.",
        spam: "لم تصلك الرسالة؟ تحقق من البريد المزعج (Spam).",
        resend: "إعادة إرسال رسالة التأكيد",
        resending: "جاري الإرسال...",
        resent: "أعدنا إرسال الرسالة.",
        resendFailed: "تعذّر إعادة الإرسال الآن. حاول بعد قليل.",
        toLogin: "أكدت بريدي — تسجيل الدخول",
      },
    },
    forgot: {
      title: "نسيت كلمة المرور؟",
      subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.",
      submit: "إرسال رابط إعادة التعيين",
      submitting: "جاري الإرسال...",
      sentTitle: "تحقق من بريدك الإلكتروني",
      sentBody: "إذا كان هذا البريد مسجّلًا لدينا، أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور.",
      sameBrowserNote: "افتح الرابط على نفس الجهاز والمتصفح الذي طلبت منه.",
      rateLimited: "أرسلنا عددًا كبيرًا من الرسائل مؤخرًا. انتظر قليلًا ثم حاول مرة أخرى.",
      generic: "تعذّر إرسال الرابط. حاول مرة أخرى.",
    },
    reset: {
      title: "تعيين كلمة مرور جديدة",
      subtitle: "اختر كلمة مرور جديدة لحسابك.",
      newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور",
      submit: "حفظ كلمة المرور",
      submitting: "جاري الحفظ...",
      mismatch: "كلمتا المرور غير متطابقتين.",
      tooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
      saveFailed: "تعذّر حفظ كلمة المرور. اطلب رابطًا جديدًا وحاول مرة أخرى.",
      successTitle: "تم تغيير كلمة المرور",
      successBody: "جاري تحويلك...",
      expiredTitle: "الرابط غير صالح أو انتهت صلاحيته",
      expiredBody: "اطلب رابط إعادة تعيين جديدًا، وافتحه على نفس الجهاز والمتصفح.",
      requestNew: "طلب رابط جديد",
    },
  },
  en: {
    common: {
      or: "or",
      email: "Email",
      emailPlaceholder: "example@email.com",
      password: "Password",
      passwordPlaceholder: "••••••••",
      googleStartFailed: "We couldn't start Google sign-in. Please try again.",
      googleEmbeddedOpenIn: "To continue with Google, open the site in {browser}.",
      googleEmbeddedUseEmail: "Or use your email and password here.",
      browserNames: { safari: "Safari", chrome: "Chrome", any: "your phone's browser (Safari or Chrome)" },
      claimSameBrowserTitle: "Payment successful ✓",
      claimSameBrowserBody: "To link your purchase to your account, finish signing in or creating your account in this same browser.",
      claimSameBrowserGoogle: "If you want to use Google, open {browser} before starting the purchase.",
      googleEmbeddedClaimWarning: "Note: if you switch browsers after paying, your purchase may not link automatically unless you open this page's link in the other browser.",
      backToLogin: "Back to sign in",
    },
    login: {
      title: "Sign in",
      subtitle: "Sign in to reach your Travel Smarter account.",
      submit: "Sign in",
      submitting: "Signing in...",
      google: "Continue with Google",
      forgot: "Forgot password?",
      noAccount: "Don't have an account?",
      signupLink: "Create an account",
      wrongCredentials: "The email or password is incorrect.",
      emailNotConfirmed: "Your email isn't confirmed yet. Open the confirmation email we sent you, then sign in.",
      genericError: "We couldn't sign you in. Please try again.",
      callbackFailed: "We couldn't finish signing you in. If you just confirmed your email, sign in now and we'll continue where you left off. Otherwise please try again.",
      callbackBrowserMismatch: "Sign-in was started in a different browser. Open Travel Smarter in {browser} and start the Google sign-in from there.",
    },
    signup: {
      title: "Create an account",
      subtitle: "Join Travel Smarter to plan your trips with ease.",
      name: "Name",
      namePlaceholder: "Your full name",
      passwordHint: "At least 6 characters",
      submit: "Create account",
      submitting: "Creating account...",
      google: "Sign up with Google",
      haveAccount: "Already have an account?",
      loginLink: "Sign in",
      errors: {
        alreadyRegistered: "This email is already registered. Sign in, or use “Forgot password?” if you don't remember it.",
        weakPassword: "That password is too weak. Use at least 6 characters and avoid common passwords.",
        rateLimited: "We've sent a lot of emails recently. Please wait a little and try again.",
        emailNotAllowed: "We can't send a confirmation email to this address right now. Try another email or sign up with Google.",
        sendFailed: "We couldn't send the confirmation email. Please try again shortly, or sign up with Google.",
        invalidEmail: "Please enter a valid email address.",
        generic: "We couldn't create your account. Please try again.",
      },
      checkEmail: {
        title: "Check your email",
        body: "We sent a confirmation link to",
        confirmThenReturn: "Open the link to confirm your email and we'll bring you back to Travel Smarter to finish what you started.",
        spam: "Didn't get it? Check your spam folder.",
        resend: "Resend confirmation email",
        resending: "Sending...",
        resent: "We sent the email again.",
        resendFailed: "We couldn't resend it right now. Please try again shortly.",
        toLogin: "I've confirmed — sign in",
      },
    },
    forgot: {
      title: "Forgot password?",
      subtitle: "Enter your email and we'll send you a link to set a new password.",
      submit: "Send reset link",
      submitting: "Sending...",
      sentTitle: "Check your email",
      sentBody: "If this email is registered with us, we've sent it a link to reset the password.",
      sameBrowserNote: "Open the link on the same device and browser you requested it from.",
      rateLimited: "We've sent a lot of emails recently. Please wait a little and try again.",
      generic: "We couldn't send the link. Please try again.",
    },
    reset: {
      title: "Set a new password",
      subtitle: "Choose a new password for your account.",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      submit: "Save password",
      submitting: "Saving...",
      mismatch: "The two passwords don't match.",
      tooShort: "The password must be at least 6 characters.",
      saveFailed: "We couldn't save the password. Request a new link and try again.",
      successTitle: "Password changed",
      successBody: "Taking you there...",
      expiredTitle: "This link is invalid or has expired",
      expiredBody: "Request a new reset link and open it on the same device and browser.",
      requestNew: "Request a new link",
    },
  },
  he: {
    common: {
      or: "או",
      email: "אימייל",
      emailPlaceholder: "example@email.com",
      password: "סיסמה",
      passwordPlaceholder: "••••••••",
      googleStartFailed: "לא הצלחנו להתחיל את ההתחברות עם Google. נסו שוב.",
      googleEmbeddedOpenIn: "כדי להמשיך עם Google, פתחו את האתר ב־{browser}.",
      googleEmbeddedUseEmail: "או השתמשו כאן באימייל ובסיסמה.",
      browserNames: { safari: "Safari", chrome: "Chrome", any: "הדפדפן של הטלפון (Safari או Chrome)" },
      claimSameBrowserTitle: "התשלום בוצע בהצלחה ✓",
      claimSameBrowserBody: "כדי לקשר את הרכישה לחשבון שלכם, סיימו להתחבר או לפתוח חשבון באותו דפדפן.",
      claimSameBrowserGoogle: "אם תרצו להשתמש ב־Google, פתחו את {browser} לפני שמתחילים את הרכישה.",
      googleEmbeddedClaimWarning: "שימו לב: אם תעברו לדפדפן אחר אחרי התשלום, ייתכן שהרכישה לא תקושר אוטומטית, אלא אם תפתחו את הקישור של הדף הזה בדפדפן השני.",
      backToLogin: "חזרה להתחברות",
    },
    login: {
      title: "התחברות",
      subtitle: "התחברו כדי להגיע לחשבון Travel Smarter שלכם.",
      submit: "התחברות",
      submitting: "מתחברים...",
      google: "המשך עם Google",
      forgot: "שכחתם את הסיסמה?",
      noAccount: "אין לכם חשבון?",
      signupLink: "פתיחת חשבון",
      wrongCredentials: "האימייל או הסיסמה שגויים.",
      emailNotConfirmed: "האימייל שלכם עוד לא אומת. פתחו את מייל האימות ששלחנו, ואז התחברו.",
      genericError: "לא הצלחנו לחבר אתכם. נסו שוב.",
      callbackFailed: "לא הצלחנו לסיים את ההתחברות. אם בדיוק אימתתם את האימייל, התחברו עכשיו ונמשיך מאיפה שעצרתם. אחרת נסו שוב.",
      callbackBrowserMismatch: "ההתחברות התחילה בדפדפן אחר. פתחו את Travel Smarter ב־{browser} והתחילו משם את ההתחברות עם Google.",
    },
    signup: {
      title: "פתיחת חשבון",
      subtitle: "הצטרפו ל־Travel Smarter כדי לתכנן את הטיולים שלכם בקלות.",
      name: "שם",
      namePlaceholder: "השם המלא שלכם",
      passwordHint: "לפחות 6 תווים",
      submit: "פתיחת חשבון",
      submitting: "פותחים חשבון...",
      google: "הרשמה עם Google",
      haveAccount: "כבר יש לכם חשבון?",
      loginLink: "התחברות",
      errors: {
        alreadyRegistered: "האימייל הזה כבר רשום. התחברו, או השתמשו ב\"שכחתם את הסיסמה?\" אם אתם לא זוכרים אותה.",
        weakPassword: "הסיסמה חלשה מדי. השתמשו לפחות ב־6 תווים והימנעו מסיסמאות נפוצות.",
        rateLimited: "שלחנו הרבה מיילים לאחרונה. חכו קצת ונסו שוב.",
        emailNotAllowed: "לא נוכל לשלוח כרגע מייל אימות לכתובת הזו. נסו אימייל אחר או הירשמו עם Google.",
        sendFailed: "לא הצלחנו לשלוח את מייל האימות. נסו שוב בעוד רגע, או הירשמו עם Google.",
        invalidEmail: "הזינו כתובת אימייל תקינה.",
        generic: "לא הצלחנו לפתוח את החשבון. נסו שוב.",
      },
      checkEmail: {
        title: "בדקו את האימייל",
        body: "שלחנו קישור אימות אל",
        confirmThenReturn: "פתחו את הקישור כדי לאמת את האימייל, ונחזיר אתכם ל־Travel Smarter כדי לסיים את מה שהתחלתם.",
        spam: "לא הגיע? בדקו בתיקיית הספאם.",
        resend: "שליחה חוזרת של מייל האימות",
        resending: "שולחים...",
        resent: "שלחנו את המייל שוב.",
        resendFailed: "לא הצלחנו לשלוח שוב כרגע. נסו שוב בעוד רגע.",
        toLogin: "אימתתי — להתחברות",
      },
    },
    forgot: {
      title: "שכחתם את הסיסמה?",
      subtitle: "הזינו את האימייל ונשלח לכם קישור לבחירת סיסמה חדשה.",
      submit: "שליחת קישור לאיפוס",
      submitting: "שולחים...",
      sentTitle: "בדקו את האימייל",
      sentBody: "אם האימייל הזה רשום אצלנו, שלחנו אליו קישור לאיפוס הסיסמה.",
      sameBrowserNote: "פתחו את הקישור באותו מכשיר ובאותו דפדפן שממנו ביקשתם אותו.",
      rateLimited: "שלחנו הרבה מיילים לאחרונה. חכו קצת ונסו שוב.",
      generic: "לא הצלחנו לשלוח את הקישור. נסו שוב.",
    },
    reset: {
      title: "בחירת סיסמה חדשה",
      subtitle: "בחרו סיסמה חדשה לחשבון שלכם.",
      newPassword: "סיסמה חדשה",
      confirmPassword: "אימות סיסמה",
      submit: "שמירת הסיסמה",
      submitting: "שומרים...",
      mismatch: "שתי הסיסמאות לא תואמות.",
      tooShort: "הסיסמה צריכה להיות באורך 6 תווים לפחות.",
      saveFailed: "לא הצלחנו לשמור את הסיסמה. בקשו קישור חדש ונסו שוב.",
      successTitle: "הסיסמה שונתה",
      successBody: "מעבירים אתכם...",
      expiredTitle: "הקישור הזה לא תקין או שפג תוקפו",
      expiredBody: "בקשו קישור איפוס חדש ופתחו אותו באותו מכשיר ובאותו דפדפן.",
      requestNew: "בקשת קישור חדש",
    },
  },
};
