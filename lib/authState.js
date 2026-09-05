'use strict';
/**
 * lib/authState.js — Multi-backend session storage for Queen Riam
 *
 * Set DB_TYPE to choose your storage backend:
 *
 *   (not set)        -> /session folder (default, works everywhere, zero config)
 *   DB_TYPE=sqlite   -> SQLite file  (VPS/local, no server needed)
 *   DB_TYPE=postgres -> PostgreSQL   (Railway, Neon, Heroku Postgres, self-hosted)
 *   DB_TYPE=mysql    -> MySQL / MariaDB
 *   DB_TYPE=mongodb  -> MongoDB      (Atlas, Railway, self-hosted)
 *   DB_TYPE=supabase -> Supabase     (direct PostgreSQL, no extra package needed)
 *   DB_TYPE=redis    -> Redis        (Render, Railway, Upstash, self-hosted)
 *
 * Required env vars per backend:
 *   (default)  -> none
 *   sqlite     -> SQLITE_PATH          (optional, default: ./data/session.db)
 *   postgres   -> DATABASE_URL         postgresql://user:pass@host:5432/db
 *   mysql      -> DATABASE_URL         mysql://user:pass@host:3306/db
 *   mongodb    -> MONGO_URI            mongodb+srv://user:pass@cluster.mongodb.net/queenriam
 *   supabase   -> SUPABASE_DB_URL      from Supabase dashboard:
 *                                      Settings -> Database -> Connection string -> URI
 *   redis      -> REDIS_URL            redis://... or rediss://...
 *
 * All backends expose the same interface: { state: { creds, keys }, saveCreds }
 */

const path = require('path');
const fs   = require('fs');

// Baileys helpers
const {
    useMultiFileAuthState,
    initAuthCreds,
    BufferJSON,
} = require('@whiskeysockets/baileys');

const serialize   = (v) => JSON.stringify(v, BufferJSON.replacer);
const deserialize = (s) => JSON.parse(s, BufferJSON.reviver);

// =============================================================================
// BACKEND 1 — FILE (default, zero config)
// =============================================================================
async function useFileAuthState(sessionDir) {
    fs.mkdirSync(sessionDir, { recursive: true });
    return useMultiFileAuthState(sessionDir);
}

// =============================================================================
// BACKEND 2 — SEQUELIZE  (sqlite / postgres / mysql)
// =============================================================================
let _sequelizeInstance = null;
let _AuthCreds         = null;
let _AuthKeys          = null;

/**
 * @param {string} [overrideUrl]  Optional URL override (used by the Supabase backend)
 */
async function _initSequelize(overrideUrl) {
    if (_sequelizeInstance) return { AuthCreds: _AuthCreds, AuthKeys: _AuthKeys };

    let Sequelize, DataTypes;
    try {
        ({ Sequelize, DataTypes } = require('sequelize'));
    } catch {
        throw new Error(
            '[authState] sequelize package not found.\n' +
            'Run: npm install sequelize sqlite3 pg pg-hstore mysql2'
        );
    }

    const dbType = (process.env.DB_TYPE || '').toLowerCase();
    let seq;

    if (dbType === 'sqlite') {
        const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/session.db');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        seq = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
    } else {
        const url = overrideUrl || process.env.DATABASE_URL;
        if (!url) {
            throw new Error(
                '[authState] DB_TYPE=' + dbType + ' requires DATABASE_URL env var.\n' +
                'Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname'
            );
        }
        const dialect  = (dbType === 'mysql' || dbType === 'mariadb') ? 'mysql' : 'postgres';
        const dialOpts = dialect === 'postgres'
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {};
        seq = new Sequelize(url, { dialect, logging: false, dialectOptions: dialOpts });
    }

    await seq.authenticate();
    console.log('[authState] Sequelize connected (' + dbType + ')');

    const AuthCreds = seq.define('AuthCreds', {
        sessionId: { type: DataTypes.STRING(64),  primaryKey: true },
        data:      { type: DataTypes.TEXT('long'), allowNull: false },
    }, { tableName: 'auth_creds', timestamps: false });

    const AuthKeys = seq.define('AuthKeys', {
        sessionId: { type: DataTypes.STRING(64),  allowNull: false },
        type:      { type: DataTypes.STRING(32),  allowNull: false },
        keyId:     { type: DataTypes.STRING(128), allowNull: false },
        data:      { type: DataTypes.TEXT('long'), allowNull: false },
    }, {
        tableName: 'auth_keys',
        timestamps: false,
        indexes: [{ unique: true, fields: ['sessionId', 'type', 'keyId'] }],
    });

    await seq.sync();

    _sequelizeInstance = seq;
    _AuthCreds         = AuthCreds;
    _AuthKeys          = AuthKeys;

    return { AuthCreds, AuthKeys };
}

