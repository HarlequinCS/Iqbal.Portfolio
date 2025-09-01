document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = this.elements['name'].value;
    const email = this.elements['address'].value;
    const message = this.elements['message'].value;

    const botToken = '8366320939:AAHEVgnHNONo42O660wcxlvytIXSE_vRX8E';
    const chatId = '5695409718'; // Chat ID kau
    const text = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                alert('Message sent!');
                document.getElementById('form').reset();
            } else {
                alert('Error sending message.');
            }
        })
        .catch(err => alert('Fetch error: ' + err));
});
