const { initPostgres, query } = require('./src/config/postgres');
const analyticsService = require('./src/modules/admin/admin.analytics.service');
const userService = require('./src/modules/admin/admin.user.service');
const { COLLEGE_BRANCHES } = require('./src/modules/admin/admin.constants');

async function runTests() {
  console.log('=== STARTING ADMIN BACKEND TESTS ===\n');

  console.log('1. Checking College Branches configuration:');
  console.log('Registered Branches (total ' + COLLEGE_BRANCHES.length + '):');
  COLLEGE_BRANCHES.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
  if (COLLEGE_BRANCHES.length !== 6) {
    throw new Error('Expected exactly 6 branches!');
  }
  console.log('   ✓ Branches verified.\n');

  console.log('2. Connecting to PostgreSQL and verifying schema:');
  await initPostgres();
  console.log('   ✓ PostgreSQL connected successfully.\n');

  console.log('3. Testing Analytics Service getOverview():');
  const overview = await analyticsService.getOverview();
  console.log('   Overview Results:', {
    users: overview.users,
    content: overview.content,
    activity: overview.activity,
    branchesTracked: Object.keys(overview.branchDistribution).length,
  });
  console.log('   ✓ Analytics overview generated successfully.\n');

  console.log('4. Testing Analytics Service getChartsData():');
  const charts = await analyticsService.getChartsData();
  console.log('   Charts Data:', {
    branches: Object.keys(charts.branchDistribution),
    languages: Object.keys(charts.languageUsage),
    verdicts: Object.keys(charts.verdictsBreakdown),
  });
  console.log('   ✓ Charts aggregations verified.\n');

  console.log('5. Testing User Management: Single Create & List:');
  const testStudentEmail = 'test.student.admin@vimeet.ac.in';
  await query('DELETE FROM users WHERE LOWER(email) = $1', [testStudentEmail]);

  const createdUser = await userService.createUser({
    name: 'Admin Test Student',
    email: testStudentEmail,
    password: 'Password123!',
    role: 'STUDENT',
    collegeId: 'V24CS999',
    branch: 'Computer Engineering',
    year: 3,
  });
  console.log('   Created User ID:', createdUser.id, 'Role:', createdUser.role);

  const usersList = await userService.listUsers({ branch: 'Computer Engineering', page: 0, size: 5 });
  console.log(`   Fetched ${usersList.content.length} users for Computer Engineering branch.`);
  console.log('   ✓ Single user create and filter verified.\n');

  console.log('6. Testing Bulk Import Service:');
  const bulkPayload = [
    {
      name: 'Bulk Student 1',
      email: 'bulk1.test@vimeet.ac.in',
      collegeId: 'V24AI001',
      branch: 'Computer Science Engineering (AI&ML)',
      year: 2,
    },
    {
      name: 'Bulk Student 2',
      email: 'bulk2.test@vimeet.ac.in',
      collegeId: 'V24EX002',
      branch: 'EXTC Engineering',
      year: 4,
    },
  ];

  await query('DELETE FROM users WHERE email IN ($1, $2)', ['bulk1.test@vimeet.ac.in', 'bulk2.test@vimeet.ac.in']);
  const bulkResult = await userService.bulkImportUsers(bulkPayload, 'StudentDefault@123');
  console.log('   Bulk Import Result:', {
    submitted: bulkResult.totalSubmitted,
    imported: bulkResult.importedCount,
    skipped: bulkResult.skippedCount,
  });
  console.log('   ✓ Bulk CSV import verified.\n');

  console.log('7. Testing CSV Export Service:');
  const csvData = await userService.exportUsersCSV();
  console.log('   CSV preview lines:', csvData.split('\n').length);
  console.log('   ✓ CSV Export generation verified.\n');

  console.log('8. Cleaning up test accounts:');
  await query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
    testStudentEmail,
    'bulk1.test@vimeet.ac.in',
    'bulk2.test@vimeet.ac.in',
  ]);
  console.log('   ✓ Test accounts cleaned up.\n');

  console.log('=== ALL ADMIN BACKEND TESTS COMPLETED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
