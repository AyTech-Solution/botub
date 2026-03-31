(function() {
    // 1. Script tag se data nikalne ka sabse reliable tarika
    const scriptTag = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    const botId = scriptTag.getAttribute('data-bot-id');

    if (!botId) {
        console.error("Botub Error: 'data-bot-id' is missing in your script tag!");
        return;
    }

    // 2. Widget Container banana
    const container = document.createElement('div');
    container.id = 'botub-widget-container';
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '2147483647', // Sabse upar dikhne ke liye
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
    });

    // 3. Iframe banana jo aapki main site ko load karega
    const iframe = document.createElement('iframe');
    
    // Yahan ensure karein ki aapka React route /chat/:id sahi hai
    iframe.src = `https://botub.vercel.app/chat/${botId}`; 
    
    iframe.id = 'botub-chat-iframe';
    Object.assign(iframe.style, {
        width: '400px',
        height: '600px',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        backgroundColor: 'white',
        opacity: '1',
        visibility: 'visible',
        display: 'block'
        
    });

    // 4. Page par add karna
    container.appendChild(iframe);
    document.body.appendChild(container);

    console.log("✅ Botub AI Widget Successfully Loaded for ID:", botId);
})();
