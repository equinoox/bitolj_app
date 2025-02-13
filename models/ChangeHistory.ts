export class ChangeHistory {
    id?: number;
    id_pice: number;
    id_korisnik: number;
    korisnik_name?: string; // New field for korisnik name
    korisnik_surname?: string; // New field for korisnik name
    pice_name?: string; // New field for pice name
    old_value: number;
    new_value: number;
    timestamp?: string;
  
    constructor(
      id_pice: number,
      id_korisnik: number,
      old_value: number,
      new_value: number,
      timestamp?: string,
      korisnik_name?: string,  
      korisnik_surname?: string,  
      pice_name?: string 
    ) {
      this.id_pice = id_pice;
      this.id_korisnik = id_korisnik;
      this.korisnik_name = korisnik_name;
      this.korisnik_surname = korisnik_name;
      this.pice_name = pice_name;
      this.old_value = old_value;
      this.new_value = new_value;
      this.timestamp = timestamp;
    }
  }
  
  