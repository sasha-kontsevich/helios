import {AssetType} from "./index";

export interface AssetMeta {
    guid: string;
    type: AssetType;
    loader: string;
    dependencies?: string[];
}