async function useSequelizeAuthState(sessionId = 'main', overrideUrl) {
    const { AuthCreds, AuthKeys } = await _initSequelize(overrideUrl);

    const row   = await AuthCreds.findByPk(sessionId);
    const creds = row ? deserialize(row.data) : initAuthCreds();

    const keys = {
        get: async (type, ids) => {
            if (!ids || !ids.length) return {};
            const rows = await AuthKeys.findAll({
                where: { sessionId, type, keyId: ids },
                attributes: ['keyId', 'data'],
            });
            const result = {};
            for (const r of rows) result[r.keyId] = deserialize(r.data);
            return result;
        },
        set: async (data) => {
            const upserts = [];
            const deletes = [];
            for (const [type, keyMap] of Object.entries(data || {})) {
                for (const [keyId, value] of Object.entries(keyMap || {})) {
                    if (value != null) {
                        upserts.push(AuthKeys.upsert({ sessionId, type, keyId, data: serialize(value) }));
                    } else {
                        deletes.push(AuthKeys.destroy({ where: { sessionId, type, keyId } }));
                    }
                }
            }
            await Promise.all([...upserts, ...deletes]);
        },
    };

    const saveCreds = async () => {
        await AuthCreds.upsert({ sessionId, data: serialize(creds) });
    };

    return { state: { creds, keys }, saveCreds };
}

// =============================================================================
// BACKEND 3 — MONGODB
// =============================================================================
let _mongoConnected = false;
let _MongoCreds     = null;
let _MongoKeys      = null;

async function _initMongo() {
    if (_mongoConnected) return { MongoCreds: _MongoCreds, MongoKeys: _MongoKeys };

    let mongoose;
    try {
        mongoose = require('mongoose');
    } catch {
        throw new Error('[authState] mongoose package not found. Run: npm install mongoose');
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error(
            '[authState] DB_TYPE=mongodb requires MONGO_URI env var.\n' +
            'Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/queenriam'
        );
    }

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    }

    const CredsSchema = new mongoose.Schema(
        { sessionId: { type: String, required: true, unique: true }, data: String },
        { collection: 'auth_creds' }
    );
    const KeysSchema = new mongoose.Schema(
        {
            sessionId: { type: String, required: true },
            type:      { type: String, required: true },
            keyId:     { type: String, required: true },
            data:      String,
        },
        { collection: 'auth_keys' }
    );
    KeysSchema.index({ sessionId: 1, type: 1, keyId: 1 }, { unique: true });

    _MongoCreds     = mongoose.models.AuthCreds || mongoose.model('AuthCreds', CredsSchema);
    _MongoKeys      = mongoose.models.AuthKeys  || mongoose.model('AuthKeys',  KeysSchema);
    _mongoConnected = true;

    console.log('[authState] MongoDB connected');
    return { MongoCreds: _MongoCreds, MongoKeys: _MongoKeys };
}

async function useMongoAuthState(sessionId = 'main') {
    const { MongoCreds, MongoKeys } = await _initMongo();

    const doc   = await MongoCreds.findOne({ sessionId }).lean();
    const creds = doc ? deserialize(doc.data) : initAuthCreds();

    const keys = {
        get: async (type, ids) => {
            if (!ids || !ids.length) return {};
            const rows = await MongoKeys.find({ sessionId, type, keyId: { $in: ids } }).lean();
            const result = {};
            for (const r of rows) result[r.keyId] = deserialize(r.data);
            return result;
        },
        set: async (data) => {
            const ops = [];
            for (const [type, keyMap] of Object.entries(data || {})) {
                for (const [keyId, value] of Object.entries(keyMap || {})) {
                    if (value != null) {
                        ops.push(MongoKeys.updateOne(
                            { sessionId, type, keyId },
                            { $set: { data: serialize(value) } },
                            { upsert: true }
                        ));
                    } else {
                        ops.push(MongoKeys.deleteOne({ sessionId, type, keyId }));
                    }
                }
            }
            await Promise.all(ops);
        },
    };

    const saveCreds = async () => {
        await MongoCreds.updateOne(
            { sessionId },
            { $set: { data: serialize(creds) } },
            { upsert: true }
        );
    };

    return { state: { creds, keys }, saveCreds };
}

// =============================================================================
// BACKEND 4 — SUPABASE
//
// Uses Supabase's direct PostgreSQL connection string (SUPABASE_DB_URL).
// Tables (auth_creds, auth_keys) are auto-created — no dashboard SQL needed.
//
// How to get SUPABASE_DB_URL:
//   Supabase dashboard -> your project -> Settings -> Database ->
//   Connection string -> URI tab
//   Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
// =============================================================================
async function useSupabaseAuthState(sessionId = 'main') {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) {
        throw new Error(
            '[authState] DB_TYPE=supabase requires SUPABASE_DB_URL env var.\n' +
            'Get it from: Supabase dashboard -> Settings -> Database -> Connection string -> URI\n' +
            'Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
        );
    }

    // Strip sslmode from the URL entirely — dialectOptions handles SSL.
    // Having both sslmode=require in the URL AND dialectOptions.ssl causes
    // SELF_SIGNED_CERT_IN_CHAIN errors in newer pg versions mid-session.
    const dbUrl = url.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '');

    console.log('[authState] Supabase — connecting via direct PostgreSQL...');
    return useSequelizeAuthState(sessionId, dbUrl);
}

