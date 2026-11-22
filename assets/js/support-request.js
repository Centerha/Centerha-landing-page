'use strict';

const supportForm = document.querySelector('#support-request');
const supportButton = supportForm.querySelector('button');
const supportResult = document.querySelector('#support-result');
const supportResponses = {
  en: {
    sent: 'Your support request was received. Reference: ',
    busy: 'Too many attempts. Wait a minute before trying again.',
    failed: 'We could not confirm receipt. Please try again.',
  },
  ar: {
    sent: 'تم استلام طلب الدعم. رقم المرجع: ',
    busy: 'محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.',
    failed: 'تعذّر تأكيد استلام الطلب. حاول مرة أخرى.',
  },
};

supportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (supportButton.disabled) return;
  supportButton.disabled = true;
  supportResult.textContent = '';
  const fields = Object.fromEntries(new FormData(supportForm));
  try {
    const response = await fetch(window.CenterhaConfig.API_BASE_URL + '/support/requests', {
      method: 'POST',
      credentials: 'omit',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(15000),
    });
    const copy = supportResponses[document.documentElement.lang] ?? supportResponses.en;
    if (response.status === 429) {
      supportResult.textContent = copy.busy;
    } else {
      if (!response.ok) throw new Error();
      const { id } = await response.json();
      if (typeof id !== 'string') throw new Error();
      supportResult.textContent = copy.sent + id;
      supportForm.reset();
    }
  } catch {
    supportResult.textContent = (supportResponses[document.documentElement.lang] ?? supportResponses.en).failed;
  } finally {
    supportButton.disabled = false;
    supportResult.focus();
  }
});
