document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const popup = document.getElementById('popup');
  const closeBtn = document.querySelector('.close-btn');
  const btnOk = document.querySelector('.btn-ok');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = this.elements['name'].value.trim();
    const email = this.elements['email'].value.trim();
    const message = this.elements['message'].value.trim();

    // ⚠️ Reminder: exposing bot tokens on frontend is insecure.
    const botToken = '8366320939:AAHEVgnHNONo42O660wcxlvytIXSE_vRX8E';
    const chatId = '5695409718';
    const text = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
      const data = await response.json();

      if (data.ok) {
        // Reset & show popup with animation
        form.reset();
        showPopup();
      } else {
        alert('Error sending message. Please try again.');
      }
    } catch (error) {
      alert('Fetch error: ' + error);
    }
  });

  function showPopup(){
    // Prepare (remove hidden so it can transition)
    popup.classList.remove('hidden');

    // Force reflow to ensure transition triggers
    // eslint-disable-next-line no-unused-expressions
    popup.offsetHeight;

    // Add .show to fade backdrop & play card/svg animations
    popup.classList.add('show');
  }

  function hidePopup(){
    popup.classList.remove('show');
    // Wait backdrop transition lalu, then hard-hide
    setTimeout(() => popup.classList.add('hidden'), 280);
  }

  // Close controls
  closeBtn.addEventListener('click', hidePopup);
  btnOk?.addEventListener('click', hidePopup);

  // Click outside content to close
  popup.addEventListener('click', (e) => {
    if (e.target === popup) hidePopup();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popup.classList.contains('hidden')) hidePopup();
  });
});
