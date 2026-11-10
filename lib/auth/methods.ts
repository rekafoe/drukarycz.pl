import { googleSignInMode } from "@/lib/auth/google";

export type AuthMethods = {
  email: true;
  google: "live" | "mock" | "off";
};

export function authMethods(): AuthMethods {
  return {
    email: true,
    google: googleSignInMode(),
  };
}
