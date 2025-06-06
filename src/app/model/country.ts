export class Country {
    name: string;
    iso2: string;

    constructor(name: string, iso2: string) {
        this.name = name;
        this.iso2 = iso2;
    }

    toPlain(): Record<string, any> {
        return {
            name: this.name,
            iso2: this.iso2
        };
    }
}