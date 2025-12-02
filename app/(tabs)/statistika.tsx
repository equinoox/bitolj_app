import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { SessionExpiredOverlay } from '../../components/SessionExpiredOverlay';
import { router, useFocusEffect } from 'expo-router';
import { TouchableOpacityWithReset } from '../../components/TouchableOpacityWithReset';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useSQLiteContext } from 'expo-sqlite';
// Charts (install `react-native-chart-kit` and `react-native-svg`)
import { BarChart, LineChart } from 'react-native-chart-kit';

// Types
interface PiceSummary {
  naziv: string;
  totalProdato: number;
  cena: number;
  totalZarada: number;
  type: string;
  position: number | null;
}

interface PopisOption {
  id_popis: number;
  datum: string;
  smena: string;
}

const Statistika: React.FC = () => {
  const { userData, isSessionExpired, setUserData, resetInactivityTimeout } = useAuth();
  const database = useSQLiteContext();

  // Available popis entries (datum + smena)
  const [availablePopis, setAvailablePopis] = useState<PopisOption[]>([]);
  // Selected popis IDs for range
  const [startPopisId, setStartPopisId] = useState<number | null>(null);
  const [endPopisId, setEndPopisId] = useState<number | null>(null);
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Aggregated data
  const [piceStats, setPiceStats] = useState<PiceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [grandTotalProdato, setGrandTotalProdato] = useState(0);
  const [grandTotalZarada, setGrandTotalZarada] = useState(0);
  // Chart data states (zarada per popis: date+smena)
  const [zaradaLabels, setZaradaLabels] = useState<string[]>([]);
  const [zaradaValues, setZaradaValues] = useState<number[]>([]);
  // Chart sizing for horizontal scrolling
  const screenWidth = Dimensions.get('window').width;
  // increase per-label width so long names on the x-axis have more space
  const zaradaChartWidth = Math.max(screenWidth - 48, zaradaLabels.length * 100);
  // dynamic left margin for y-axis labels width
  const maxZarada = zaradaValues.length > 0 ? Math.max(...zaradaValues) : 0;
  const maxZaradaLabel = maxZarada ? Math.round(maxZarada).toLocaleString('sr-RS') + ' RSD' : '0 RSD';
  const leftMargin = Math.min(160, Math.max(40, maxZaradaLabel.length * 8));

  // Extra totals from popis (kuhinja, wolt, glovo)
  const [totalKuhinja, setTotalKuhinja] = useState(0);
  const [totalWolt, setTotalWolt] = useState(0);
  const [totalGlovo, setTotalGlovo] = useState(0);

  const logoutConfirm = () => {
    Alert.alert(
      "Log Out",
      "Da li želite da se odjavite?",
      [{ text: "Ne", style: 'cancel' }, { text: "Da", onPress: async () => logout() }]
    );
  };

  const logout = async () => {
    try {
      await setUserData(null);
      router.replace('/log-in');
    } catch (error) {
      console.error(error);
    }
  };

  const currentDate = new Date().toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  // Load available popis entries (datum + smena)
  const loadAvailablePopis = async () => {
    try {
      const result = await database.getAllAsync<PopisOption>(
        "SELECT id_popis, datum, smena FROM popis ORDER BY id_popis DESC"
      );
      setAvailablePopis(result);
    } catch (error) {
      console.error('Error loading popis:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAvailablePopis();
    }, [])
  );

  // Get selected popis info for display
  const startPopis = availablePopis.find(p => p.id_popis === startPopisId);
  const endPopis = availablePopis.find(p => p.id_popis === endPopisId);

  // Fetch aggregated statistics for given popis range
  const fetchStatistics = async () => {
    if (!startPopisId || !endPopisId) {
      Alert.alert('Greška', 'Izaberite oba popisa.');
      return;
    }

    // Find actual date/smena for comparison
    const startP = availablePopis.find(p => p.id_popis === startPopisId);
    const endP = availablePopis.find(p => p.id_popis === endPopisId);
    if (!startP || !endP) {
      Alert.alert('Greška', 'Nevalidni popisi.');
      return;
    }

    // Compare by datum then smena (prva < druga)
    const smenaOrder = (s: string) => s === 'prva' ? 0 : 1;
    const startKey = startP.datum + smenaOrder(startP.smena);
    const endKey = endP.datum + smenaOrder(endP.smena);
    if (startKey > endKey) {
      Alert.alert('Greška', 'Početni popis mora biti pre krajnjeg popisa');
      return;
    }

    setLoading(true);
    try {

      const results = await database.getAllAsync<{ naziv: string; cena: string; totalProdato: string; type: string; position: number | null }>(`
        SELECT 
          pi.naziv,
          pi.cena,
          pi.type,
          pi.position,
          SUM(CAST(sp.prodato AS REAL)) as totalProdato
        FROM popis p
        JOIN stavka_popisa sp ON p.id_popis = sp.id_popis
        JOIN pice pi ON sp.id_pice = pi.id_pice
        WHERE (p.datum > ? OR (p.datum = ? AND (p.smena >= ? OR p.smena = 'druga')))
          AND (p.datum < ? OR (p.datum = ? AND (p.smena <= ? OR p.smena = 'prva')))
        GROUP BY pi.id_pice, pi.naziv, pi.cena, pi.type, pi.position
      `, [startP.datum, startP.datum, startP.smena, endP.datum, endP.datum, endP.smena]);

      // Sort by type priority (piece -> liters -> kilograms -> other), then by position
      const typePriority: { [key: string]: number } = {
        'piece': 1,
        'liters': 2,
        'kilograms': 3,
        'other': 4
      };

      const stats: PiceSummary[] = results.map((row) => {
        const prodato = parseFloat(row.totalProdato) || 0;
        const cena = parseFloat(row.cena) || 0;
        return {
          naziv: row.naziv,
          totalProdato: prodato,
          cena: cena,
          totalZarada: prodato * cena,
          type: row.type || 'other',
          position: row.position,
        };
      }).sort((a, b) => {
        const priorityA = typePriority[a.type] || 4;
        const priorityB = typePriority[b.type] || 4;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        const posA = a.position ?? 9999;
        const posB = b.position ?? 9999;
        return posA - posB;
      });

      setPiceStats(stats);
      setGrandTotalProdato(stats.reduce((sum, s) => sum + s.totalProdato, 0));
      setGrandTotalZarada(stats.reduce((sum, s) => sum + s.totalZarada, 0));

      // Fetch kuhinja, wolt, glovo totals from popis
      const popisTotals = await database.getAllAsync<{ totalKuhinja: string; totalWolt: string; totalGlovo: string }>(`
        SELECT 
          SUM(CAST(kuhinja AS REAL)) as totalKuhinja,
          SUM(CAST(wolt AS REAL)) as totalWolt,
          SUM(CAST(glovo AS REAL)) as totalGlovo
        FROM popis p
        WHERE (p.datum > ? OR (p.datum = ? AND (p.smena >= ? OR p.smena = 'druga')))
          AND (p.datum < ? OR (p.datum = ? AND (p.smena <= ? OR p.smena = 'prva')))
      `, [startP.datum, startP.datum, startP.smena, endP.datum, endP.datum, endP.smena]);

      if (popisTotals.length > 0) {
        setTotalKuhinja(parseFloat(popisTotals[0].totalKuhinja) || 0);
        setTotalWolt(parseFloat(popisTotals[0].totalWolt) || 0);
        setTotalGlovo(parseFloat(popisTotals[0].totalGlovo) || 0);
      }

      // Prepare chart data: totalZarada per popis (date + smena)
      const zaradaPerPopis = await database.getAllAsync<{ datum: string; smena: string; zarada: string }>(`
        SELECT p.datum, p.smena, SUM(CAST(sp.prodato AS REAL) * CAST(pi.cena AS REAL)) as zarada
        FROM popis p
        JOIN stavka_popisa sp ON p.id_popis = sp.id_popis
        JOIN pice pi ON sp.id_pice = pi.id_pice
        WHERE (p.datum > ? OR (p.datum = ? AND (p.smena >= ? OR p.smena = 'druga')))
          AND (p.datum < ? OR (p.datum = ? AND (p.smena <= ? OR p.smena = 'prva')))
        GROUP BY p.id_popis, p.datum, p.smena
        ORDER BY p.datum ASC, p.smena ASC
      `, [startP.datum, startP.datum, startP.smena, endP.datum, endP.datum, endP.smena]);

      if (zaradaPerPopis && zaradaPerPopis.length > 0) {
        setZaradaLabels(zaradaPerPopis.map(r => `${r.datum} ${r.smena === 'prva' ? '1.' : '2.'}`));
        setZaradaValues(zaradaPerPopis.map(r => parseFloat(r.zarada) || 0));
      } else {
        setZaradaLabels([]);
        setZaradaValues([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Greška', 'Došlo je do greške pri učitavanju podataka.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View
        className="flex-1"
        onStartShouldSetResponder={() => {
          resetInactivityTimeout();
          return false;
        }}
      >
        {/* Header (same as other tab pages) */}
        <View className="flex bg-secondary rounded-3xl m-4 p-4">
          {/* Logout Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-secondary rounded-md items-center"
            onPress={logoutConfirm}
          >
            <AntDesign name="logout" size={42} color="#AA0000" />
          </TouchableOpacity>

          {/* Icon and Info Row */}
          <View className="flex flex-row items-center justify-evenly">
            {/* Person Icon and Title */}
            <View className="flex mb-2 items-center space-y-2">
              <FontAwesome5 name="user" size={48} color="#FFA500" />
              <Text className="text-2xl mt-2 font-bold text-white">{userData?.ime} {userData?.prezime}</Text>
            </View>

            {/* Clock Icon and Date */}
            <View className="flex items-center space-y-2">
              <MaterialIcons name="access-time" size={48} color="#FFA500" />
              <View className="items-center">
                <Text className="text-xl text-white">Današnji Datum</Text>
                <Text className="text-xl text-white">{currentDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {userData?.role === 'admin' ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
            <View className="px-4">
              <View className="flex justify-center items-center m-4">
                <Text className="font-semibold text-3xl">Statistika Menu</Text>
                <View className="mt-4 w-full border-t-2 border-black" />
              </View>

              {/* Popis Pickers (datum + smena) */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Od popisa:</Text>
                <View className="border border-gray-300 bg-white rounded-md">
                  <Picker
                    selectedValue={startPopisId}
                    onValueChange={(value) => setStartPopisId(value)}
                  >
                    <Picker.Item label="[Izaberite popis]" value={null} />
                    {availablePopis.map((p) => (
                      <Picker.Item 
                        key={p.id_popis} 
                        label={`${p.datum} - ${p.smena === 'prva' ? 'Prva' : 'Druga'} smena`} 
                        value={p.id_popis} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Do popisa:</Text>
                <View className="border border-gray-300 bg-white rounded-md">
                  <Picker
                    selectedValue={endPopisId}
                    onValueChange={(value) => setEndPopisId(value)}
                  >
                    <Picker.Item label="[Izaberite popis]" value={null} />
                    {availablePopis.map((p) => (
                      <Picker.Item 
                        key={p.id_popis} 
                        label={`${p.datum} - ${p.smena === 'prva' ? 'Prva' : 'Druga'} smena`} 
                        value={p.id_popis} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Category Filter */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Kategorija:</Text>
                <View className="border border-gray-300 bg-white rounded-md">
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value)}
                  >
                    <Picker.Item label="Sve kategorije" value="all" />
                    <Picker.Item label="Piće (kom)" value="piece" />
                    <Picker.Item label="Piće (ml)" value="liters" />
                    <Picker.Item label="Piće (g)" value="kilograms" />
                    <Picker.Item label="Piće (Ostalo)" value="other" />
                    <Picker.Item label="Kuhinja" value="kuhinja" />
                    <Picker.Item label="Wolt" value="wolt" />
                    <Picker.Item label="Glovo" value="glovo" />
                  </Picker>
                </View>
              </View>

              {/* Fetch Button */}
              <TouchableOpacityWithReset
                className="bg-orange rounded-lg py-3 mb-4"
                onPress={fetchStatistics}
                disabled={loading}
              >
                <Text className="text-black font-bold text-center">
                  {loading ? 'Učitavanje...' : 'Prikaži Statistiku'}
                </Text>
              </TouchableOpacityWithReset>

              {/* Results */}
              {piceStats.length === 0 && !loading && (selectedCategory === 'all' || ['piece', 'liters', 'kilograms', 'other'].includes(selectedCategory)) && (
                <Text className="text-center text-gray-400">Nema podataka za prikaz. Izaberite datume.</Text>
              )}

              {/* Kuhinja, Wolt, Glovo display */}
              {selectedCategory === 'kuhinja' && piceStats.length > 0 && (
                <View className="bg-secondary rounded-lg p-4 shadow">
                  <Text className="text-lg font-bold mb-2 text-center text-white">Kuhinja: {startPopis?.datum} - {endPopis?.datum}</Text>
                  <Text className="text-2xl font-bold text-center text-green-500">+ {totalKuhinja.toFixed(2)} RSD</Text>
                </View>
              )}

              {selectedCategory === 'wolt' && piceStats.length > 0 && (
                <View className="bg-secondary rounded-lg p-4 shadow">
                  <Text className="text-lg font-bold mb-2 text-center text-white">Wolt: {startPopis?.datum} - {endPopis?.datum}</Text>
                  <Text className="text-2xl font-bold text-center text-red-600">- {totalWolt.toFixed(2)} RSD</Text>
                </View>
              )}

              {selectedCategory === 'glovo' && piceStats.length > 0 && (
                <View className="bg-secondary rounded-lg p-4 shadow">
                  <Text className="text-lg font-bold mb-2 text-center text-white">Glovo: {startPopis?.datum} - {endPopis?.datum}</Text>
                  <Text className="text-2xl font-bold text-center text-red-600">- {totalGlovo.toFixed(2)} RSD</Text>
                </View>
              )}

              {/* Piće stats display */}
              {piceStats.length > 0 && (selectedCategory === 'all' || ['piece', 'liters', 'kilograms', 'other'].includes(selectedCategory)) && (() => {
                // Filter stats by category
                const filteredStats = selectedCategory === 'all' 
                  ? piceStats 
                  : piceStats.filter(item => item.type === selectedCategory);
                const filteredTotalProdato = filteredStats.reduce((sum, s) => sum + s.totalProdato, 0);
                const filteredTotalZarada = filteredStats.reduce((sum, s) => sum + s.totalZarada, 0);

                const categoryLabels: { [key: string]: string } = {
                  'all': 'Sve',
                  'piece': 'Piće (kom)',
                  'liters': 'Piće (ml)',
                  'kilograms': 'Piće (g)',
                  'other': 'Piće (Ostalo)'
                };

                return (
                  <View className="bg-secondary rounded-lg p-4 shadow overflow-hidden">
                    {/* Header block styled to blend with the navbar */}
                    <View className="items-center mb-3 bg-secondary rounded-md px-4 py-3 w-full">
                      <Text className="text-lg font-bold text-center text-white">{categoryLabels[selectedCategory]}</Text>
                      <Text className="text-lg text-center text-white">Od: {startPopis?.datum} [{startPopis?.smena === 'prva' ? 'Prva Smena' : startPopis?.smena === 'druga' ? 'Druga Smena' : ''}]</Text>
                      <Text className="text-lg text-center text-white">Do: {endPopis?.datum} [{endPopis?.smena === 'prva' ? 'Prva Smena' : endPopis?.smena === 'druga' ? 'Druga Smena' : ''}]</Text>
                    </View>

                    {/* Table Header and Rows: keep white for contrast inside a white inner container that stretches edge-to-edge */}
                    <View className="bg-white px-2 -mx-4">
                      <View className="flex-row border-b border-gray-300 pb-2 mb-2">
                      <Text className="flex-1 font-semibold">Piće</Text>
                      <Text className="w-20 text-right font-semibold">Prodato</Text>
                      <Text className="w-20 text-right font-semibold">Cena</Text>
                      <Text className="w-24 text-right font-semibold">Ukupno</Text>
                    </View>

                    {/* Rows */}
                      {filteredStats.map((item, idx) => (
                        <View key={idx} className="flex-row py-2 border-b border-gray-100">
                        <Text className="flex-1">{item.naziv}</Text>
                        <Text className="w-20 text-right">{item.totalProdato}</Text>
                        <Text className="w-20 text-right">{item.cena}</Text>
                        <Text className="w-24 text-right">{item.totalZarada.toFixed(0)} RSD</Text>
                      </View>
                    ))}

                    {/* Grand Totals */}
                    </View>
                    {/* dashed separator above totals */}
                    <View style={{ borderTopWidth: 1, borderColor: '#ffffff', borderStyle: 'dashed', marginTop: 12 }} />
                    {/* Totals row: blend with navbar for emphasis */}
                    <View className="flex-row mt-3 pt-3 border-t-0 bg-secondary rounded-b-md px-3 py-2 items-center">
                      <Text className="flex-1 font-bold text-lg text-white">UKUPNO</Text>
                      <Text className="w-20 text-right font-bold text-lg text-white">
                        {selectedCategory === 'all' ? '' : (
                          <>{filteredTotalProdato}{selectedCategory === 'piece' ? ' kom' : selectedCategory === 'liters' ? ' ml' : selectedCategory === 'kilograms' ? ' g' : ''}</>
                        )}
                      </Text>
                      <Text className="w-20 text-right" />
                      <Text className="w-24 text-right font-bold text-lg text-white">{filteredTotalZarada} RSD</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Chart: Zarada po Popisu (date + smena) */}
              {zaradaValues.length > 0 && (
                <View className="mt-6">
                  <Text className="text-lg font-bold mb-2 text-black">Zarada: {startPopis?.datum} - {endPopis?.datum}</Text>
                  <View className="bg-secondary rounded-lg p-2 shadow mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <View style={{ width: zaradaChartWidth, position: 'relative' }}>
                        <LineChart
                          data={{ labels: zaradaLabels, datasets: [{ data: zaradaValues }] }}
                          width={zaradaChartWidth}
                          height={300}
                          fromZero
                          yAxisLabel=""
                          yAxisSuffix=" RSD"
                          onDataPointClick={(data: any) => {
                            const value = data.value ?? data;
                            const label = zaradaLabels[data.index] || '';
                            Alert.alert(
                              'Zarada',
                              `${label}\n\n${Math.round(value).toLocaleString('sr-RS')} RSD`
                            );
                          }}
                          bezier
                          withDots={true}
                          chartConfig={{
                            backgroundGradientFrom: '#393B44',
                            backgroundGradientTo: '#22313f',
                            decimalPlaces: 0,
                            propsForLabels: { dx: 8 },
                            propsForDots: { r: '6', strokeWidth: '2', stroke: '#FFA001' },
                            color: (opacity = 1) => `rgba(255,160,1,${opacity})`,
                            labelColor: () => '#F1F3F8',
                            style: { borderRadius: 24 },
                          }}
                          style={{ borderRadius: 8, paddingLeft: 12 }}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View className="mt-8 p-4 bg-red-100 rounded-lg justify-center items-center mx-6">
            <MaterialIcons name="cancel" size={74} color="#393B44" />
            <Text className="text-red-600 text-center text-lg mt-4">
              Ne možete pristupiti jer nemate administratorske privilegije.
            </Text>
          </View>
        )}

        <SessionExpiredOverlay visible={isSessionExpired} onLogout={logout} />
      </View>
    </SafeAreaView>
  );
};

export default Statistika;
