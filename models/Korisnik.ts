export class Korisnik{
    private id_korisnik?: number;
    ime: string;
    prezime: string;
    private sifra: string;

    constructor(ime: string, prezime: string, sifra: string, id_korisnik?: number){
        this.id_korisnik = id_korisnik;
        this.ime = ime;
        this.prezime = prezime;
        this.sifra = sifra;
    }

    // Getter and Setter for id_korisnik
    get idKorisnik(): number | undefined {
        return this.id_korisnik;
    }
    set idKorisnik(value: number | undefined) {
        this.id_korisnik = value;
    }

    // Getter and Setter for ime
    get imeKorisnika(): string {
        return this.ime;
    }
    set imeKorisnika(value: string) {
        if (!value || value.trim().length === 0) {
        throw new Error('Ime ne može biti prazno.');
        }
        this.ime = value;
    }

    // Getter and Setter for prezime
    get prezimeKorisnika(): string {
        return this.prezime;
    }
    set prezimeKorisnika(value: string) {
        if (!value || value.trim().length === 0) {
        throw new Error('Prezime ne može biti prazno.');
        }
        this.prezime = value;
    }

    // Getter and Setter for sifra
    get sifraKorisnika(): string {
        return this.sifra;
    }
    set sifraKorisnika(value: string) {
        if (value.length < 6) {
        throw new Error('Šifra mora imati najmanje 6 karaktera.');
        }
        this.sifra = value;
    }

    toString(): string {
        return `Korisnik {
          ID: ${this.id_korisnik ?? 'N/A'},
          Ime: ${this.ime},
          Prezime: ${this.prezime},
          Šifra: ${'*'.repeat(this.sifra.length)}
        }`;
      }

}