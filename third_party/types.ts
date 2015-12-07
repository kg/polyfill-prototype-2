/*
   Copyright 2015 WebAssembly Community Group participants

   Licensed under the Apache License, Version 2.0 (the "License"),
   with a runtime exception;
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       https://github.com/WebAssembly/design/blob/master/LICENSE

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

type int16 = number;
type uint16 = number;
type int32 = number;
type uint32 = number;
type float64 = number;
type byte = number;
type charCode = number;
type char = string;

type WasmTypeId = number;

type Immediate =
 (number | Wasm.OpcodeInfo.Signature);