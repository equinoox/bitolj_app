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
  
    // Getter and Setter for sale
    get saleStavka(): number {
      return this.sale;
    }
    set saleStavka(value: number) {
      if (value < 0) {
        throw new Error('Sale ne može imati negativnu vrednost.');
      }
      this.sale = value;
    }
  
    // Getter and Setter for ostalo
    get ostaloStavka(): number {
      return this.ostalot;
    }
    set ostaloStavka(value: number) {
      if (value < 0) {
        throw new Error('Ostalo ne može imati negativnu vrednost.');
      }
      this.ostalot = value;
    }
  
    // Getter and Setter for ostaloOpis
    get ostaloOpisStavka(): string {
      return this.ostalotOpis;
    }
    set ostaloOpisStavka(value: string) {
      this.ostalotOpis = value;
    }
  
    // Getter and Setter for virman
    get virmanStavka(): number {
      return this.virman;
    }
    set virmanStavka(value: number) {
      if (value < 0) {
        throw new Error('Virman ne može imati negativnu vrednost.');
      }
      this.virman = value;
    }
  
    // Getter and Setter for virmanOpis
    get virmanOpisStavka(): string {
      return this.virmanOpis;
    }
    set virmanOpisStavka(value: string) {
      this.virmanOpis = value;
    }
  
    // Getter and Setter for ukupno
    get ukupnoStavka(): number {
      return this.ukupno;
    }
    set ukupnoStavka(value: number) {
      if (value < 0) {
        throw new Error('Ukupno ne može biti negativno.');
      }
      this.ukupno = value;
    }
  
    // Getter and Setter for id_korisnik
    get idKorisnik(): number {
      return this.id_korisnik;
    }
    set idKorisnik(value: number) {
      if (value <= 0) {
        throw new Error('ID korisnika mora biti pozitivan broj.');
      }
      this.id_korisnik = value;
    }
  
    // toString Method
    toString(): string {
      return `Popis {
        ID Popis: ${this.id_popis ?? 'N/A'},
        Datum: ${this.datum.toISOString().split('T')[0]},
        Kuhinja: ${this.kuhinja.toFixed(2)},
        KuhinjaSt: ${this.kuhinjaSt.toFixed(2)},
        Wolt: ${this.wolt.toFixed(2)},
        Glovo: ${this.glovo.toFixed(2)},
        Sale: ${this.sale.toFixed(2)},
        Ostalo: ${this.ostalot.toFixed(2)},
        Ostalo Opis: ${this.ostalotOpis},
        Virman: ${this.virman.toFixed(2)},
        Virman Opis: ${this.virmanOpis},
        Ukupno: ${this.ukupno.toFixed(2)},
        ID Korisnik: ${this.id_korisnik}
      }`;
    }
  }
  