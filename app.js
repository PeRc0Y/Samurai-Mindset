const leadForm = document.querySelector('#lead-form');
const emailInput = document.querySelector('#email');
const formError = document.querySelector('#form-error');
const successState = document.querySelector('#success-state');
const mailerliteEndpoint = window.SAMURAI_MAILERLITE_ENDPOINT || '';

const track = (name) => {
  window.samuraiEvents = window.samuraiEvents || [];
  window.samuraiEvents.push({ name, at: new Date().toISOString() });
};

document.querySelectorAll('a[href="#form"]').forEach((link) => link.addEventListener('click', () => track('hero_cta_click')));
emailInput?.addEventListener('focus', () => track('lead_form_start'), { once: true });

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  const email = emailInput.value.trim();
  if (!email || !emailInput.validity.valid) {
    formError.textContent = 'Please enter a valid email address.';
    emailInput.focus();
    return;
  }
  const payload = { email, name: leadForm.elements.name.value.trim() };
  try {
    if (mailerliteEndpoint) {
      const response = await fetch(mailerliteEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('MailerLite request failed');
    }
    track('lead_form_submit');
    leadForm.hidden = true;
    successState.classList.add('visible');
    track('pdf_success_view');
  } catch (error) {
    formError.textContent = 'Something went wrong. Please try again in a moment.';
    console.error(error);
  }
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  }
}), { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
