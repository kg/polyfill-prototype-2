#!/bin/bash
tsc -t ES5 --rootDir . --outDir ./build -w moduleDecoder.ts astDecoder.ts test/tests.ts