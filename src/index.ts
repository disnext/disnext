import http, { IncomingMessage, ServerResponse } from "http";
import nacl from "tweetnacl";
import { Readable } from "stream";

const streamToString = async (stream: Readable) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
};

class QuartzClient {
  private applicationID: string;
  private publicKey: string;
  private token: string;

  constructor({
    applicationID,
    publicKey,
    token,
  }: {
    applicationID: string;
    publicKey: string;
    token: string;
  }) {
    this.applicationID = applicationID;
    this.publicKey = publicKey;
    this.token = token;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    const signature = req.headers["x-signature-ed25519"] as string | undefined;
    const timestamp = req.headers["x-signature-timestamp"] as
      | string
      | undefined;

    if (!signature || !timestamp) {
      res.statusCode = 401;
      res.end();
      return;
    }

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + (await streamToString(req))),
      Buffer.from(signature, "hex"),
      Buffer.from(this.publicKey, "hex")
    );

    if (!isVerified) {
      res.statusCode = 401;
      res.end();
      return;
    }
  }

  listen(port: number, address: string) {
    http.createServer(this.handle).listen(port, address);
  }

  //   middleware({}) {
  //
  //   }

  command(options: Command) {}
}

export default QuartzClient;

// PORT
// DISCORD TOKEN
// DISCORD APPLICATION ID
// DISCORD PUBLIC KEY
