/**
 * Patches node_modules after `npm install` to fix compatibility issues
 * between react-native-vision-camera-worklets@5.0.9 and the installed
 * react-native-worklets version.
 *
 * Patch 1 — JSIConverter+AsyncQueue.hpp
 *   Adds fallback header path for react-native-worklets@0.5.x.
 *   (For 0.8.x the original path already works; this patch is a no-op.)
 *
 * Patch 2 — createRuntimeThreadProvider.ts (src)
 *   Removes the direct JS-thread call path for setOnFrameCallback /
 *   setOnDepthFrameCallback. These must be called from the frame output's
 *   native thread. The direct call from JS silently succeeds but native
 *   ignores the callback. We always go through scheduleOnRuntime which
 *   correctly executes on the native thread via the worklet runtime.
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

function writeFile(filePath, label, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) {
      console.log(`[patch-worklets] ${label}: already up-to-date.`);
      return;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[patch-worklets] ${label}: written OK.`);
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

// ── Patch 2: Replace createRuntimeThreadProvider.ts ──────────────────────────

const PROVIDER_SRC = path.join(__dirname, '..', 'node_modules',
  'react-native-vision-camera-worklets', 'src', 'createRuntimeThreadProvider.ts');

// Build error-message helper as a string so we avoid template literal
// escaping issues inside the heredoc.
function makeErrorBlock(varName) {
  return [
    '                      try {',
    '                        ' + varName + '(depth)',
    '                      } catch (e) {',
    '                        const message =',
    "                          typeof e === 'object' && e != null && 'message' in e",
    '                            ? String((e as any).message)',
    '                            : `${e}`',
    '                        console.error(message, e)',
    '                      }',
    '                      return true',
  ].join('\n');
}

function makeFrameErrorBlock() {
  return [
    '                      try {',
    '                        onFrame(frame)',
    '                      } catch (e) {',
    '                        const message =',
    "                          typeof e === 'object' && e != null && 'message' in e",
    '                            ? String((e as any).message)',
    '                            : `${e}`',
    '                        console.error(message, e)',
    '                      }',
    '                      return true',
  ].join('\n');
}

const PATCHED_PROVIDER = [
  "import type { RuntimeThreadProvider } from 'react-native-vision-camera'",
  "import { createSerializable, scheduleOnUI, WorkletsModule } from 'react-native-worklets'",
  "import { createAsyncRunner } from './createAsyncRunner'",
  "import { createWorkletRuntimeForThread } from './createWorkletRuntimeForThread'",
  "",
  "let listenerId = 62765",
  "",
  "/**",
  " * PATCHED: Always use scheduleOnRuntime for setOnFrameCallback /",
  " * setOnDepthFrameCallback. Direct JS-thread calls silently succeed",
  " * but native ignores them (wrong thread).",
  " */",
  "export function createRuntimeThreadProvider(): RuntimeThreadProvider {",
  "  return {",
  "    createAsyncRunner() {",
  "      return createAsyncRunner()",
  "    },",
  "    createRuntimeForThread(thread) {",
  "      const runtime = createWorkletRuntimeForThread(thread)",
  "      return {",
  "        setOnDepthFrameCallback(depthOutput, onDepth) {",
  "          console.log('[RCW] setOnDepthFrameCallback called, onDepth:', onDepth != null ? 'defined' : 'null')",
  "",
  "          let hostDepthOutput: any = depthOutput",
  "          try {",
  "            hostDepthOutput = WorkletsModule.createSerializableHostObject(depthOutput)",
  "            console.log('[RCW] createSerializableHostObject(depthOutput) OK')",
  "          } catch (err) {",
  "            console.warn('[RCW] createSerializableHostObject(depthOutput) failed', err)",
  "            hostDepthOutput = depthOutput",
  "          }",
  "",
  "          try {",
  "            WorkletsModule.scheduleOnRuntime(",
  "              runtime,",
  "              createSerializable(() => {",
  "                'worklet'",
  "                if (onDepth != null) {",
  "                  try {",
  "                    hostDepthOutput.setOnDepthFrameCallback((depth: any) => {",
  makeErrorBlock('onDepth'),
  "                    })",
  "                  } catch (e) {",
  "                    console.error('[RCW] setOnDepthFrameCallback failed on runtime', e)",
  "                  }",
  "                } else {",
  "                  try {",
  "                    hostDepthOutput.setOnDepthFrameCallback(undefined)",
  "                  } catch (e) {",
  "                    console.error('[RCW] unset setOnDepthFrameCallback failed', e)",
  "                  }",
  "                }",
  "              })",
  "            )",
  "            console.log('[RCW] scheduleOnRuntime for depthOutput dispatched')",
  "          } catch (err) {",
  "            console.error('[RCW] scheduleOnRuntime failed for depthOutput', err)",
  "          }",
  "        },",
  "        setOnFrameCallback(frameOutput, onFrame) {",
  "          console.log('[RCW] setOnFrameCallback called, onFrame:', onFrame != null ? 'defined' : 'null')",
  "",
  "          let hostFrameOutput: any = frameOutput",
  "          try {",
  "            hostFrameOutput = WorkletsModule.createSerializableHostObject(frameOutput)",
  "            console.log('[RCW] createSerializableHostObject(frameOutput) OK')",
  "          } catch (err) {",
  "            console.warn('[RCW] createSerializableHostObject(frameOutput) failed', err)",
  "            hostFrameOutput = frameOutput",
  "          }",
  "",
  "          try {",
  "            WorkletsModule.scheduleOnRuntime(",
  "              runtime,",
  "              createSerializable(() => {",
  "                'worklet'",
  "                if (onFrame != null) {",
  "                  try {",
  "                    hostFrameOutput.setOnFrameCallback((frame: any) => {",
  makeFrameErrorBlock(),
  "                    })",
  "                    console.log('[RCW] setOnFrameCallback registered on native thread ✓')",
  "                  } catch (e) {",
  "                    console.error('[RCW] setOnFrameCallback failed on runtime', e)",
  "                  }",
  "                } else {",
  "                  try {",
  "                    hostFrameOutput.setOnFrameCallback(undefined)",
  "                  } catch (e) {",
  "                    console.error('[RCW] unset setOnFrameCallback failed', e)",
  "                  }",
  "                }",
  "              })",
  "            )",
  "            console.log('[RCW] scheduleOnRuntime for frameOutput dispatched')",
  "          } catch (err) {",
  "            console.error('[RCW] scheduleOnRuntime failed for frameOutput', err)",
  "          }",
  "        },",
  "      }",
  "    },",
  "    bindUIUpdatesToController(value, controller, funcName) {",
  "      const id = listenerId++",
  "      scheduleOnUI(() => {",
  "        'worklet'",
  "        value.addListener(id, (v) => {",
  "          controller[funcName](v)",
  "        })",
  "      })",
  "      return {",
  "        remove() {",
  "          scheduleOnUI(() => {",
  "            'worklet'",
  "            value.removeListener(id)",
  "          })",
  "        },",
  "      }",
  "    },",
  "  }",
  "}",
  "",
].join('\n');

writeFile(PROVIDER_SRC, 'createRuntimeThreadProvider.ts (src — frame thread fix)', PATCHED_PROVIDER);

console.log('[patch-worklets] Done.');
