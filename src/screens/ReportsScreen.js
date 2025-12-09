import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions, RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { getSessions } from '../utils/storage';

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todaySeconds: 0,
    totalSeconds: 0,
    totalDistractions: 0,
    barChartData: [0, 0, 0, 0, 0, 0, 0], 
    barChartLabels: [],
    categoryData: [], // Pie Chart verisi
    categoryRaw: {}   // Hesaplamalar için ham veri
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, []);

  const loadData = async () => {
    const sessions = await getSessions();
    processData(sessions);
  };

  const processData = (sessions) => {
    let todaySecs = 0;
    let totalSecs = 0;
    let totalDistractions = 0;
    const categoryCounts = {};
    const today = new Date();

    const isSameDay = (d1, d2) => {
      return d1.getDate() === d2.getDate() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getFullYear() === d2.getFullYear();
    };

    // --- SON 7 GÜN (BAR CHART) ---
    const last7DaysData = [];
    const last7DaysLabels = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      last7DaysLabels.push(dayName);

      const dayTotalSeconds = sessions.reduce((acc, session) => {
        const sessionDate = new Date(session.date);
        if (isSameDay(sessionDate, d)) return acc + session.duration;
        return acc;
      }, 0);
      last7DaysData.push(parseFloat((dayTotalSeconds / 60).toFixed(1))); 
    }

    // --- GENEL TOPLAMLAR ---
    sessions.forEach(session => {
      totalSecs += session.duration;
      totalDistractions += session.distractionCount;
      if (isSameDay(new Date(session.date), today)) todaySecs += session.duration;

      if (categoryCounts[session.category]) {
        categoryCounts[session.category] += session.duration;
      } else {
        categoryCounts[session.category] = session.duration;
      }
    });

    // --- PIE CHART FORMATI ---
    const pieColors = ['#6C5CE7', '#00CEC9', '#FFA502', '#FF6348', '#a29bfe'];
    const pieData = Object.keys(categoryCounts).map((key, index) => ({
      name: key,
      population: parseFloat((categoryCounts[key] / 60).toFixed(1)), // Dakika
      color: pieColors[index % pieColors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
      rawSeconds: categoryCounts[key] // Hesaplama için saniyeyi sakla
    }));

    setStats({
      todaySeconds: todaySecs,
      totalSeconds: totalSecs,
      totalDistractions,
      barChartData: last7DaysData,
      barChartLabels: last7DaysLabels,
      categoryData: pieData,
      categoryRaw: categoryCounts
    });
  };

  // Zaman Formatlayıcı
  const renderTimeValue = (totalSeconds, small = false) => {
    if (totalSeconds < 60) {
      return <Text style={small ? styles.valTextSmall : styles.valueText}>{totalSeconds} <Text style={styles.unitText}>sn</Text></Text>;
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return (
        <Text style={small ? styles.valTextSmall : styles.valueText}>
          {hours}<Text style={styles.unitText}>sa</Text> {minutes > 0 && <Text>{minutes}<Text style={styles.unitText}>dk</Text></Text>}
        </Text>
      );
    }
    return <Text style={small ? styles.valTextSmall : styles.valueText}>{minutes} <Text style={styles.unitText}>dk</Text></Text>;
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>İstatistikler</Text>
          <Text style={styles.headerSubtitle}>Odaklanma performansın</Text>
        </View>
        <Ionicons name="stats-chart" size={32} color="#6C5CE7" style={styles.headerIcon}/>
      </View>

      {/* --- KARTLAR --- */}
      <View style={styles.cardsRow}>
        <View style={[styles.statCard, { backgroundColor: '#F3F0FF' }]}>
          <View style={styles.iconWrapper}><Ionicons name="today" size={20} color="#6C5CE7" /></View>
          <Text style={styles.cardLabel}>Bugün</Text>
          {renderTimeValue(stats.todaySeconds)}
        </View>

        <View style={[styles.statCard, { backgroundColor: '#E0F7FA' }]}>
          <View style={styles.iconWrapper}><Ionicons name="hourglass" size={20} color="#00CEC9" /></View>
          <Text style={styles.cardLabel}>Toplam</Text>
          {renderTimeValue(stats.totalSeconds)}
        </View>
      </View>

      {/* DİKKAT DAĞINIKLIĞI */}
      <View style={[styles.fullWidthCard, { backgroundColor: '#FFF0F0' }]}>
          <View style={styles.rowCenter}>
            <View style={[styles.iconWrapper, {backgroundColor: '#FFEBEE'}]}>
               <Ionicons name="alert-circle" size={24} color="#FF6348" />
            </View>
            <View style={{marginLeft: 15}}>
              <Text style={styles.cardLabel}>Toplam Dikkat Dağınıklığı</Text>
              <Text style={[styles.valueText, {color: '#FF6348'}]}>
                {stats.totalDistractions} <Text style={styles.unitText}>kez</Text>
              </Text>
            </View>
          </View>
      </View>

      {/* --- BAR CHART --- */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartHeader}>
          <Ionicons name="calendar-outline" size={18} color="#2D3436" />
          <Text style={styles.chartTitle}>Son 7 Gün (Dakika)</Text>
        </View>
        <BarChart
          data={{ labels: stats.barChartLabels, datasets: [{ data: stats.barChartData }] }}
          width={screenWidth - 60}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={barChartConfig}
          style={styles.chartStyle}
          showValuesOnTopOfBars={true}
          fromZero={true}
        />
      </View>

      {/* --- GELİŞMİŞ KATEGORİ DAĞILIMI --- */}
      <View style={[styles.chartWrapper, { marginBottom: 40 }]}>
        <View style={styles.chartHeader}>
          <Ionicons name="pie-chart-outline" size={18} color="#2D3436" />
          <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
        </View>
        
        {stats.categoryData.length > 0 ? (
          <View>
            {/* GRAFİK KISMI (Efsanesiz) */}
            <View style={{alignItems: 'center'}}>
                <PieChart
                    data={stats.categoryData}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={pieChartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"0"}
                    center={[screenWidth / 4, 0]} // Ortalamak için ayar
                    absolute
                    hasLegend={false} // Varsayılan yazıları gizle
                />
            </View>

            {/* ÖZEL LİSTE KISMI */}
            <View style={styles.legendContainer}>
                {stats.categoryData.map((item, index) => {
                    // Yüzde Hesaplama
                    const totalDuration = stats.categoryData.reduce((acc, curr) => acc + curr.rawSeconds, 0);
                    const percentage = totalDuration > 0 ? ((item.rawSeconds / totalDuration) * 100).toFixed(1) : 0;

                    return (
                        <View key={index} style={styles.legendRow}>
                            {/* Sol Taraf: Renk ve İsim */}
                            <View style={styles.legendLeft}>
                                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                                <View>
                                    <Text style={styles.legendName}>{item.name}</Text>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: item.color }]} />
                                    </View>
                                </View>
                            </View>

                            {/* Sağ Taraf: Süre ve Yüzde */}
                            <View style={styles.legendRight}>
                                {renderTimeValue(item.rawSeconds, true)}
                                <Text style={styles.percentageText}>%{percentage}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>Henüz veri bulunmuyor.</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const barChartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  fillShadowGradient: "#6C5CE7",
  fillShadowGradientOpacity: 1,
  color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
  labelColor: () => `#636E72`,
  barPercentage: 0.5,
  decimalPlaces: 0,
};

const pieChartConfig = {
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 50, paddingHorizontal: 20 },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#2D3436' },
  headerSubtitle: { fontSize: 14, color: '#B2BEC3', marginTop: 2 },
  headerIcon: { opacity: 0.8 },

  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { 
    width: '48%', padding: 20, borderRadius: 20, 
    justifyContent: 'space-between', minHeight: 120,
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  fullWidthCard: {
    width: '100%', padding: 20, borderRadius: 20, marginBottom: 25,
    shadowColor: "#FF6348", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#636E72', marginBottom: 5 },
  
  valueText: { fontSize: 24, fontWeight: '800', color: '#2D3436', letterSpacing: -0.5 },
  valTextSmall: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
  unitText: { fontSize: 14, fontWeight: '600', color: '#B2BEC3' },

  chartWrapper: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3436', marginLeft: 8 },
  chartStyle: { borderRadius: 16, paddingRight: 30 },

  // --- YENİ EFSANE (LEGEND) TASARIMI ---
  legendContainer: { marginTop: 20 },
  legendRow: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F5F6FA', paddingBottom: 10 
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  legendName: { fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 4 },
  
  progressBarBg: { width: 100, height: 4, backgroundColor: '#EDEEF0', borderRadius: 2 },
  progressBarFill: { height: '100%', borderRadius: 2 },

  legendRight: { alignItems: 'flex-end' },
  percentageText: { fontSize: 12, color: '#A0AEC0', fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', height: 150 },
  emptyText: { color: '#BDC3C7', marginTop: 10, fontSize: 14 }
});