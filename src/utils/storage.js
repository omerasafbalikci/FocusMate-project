import AsyncStorage from '@react-native-async-storage/async-storage';

// Veriyi kaydetme (Tamamlanan seanslar)
export const saveSession = async (sessionData) => {
  try {
    const existingSessions = await getSessions();
    const newSessions = [...existingSessions, sessionData];
    await AsyncStorage.setItem('sessions', JSON.stringify(newSessions));
  } catch (e) {
    console.error("Kaydetme hatası", e);
  }
};

// Verileri getirme
export const getSessions = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('sessions');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Okuma hatası", e);
    return [];
  }
};

// Verileri temizleme (Test ederken işinize yarar)
export const clearSessions = async () => {
    try {
        await AsyncStorage.removeItem('sessions');
    } catch(e) {
        console.error(e);
    }
}