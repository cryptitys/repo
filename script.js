<!-- Anti-AdBlock -->
<script>
(function() {
    'use strict';

    if (window.DarkSense) return;

    class DarkSense {
        constructor() {
            this.isAdblockDetected = false;
            this.isOverlayCreated = false;
            this.checkInterval = null;
            this.retryCount = 0;
            this.maxRetries = 10;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startDetection());
            } else {
                this.startDetection();
            }
        }

        startDetection() {
            this.detectByElements();
            this.detectByScript();
            this.detectByGoogleAds();
            this.detectByCSS();
            this.detectByNetwork();

            this.checkInterval = setInterval(() => {
                if (!this.isAdblockDetected && this.retryCount < this.maxRetries) {
                    this.detectByElements();
                    this.detectByScript();
                    this.retryCount++;
                } else if (this.retryCount >= this.maxRetries) {
                    clearInterval(this.checkInterval);
                }
            }, 1000); // testa a cada 1s

            setTimeout(() => {
                if (this.checkInterval) {
                    clearInterval(this.checkInterval);
                }
            }, 30000);
        }

        detectByElements() {
            const testSelectors = [
                '#adsbox', '#sponsor', '#banner', '#advertisement',
                '#ad-banner', '#googleads', '.ads', '.ad', '.adsbygoogle',
                '[id*="google_ads"]', '[class*="google-ad"]', '[id*="adsystem"]'
            ];

            let blockedCount = 0;
            testSelectors.forEach(selector => {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        const style = window.getComputedStyle(element);
                        if (
                            style.display === 'none' ||
                            style.visibility === 'hidden' ||
                            style.opacity === '0' ||
                            element.offsetHeight === 0 ||
                            element.offsetWidth === 0
                        ) {
                            blockedCount++;
                        }
                    }
                } catch (e) {}
            });

            if (blockedCount >= 2) {
                this.handleAdblockDetected('Elementos DOM bloqueados');
            }
        }

        detectByScript() {
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox ad sponsor advertisement banner google-ad';
            testAd.id = 'darksense-test-ad';
            testAd.style.cssText = 'position:absolute!important;left:-10000px!important;width:300px!important;height:250px!important';

            document.body.appendChild(testAd);

            setTimeout(() => {
                try {
                    const style = window.getComputedStyle(testAd);
                    if (
                        style.display === 'none' ||
                        style.visibility === 'hidden' ||
                        testAd.offsetHeight === 0 ||
                        testAd.offsetWidth === 0
                    ) {
                        this.handleAdblockDetected('Script de teste bloqueado');
                    }
                    document.body.removeChild(testAd);
                } catch (e) {
                    this.handleAdblockDetected('Elemento de teste removido');
                }
            }, 100);
        }

        detectByGoogleAds() {
            setTimeout(() => {
                if (typeof window.adsbygoogle === 'undefined' || !window.adsbygoogle) {
                    const script = document.createElement('script');
                    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
                    script.async = true;
                    script.onerror = () => {
                        this.handleAdblockDetected('Google AdSense bloqueado');
                    };
                    document.head.appendChild(script);
                }
            }, 1000);

            const adsenseTest = document.createElement('ins');
            adsenseTest.className = 'adsbygoogle';
            adsenseTest.style.cssText = 'display:block!important;width:300px!important;height:250px!important;position:absolute!important;left:-10000px!important';
            adsenseTest.setAttribute('data-ad-client', 'ca-pub-test');
            adsenseTest.setAttribute('data-ad-slot', '1234567890');

            document.body.appendChild(adsenseTest);

            setTimeout(() => {
                try {
                    const style = window.getComputedStyle(adsenseTest);
                    if (style.display === 'none' || adsenseTest.offsetHeight === 0) {
                        this.handleAdblockDetected('Elemento AdSense bloqueado');
                    }
                    document.body.removeChild(adsenseTest);
                } catch (e) {
                    this.handleAdblockDetected('Elemento AdSense removido');
                }
            }, 1500);
        }

        detectByCSS() {
            const testCSS = document.createElement('style');
            testCSS.innerHTML = '.darksense-css-test{display:block!important;visibility:visible!important;opacity:1!important}';
            document.head.appendChild(testCSS);

            const testDiv = document.createElement('div');
            testDiv.className = 'darksense-css-test ads advertisement sponsor banner';
            testDiv.style.cssText = 'position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important';
            document.body.appendChild(testDiv);

            setTimeout(() => {
                try {
                    const style = window.getComputedStyle(testDiv);
                    if (
                        style.display === 'none' ||
                        style.visibility === 'hidden' ||
                        style.opacity === '0'
                    ) {
                        this.handleAdblockDetected('CSS ads bloqueadas');
                    }
                    document.head.removeChild(testCSS);
                    document.body.removeChild(testDiv);
                } catch (e) {
                    this.handleAdblockDetected('Elementos CSS removidos');
                }
            }, 500);
        }

        detectByNetwork() {
            if (typeof window.fetch !== 'undefined') {
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).catch(error => {
                        if (error.message && error.message.toLowerCase().includes('blocked')) {
                            window.DarkSense.handleAdblockDetected('Network request bloqueado');
                        }
                        throw error;
                    });
                };
            }

            const img = new Image();
            img.onerror = () => {
                setTimeout(() => {
                    if (!this.isAdblockDetected) {
                        // não faz nada
                    }
                }, 3000);
            };
            img.src = 'https://pagead2.googlesyndication.com/pagead/gen_204?id=test&' + Date.now();
        }

        createOverlay() {
            if (this.isOverlayCreated) return;
            this.isOverlayCreated = true;

            const style = document.createElement('style');
            style.innerHTML = `
                #darksense-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.92);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2147483647;
                    font-family: 'Poppins', sans-serif;
                }
                .darksense-modal {
                    background: linear-gradient(145deg, #1a1a1a, #21113b);
                    border: 2px solid #4c10d6;
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(76, 16, 214, 0.5);
                    color: #fff;
                }
                .darksense-icon {
                    font-size: 3rem;
                    color: #ff3b3b;
                    margin-bottom: 1rem;
                    animation: pulse 1.5s infinite;
                }
                .darksense-title {
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }
                .darksense-message {
                    font-size: 1rem;
                    color: #ccc;
                    margin-bottom: 1.5rem;
                }
                .darksense-button {
                    background: linear-gradient(135deg, #4c10d6, #7c3aed);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(76, 16, 214, 0.4);
                }
                .darksense-button:hover {
                    background: linear-gradient(135deg, #5d1ae6, #8b46f7);
                    transform: translateY(-2px);
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.id = 'darksense-overlay';
            overlay.innerHTML = `
                <div class="darksense-modal">
                    <div class="darksense-icon"><i class="fas fa-shield-alt"></i></div>
                    <h2 class="darksense-title">Bloqueador de Anúncios Detectado</h2>
                    <p class="darksense-message">Para continuar aproveitando nosso conteúdo gratuito, por favor desative seu bloqueador de anúncios e recarregue a página.</p>
                    <button class="darksense-button" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt"></i> Recarregar Página
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.classList.add('darksense-blocked');
            this.protectOverlay();
        }

        protectOverlay() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node.id === 'darksense-overlay') {
                            setTimeout(() => this.createOverlay(), 200);
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setInterval(() => {
                if (this.isAdblockDetected && !document.getElementById('darksense-overlay')) {
                    this.createOverlay();
                }
            }, 2000);
        }

        handleAdblockDetected(method) {
            if (this.isAdblockDetected) return;

            this.isAdblockDetected = true;

            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }

            setTimeout(() => {
                this.createOverlay();
            }, 500);
        }
    }

    window.DarkSense = new DarkSense();
    Object.defineProperty(window, 'DarkSense', { writable: false, configurable: false });

})();
</script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" rel="stylesheet">

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eclipse Lunar - TAREFAS</title>
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7541876262806139"
     crossorigin="anonymous"></script>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary-purple: rgb(76, 16, 214);
            --dark-purple: #7c3aed;
            --light-purple:rgb(144, 116, 243);
            --light-purple-bg: rgba(76, 16, 214, 0.1);
            --background-dark: #000000;
            --background-medium: #1a1a1a;
            --background-light: #2d2d2d;
            --text-primary: #ffffff;
            --text-secondary: #b0b0b0;
            --border-color: rgba(255, 255, 255, 0.1);
            --gray-button: #404040;
            --gray-button-hover: #525252;
            --success-color: #10b981;
            --warning-color:rgb(255, 1, 1);
            --error-color: #ef4444;
            --delete-color: #be123c;
            --delete-color-hover: #9f1239;
            --eclipse-bg-dark: #0a0a0a;
            --eclipse-bg-medium: #1e1e1e;
            --eclipse-text-secondary: #888888;
            --eclipse-warning:rgb(255, 7, 7);
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: var(--background-dark);
            color: var(--text-primary);
            min-height: 100vh;
            background-image: 
                radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(45, 45, 45, 0.3) 0%, transparent 50%),
                linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #141414 100%);
        }

        /* --- ESTRUTURA PARA ANÚNCIOS --- */
        .main-wrapper {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            width: 100%;
            padding: 1rem;
            gap: 1rem;
        }

        .ad-sidebar {
            width: 180px; /* Largura das barras laterais de anúncios */
            position: sticky;
            top: 20px;
            display: none; /* Escondido por padrão em telas menores */
            flex-shrink: 0;
        }

        .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 420px;
        }
        
        /* Exibe as barras de anúncios laterais em telas maiores */
        @media (min-width: 1200px) {
            .main-wrapper {
                justify-content: space-evenly;
            }
            .ad-sidebar {
                display: block;
            }
            .main-content {
                max-width: 480px; /* Aumenta um pouco o conteúdo principal */
            }
        }
        
        .ad-placeholder {
            width: 100%;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px dashed var(--border-color);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        /* --- FIM DA ESTRUTURA PARA ANÚNCIOS --- */
        
        .login-container {
            width: 100%;
            max-width: 380px; /* Mantido para consistência */
            padding: 2rem;
            margin: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }
        
        .logo-text {
            font-size: 2.5rem;
            font-weight: 500;
            background: linear-gradient(135deg, var(--primary-purple), var(--dark-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--text-secondary);
            font-weight: 400;
            margin-bottom: 0.5rem;
        }
        
        .tagline {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--primary-purple);
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        
        .form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .input-group {
            position: relative;
        }
        
        .input-group label {
            display: block;
            font-size: 0.9rem;
            font-weight: 400;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }
        
        .input-wrapper {
            position: relative;
        }
        
        .input-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
        }
        
        .input-group input[type="password"] {
            padding-right: 2.5rem;
        }
        
        .input-group input:focus {
            outline: none;
            border-color: var(--primary-purple);
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        
        .input-group input::placeholder {
            color: var(--text-secondary);
        }
        
        .password-toggle {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.2s ease;
        }
        
        .password-toggle:hover {
            color: var(--text-primary);
        }
        
        .form-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }

        .btn-accounts {
            margin-bottom: 1.5rem;
            background: var(--primary-purple);
            border: 1px solid var(--border-color);
        }

        .btn-accounts:hover {
            background: var(--light-purple);
            border-color: var(--light-purple);
        }
        
        .btn {
            width: 100%;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            font-family: 'Poppins', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .btn-pending {
            background: linear-gradient(135deg, rgb(10, 10, 10), #252525, var(--primary-purple));
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-pending:hover:not(:disabled) {
            background: linear-gradient(135deg, rgb(17, 17, 17), #252525, var(--dark-purple));
            transform: translateY(-1px);
        }
        
        .btn-expired {
            background: linear-gradient(135deg, rgb(20, 20, 20), #252525, var(--primary-purple));
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-expired:hover:not(:disabled) {
            background: linear-gradient(135deg, rgb(20, 19, 19), #252525, var(--dark-purple));
            transform: translateY(-1px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .footer-links a {
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        
        .footer-links a:hover {
            color: var(--text-primary);
        }
        
        .copyright {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
            margin-bottom: 0.5rem;
        }
        
        .developed-by {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
        }
        
        /* --- Início Estilos do Modal de Atividades --- */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .modal.show {
            display: flex;
        }
        
        #taskSelectionModal .modal-content {
            position: relative;
            background: linear-gradient(145deg, #1a1a1a, #21113b);
            border-radius: 16px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            border: 1px solid var(--primary-purple);
            box-shadow: 0 20px 60px rgba(124, 58, 237, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        #taskSelectionModal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--primary-purple);
            background: rgba(76, 16, 214, 0.05);
        }
        
        #taskSelectionModal .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }
        
        #taskSelectionModal .close-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 0.5rem;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #taskSelectionModal .close-btn:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.1);
            transform: scale(1.1);
        }
        
        #taskSelectionModal .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
        }
        
        #taskSelectionModal .select-all {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--light-purple-bg);
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        
        #taskSelectionModal .select-all label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            font-weight: 500;
            color: var(--text-primary);
        }
        
        #taskSelectionModal .select-all input[type="checkbox"] {
            width: 20px;
            height: 20px;
            accent-color: var(--primary-purple);
            cursor: pointer;
        }
        
        #taskSelectionModal .activity-items {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 2rem;
            padding-right: 0.5rem;
        }
        
        #taskSelectionModal .activity-items::-webkit-scrollbar { width: 8px; }
        #taskSelectionModal .activity-items::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        #taskSelectionModal .activity-items::-webkit-scrollbar-thumb { background: var(--primary-purple); border-radius: 4px; }
        #taskSelectionModal .activity-items::-webkit-scrollbar-thumb:hover { background: var(--dark-purple); }
        
        #taskSelectionModal .activity-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        #taskSelectionModal .activity-item:hover {
            background: rgba(76, 16, 214, 0.08);
            border-color: var(--primary-purple);
            transform: translateY(-1px);
        }

        #taskSelectionModal .activity-item.redacao {
            border-color: var(--eclipse-warning);
            background: rgba(251, 191, 36, 0.05);
        }
        
        #taskSelectionModal .activity-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
            accent-color: var(--primary-purple);
            cursor: pointer;
            flex-shrink: 0;
        }
        
        #taskSelectionModal .activity-item label {
            flex: 1;
            cursor: pointer;
            color: var(--text-primary);
            font-weight: 400;
            line-height: 1.4;
            min-width: 0;
        }
        
        #taskSelectionModal .activity-score-selector {
            background: var(--background-medium);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            padding: 0.5rem;
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
            min-width: 80px;
        }
        
        #taskSelectionModal .activity-score-selector:focus, 
        #taskSelectionModal .activity-score-selector:hover {
            outline: none;
            border-color: var(--primary-purple);
            box-shadow: 0 0 0 2px rgba(76, 16, 214, 0.2);
        }
        
        #taskSelectionModal .modal-info-box {
            background: var(--light-purple-bg);
            border-left: 4px solid var(--primary-purple);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        #taskSelectionModal .modal-info-box i {
            color: var(--primary-purple);
            font-size: 1.2rem;
        }

        #taskSelectionModal .modal-info-box p {
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0;
        }
        
        #taskSelectionModal .time-settings {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        #taskSelectionModal .time-settings h3 {
            color: var(--text-primary);
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        #taskSelectionModal .time-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        
        #taskSelectionModal .input-group {
            display: flex;
            flex-direction: column;
        }
        
        #taskSelectionModal .input-group label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        #taskSelectionModal .input-group input {
            background: var(--background-medium);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            padding: 0.75rem;
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            transition: all 0.2s ease;
        }
        
        #taskSelectionModal .input-group input:focus {
            outline: none;
            border-color: var(--primary-purple);
            box-shadow: 0 0 0 2px rgba(76, 16, 214, 0.2);
        }
        
        #taskSelectionModal .modal-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        }
        
        #taskSelectionModal .btn {
            flex: 1;
            min-width: 160px;
        }

        #taskSelectionModal .btn-primary {
            background: var(--primary-purple);
            color: white;
        }
        
        #taskSelectionModal .btn-primary:hover:not(:disabled) {
            background: var(--dark-purple);
            transform: translateY(-2px);
        }
        
        #taskSelectionModal .btn-secondary {
            background: var(--gray-button);
            color: white;
        }
        
        #taskSelectionModal .btn-secondary:hover:not(:disabled) {
            background: var(--gray-button-hover);
            transform: translateY(-2px);
        }

        /* --- Estilos para containers de anúncios --- */
        .ad-slot-in-form, .ad-slot-multiplex, .ad-slot-modal-footer {
            width: 100%;
            margin: 1rem 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50px; /* Altura mínima para o anúncio carregar */
            min-width: 250px; /* Garantia para ads fluid */
        }

        @media (max-width: 320px) {
            .ad-slot-in-form, .ad-slot-multiplex, .ad-slot-modal-footer {
                display: none; /* Esconde ads se tela muito pequena */
            }
        }
        /* --- Fim dos Estilos do Modal --- */


        /* Modal de Contas Salvas (Estilos originais) */
         #accountsModal .modal-content, #examTokenModal .modal-content {
            position: relative;
            background: linear-gradient(145deg, #1a1a1a, #21113b);
            padding: 2rem;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--primary-purple);
            box-shadow: 0 8px 32px 0 rgba(124, 58, 237, 0.2);
        }
        
        #accountsModal .modal-header, #examTokenModal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--primary-purple);
        }
        
        #accountsModal .modal-title, #examTokenModal .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        #accountsModal .close, #examTokenModal .close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.2s ease, transform 0.2s ease;
        }
        
        #accountsModal .close:hover, #examTokenModal .close:hover {
            color: var(--text-primary);
            transform: scale(1.1);
        }
        
        .account-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .account-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: var(--light-purple-bg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .account-list-item-user {
            font-weight: 500;
        }

        .account-list-item-actions {
            display: flex;
            gap: 0.75rem;
        }
        .btn-account-action {
            padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer;
            font-weight: 500; transition: all 0.2s ease;
        }
        .btn-use { background: var(--primary-purple); color: white; }
        .btn-use:hover { background: var(--dark-purple); }
        .btn-delete { background: var(--delete-color); color: white; }
        .btn-delete:hover { background: var(--delete-color-hover); }
        
        /* Notification (Toast) Styles */
        .notification-container {
            position: fixed; top: 20px; right: 20px; z-index: 2000;
            display: flex; flex-direction: column; gap: 10px;
        }
        .notification {
            padding: 1rem 1.5rem; border-radius: 8px; color: white; font-weight: 500;
            transform: translateX(120%); opacity: 0;
            transition: all 0.4s cubic-bezier(0.215, 0.610, 0.355, 1);
            max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex; align-items: center; gap: 1rem;
        }
        .notification.show { transform: translateX(0); opacity: 1; }
        .notification-content { flex-grow: 1; }
        .notification i { font-size: 1.5rem; }

        /* Tons de roxo diferentes para cada tipo */
        .notification.success { 
            background: linear-gradient(135deg, #1a0d2e, #2d1b45); 
            border: 1px solid rgba(76, 16, 214, 0.4);
        }
        .notification.error { 
            background: linear-gradient(135deg, #2a1538, #3d1f52); 
            border: 1px solid rgba(124, 58, 237, 0.5);
        }
        .notification.info { 
            background: linear-gradient(135deg, #0d0a1a, #1e1533); 
            border: 1px solid rgba(144, 116, 243, 0.3);
        }

        /* Efeito hover para interatividade */
        .notification:hover {
            transform: translateX(-5px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }

        /* --- AJUSTES PARA DISPOSITIVOS MÓVEIS --- */
        @media (max-width: 768px) {
            /* Ajustes no Modal de Seleção de Tarefas */
            #taskSelectionModal .modal-content { max-width: 95%; margin: 0.5rem; max-height: 95vh; }
            #taskSelectionModal .modal-header { padding: 1rem 1.5rem; }
            #taskSelectionModal .modal-header h2 { font-size: 1.3rem; }
            #taskSelectionModal .modal-body { padding: 1.5rem; }

            /* Aumenta a área da lista de tarefas para melhor visualização no celular */
            #taskSelectionModal .activity-items { 
                min-height: 250px; /* Garante espaço para pelo menos 3-4 tarefas */
                max-height: 45vh;  /* Limita a altura para se adaptar a diferentes telas */
            }
            
            /* Torna os itens da lista maiores e mais fáceis de tocar */
            #taskSelectionModal .activity-item { 
                flex-direction: column; 
                align-items: flex-start; 
                gap: 1rem; /* Mais espaço entre o texto e o seletor de nota */
                padding: 1.2rem; /* Mais área de toque */
            }

            #taskSelectionModal .activity-item-top { display: flex; align-items: center; gap: 0.75rem; width: 100%; }
            
            /* Aumenta a fonte do nome da tarefa para facilitar a leitura */
            #taskSelectionModal .activity-item label { 
                font-size: 1rem; 
                line-height: 1.4;
            }

            #taskSelectionModal .activity-score-selector { align-self: stretch; min-width: auto; }
            #taskSelectionModal .time-inputs { grid-template-columns: 1fr; }
            #taskSelectionModal .modal-actions { flex-direction: column; }
            #taskSelectionModal .btn { min-width: auto; }

            /* Ajustes no Modal de Contas Salvas */
            .account-list-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .account-list-item-actions {
                align-self: stretch;
                justify-content: space-between;
            }
            
            .btn-account-action {
                flex: 1;
                text-align: center;
            }

            /* Ajustes gerais para responsividade */
            .main-wrapper {
                padding: 0.5rem;
                gap: 0.5rem;
            }

            .login-container {
                padding: 1rem;
                max-width: 100%;
            }

            .main-content {
                max-width: 100%;
            }

            .logo-text {
                font-size: 2rem;
            }
        }

        @media (max-width: 480px) {
            .main-content {
                max-width: 100%;
            }
            .login-container { padding: 1.5rem; }
            .logo-text { font-size: 2rem; }
            #taskSelectionModal .modal-content { border-radius: 12px; }
            #taskSelectionModal .modal-header, #taskSelectionModal .modal-body, #taskSelectionModal .time-settings { padding: 1rem; }
            #taskSelectionModal .activity-item { padding: 0.75rem; }
            #accountsModal .modal-content {
                padding: 1.5rem;
                margin: 0.5rem;
            }
            .account-list-item-user {
                word-break: break-all;
                font-size: 0.9rem;
            }
        }
    </style>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" rel="stylesheet"/>
</head>
<body>
    <div class="main-wrapper">
        <aside class="ad-sidebar left-ad">
            <div class="ad-placeholder">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-7541876262806139"
                     data-ad-slot="8995681163"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </aside>

        <main class="main-content">
            <div class="login-container">
                <div class="header">
                    <div class="logo-section">
                        <h1 class="logo-text">Eclipse Lunar</h1>
                    </div>
                    <p class="subtitle">Sua plataforma do Futuro.</p>
                    <p class="tagline">Tarefas SP</p>
                </div>
                
                <form class="form" id="loginForm">
                    <button type="button" class="btn btn-accounts" id="btnShowAccounts">
                        <i class="fas fa-users"></i> Contas Salvas
                    </button>
                    <div class="input-group">
                        <label for="username">Usuário:</label>
                        <input type="text" id="username" name="username" placeholder="Ex. 123456789xsp" autocomplete="username" required>
                    </div>
                    
                    <div class="input-group">
                        <label for="password">Senha:</label>
                        <div class="input-wrapper">
                            <input type="password" id="password" name="password" placeholder="Sua senha de acesso" autocomplete="current-password" required>
                            <button type="button" class="password-toggle"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>

                    <div class="ad-slot-in-form">
                        <ins class="adsbygoogle"
                             style="display:block; text-align:center;"
                             data-ad-layout="in-article"
                             data-ad-format="fluid"
                             data-ad-client="ca-pub-7541876262806139"
                             data-ad-slot="4290149391"></ins>
                    </div>
                    
                    <div class="form-buttons">
                        <button type="button" class="btn btn-pending" id="btnPending">
                            <i class="fas fa-clock"></i> Atividade Pendente
                        </button>
                        <button type="button" class="btn btn-expired" id="btnExpired">
                            <i class="fas fa-hourglass-end"></i> Atividade Expirada
                        </button>
                        <button type="button" class="btn btn-expired" id="btnPendingExams">
                            <i class="fas fa-file-alt"></i> Provas Pendentes
                        </button>
                    </div>
                </form>
                
                <div class="ad-slot-multiplex">
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-format="autorelaxed"
                         data-ad-client="ca-pub-7541876262806139"
                         data-ad-slot="1303510519"></ins>
                </div>

                <div class="footer">
                    <div class="footer-links">
                        <a href="https://discord.gg/H6V7RWzKgV" target="_blank"><i class="fab fa-discord"></i> Discord</a>
                        <a href="https://pixgg.com/Crimsonstrauss" target="_blank"><i class="fas fa-heart"></i> Doações</a>

                    </div>
                    <p class="copyright">Eclipse Lunar © 2025. Todos os Direitos Reservados.</p>
                    <p class="developed-by">Developed by Eclipse Lunar</p>
                </div>
            </div>
        </main>

        <aside class="ad-sidebar right-ad">
            <div class="ad-placeholder">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-7541876262806139"
                     data-ad-slot="8995681163"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </aside>
    </div>


    <div id="accountsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Contas Salvas</h2>
                <button class="close" id="closeAccountsModal">&times;</button>
            </div>
            <div id="accountListContainer" class="account-list"></div>
        </div>
    </div>

    <div id="taskSelectionModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="taskSelectionModalTitle">Selecionar Atividades</h2>
                <button class="close-btn" id="closeTaskModal">×</button>
            </div>
            
            <div class="modal-body">
                <div class="select-all">
                    <label>
                        <input type="checkbox" id="selectAllTasksCheckbox"> 
                        Selecionar Todas as Atividades
                    </label>
                </div>
                
                <div class="activity-items" id="taskListContainer">
                    </div>

                <div class="modal-info-box">
                    <i class="fas fa-lightbulb"></i>
                    <p><strong>Dica Rápida:</strong> Se desejar que as respostas soem mais naturais, mantenha a pontuação entre 70% e 90%. Nesse intervalo, podem ocorrer alguns erros intencionais para simular o comportamento humano.</p>
                </div>

                <div class="time-settings">
                    <h3><i class="fas fa-clock"></i> Configurações de Tempo de Estudo</h3>
                    <div class="time-inputs">
                        <div class="input-group">
                            <label for="modalMinTimeInput">Tempo Mínimo (minutos)</label>
                            <input type="number" id="modalMinTimeInput" value="1" min="0" max="60">
                        </div>
                        <div class="input-group">
                            <label for="modalMaxTimeInput">Tempo Máximo (minutos)</label>
                            <input type="number" id="modalMaxTimeInput" value="3" min="1" max="60">
                        </div>
                    </div>
                </div>

                 <div class="ad-slot-modal-footer">
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-format="fluid"
                         data-ad-layout-key="-ef+6k-30-ac+ty"
                         data-ad-client="ca-pub-7541876262806139"
                         data-ad-slot="8995681163"></ins>
                </div>

                <div class="modal-actions">
                     <button class="btn btn-primary" id="startSelectedTasksBtn">
                        <i class="fas fa-play"></i> Fazer Lições Selecionadas
                    </button>
                    <button class="btn btn-secondary" id="startSelectedTasksDraftBtn">
                        <i class="fas fa-edit"></i> Salvar como Rascunho
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <div id="examTokenModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Iniciar Prova</h2>
                <button class="close" id="closeExamTokenModal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 2rem;">
                 <p id="examTokenModalText" style="color: var(--text-secondary); margin-bottom: 1.5rem;">A prova <strong>(Nome da Prova)</strong> requer um código (token) para iniciar ou continuar. Por favor, insira o código fornecido.</p>
                <div class="input-group">
                    <label for="examTokenInput">Código da Prova:</label>
                    <input type="text" id="examTokenInput" placeholder="Insira o código aqui" class="input-group input">
                </div>
                <div class="modal-actions" style="border-top: none; padding-top: 2rem;">
                    <button class="btn btn-primary" id="submitExamTokenBtn">
                        <i class="fas fa-play"></i> Iniciar e Fazer Prova
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div id="notification-container" class="notification-container"></div>

    <script>
        // Configuration
        const config = {
            API_BASE_URL: 'https://edusp.crimsonstrauss.xyz',
            USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            CATALYST_API_URL: 'https://catalyst.crimsonstrauss.xyz/complete'
        };

        // Global variables
        let currentFetchedTasks = [];
        let currentTaskFilterType = '';
        let trava = false;
        let taskToStart = null;
        let isDraftAfterStart = false;

        // DOM Elements
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const btnPending = document.getElementById('btnPending');
        const btnExpired = document.getElementById('btnExpired');
        const btnPendingExams = document.getElementById('btnPendingExams');
        const passwordToggle = document.querySelector('.password-toggle');
        const notificationContainer = document.getElementById('notification-container');
        const btnShowAccounts = document.getElementById('btnShowAccounts');
        
        // Modals
        const accountsModal = document.getElementById('accountsModal');
        const closeAccountsModal = document.getElementById('closeAccountsModal');
        const taskSelectionModal = document.getElementById('taskSelectionModal');
        const closeTaskModal = document.getElementById('closeTaskModal');
        const taskSelectionModalTitle = document.getElementById('taskSelectionModalTitle');
        const taskListContainer = document.getElementById('taskListContainer');
        const selectAllTasksCheckbox = document.getElementById('selectAllTasksCheckbox');
        const startSelectedTasksBtn = document.getElementById('startSelectedTasksBtn');
        const startSelectedTasksDraftBtn = document.getElementById('startSelectedTasksDraftBtn');
        const modalMinTimeInput = document.getElementById('modalMinTimeInput');
        const modalMaxTimeInput = document.getElementById('modalMaxTimeInput');
        const examTokenModal = document.getElementById('examTokenModal');
        const closeExamTokenModal = document.getElementById('closeExamTokenModal');
        const submitExamTokenBtn = document.getElementById('submitExamTokenBtn');
        const examTokenInput = document.getElementById('examTokenInput');
        const examTokenModalText = document.getElementById('examTokenModalText');

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            initializeEventListeners();
            log('Sistema inicializado');
            console.warn('AVISO: As senhas são salvas localmente no seu navegador. Evite usar em computadores compartilhados.');
            loadAdsConditionally();
        });

        function initializeEventListeners() {
            passwordToggle.addEventListener('click', togglePassword);
            btnPending.addEventListener('click', () => handleTaskSearch('pending'));
            btnExpired.addEventListener('click', () => handleTaskSearch('expired'));
            btnPendingExams.addEventListener('click', () => handleTaskSearch('pending_exams'));
            
            btnShowAccounts.addEventListener('click', openAccountsModal);
            closeAccountsModal.addEventListener('click', () => accountsModal.style.display = 'none');
            accountsModal.addEventListener('click', (e) => { if (e.target === accountsModal) accountsModal.style.display = 'none'; });

            closeTaskModal.addEventListener('click', closeTaskSelectionModal);
            taskSelectionModal.addEventListener('click', (e) => { 
                if (e.target === taskSelectionModal) closeTaskSelectionModal(); 
            });
            
            selectAllTasksCheckbox.addEventListener('change', toggleSelectAllTasks);
            startSelectedTasksBtn.addEventListener('click', () => handleStartSelectedTasks(false));
            startSelectedTasksDraftBtn.addEventListener('click', () => handleStartSelectedTasks(true));

            closeExamTokenModal.addEventListener('click', () => examTokenModal.classList.remove('show'));
            examTokenModal.addEventListener('click', (e) => { if (e.target === examTokenModal) examTokenModal.classList.remove('show'); });
            submitExamTokenBtn.addEventListener('click', handleExamTokenSubmit);

            document.getElementById('loginForm').addEventListener('submit', (e) => e.preventDefault());

            // Para o modal de tarefas, carregar ad quando mostrado
            taskSelectionModal.addEventListener('transitionend', function(e) {
                if (taskSelectionModal.classList.contains('show')) {
                    loadModalAd();
                }
            });
        }

        // Função para carregar ads condicionalmente
        function loadAdsConditionally() {
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                const container = ad.parentElement;
                if (container.offsetWidth > 0 && container.offsetHeight > 0) {
                    const format = ad.dataset.adFormat;
                    if (format === 'fluid' || format === 'autorelaxed') {
                        if (container.offsetWidth >= 250) {
                            (window.adsbygoogle = window.adsbygoogle || []).push({});
                        }
                    } else {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                }
            });
        }

        // Função específica para ad no modal
        function loadModalAd() {
            const modalAd = document.querySelector('.ad-slot-modal-footer .adsbygoogle');
            if (modalAd) {
                const container = modalAd.parentElement;
                if (container.offsetWidth >= 250) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            }
        }

        // Utility & UI Functions
        function togglePassword() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = passwordToggle.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }

        function Atividade(title, message, type = 'info') {
            showNotification(title, message, type);
            log(`${title}: ${message}`);
        }

        function showNotification(title, message, type = 'info') {
            const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-times-circle' };
            const iconClass = icons[type] || 'fa-info-circle';

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `<i class="fas ${iconClass}"></i><div class="notification-content"><strong>${title}</strong><br>${message}</div>`;
            
            notificationContainer.appendChild(notification);
            
            setTimeout(() => notification.classList.add('show'), 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                notification.addEventListener('transitionend', () => notification.remove(), { once: true });
            }, 900);
        }

        function generateRandomHex(length) {
            let result = '';
            const characters = '0123456789abcdef';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        // Saved Accounts Functions
        function getSavedAccounts() { return JSON.parse(localStorage.getItem('eclipse_lunar_accounts')) || {}; }
        function saveAccount(ra, password, token, nick) {
            const accounts = getSavedAccounts();
            accounts[ra] = { password, token, nick, savedAt: new Date().toISOString() };
            localStorage.setItem('eclipse_lunar_accounts', JSON.stringify(accounts));
        }
        function deleteAccount(ra) {
            const accounts = getSavedAccounts();
            delete accounts[ra];
            localStorage.setItem('eclipse_lunar_accounts', JSON.stringify(accounts));
        }
        function openAccountsModal() {
            const accounts = getSavedAccounts();
            const container = document.getElementById('accountListContainer');
            container.innerHTML = ''; 

            if (Object.keys(accounts).length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhuma conta salva.</p>';
            } else {
                for (const ra in accounts) {
                    const item = document.createElement('div');
                    item.className = 'account-list-item';
                    item.innerHTML = `
                        <span class="account-list-item-user">${ra}</span>
                        <div class="account-list-item-actions">
                            <button class="btn-account-action btn-use" data-ra="${ra}">Usar</button>
                            <button class="btn-account-action btn-delete" data-ra="${ra}">Excluir</button>
                        </div>`;
                    container.appendChild(item);
                }
            }
            accountsModal.style.display = 'flex';

            container.querySelectorAll('.btn-use').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ra = e.target.dataset.ra;
                    const account = accounts[ra];
                    if (account) {
                        usernameInput.value = ra;
                        passwordInput.value = account.password;
                        accountsModal.style.display = 'none';
                        showNotification('Conta Carregada', `Dados de ${ra} preenchidos.`, 'success');
                    }
                });
            });
            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ra = e.target.dataset.ra;
                    deleteAccount(ra);
                    showNotification('Conta Removida', `A conta ${ra} foi excluída.`, 'info');
                    openAccountsModal();
                });
            });
        }

        // Modal Functions
        function closeTaskSelectionModal() {
            taskSelectionModal.classList.remove('show');
            currentFetchedTasks = [];
        }

        function toggleSelectAllTasks() {
            const checkboxes = taskListContainer.querySelectorAll('.activity-item input[type="checkbox"]:not(:disabled)');
            checkboxes.forEach(checkbox => checkbox.checked = selectAllTasksCheckbox.checked);
            updateSelectAllCheckboxState();
        }

        // Task Handling Functions
        async function handleTaskSearch(taskFilter) {
            if (trava || btnPending.disabled) {
                showNotification('Aguarde', 'Operação em andamento ou em resfriamento.', 'info');
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (!username) {
                showNotification('Erro', 'Por favor, preencha o campo de usuário.', 'error');
                return;
            }

            trava = true;
            currentTaskFilterType = taskFilter;
            btnPending.disabled = true;
            btnExpired.disabled = true;
            btnPendingExams.disabled = true;

            try {
                const accounts = getSavedAccounts();
                const savedAccount = accounts[username];
                let tokenToUse = savedAccount ? savedAccount.token : null;
                let reAuthAttempted = false;

                if (tokenToUse) {
                    Atividade('Autenticação', 'Verificando token salvo...');
                    try {
                        await fetchUserRooms(tokenToUse, taskFilter, savedAccount.nick);
                    } catch (error) {
                        if (error.message.includes('401')) {
                            Atividade('Token Inválido', 'Tentando reautenticar com a senha salva...', 'info');
                            if (savedAccount.password) {
                                await loginAndFetchTasks(taskFilter, username, savedAccount.password);
                                reAuthAttempted = true;
                            } else if (password) {
                                await loginAndFetchTasks(taskFilter, username, password);
                                reAuthAttempted = true;
                            } else {
                                showNotification('Sessão Expirada', 'Por favor, insira sua senha para continuar.', 'error');
                            }
                        } else { throw error; }
                    }
                }
                
                if (!tokenToUse && !reAuthAttempted) {
                     if (!password) {
                        showNotification('Senha Necessária', 'Por favor, insira sua senha.', 'error');
                    } else {
                        await loginAndFetchTasks(taskFilter, username, password);
                    }
                }
            } catch (error) {
                console.error('Erro no fluxo de busca de tarefas:', error);
            } finally {
                trava = false; // Finaliza o bloqueio da operação
                // Inicia o resfriamento para reativar os botões
                setTimeout(() => {
                    btnPending.disabled = false;
                    btnExpired.disabled = false;
                    btnPendingExams.disabled = false;
                }, 2500); // 2.5 segundos de resfriamento
            }
        }

        async function handleStartSelectedTasks(isDraft) {
            const selectedTasksData = getSelectedTasksWithScores();
            if (selectedTasksData.tasks.length === 0) {
                showNotification('Atenção', 'Nenhuma tarefa selecionada.', 'info');
                return;
            }

            const isHandlingExams = currentTaskFilterType === 'pending_exams';

            // Separar tarefas normais de provas
            const regularTasks = isHandlingExams ? [] : selectedTasksData.tasks;
            const examTasks = isHandlingExams ? selectedTasksData.tasks : [];

            // Processar tarefas normais imediatamente
            if (regularTasks.length > 0) {
                await sendTasksToCatalyst(regularTasks, isDraft, selectedTasksData.minTime, selectedTasksData.maxTime);
                closeTaskSelectionModal(); // Fecha o modal se SÓ havia tarefas normais
            }

            // Lidar com provas (sempre requer token)
            if (examTasks.length > 0) {
                if (examTasks.length > 1) {
                    showNotification('Atenção', 'Por favor, selecione apenas uma prova de cada vez.', 'info');
                    return;
                }
                // Prepara para abrir o modal do token
                taskToStart = examTasks[0];
                isDraftAfterStart = isDraft;
                examTokenModalText.querySelector('strong').textContent = taskToStart.title;
                examTokenInput.value = '';
                examTokenModal.classList.add('show');
            }
        }
        
        async function handleExamTokenSubmit() {
            const tokenCode = examTokenInput.value.trim();
            if (!tokenCode) {
                showNotification('Erro', 'Por favor, insira o código da prova.', 'error');
                return;
            }
            if (!taskToStart) {
                showNotification('Erro', 'Nenhuma prova selecionada para iniciar.', 'error');
                return;
            }

            submitExamTokenBtn.disabled = true;

            try {
                // Monta a URL base para a chamada /apply - ORDEM CORRETA DOS PARÂMETROS
                let applyUrl = `${config.API_BASE_URL}/tms/task/${taskToStart.id}/apply?preview_mode=false`;
                
                // Se for um rascunho (já tem answer_id), adiciona os parâmetros necessários
                if (taskToStart.answer_id) {
                    applyUrl += `&answer_id=${taskToStart.answer_id}`;
                    applyUrl += `&answer_fields=id`;
                    applyUrl += `&answer_fields=nick`;
                    applyUrl += `&answer_fields=status`;
                    applyUrl += `&answer_fields=task_id`;
                    applyUrl += `&answer_fields=answers`;
                    applyUrl += `&answer_fields=duration`;
                    Atividade('Continuando Prova', 'Enviando código de acesso...');
                } else {
                    Atividade('Iniciando Prova', 'Enviando código de acesso...');
                }

                // Adiciona os parâmetros finais (ORDEM IMPORTANTE)
                applyUrl += `&token_code=${tokenCode}`;
                applyUrl += `&room_name=${taskToStart.room}`;

                const traceId = generateRandomHex(32);
                const parentId = generateRandomHex(16);
                
                // HEADERS COMPLETOS E CORRETOS (incluindo If-None-Match)
                const newHeaders = {
                    'accept': 'application/json',
                    'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'content-type': 'application/json',
                    'if-none-match': 'W/"14e17-EUjvIc3BT8dKDKC1KGHHRDQN8rE"', // HEADER IMPORTANTE QUE ESTAVA FALTANDO
                    'origin': 'https://saladofuturo.educacao.sp.gov.br',
                    'priority': 'u=1, i',
                    'referer': 'https://saladofuturo.educacao.sp.gov.br/',
                    'request-id': `|${traceId}.${parentId}`,
                    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'traceparent': `00-${traceId}-${parentId}-01`,
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
                    'x-api-key': taskToStart.token,
                    'x-api-platform': 'webclient',
                    'x-api-realm': 'edusp'
                };

                console.log('URL sendo chamada:', applyUrl);
                console.log('Headers:', newHeaders);

                const applyResponse = await makeRequest(applyUrl, 'GET', newHeaders, {});

                Atividade('Sucesso', 'Prova autenticada! Enviando para conclusão.', 'success');
                examTokenModal.classList.remove('show');
                closeTaskSelectionModal();

                // Combina os dados da tarefa original com a resposta do /apply
                const updatedTask = {
                    ...taskToStart,
                    ...applyResponse,
                };
                
                const minTime = parseInt(modalMinTimeInput.value) || 1;
                const maxTime = parseInt(modalMaxTimeInput.value) || 3;

                // Envia a tarefa (agora iniciada/continuada) para a API de conclusão
                await sendTasksToCatalyst([updatedTask], isDraftAfterStart, minTime, maxTime);

            } catch (error) {
                Atividade('Erro ao Iniciar', 'Código inválido ou falha na comunicação.', 'error');
                console.error('Erro ao autenticar prova via /apply:', error);
                console.error('URL da requisição:', applyUrl);
            } finally {
                submitExamTokenBtn.disabled = false;
                taskToStart = null;
                isDraftAfterStart = false;
            }
        }

        function getSelectedTasksWithScores() {
             const selectedItems = [];
             taskListContainer.querySelectorAll('.activity-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox.checked) {
                    const taskId = parseInt(checkbox.value);
                    const originalTask = currentFetchedTasks.find(t => t.id === taskId);
                    if (originalTask) {
                        const scoreSelect = item.querySelector('.activity-score-selector');
                        selectedItems.push({
                            ...originalTask,
                            score: parseInt(scoreSelect.value)
                        });
                    }
                }
             });

            return {
                tasks: selectedItems,
                minTime: parseInt(modalMinTimeInput.value) || 1,
                maxTime: parseInt(modalMaxTimeInput.value) || 3
            };
        }

        // API Functions
        async function loginAndFetchTasks(taskFilter, ra, senha) {
            const loginData = { realm: "edusp", platform: "webclient", id: ra, password: senha };
            const headers = {
                'Accept': 'application/json', 'x-api-realm': 'edusp', 'x-api-platform': 'webclient',
                'User-Agent': config.USER_AGENT, 'Content-Type': 'application/json', 'Referer': 'https://crimsonstrauss.xyz/',
                'Origin': 'https://crimsonstrauss.xyz', 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty', 'Priority': 'u=0'
            };

            try {
                Atividade('Autenticação', 'Realizando login...');
                const data = await makeRequest(`${config.API_BASE_URL}/registration/edusp`, 'POST', headers, loginData);
                saveAccount(ra, senha, data.auth_token, data.nick);
                await fetchUserRooms(data.auth_token, taskFilter, data.nick);
            } catch (error) {
                Atividade('Erro de Login', 'Credenciais inválidas. Verifique seu usuário e senha.', 'error');
                throw error;
            }
        }

        async function fetchUserRooms(token, taskFilter, userNick) {
            try {
                Atividade('Processamento', 'Buscando lições...');
                const data = await makeRequest(
                    `${config.API_BASE_URL}/room/user?list_all=true&with_cards=true`,
                    'GET', { ...getDefaultHeaders(), 'x-api-key': token }
                );

                if (data.rooms && data.rooms.length > 0) {
                    let uniqueTargets = new Set();
                    let roomIdToNameMap = new Map();
                    let firstRoomName = data.rooms[0].name;

                    data.rooms.forEach(room => {
                        uniqueTargets.add(room.name);
                        roomIdToNameMap.set(room.id.toString(), room.name);

                        if (userNick) {
                            uniqueTargets.add(`${room.name}:${userNick}`);
                        }
                    });

                    const roomUserJsonString = JSON.stringify(data);
                    const idMatches = roomUserJsonString.match(/"id"\s*:\s*(\d+)(?!\d)/g) || [];
                    idMatches.forEach(m => {
                        const id = m.match(/\d+/)[0];
                        if (id && !roomIdToNameMap.has(id) && !uniqueTargets.has(id)) {
                            uniqueTargets.add(id);
                        }
                    });

                    const targetsArray = Array.from(uniqueTargets);

                    let allFetchedTasks = await fetchTasks(token, targetsArray, taskFilter);

                    allFetchedTasks.forEach(task => {
                        if (isSpecialTaskByTitle(task) && task.answer_status === null) {
                            task.answer_status = 'pending';
                        }
                    });


                    if (allFetchedTasks.length > 0) {
                        currentFetchedTasks = allFetchedTasks.map(task => {
                            let effectiveRoomForExecution = null;

                            if (task.room_info && task.room_info.name) {
                                effectiveRoomForExecution = task.room_info.name;
                            } else {
                                const pubTarget = task.publication_target;
                                if (roomIdToNameMap.has(pubTarget)) {
                                    effectiveRoomForExecution = roomIdToNameMap.get(pubTarget);
                                } else if (typeof pubTarget === 'string' && pubTarget.includes(':')) {
                                    effectiveRoomForExecution = pubTarget.split(':')[0];
                                } else if (typeof pubTarget === 'string' && pubTarget.startsWith('r')) {
                                    effectiveRoomForExecution = pubTarget;
                                }
                            }

                            if (!effectiveRoomForExecution || !effectiveRoomForExecution.startsWith('r')) {
                                effectiveRoomForExecution = firstRoomName;
                            }

                            return { ...task,
                                token,
                                room: effectiveRoomForExecution,
                                type: taskFilter
                            };
                        });
                        displayTasksInSelectionModal(currentFetchedTasks, taskFilter);
                        Atividade('Processamento', `Identificadas ${currentFetchedTasks.length} lições para seleção.`);
                    } else {
                        Atividade('Info', 'Nenhuma lição encontrada para o filtro selecionado.');
                        showNotification('Nenhuma Tarefa', 'Não foram encontradas lições para o filtro selecionado.', 'info');
                    }

                } else {
                    Atividade('Info', 'Nenhuma sala encontrada.');
                    showNotification('Nenhuma Sala', 'Nenhuma sala encontrada para o usuário.', 'info');
                }
            } catch (error) {
                Atividade('Erro', 'Erro ao buscar salas do usuário.');
                showNotification('Erro', 'Erro ao buscar salas do usuário.', 'error');
                throw error;
            } finally {
                // O trava é gerenciado pela função que chamou esta
            }
        }

        async function fetchTasks(token, targetPublications, taskFilter = 'all') {
            const params = {
                limit: 100,
                offset: 0,
                with_answer: true,
                with_apply_moment: true,
            };

            // Definindo os parâmetros com base no filtro
            if (taskFilter === 'expired') {
                params.expired_only = true;
                params.filter_expired = false;
                params.is_exam = false;
                params.is_essay = false;
            } else if (taskFilter === 'pending_exams') {
                params.expired_only = false;
                params.filter_expired = true;
                params.is_exam = true;
                params.with_answer = true;
            } else { // 'pending' (padrão)
                params.expired_only = false;
                params.filter_expired = true;
                params.is_exam = false;
                params.is_essay = false;
            }

            const statusParams =
                `answer_statuses=${encodeURIComponent('pending')}&answer_statuses=${encodeURIComponent('draft')}`;

            const targetParams = targetPublications.map(target => {
                return `publication_target=${encodeURIComponent(target)}`;
            }).join('&');

            const url =
                `${config.API_BASE_URL}/tms/task/todo?${Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&')}&${targetParams}&${statusParams}`;

            const headers = { ...getDefaultHeaders(),
                'x-api-key': token
            };
            try {
                const data = await makeRequest(url, 'GET', headers);

                let filteredData = data;
                if (taskFilter === 'expired') {
                    filteredData = filteredData.filter(task => !isRedacao(task));
                }

                let tasksFound = filteredData.map(task => ({ ...task,
                    token,
                    room: task.publication_target,
                    type: taskFilter
                }));

                return tasksFound;

            } catch (error) {
                return [];
            }
        }

        function displayTasksInSelectionModal(tasks, filterType) {
            taskListContainer.innerHTML = '';
            updateSelectAllCheckboxState();

            if (tasks.length === 0) {
                taskListContainer.innerHTML = '<p style="text-align: center; color: var(--eclipse-text-secondary); padding: 20px;">Nenhuma tarefa encontrada.</p>';
                [startSelectedTasksBtn, selectAllTasksCheckbox, startSelectedTasksDraftBtn].forEach(el => el.disabled = true);
            } else {
                tasks.forEach(task => {
                    const isDisabled = isRedacao(task) && filterType === 'expired';
                    
                    let statusText = '';
                    if (filterType === 'pending' || filterType === 'pending_exams') {
                         if (task.answer_id) { // Se tem answer_id, é um rascunho ou foi iniciada
                            statusText = '(Rascunho / Iniciada)';
                        } else { // Se não, está pendente e nunca foi aberta
                            statusText = '(Não Iniciada)';
                        }
                    }

                    const listItem = document.createElement('div');
                    listItem.className = `activity-item ${isRedacao(task) ? 'redacao' : ''}`;
                    listItem.innerHTML = `
                        <div class="activity-item-top">
                            <input type="checkbox" value="${task.id}" id="activity-${task.id}" ${isDisabled ? 'disabled' : ''}>
                            <label for="activity-${task.id}">${task.title}
                                <span style="color: var(--eclipse-text-secondary); font-size: 0.85em; margin-left: 5px;">${statusText}</span>
                                ${isDisabled ? `<span style="color: var(--eclipse-warning); font-size: 0.85em; margin-left: 5px;">(Redação - Ignorada)</span>` : ''}
                            </label>
                        </div>
                        <select class="activity-score-selector" onclick="event.stopPropagation()">
                            <option value="100">100%</option>
                            <option value="90">90%</option>
                            <option value="80">80%</option>
                            <option value="70">70%</option>
                            <option value="60">60%</option>
                            <option value="50">50%</option>
                        </select>
                    `;
                    taskListContainer.appendChild(listItem);
                    
                    const checkbox = listItem.querySelector('input[type="checkbox"]');

                    listItem.addEventListener('click', (e) => {
                        if (e.target !== checkbox && !checkbox.disabled) {
                             checkbox.checked = !checkbox.checked;
                             updateSelectAllCheckboxState();
                        }
                    });
                    checkbox.addEventListener('change', updateSelectAllCheckboxState);
                });
                [startSelectedTasksBtn, selectAllTasksCheckbox, startSelectedTasksDraftBtn].forEach(el => el.disabled = false);
            }

            let title;
            switch(filterType) {
                case 'pending':
                    title = 'Lições Pendentes';
                    break;
                case 'expired':
                    title = 'Lições Expiradas';
                    break;
                case 'pending_exams':
                    title = 'Provas Pendentes';
                    break;
                default:
                    title = 'Selecionar Atividades';
            }
            taskSelectionModalTitle.textContent = title;
            taskSelectionModal.classList.add('show');
        }
        
        function updateSelectAllCheckboxState() {
             const checkboxes = taskListContainer.querySelectorAll('.activity-item input[type="checkbox"]:not(:disabled)');
             if (checkboxes.length === 0) {
                 selectAllTasksCheckbox.checked = false;
                 selectAllTasksCheckbox.indeterminate = false;
                 return;
             }
             const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
             selectAllTasksCheckbox.checked = checkedCount === checkboxes.length;
             selectAllTasksCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }

        function isSpecialTaskByTitle(task) {
            // Placeholder function as the original was not provided.
            return false;
        }

        function getDefaultHeaders() {
            return {
                'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-realm': 'edusp',
                'x-api-platform': 'webclient', 'User-Agent': config.USER_AGENT, 'Connection': 'keep-alive',
                'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Dest': 'empty'
            };
        }

        async function makeRequest(url, method = 'GET', headers = {}, body = null) {
            const options = { method, headers: { ...headers }};
            if (body !== null && body !== undefined) {
                 if(Object.keys(body).length > 0) {
                    options.body = JSON.stringify(body);
                 }
            }
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status} em ${method} ${url}: ${errorText}`);
            }
             try {
                return await response.json();
            } catch (e) {
                return {}; // Retorna objeto vazio se não houver corpo ou se não for JSON
            }
        }

        function isRedacao(task) {
            return task.tags.some(t => t.toLowerCase().includes('redacao')) || task.title.toLowerCase().includes('redação');
        }
        
        async function processSingleTask(task, isDraft, minTime, maxTime) {
            try {
                const isProva = currentTaskFilterType === 'pending_exams';
                const action = isProva ? 'Processando Prova' : 'Processando Tarefa';
                Atividade(action, `Enviando para resolver: ${task.title.substring(0, 25)}...`, 'info');
                
                const finalTaskPayload = { 
                    ...task,
                    score: task.score,
                    is_prova: isProva,
                    task_id: task.id 
                };

                delete finalTaskPayload.id;

                const catalystPayload = {
                    tasks: [finalTaskPayload],
                    auth_token: task.token,
                    room_name_for_apply: task.room,
                    time_min: minTime,
                    time_max: maxTime,
                    is_draft: isDraft,
                    salvar_rascunho: isDraft
                };
                
                await makeRequest(config.CATALYST_API_URL, 'POST', {'Content-Type': 'application/json'}, catalystPayload);

                return { success: true, title: task.title };

            } catch (error) {
                console.error(`Erro ao processar a tarefa ${task.title}:`, error);
                console.error('Detalhes do erro:', error.message);
                return { success: false, title: task.title, error: error.message };
            }
        }

        async function sendTasksToCatalyst(tasks, isDraft, minTime, maxTime) {
            const tasksToProcess = tasks.filter(task => !(currentTaskFilterType === 'expired' && isRedacao(task)));
            if (tasksToProcess.length === 0) {
                if(currentTaskFilterType !== 'pending_exams') { // Não mostrar para provas, pois o fluxo é diferente
                    showNotification('Atenção', 'Nenhuma lição válida para enviar.', 'info');
                }
                return;
            }

            Atividade('Enviando Tarefas', `Enviando ${tasksToProcess.length} tarefas para processamento...`, 'info');
            
            let successCount = 0;
            let errorCount = 0;

            for (const task of tasksToProcess) {
                const result = await processSingleTask(task, isDraft, minTime, maxTime);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                    Atividade('Erro no Envio', `Falha ao processar '${result.title.substring(0, 20)}...'.`, 'error');
                }
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay de 500ms entre as requisições
            }

            if(successCount > 0) {
                Atividade('Sucesso', `${successCount} de ${tasksToProcess.length} tarefas processadas com sucesso.`, 'success');
            }
            if(errorCount > 0) {
                Atividade('Falhas', `${errorCount} tarefas falharam. Verifique o console para detalhes.`, 'error');
            }
        }

        function log(str) {
            console.log(`★ ✦ Eclipse Lunar: ${str} ✦ ★`);
        }
    </script>



<script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"version":"2024.11.0","token":"1c7b17d88697456ea7c4b635bb4fd529","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>
</body>
</html>
