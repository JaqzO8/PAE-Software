const v8 = require('node:v8');
// Mounted only in the isolated QA stack. Flush without interrupting requests.
process.on('SIGUSR2', () => v8.takeCoverage());
