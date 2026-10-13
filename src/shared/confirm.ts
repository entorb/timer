import { Dialog } from "quasar"

export function confirmDialog(title: string, onOk: () => void, message?: string) {
  Dialog.create({ title, message, cancel: true }).onOk(onOk)
}
