import {
  APIMessageComponentEmoji,
  ButtonStyle,
  ComponentType,
} from "discord-api-types";

class Button {
  type = ComponentType.Button;
  style = ButtonStyle.Primary;
  label?: string;
  emoji?: APIMessageComponentEmoji;
  custom_id?: string;
  url?: string;
  disabled?: boolean;

  constructor(data = {}) {
    Object.assign(this, data);
    return this;
  }

  setStyle(style: ButtonStyle) {
    this.style = style;
    return this;
  }

  setLabel(label: string) {
    this.label = label;
    return this;
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
  }

  setID(id: string) {
    this.custom_id = id;
    return this;
  }
}

export default Button;
