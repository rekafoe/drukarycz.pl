/**
 * BFF prosi CRM, żeby wysłała kod logowania przez swoje SMTP.
 * Przeglądarka nie mówi z CRM i nie zna SMTP. Strona nie czyta haseł poczty:
 * list wychodzi tylko z CRM (AUTH_MAIL_API_KEY i kolejka mail_jobs).
 *
 * Kontrakt CRM (gdy endpoint już jest):
 *   POST /api/mail/website/login-code
 *   X-API-Key: AUTH_MAIL_API_KEY
 *   { to, code, locale: "pl", brand: "drukarycz.pl", idempotencyKey }
 *
 * Brak CRM_URL / AUTH_MAIL_API_KEY albo błąd CRM → mock, Railway i tak wstaje.
 * AUTH_MAIL_API_KEY to nie WEBSITE_ORDER_API_KEY (ten jest do szkiców edytora).
 */

import { buildCrmUrl, crmFetchTimeoutMs, crmOrigin } from "@/lib/crm/config";

export const AUTH_MAIL_API_KEY_ENV = "AUTH_MAIL_API_KEY";

const LOGIN_CODE_PATH = "/api/mail/website/login-code";

export type MailDelivery = "crm" | "mock";

export type SendLoginCodeResult = {
  sent: boolean;
  mode: MailDelivery;
  reason?: "unset" | "unreachable" | "rejected";
};

export function authMailApiKey() {
  return (process.env.AUTH_MAIL_API_KEY ?? "").trim();
}

export function canSendAuthMail() {
  return crmOrigin().length > 0 && authMailApiKey().length > 0;
}

function loginCodeUrl() {
  return buildCrmUrl(LOGIN_CODE_PATH);
}

export async function sendLoginCodeViaCrm(input: {
  to: string;
  code: string;
  idempotencyKey: string;
}): Promise<SendLoginCodeResult> {
  const url = loginCodeUrl();
  const key = authMailApiKey();
  if (!url || !key) return { sent: false, mode: "mock", reason: "unset" };

  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(crmFetchTimeoutMs()),
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify({
        to: input.to,
        code: input.code,
        locale: "pl",
        brand: "drukarycz.pl",
        idempotencyKey: input.idempotencyKey,
      }),
    });
    if (response.ok || response.status === 202) {
      return { sent: true, mode: "crm" };
    }
    return { sent: false, mode: "mock", reason: "rejected" };
  } catch {
    return { sent: false, mode: "mock", reason: "unreachable" };
  }
}
