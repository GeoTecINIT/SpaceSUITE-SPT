import { Tag } from "./tag";

export class TimelineObject {
    title: string = '';
    startDate: string = '';
    endDate?: string = '';
    organization?: string = '';
    city?: string = '';
    country?: string = '';
    body?: string = '';
    subjects?: Tag[] = [];
    source?: string = '';
}