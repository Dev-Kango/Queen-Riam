// Migrated from commands/weather.js

const axios = require('axios');
const { sendButtonMessage } = require('../lib/buttonHelper');
const { getLang } = require('../lib/lang');

function getWeatherEmoji(weather) {
    const map = {
        Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
        Mist: "🌫️", Smoke: "💨", Haze: "🌫️", Dust: "🌪️", Fog: "🌫️",
        Sand: "🏜️", Ash: "🌋", Squall: "💨", Tornado: "🌪️",
        Clear: "☀️", Clouds: "☁️"
    };
    return map[weather] || "🌍";
}
async function weatherCommand(sock, chatId, city, message) {
    try {
        const apiUrl   = `https://apis.davidcyriltech.my.id/weather?city=${encodeURIComponent(city)}`;
        const response = await axios.get(apiUrl);
        const w        = response.data;

        if (!w.success || !w.data) {
            return await sock.sendMessage(chatId, {
                text: getLang(sock).weather_not_found
            });
        }

        const d     = w.data;
        const emoji = getWeatherEmoji(d.weather);
        const text  =
            `🌍 *Weather for ${d.location}, ${d.country}*\n` +
            `${emoji} ${d.description}\n\n` +
            `${getLang(sock).weather_temp} *${d.temperature}* (feels like ${d.feels_like})\n` +
            `${getLang(sock).weather_humidity} ${d.humidity}\n` +
            `${getLang(sock).weather_wind} ${d.wind_speed}\n` +
            `${getLang(sock).weather_pressure} ${d.pressure}\n\n` +
            `📍 Coordinates: [${d.coordinates.latitude}, ${d.coordinates.longitude}]\n` +
            `🌐 Full forecast: https://wttr.in/${encodeURIComponent(city)}`;

        await sendButtonMessage(sock, chatId, {
            text,
            footer: 'Queen Riam 👑',
            buttons: [
                { id: `.weather ${city}`, text: getLang(sock).weather_refresh_btn },
            ],
        }, message);

    } catch (error) {
        console.error("Error fetching weather:", error);
        await sock.sendMessage(chatId, {
            text: getLang(sock).weather_error
        });
    }
};



const { bot } = require('../lib/pluginLoader');

bot({
  command: ['weather'],
  description: 'Get weather for a city',
  category: 'tools',
}, async (sock, chatId, message, args, query, ctx) => {
  if (!query) { await sock.sendMessage(chatId, { text: 'Usage: ' + ctx.effectivePrefix + 'weather <city>' }); return; }
  await weatherCommand(sock, chatId, query, message);
});