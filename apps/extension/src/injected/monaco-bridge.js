// Injected into the page world to access window.monaco directly
(function initMonacoBridge() {
  const BRIDGE_SOURCE = 'NUDGE_MONACO_BRIDGE';

  function extractMonacoCode() {
    try {
      const monaco = window.monaco;
      if (!monaco || !monaco.editor) {
        return null;
      }

      const models = monaco.editor.getModels();
      if (!models || models.length === 0) {
        return null;
      }

      const primaryModel = models[0];
      return {
        code: primaryModel.getValue(),
        language: primaryModel.getLanguageId ? primaryModel.getLanguageId() : 'unknown'
      };
    } catch (e) {
      console.warn('[Nudge Bridge] Error reading Monaco editor model:', e);
      return null;
    }
  }

  let lastSentCode = '';

  function checkAndBroadcast() {
    const data = extractMonacoCode();
    if (data && data.code !== lastSentCode) {
      lastSentCode = data.code;
      window.postMessage({
        source: BRIDGE_SOURCE,
        type: 'CODE_CHANGED',
        payload: {
          code: data.code,
          language: data.language,
          timestamp: Date.now()
        }
      }, '*');
    }
  }

  function attachListeners() {
    try {
      const monaco = window.monaco;
      if (monaco && monaco.editor && monaco.editor.getModels().length > 0) {
        const model = monaco.editor.getModels()[0];
        model.onDidChangeContent(() => {
          checkAndBroadcast();
        });
        checkAndBroadcast();
        return true;
      }
    } catch {}
    return false;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (attachListeners() || attempts > 30) {
      clearInterval(interval);
    }
  }, 500);

  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'NUDGE_CONTENT_SCRIPT' && event.data.type === 'REQUEST_CODE') {
      const data = extractMonacoCode();
      if (data) {
        window.postMessage({
          source: BRIDGE_SOURCE,
          type: 'CODE_RESPONSE',
          payload: {
            code: data.code,
            language: data.language,
            timestamp: Date.now()
          }
        }, '*');
      }
    }
  });
})();
