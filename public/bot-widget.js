(function() {
  const config = window.BOTUB_CONFIG || {};
  const botId = config.botId || '';
  if (!botId) return;

  const origin = document.currentScript.src.replace('/bot-widget.js', '');
  const themeColor = config.themeColor || '#4f46e5';
  const position = config.position || 'right';

  // Create Container
  const container = document.createElement('div');
  container.id = 'botub-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style[position] = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'Inter, system-ui, sans-serif';

  // Create Bubble
  const bubble = document.createElement('div');
  bubble.id = 'botub-widget-bubble';
  bubble.style.width = '60px';
  bubble.style.height = '60px';
  bubble.style.borderRadius = '30px';
  bubble.style.backgroundColor = themeColor;
  bubble.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
  bubble.style.cursor = 'pointer';
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.justifyContent = 'center';
  bubble.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  bubble.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
    </svg>
  `;

  // Create Iframe Container
  const iframeWrapper = document.createElement('div');
  iframeWrapper.id = 'botub-widget-iframe-wrapper';
  iframeWrapper.style.position = 'absolute';
  iframeWrapper.style.bottom = '80px';
  iframeWrapper.style[position] = '0';
  iframeWrapper.style.width = '420px';
  iframeWrapper.style.height = '650px';
  iframeWrapper.style.maxWidth = 'calc(100vw - 40px)';
  iframeWrapper.style.maxHeight = 'calc(100vh - 120px)';
  iframeWrapper.style.borderRadius = '24px';
  iframeWrapper.style.overflow = 'hidden';
  iframeWrapper.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
  iframeWrapper.style.display = 'none';
  iframeWrapper.style.opacity = '0';
  iframeWrapper.style.transform = 'translateY(20px) scale(0.95)';
  iframeWrapper.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  iframeWrapper.style.pointerEvents = 'none';

  const iframe = document.createElement('iframe');
  iframe.src = `${origin}/widget/${botId}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  iframeWrapper.appendChild(iframe);
  container.appendChild(iframeWrapper);
  container.appendChild(bubble);
  document.body.appendChild(container);

  let isOpen = false;

  bubble.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      iframeWrapper.style.display = 'block';
      setTimeout(() => {
        iframeWrapper.style.opacity = '1';
        iframeWrapper.style.transform = 'translateY(0) scale(1)';
        iframeWrapper.style.pointerEvents = 'auto';
      }, 10);
      bubble.style.transform = 'rotate(-90deg) scale(0.9)';
      bubble.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      `;
    } else {
      iframeWrapper.style.opacity = '0';
      iframeWrapper.style.transform = 'translateY(20px) scale(0.95)';
      iframeWrapper.style.pointerEvents = 'none';
      setTimeout(() => {
        iframeWrapper.style.display = 'none';
      }, 300);
      bubble.style.transform = 'rotate(0) scale(1)';
      bubble.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
        </svg>
      `;
    }
  };

  bubble.onmouseenter = function() {
    if (!isOpen) bubble.style.transform = 'scale(1.1) translateY(-5px)';
  };

  bubble.onmouseleave = function() {
    if (!isOpen) bubble.style.transform = 'scale(1) translateY(0)';
  };
})();
