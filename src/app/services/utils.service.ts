import { Injectable } from "@angular/core";
import { Tag, Variant } from "@eo4geo/ngx-bok-utils";
import { BokInformationService } from "@eo4geo/ngx-bok-visualization";
import { combineLatest, forkJoin, map, Observable, of, take } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class UtilsService {

    constructor(private bokInfo: BokInformationService) {}
    
    convertHexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    stringToTag(values: string[], variant?: Variant): Observable<Tag[]> {
        if (variant !== 'bok') return of(values.map(skill => new Tag(skill, variant ?? undefined)))
        else {
            return forkJoin(
                values.map(value =>
                    combineLatest([
                        this.bokInfo.getConceptName(value),
                        this.bokInfo.getConceptColor(value),
                    ]).pipe(
                        take(1),
                        map(([tooltip, color]) => new Tag(value, variant, tooltip, color))
                    )
                )
            );
        }
    }
}