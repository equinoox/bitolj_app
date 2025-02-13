export class Popis {
    id_popis?: number;
    datum: Date;
    kuhinja: number;
    kuhinjaSt: number;
    ostalop: number;
    ostalopOpis: string;
    wolt: number;
    glovo: number;
    kartice: number;
    sale: number;
    ostalot: number;
    ostalotOpis: string;
    virman: number;
    virmanOpis: string;
    ukupno: number;
    smena: string;
    id_korisnik: number;
  
    constructor(
      datum: Date,
      kuhinja: number,
      kuhinjaSt: number,
      ostalop: number,
      ostalopOpis: string,
      wolt: number,
      glovo: number,
      kartice: number,
      sale: number,
      ostalot: number,
      ostalotOpis: string,
      virman: number,
      virmanOpis: string,
      ukupno: number,
      smena: string,
      id_korisnik: number,
      id_popis?: number
    ) {
      this.id_popis = id_popis;
      this.datum = datum;
      this.kuhinja = kuhinja;
      this.kuhinjaSt = kuhinjaSt;
      this.ostalop = ostalop;
      this.ostalopOpis = ostalopOpis;
      this.wolt = wolt;
      this.glovo = glovo;
      this.kartice = kartice;
      this.sale = sale;
      this.ostalot = ostalot;
      this.ostalotOpis = ostalotOpis;
      this.virman = virman;
      this.virmanOpis = virmanOpis;
      this.ukupno = ukupno;
      this.smena = smena;
      this.id_korisnik = id_korisnik;
    }
  
    // Getter and Setter for id_popis
    get idPopis(): number | undefined {
      return this.id_popis;
    }
    set idPopis(value: number | undefined) {
      this.id_popis = value;
    }
  
    // Getter and Setter for datum
    get datumPopisa(): Date {
      return this.datum;
    }
    set datumPopisa(value: Date) {
      this.datum = value;
    }
  
    // Getter and Setter for kuhinja
    get kuhinjaStavka(): number {
      return this.kuhinja;
    }
    set kuhinjaStavka(value: number) {
      if (value < 0) {
        throw new Error('Kuhinja ne može imati negativnu vrednost.');
      }
      this.kuhinja = value;
    }
  
    // Getter and Setter for kuhinjaSt
    get kuhinjaStavkaSt(): number {
      return this.kuhinjaSt;
    }
    set kuhinjaStavkaSt(value: number) {
      if (value < 0) {
        throw new Error('Kuhinja St ne može imati negativnu vrednost.');
      }
      this.kuhinjaSt = value;
    }
  
    // Getter and Setter for wolt
    get woltStavka(): number {
      return this.wolt;
    }
    set woltStavka(value: number) {
      if (value < 0) {
        throw new Error('Wolt ne može imati negativnu vrednost.');
      }
      this.wolt = value;
    }
  
    // Getter and Setter for glovo
    get glovoStavka(): number {
      return this.glovo;
    }
    set glovoStavka(value: number) {
      if (value < 0) {
        throw new Error('Glovo ne može imati negativnu vrednost.');
      }
      this.glovo = value;
    }
  }
  