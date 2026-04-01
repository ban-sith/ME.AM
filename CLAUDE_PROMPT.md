# ME:AM - Claude Devam Prompt'u

Bu dosya, projeyi daha sonra devam ettirmek icin Claude'a verilecek context'tir.

## Proje Nedir?
**ME:AM** — Kendi sesini kaydedip sabah alarm olarak duydugu bir motivasyon uygulamasi.
Konsept: Aksam kendine motivasyon konusmasi yap, sabah kendi sesinle uyan.

## Tech Stack
- **React Native + Expo** (SDK 54)
- **TypeScript**
- **Pixel art UI** — Press Start 2P font, Pixellab ile olusturulmus asset'ler
- **expo-av** — ses kayit/oynatma
- **expo-notifications** — alarm bildirimleri (native only)
- **Web Audio API** — web'de timer-based alarm checker

## Dosya Yapisi
```
App.tsx                    → Ana giris, tab navigation (REC / ALARMS / CAPSULE)
src/
  screens/
    RecordScreen.tsx       → Ses kayit, play, favori, rename, waveform
    AlarmsScreen.tsx       → Alarm kurma/duzenleme, toggle, snooze, vibration, shuffle
    CapsuleScreen.tsx      → Zaman kapsulu - gelecege mesaj birak
  components/
    Mascot.tsx             → Uyuyan/uyanan alarm saati karakteri (3 state)
    FloatingNotes.tsx      → Ucusan muzik notalari animasyonu
    PixelToggle.tsx        → Animated toggle switch
    SwipeableCard.tsx      → Sola kaydir → sil
    Waveform.tsx           → Animasyonlu ses dalgasi
    Starfield.tsx          → Yanip sonen yildizlar arka plan
  utils/
    storage.ts             → AsyncStorage CRUD (recordings, alarms, capsules)
    notifications.ts       → expo-notifications alarm zamanlama
    webAlarm.ts            → Web icin setInterval bazli alarm checker
  theme.ts                 → Renkler, font, shadow/glow stilleri, vibrasyon pattern'leri
  types.ts                 → Recording, Alarm, TimeCapsule interface'leri
```

## Onemli Ozellikler
- **Favori kayitlar** — yildiz ikonu ile isaretlenir
- **Shuffle modu** — alarm calinca rastgele favori kayit secer
- **Zaman kapsulu** — X gun sonra acilacak sesli mesaj
- **Tekrarlayan alarm** — gun secici (Su Mo Tu We Th Fr Sa)
- **Snooze** — Off / 5m / 10m / 15m
- **Vibrasyon pattern** — Default / Pulse / Urgent / Gentle / Off
- **Swipe-to-delete** — PanResponder ile, opacity interpolation
- **Inline rename** — kayit ismine tikla, TextInput olur
- **Web uyumluluk** — FileSystem, Alert, notifications hepsi platform check'li
- **3D butonlar** — borderBottom + boxShadow ile bevel efekti
- **Glow efektleri** — coral (record), cyan (active), pink (CTA), gold (time)

## Bilinen Kisitlamalar
- Web'de alarm sadece sayfa acikken calisir (setInterval)
- iOS sessiz modda ses calmaz (native build + Critical Alerts gerekli)
- expo-notifications web'de calismaz, webAlarm.ts kullanilir
- Alert.prompt sadece iOS — web'de TextInput kullaniliyor

## Yapilabilecek Sonraki Adimlar
1. Native build (expo prebuild) → gercek alarm islevi
2. Ambient ses kolaji (gercek ses dosyalariyla)
3. Uyku sesleri + sleep timer
4. Streak sistemi + gamification
5. Uyandirma challenge (math, shake)
6. Ruya gunlugu
7. App Store / Play Store deploy
8. Splash screen (asset var: logo_v1 tarzinda)
9. Kayit promptlari (25 adet hazir, src/utils/prompts.ts silindi ama icerigi burada)

## Renk Paleti
```
bg: #16213e          → koyu lacivert arka plan
card: #1f2940        → kart arka plani
pink: #e056a0        → CTA, basliklar
cyan: #00d2ff        → navigasyon, aktif elemanlar
gold: #ffd700        → saat, basari
coral: #ff4757       → alarm, uyari, record
green: #2ed573       → onay, toggle
purple: #a855f7      → kapsul, tekrar
orange: #ffa502      → snooze
```

## Pixellab Asset Uretim Prompt Ornekleri
- Karakter: "pixel art cute tiny sleeping alarm clock character with closed eyes and zzz, kawaii style, pink cyan, 64x64"
- Buton: "pixel art chunky bold green play button, glowing neon, beveled 3D retro game style, 64x64"
- Ikon: "pixel art golden star favorite icon, glowing shiny, cute retro game style, 32x32"
- Logo: "pixel art app logo, cute alarm clock with headphones and microphone, pink magenta cyan, neon glow, retro arcade, 128x128"
