import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically discover all *.test.js files in the tests directory
const testFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.test.js'))
  .map((file) => path.join(__dirname, file));

console.log(`Found ${testFiles.length} test suite(s): ${testFiles.map((f) => path.basename(f)).join(', ')}\n`);

let failed = false;

for (const testFile of testFiles) {
  const fileName = path.basename(testFile);
  console.log(`\n================ Running ${fileName} ================`);
  const result = spawnSync(process.execPath, ['--test', testFile], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  if (result.status !== 0) {
    console.error(`\n[FAILED] Test suite ${fileName} exited with code ${result.status}`);
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('\n[SUCCESS] All test suites passed successfully!\n');
  process.exit(0);
}
