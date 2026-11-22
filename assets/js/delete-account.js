'use strict';

const base = 'https://api.centerha.software/api';
const receiptKey = 'centerha.accountDeletionReceipt.v1';
const form = document.querySelector('#deletion');
const tracking = document.querySelector('#tracking');
const statusText = document.querySelector('#status');
const blockers = document.querySelector('#blockers');
const refresh = document.querySelector('#refresh');
const dismiss = document.querySelector('#dismiss');
const submit = document.querySelector('#submit');
const language = document.querySelector('#language');
const role = document.querySelector('#role');
const recovery = document.querySelector('#recovery');
let locale = window.CenterhaLanguage.get();
let busy = false;
let lastStatus;

const resolutionLinks = {
  ACTIVE_BOOKINGS: { href: 'https://app.centerha.software/my-bookings', en: 'My bookings', ar: 'حجوزاتي' },
  UNRESOLVED_PAYMENTS: { href: '/support', en: 'Contact support', ar: 'تواصل مع الدعم' },
  BUSINESS_OWNERSHIP: { href: 'https://app.centerha.software/owner', en: 'Owner dashboard', ar: 'لوحة المالك' },
  OWNER_VENUES: { href: '/support', en: 'Contact support', ar: 'تواصل مع الدعم' },
  OWNER_WALLET: { href: 'https://app.centerha.software/owner/wallet', en: 'Owner wallet', ar: 'محفظة المالك' },
  OWNER_ONBOARDING: { href: '/support', en: 'Contact support', ar: 'تواصل مع الدعم' },
};

