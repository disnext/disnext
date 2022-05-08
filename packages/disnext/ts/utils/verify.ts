import { IncomingHttpHeaders } from "node:http";
import nacl from "tweetnacl";

export const verify = async (
  headers: IncomingHttpHeaders,
  data: string,
  publicKey: string
) => {
  const signature = headers["x-signature-ed25519"] as string | undefined;
  const timestamp = headers["x-signature-timestamp"] as string | undefined;

  if (!signature || !timestamp) {
    return false;
  }

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + data),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );

  if (!isVerified) {
    return false;
  }

  return true;
};
