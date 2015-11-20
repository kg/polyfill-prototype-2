#!/bin/bash
tsc -t ES5 --rootDir . --outDir ./build -w wasm.ts moduleDecoder.ts astDecoder.ts test/tests.ts