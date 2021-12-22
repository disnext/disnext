import { APIUser } from "discord-api-types";

class User {
  #user: APIUser;

  constructor(user: APIUser) {
    this.#user = user;
  }

  get id() {
    return this.#user.id;
  }

  get username() {
    return this.#user.username;
  }

  get discriminator() {
    return this.#user.discriminator;
  }

  get email() {
    return this.#user.email;
  }

  get locale() {
    return this.#user.locale;
  }

  get bot() {
    return this.#user.bot;
  }

  get flags() {
    return this.#user.flags;
  }

  get verified() {
    return this.#user.verified;
  }

  get system() {
    return this.#user.system;
  }

  get mfaEnabled() {
    return this.#user.mfa_enabled;
  }

  get publicFlags() {
    return this.#user.public_flags;
  }

  get premiumType() {
    return this.#user.premium_type;
  }

  get accentColor() {
    return this.#user.accent_color;
  }

  get mention() {
    return `<@${this.id}>`;
  }

  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  get avatar() {
    return this.avatarHash
      ? `https://cdn.discordapp.com/avatars/${this.id}/${this.avatarHash}${
          this.avatarHash.startsWith("a_") ? ".gif" : ".png"
        }?size=24px`
      : `https://cdn.discordapp.com/embed/avatars/${
          Number(this.discriminator) % 5
        }.png`;
  }

  get avatarHash() {
    return this.#user.avatar;
  }
}

export default User;
