// Prints a self-contained HTML page (a recipe card) with the browser's print
// dialog, from a hidden frame so the game stays where it is.
export function printHtml(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' });
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally {
      setTimeout(() => frame.remove(), 60000);
    }
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
}
