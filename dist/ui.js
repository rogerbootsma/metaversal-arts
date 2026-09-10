// Keep document content usable even when the artwork cannot initialize.
window.addEventListener('error', (event) => {
  if (event.target?.tagName === 'SCRIPT' && event.target.src.endsWith('/scene.js')) {
    document.querySelector('#scene-fallback').hidden = false;
  }
}, true);
