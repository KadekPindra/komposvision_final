/**
 * Patches node_modules after `npm install` to fix version mismatches.
 *
 * Patch 1 — JSIConverter+AsyncQueue.hpp
 *   react-native-vision-camera-worklets expects <worklets/RunLoop/AsyncQueue.h>
 *   but react-native-worklets@0.5.x ships it at <worklets/Public/AsyncQueue.h>.
 *
 * Patch 2 — scheduleOnRuntime export (runtimes.js + index.js)
 *   react-native-vision-camera-worklets@5.0.9 calls `scheduleOnRuntime` which
 *   was removed from the public API in react-native-worklets@0.5.x (renamed
 *   internally to `runOnRuntime`). We re-add a compatibility shim that calls
 *   WorkletsModule.scheduleOnRuntime(runtime, createSerializable(worklet))
 *   directly — without the double-wrapping wrapper that `runOnRuntime` adds —
 *   so that Nitro HostObjects in the worklet closure (e.g. frameOutput) are
 *   not double-serialized and remain accessible on the worklet runtime.
 */

const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────

function patchFile(filePath, label, patchFn) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-worklets] ${label}: not found, skipping.`);
    return;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  const patched = patchFn(original);
  if (patched === original) {
    console.log(`[patch-worklets] ${label}: nothing to patch (already applied or pattern changed).`);
    return;
  }
  fs.writeFileSync(filePath, patched, 'utf8');
  console.log(`[patch-worklets] ${label}: patched OK.`);
}

// ── Patch 1: C++ header ──────────────────────────────────────────────────────

patchFile(
  path.join(__dirname, '..', 'node_modules',
    'react-native-vision-camera-worklets', 'cpp', 'JSIConverter+AsyncQueue.hpp'),
  'JSIConverter+AsyncQueue.hpp',
  (src) => src.replace(
    '#elif __has_include(<RNWorklets/worklets/RunLoop/AsyncQueue.h>)\n' +
    '#include <RNWorklets/worklets/RunLoop/AsyncQueue.h>\n' +
    '#else\n' +
    '#error react-native-worklets Prefab not found!',
    '#elif __has_include(<RNWorklets/worklets/RunLoop/AsyncQueue.h>)\n' +
    '#include <RNWorklets/worklets/RunLoop/AsyncQueue.h>\n' +
    '#elif __has_include(<worklets/Public/AsyncQueue.h>)\n' +
    '// react-native-worklets@0.5.x path\n' +
    '#include <worklets/Public/AsyncQueue.h>\n' +
    '#else\n' +
    '#error react-native-worklets Prefab not found!',
  ),
);

// ── Patch 2a: add scheduleOnRuntime to runtimes.js ──────────────────────────

const WORKLETS_RUNTIMES = path.join(__dirname, '..', 'node_modules',
  'react-native-worklets', 'lib', 'module', 'runtimes.js');

patchFile(
  WORKLETS_RUNTIMES,
  'runtimes.js (add scheduleOnRuntime)',
  (src) => {
    const ANCHOR = '/** Configuration object for creating a worklet runtime. */';
    const SHIM =
      '/** Compatibility shim: schedule a worklet on a runtime without double-wrapping. */\n' +
      'export function scheduleOnRuntime(workletRuntime, worklet) {\n' +
      '  WorkletsModule.scheduleOnRuntime(workletRuntime, createSerializable(worklet));\n' +
      '}\n\n';
    return src.includes('export function scheduleOnRuntime')
      ? src  // already patched
      : src.replace(ANCHOR, SHIM + ANCHOR);
  },
);

// ── Patch 2b: re-export scheduleOnRuntime from index.js ─────────────────────

patchFile(
  path.join(__dirname, '..', 'node_modules',
    'react-native-worklets', 'lib', 'module', 'index.js'),
  'index.js (export scheduleOnRuntime)',
  (src) => src.replace(
    'export { createWorkletRuntime, runOnRuntime } from "./runtimes.js";',
    'export { createWorkletRuntime, runOnRuntime, scheduleOnRuntime } from "./runtimes.js";',
  ),
);

console.log('[patch-worklets] Done.');
