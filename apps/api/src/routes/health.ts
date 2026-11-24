export function handleHealth() {
  return {
    status: 'ok',
    service: 'nudge-hint-engine-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
}