const copy = {
  en: {
    title: 'Delete your Centerha account',
    intro: 'Players and venue owners can request deletion here with their Centerha sign-in details.',
    role: 'Account type', player: 'Player', owner: 'Venue owner', identifier: 'Phone number or username',
    password: 'Current password', recovery: 'Recover your password', ownerRecovery: 'Get help signing into an owner account',
    confirm: 'I request permanent deletion of this account once its dependencies are resolved.',
    submit: 'Request account deletion', tracking: 'Track your request', refresh: 'Check status',
    keep: 'Return to this page in this browser to check progress after signing out.',
    dismiss: 'Clear completed receipt', dataTitle: 'What happens to your data',
    erased: 'Deletion erases your sign-in credentials, profile and avatar, device tokens, notifications, favourites, and reviews. Shared teams, fixtures and completed competitions can retain attribution to an erased internal account.',
    retained: 'Required booking, payment, refund, payout and audit evidence may retain identifying details with restricted access. Backups and operational logs expire separately under retention policies.',
    staffTitle: 'Administrator account offboarding',
    staff: 'For a Centerha administrator account, contact a Centerha Super Admin through your internal channel to verify your identity and request offboarding.',
    staffSupport: 'Request an offboarding review through Support.',
    staffSupportDetails: 'Choose Privacy and deletion and use your work email. Keep passwords, verification codes and identity documents out of the form.',
    QUEUED: 'Request saved. We will check your account for any open dependencies.',
    AWAITING_RESOLUTION: 'Request saved. Complete the actions below. Deletion resumes automatically when the blockers are resolved.',
    PROCESSING: 'Your account has been erased. Removal of remaining data is in progress.',
    CLEANUP_FAILED: 'Your account has been erased. Some cleanup is pending. Check this receipt again for updates.',
    COMPLETED: 'Account deletion and cleanup are complete.',
    ACTIVE_BOOKINGS: 'Open My Bookings on the Centerha web app. Release open holds, request cancellation where available, or wait for the booking and cancellation request to finish.',
    UNRESOLVED_PAYMENTS: 'Open the booking and check its payment or refund. Contact Centerha support with the booking reference if a payment or refund is still pending.',
    BUSINESS_OWNERSHIP: 'In the owner dashboard, resolve wallet balances and payouts. Contact Centerha support to close or transfer remaining venues and onboarding responsibilities.',
    OWNER_VENUES: 'Contact Centerha support to close or transfer each remaining venue and field through the owner workflow.',
    OWNER_WALLET: 'Open Wallet in the owner dashboard. Resolve available and pending balances and any open payout before deletion can resume.',
    OWNER_ONBOARDING: 'Contact Centerha support to close or transfer your open owner onboarding case.',
    TEAM_RESPONSIBILITY: 'Open Teams and transfer captaincy to an active member or close the team in team settings.',
    TOURNAMENT_RESPONSIBILITY: 'Resolve the active competition or team registration in Tournaments. Contact support with the competition reference if it needs review.',
    failed: 'We could not confirm the request. Check status or try again using the same account.',
    signIn: 'Sign-in failed. Check your account type, identifier and current password.',
    storage: 'Allow this site to store your receipt in this browser before submitting.',
    locked: 'This browser has a receipt for another account. Check its status before starting a new request.',
  },
  ar: {
    title: 'حذف حسابك في سنطرها',
    intro: 'يمكن للاعبين وأصحاب الملاعب طلب الحذف هنا باستخدام بيانات تسجيل الدخول إلى سنطرها.',
    role: 'نوع الحساب', player: 'لاعب', owner: 'مالك ملعب', identifier: 'رقم الهاتف أو اسم المستخدم',
    password: 'كلمة المرور الحالية', recovery: 'استعادة كلمة المرور', ownerRecovery: 'المساعدة في الدخول إلى حساب المالك',
    confirm: 'أطلب حذف هذا الحساب نهائيًا بعد حل الالتزامات المرتبطة به.',
    submit: 'طلب حذف الحساب', tracking: 'متابعة طلبك', refresh: 'التحقق من الحالة',
    keep: 'ارجع إلى هذه الصفحة في المتصفح نفسه لمتابعة الطلب بعد تسجيل الخروج.',
    dismiss: 'إزالة إيصال الطلب المكتمل', dataTitle: 'ما الذي يحدث لبياناتك؟',
    erased: 'يُحذف ملفك وصورتك وبيانات تسجيل الدخول ورموز الأجهزة والإشعارات والمفضلة والتقييمات. قد تبقى إحالة الفرق والمباريات والبطولات المكتملة إلى معرّف داخلي لحساب محذوف.',
    retained: 'قد تحتوي سجلات الحجوزات والمدفوعات والمبالغ المستردة والدفعات والتدقيق المطلوبة على بيانات تعريفية، مع تقييد الوصول إليها. تنتهي صلاحية النسخ الاحتياطية وسجلات التشغيل وفق سياسات الاحتفاظ.',
    staffTitle: 'إنهاء صلاحيات الحساب الإداري',
    staff: 'إذا كان لديك حساب إداري في سنطرها، فتواصل مع مسؤول عام في سنطرها عبر قناة التواصل الداخلية للتحقق من هويتك وطلب إنهاء صلاحيات الحساب.',
    staffSupport: 'اطلب مراجعة إنهاء صلاحيات الحساب عبر الدعم.',
    staffSupportDetails: 'اختر «الخصوصية والحذف» واستخدم بريد العمل. لا تُرفق وثائق الهوية ولا تذكر كلمات المرور أو رموز التحقق في النموذج.',
    QUEUED: 'تم حفظ الطلب. سنتحقق من الالتزامات المتبقية على حسابك.',
    AWAITING_RESOLUTION: 'تم حفظ الطلب. أكمل الإجراءات أدناه وسيُستأنف الحذف تلقائيًا بعد حلّ الالتزامات.',
    PROCESSING: 'تم حذف حسابك. جارٍ إزالة البيانات المتبقية.',
    CLEANUP_FAILED: 'تم حذف الحساب ولا تزال بعض البيانات قيد الإزالة. تحقّق من الإيصال مجددًا لمعرفة المستجدات.',
    COMPLETED: 'اكتمل حذف الحساب وإزالة البيانات.',
    ACTIVE_BOOKINGS: 'افتح حجوزاتي من موقع سنطرها. حرّر الحجوزات المؤقتة أو اطلب الإلغاء عند توفره أو انتظر انتهاء الحجز وطلبات الإلغاء.',
    UNRESOLVED_PAYMENTS: 'افتح الحجز وتحقّق من الدفع أو الاسترداد. تواصل مع دعم سنطرها بمرجع الحجز إذا بقي معلّقًا.',
    BUSINESS_OWNERSHIP: 'سوِّ أرصدة المحفظة والدفعات من لوحة المالك. تواصل مع دعم سنطرها لإغلاق أو نقل المنشآت أو مسؤوليات التسجيل المتبقية.',
    OWNER_VENUES: 'تواصل مع دعم سنطرها لإغلاق أو نقل كل منشأة وملعب متبقٍ عبر إجراءات المالك.',
    OWNER_WALLET: 'افتح المحفظة في لوحة المالك وسوِّ الأرصدة المتاحة والمعلّقة وأي دفعة مفتوحة لاستئناف الحذف.',
    OWNER_ONBOARDING: 'تواصل مع دعم سنطرها لإغلاق أو نقل طلب تسجيل المالك المفتوح.',
    TEAM_RESPONSIBILITY: 'افتح الفريق وانقل القيادة إلى عضو نشط أو أغلق الفريق من إعداداته.',
    TOURNAMENT_RESPONSIBILITY: 'عالج البطولة أو تسجيل الفريق من قسم البطولات. تواصل مع الدعم بمرجع البطولة إن احتاجت إلى مراجعة.',
    failed: 'تعذّر تأكيد الطلب. تحقّق من الحالة أو أعد المحاولة بالحساب نفسه.',
    signIn: 'تعذّر تسجيل الدخول. تحقّق من نوع الحساب والمعرّف وكلمة المرور الحالية.',
    storage: 'اسمح للموقع بتخزين إيصالك في هذا المتصفح قبل إرسال الطلب.',
    locked: 'يحتوي هذا المتصفح على إيصال لحساب آخر. تحقّق من حالته قبل بدء طلب جديد.',
  },
};

function savedReceipt() {
  try {
    return JSON.parse(localStorage.getItem(receiptKey));
  } catch {
    return null;
  }
}

