import { Types } from "bitecs";
import { defineComponent } from "../engine/Component";

/** Parent entity link (`target` = parent eid; `current` updated at runtime by three-plugin). */
export const Parent = defineComponent({ target: Types.eid, current: Types.eid });
