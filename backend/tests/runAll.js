const { run } = require('node:test');
const { spec } = require('node:test/reporters');
const path = require('path');
const mongoose = require('mongoose');

let hasFailed = false;

const testStream = run({
  files: [
    path.resolve(__dirname, 'auth.test.js'),
    path.resolve(__dirname, 'queue.test.js'),
  ],
  concurrency: 1, // Run suites sequentially
});

testStream.on('test:fail', () => {
  hasFailed = true;
});

testStream.compose(new spec()).pipe(process.stdout);

testStream.on('end', async () => {
  try {
    await mongoose.disconnect();
  } catch (e) {}
  process.exit(hasFailed ? 1 : 0);
});
