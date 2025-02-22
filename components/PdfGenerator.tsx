import { View, StyleSheet, Button, Modal } from 'react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

interface Pice {
  id_pice: number;
  naziv: string;
  cena: string;
  // Add other Pice properties if needed
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
      // Use Function constructor for safe evaluation
      const result = new Function(`return (${expression})`)();
      return result.toString();
    } catch (error) {
      console.error('Error evaluating expression:', error);
      return '0';
    }
  };

  const generatePdfHtml = (title: string, dataStavka: Stavka_Popisa[], dataPopis: Popis, dataPice: Pice[]) => `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        /* Define A4 page size */
        @page {
          size: A4;
          margin: 20mm; /* Standard margin for A4 */
        }
  
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 0;
          margin: 0;
          width: 210mm; /* A4 width */
          height: 297mm; /* A4 height */
          box-sizing: border-box;
        }
  
        .title {
          text-align: center;
          font-size: 24px;
          margin-bottom: 15px;
          color: black;
        }
  
        .title-line {
          font-size: 18px;
          margin: 5px 0;
          color: #333;
          text-align: center;
        }
  
        .table-title {
          text-align: center;
          font-size: 20px; 
          margin-top: 20px;
          margin-bottom: 10px;
          color: black;
        }
  
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
  
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
          font-size: 14px;
        }
  
        th {
          background-color: black;
          color: white;
          font-weight: bold;
        }
  
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
  
        tr:hover {
          background-color: #f1f1f1;
        }
  
        .date {
          text-align: right;
          color: #666;
          font-size: 12px;
          margin-bottom: 15px;
        }
  
        .total {
          font-weight: bold;
          color: black;
        }
  
        .description {
          margin-top: 25px;
          font-size: 14px;
          color: #555;
        }
  
        .bottom-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
          gap: 20px;
        }
  
        .bottom-field {
          font-size: 24px;
          font-weight: bold;
        }

      </style>
    </head>
    <body>
      <div class="date">${new Date().toLocaleDateString()}</div>
      <div class="title">Pregled Popisa</div>
      <div class="title-line">ID Popisa: ${dataPopis.id_popis}</div>
      <div class="title-line">Datum Popisa: ${dataPopis.datum}</div>
      <div class="title-line">Smena Popisa: ${dataPopis.smena === "prva" ? "Prva" : "Druga"}</div>
      <div class="title-line">Korisnik: ${title}</div>
      
      <!-- First Table: Stavke Popisa -->
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
          ${dataStavka.map(stavka => {
            const matchingPice = dataPice.find(pice => pice.id_pice === stavka.id_pice);
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
  
      <!-- Second Table: Prihodi -->
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
            <td class="total">
              ${(
                parseFloat(dataPopis.kuhinja || '0') +
                parseFloat(dataPopis.kuhinjaSt || '0') +
                parseFloat(evaluateExpression(dataPopis.ostalop) || '0')
              )} din
            </td>
          </tr>
        </tbody>
      </table>
  
      <!-- Description for Ostali Prihodi Opis -->
      <div class="description">
        <strong>Ostali Prihodi Opis:</strong> ${dataPopis.ostalopOpis || 'N/A'}
      </div>
  
      <!-- Third Table: Troškovi -->
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
            <td class="total">
              ${(
                parseFloat(evaluateExpression(dataPopis.wolt) || '0') +
                parseFloat(evaluateExpression(dataPopis.glovo) || '0') +
                parseFloat(evaluateExpression(dataPopis.sale) || '0') +
                parseFloat(evaluateExpression(dataPopis.kartice) || '0') +
                parseFloat(evaluateExpression(dataPopis.ostalot) || '0') +
                parseFloat(evaluateExpression(dataPopis.virman) || '0')
              )} din
            </td>
          </tr>
        </tbody>
      </table>
  
      <!-- Description for Ostali Troskovi Opis -->
      <div class="description">
        <strong>Ostali Troškovi Opis:</strong> ${dataPopis.ostalotOpis || 'N/A'}
      </div>
  
      <!-- Description for Virmani Opis -->
      <div class="description">
        <strong>Virmani Opis:</strong> ${dataPopis.virmanOpis || 'N/A'}
      </div>
  
      <!-- Bottom Fields -->
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
  </html>
  `;

const PdfGenerator: React.FC<PdfGeneratorProps> = ({ 
    title = "Inventory Report", 
    dataStavka = [], 
    dataPopis,
    dataPice = [],
    visible,
    onClose
  }) => {
    const printToFile = async () => {
      try {
        const { uri } = await Print.printToFileAsync({
          html: generatePdfHtml(title, dataStavka, dataPopis, dataPice),
        });
        console.log('PDF saved to:', uri);
        await shareAsync(uri, { 
          UTI: '.pdf', 
          mimeType: 'application/pdf',
          dialogTitle: `Popis: ${dataPopis.datum}.pdf`
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
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
            <Button 
              title="Save as PDF" 
              onPress={printToFile}
              color="#FFA001"
            />
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