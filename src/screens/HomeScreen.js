import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  Keyboard, Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { saveSession } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  // --- STATE TANIMLARI ---
  const [targetMinutes, setTargetMinutes] = useState('25'); 
  const [targetSeconds, setTargetSeconds] = useState('00'); 
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  
  const [category, setCategory] = useState('Ders');
  const [distractionCount, setDistractionCount] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  const appState = useRef(AppState.currentState);

  // --- MANTIK ---
  const updateTimerPreview = (mins, secs) => {
    if (!isSessionStarted) {
      const m = parseInt(mins) || 0;
      const s = parseInt(secs) || 0;
      setSecondsLeft((m * 60) + s);
    }
  };

  const handleMinutesChange = (text) => {
    setTargetMinutes(text);
    updateTimerPreview(text, targetSeconds);
  };

  const handleSecondsChange = (text) => {
    setTargetSeconds(text);
    updateTimerPreview(targetMinutes, text);
  };

  const handleBlur = (type) => {
    if (type === 'min') {
        if(targetMinutes === '' || isNaN(parseInt(targetMinutes))) setTargetMinutes('00');
        else if(targetMinutes.length === 1) setTargetMinutes('0' + targetMinutes);
    } else {
        if(targetSeconds === '' || isNaN(parseInt(targetSeconds))) setTargetSeconds('00');
        else if(targetSeconds.length === 1) setTargetSeconds('0' + targetSeconds);
    }
  };

  // --- SAYAÇ & APPSTATE ---
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => seconds - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      finishSession(); 
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        if (isActive) {
          setIsActive(false); 
          setDistractionCount((prev) => prev + 1);
          Vibration.vibrate();
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isActive]);

  // --- ALGORİTMA & RENKLER ---
  const calculateRate = (count, durationSeconds) => {
    if (count === 0) return 0;
    const minutes = durationSeconds / 60;
    if (minutes < 1) return 100; 
    return count / minutes; 
  };

  const getFeedbackMessage = (count, durationSeconds) => {
    if (count === 0) return "Mükemmel Odaklanma! 🌟";
    const rate = calculateRate(count, durationSeconds);
    if (rate < 0.1) return "Gayet İyi Gittin! 👍";
    if (rate < 0.3) return "Biraz Daha Dikkat 🤔";
    return "Toparlanman Lazım ⚠️";
  };

  const getFeedbackColor = (count, durationSeconds) => {
    if (count === 0) return '#00CEC9'; 
    const rate = calculateRate(count, durationSeconds);
    if (rate < 0.1) return '#0984e3'; 
    if (rate < 0.3) return '#FFA502'; 
    return '#FF6348'; 
  };

  // --- FONKSİYONLAR ---
  const handleStart = () => {
    Keyboard.dismiss(); 
    if (secondsLeft > 0) {
      setIsActive(true);
      setIsSessionStarted(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const finishSession = async () => {
    setIsActive(false);
    
    const m = parseInt(targetMinutes) || 0;
    const s = parseInt(targetSeconds) || 0;
    const initialDuration = (m * 60) + s;
    const validInitial = initialDuration > 0 ? initialDuration : 25 * 60;
    const completedDuration = validInitial - secondsLeft;

    if (completedDuration <= 0) {
        resetTimer(false); // Kaydetmeden sıfırla
        return;
    }

    const data = {
      date: new Date().toISOString(),
      duration: completedDuration,
      category: category,
      distractionCount: distractionCount,
    };

    await saveSession(data);
    setSummaryData(data);
    setModalVisible(true);
  };

  // --- DÜZELTİLEN RESET FONKSİYONU ---
  const resetTimer = (resetToDefaults = false) => {
    setIsActive(false);
    setIsSessionStarted(false);
    
    if (resetToDefaults) {
        // Tamamen varsayılana döndür (25:00)
        setTargetMinutes('25');
        setTargetSeconds('00');
        setSecondsLeft(25 * 60);
    } else {
        // Kutucuklarda ne yazıyorsa ona döndür
        const m = parseInt(targetMinutes) || 0;
        const s = parseInt(targetSeconds) || 0;
        const totalSecs = (m * 60) + s;
        setSecondsLeft(totalSecs > 0 ? totalSecs : 25*60); 
    }
    
    setDistractionCount(0);
    setSummaryData(null);
  };

  const closeSummaryAndReset = () => {
    setModalVisible(false);
    resetTimer(false);
  };

  // --- DÜZELTİLEN BUTON MANTIĞI ---
  const handleStopButton = () => {
    // 1. DURUM: Seans henüz başlamadıysa (Sıfırla modu)
    // İşlev: Ayarları varsayılan 25:00'a çeker.
    if (!isSessionStarted) {
        resetTimer(true); // true = varsayılana dön
        return;
    }

    // 2. DURUM: Seans başladıysa (Bitir modu)
    // İşlev: Kullanıcıya sorar.
    Alert.alert(
        "Seansı Sonlandır",
        "Ne yapmak istersiniz?",
        [
            {
                text: "Vazgeç",
                style: "cancel"
            },
            {
                text: "Sıfırla (Sil)",
                style: "destructive",
                onPress: () => resetTimer(false) // Sadece başa sar
            },
            {
                text: "Bitir ve Kaydet",
                onPress: finishSession // Kaydet ve raporla
            }
        ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
         <Text style={styles.appName}>Focus Mate</Text>
         <Text style={styles.dateText}>{new Date().toLocaleDateString('tr-TR', {weekday: 'long', day: 'numeric', month: 'long'})}</Text>
      </View>

      <View style={styles.contentCard}>
        
        <View style={[styles.settingsContainer, isSessionStarted && styles.fadedOpacity]}>
            <View style={styles.categoryWrapper}>
                <Ionicons name="pricetag-outline" size={20} color="#6C5CE7" style={{marginLeft: 10}}/>
                <Picker
                    selectedValue={category}
                    style={styles.pickerStyle}
                    dropdownIconColor="#6C5CE7"
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    enabled={!isSessionStarted}
                >
                    <Picker.Item label="Ders Çalışma" value="Ders" />
                    <Picker.Item label="Kodlama" value="Kodlama" />
                    <Picker.Item label="Kitap Okuma" value="Kitap" />
                    <Picker.Item label="Proje Geliştirme" value="Proje" />
                </Picker>
            </View>

            <View style={styles.digitalClockContainer}>
                <View style={styles.digitBox}>
                    <Text style={styles.digitLabel}>DK</Text>
                    <TextInput 
                        style={styles.digitInput}
                        keyboardType='numeric'
                        value={targetMinutes}
                        onChangeText={handleMinutesChange}
                        onBlur={() => handleBlur('min')}
                        editable={!isSessionStarted}
                        maxLength={2}
                        selectTextOnFocus
                    />
                </View>
                <Text style={styles.colon}>:</Text>
                <View style={styles.digitBox}>
                    <Text style={styles.digitLabel}>SN</Text>
                    <TextInput 
                        style={styles.digitInput}
                        keyboardType='numeric'
                        value={targetSeconds}
                        onChangeText={handleSecondsChange}
                        onBlur={() => handleBlur('sec')}
                        editable={!isSessionStarted}
                        maxLength={2}
                        selectTextOnFocus
                    />
                </View>
            </View>
        </View>

        <View style={styles.timerWrapper}>
            <View style={[
                styles.timerCircle, 
                isActive ? styles.circleActive : styles.circleInactive,
                isSessionStarted && !isActive && styles.circlePaused
            ]}>
                <Text style={[styles.timerText, isActive && {color: '#6C5CE7'}]}>
                    {formatTime(secondsLeft)}
                </Text>
                
                <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E3F2FD' : '#F5F5F5' }]}>
                    <Text style={[styles.statusText, { color: isActive ? '#2196F3' : '#9E9E9E' }]}>
                        {isActive ? "ODAKLANILIYOR" : (isSessionStarted ? "DURAKLATILDI" : "HAZIR")}
                    </Text>
                </View>
            </View>
        </View>

        {isSessionStarted && (
            <View style={styles.distractionPill}>
                <Ionicons name="eye-off" size={16} color="#FF6348" />
                <Text style={styles.distractionPillText}>
                    {distractionCount} Dikkat Dağınıklığı
                </Text>
            </View>
        )}

        {/* BUTONLAR */}
        <View style={styles.actionButtonsContainer}>
            
            {!isActive ? (
                <TouchableOpacity style={[styles.buttonBase, styles.startBtn]} onPress={handleStart}>
                    <Ionicons name="play" size={24} color="#fff" />
                    <Text style={styles.mainBtnText}>{isSessionStarted ? "Devam" : "Başlat"}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[styles.buttonBase, styles.pauseBtn]} onPress={handlePause}>
                    <Ionicons name="pause" size={24} color="#fff" />
                    <Text style={styles.mainBtnText}>Duraklat</Text>
                </TouchableOpacity>
            )}

            {/* SIFIRLA / BİTİR BUTONU */}
            <TouchableOpacity 
                style={[styles.buttonBase, styles.resetBtn]} 
                onPress={handleStopButton} 
            >
                {/* İkon Duruma Göre Değişir: Başlamadıysa REFRESH, Başladıysa STOP */}
                <Ionicons name={isSessionStarted ? "stop" : "refresh"} size={24} color="#FF6348" />
                <Text style={[styles.mainBtnText, {color: '#FF6348'}]}>{isSessionStarted ? "Bitir" : "Sıfırla"}</Text>
            </TouchableOpacity>
        </View>

      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeSummaryAndReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
                <Ionicons 
                    name={summaryData?.distractionCount === 0 ? "trophy" : "analytics"} 
                    size={40} 
                    color="#fff" 
                />
            </View>
            
            <Text style={styles.modalTitle}>
                {summaryData ? getFeedbackMessage(summaryData.distractionCount, summaryData.duration) : ""}
            </Text>

            <View style={styles.statRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SÜRE</Text>
                    <Text style={styles.statValue}>
                        {summaryData ? `${Math.floor(summaryData.duration/60)}:${summaryData.duration%60 < 10 ? '0' : ''}${summaryData.duration%60}` : "00:00"}
                    </Text>
                </View>
                <View style={styles.statDivider}/>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>HATA</Text>
                    <Text style={[styles.statValue, {color: '#FF6348'}]}>
                        {summaryData?.distractionCount}
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.modalButton, 
                { backgroundColor: summaryData ? getFeedbackColor(summaryData.distractionCount, summaryData.duration) : '#0984e3' }
              ]} 
              onPress={closeSummaryAndReset}
            >
              <Text style={styles.modalButtonText}>Tamamla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE', paddingTop: 60 },
  
  headerArea: { paddingHorizontal: 25, marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: '800', color: '#2D3436', letterSpacing: -1 },
  dateText: { fontSize: 14, color: '#A0AEC0', textTransform: 'uppercase', fontWeight: '600', marginTop: 5 },

  contentCard: {
    flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    paddingHorizontal: 25, paddingTop: 30, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10
  },

  settingsContainer: { width: '100%', marginBottom: 20 },
  fadedOpacity: { opacity: 0.5 }, 

  categoryWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', 
    borderRadius: 16, marginBottom: 20, overflow: 'hidden' 
  },
  pickerStyle: { flex: 1, height: 50 },

  digitalClockContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
  digitBox: { alignItems: 'center' },
  digitInput: { 
    fontSize: 40, fontWeight: 'bold', color: '#2D3436', width: 70, textAlign: 'center',
    borderBottomWidth: 3, borderBottomColor: '#E2E8F0', paddingBottom: 5
  },
  digitLabel: { fontSize: 12, fontWeight: '700', color: '#CBD5E0', marginBottom: 5 },
  colon: { fontSize: 40, fontWeight: 'bold', color: '#CBD5E0', marginHorizontal: 10, marginBottom: 10 },

  timerWrapper: { marginBottom: 20 },
  timerCircle: { 
    width: width * 0.65, height: width * 0.65, borderRadius: (width * 0.65) / 2, 
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  circleInactive: { borderColor: '#E2E8F0', borderWidth: 8 },
  circleActive: { borderColor: '#6C5CE7', borderWidth: 8 },
  circlePaused: { borderColor: '#FFB74D', borderWidth: 8 },

  timerText: { fontSize: 56, fontWeight: '700', color: '#2D3436', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  distractionPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', 
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20
  },
  distractionPillText: { color: '#FF6348', fontWeight: '600', marginLeft: 8 },

  actionButtonsContainer: { 
      flexDirection: 'row', justifyContent: 'space-between', width: '100%', 
      position: 'absolute', bottom: 30, paddingHorizontal: 25 
  },
  buttonBase: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      height: 56, width: '48%', borderRadius: 16,
  },
  startBtn: { 
      backgroundColor: '#6C5CE7',
      shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
  },
  pauseBtn: { 
      backgroundColor: '#FFA502',
      shadowColor: "#FFA502", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
  },
  resetBtn: {
      backgroundColor: '#FFF0F0',
      borderWidth: 1, borderColor: '#FFCCCB'
  },
  mainBtnText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#fff' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { 
    width: '80%', backgroundColor: '#fff', borderRadius: 30, padding: 30, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10
  },
  modalIconContainer: { 
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#6C5CE7', 
    justifyContent: 'center', alignItems: 'center', marginTop: -65, marginBottom: 20, borderWidth: 5, borderColor: '#fff'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3436', textAlign: 'center', marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25, backgroundColor: '#F8F9FE', padding: 15, borderRadius: 15 },
  statBox: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: '#E2E8F0' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#A0AEC0', marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2D3436' },
  modalButton: { width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});