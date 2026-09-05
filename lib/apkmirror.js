'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.apkmirror.com';
const ALLOWED_HOSTS = new Set(['apkmirror.com', 'www.apkmirror.com']);
const REQUEST_TIMEOUT_MS = 20_000;
const SEARCH_SELECTOR = 'div.appRow > div.table-row > div.table-cell:nth-child(2) > div > h5.appRowTitle.wrapText.marginZero.block-on-mobile';

function getHeaders() {
    const headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': process.env.APKMIRROR_USER_AGENT || 'Queen-Riam APKMirror client/1.0',
    };

    const authorization = String(
        process.env.APKMIRROR_AUTHORIZATION || process.env.APKMIRROR_AUTH || ''
    ).trim();
    if (!authorization && String(process.env.APKMIRROR_REQUIRE_AUTH).toLowerCase() === 'true') {
        throw new Error('APKMIRROR_AUTHORIZATION is required but not configured.');
    }
    if (authorization) {
        headers.authorization = /^(basic|bearer)\s/i.test(authorization)
            ? authorization
            : `Basic ${authorization}`;
    }

    return headers;
}

function validateApkMirrorUrl(value) {
    let parsed;
    try {
        parsed = new URL(value, BASE_URL);
    } catch (_) {
        throw new Error('Invalid APKMirror URL.');
    }

    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
        throw new Error('Only https://apkmirror.com URLs are allowed.');
    }
    return parsed.toString();
}

async function requestHtml(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            headers: getHeaders(),
            redirect: 'follow',
            signal: controller.signal,
        });
        if (!response.ok) {
            const authHint = response.status === 401 || response.status === 403
                ? ' Check APKMIRROR_AUTHORIZATION if this endpoint requires it.'
                : '';
            throw new Error(`APKMirror request failed (${response.status} ${response.statusText}).${authHint}`);
        }
        return await response.text();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('APKMirror request timed out.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function absoluteUrl(href) {
    if (!href) return null;
    try {
        return validateApkMirrorUrl(new URL(href, BASE_URL).toString());
    } catch (_) {
        return null;
    }
}

function uniqueByUrl(items) {
    const seen = new Set();
    return items.filter(item => {
        if (!item.url || seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}

function parseSearchResults(html) {
    const $ = cheerio.load(html);
    const results = [];

    $(SEARCH_SELECTOR).each((_, element) => {
        const heading = $(element);
        const row = heading.closest('.appRow');
        const anchor = heading.find('a[href]').first().length
            ? heading.find('a[href]').first()
            : row.find('a[href]').first();
        const url = absoluteUrl(anchor.attr('href'));
        const title = String(
            row.attr('title') || anchor.text() || heading.text() || 'APKMirror result'
        ).replace(/\s+/g, ' ').trim();

        if (url && title) results.push({ title, url });
    });

    return uniqueByUrl(results);
}

async function searchApkMirror(query, options = {}) {
    const search = String(query || '').trim();
    if (search.length < 2) throw new Error('Search query must contain at least 2 characters.');
    if (search.length > 80) throw new Error('Search query is too long.');

    const params = new URLSearchParams({
        post_type: 'app_release',
        searchtype: 'apk',
        s: search,
    });
    if (options.apkFilesOnly !== false) params.append('bundles[]', 'apk_files');

    const html = await requestHtml(`${BASE_URL}/?${params.toString()}`);
    return parseSearchResults(html);
}

function parseReleaseVariants(html) {
    const $ = cheerio.load(html);
    const variants = [];

    $('div.table-cell.rowheight.addseparator.expand.pad.dowrap').each((_, element) => {
        const cell = $(element);
        const row = cell.closest('.table-row').length ? cell.closest('.table-row') : cell.parent();
        const anchor = row.find('a[href]').first();
        const badge = row.find('.apkm-badge').first().text().replace(/\s+/g, ' ').trim();
        const version = cell.text().replace(/\s+/g, ' ').trim();
        const url = absoluteUrl(anchor.attr('href'));

        if (url && badge) {
            variants.push({
                title: `${version || 'APK'} [${badge}]`.trim(),
                url,
            });
        }
    });

    return uniqueByUrl(variants);
}

async function getReleaseVariants(releaseUrl) {
    const url = validateApkMirrorUrl(releaseUrl);
    const html = await requestHtml(url);
    return parseReleaseVariants(html);
}

async function resolveDownloadUrl(downloadPageUrl) {
    let current = validateApkMirrorUrl(downloadPageUrl);

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const parsed = new URL(current);
        const isFinalDownloadPage = parsed.pathname.includes('/download.php')
            || (parsed.pathname === '/download/' && parsed.searchParams.has('key'));
        if (isFinalDownloadPage) return current;

        const html = await requestHtml(current);
        const $ = cheerio.load(html);
        const href = [
            $('.center.f-sm-50 > div > a').first().attr('href'),
            $('#download-link').attr('href'),
            $('a[rel="nofollow"]').first().attr('href'),
        ].find(Boolean);

        const next = absoluteUrl(href);
        if (!next) throw new Error('APKMirror download link was not found.');
        if (next === current) return current;
        current = next;
    }

    return current;
}

/**
 * Compatibility wrapper for the original three-stage API:
 * search -> 405, release variants -> 301, download resolution -> 200.
 */
async function apkMirror(input, options = {}) {
    const value = String(input || '').trim();
    const separator = value.indexOf(';;');

    if (separator < 0) {
        return {
            result: await searchApkMirror(value, options),
            status: 405,
        };
    }

    const status = value.slice(0, separator);
    const payload = value.slice(separator + 2).trim();

    if (status === '405') {
        return { result: await getReleaseVariants(payload), status: 301 };
    }
    if (status === '301') {
        return { result: await resolveDownloadUrl(payload), status: 200 };
    }

    throw new Error('Unsupported APKMirror request stage.');
}

module.exports = {
    apkMirror,
    searchApkMirror,
    getReleaseVariants,
    resolveDownloadUrl,
    validateApkMirrorUrl,
};
