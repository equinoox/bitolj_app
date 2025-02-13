export class StavkaPopisa{
    id_stavka_popisa: number;
    id_popis: number;
    pocetno_stanje: number;
    uneto: number;
    krajnje_stanje: number;
    ukupno: number;
    id_pice: number;

    constructor(
        id_popis: number,
        pocetno_stanje: number,
        uneto: number,
        krajnje_stanje: number,
        ukupno: number,
        id_pice: number,
        id_stavka_popisa: number
      ) {
        this.id_stavka_popisa = id_stavka_popisa;
        this.id_popis = id_popis;
        this.pocetno_stanje = pocetno_stanje;
        this.uneto = uneto;
        this.krajnje_stanje = krajnje_stanje;
        this.ukupno = ukupno;
        this.id_pice = id_pice;
      }

}