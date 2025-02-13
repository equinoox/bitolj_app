export class Korisnik{
    id_korisnik: number;
    ime: string;
    prezime: string;
    sifra: string;
    role: string;
    deleted: string;

    constructor(ime: string, prezime: string, sifra: string, role:string, id_korisnik: number, deleted: string){
        this.id_korisnik = id_korisnik;
        this.ime = ime;
        this.prezime = prezime;
        this.sifra = sifra;
        this.role = role;
        this.deleted = deleted;
    }
}