// 軽量トースト — storeに触れず、モジュールレベルのsink経由で通知を出す。
// Toaster(App内)が購読し、emitToast()で誰でも1行の獲得通知を飛ばせる。

export type ToastKind = 'codex' | 'region' | 'info'
type ToastSink = (msg: string, kind: ToastKind) => void

let sink: ToastSink | null = null

export function setToastSink(fn: ToastSink | null): void {
  sink = fn
}

export function emitToast(msg: string, kind: ToastKind = 'info'): void {
  sink?.(msg, kind)
}
