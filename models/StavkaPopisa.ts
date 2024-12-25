export class StavkaPopisa{
    private id_stavka_popisa?: number;
    private id_popis: number;
    private pocetno_stanje: number;
    private uneto: number;
    private krajnje_stanje: number;
    private ukupno: number;
    private id_pice: number;

    constructor(
        id_popis: number,
        pocetno_stanje: number,
        uneto: number,
        krajnje_stanje: number,
        ukupno: number,
        id_pice: number,
        id_stavka_popisa?: number
      ) {
        this.id_stavka_popisa = id_stavka_popisa;
        this.id_popis = id_popis;
        this.pocetno_stanje = pocetno_stanje;
        this.uneto = uneto;
        this.krajnje_stanje = krajnje_stanje;
        this.ukupno = ukupno;
        this.id_pice = id_pice;
      }

            // Getter and Setter for id_stavka_popisa
    get idStavkaPopisa(): number | undefined {
        return this.id_stavka_popisa;
    }
    set idStavkaPopisa(value: number | undefined) {
        this.id_stavka_popisa = value;
    }

    // Getter and Setter for id_popis
    get idPopis(): number {
        return this.id_popis;
    }
    set idPopis(value: number) {
        if (value <= 0) {
        throw new Error('ID Popisa mora biti pozitivan broj.');
        }
        this.id_popis = value;
    }

    // Getter and Setter for pocetno_stanje
    get pocetnoStanje(): number {
        return this.pocetno_stanje;
    }
    set pocetnoStanje(value: number) {
        if (value < 0) {
        throw new Error('Početno stanje ne može biti negativno.');
        }
        this.pocetno_stanje = value;
    }

    // Getter and Setter for uneto
    get Uneto(): number {
        return this.uneto;
    }
    set Uneto(value: number) {
        if (value < 0) {
        throw new Error('Uneto ne može biti negativno.');
        }
        this.uneto = value;
    }

    // Getter and Setter for krajnje_stanje
    get krajnjeStanje(): number {
        return this.krajnje_stanje;
    }
    set krajnjeStanje(value: number) {
        if (value < 0) {
        throw new Error('Krajnje stanje ne može biti negativno.');
        }
        this.krajnje_stanje = value;
    }

    // Getter and Setter for ukupno
    get Ukupno(): number {
        return this.ukupno;
    }
    set Ukupno(value: number) {
        if (value < 0) {
        throw new Error('Ukupno ne može biti negativno.');
        }
        this.ukupno = value;
    }

    // Getter and Setter for id_pice
    get idPice(): number {
        return this.id_pice;
    }
    set idPice(value: number) {
        if (value <= 0) {
        throw new Error('ID Pića mora biti pozitivan broj.');
        }
        this.id_pice = value;
    }

    // toString Method
    toString(): string {
        return `Stavka_Popisa {
        ID Stavka Popisa: ${this.id_stavka_popisa ?? 'N/A'},
        ID Popis: ${this.id_popis},
        Početno Stanje: ${this.pocetno_stanje.toFixed(2)},
        Uneto: ${this.uneto.toFixed(2)},
        Krajnje Stanje: ${this.krajnje_stanje.toFixed(2)},
        Ukupno: ${this.ukupno.toFixed(2)},
        ID Pića: ${this.id_pice}
        }`;
    }
}