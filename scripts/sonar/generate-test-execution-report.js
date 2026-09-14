const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const output = path.join(root, 'coverage', 'sonar', 'test-execution.xml');
const inputs = process.argv.slice(2);

const xmlEscape = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const files = new Map();

for (const input of inputs) {
  const reportPath = path.resolve(root, input);
  if (!fs.existsSync(reportPath)) continue;

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  for (const suite of report.testResults || []) {
    const testPath = path.relative(root, suite.name).replaceAll('\\', '/');
    const cases = files.get(testPath) || [];

    for (const test of suite.assertionResults || []) {
      const name = [...(test.ancestorTitles || []), test.title].join(' > ');
      const duration = Math.max(0, Number(test.duration) || 0);
      const failure = (test.failureMessages || []).join('\n').trim();
      cases.push({ name, duration, status: test.status, failure });
    }
    files.set(testPath, cases);
  }
}

const body = [...files.entries()].map(([file, cases]) => {
  const testCases = cases.map((test) => {
    const result = test.status === 'failed'
      ? `<failure message="${xmlEscape(test.failure || 'Test failed')}"/>`
      : test.status === 'pending' || test.status === 'todo'
        ? '<skipped message="Test skipped"/>'
        : '';
    return `    <testCase name="${xmlEscape(test.name)}" duration="${test.duration}">${result}</testCase>`;
  }).join('\n');
  return `  <file path="${xmlEscape(file)}">\n${testCases}\n  </file>`;
}).join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `<testExecutions version="1">\n${body}\n</testExecutions>\n`, 'utf8');

const total = [...files.values()].reduce((sum, cases) => sum + cases.length, 0);
console.log(`Reporte SonarQube generado: ${total} pruebas en ${files.size} archivos.`);
