import config from '../../config/index.js';

/**
 * SMS Gateway BD send
 * Docs: POST https://api.smsgateway.com.bd/api/send-message
 * Body: { client_id, key, sender_id, recipient, message }
 * Panel: https://app.smsgatewaybd.com/api
 */
export async function sendViaSmsGateway({ recipient, message }) {
  if (!config.smsEnabled) {
    return { ok: true, dryRun: true, providerRef: 'dry-run' };
  }

  if (!config.smsClientId || !config.smsApiKey) {
    const err = new Error('SMS gateway is not configured (CLIENT_ID / API_KEY)');
    err.statusCode = 503;
    throw err;
  }

  const payload = {
    client_id: config.smsClientId,
    key: config.smsApiKey,
    recipient,
    message,
  };
  if (config.smsSenderId) payload.sender_id = config.smsSenderId;

  const res = await fetch(config.smsApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.msg || `SMS gateway HTTP ${res.status}`);
    err.statusCode = 502;
    err.data = data;
    throw err;
  }

  // Some gateways return 200 with error flags
  if (data && (data.error || data.status === 'error' || data.success === false)) {
    const err = new Error(data.message || data.msg || 'SMS gateway rejected message');
    err.statusCode = 502;
    err.data = data;
    throw err;
  }

  return {
    ok: true,
    dryRun: false,
    providerRef: String(data?.data?.request_id || data?.request_id || data?.id || ''),
    data,
  };
}
