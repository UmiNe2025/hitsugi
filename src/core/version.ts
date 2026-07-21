export const APP_VERSION = __APP_VERSION__
export const COMMIT_SHA = __COMMIT_SHA__

export const APP_BUILD_LABEL = COMMIT_SHA === 'local'
  ? `${APP_VERSION} local`
  : `${APP_VERSION} ${COMMIT_SHA}`
