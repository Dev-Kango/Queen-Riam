module.exports = {
  // ── Common ─────────────────────────────────────────────────────────────────
  common_bot_not_admin: '⚠️ Please make the bot an *admin* first.',
  common_user_not_admin: '❌ Only group admins can use this command.',
  common_groups_only: '❌ This command can only be used in groups!',
  common_owner_only: '❌ This command can only be used by the owner!',
  common_mention_or_reply: '❌ Please mention the user or reply to their message!',
  common_error: '❌ An error occurred. Please try again.',
  common_failed: '❌ Operation failed. Please try again.',
  common_rate_limit: '❌ Rate limit reached. Please try again in a few seconds.',
  common_admin_check_failed: '❌ Please make sure the bot is an admin of this group.',

  // ── Ban ────────────────────────────────────────────────────────────────────
  ban_no_target: '❌ Please mention the user or reply to their message to ban!',
  ban_success: '✅ Successfully banned @{user}!',
  ban_already: '⚠️ @{user} is already banned!',
  ban_failed: '❌ Failed to ban user!',

  // ── Unban ──────────────────────────────────────────────────────────────────
  unban_no_target: '❌ Please mention the user or reply to their message to unban!',
  unban_success: '✅ Successfully unbanned @{user}!',
  unban_not_banned: '⚠️ @{user} is not banned!',
  unban_failed: '❌ Failed to unban user!',

  // ── Kick ───────────────────────────────────────────────────────────────────
  kick_no_target: '❌ Please mention the user or reply to their message to kick!',
  kick_self: "❌ I can't kick myself! 🤖",
  kick_success: '✅ {users} has been kicked successfully!',
  kick_failed: '❌ Failed to kick user(s)!',

  // ── Warn ───────────────────────────────────────────────────────────────────
  warn_no_target: '❌ Please mention the user or reply to their message to warn!',
  warn_failed: '❌ Failed to warn user!',
  warn_failed_perms: '❌ Failed to warn user. Make sure the bot is admin and has sufficient permissions.',
  warn_title: '*『 ⚠️ WARNING ALERT 』*',
  warn_user_label: '👤 *Warned User:*',
  warn_count_label: '⚠️ *Warning Count:*',
  warn_by_label: '👑 *Warned By:*',
  warn_date_label: '📅 *Date:*',
  warn_autokick_title: '*『 🚫 AUTO-KICK 』*',
  warn_autokick_msg: '@{user} has been removed from the group after receiving 3 warnings! ⚠️',

  // ── Promote ────────────────────────────────────────────────────────────────
  promote_no_target: '❌ Please mention the user or reply to their message to promote!',
  promote_title: '*『 👑 GROUP PROMOTION 』*',
  promote_label: '👥 *Promoted User(s):*',
  promote_by: '👑 *Promoted By:*',
  promote_date: '📅 *Date:*',
  promote_failed: '❌ Failed to promote user(s)!',

  // ── Demote ─────────────────────────────────────────────────────────────────
  demote_no_target: '❌ Please mention the user or reply to their message to demote!',
  demote_title: '*『 🔽 GROUP DEMOTION 』*',
  demote_label: '👥 *Demoted User(s):*',
  demote_by: '👤 *Demoted By:*',
  demote_date: '📅 *Date:*',
  demote_failed: '❌ Failed to demote user(s)!',

  // ── Ping ───────────────────────────────────────────────────────────────────
  ping_pong: '🏓 Pong!',
  ping_failed: '❌ Failed to get ping info.',
  ping_response: '*Response Speed:*',
  ping_ram: 'RAM Usage:',
  ping_cores: 'CPU Cores:',
  ping_speed: 'CPU Speed:',

  // ── Mute / Unmute ──────────────────────────────────────────────────────────
  mute_success: '✅ The group has been muted for {minutes} minutes.',
  mute_unmuted: '✅ The group has been unmuted.',
  mute_error: '❌ An error occurred while muting/unmuting the group. Please try again.',

  // ── Open / Close ───────────────────────────────────────────────────────────
  open_success: '🔓 The group has been *opened*.\nAll members can send messages now.',
  open_failed: '❌ Failed to open the group.',
  close_success: '🔒 The group has been *closed*.\nOnly admins can send messages now.',
  close_failed: '❌ Failed to close the group.',

  // ── Tagall ─────────────────────────────────────────────────────────────────
  tagall_no_members: '❌ No participants found in the group.',
  tagall_header: '🔊 *Group Members:*\n\n',
  tagall_failed: '❌ Failed to tag all members.',

  // ── Tag ────────────────────────────────────────────────────────────────────
  tag_bot_not_admin: '❌ Please make the bot an admin first.',

  // ── Warnings ───────────────────────────────────────────────────────────────
  warnings_no_mention: '❌ Please mention a user to check their warnings.',
  warnings_count: '⚠️ User has *{count}* warning(s).',

  // ── Reset Link ─────────────────────────────────────────────────────────────
  resetlink_admin_only: '❌ Only admins can use this command!',
  resetlink_success: '✅ Group link has been successfully reset!\n\n📌 New link:\nhttps://chat.whatsapp.com/{code}',
  resetlink_failed: '❌ Failed to reset group link!',

  // ── Group Info ─────────────────────────────────────────────────────────────
  groupinfo_failed: '❌ Failed to get group info!',

  // ── Staff ──────────────────────────────────────────────────────────────────
  staff_groups_only: '❌ This command only works in groups!',
  staff_no_admins: 'No admins found',
  staff_failed: '❌ Failed to get admin list!',

  // ── Poll ───────────────────────────────────────────────────────────────────
  poll_groups_only: '❌ Polls can only be created in groups.',
  poll_usage: '📊 *How to create a poll:*\n\n{prefix}poll <question> | option1 | option2 | ...\n\n*Example:*\n{prefix}poll Best fruit? | Apple | Mango | Banana\n\nYou can add up to 12 options.',
  poll_max_options: '❌ Maximum 12 options allowed per poll.',

  // ── Set Welcome / Goodbye ──────────────────────────────────────────────────
  setwelcome_groups_only: '❌ This command can only be used in groups.',
  setwelcome_reset: '🔄 Welcome message reset to default.',
  setwelcome_saved: '✅ *Custom welcome message saved!*\n\n{msg}\n\n_Placeholders will be filled when a member joins._',
  setgoodbye_groups_only: '❌ This command can only be used in groups.',
  setgoodbye_reset: '🔄 Goodbye message reset to default.',
  setgoodbye_saved: '✅ *Custom goodbye message saved!*\n\n{msg}\n\n_Placeholders will be filled when a member leaves._',

  // ── Auto Reply ─────────────────────────────────────────────────────────────
  autoreply_on: '✅ Auto-reply is now *ON*.',
  autoreply_off: '❌ Auto-reply is now *OFF*.',
  autoreply_cleared: '🧹 Seen-users list cleared. Everyone will get the auto-reply again.',
  autoreply_reset: '🔄 Auto-reply reset to default message and image removed.',
  autoreply_image_removed: '🗑️ Auto-reply image removed.',
  autoreply_no_image: '⚠️ No image is currently set.',
  autoreply_unknown: '❓ Unknown option. Send *.autoreply* to see all commands.',
  autoreply_usage_set: 'Usage: .autoreply set <message>\nYou can attach or quote an image too.',

  // ── Chatbot ────────────────────────────────────────────────────────────────
  chatbot_cleared: '🧹 All chat memories cleared. Conversations will start fresh.',
  chatbot_reset: '🔄 AI training reset to default and chat memories cleared.',
  chatbot_unknown: '❓ Unknown option. Send *.chatbot* to see all commands.',

  // ── Clear Session ──────────────────────────────────────────────────────────
  clearsession_owner_only: '❌ This command can only be used by the owner!',
  clearsession_not_found: '❌ Session directory not found!',
  clearsession_optimizing: '🔍 Optimizing session files for better performance...',
  clearsession_success: '✅ Session files cleared successfully!\n\n📊 Statistics:\n• Total files cleared: {count}\n• App state sync files: {appstate}\n• Pre-key files: {prekeys}',
  clearsession_failed: '❌ Failed to clear session files!',

  // ── Clear Tmp ──────────────────────────────────────────────────────────────
  cleartmp_owner_only: '❌ This command is only available for the owner!',
  cleartmp_failed: '❌ Failed to clear temporary files!',

  // ── Auto Status ────────────────────────────────────────────────────────────
  autostatus_owner_only: '❌ This command can only be used by the owner!',
  autostatus_enabled: '✅ Auto status view has been *enabled*.\nBot will now automatically view all contact statuses.',
  autostatus_disabled: '❌ Auto status view has been *disabled*.\nBot will no longer automatically view statuses.',
  autostatus_invalid: '❌ Invalid command!\n\n📌 *Usage:*\n.autoviewstatus on\n.autoviewstatus off',

  // ── Button Mode ────────────────────────────────────────────────────────────
  buttonmode_turned_on: '🔘 *Button Mode* turned *✅ ON*\n\n_Interactive buttons will now appear on supported commands._',
  buttonmode_turned_off: '🔘 *Button Mode* turned *❌ OFF*\n\n_Bot will respond with plain text as normal._',

  // ── Welcome / Goodbye (auto messages) ─────────────────────────────────────
  welcome_default: '✨ *Welcome to {group}!* ✨\n\nHello @{user} 👋\n\nYou\'re our *{count}th* member!\n\n🕐 {time}  📅 {date}\n\nStay awesome! 😊',
  goodbye_default: '👋 *Goodbye @{user}!* 👋\n\nWe\'ll miss you 🥲\n\nFrom *{group}*\nWe\'re now *{count}* members.\n\n🕐 {time}  📅 {date}',

  // ── Sudo ───────────────────────────────────────────────────────────────────
  sudo_owner_only: '❌ This command can only be used by the bot owner!',
  sudo_invalid_number: '❌ Invalid phone number format! Please provide a valid number like: 233509977128',
  sudo_added: '✅ *Sudo user added!*\n\nNumber: {number}\n\nThis user now has access to all owner commands.',
  sudo_removed: '✅ *Sudo user removed!*\n\nNumber: {number}\n\nThis user no longer has owner privileges.',
  sudo_add_failed: '❌ Failed to add sudo user. Please try again.',
  sudo_remove_failed: '❌ Failed to remove sudo user. Please try again.',
  sudo_invalid_cmd: '❌ Invalid sudo command!\n\n*Available commands:*\n• {prefix}sudo add <number>\n• {prefix}sudo remove <number>\n• {prefix}sudo list',
  sudo_error: '❌ An error occurred while processing the sudo command.',

  // ── Language ───────────────────────────────────────────────────────────────
  language_changed: '✅ Language changed to *{lang}*! 🌍\n\nAll bot responses will now be in {langname}.',
  language_invalid: '❌ Invalid language code.\n\nAvailable languages:\n🇬🇧 *en* — English\n🇫🇷 *fr* — Français\n🇵🇹 *pt* — Português\n🇪🇸 *es* — Español\n🇮🇳 *hi* — हिन्दी\n🇳🇬 *ha* — Hausa',
  language_owner_only: '❌ Only the bot owner can change the language.',
  language_already_set: "ℹ️ Language is already set to *{langname}* ({lang}).",
  language_dm_only: '❌ Please send this command in your DM (private chat) with the bot.',
  language_usage: '🌍 *Language Settings*\n\nCurrent language: *{current}*\n\nUsage: *.language <code>*\n\nAvailable:\n🇬🇧 *en* — English\n🇫🇷 *fr* — Français\n🇵🇹 *pt* — Português\n🇪🇸 *es* — Español\n🇮🇳 *hi* — हिन्दी\n🇳🇬 *ha* — Hausa',

  ping_server_info: 'Server Info',
  ping_seconds: 'seconds',
  ping_alive_btn: '🤖 Alive Status',
  alive_greeting: 'Hello {user}, I\'m alive now',
  alive_subtitle: 'WhatsApp Bot - Always at your service! 🪄',
  alive_system_status: '📊 *System Status:*',
  alive_version: '🚀 Version:',
  alive_memory: '💾 Memory:',
  alive_free: '🆓 Free:',
  alive_runtime: '⏰ Runtime:',
  alive_platform: 'Platform:',
  alive_node: '🔧 Node.js:',
  alive_online: 'Online ✅',
  alive_powered: 'ρσωєяє∂ ву',
  alive_ping_btn: '🏓 Check Ping',
  alive_error: 'is alive!\n\nRuntime: {runtime}\n\nTry again in a moment! ⚡',

  btn_select_option: "Select an option:",
  btn_turn_on: "✅ Turn ON",
  btn_turn_off: "❌ Turn OFF",
  dl_no_song: "❌ Please provide a song name!\nExample: .play despacito",
  dl_no_video: "❌ What video do you want to download?",
  dl_no_tiktok: "❌ Please provide a TikTok link!\nExample: .tiktok https://vt.tiktok.com/xxxxx",
  dl_no_instagram: "📌 Please send or reply to an Instagram post/reel link.\nExample:\n.ig https://instagram.com/reel/xxxx",
  dl_no_facebook: "❌ Please provide a Facebook video URL.\n\nExample: .fb https://www.facebook.com/...",
  dl_no_youtube: "⚠️ Please provide a YouTube link or search query.\n\nExample:\n.ytplay another love",
  dl_no_results: "⚠️ No results found!",
  dl_failed: "❌ Download failed. Please try again later.",
  dl_error: "❌ An error occurred while processing your request.",
  dl_downloading: "Downloading...",
  dl_invalid_tiktok: "❌ That is not a valid TikTok link.",
  dl_invalid_instagram: "⚠️ Please provide a valid Instagram link (post, reel, or video).",
  dl_invalid_facebook: "❌ That does not look like a Facebook link.",
  dl_invalid_youtube: "❌ This is not a valid YouTube link!",
  dl_no_media: "❌ No media found at the provided link.",
  dl_private_video: "❌ Could not find a downloadable video. The video may be private or the URL may be invalid.",
  dl_too_large: "❌ Video is too large to send on WhatsApp (max 62MB).",
  dl_duration: "⏱ Duration:",
  dl_views: "👁 Views:",
  dl_quality: "📌 Quality:",
  dl_downloaded_by: "Downloaded by Queen Riam",
  tts_no_text: "❌ Please provide the text for TTS conversion.",
  tts_error_gen: "❌ Error generating TTS audio.",
  tts_failed_send: "❌ Failed to send TTS audio.",
  delete_bot_admin: "❌ I need to be an admin to delete messages.",
  delete_user_admin: "❌ Only admins can use the .delete command.",
  delete_no_reply: "❌ Please reply to a message you want to delete.",
  viewonce_no_reply: "❌ Please reply to a view-once image or video.",
  sticker_no_media: "❌ Please reply to an image/video with .sticker, or send an image/video with .sticker as the caption.",
  sticker_failed_dl: "❌ Failed to download media. Please try again.",
  sticker_no_image_video: "❌ Please reply to an image or video!",
  sticker_failed: "❌ Failed to create sticker!",
  simage_no_sticker: "❌ Reply to a sticker with .simage to convert it.",
  simage_converted: "✅ Here is the converted image!",
  simage_error: "❌ An error occurred while converting the sticker.",
  simage_no_sticker_alt: "❌ Please reply to a sticker!",
  simage_image: "✨ Here's your image!",
  simage_failed: "❌ Failed to convert sticker to image!",
  weather_not_found: "❌ Could not find weather for that location.",
  weather_error: "❌ Sorry, I could not fetch the weather right now.",
  weather_refresh_btn: "🔄 Refresh Weather",
  weather_temp: "🌡️ Temperature:",
  weather_humidity: "💧 Humidity:",
  weather_wind: "🌬️ Wind:",
  weather_pressure: "📊 Pressure:",
  news_title: "📰 *Latest News:*",
  news_refresh_btn: "🔄 Refresh News",
  news_error: "❌ Sorry, I could not fetch news right now.",
  ngl_no_message: "❌ Please type a message.",
  ngl_sent: "✅ Your anonymous message has been sent!\n\n📝 Message:",
  ngl_failed: "❌ Couldn't send your message to NGL. Please try again later.",
  ngl_error: "❌ Error sending your message to NGL.",
  buttonmode_status: "Current status:",
  buttonmode_desc: "When ON, the bot sends interactive tap-buttons with responses. When OFF, the bot responds with plain text as normal.",
  antibadword_admin_only: "❌ For Group Admins Only!",
  antibadword_error: "❌ Error processing antibadword command.",
  antilink_invalid_action: "❌ Invalid action. Please use kick, delete, or warn.",
  antilink_turned_on: "✅ Antilink has been turned ON with action set to {action}",
  antilink_failed_on: "❌ Failed to turn on Antilink.",
  antilink_turned_off: "✅ Antilink has been turned OFF.",
  antilink_error: "❌ Error processing antilink command.",
  attp_no_text: "❌ Please provide text after the .attp command.",
  attp_failed: "❌ Failed to generate the sticker. Please try again later.",
  clear_clearing: "🧹 Clearing bot messages...",
  clear_error: "❌ An error occurred while clearing messages.",
  save_no_reply: "🍁 Please reply to a *status* (or any media) to save it!",
  save_failed: "❌ Failed to download media!",
  setpp_owner_only: "❌ This command is only available for the owner!",
  setpp_no_reply: "⚠️ Please reply to an image with the .setpp command!",
  setpp_no_image: "❌ The replied message must contain an image!",
  setpp_success: "✅ Successfully updated bot profile picture!",
  video_downloading: "Downloading your video...",

  // ── New Command Keys ────────────────────────────────────────────────────
  joke_title: '🤣 *Joke of Today* 🤣\n\n',
  joke_error: '❌ Sorry, I could not fetch a joke right now.',
  joke_btn_another: '😂 Another Joke',
  joke_btn_fact: '🧠 Random Fact',
  joke_btn_quote: '💡 Daily Quote',
  quote_title: '💡 *Quote of the Day* 💡\n\n',
  quote_error: '❌ Failed to get quote. Please try again later!',
  quote_btn_another: '💡 Another Quote',
  quote_btn_joke: '😂 Get a Joke',
  fact_title: '🧠 *Random Fact* 🧠\n\n',
  fact_error: '❌ Sorry, I could not fetch a fact right now.',
  fact_btn_another: '🧠 Another Fact',
  compliment_no_target: 'Please mention someone or reply to their message to compliment them!',
  compliment_error: 'An error occurred while sending the compliment.',
  flirt_error: '❌ Failed to get flirt message. Please try again later!',
  dare_error: '❌ Failed to get dare. Please try again later!',
  truth_error: '❌ Failed to get truth. Please try again later!',
  ship_error: '❌ Failed to ship! Make sure this is a group.',
  simp_error: '❌ Sorry, I could not generate the simp card. Please try again later!',
  stupid_error: '❌ Sorry, I could not generate the stupid card. Please try again later!',
  eightball_no_question: '🎱 Please ask a question!\n\nUsage: .8ball <your question>',
  eightball_title: '🎱 *Magic 8-Ball*',
  eightball_question_label: '❓ *Question:*',
  eightball_answer_label: '💬 *Answer:*',
  eightball_btn_again: '🔄 Ask Again',
  insult_no_target: 'Please mention someone or reply to their message to insult them!',
  insult_error: 'An error occurred while sending the insult.',
  goodnight_error: '❌ Failed to get goodnight message. Please try again later!',
  wasted_no_target: 'Please mention someone or reply to their message to waste them!',
  wasted_caption: '⚰️ *Wasted* 💀\n\nRest in pieces!',
  wasted_error: 'Failed to create wasted image! Try again later.',
  character_no_target: 'Please mention someone or reply to their message to analyze their character!',
  character_error: 'Failed to analyze character! Try again later.',
  emojimix_usage: '🎴 Example: .emojimix 😎+🥰',
  emojimix_separate: '✳️ Separate the emoji with a *+* sign\n\n📌 Example: \n*.emojimix* 😎+🥰',
  emojimix_no_mix: '❌ These emojis cannot be mixed! Try different ones.',
  emojimix_failed: '❌ Failed to mix emojis! Make sure you\'re using valid emojis.',
  gif_no_query: 'Please provide a search term for the GIF.',
  gif_not_found: 'No GIFs found for your search term.',
  gif_error: 'Failed to fetch GIF. Please try again later.',
  blur_no_image: '❌ Please reply to an image or send an image with caption .blur',
  blur_failed: '❌ Failed to blur image. Please try again later.',
  meme_error: '❌ Failed to fetch meme. Please try again later.',
  tgsticker_no_url: '⚠️ Please enter the Telegram sticker URL!\n\nExample: .tg https://t.me/addstickers/Pack',
  tgsticker_invalid: '❌ Invalid URL! Make sure it\'s a Telegram sticker URL.',
  tgsticker_found: '📦 Found {count} stickers\n⏳ Starting download...',
  tgsticker_success: '✅ Successfully downloaded {success}/{total} stickers!',
  tgsticker_failed: '❌ Failed to process Telegram stickers!',
  take_no_sticker: '❌ Reply to a sticker with .take <packname>',
  take_failed_dl: '❌ Failed to download sticker',
  take_error: '❌ Error processing sticker',
  textmaker_no_text: 'Please provide text to generate.',
  textmaker_error: '❌ Error: Failed to generate text.',
  textmaker_unexpected: 'An unexpected error occurred. Please try again later.',
  tgsearch_no_query: '❌ Please provide a search term.\n\nUsage: .tgsearch <keyword>',
  tgsearch_not_found: '❌ No Telegram channels found for "{query}".',
  tgsearch_error: '❌ Failed to search Telegram channels. Try again later.',
  tgsearch_header: '🔎 *Telegram Search Results for "{query}":*',
  pinterest_no_url: '❌ Please provide a Pinterest link!',
  pinterest_invalid: '❌ That is not a valid Pinterest link.',
  removebg_no_image: '❌ Please reply to an image with *.removebg* to remove its background.',
  removebg_dl_failed: '❌ Failed to download the image. Please try again.',
  removebg_failed: '❌ Failed to remove background. Please try again later.',
  ss_no_url: '❌ Please provide a valid URL starting with http:// or https://',
  ss_failed: '❌ Failed to take screenshot. Please try again in a few minutes.',
  bible_usage: '📖 Usage: .bible John 3:16',
  bible_not_found: '❌ Could not fetch the verse. Please check the reference.',
  bible_error: '⚠️ Error fetching verse. Try again later.',
  quran_usage: '📖 Usage: .quran <surah>:<ayah>',
  quran_invalid: '❌ Invalid format. Use .quran <surah>:<ayah>',
  quran_not_found: '❌ Could not fetch the verse. Please check the surah and ayah number.',
  quran_error: '⚠️ Error fetching verse. Try again later.',
  lyrics_no_title: '🔍 Please enter the song name!',
  lyrics_not_found: '❌ Sorry, I could not find lyrics for "{song}".',
  lyrics_header: '🎵 *Song Lyrics* 🎶',
  lyrics_title_label: '▢ *Title:*',
  lyrics_artist_label: '▢ *Artist:*',
  lyrics_error: '❌ Could not fetch lyrics. Please try again later.',
  imdb_usage: '🎬 Usage: .imdb <movie name>',
  imdb_not_found: '❌ Could not fetch movie details. Try another title.',
  imdb_error: '⚠️ Error fetching movie. Try again later.',
  deepseek_failed: '❌ Deepseek failed. Try again later.',
  gpt_failed: '❌ GPT failed. Try again later.',
  aiart_no_prompt: '🎨 *AI Image Generator*\n\nUsage: .aiart <your prompt>',
  aiart_generating: '🎨 *AI Image Generation*\n\n📝 *Prompt:* {prompt}\n\n⚡ *Status:* Initializing...',
  aiart_caption: '🎨 *AI Generated Image*\n\n📝 *Prompt:* {prompt}\n\n✅ Successfully created!',
  aiart_failed: '❌ *Generation Failed*\n\nPlease try again with a different prompt.',
  imagine_no_prompt: 'Please provide a prompt for the image generation.',
  imagine_generating: '🎨 Generating your image... Please wait.',
  imagine_failed: '❌ Failed to generate image. Please try again later.',
  wallpaper_no_query: '🖼️ Please provide a search query!\nExample: `.wallpaper Ronaldo`',
  wallpaper_searching: '🔍 Searching wallpapers for *{query}*...',
  wallpaper_not_found: '❌ No wallpapers found for *{query}*. Try a different keyword.',
  wallpaper_found: '🖼️ Found {count} wallpapers! Fetching now...',
  wallpaper_error: '❌ Search failed. Please try again later.',
  wallpaper_no_images: '❌ Could not fetch wallpaper images. Try again later.',
  wallpaper_send_failed: '❌ Failed to send wallpapers. Try again later.',
  snap_no_url: '❌ Please provide a Snapchat link, or reply to a message containing one.',
  snap_invalid: '❌ That does not look like a Snapchat link.',
  snap_no_content: '❌ No downloadable content found. The snap may be private or the link may be expired.',
  twitter_no_url: '❌ Please provide a Twitter/X link, or reply to a message containing one.',
  twitter_invalid: '❌ That does not look like a Twitter/X link.',
  tomp3_no_video: '❌ Please *reply to a video* with .tomp3',
  tomp3_failed: '❌ Failed to convert video to MP3.',
  topmembers_groups_only: 'This command is only available in group chats.',
  topmembers_no_activity: 'No message activity recorded yet.',
  topmembers_header: '🏆 Top Members Based on Message Count:\n\n',
  transcribe_no_audio: '❌ Please reply to a voice note or audio file to transcribe it.',
  transcribe_header: '🎙️ *Transcription:*',
  transcribe_unclear: '❌ Could not transcribe. The audio may be too short or unclear.',
  transcribe_failed: '❌ Transcription failed:',
  translate_usage: '*TRANSLATOR*\n\nUsage:\n1. Reply to a message with: .translate <lang>\n2. Or type: .translate <text> <lang>',
  translate_no_text: '❌ No text found to translate. Please provide text or reply to a message.',
  translate_header: '🌐 *Translated ({lang})*',
  translate_failed: '❌ Failed to translate text. Try again later.',
  trim_usage: "🎬 Media length: *{duration}*\n\nUse: .trim start end\nExample: .trim 0 30  (first 30s)\nExample: .trim 30 60 (30s–60s)",
  trim_no_media: '❌ Please reply to a *video or audio* with `.trim`',
  trim_duration_failed: '⚠️ Failed to get media duration.',
  trim_invalid_format: '❌ Invalid format. Use `.trim start end` (in seconds)',
  trim_failed: '❌ Failed to trim media.',
  trim_error: '❌ Error processing media.',
  veo3_no_prompt: '❌ Please provide a prompt for video generation.\n\nUsage: .veo3 <prompt>',
  veo3_generating: '🎬 Generating video... This may take up to 1 minute.',
  veo3_failed: '❌ Video generation failed. Please try again in a moment.',
  xnxx_no_query: '⚠️ Please provide an XNXX search keyword.',
  xnxx_no_url: '❌ Error: Only use search keywords, not direct URLs.',
  xnxx_not_found: '❌ No results found for: {query}',
  xnxx_no_sendable: '❌ No videos could be sent under WhatsApp\'s size limit.',
  xnxx_success: '✅ Successfully sent *{count} video(s)* for your search: "{query}".',
  hangman_started: 'Game started! The word is: {word}',
  hangman_no_game: 'No game in progress. Start a new game with .hangman',
  hangman_already_guessed: 'You already guessed "{letter}". Try another letter.',
  hangman_good_guess: 'Good guess!',
  hangman_won: 'Congratulations! You guessed the word: {word}',
  hangman_wrong: 'Wrong guess! You have {tries} tries left.',
  hangman_over: 'Game over! The word was: {word}',
  antidelete_owner_only: '🔐 *Access Denied* — This command is restricted to the bot owner only.',
  antidelete_invalid: '❌ *Invalid option.* Use `.antidelete on` or `.antidelete off`.',
  antidelete_on: '🛡️ *Anti-Delete Activated*\n\nI will now monitor all messages. If anyone deletes a message, I will forward the original content directly to you.',
  antidelete_off: '🔕 *Anti-Delete Deactivated*\n\nMessage monitoring has been turned off.',
  // ── Help / Commands (i18n) ──────────────────────────────────────────────
  help_tap_category: "_Tap a category below to view its commands_",
  help_back_btn: "🔙 Back to Menu",
  help_menu_suffix: "Menu",
  help_cat_ai: "AI",
  help_cat_download: "Download",
  help_cat_fun: "Fun",
  help_cat_games: "Games",
  help_cat_group: "Group",
  help_cat_general: "General",
  help_cat_owner: "Owner",
  help_cat_photo: "Photo",
  help_cat_religion: "Religion",
  help_cat_tools: "Tools",
  help_cat_text: "Text Art",
  reportbug_usage: "❌ Please describe the issue.\n\nExample: {prefix}reportbug Play command isn't working",
  reportbug_confirm: "👋 Hi {name}!\n\nYour bug report has been forwarded to the developer.\nPlease wait for a reply. ✅",
  reportbug_failed: "❌ Failed to send bug report.",
  ss_usage: "*SCREENSHOT TOOL*\n\n*.ss <url>*\n*.ssweb <url>*\n*.screenshot <url>*\n\nTake a screenshot of any website\n\nExample:\n.ss https://google.com",
  poststatus_usage: "❌ Please provide text or reply to an image/video/audio.\n\n*Usage:*\n• `.poststatus Your text here`\n• `.poststatus 5 F3 Colored text` _(color 1-30, font F1-F5)_\n• Reply to media with `.poststatus [optional caption]`",
  poststatus_failed: "❌ Failed to post status.",
  setpp_failed: "❌ Failed to update profile picture!",
  tictactoe_in_game: "❌ You are still in a game. Type *surrender* to quit.",
  tictactoe_waiting: "⏳ *Waiting for opponent*\nType *.ttt {name}* to join!",
  tictactoe_error: "❌ Error starting game. Please try again.",
  tictactoe_not_your_turn: "❌ Not your turn!",
  tictactoe_invalid_move: "❌ Invalid move! That position is already taken.",
  suno_usage: "🎵 *AI Music Generator*\n\n*Usage:* .suno <song description>\n\n*Examples:*\n• .suno Romantic love song about sunset\n• .suno Happy birthday jazz vibes\n• .suno Upbeat pop dance track",
  suno_auth_failed: "❌ *Authentication Failed*\n\nUnable to connect to music service.\nPlease try again later.",
  suno_gen_failed: "❌ *Generation Failed*\n\nFailed to start song creation process.\nPlease try again later.",

  autostatus_status: `🔄 *Auto Status View*

Current status: {status}`,
  autostatus_error: `❌ Error occurred while managing auto status!`,
  autoreply_set_with_image: `✅ Auto-reply message and image updated.

*Message:* _{msg}_`,
  autoreply_set_image_failed: `✅ Auto-reply message updated (image failed to save).

*Message:* _{msg}_`,
  autoreply_set_success: `✅ Auto-reply message updated.

*Message:* _{msg}_`,
  antidelete_status: `━━━━━━━━━━━━━━━━━━━━
🛡️ *ANTI-DELETE SETTINGS*
━━━━━━━━━━━━━━━━━━━━

📌 *Current Status:* {status}

*Commands:*
• *.antidelete on* — Enable protection
• *.antidelete off* — Disable protection

💡 When enabled, deleted messages (text, images, videos & stickers) are forwarded to the bot owner's DM.
━━━━━━━━━━━━━━━━━━━━`,
  antidelete_media_caption: `🗑️ *Deleted {type} recovered*
👤 Originally from: @{sender}`,
  antidelete_media_error: `⚠️ *Media Recovery Failed*\n\nThe deleted media could not be retrieved. It may have expired before it could be saved.`,
  chatbot_on: `✅ AI Chatbot is now *ON*

🤖 Mode: *{mode}*
🧠 Memory: *Enabled*`,
  chatbot_off: `❌ AI Chatbot is now *OFF*`,
  chatbot_dm_only: `💬 Chatbot mode set to *DMs only*`,
  chatbot_groups_only: `👥 Chatbot mode set to *Groups only*`,
  chatbot_everywhere: `🌐 Chatbot mode set to *Everywhere* (DMs + Groups)`,
  chatbot_text_mode: `📝 Chatbot reply mode set to *Text only*`,
  chatbot_audio_mode: `🔊 Chatbot reply mode set to *Audio only*`,
  chatbot_both_mode: `📝🔊 Chatbot reply mode set to *Text + Audio*`,
  chatbot_train_usage: `❌ Please provide training instructions.

*Example:*
\`.chatbot train You are Luna, a friendly AI assistant created by John.\``,
  chatbot_train_success: `✅ *AI Training Updated!*

📝 *New training:*
_{prompt}_

🧹 Previous chat memories cleared.`,
  chatbot_prompt_show: `📝 *Current AI Training:*

_{prompt}_`,
  chatbot_btn_dm: `💬 DMs Only`,
  chatbot_btn_group: `👥 Groups Only`,
  chatbot_btn_all: `🌐 Everywhere`,
  chatbot_btn_text: `📝 Text Mode`,
  chatbot_btn_audio: `🔊 Audio Mode`,
  chatbot_btn_both: `📝🔊 Text + Audio`,
  chatbot_btn_prompt: `📝 View Training`,
  chatbot_btn_clear: `🧹 Clear Memory`,
  github_error: `❌ Error fetching repository information.`,
  github_downloading: `📦 Downloading Queen Riam repository ZIP...`,
  github_zip_failed: `❌ Failed to download the repository ZIP. Try again later.`,
  script_failed: `❌ Failed to fetch or send the repository ZIP.`,
  imagine_caption: `🎨 Generated image for: "{prompt}"`,
  blur_success: `[ ✔ ] Image Blurred Successfully`,
  facebook_caption: `📥 Downloaded by Queen Riam`,
  facebook_error: `❌ Failed to download the video.`,
  instagram_caption: `〽️ ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ ʙʏ *Queen Riam*`,
  textmaker_invalid_type: `❌ Invalid text generator type.`,
  textmaker_caption: `✨ Created By Queen Riam`,
  group_only: `⚠️ This command can only be used in groups.`,
  trivia_in_progress: `⚠️ A trivia game is already in progress!

Use \`.answer\` to respond.`,
  trivia_error: `❌ Error fetching trivia question. Try again later.`,
  trivia_no_game: `⚠️ No trivia game in progress.

Start one with \`.trivia\``,
  wanted_no_pic: `❌ Couldn't fetch profile picture. The user may have a private profile or no picture set.`,
  wanted_usage: `❌ Reply to an image/video or tag someone with the wanted command.`,
  wanted_error: `❌ Failed to create wanted poster.`,


  // ── Pair ────────────────────────────────────────────────────────────────
  pair_owner_only: '❌ This command can only be used by the owner!',
  pair_usage: '❌ Please provide a phone number.\n\nUsage: .pair <number>\nExample: .pair 233509977126',
  pair_invalid_number: '❌ Invalid phone number! Please use digits only (e.g. 233509977126)',
  pair_generating: '⏳ Generating pairing code for *{number}*...\nPlease wait a moment.',
  pair_success: '🔗 *Pairing Code for {number}*\n\n╔══════════════╗\n║  *{code}*  ║\n╚══════════════╝\n\n📌 *Steps to link:*\n1. Open WhatsApp on phone *+{number}*\n2. Go to ⋮ → Linked Devices → Link a Device\n3. Tap *Link with phone number instead*\n4. Enter the code above\n\n⏰ Code expires in *3 minutes*.\n\n👑 Queen Riam',
  pair_failed: '❌ Failed to generate pairing code. Please try again.',
  pair_error: '❌ An error occurred while generating the pairing code.',
  pair_already_active: '⚠️ A pairing session for *{number}* is already in progress. Please wait.',

  // ── New commands (catbox / hymn / screenshot) ──────────────────────────
  catbox_no_media: '📎 *Please send or quote a media file to upload.*',
  catbox_uploading: '📤 *Uploading your file...*',
  catbox_error: '❌ Failed to upload. Please try again.',
  hymn_usage: '✝️ *Catholic HymnBook*\n\nUsage:\n• *.hymn <number>* — get hymn by number (1–508)\n• *.hymn <title>* — search hymns by title\n\n_Example: .hymn 1 or .hymn alleluia_',
  hymn_range: '❌ Hymn number must be between *1* and *508*.',
  hymn_not_found: '❌ Hymn not found.',
  hymn_error: '❌ Failed to fetch hymn. Please try again.',
  hymn_no_results: '❌ No hymns found for that keyword. Try a different one.',
  screenshot_msg_usage: '📸 *Reply to any message with .screenshot to capture it.*',
  screenshot_msg_error: '❌ Failed to take screenshot. Please try again.',

  antiedit_owner_only: '🔐 *Access Denied* — This command is restricted to the bot owner only.',
  antiedit_on_private: '🕵️ *Anti-Edit Activated (Private)*\n\nWhen someone edits a message, I will send the original content to your DM silently.',
  antiedit_on_chat: '📣 *Anti-Edit Activated (In-Chat)*\n\nWhen someone edits a message, I will expose the original content directly in the chat.',
  antiedit_off: '🔕 *Anti-Edit Deactivated*\n\nMessage edit monitoring has been turned off.',
  antiedit_status: `━━━━━━━━━━━━━━━━━━━━
✏️ *ANTI-EDIT SETTINGS*
━━━━━━━━━━━━━━━━━━━━

📌 *Current Status:* {status}

*Commands:*
• *.antiedit private* — Alert you in DM (silent)
• *.antiedit chat* — Expose edit in the group
• *.antiedit off* — Disable

💡 Catches anyone who edits a message to hide what they said.
━━━━━━━━━━━━━━━━━━━━`,
};
