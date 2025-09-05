// Mock Sentry for web platform
export const init = () => {};
export const captureException = () => {};
export const captureMessage = () => {};
export const setUser = () => {};
export const setContext = () => {};
export const addBreadcrumb = () => {};
export const configureScope = () => {};
export const withScope = () => {};
export const ReactNativeTracing = class {};
export const ReactNavigationInstrumentation = class {};

export default {
  init,
  captureException,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
  configureScope,
  withScope,
  ReactNativeTracing,
  ReactNavigationInstrumentation,
};