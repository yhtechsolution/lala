// Loads production TypeScript files for tests: transpiles them, resolves relative imports
// between them, and replaces native packages with small stand-ins.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

export const reactNativeStub = {
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    hairlineWidth: 1,
    absoluteFillObject: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },
  Platform: {
    OS: 'android',
    select: (options) => options.android ?? options.default,
  },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  PixelRatio: { get: () => 2, roundToNearestPixel: (value) => value },
};

export function createLoader(extraStubs = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = readFileSync(file, 'utf8');
    const module = { exports: {} };
    cache.set(file, module.exports);
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    const requireFrom = (name) => {
      if (name in extraStubs) return extraStubs[name];
      if (name === 'react-native') return reactNativeStub;
      if (name.startsWith('.')) {
        const base = resolve(dirname(file), name);
        const found = ['.ts', '.tsx', '/index.ts']
          .map((ext) => base + ext)
          .find(existsSync);
        if (found) return load(found);
      }
      return {};
    };
    try {
      vm.runInNewContext(code, {
        exports: module.exports,
        module,
        require: requireFrom,
        console,
        Proxy,
        Reflect,
        JSON,
        Math,
        Map,
        Set,
      });
    } catch (error) {
      throw new Error(`Could not load ${file}: ${error.message}`);
    }
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}
