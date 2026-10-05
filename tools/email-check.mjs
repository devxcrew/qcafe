import { createEmailProvider } from "@devxcrew/email";

let provider;
try {
  provider = createEmailProvider(process.env);
  await provider.verify();
  console.info("Configured SMTP connection and authentication passed. No message was sent.");
} catch {
  console.error("SMTP verification failed. Check the ignored provider configuration.");
  process.exitCode = 1;
} finally {
  provider?.close();
}
