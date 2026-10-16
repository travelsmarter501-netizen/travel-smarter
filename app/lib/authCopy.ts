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
};
