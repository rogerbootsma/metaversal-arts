// Keep document content usable even when the artwork cannot initialize.
window.addEventListener('error', (event) => {
  if (event.target?.tagName === 'SCRIPT' && event.target.src.endsWith('/scene.js')) {
    document.querySelector('#scene-fallback').hidden = false;
  }
}, true);
// Enquiries stay local until the visitor sends them in their email application.
const enquiryForm = document.querySelector('#enquiry-form');
if (enquiryForm) {
  const status = document.querySelector('#enquiry-status');
  const collect = () => {
    const values = new FormData(enquiryForm);
    const name = String(values.get('name') || '').trim();
    const email = String(values.get('email') || '').trim();
    const interest = String(values.get('interest') || 'Project enquiry');
    const message = String(values.get('message') || '').trim();
    if (!name || !message) {
      status.textContent = 'Please include your name and a few words about your idea.';
      return null;
    }
    return { subject: `Metaversal Arts enquiry: ${interest}`, body: `Hello Metaversal Arts,\n\n${message}\n\nArea of interest: ${interest}\n\nFrom: ${name}\nEmail: ${email}` };
  };
  enquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    const enquiry = collect();
    if (!enquiry) return;
    const url = `mailto:contact@metaversalarts.io?subject=${encodeURIComponent(enquiry.subject)}&body=${encodeURIComponent(enquiry.body)}`;
    window.location.href = url;
    status.textContent = 'Continue in your email app to send. If no draft opens, copy your enquiry and email contact@metaversalarts.io.';
  });
  document.querySelector('#copy-enquiry').addEventListener('click', async () => {
    if (!enquiryForm.reportValidity()) return;
    const enquiry = collect();
    if (!enquiry) return;
    try {
      await navigator.clipboard.writeText(`To: contact@metaversalarts.io\nSubject: ${enquiry.subject}\n\n${enquiry.body}`);
      status.textContent = 'Enquiry copied. Paste it into an email to contact@metaversalarts.io and send when ready.';
    } catch {
      status.textContent = 'Your browser could not copy the enquiry. You can select your message and copy it manually, or use Prepare email.';
    }
  });
  enquiryForm.hidden = false;
}
