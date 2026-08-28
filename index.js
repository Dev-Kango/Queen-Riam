// QPV Bot - simple slash-command Discord bot
// Prérequis : créer un fichier .env avec DISCORD_TOKEN et CLIENT_ID
// Optionnel : GUILD_ID pour enregistrer rapidement les commandes dans un serveur (recommandé pour test)

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
function loadQuestions() {
  try {
    return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}
function saveQuestions(arr) {
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || null; // optional for quick guild registration

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env (see .env.example)');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const QUESTION_TIMEOUT = 20_000; // ms per question (default)

const commands = [
  {
    name: 'qpv',
    description: 'Commandes QPV (sondages 1 question - 2 choix)',
    options: [
      {
        name: 'start',
        description: 'Démarrer une session QPV (tirage aléatoire de questions)',
        type: 1, // SUB_COMMAND
        options: [
          { name: 'count', description: 'Nombre de questions (max 50)', type: 4, required: false },
          { name: 'time', description: 'Temps par question en secondes', type: 4, required: false }
        ]
      },
      {
        name: 'add',
        description: 'Ajouter une question (texte + 2 choix)',
        type: 1,
        options: [
          { name: 'question', type: 3, description: 'Texte de la question', required: true },
          { name: 'choix1', type: 3, description: 'Choix A', required: true },
          { name: 'choix2', type: 3, description: 'Choix B', required: true }
        ]
      },
      {
        name: 'remove',
        description: 'Supprimer une question par id',
        type: 1,
        options: [
          { name: 'id', type: 4, description: 'Id de la question', required: true }
        ]
      },
      {
        name: 'list',
        description: 'Afficher le nombre total de questions et un aperçu',
        type: 1
      }
    ]
  }
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register commands to guild if GUILD_ID is provided (fast), otherwise register globally (may take up to 1 hour)
  try {
    if (GUILD_ID) {
      const guild = await client.guilds.fetch(GUILD_ID);
      await guild.commands.set(commands);
      console.log('Slash commands registered to guild', GUILD_ID);
    } else {
      await client.application.commands.set(commands);
      console.log('Global slash commands registered (may take some time to appear)');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'qpv') return;

  const sub = interaction.options.getSubcommand();
  let questions = loadQuestions();

  if (sub === 'list') {
    const total = questions.length;
    const preview = questions.slice(0, 10).map(q => `#${q.id} — ${q.text} [${q.choices[0]} / ${q.choices[1]}]`).join('\n') || 'Aucune question';
    return interaction.reply({ content: `Total questions: ${total}\nAperçu (10 premiers) :\n${preview}`, ephemeral: true });
  }

  if (sub === 'add') {
    const text = interaction.options.getString('question');
    const c1 = interaction.options.getString('choix1');
    const c2 = interaction.options.getString('choix2');
    const newId = (questions.reduce((m, q) => Math.max(m, q.id), 0) || 0) + 1;
    const newQ = { id: newId, text, choices: [c1, c2], tags: [], difficulty: 'moyen' };
    questions.push(newQ);
    saveQuestions(questions);
    return interaction.reply({ content: `Question ajoutée: #${newId} — ${text}`, ephemeral: true });
  }

  if (sub === 'remove') {
    const id = interaction.options.getInteger('id');
    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) return interaction.reply({ content: `Aucune question avec id ${id}`, ephemeral: true });
    const removed = questions.splice(idx, 1)[0];
    saveQuestions(questions);
    return interaction.reply({ content: `Supprimée: #${removed.id} — ${removed.text}`, ephemeral: true });
  }

  if (sub === 'start') {
    if (questions.length === 0) return interaction.reply({ content: 'Pas de questions disponibles. Ajoute-en avec /qpv add', ephemeral: true });

    const count = Math.min(interaction.options.getInteger('count') || 50, 50);
    const timeSec = Math.max(interaction.options.getInteger('time') || Math.floor(QUESTION_TIMEOUT / 1000), 5);
    const timeMs = timeSec * 1000;

    // choose randomly
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const sessionQs = shuffled.slice(0, Math.min(count, shuffled.length));

    await interaction.reply({ content: `Début de la session QPV : ${sessionQs.length} questions. Chaque question reste ouverte ${timeSec}s. Réponds en cliquant sur un bouton (un vote par personne).`, ephemeral: false });

    const channel = interaction.channel;

    for (let i = 0; i < sessionQs.length; i++) {
      const q = sessionQs[i];
      const embed = new EmbedBuilder()
        .setTitle(`Question ${i + 1}/${sessionQs.length} — #${q.id}`)
        .setDescription(q.text)
        .addFields(
          { name: 'Choix 1', value: q.choices[0], inline: false },
          { name: 'Choix 2', value: q.choices[1], inline: false }
        )
        .setFooter({ text: 'Réponds en cliquant sur un bouton ci-dessous' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`qpv_${i}_0`).setLabel('1').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`qpv_${i}_1`).setLabel('2').setStyle(ButtonStyle.Secondary)
      );

      const sent = await channel.send({ embeds: [embed], components: [row] });

      const votes = new Map();

      const filter = (btn) => btn.isButton() && btn.customId.startsWith(`qpv_${i}_`);
      const collector = sent.createMessageComponentCollector({ filter, time: timeMs });

      collector.on('collect', async (btn) => {
        try {
          const parts = btn.customId.split('_');
          const choice = parseInt(parts[2], 10);
          votes.set(btn.user.id, choice);
          await btn.reply({ content: `Vote enregistré: choix ${choice + 1}`, ephemeral: true });
        } catch (err) {
          console.error('collect error', err);
        }
      });

      await new Promise(resolve => collector.on('end', () => resolve()));

      // disable buttons without showing scores
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`disabled_${i}_0`).setLabel('1').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId(`disabled_${i}_1`).setLabel('2').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        const closedEmbed = EmbedBuilder.from(embed).setFooter({ text: 'Sondage clos pour cette question' });
        await sent.edit({ embeds: [closedEmbed], components: [disabledRow] });
      } catch (err) {
        console.error('Erreur en désactivant les boutons:', err);
      }

      // short pause
      await new Promise(r => setTimeout(r, 800));
    }

    await channel.send('Session QPV terminée !');
    return;
  }
});

client.login(TOKEN);
