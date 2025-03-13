export class Pice{
    id_pice: number;
    naziv: string;
    cena: number;
    type: string;
    deleted: string;
    position: number;

    constructor(naziv: string, cena: number, id_pice: number, type: string, deleted: string, position: number) {
        this.id_pice = id_pice;
        this.naziv = naziv;
        this.cena = cena; 
        this.type = type; 
        this.deleted = deleted;
        this.position = position;
      }
}