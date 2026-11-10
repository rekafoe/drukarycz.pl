import { canSendAuthMail } from "@/lib/auth/crm-mail";
import { googleSignInMode } from "@/lib/auth/google";

export type AuthMethods = {
  email: true;
  mail: "crm" | "mock";
  google: "live" | "mock" | "off";
};

export function authMethods(): AuthMethods {
  return {
    email: true,
    mail: canSendAuthMail() ? "crm" : "mock",
    google: googleSignInMode(),
  };
}
