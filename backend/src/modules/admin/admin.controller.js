const analyticsService = require('./admin.analytics.service');
const userService = require('./admin.user.service');
const problemService = require('./admin.problem.service');
const contestService = require('./admin.contest.service');
const domainService = require('./domain.service');

// --- Analytics ---
async function getOverview(_req, res) {
  const data = await analyticsService.getOverview();
  res.json(data);
}

async function getChartsData(_req, res) {
  const data = await analyticsService.getChartsData();
  res.json(data);
}

// --- Users ---
async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  res.json(result);
}

async function createUser(req, res) {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}

async function bulkImportUsers(req, res) {
  const { students, defaultPassword } = req.body;
  const result = await userService.bulkImportUsers(students, defaultPassword);
  res.status(201).json(result);
}

async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  const updated = await userService.updateUserRole(id, role, req.principal.id);
  res.json(updated);
}

async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { enabled } = req.body;
  const updated = await userService.updateUserStatus(id, enabled, req.principal.id);
  res.json(updated);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const updated = await userService.updateUser(id, req.body);
  res.json(updated);
}

async function resetUserPassword(req, res) {
  const { id } = req.params;
  const { newPassword } = req.body;
  const result = await userService.resetUserPassword(id, newPassword);
  res.json(result);
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const result = await userService.deleteUser(id, req.principal.id);
  res.json(result);
}

async function exportUsersCSV(req, res) {
  const { role, branch } = req.query;
  const csv = await userService.exportUsersCSV(role, branch);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="codearena_users.csv"');
  res.send(csv);
}

// --- Problems / Questions Bank ---
async function listProblems(req, res) {
  const result = await problemService.listAllProblems(req.query);
  res.json(result);
}

async function createProblem(req, res) {
  const problem = await problemService.createProblem(req.body, req.principal);
  res.status(201).json(problem);
}

async function updateProblem(req, res) {
  const { id } = req.params;
  const updated = await problemService.updateProblem(id, req.body);
  res.json(updated);
}

async function togglePublishProblem(req, res) {
  const { id } = req.params;
  const result = await problemService.togglePublish(id);
  res.json(result);
}

async function deleteProblem(req, res) {
  const { id } = req.params;
  const result = await problemService.deleteProblem(id);
  res.json(result);
}

async function getTestCases(req, res) {
  const { id } = req.params;
  const testCases = await problemService.getTestCases(id);
  res.json(testCases);
}

async function addTestCase(req, res) {
  const { id } = req.params;
  const tc = await problemService.addTestCase(id, req.body);
  res.status(201).json(tc);
}

async function deleteTestCase(req, res) {
  const { tcId } = req.params;
  const result = await problemService.deleteTestCase(tcId);
  res.json(result);
}

// --- Contests ---
async function listContests(req, res) {
  const contests = await contestService.listAllContests(req.query);
  res.json(contests);
}

async function createContest(req, res) {
  const contest = await contestService.createContest(req.body, req.principal);
  res.status(201).json(contest);
}

async function updateContest(req, res) {
  const { id } = req.params;
  const updated = await contestService.updateContest(id, req.body);
  res.json(updated);
}

async function deleteContest(req, res) {
  const { id } = req.params;
  const result = await contestService.deleteContest(id);
  res.json(result);
}

async function getContestParticipants(req, res) {
  const { id } = req.params;
  const participants = await contestService.getContestParticipants(id);
  res.json(participants);
}

// --- Domains ---
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
  // Analytics
  getOverview,
  getChartsData,
  // Users
  listUsers,
  createUser,
  bulkImportUsers,
  updateUserRole,
  updateUserStatus,
  updateUser,
  resetUserPassword,
  deleteUser,
  exportUsersCSV,
  // Problems
  listProblems,
  createProblem,
  updateProblem,
  togglePublishProblem,
  deleteProblem,
  getTestCases,
  addTestCase,
  deleteTestCase,
  // Contests
  listContests,
  createContest,
  updateContest,
  deleteContest,
  getContestParticipants,
  // Domains
  getDomains,
  addDomain,
  removeDomain,
};
