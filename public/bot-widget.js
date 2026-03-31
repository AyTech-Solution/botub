(function() {
  // 1. Script se Bot ID nikalna
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');

  if (!botId) {
    console.error("Botub Error: data-bot-id is missing in the script tag!");
    return;
  }

  // 2. Widget ke liye ek Container (Div) banana
  const container = document.createElement('div');
  container.id = 'botub-widget-container';
  
  // Container ki Styling (Bottom-Right corner mein set karna)
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontFamily: 'sans-serif'
  });
  document.body.appendChild(container);

  // 3. Iframe banana jo aapki main Botub app load karega
  const iframe = document.createElement('iframe');
  
  // URL format: Aapka Vercel link + chat route + botId
  // Note: Ensure karein ki aapne React mein /chat/:id wala route banaya hai
  iframe.src = `https://botub.vercel.app/chat/${botId}`; 
  
  // Iframe ki Styling
  Object.assign(iframe.style, {
    width: '380px',
    height: '550px',
    border: 'none',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    backgroundColor: 'white',
    transition: 'all 0.3s ease'
  });
  
  container.appendChild(iframe);

  // Optional: Console log for debugging
  console.log("AyTech Botub AI Widget Loaded for ID:", botId);
})();
