export class Pice{
    id_pice: number;
    naziv: string;
    cena: number;
    type: string;
    deleted: string;

    constructor(naziv: string, cena: number, id_pice: number, type: string, deleted: string) {
        this.id_pice = id_pice;
        this.naziv = naziv;
        this.cena = cena; 
        this.type = type; 
        this.deleted = deleted;
      }
}