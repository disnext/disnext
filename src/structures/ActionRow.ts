import { ComponentType } from "discord-api-types";
import Button from "./Button";
import SelectMenu from "./SelectMenu";

class ActionRow {
  type = ComponentType.ActionRow;
  components: (Button | SelectMenu)[] = [];

  constructor(data = {}) {
    Object.assign(this, data);
    return this;
  }

  addButton(button: Button) {
    this.components.push(button);
    return this;
  }

  addSelectMenu(selectMenu: SelectMenu) {
    this.components.push(selectMenu);
    return this;
  }
}

export default ActionRow;
