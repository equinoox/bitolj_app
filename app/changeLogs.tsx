import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, NativeScrollEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { SessionExpiredOverlay } from '../components/SessionExpiredOverlay';

interface ChangeLogItem {
  change_id: number;
  korisnik_name: string;
  korisnik_surname: string;
  pice_name: string;
  column: string;
  old_value: string;
  new_value: string;
  timestamp: string;
}

const changeLogs: React.FC = () => {

  const { userData, isSessionExpired, setUserData, resetInactivityTimeout } = useAuth();
  const logout = async () => {
    try{
      await setUserData(null);
      router.replace('/log-in');
    } catch (error) {
      console.error("Error: " + error)
    }
  };

  const database = useSQLiteContext();
  const [data, setData] = useState<ChangeLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  
  const ITEMS_PER_PAGE: number = 20;

  const loadData = useCallback(async (pageNum: number = 0, append: boolean = false): Promise<void> => {
    setLoading(true);
    
    try {
      const offset: number = pageNum * ITEMS_PER_PAGE;
      
      console.log("🔍 Loading data from database, offset:", offset);
      
      const result = await database.getAllAsync(
        `SELECT 
          ch.id AS change_id, 
          k.ime AS korisnik_name, 
          k.prezime AS korisnik_surname, 
          p.naziv AS pice_name, 
          ch.column, 
          ch.old_value, 
          ch.new_value, 
          ch.timestamp 
        FROM change_history ch 
        JOIN korisnik k ON ch.id_korisnik = k.id_korisnik 
        JOIN pice p ON ch.id_pice = p.id_pice 
        ORDER BY ch.id DESC
        LIMIT ? OFFSET ?;`,
        [ITEMS_PER_PAGE + 1, offset]
      ) as ChangeLogItem[];
      
      console.log("📊 Query returned rows:", result.length);
      if (result.length > 0) {
        console.log("📝 First row:", result[0]);
      }
      
      const hasMoreData: boolean = result.length > ITEMS_PER_PAGE;
      const itemsToShow: ChangeLogItem[] = hasMoreData ? result.slice(0, ITEMS_PER_PAGE) : result;
      
      setHasMore(hasMoreData);
      
      if (append) {
        setData(prev => [...prev, ...itemsToShow]);
      } else {
        setData(itemsToShow);
      }
      
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [database]);

  // Funkcija za osvežavanje podataka (pull-to-refresh)
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await loadData(0, false);
    setRefreshing(false);
  };

  const loadMore = (): void => {
    if (!loading && hasMore) {
      const nextPage: number = page + 1;
      setPage(nextPage);
      loadData(nextPage, true);
    }
  };

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent): boolean => {
    const paddingToBottom = 50;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  // Resetujemo podatke svaki put kada se stranica fokusira
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Screen focused, reloading data...");
      setPage(0);
      setData([]);
      setHasMore(true);
      loadData(0, false);
    }, [loadData])
  );

  // Debug: Proveri šta je u bazi
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const count = await database.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM change_history`
        );
        console.log("💾 Total rows in change_history:", count?.count);

        const lastFive = await database.getAllAsync(
          `SELECT * FROM change_history ORDER BY id DESC LIMIT 5`
        );
        // console.log("📋 Last 5 changes:", lastFive);
      } catch (error) {
        console.error("❌ Database check error:", error);
      }
    };
    
    checkDatabase();
  }, [database]);

  return (
    <SafeAreaView className="flex-1">
      <View
        className="flex-1"
        onStartShouldSetResponder={() => {
          resetInactivityTimeout();
          return false;
      }}
      >
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]} // Android
            tintColor="#3b82f6" // iOS
          />
        }
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            loadMore();
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Table Header */}
        <View className="flex-row p-3 bg-gray-100 border-b border-gray-300">
          <Text className="flex-1 font-bold">Korisnik</Text>
          <Text className="flex-1 font-bold">Piće</Text>
          <Text className="flex-1 font-bold">Kolona</Text>
          <Text className="flex-1 font-bold">Stara Vrednost</Text>
          <Text className="flex-1 font-bold">Nova Vrednost</Text>
          <Text className="flex-1 font-bold">Vreme</Text>
        </View>

        {/* Table Data */}
        {data.map((item: ChangeLogItem) => (
          <View key={item.change_id} className="flex-row p-3 border-b border-gray-200">
            <Text className="flex-1">ID: {item.change_id} {item.korisnik_name} {item.korisnik_surname}</Text>
            <Text className="flex-1">{item.pice_name}</Text>
            <Text className="flex-1">{item.column}</Text>
            <Text className="flex-1">{item.old_value}</Text>
            <Text className="flex-1">{item.new_value}</Text>
            <Text className="flex-1">{item.timestamp}</Text>
          </View>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <View className="p-5 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-2 text-gray-600">Učitavanje...</Text>
          </View>
        )}

        {/* Poruka kada nema više podataka */}
        {!hasMore && data.length > 0 && (
          <View className="p-5 items-center">
            <Text className="text-gray-500 italic">Nema više podataka</Text>
          </View>
        )}

        {/* Prazna poruka */}
        {!loading && data.length === 0 && (
          <View className="p-10 items-center">
            <Text className="text-gray-500">Nema podataka za prikaz</Text>
          </View>
        )}
      </ScrollView>
      <SessionExpiredOverlay
          visible={isSessionExpired}
          onLogout={logout}
      />
      </View>
    </SafeAreaView>
  );
}

export default changeLogs;