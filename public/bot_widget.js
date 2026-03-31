(function() {
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');

  if (!botId) {
    console.error("Botub Error: data-bot-id is missing!");
    return;
  }

  // Widget Container
  const container = document.createElement('div');
  container.id = 'botub-widget-container';
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  });
  document.body.appendChild(container);

  // Iframe for Chat
  const iframe = document.createElement('iframe');
  // Yahan apna Vercel URL check karein
  iframe.src = `https://botub.vercel.app/chat/${botId}`; 
  Object.assign(iframe.style, {
    width: '380px',
    height: '500px',
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    backgroundColor: 'white'
  });
  
  container.appendChild(iframe);
})();
