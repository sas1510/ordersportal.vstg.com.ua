import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import { transformSync } from 'esbuild';
const require = createRequire(import.meta.url);

for (const name of ['PaymentStatusV2.jsx', 'MobilePaymentsView.jsx']) {
  test(`${name} can be evaluated before rendering without an initialization error`, () => {
    const source = readFileSync(new URL(name, import.meta.url), 'utf8');
    const { code } = transformSync(source, { loader: 'jsx', format: 'cjs', target: 'es2020' });
    const module = { exports: {} };
    // Evaluate the real module body. Dependencies are inert: no network, DOM,
    // authentication or rendering is needed to expose accidental top-level calls.
    vm.runInNewContext(code, { module, exports: module.exports,
      require: (id) => id === 'react' ? require('react') : {},
    }, { filename: name, timeout: 1000 });
    assert.equal(typeof module.exports.default, 'function');
  });
}
