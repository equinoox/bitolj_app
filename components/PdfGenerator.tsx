import { View, StyleSheet, Button, Modal, Platform, Alert, Linking  } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { AssetRef, requestPermissionsAsync, getAlbumsAsync, createAlbumAsync, createAssetAsync, addAssetsToAlbumAsync } from 'expo-media-library';


interface Pice {
  id_pice: number;
  naziv: string;
  cena: string;
  type: string;
  position: number;
}

interface Stavka_Popisa {
  id_stavka_popisa: number;
  id_pice: number;
  pocetno_stanje: string;
  uneto: string;
  krajnje_stanje: string;
  prodato: string;
  ukupno: string;
}

interface StavkaWithPice extends Stavka_Popisa {
  pice: Pice | undefined;
}

interface Popis {
  id_popis: number;
  datum: string;
  kuhinja: string;
  kuhinjaSt: string;
  ostalop: string;
  ostalopOpis: string;
  wolt: string;
  glovo: string;
  kartice: string;
  sale: string;
  ostalot: string;
  ostalotOpis: string;
  virman: string;
  virmanOpis: string;
  ukupno: string;
  smena: string;
  id_korisnik: number;
}

interface PdfGeneratorProps {
    title: string;
    dataStavka: Stavka_Popisa[];
    dataPopis: Popis;
    dataPice: Pice[];
    visible: boolean; 
    onClose: () => void; 
  }



  const evaluateExpression = (expression: string | null): string => {
    if (!expression) return '0';
    try {

      const result = new Function(`return (${expression})`)();
      return result.toString();
    } catch (error) {
      console.error('❌ Error evaluating expression:', error);
      return '0';
    }
  };

  const generatePdfHtml = (title: string, dataStavka: Stavka_Popisa[], dataPopis: Popis, dataPice: Pice[]) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
      @page {
        size: A4;
        margin: 10mm;
      }

      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        padding: 0;
        margin: 0;
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        font-size: 11px;
        color: black;
      }

      .title {
        text-align: center;
        font-size: 16px;
        margin-bottom: 5px;
      }

      .info-line {
        text-align: center;
        margin-bottom: 8px;
      }

      .table-title {
        text-align: center;
        font-size: 13px;
        margin: 8px 0 4px;
        font-weight: bold;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 4px 0;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 3px;
        text-align: center;
        font-size: 10px;
      }

      th {
        font-weight: bold;
      }

      tr:nth-child(even) {
        background-color: #f9f9f9;
      }

      .date {
        text-align: right;
        font-size: 9px;
        margin-bottom: 6px;
      }

      .total {
        font-weight: bold;
      }

      .description {
        margin-top: 10px;
        font-size: 10px;
      }

      .bottom-container {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
        padding: 0 10px;
      }

      .bottom-field {
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        flex: 1;
      }
    </style>
    </head>
    <body>
      <div class="date">${new Date().toLocaleDateString()}</div>
      <div class="title">Pregled Popisa</div>
      <div class="info-line">
        ID Popisa: ${dataPopis.id_popis} | Datum Popisa: ${dataPopis.datum} | Smena: ${dataPopis.smena === "prva" ? "Prva" : "Druga"} | Korisnik: ${title}
      </div>
  
      <div class="table-title">Stavke Popisa</div>
      <table>
        <thead>
          <tr>
            <th>Naziv</th>
            <th>Početak</th>
            <th>Uneto</th>
            <th>Kraj</th>
            <th>Prodato</th>
            <th>Cena</th>
            <th>Ukupno</th>
          </tr>
        </thead>
        <tbody>
          ${dataStavka
            .map((stavka: Stavka_Popisa): StavkaWithPice => {
              const matchingPice = dataPice.find((pice: Pice) => pice.id_pice === stavka.id_pice);
              return { ...stavka, pice: matchingPice };
            })
            .sort((a: StavkaWithPice, b: StavkaWithPice): number => {
              const typePriority: { [key: string]: number } = {
                'piece': 1,
                'liters': 2,
                'kilograms': 3,
                'other': 4
              };

              const priorityA = typePriority[a.pice?.type || 'other'] || 4;
              const priorityB = typePriority[b.pice?.type || 'other'] || 4;

              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }

              const posA = a.pice?.position ?? 9999;
              const posB = b.pice?.position ?? 9999;
              return posA - posB;
            })
            .map((item: StavkaWithPice) => {
              const stavka = item;
              const matchingPice = item.pice;
            return `
              <tr>
                <td>${matchingPice?.naziv || 'N/A'}</td>
                <td>${stavka.pocetno_stanje || '0'}</td>
                <td>${stavka.uneto || '0'}</td>
                <td>${stavka.krajnje_stanje}</td>
                <td>${stavka.prodato || '0'}</td>
                <td>${matchingPice?.cena || '0'}</td>
                <td class="total">${stavka.ukupno || '0'} din</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
  
      <div class="table-title">Prihodi</div>
      <table>
        <thead>
          <tr>
            <th>Kuhinja</th>
            <th>KS</th>
            <th>Ostali Prihodi</th>
            <th>Ukupno</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${dataPopis.kuhinja || '0'}</td>
            <td>${dataPopis.kuhinjaSt || '0'}</td>
            <td>${dataPopis.ostalop || '0'}</td>
            <td class="total">${
              (
                parseFloat(dataPopis.kuhinja || '0') +
                parseFloat(dataPopis.kuhinjaSt || '0') +
                parseFloat(evaluateExpression(dataPopis.ostalop) || '0')
              ).toFixed(2)
            } din</td>
          </tr>
        </tbody>
      </table>
  
      <div class="description">
        <strong>Ostali Prihodi Opis:</strong> ${dataPopis.ostalopOpis || 'N/A'}
      </div>
  
      <div class="table-title">Troškovi</div>
      <table>
        <thead>
          <tr>
            <th>Wolt</th>
            <th>Glovo</th>
            <th>Sale</th>
            <th>Kartice</th>
            <th>Ostali Troškovi</th>
            <th>Virmani</th>
            <th>Ukupno</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${dataPopis.wolt || '0'}</td>
            <td>${dataPopis.glovo || '0'}</td>
            <td>${dataPopis.sale || '0'}</td>
            <td>${dataPopis.kartice || '0'}</td>
            <td>${dataPopis.ostalot || '0'}</td>
            <td>${dataPopis.virman || '0'}</td>
            <td class="total">${
              (
                parseFloat(evaluateExpression(dataPopis.wolt) || '0') +
                parseFloat(evaluateExpression(dataPopis.glovo) || '0') +
                parseFloat(evaluateExpression(dataPopis.sale) || '0') +
                parseFloat(evaluateExpression(dataPopis.kartice) || '0') +
                parseFloat(evaluateExpression(dataPopis.ostalot) || '0') +
                parseFloat(evaluateExpression(dataPopis.virman) || '0')
              ).toFixed(2)
            } din</td>
          </tr>
        </tbody>
      </table>
  
      <div class="description">
        <strong>Ostali Troškovi Opis:</strong> ${dataPopis.ostalotOpis || 'N/A'}
      </div>
  
      <div class="description">
        <strong>Virmani Opis:</strong> ${dataPopis.virmanOpis || 'N/A'}
      </div>
  
      <div class="bottom-container">
        <div class="bottom-field">
          <strong>Piće:</strong> ${dataStavka.reduce((sum, stavka) => sum + parseFloat(stavka.ukupno || '0'), 0)} din
        </div>
        <div class="bottom-field">
          <strong>Za predaju:</strong> ${(
            dataStavka.reduce((sum, stavka) => sum + parseFloat(stavka.ukupno || '0'), 0) +
            parseFloat(dataPopis.kuhinja || '0') +
            parseFloat(dataPopis.kuhinjaSt || '0') +
            parseFloat(evaluateExpression(dataPopis.ostalop) || '0') -
            (
              parseFloat(evaluateExpression(dataPopis.wolt) || '0') +
              parseFloat(evaluateExpression(dataPopis.glovo) || '0') +
              parseFloat(evaluateExpression(dataPopis.sale) || '0') +
              parseFloat(evaluateExpression(dataPopis.kartice) || '0') +
              parseFloat(evaluateExpression(dataPopis.ostalot) || '0') +
              parseFloat(evaluateExpression(dataPopis.virman) || '0')
            )
          ).toFixed(2)} din
        </div>
      </div>
    </body>
  </html>`;
  

const PdfGenerator: React.FC<PdfGeneratorProps> = ({ 
    title = "Inventory Report", 
    dataStavka = [], 
    dataPopis,
    dataPice = [],
    visible,
    onClose
  }) => {
    const { userData, setUserData } = useAuth();

    const printToFile = async () => {
      try {
        const { uri: originalUri } = await Print.printToFileAsync({
          html: generatePdfHtml(title, dataStavka, dataPopis, dataPice),
        });
    
        const smenaFormatted = dataPopis.smena === "prva" ? "Prva" 
        : dataPopis.smena === "druga" ? "Druga" 
        : dataPopis.smena;

        const newFilename = `Popis_${dataPopis.datum}_${smenaFormatted}.pdf`;
        const directory = `${FileSystem.documentDirectory}pdfs/`;
        const newUri = `${directory}${newFilename}`;
    
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    
        await FileSystem.moveAsync({
          from: originalUri,
          to: newUri,
        });
    

        await Sharing.shareAsync(newUri, { 
          mimeType: 'application/pdf',
          dialogTitle: `Popis: ${dataPopis.datum}`,
          UTI: 'com.adobe.pdf',
        });
    
      } catch (error) {
        console.error('❌ PDF generation or sharing failed:', error);
      }
    };

    
    return (
        <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>       
            {userData?.role === "admin" && (
              <Button 
                title="Pošalji Popis" 
                onPress={printToFile}
                color="#FFA001"
              />
            )}
            <View style={{ marginTop: 10 }}>
              <Button
                title="Snimi Popis" 
                // onPress={savePopisToGallery}
                color="orange"
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button
                title="Close" 
                onPress={onClose}
                color="red"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    container: {
      padding: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
    },
  });
  

export default PdfGenerator;