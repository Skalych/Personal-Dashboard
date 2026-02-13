/**
 * AIWidget.js - Gemini AI Companion
 */
// Widget and store are now global

import { Widget } from './Widget.js';
import { store } from '../store.js';

class AIWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.history = this.data.data.history || [];
    }

    getTitle() {
        return '🤖 AI Companion';
    }

    getContentHTML() {
        return `
            <div class="ai-chat-container">
                <div class="ai-messages">
                    ${this.history.map(msg => `
                        <div class="message ${msg.role}">
                            ${msg.text}
                        </div>
                    `).join('')}
                </div>
                <div class="ai-input-area">
                    <input type="text" placeholder="Ask me anything..." class="ai-input">
                    <button class="ai-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        const input = el.querySelector('.ai-input');
        const sendBtn = el.querySelector('.ai-send');
        const messagesContainer = el.querySelector('.ai-messages');

        // Hide Close Button for AI Widget (Permanent)
        const closeBtn = el.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // Add User Message
            this.appendMessage('user', text);
            input.value = '';

            // Get API Key
            const apiKey = store.getSettings().apiKey;
            if (!apiKey) {
                this.appendMessage('model', 'Please set your OpenRouter API Key in settings.');
                return;
            }

            try {
                // Show Typing Indicator (Temporary)
                const typingIndicator = this.showTypingIndicator();

                const response = await this.fetchOpenRouterResponse(text, apiKey);

                // Remove Typing Indicator
                if (typingIndicator) typingIndicator.remove();

                this.appendMessage('model', response);
            } catch (error) {
                // Remove Typing Indicator if error
                const indicators = messagesContainer.querySelectorAll('.typing-indicator-container');
                indicators.forEach(el => el.remove());

                console.error('OpenRouter API Error:', error);

                let errMsg = `Error: ${error.message}`;

                // Add hint for file protocol if applicable
                if (window.location.protocol === 'file:') {
                    errMsg += '\n(Note: Some browsers may block API calls from local files. If this persists, try running a local server.)';
                }

                this.appendMessage('model', errMsg);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Prevent drag on input
        input.addEventListener('mousedown', (e) => e.stopPropagation());

        return el;
    }

    appendMessage(role, text) {
        this.history.push({ role, text });
        // Save to store
        store.updateWidget(this.id, {
            data: { ...this.data.data, history: this.history }
        });

        // Re-render messages (simplified approach: just update DOM)
        const messagesContainer = this.element.querySelector('.ai-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = this.element.querySelector('.ai-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message model typing-indicator-container';
        msgDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }

    async fetchOpenRouterResponse(prompt, apiKey) {
        // Using OpenRouter API
        const url = 'https://openrouter.ai/api/v1/chat/completions';

        // Use the model specified by user or default to free one
        const model = 'google/gemma-3-12b-it:free';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href, // Optional, for including your app on openrouter.ai rankings.
                'X-Title': 'Personal Dashboard', // Optional. Shows in rankings on openrouter.ai.
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

export { AIWidget };
