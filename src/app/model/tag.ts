export class Tag {
    label: string = '';
    variant?: Variant = 'primary';

    constructor(label: string, variant?: Variant) {
        this.label = label;
        if(variant) this.variant = variant;
    }
}

export type Variant = 'primary' | 'secondary' | 'bok';