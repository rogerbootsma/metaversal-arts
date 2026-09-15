// Keep document content usable even when the artwork cannot initialize.
window.addEventListener('error', (event) => {
  if (event.target?.tagName === 'SCRIPT' && event.target.src.endsWith('/scene.js')) {
    document.querySelector('#scene-fallback').hidden = false;
  }
}, true);
// Preparing a draft stays on this page; provider links require a separate click.
const enquiryForm = document.querySelector('#enquiry-form');
if (enquiryForm) {
  const status = document.querySelector('#enquiry-status');
  const draft = document.querySelector('#email-draft');
  const draftText = document.querySelector('#email-draft-text');
  const gmail = document.querySelector('#open-gmail');
  const app = document.querySelector('#open-email-app');
  const collect = () => {
    if (!enquiryForm.reportValidity()) return null;
    const data = new FormData(enquiryForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const interest = String(data.get('interest') || 'Project enquiry');
    const message = String(data.get('message') || '').trim();
    if (!name || !message) {
      status.textContent = 'Please include your name and a few words about your idea.';
      return null;
    }
    const subject = 'Metaversal Arts enquiry: ' + interest;
    const body = 'Hello Metaversal Arts,\n\n' + message + '\n\nArea of interest: ' + interest + '\n\nFrom: ' + name + '\nEmail: ' + email;
    return {subject, body, text: 'To: contact@metaversalarts.io\nSubject: ' + subject + '\n\n' + body};
  };
  const prepare = () => {
    const enquiry = collect();
    if (!enquiry) return null;
    draftText.value = enquiry.text;
    gmail.href = 'https://mail.google.com/mail/?' + new URLSearchParams({view:'cm',fs:'1',to:'contact@metaversalarts.io',su:enquiry.subject,body:enquiry.body});
    app.href = 'mailto:contact@metaversalarts.io?subject=' + encodeURIComponent(enquiry.subject) + '&body=' + encodeURIComponent(enquiry.body);
    draft.hidden = false;
    status.textContent = '';
    return enquiry;
  };
  enquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    if (prepare()) document.querySelector('#email-draft-title').focus();
  });
  const copy = async () => {
    const enquiry = prepare();
    if (!enquiry) return;
    try {
      await navigator.clipboard.writeText(enquiry.text);
      status.textContent = 'Email copied. Paste it into your email service and send when ready.';
    } catch {
      draftText.focus();
      draftText.select();
      status.textContent = 'Automatic copying is unavailable. Your draft is selected: use your device’s Copy command, then paste it into your email service.';
    }
  };
  document.querySelector('#copy-enquiry').addEventListener('click', copy);
  document.querySelector('#copy-draft').addEventListener('click', copy);
  app.addEventListener('click', () => {
    status.textContent = 'If no email app opens, use Open Gmail or copy the draft below. Nothing has been sent yet.';
  });
  enquiryForm.addEventListener('input', event => {
    if (event.target === draftText) return;
    if (!draft.hidden) {
      draft.hidden = true;
      gmail.href = 'https://mail.google.com/mail/';
      app.href = 'mailto:contact@metaversalarts.io';
      draftText.value = '';
      status.textContent = 'Your details changed. Prepare the email again to update the draft.';
    }
  });
  enquiryForm.hidden = false;
}
