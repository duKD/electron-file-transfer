import { createVNode, render } from "vue";
import Toast from "@/components/Toast.vue";

let toastInstance: any = null;

export function showToast(message: string, duration = 2000) {
  if (!toastInstance) {
    const container = document.createElement("div");
    const vnode = createVNode(Toast);
    render(vnode, container);
    document.body.appendChild(container);
    toastInstance = vnode.component?.exposed;
  }
  toastInstance.show(message, duration);
}
