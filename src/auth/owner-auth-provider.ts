import type { OwnerLoginInput } from "./login-input";

export type AuthenticatedOwnerIdentity = Readonly<{
  id: string;
  email: string;
  assuranceLevel: "aal1" | "aal2";
}>;

export type OwnerAuthenticationResult =
  | Readonly<{
      status: "authenticated";
      identity: AuthenticatedOwnerIdentity;
    }>
  | Readonly<{ status: "rejected" }>
  | Readonly<{ status: "unavailable" }>;

export interface OwnerAuthProvider {
  authenticate(input: OwnerLoginInput): Promise<OwnerAuthenticationResult>;
  terminateSession(): Promise<void>;
}
