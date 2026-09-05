// IMDb plugin — primary: davidcyriltech API, fallback: OMDB API
const axios = require('axios');
const { getLang } = require('../lib/lang');

const PRIMARY_URL = 'https://apis.davidcyriltech.my.id/imdb?query=';
const OMDB_URL    = 'https://www.omdbapi.com/?apikey=trilogy&t=';

async function fetchFromPrimary(query) {
    const res = await axios.get(PRIMARY_URL + encodeURIComponent(query), { timeout: 8000 });
    if (!res.data.status) return null;
    const m = res.data.movie;
    return {
        title:    m.title,
        year:     m.year,
        rated:    m.rated,
        released: m.released,
        runtime:  m.runtime,
        genres:   m.genres,
        director: m.director,
        writer:   m.writer,
        actors:   m.actors,
        plot:     m.plot,
        languages:m.languages,
        awards:   m.awards,
        imdbRating: m.imdbRating,
        votes:    m.votes,
        metascore:m.metascore,
        boxoffice:m.boxoffice,
        poster:   m.poster,
        imdbUrl:  m.imdbUrl,
        rtRating: (m.ratings || []).find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A',
    };
}

async function fetchFromOmdb(query) {
    const res = await axios.get(OMDB_URL + encodeURIComponent(query), { timeout: 8000 });
    if (res.data.Response === 'False') return null;
    const m = res.data;
    const imdbId = m.imdbID || '';
    return {
        title:    m.Title,
        year:     m.Year,
        rated:    m.Rated,
        released: m.Released,
        runtime:  m.Runtime,
        genres:   m.Genre,
        director: m.Director,
        writer:   m.Writer,
        actors:   m.Actors,
        plot:     m.Plot,
        languages:m.Language,
        awards:   m.Awards,
        imdbRating: m.imdbRating,
        votes:    m.imdbVotes,
        metascore:m.Metascore,
        boxoffice:m.BoxOffice,
        poster:   m.Poster !== 'N/A' ? m.Poster : null,
        imdbUrl:  imdbId ? 'https://www.imdb.com/title/' + imdbId + '/' : 'N/A',
        rtRating: (m.Ratings || []).find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A',
    };
}

async function imdbCommand(sock, chatId, message, query) {
    if (!query) {
        await sock.sendMessage(chatId, { text: getLang(sock).imdb_usage });
        return;
    }

    let movie = null;

    // Try primary API first
    try {
        movie = await fetchFromPrimary(query);
    } catch (err) {
        // 404 = title not in their DB — fall through to OMDB
        // Any other error — also fall through
    }

    // Fallback to OMDB if primary failed or returned no result
    if (!movie) {
        try {
            movie = await fetchFromOmdb(query);
        } catch (_) {}
    }

    if (!movie) {
        await sock.sendMessage(chatId, { text: getLang(sock).imdb_not_found });
        return;
    }

    let reply = '';
    reply += '🎬 *' + movie.title + '* (' + movie.year + ')\n\n';
    reply += '⭐ Rated: '    + (movie.rated    || 'N/A') + '\n';
    reply += '📅 Released: ' + (movie.released || 'N/A') + '\n';
    reply += '⏳ Runtime: '  + (movie.runtime  || 'N/A') + '\n';
    reply += '🎭 Genres: '   + (movie.genres   || 'N/A') + '\n';
    reply += '🎥 Director: ' + (movie.director || 'N/A') + '\n';
    reply += '✍️ Writer: '   + (movie.writer   || 'N/A') + '\n';
    reply += '🎭 Cast: '     + (movie.actors   || 'N/A') + '\n\n';
    reply += '📖 Plot: '     + (movie.plot     || 'N/A') + '\n\n';
    reply += '🌍 Languages: '+ (movie.languages|| 'N/A') + '\n';
    reply += '🏆 Awards: '   + (movie.awards   || 'N/A') + '\n\n';
    reply += '⭐ IMDb: '     + (movie.imdbRating || 'N/A') + '/10 (' + (movie.votes || 'N/A') + ' votes)\n';
    reply += '🍅 Rotten Tomatoes: ' + movie.rtRating + '\n';
    reply += '📊 Metacritic: '      + (movie.metascore || 'N/A') + '\n\n';
    reply += '💰 Box Office: '      + (movie.boxoffice || 'N/A') + '\n\n';
    reply += '🔗 [IMDb Link](' + (movie.imdbUrl || 'https://www.imdb.com') + ')';

    if (movie.poster && movie.poster !== 'N/A') {
        await sock.sendMessage(chatId, {
            image: { url: movie.poster },
            caption: reply
        });
    } else {
        await sock.sendMessage(chatId, { text: reply });
    }
}

const { bot } = require('../lib/pluginLoader');

bot({
  command: ['imdb'],
  description: 'Search movie/show info',
  category: 'tools',
}, async (sock, chatId, message, args, query) => {
  try {
    await imdbCommand(sock, chatId, message, query);
  } catch (err) {
    console.error('IMDb command error:', err.message);
    await sock.sendMessage(chatId, { text: getLang(sock).imdb_error });
  }
});
