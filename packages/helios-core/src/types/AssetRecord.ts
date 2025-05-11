import {AssetType} from "./index";

export interface AssetRecord {
    guid: string;
    type: AssetType;
    loader: string;
    path: string;
    dependencies?: string[];
}
