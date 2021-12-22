import {
  APIGuildMember,
  APIInteractionDataResolvedGuildMember,
  APIInteractionGuildMember,
} from "discord-api-types";
import User from "./User";

class Member {
  #member:
    | APIGuildMember
    | APIInteractionDataResolvedGuildMember
    | APIInteractionGuildMember;
  #guildID: string;
  constructor(
    member:
      | APIGuildMember
      | APIInteractionDataResolvedGuildMember
      | APIInteractionGuildMember,
    guildID: string
  ) {
    this.#member = member;
    this.#guildID = guildID;
  }

  get id() {
    return "user" in this.#member ? this.#member.user?.id : undefined;
  }

  get nick() {
    return this.#member.nick;
  }

  get avatar() {
    return this.avatarHash
      ? `https://cdn.discordapp.com/guilds/${this.#guildID}/users/${
          this.id
        }/avatars/${this.avatarHash}${
          this.avatarHash.startsWith("a_") ? ".gif" : ".png"
        }?size=24px`
      : undefined;
  }

  get avatarHash() {
    return this.#member.avatar;
  }

  get joinedAt() {
    return this.#member.joined_at;
  }

  get deaf() {
    return "deaf" in this.#member ? this.#member.deaf : undefined;
  }

  get mute() {
    return "mute" in this.#member ? this.#member.mute : undefined;
  }

  get premiumSince() {
    return this.#member.premium_since;
  }

  get pending() {
    return this.#member.pending;
  }

  get permissions() {
    return "permissions" in this.#member ? this.#member.permissions : undefined;
  }

  get roles() {
    return this.#member.roles;
  }

  get user() {
    return "user" in this.#member && this.#member.user
      ? new User(this.#member.user)
      : undefined;
  }

  hasPermission(permission: bigint) {
    return this.permissions
      ? !!(BigInt(this.permissions) & permission)
      : undefined;
  }

  hasRoles(roles: string[]) {
    return this.roles.find((role) => roles.includes(role));
  }

  get communicationDisabledUntil() {
    return "communication_disabled_until" in (this.#member as any)
      ? ((this.#member as any).communication_disabled_until as string)
      : undefined;
  }
}

export default Member;
