bot({ command: ["eplugintest"], description: "Test external plugin", category: "misc" }, async (sock, chatId, message) => {
  await sock.sendMessage(chatId, { text: "✅ eplugins system works! This command was downloaded and loaded from an external URL." }, { quoted: message });
});