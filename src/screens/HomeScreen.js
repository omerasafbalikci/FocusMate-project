import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Button, StyleSheet, Text, Vibration, View } from 'react-native';
import { saveSession } from '../utils/storage';

const FOCUS_TIME = 25 * 60; // 25 Dakika (Saniye cinsinden)

export default function HomeScreen() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [category, setCategory] = useState('Ders');
  const [distractionCount, setDistractionCount] = useState(0);
  
  // AppState takibi için referans
  const appState = useRef(AppState.currentState);

  // Sayaç Mantığı
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => seconds - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      // Süre bitti
      setIsActive(false);
      handleSessionComplete();
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // DİKKAT DAĞINIKLIĞI TAKİBİ (APPSTATE)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState === 'background'
      ) {
        // Uygulama arka plana atıldı!
        if (isActive) {
          setIsActive(false); // Sayacı durdur
          setDistractionCount((prev) => prev + 1); // Dikkat dağınıklığını artır
          Vibration.vibrate(); // Kullanıcıyı uyar (Titreşim)
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  const handleSessionComplete = async () => {
    const sessionData = {
      date: new Date().toISOString(),
      duration: FOCUS_TIME - secondsLeft, // Saniye cinsinden
      category: category,
      distractionCount: distractionCount
    };
    
    await saveSession(sessionData);
    Alert.alert("Tebrikler!", "Odaklanma seansı tamamlandı ve kaydedildi.");
    resetTimer();
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(FOCUS_TIME);
    setDistractionCount(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pomodoro Odaklanma</Text>
      
      {/* Kategori Seçimi */}
      <View style={styles.pickerContainer}>
        <Text>Kategori Seç:</Text>
        <Picker
          selectedValue={category}
          style={{ height: 50, width: 150 }}
          onValueChange={(itemValue) => setCategory(itemValue)}
          enabled={!isActive} // Sayaç çalışırken değiştiremesin
        >
          <Picker.Item label="Ders" value="Ders" />
          <Picker.Item label="Kodlama" value="Kodlama" />
          <Picker.Item label="Kitap" value="Kitap" />
          <Picker.Item label="Proje" value="Proje" />
        </Picker>
      </View>

      {/* Sayaç Göstergesi */}
      <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
      
      <Text style={styles.distractionText}>
        Dikkat Dağınıklığı: {distractionCount}
      </Text>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        {!isActive ? (
          <Button title="Başlat" onPress={() => setIsActive(true)} />
        ) : (
          <Button title="Duraklat" onPress={() => setIsActive(false)} color="orange" />
        )}
        <View style={{ width: 20 }} />
        <Button title="Sıfırla" onPress={resetTimer} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  timerText: { fontSize: 80, fontWeight: 'bold', marginVertical: 30 },
  distractionText: { fontSize: 18, color: 'red', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row' },
  pickerContainer: { alignItems: 'center', marginBottom: 10 }
});