// =============================================================================
// BACKEND 5 — REDIS  (via ioredis)
//
// Great for: Render Redis, Railway Redis, Upstash, self-hosted Redis.
//
// Key layout (all prefixed "qriam:" to avoid collisions):
//   qriam:creds:{sessionId}              -> JSON blob of Baileys credentials
//   qriam:key:{sessionId}:{type}:{keyId} -> JSON blob of individual signal key
// =============================================================================
let _redisClient = null;

async function _initRedis() {
    if (_redisClient) return _redisClient;

    let Redis;
    try {
        Redis = require('ioredis');
    } catch {
        throw new Error(
            '[authState] ioredis package not found.\n' +
            'Run: npm install ioredis'
        );
    }

    const url = process.env.REDIS_URL;
    if (!url) {
        throw new Error(
            '[authState] DB_TYPE=redis requires REDIS_URL env var.\n' +
            'Examples:\n' +
            '  redis://localhost:6379\n' +
            '  rediss://default:[pass]@[host]:6380  (Upstash TLS)\n' +
            '  redis://default:[pass]@[host]:6379   (Render / Railway)'
        );
    }

    const isTLS = url.startsWith('rediss://');
    const client = new Redis(url, {
        tls: isTLS ? { rejectUnauthorized: false } : undefined,
        retryStrategy: (times) => Math.min(times * 200, 5000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
    });

    await new Promise((resolve, reject) => {
        client.once('ready', () => {
            console.log('[authState] Redis connected');
            resolve();
        });
        client.once('error', reject);
        setTimeout(() => reject(new Error('[authState] Redis connection timed out (10s)')), 10000);
    });

    _redisClient = client;
    return client;
}

async function useRedisAuthState(sessionId = 'main') {
    const redis = await _initRedis();

    const CREDS_KEY = 'qriam:creds:' + sessionId;
    const keyName   = (type, keyId) => 'qriam:key:' + sessionId + ':' + type + ':' + keyId;

    const credsRaw = await redis.get(CREDS_KEY);
    const creds    = credsRaw ? deserialize(credsRaw) : initAuthCreds();

    const keys = {
        get: async (type, ids) => {
            if (!ids || !ids.length) return {};
            const pipeline = redis.pipeline();
            for (const id of ids) pipeline.get(keyName(type, id));
            const results = await pipeline.exec(); // [[err, val], ...]
            const out = {};
            ids.forEach((id, i) => {
                const val = results[i][1];
                if (val) out[id] = deserialize(val);
            });
            return out;
        },

        set: async (data) => {
            const pipeline = redis.pipeline();
            for (const [type, keyMap] of Object.entries(data || {})) {
                for (const [keyId, value] of Object.entries(keyMap || {})) {
                    if (value != null) {
                        pipeline.set(keyName(type, keyId), serialize(value));
                    } else {
                        pipeline.del(keyName(type, keyId));
                    }
                }
            }
            await pipeline.exec();
        },
    };

    const saveCreds = async () => {
        await redis.set(CREDS_KEY, serialize(creds));
    };

    return { state: { creds, keys }, saveCreds };
}

// =============================================================================
// MAIN EXPORT — auto-selects backend from DB_TYPE env var
// =============================================================================
async function getAuthState(sessionDir = './session', sessionId = 'main') {
    const dbType = (process.env.DB_TYPE || '').toLowerCase().trim();

    switch (dbType) {
        case 'sqlite':
            console.log('[authState] Backend: SQLite');
            return useSequelizeAuthState(sessionId);

        case 'postgres':
        case 'postgresql':
            console.log('[authState] Backend: PostgreSQL');
            return useSequelizeAuthState(sessionId);

        case 'mysql':
        case 'mariadb':
            console.log('[authState] Backend: MySQL / MariaDB');
            return useSequelizeAuthState(sessionId);

        case 'mongodb':
        case 'mongo':
            console.log('[authState] Backend: MongoDB');
            return useMongoAuthState(sessionId);

        case 'supabase':
            console.log('[authState] Backend: Supabase (PostgreSQL)');
            return useSupabaseAuthState(sessionId);

        case 'redis':
            console.log('[authState] Backend: Redis');
            return useRedisAuthState(sessionId);

        default:
            // No DB_TYPE set -> file system (Baileys default, no config needed)
            console.log('[authState] Backend: File system (./session)');
            return useFileAuthState(sessionDir);
    }
}

module.exports = {
    getAuthState,
    useFileAuthState,
    useSequelizeAuthState,
    useSupabaseAuthState,
    useMongoAuthState,
    useRedisAuthState,
};
