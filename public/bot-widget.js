(function() {
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');
  const origin = new URL(script.src).origin;

  if (!botId) {
    console.error('Botub: data-bot-id is required');
    return;
  }

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    #botify-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #botify-widget-bubble {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: #4f46e5;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #botify-widget-bubble:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5);
    }
    #botify-widget-bubble svg {
      width: 30px;
      height: 30px;
      color: white;
    }
    #botify-widget-iframe-container {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 40px);
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      display: none;
      transform-origin: bottom right;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    #botify-widget-iframe-container.open {
      display: block;
      animation: botify-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes botify-slide-in {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @media (max-width: 480px) {
      #botify-widget-iframe-container {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
      }
    }
  `;
  document.head.appendChild(style);

  // Create container
  const container = document.createElement('div');
  container.id = 'botify-widget-container';
  
  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'botify-widget-iframe-container';
  
  const iframe = document.createElement('iframe');
  iframe.src = `${origin}/widget/${botId}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframeContainer.appendChild(iframe);
  
  // Create bubble
  const bubble = document.createElement('div');
  bubble.id = 'botify-widget-bubble';
  bubble.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8"></path>
      <rect width="16" height="12" x="4" y="8" rx="2"></rect>
      <path d="M2 14h2"></path>
      <path d="M20 14h2"></path>
      <path d="M15 13v2"></path>
      <path d="M9 13v2"></path>
    </svg>
  `;
  
  let isOpen = false;
  bubble.onclick = () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframeContainer.classList.add('open');
      bubble.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      `;
    } else {
      iframeContainer.classList.remove('open');
      bubble.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
      `;
    }
  };
  
  container.appendChild(iframeContainer);
  container.appendChild(bubble);
  document.body.appendChild(container);
})();
