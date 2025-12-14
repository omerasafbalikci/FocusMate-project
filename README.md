# 🎯 Focus Mate - Kişisel Odaklanma Asistanı

> "Zamanını yönet, dikkatini koru ve verilerini analiz et."

**Focus Mate**, kullanıcıların odaklanma sürelerini yönetmelerine, dikkat dağınıklıklarını takip etmelerine ve geçmiş performanslarını detaylı grafiklerle analiz etmelerine olanak tanıyan, React Native ile geliştirilmiş modern bir mobil uygulamadır.

---

## ✨ Özellikler

### 1. ⏱️ Akıllı Odaklanma Sayacı
- Kullanıcı, dakika ve saniye bazında **özelleştirilebilir** hedefler belirleyebilir.
- **Başlat / Duraklat / Devam Et** fonksiyonları ile esnek kullanım.
- Görsel olarak zenginleştirilmiş dairesel zamanlayıcı ve durum bildirimleri.

### 2. 🧠 Dikkat Dağınıklığı Takibi (Distraction Tracking)
- Uygulama, `AppState` API'si kullanılarak arka plana atıldığında (örneğin Instagram'a girmek için uygulamadan çıkıldığında) bunu **"Dikkat Dağınıklığı"** olarak algılar.
- Sayaç durdurulur ve hata sayısı artırılır.
- Seans sonunda bu hatalar performansa göre derecelendirilir (Mükemmel, İdare Eder, Toparlanman Lazım vb.).

### 3. 💾 Kalıcı Veri Depolama (Persistence)
- **Teknoloji:** `AsyncStorage`
- Tüm odaklanma seansları, tarih, süre, kategori ve hata sayıları ile birlikte cihazın yerel hafızasında saklanır.
- Uygulama kapatılıp açılsa dahi veriler kaybolmaz (Persistent Storage).

### 4. 📊 Detaylı Analiz ve Raporlama
- **Son 7 Gün Analizi:** Günlük odaklanma sürelerini gösteren Sütun Grafiği (Bar Chart).
- **Kategori Dağılımı:** Hangi alanda (Ders, Kodlama, Kitap vb.) ne kadar çalışıldığını gösteren Pasta Grafiği (Pie Chart).
- **Toplam İstatistikler:** Toplam süre ve toplam dikkat dağınıklığı sayısı.

---

## 🛠️ Kullanılan Teknolojiler ve Kütüphaneler

Bu proje **React Native (Expo)** altyapısı kullanılarak geliştirilmiştir.

- **Core:** `React`, `React Native`, `Expo`
- **Navigation:** `@react-navigation/native`, `@react-navigation/bottom-tabs`
- **Storage:** `@react-native-async-storage/async-storage` (Yerel Veritabanı)
- **Charts:** `react-native-chart-kit`, `react-native-svg` (Veri Görselleştirme)
- **UI Components:** `@react-native-picker/picker`, `react-native-vector-icons (Ionicons)`
- **Hooks:** `useState`, `useEffect`, `useRef`, `useCallback`

---

## 📂 Proje Yapısı

Proje, sürdürülebilir ve temiz kod (Clean Code) prensiplerine uygun olarak yapılandırılmıştır.

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

## **Repoyu Klonlayın:**
   ```bash
   git clone [https://github.com/omerasafbalikci/FocusMate-project.git]
   cd focus-mate
   npm install
   npx expo start
   ```

## Geliştirici

Ömer Asaf Balıkçı - B221210083