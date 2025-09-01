// telebot.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Ambil nilai dari form
        const name = this.elements['name'].value;
        const email = this.elements['email'].value;
        const message = this.elements['message'].value;

        // Token bot & Chat ID
        const botToken = '8366320939:AAHEVgnHNONo42O660wcxlvytIXSE_vRX8E';
        const chatId = '5695409718';

        // Format mesej
        const text = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
            const data = await response.json();

            if (data.ok) {
                alert('Message sent successfully!');
                form.reset();
            } else {
                alert('Error sending message. Please try again.');
            }
        } catch (error) {
            alert('Fetch error: ' + error);
        }
    });
});
