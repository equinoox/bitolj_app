import { SQLiteDatabase } from 'expo-sqlite';

// DODATI SOFT DELETE AND SOFT UPDATE
export const createTables = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`
          PRAGMA foreign_keys = ON;
          PRAGMA journal_mode = WAL;
  
        CREATE TABLE IF NOT EXISTS korisnik (
          id_korisnik INTEGER PRIMARY KEY AUTOINCREMENT,
          ime TEXT NOT NULL,
          prezime TEXT NOT NULL,
          sifra TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'manager', 'admin')),
          deleted TEXT NOT NULL CHECK (deleted IN ('true', 'false'))
        );
  
        CREATE TABLE IF NOT EXISTS pice (
          id_pice INTEGER PRIMARY KEY AUTOINCREMENT,
          naziv TEXT NOT NULL,
          cena TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('piece', 'liters', 'kilograms', 'other')),
          deleted TEXT NOT NULL CHECK (deleted IN ('true', 'false'))
        );
          
        CREATE TABLE IF NOT EXISTS change_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_pice INTEGER NOT NULL,
          id_korisnik INTEGER NOT NULL,
          column TEXT NOT NULL,
          old_value INTEGER NOT NULL,
          new_value INTEGER NOT NULL,
          timestamp DATETIME,
          FOREIGN KEY (id_pice) REFERENCES pice(id_pice),
          FOREIGN KEY (id_korisnik) REFERENCES korisnik(id_korisnik)
        );

        CREATE TABLE IF NOT EXISTS stavka_popisa (
          id_stavka_popisa INTEGER PRIMARY KEY AUTOINCREMENT,
          id_popis INTEGER NOT NULL,
          pocetno_stanje TEXT NOT NULL,
          uneto TEXT,
          krajnje_stanje TEXT NOT NULL,
          prodato TEXT NOT NULL,
          ukupno TEXT,
          id_pice INTEGER NOT NULL,
          FOREIGN KEY (id_pice) REFERENCES pice(id_pice) ON DELETE RESTRICT ON UPDATE RESTRICT
          FOREIGN KEY (id_popis) REFERENCES popis(id_popis) ON DELETE CASCADE ON UPDATE CASCADE
        );
  
        CREATE TABLE IF NOT EXISTS popis (
          id_popis INTEGER PRIMARY KEY AUTOINCREMENT,
          datum TEXT NOT NULL,
          kuhinja TEXT,
          kuhinjaSt TEXT,
          ostalop TEXT,
          ostalopOpis TEXT,
          wolt TEXT,
          glovo TEXT,
          kartice TEXT,
          sale TEXT,
          ostalot TEXT,
          ostalotOpis TEXT,
          virman TEXT,
          virmanOpis TEXT,
          smena TEXT NOT NULL CHECK (smena in ('prva', 'druga')),
          id_korisnik INTEGER NOT NULL,
          FOREIGN KEY (id_korisnik) REFERENCES korisnik(id_korisnik) ON DELETE RESTRICT ON UPDATE CASCADE
        );
  
      `);
    } catch (error) {
      console.log("Creating tables error: " + error)
    }
  };

export const rollbackTables = async (db: SQLiteDatabase) => {
    console.log("Rollback tables...");
    await db.execAsync(`
        DROP TABLE IF EXISTS korisnik;
        DROP TABLE IF EXISTS pice;
        DROP TABLE IF EXISTS change_history;
        DROP TABLE IF EXISTS stavka_popisa;
        DROP TABLE IF EXISTS popis;
    `);
  };
export const addAdmin = async (db: SQLiteDatabase) => {  
  try{
    console.log("Adding Admin...")
    await db.execAsync("INSERT INTO korisnik (id_korisnik, ime, prezime, sifra, role, deleted) VALUES (1, 'Aleksandar', 'Milenković', '2468', 'admin', 'false');")
  } catch (error) {
    console.log("Admin already added.")
  }
  };