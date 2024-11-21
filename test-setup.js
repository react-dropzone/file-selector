// NOTE: Let us test {isSecureContext}!
Object.defineProperty(globalThis, "isSecureContext", {
  value: true,
  writable: true,
  enumerable: true,
});
