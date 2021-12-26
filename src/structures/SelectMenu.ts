import { APIPartialEmoji, ComponentType } from "discord-api-types";

class SelectMenu {
  type = ComponentType.SelectMenu;
  custom_id?: string;
  disabled?: boolean;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  options?: {
    label: string;
    value: string;
    description?: string;
    emoji?: APIPartialEmoji;
    default?: boolean;
  }[];

  constructor(data = {}) {
    Object.assign(this, data);
    return this;
  }

  setID(id: string) {
    this.custom_id = id;
    return this;
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }

  setPlaceholder(placeholder: string) {
    this.placeholder = placeholder;
    return this;
  }

  setMinValue(value: number) {
    this.min_values = value;
    return this;
  }

  setMaxValue(value: number) {
    this.max_values = value;
    return this;
  }

  addOption(
    label: string,
    value: string,
    options?: {
      description?: string;
      emoji?: APIPartialEmoji;
      default?: boolean;
    }
  ) {
    if (!this.options) this.options = [];
    this.options.push({
      label,
      value,
      description: options?.description,
      emoji: options?.emoji,
      default: options?.default,
    });
    return this;
  }
}

export default SelectMenu;
