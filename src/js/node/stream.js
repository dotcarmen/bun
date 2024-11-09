// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

"use strict";

// TODO: split this into more files.
const {
  promisify: { custom: customPromisify },
} = require("node:util");

const { streamReturningOperators, promiseReturningOperators } = require("internal/streams/operators");

const compose = require("internal/streams/compose");
const { setDefaultHighWaterMark, getDefaultHighWaterMark } = require("internal/streams/state");
const { pipeline } = require("internal/streams/pipeline");
const { destroyer } = require("internal/streams/destroy");
const eos = require("internal/streams/end-of-stream");

const promises = require("node:stream/promises");
const utils = require("internal/streams/utils");
const { isArrayBufferView, isUint8Array } = require("node:util/types");

const Stream = require("internal/streams/legacy").Stream;

Stream.isDestroyed = utils.isDestroyed;
Stream.isDisturbed = utils.isDisturbed;
Stream.isErrored = utils.isErrored;
Stream.isReadable = utils.isReadable;
Stream.isWritable = utils.isWritable;
Stream.eos = eos;
Stream.Readable = require("internal/streams/readable");
const streamKeys = Object.keys(streamReturningOperators);
for (let i = 0; i < streamKeys.length; i++) {
  const key = streamKeys[i];
  const op = streamReturningOperators[key];
  function fn(...args) {
    if (new.target) {
      throw $ERR_ILLEGAL_CONSTRUCTOR();
    }
    return Stream.Readable.from(op.$apply(this, args));
  }
  Object.$defineProperty(fn, "name", { __proto__: null, value: op.name });
  Object.$defineProperty(fn, "length", { __proto__: null, value: op.length });
  Object.$defineProperty(Stream.Readable.prototype, key, {
    __proto__: null,
    value: fn,
    enumerable: false,
    configurable: true,
    writable: true,
  });
}
const promiseKeys = Object.keys(promiseReturningOperators);
for (let i = 0; i < promiseKeys.length; i++) {
  const key = promiseKeys[i];
  const op = promiseReturningOperators[key];
  function fn(...args) {
    if (new.target) {
      throw $ERR_ILLEGAL_CONSTRUCTOR();
    }
    return op.$apply(this, args);
  }
  Object.$defineProperty(fn, "name", { __proto__: null, value: op.name });
  Object.$defineProperty(fn, "length", { __proto__: null, value: op.length });
  Object.$defineProperty(Stream.Readable.prototype, key, {
    __proto__: null,
    value: fn,
    enumerable: false,
    configurable: true,
    writable: true,
  });
}
Stream.Writable = require("internal/streams/writable");
Stream.Duplex = require("internal/streams/duplex");
Stream.Transform = require("internal/streams/transform");
Stream.PassThrough = require("internal/streams/passthrough");
Stream.duplexPair = require("internal/streams/duplexpair");
Stream.pipeline = pipeline;
const { addAbortSignal } = require("internal/streams/add-abort-signal");
Stream.addAbortSignal = addAbortSignal;
Stream.finished = eos;
Stream.destroy = destroyer;
Stream.compose = compose;
Stream.setDefaultHighWaterMark = setDefaultHighWaterMark;
Stream.getDefaultHighWaterMark = getDefaultHighWaterMark;

Object.$defineProperty(Stream, "promises", {
  __proto__: null,
  configurable: true,
  enumerable: true,
  get() {
    return promises;
  },
});

Object.$defineProperty(pipeline, customPromisify, {
  __proto__: null,
  enumerable: true,
  get() {
    return promises.pipeline;
  },
});

Object.$defineProperty(eos, customPromisify, {
  __proto__: null,
  enumerable: true,
  get() {
    return promises.finished;
  },
});

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream._isArrayBufferView = isArrayBufferView;
Stream._isUint8Array = isUint8Array;
Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
  return new $Buffer(chunk.buffer, chunk.byteOffset, chunk.byteLength);
};

Stream._getNativeReadableStreamPrototype = require("internal/webstreams/adapters").getNativeReadableStreamPrototype;
Stream.NativeWritable = require("internal/webstreams/adapters").NativeWritable;

export default Stream;