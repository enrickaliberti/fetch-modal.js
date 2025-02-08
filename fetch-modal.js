class TemplateEngine {
    static render(template, data) {
        // 1. Gestione dei blocchi IF
        template = template.replace(/\{if (.*?)\}([\s\S]*?)\{\/if\}/g, (match, condition, content) => {
            try {
                return new Function("data", `with(data) { return ${condition} ? \`${content}\` : ''; }`)(data);
            } catch (error) {
                console.error("Errore in IF:", error);
                return "";
            }
        });

        // 2. Gestione dei blocchi FOREACH
        template = template.replace(/\{foreach (\w+) as (\w+)\}([\s\S]*?)\{\/foreach\}/g, (match, array, item, content) => {
            try {
                if (!data[array] || !Array.isArray(data[array])) return "";

                return data[array].reduce((acc, currentItem) => {
                    let localData = { ...data, [item]: currentItem };
                    return acc + TemplateEngine.render(content, localData);
                }, "");
            } catch (error) {
                console.error("Errore in FOREACH:", error);
                return "";
            }
        });

        // 3. Sostituzione delle variabili ed esecuzione del codice
        template = template.replace(/\{(.*?)\}/g, (match, code) => {
            try {
                if (code in data) return data[code];
                return new Function("data", `with(data) { return ${code}; }`)(data);
            } catch (error) {
                console.error("Errore nel template:", error);
                return "";
            }
        });

        return template;
    }
}
class FetchModal {
    constructor() {
        this.injectStyles();
        this.modal = this.createModal();
        this.cache = new Map();
        this.history = [];
        document.body.appendChild(this.modal);
        this.addEventListeners();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .fetch-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                z-index: 9000;
            }
            .fetch-modal.open {
                opacity: 1;
                visibility: visible;
            }
            .fetch-modal-dialog {
                background: white;
                width: 90%;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                position: relative;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            .fetch-modal.open .fetch-modal-dialog {
                transform: translateY(0);
            }
            .fetch-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f5f5f5;
            }
            .fetch-modal-close {
                border: none;
                background: none;
                font-size: 24px;
                cursor: pointer;
                margin-left: auto;
            }
            .fetch-modal-prev {
                border: none;
                background: none;
                font-size: 24px;
                cursor: pointer;
            }
            .fetch-modal-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            .fetch-modal-loading {
                text-align: center;
                padding: 20px;
                font-size: 18px;
            }
            .fetch-modal-prev.hidden {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.classList.add('fetch-modal');
        modal.innerHTML = `
            <div class="fetch-modal-overlay"></div>
            <div class="fetch-modal-dialog">
                <div class="fetch-modal-header">
                    <button class="fetch-modal-prev hidden">&#8592;</button>
                    <button class="fetch-modal-close">&times;</button>
                </div>
                <div class="fetch-modal-body">Caricamento...</div>
            </div>
        `;
        return modal;
    }

    addEventListeners() {
        document.body.addEventListener('click', (e) => {
            if (e.target.matches('[data-fetch-modal]')) {
                e.preventDefault();
                const url = e.target.getAttribute('href');
                const targetId = e.target.getAttribute('data-target');
                if (url) {
                    this.loadContent(url, targetId);
                } else {
                    this.loadFromPage(targetId);
                }
            }
        });

        this.modal.querySelector('.fetch-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.fetch-modal-prev').addEventListener('click', () => this.goBack());
        this.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('fetch-modal-overlay')) {
                this.close();
            }
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
        window.addEventListener('popstate', () => {
            this.goBack();
        });
    }

    async loadContent(url, targetId) {
        try {
            if (this.cache.has(url + targetId)) {
                this.displayContent(this.cache.get(url + targetId));
                return;
            }

            this.showLoading();
            const response = await fetch(url);
            const contentType = response.headers.get("content-type");
            const text = await response.text();

            let content = '';
            if (contentType && contentType.includes("application/json")) {
                const jsonData = JSON.parse(text);
                content = document.getElementById(targetId).innerHTML;
                content = TemplateEngine.render(content, jsonData);
                this.cache.set(url + targetId, content);
            } else {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;
                const contentElement = tempDiv.querySelector(`#${targetId}`);
                if (contentElement) {
                    content = TemplateEngine.render(contentElement.innerHTML, {});
                    this.cache.set(url + targetId, content);
                } else {
                    throw new Error('Elemento non trovato.');
                }
            }

            this.history.push({ url, targetId });
            history.pushState({}, "", "#modal");
            this.updateNavigationButtons();
            this.displayContent(content);
        } catch (error) {
            console.error('Errore nel caricamento:', error);
        }
    }

    displayContent(content) {
        this.modal.querySelector('.fetch-modal-body').innerHTML = content;
        this.executeScripts(this.modal.querySelector('.fetch-modal-body'));
        this.open();
    }

    executeScripts(container) {
        container.querySelectorAll('script').forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
                newScript.onload = () => console.log(`Caricato: ${script.src}`);
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript).parentNode.removeChild(newScript);
        });
    }

    showLoading() {
        this.modal.querySelector('.fetch-modal-body').innerHTML = '<div class="fetch-modal-loading">Caricamento...</div>';
    }

    open() {
        this.modal.classList.add('open');
        this.updateNavigationButtons();
    }

    close() {
        this.modal.classList.remove('open');
        this.modal.querySelector('.fetch-modal-body').innerHTML = '';
        this.history = [];
        this.updateNavigationButtons();
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            const prev = this.history[this.history.length - 1];
            this.loadContent(prev.url, prev.targetId);
        } else {
            this.close();
        }
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevButton = this.modal.querySelector('.fetch-modal-prev');
        prevButton.classList.toggle('hidden', this.history.length <= 1);
    }
}

document.addEventListener('DOMContentLoaded', () => new FetchModal());
