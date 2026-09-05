// Migrated from commands/aiart.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getLang } = require('../lib/lang');

// API Configuration
const FIREBASE_API_KEY = "AIzaSyB3-71wG0fIt0shj0ee4fvx1shcjJHGrrQ";
const PACKAGE_NAME = "ai.generated.art.maker.image.picture.photo.generator.painting";
const SHA1_CERT = "ADC09FCA89A2CE4D0D139031A2A587FA87EE4155";

const BASE_URL = "https://img-gen-prod.ai-arta.com/api/v1";

// Token storage
let AUTH_TOKEN = null;
let REFRESH_TOKEN = null;
let TOKEN_EXPIRY = 0;

// Available styles
const AI_STYLES = ["Photographic", "Fantasy Art", "Cinematic Art", "Anime", "Watercolor", "Graffiti", "Cyberpunk", "Realistic"];

// Firebase Authentication
async function getAndroidHeaders() {
    return {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 13)',
        'X-Android-Package': PACKAGE_NAME,
        'X-Android-Cert': SHA1_CERT,
        'Content-Type': 'application/json'
    };
}

async function createAnonymousAccount() {
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
        const payload = { returnSecureToken: true };
        const headers = await getAndroidHeaders();

        console.log('[*] Creating Firebase account...');
        const response = await axios.post(url, payload, { headers, timeout: 10000 });

        if (response.status === 200) {
            const data = response.data;
            AUTH_TOKEN = data.idToken;
            REFRESH_TOKEN = data.refreshToken;
            TOKEN_EXPIRY = Date.now() + (parseInt(data.expiresIn) * 1000);

            console.log('[+] Account created successfully');
            return AUTH_TOKEN;
        }
    } catch (error) {
        console.error('[-] Firebase auth failed:', error.message);
    }
    return null;
}

async function getValidToken() {
    if (AUTH_TOKEN && Date.now() < TOKEN_EXPIRY) {
        return AUTH_TOKEN;
    }
    return await createAnonymousAccount();
}

async function getAuthHeaders() {
    const token = await getValidToken();
    if (!token) throw new Error('Authentication failed');

    return {
        "User-Agent": "AiArt/3.26.9 okHttp/4.12.0 Android",
        "Authorization": token,
        "Accept-Encoding": "gzip"
    };
}

// AI Image Generation
async function generateImageFromText(prompt, style = "Photographic") {
    try {
        const headers = await getAuthHeaders();
        
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('style', style);
        formData.append('images_num', '1');
        formData.append('aspect_ratio', '1:1');
        formData.append('cfg_scale', '7');
        formData.append('steps', '20');

        console.log(`[*] Generating image: ${prompt}`);
        
        const response = await axios.post(`${BASE_URL}/text2image`, formData, {
            headers: {
                ...headers,
                'Content-Type': 'multipart/form-data'
            },
            timeout: 60000
        });

        if (response.status === 200) {
            const data = response.data;
            const recordId = data.record_id;
            
            if (recordId) {
                // Poll for result
                return await pollGenerationResult(recordId);
            }
        }
        
        throw new Error('No record ID in response');
    } catch (error) {
        throw new Error(`Generation failed: ${error.message}`);
    }
}

async function pollGenerationResult(recordId, maxAttempts = 30) {
    const headers = await getAuthHeaders();
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            
            const response = await axios.get(`${BASE_URL}/text2image/${recordId}/status`, {
                headers,
                timeout: 30000
            });

            if (response.status === 200) {
                const data = response.data;
                
                if (data.status === 'DONE' && data.response && data.response.length > 0) {
                    const imageUrl = data.response[0].url;
                    if (imageUrl) {
                        // Download the generated image
                        const imageResponse = await axios.get(imageUrl, {
                            responseType: 'arraybuffer',
                            timeout: 30000
                        });
                        
                        return Buffer.from(imageResponse.data);
                    }
                } else if (data.status === 'FAILED') {
                    throw new Error('Generation failed on server');
                }
            }
        } catch (error) {
            console.log(`Poll attempt ${i + 1} failed:`, error.message);
        }
    }
    
    throw new Error('Generation timeout');
}

// Main Command Handler
async function aiartCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const args = text.split(' ').slice(1);
        
        if (args.length === 0) {
            return await showHelp(sock, chatId, message);
        }

        const prompt = args.join(' ');
        
        const processingMsg = await sock.sendMessage(chatId, {
            text: getLang(sock).aiart_generating.replace('{prompt}', prompt)
        });

        try {
            const imageBuffer = await generateImageFromText(prompt);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: getLang(sock).aiart_caption.replace('{prompt}', prompt)
            });

            // Success reaction
            await sock.sendMessage(chatId, {
                react: { text: "🎨", key: message.key }
            });

        } catch (error) {
            await sock.sendMessage(chatId, {
                edit: processingMsg.key,
                text: getLang(sock).aiart_failed + '\n\nError: ' + error.message
            });
        }
        
    } catch (error) {
        console.error('Error in aiart command:', error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).aiart_failed
        });
    }
}

async function showHelp(sock, chatId, message) {
    const helpText = getLang(sock).aiart_no_prompt;

    await sock.sendMessage(chatId, { text: helpText });
}



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['aiart'],
  description: 'Generate AI art',
  category: 'ai',
}, async (sock, chatId, message) => {
  await aiartCommand(sock, chatId, message);
});