function setBusy(value) {
  busy = value;
  submit.disabled = refresh.disabled = value;
}

function render() {
  const text = copy[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title = text.title;
  document.querySelectorAll('[data-text]').forEach((node) => {
    node.textContent = text[node.dataset.text];
  });
  language.textContent = locale === 'en' ? 'العربية' : 'English';
  language.lang = locale === 'en' ? 'ar' : 'en';
  const owner = role.value === 'owner';
  recovery.href = owner ? '/support' : 'https://app.centerha.software/account/forgot-password';
  recovery.textContent = owner ? text.ownerRecovery : text.recovery;
  statusText.textContent = text[lastStatus?.status] || lastStatus?.message || '';
  blockers.replaceChildren(...(lastStatus?.blockers || []).map((code) => {
    const row = document.createElement('li');
    row.textContent = text[code] || text.failed;
    const action = resolutionLinks[code];
    if (action) {
      const link = document.createElement('a');
      link.href = action.href;
      link.textContent = action[locale];
      row.append(' ', link);
    }
    return row;
  }));
  blockers.hidden = !blockers.childElementCount;
  tracking.hidden = !savedReceipt();
  form.hidden = Boolean(lastStatus?.operationId);
  dismiss.hidden = lastStatus?.status !== 'COMPLETED';
}

async function request(path, body, accessToken, method = 'POST') {
  const headers = { 'Content-Type': 'application/json', 'Accept-Language': locale };
  if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
  const reply = await fetch(base + path, {
    method, headers, body: JSON.stringify(body), credentials: 'omit',
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  const data = await reply.json();
  if (!reply.ok) {
    const error = new Error(typeof data.message === 'string' ? data.message : copy[locale].failed);
    error.status = reply.status;
    error.code = data.errorCode;
    throw error;
  }
  return data;
}

async function recover() {
  const receipt = savedReceipt();
  if (!receipt) return;
  try {
    const fields = { operationId: receipt.operationId, receiptSecret: receipt.receiptSecret };
    try {
      lastStatus = await request('/auth/account-deletion/requests/status', fields);
    } catch (error) {
      if (error.status !== 404 || error.code === 'ACCOUNT_DELETION_RECEIPT_NOT_FOUND') throw error;
      lastStatus = await request('/auth/account-deletion/status', fields);
    }
  } catch {
    if (!lastStatus?.operationId) lastStatus = { status: 'failed' };
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  const passwordField = document.querySelector('#password');
  const password = passwordField.value;
  passwordField.value = '';
  setBusy(true);
  try {
    const owner = role.value === 'owner';
    const identifier = document.querySelector('#identifier').value.trim();
    let authenticated;
    try {
      authenticated = await request(owner ? '/auth/owner/login' : '/auth/login', { identifier, password });
    } catch {
      lastStatus = { status: 'signIn' };
      return;
    }
    if (authenticated.user?.role !== (owner ? 'OWNER' : 'USER') || !authenticated.accessToken) {
      lastStatus = { status: 'signIn' };
      return;
    }
    const saved = savedReceipt();
    if (saved && saved.userId !== authenticated.user.id) {
      lastStatus = { status: 'locked' };
      return;
    }
    const receipt = saved ?? {
      userId: authenticated.user.id,
      operationId: crypto.randomUUID(),
      receiptSecret: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
        .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''),
    };
    try {
      localStorage.setItem(receiptKey, JSON.stringify(receipt));
    } catch {
      lastStatus = { status: 'storage' };
      return;
    }
    try {
      const deletion = { operationId: receipt.operationId, receiptSecret: receipt.receiptSecret, currentPassword: password };
      try {
        lastStatus = await request('/auth/me/deletion-requests', deletion, authenticated.accessToken);
      } catch (error) {
        if (error.status !== 404) throw error;
        lastStatus = await request('/auth/me', deletion, authenticated.accessToken, 'DELETE');
      }
    } catch (error) {
      const blocker = error.code?.replace(/^ACCOUNT_DELETION_/, '');
      lastStatus = { message: error.message, blockers: blocker && copy[locale][blocker] ? [blocker] : [] };
      const previous = lastStatus;
      await recover();
      if (!lastStatus?.operationId) lastStatus = previous;
    }
  } finally {
    setBusy(false);
    render();
    statusText.focus();
  }
});

refresh.addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  await recover();
  setBusy(false);
  render();
  statusText.focus();
});

dismiss.addEventListener('click', () => {
  if (lastStatus?.status !== 'COMPLETED') return;
  localStorage.removeItem(receiptKey);
  lastStatus = undefined;
  form.reset();
  render();
});

role.addEventListener('change', render);
language.addEventListener('click', () => {
  window.CenterhaLanguage.set(locale === 'en' ? 'ar' : 'en');
});

document.addEventListener('centerha:languagechange', ({ detail }) => { locale = detail.lang; render(); });
render();
if (savedReceipt()) {
  setBusy(true);
  recover().finally(() => {
    setBusy(false);
    render();
  });
}
