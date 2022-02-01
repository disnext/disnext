import {
  APIGuildMember,
  APIInteractionDataResolvedGuildMember,
  APIInteractionGuildMember,
} from "discord-api-types";
import { DiscordAPI } from "../util";
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

  async timeout(timeout: number, reason?: string) {
    await DiscordAPI.patch(
      `/guilds/${this.#guildID}/members/${this.user?.id}`,
      {
        communication_disabled_until: Date.now() + timeout,
      },
      {
        headers: reason
          ? {
              "X-Audit-Log-Reason": reason,
            }
          : {},
      }
    );
  }

  async ban(): Promise<void>;
  async ban(deleteMessageDays: number): Promise<void>;
  async ban(reason: string, deleteMessageDays?: number): Promise<void>;
  async ban(
    reasonOrDays?: string | number,
    deleteMessageDays?: number
  ): Promise<void> {
    let body: {
      delete_message_days?: number;
    } = {};

    if (typeof reasonOrDays === "number")
      body.delete_message_days = reasonOrDays;
    else if (typeof deleteMessageDays === "number")
      body.delete_message_days = deleteMessageDays;

    await DiscordAPI.put(
      `/guilds/${this.#guildID}/bans/${this.user?.id}`,
      body,
      {
        headers:
          reasonOrDays && typeof reasonOrDays === "string"
            ? {
                "X-Audit-Log-Reason": reasonOrDays,
              }
            : {},
      }
    );
  }

  async kick(reason?: string): Promise<void> {
    await DiscordAPI.delete(
      `/guilds/${this.#guildID}/members/${this.user?.id}`,
      {
        headers: reason
          ? {
              "X-Audit-Log-Reason": reason,
            }
          : {},
      }
    );
  }

  get communicationDisabledUntil() {
    return "communication_disabled_until" in this.#member
      ? this.#member.communication_disabled_until
      : undefined;
  }
}

export default Member;
