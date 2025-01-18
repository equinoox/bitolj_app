export class PiceT{
    naziv: string;
    cena: number;
    deleted: string;

    constructor(naziv: string, cena: number, deleted: string) {
        this.naziv = naziv;
        this.cena = cena;
        this.deleted = deleted;
      }
    
    
      // Getter and Setter for naziv
      get nazivPica(): string {
        return this.naziv;
      }
      set nazivPica(value: string) {
        if (!value || value.trim().length === 0) {
          throw new Error('Naziv ne može biti prazan.');
        }
        this.naziv = value;
      }
    
      // Getter and Setter for cena
      get cenaPica(): number {
        return this.cena;
      }
      set cenaPica(value: number) {
        if (value <= 0) {
          throw new Error('Cena mora biti pozitivna.');
        }
        this.cena = value;
      }
    
      // toString Method
      toString(): string {
        return `Pice {
          Naziv: ${this.naziv},
          Cena: ${this.cena.toFixed(2)} RSD
        }`;
      }
}