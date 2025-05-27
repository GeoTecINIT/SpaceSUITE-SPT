import { Injectable } from "@angular/core";
import { Tag, Variant } from "../model/tag";

@Injectable({
    providedIn: 'root',
})
export class UtilsService {
    
    convertHexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    stringToTag(values: string[], variant?: Variant): Tag[] {
        return values.map(skill => new Tag(skill, variant ?? undefined))
    }
}