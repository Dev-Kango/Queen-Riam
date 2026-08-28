# QPV Bot (plugin de sondage / quiz)

Un bot Discord simple (en français) pour lancer des sondages "1 question — 2 choix".

Principales commandes (slash) :
- /qpv start [count] [time] — démarre une session avec `count` questions tirées au hasard (max 50). `time` est le temps en secondes par question.
- /qpv add question choix1 choix2 — ajoute une question.
- /qpv remove id — supprime une question par id.
- /qpv list — affiche le nombre total de questions et un aperçu (10 premières).

Caractéristiques :
- Les questions sont stockées dans `questions.json` (50 questions incluses par défaut).
- Le bot ne publie pas les résultats (pas de score public). Les boutons sont désactivés à la clôture de chaque question.
- Utilise des commandes Slash (pas besoin d'activer l'intent Message Content).

Installation rapide :
1. Cloner le repo et basculer sur la branche `qpv-bot` :
   git checkout qpv-bot
2. Copier `.env.example` en `.env` et remplir :

   DISCORD_TOKEN=TON_TOKEN_DISCORD
   CLIENT_ID=TON_CLIENT_ID_D_APP
   GUILD_ID=OPTIONNEL_ID_DE_TON_SERVEUR (recommandé pour test rapide)

3. Installer les dépendances :
   npm install
4. Lancer le bot :
   npm start

Notes importantes :
- Pour que les commandes apparaissent immédiatement, renseigne `GUILD_ID` avec l'id d'un serveur où tu es admin (les commandes guild apparaissent instantanément). Si `GUILD_ID` n'est pas renseigné, le bot enregistre des commandes globales (peuvent prendre jusqu'à 1 heure à apparaître).
- Ne mets jamais ton token dans le dépôt (.env est dans .gitignore).

Utilisation :
- Dans ton serveur (avec le bot invité avec le scope `applications.commands` et `bot`), tape `/qpv start` pour lancer une session.
- Ajoute des questions avec `/qpv add`.

Améliorations possibles :
- Persistance des sessions et stockage en base (sqlite) pour historiser.
- Permissions pour restreindre qui peut ajouter/supprimer.
- Export des résultats par utilisateur (si tu souhaites garder les votes).

