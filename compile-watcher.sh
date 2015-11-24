#!/bin/bash
tsc -t ES5 --rootDir . --outDir ./build -w wasm.ts opcodes.ts moduleDecoder.ts astDecoder.ts test/tests.ts