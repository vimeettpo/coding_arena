const { query } = require('../../config/postgres');
const { BadRequestException, DuplicateResourceException, ResourceNotFoundException } = require('../../common/errors');

const DOMAIN_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const FALLBACK_DOMAINS = ['gmail.com', 'googlemail.com'];

function sanitizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return '';
  return rawDomain.toLowerCase().trim().replace(/^@+/, '');
}

/**
 * Lists all registered allowed email domains from PostgreSQL.
 */
async function listAllowedDomains() {
  try {
    const res = await query('SELECT id, domain, created_at FROM allowed_email_domains ORDER BY domain ASC');
    return res.rows.map((row) => ({
      id: row.id,
      domain: row.domain,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Error fetching allowed email domains:', err.message);
    // Return default fallback list if DB table is inaccessible
    return FALLBACK_DOMAINS.map((domain, index) => ({
      id: `fallback-${index}`,
      domain,
      createdAt: new Date().toISOString(),
    }));
  }
}

/**
 * Adds a new email domain to the whitelist.
 */
async function addAllowedDomain(rawDomain) {
  const domain = sanitizeDomain(rawDomain);

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    throw new BadRequestException('Please provide a valid domain name (e.g. vimeet.ac.in).');
  }

  try {
    const res = await query(
      'INSERT INTO allowed_email_domains (domain) VALUES ($1) RETURNING id, domain, created_at',
      [domain]
    );
    return res.rows[0];
  } catch (err) {
    if (err.code === '23505') { // Postgres unique_violation
      throw new DuplicateResourceException(`Domain "${domain}" is already in the allowed list.`);
    }
    throw err;
  }
}

/**
 * Removes an email domain from the whitelist by ID.
 */
async function removeAllowedDomain(id) {
  if (!id) {
    throw new BadRequestException('Domain ID is required.');
  }

  const res = await query('DELETE FROM allowed_email_domains WHERE id = $1 RETURNING id, domain', [id]);
  if (res.rows.length === 0) {
    throw ResourceNotFoundException.of('AllowedDomain', 'id', id);
  }

  return res.rows[0];
}

/**
 * Checks if a specific domain is currently allowed for registration.
 */
async function isDomainAllowed(rawDomain) {
  const domain = sanitizeDomain(rawDomain);
  if (!domain) return false;

  try {
    const res = await query(
      'SELECT 1 FROM allowed_email_domains WHERE LOWER(domain) = $1 LIMIT 1',
      [domain]
    );
    if (res.rows.length > 0) return true;
  } catch (err) {
    console.warn('Could not query allowed_email_domains table, checking fallback domains:', err.message);
    return FALLBACK_DOMAINS.includes(domain);
  }

  return false;
}

module.exports = {
  sanitizeDomain,
  listAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain,
  isDomainAllowed,
};
