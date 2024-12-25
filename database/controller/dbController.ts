import { SQLiteDatabase } from 'expo-sqlite';

export const createTables = async (db: SQLiteDatabase) => {
    console.log("Creating tables...");
    await db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS korisnik (
        id_korisnik INTEGER PRIMARY KEY AUTOINCREMENT,
        ime TEXT NOT NULL,
        prezime TEXT NOT NULL,
        sifra TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pice (
        id_pice INTEGER PRIMARY KEY AUTOINCREMENT,
        naziv TEXT NOT NULL,
        cena REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stavka_popisa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_popis INTEGER NOT NULL,
        pocetno_stanje REAL NOT NULL,
        uneto REAL,
        krajnje_stanje REAL NOT NULL,
        ukupno REAL,
        id_pice INTEGER NOT NULL,
        FOREIGN KEY (id_popis) REFERENCES Popis(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_pice) REFERENCES Pice(id) ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS popis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datum TEXT NOT NULL,
        kuhinja REAL,
        kuhinjaSt REAL,
        wolt REAL,
        glovo REAL,
        sale REAL,
        ostalo REAL,
        ostaloOpis TEXT,
        virman REAL,
        virmanOpis TEXT, 
        ukupno REAL,
        id_korisnik INTEGER NOT NULL,
        FOREIGN KEY (id_korisnik) REFERENCES Korisnik(id) ON UPDATE CASCADE
      );

    `);
  };