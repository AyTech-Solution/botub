(function() {
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');

  // 1. Create a container for the widget
  const container = document.createElement('div');
  container.id = 'botub-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  // 2. Add an Iframe that loads your Botub app
  const iframe = document.createElement('iframe');
  // Yahan aapki Vercel app ka URL aayega
  iframe.src = `https://botub.vercel.app/chat/${botId}`; 
  iframe.style.width = '400px';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '20px';
  iframe.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
  
  container.appendChild(iframe);
})();
