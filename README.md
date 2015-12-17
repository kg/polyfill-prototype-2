# WebAssembly reference polyfill
This repository contains the (in-development) reference JS polyfill for WebAssembly. It offers a simple, extensible implementation of the WebAssembly binary format and a translator* that emits runnable JavaScript on the fly (to act as a substitute for a native implementation).

<sup>* Not implemented yet :-)</sup>

The reference polyfill is intended to serve as a middle ground between an interpreter and a highly-optimized polyfill, for scenarios where you need to debug a compute-heavy application. It also provides a great starting point for people who want to explore the format and is designed to be easy to integrate into tools that need to manipulate WebAssembly module files.
