const domainService = require('./domain.service');

async function getDomains(_req, res) {
  const domains = await domainService.listAllowedDomains();
  res.json(domains);
}

async function addDomain(req, res) {
  const { domain } = req.body;
  const created = await domainService.addAllowedDomain(domain);
  res.status(201).json(created);
}

async function removeDomain(req, res) {
  const { id } = req.params;
  const deleted = await domainService.removeAllowedDomain(id);
  res.json({ message: `Domain "${deleted.domain}" removed successfully.`, id: deleted.id });
}

module.exports = {
  getDomains,
  addDomain,
  removeDomain,
};
