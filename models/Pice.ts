export class Pice{
    private id_pice?: number;
    naziv: string;
    cena: number;

    constructor(naziv: string, cena: number, id_pice?: number) {
        this.id_pice = id_pice;
        this.naziv = naziv;
        this.cena = cena;
      }
    
      //Getter and Setter for id_pice
      get idPice(): number | undefined {
        return this.id_pice;
      }
      set idPice(value: number | undefined) {
        this.id_pice = value;
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
          ID: ${this.id_pice ?? 'N/A'},
          Naziv: ${this.naziv},
          Cena: ${this.cena.toFixed(2)} RSD
        }`;
      }
}