import type { IdentitySchema } from "@devxcrew/platform";

export interface DatabaseSchema extends IdentitySchema {
  application_metadata: {
    key: string;
    value: string;
  };
}
