# Araç Sevk Merkezi

Askeri ve sivil araçların görev yönetimi, araç takibi, kademe işlemleri ve raporlama ihtiyaçlarını karşılayan kapsamlı bir araç sevk ve kontrol sistemi.

## İçindekiler

1. [Proje Hakkında](#proje-hakkında)
2. [Özellikler](#özellikler)
3. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
4. [Kurulum](#kurulum)
5. [Veritabanı Kurulumu](#veritabanı-kurulumu)
6. [Uygulamayı Çalıştırma](#uygulamayı-çalıştırma)
7. [Offline Kullanım](#offline-kullanım)
8. [Kullanıcı Rolleri ve Erişim Yönetimi](#kullanıcı-rolleri-ve-erişim-yönetimi)
9. [Sistem Gereksinimleri](#sistem-gereksinimleri)
10. [Kullanım Kılavuzu Görselleri](#kullanım-kılavuzu-görselleri)


## Kullanım Kılavuzu Görselleri

Aşağıda sistemin temel özelliklerine ilişkin ekran görüntüleri bulunmaktadır:

### Giriş Ekranı
![Image](https://github.com/user-attachments/assets/f45de4ec-8d40-40a7-ad00-a5d3801bbc80)

### Ana Sayfa
![Image](https://github.com/user-attachments/assets/c1782ed1-8830-475a-b818-2e3855199005)

### Araç Kayıt İşlemleri
![Image](https://github.com/user-attachments/assets/ea095e0e-0a09-4c62-83e7-0f22db261643)

### Raporlar
![Image](https://github.com/user-attachments/assets/9eb67d8c-3974-46eb-a346-c41f1c569330)

### Sistem Logları
![Image](https://github.com/user-attachments/assets/65f1f682-748b-4978-863d-d4d3f88387fa)

> Not: Görseller, eğitim amaçlı olup gerçek verileri içermemektedir.



## Proje Hakkında

Araç Sevk Merkezi, özellikle askeri kurumlar için geliştirilmiş, araçların görevlendirilmesi, araç bakım takibi ve araç kullanım raporlarının tutulması amacıyla tasarlanmış bir yönetim sistemidir. Sistem, araç filosunun etkin yönetimi, sürücülerin görevlendirilmesi ve bakım-onarım süreçlerinin detaylı takibini sağlar.

## Özellikler

### Araç Yönetimi
- Askeri ve sivil plakalı araçların kayıtlarının tutulması
- Araç detayları (marka, model, şasi numarası, motor numarası vb.) yönetimi
- Araçların aktif/pasif durumlarının takibi

### Sürücü Yönetimi
- Sürücü kayıtları ve bilgi yönetimi
- Sürücü görevlendirme
- Sürücü izin ve durum takibi

### Görev Yönetimi
- Araç görevlendirme (standart görevler)
- Uzun yol görevleri
- Görev başlatma ve kapatma
- KM takibi
- Görev notları ve raporları

### Kademe (Bakım) İşlemleri
- Arıza kayıtları
- Bakım kayıtları
- Onarım detayları
- Değişen parça bilgileri
- Kademe giriş-çıkış işlemleri

### Raporlama ve Loglar
- Araç bazlı raporlar
- Tarih aralığına göre filtreleme
- İşlem türüne göre filtreleme
- PDF ve Excel formatlarında dışa aktarma
- Detaylı sistem logları ve işlem takibi

### Kullanıcı Yönetimi
- Rol bazlı erişim kontrolü (admin/kullanıcı)
- Kullanıcı ekleme, düzenleme, aktif/pasif yapma
- Şifre yönetimi

## Kullanılan Teknolojiler

### Frontend
- Angular 19
- Angular Material UI
- TypeScript
- SCSS
- RxJS
- Chart.js (istatistikler için)
- jsPDF (PDF çıktıları için)
- ExcelJS (Excel raporları için)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT) (kimlik doğrulama)
- bcrypt (şifreleme)

### Diğer
- RESTful API
- Responsive tasarım
- Offline kullanım desteği

## Kurulum

### Gereksinimler
- Node.js 20.x veya üzeri
- PostgreSQL 14.x veya üzeri
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullanici-adi/arac-sevk-merkezi.git
cd arac-sevk-merkezi
```

2. Bağımlılıkları yükleyin:
```bash
# Backend bağımlılıklarını yükle
cd backend
npm install

# Frontend bağımlılıklarını yükle
cd ../
npm install
```

## Veritabanı Kurulumu

### Hazır Veritabanı Yedeğinden Geri Yükleme (Önerilen Yöntem)

1. PostgreSQL'i başlatın:
```bash
# Linux
sudo service postgresql start

# Windows
# Hizmetler (services.msc) üzerinden PostgreSQL hizmetini başlatın
```

2. Veritabanı Geri Yükleme:
   - **pgAdmin 4** aracını açın
   - Servers > PostgreSQL altında sağ tıklayıp "Create > Database" seçin
   - Veritabanı adı olarak `arac_sevk` girin ve kaydedin
   - Oluşturulan veritabanına sağ tıklayıp "Restore..." seçeneğini seçin
   - Format: "Custom or tar" seçin
   - Filename: Proje klasöründeki `db\260525.backup` dosyasını seçin
   - Restore Options sekmesinde tüm seçenekleri işaretleyin
   - "Restore" butonuna tıklayın

3. Komut Satırından Geri Yükleme (Alternatif):
```bash
# Önce veritabanını oluşturun
psql -U postgres -c "CREATE DATABASE arac_sevk;"

# Backup dosyasını geri yükleyin
pg_restore -U postgres -d arac_sevk "C:\work\u1\arac sevk merkezi\db\260525.backup"
```

> **Önemli Not:** Veritabanında varsayılan olarak yönetici hesabı oluşturulmuştur:
> - **Kullanıcı Adı:** 11111111111
> - **Şifre:** Rekan2025.05
> - Bu hesap super user yetkilerine sahiptir ve sistem bütünlüğü için veritabanı seviyesinde silinmeye karşı korunmaktadır.

## Uygulamayı Çalıştırma

### Geliştirme Modunda

1. Backend'i başlatın:
```bash
cd backend
npm run dev
```

2. Frontend'i başlatın (yeni bir terminal penceresinde):
```bash
cd ..
npm start
```

3. Tarayıcınızda `http://localhost:4200` adresine gidin.

### Üretim (Production) Modunda

1. Frontend'i derleyin:
```bash
npm run build
```

2. Backend'i üretim modunda başlatın:
```bash
cd backend
npm start
```

3. Tarayıcınızda `http://localhost:3000` adresine gidin.

### Hızlı Başlatma (Windows için)

Proje klasöründe bulunan `start-app.bat` dosyası, uygulamayı tek tıklamayla başlatmak için tasarlanmıştır:

1. Windows Dosya Gezgininde `start-app.bat` dosyasına çift tıklayın
2. Bat dosyası otomatik olarak:
   - Backend Node.js sunucusunu ayrı bir komut penceresi içinde başlatır
   - PostgreSQL veritabanı bağlantısını kontrol eder
   - 3 saniye bekleyerek sunucunun hazır olmasını sağlar
   - Varsayılan web tarayıcınızda uygulamayı açar (http://localhost:3000)
   - Kapanmaması için kullanıcıdan onay bekler

Bu batch dosyası, özellikle teknik bilgisi olmayan kullanıcıların sistemi kolayca başlatabilmesi için geliştirilmiştir.

## Offline Kullanım

Araç Sevk Merkezi uygulaması, internet bağlantısı olmayan ortamlarda da çalışacak şekilde tasarlanmıştır. Offline kullanım için:

1. **Yerel Sunucu Kurulumu**:
   - Uygulamanın çalışacağı bilgisayara Node.js, PostgreSQL kurun
   - Backend ve frontend kodlarını bu bilgisayara aktarın
   - Veritabanını kurun ve gerekli tabloları oluşturun

2. **Ağ Yapılandırması**:
   - Yerel ağ için backend sunucusunu yapılandırın:
     ```javascript
     // server.js dosyasında
     app.listen(3000, '0.0.0.0', () => {
       console.log('Server çalışıyor, port 3000');
     });
     ```

3. **Verileri Senkronize Etme**:
   - Belirli aralıklarla veritabanının yedeğini alın
   - Gerektiğinde bu yedeği başka sistemlere aktarın

4. **İstemci Ayarları**:
   - İstemci bilgisayarları, yerel sunucunun IP adresine yönlendirin:
     ```typescript
     // src/environments/environment.prod.ts
     export const environment = {
       production: true,
       apiUrl: 'http://192.168.1.100:3000/api'  // Yerel sunucunun IP adresi
     };
     ```

## Kullanıcı Rolleri ve Erişim Yönetimi

Sistemde, ihtiyaçlara göre özelleştirilmiş dört farklı kullanıcı rolü bulunmaktadır:

### Super User (Sistem Yöneticisi)
- Tüm modüllere ve ayarlara tam erişim
- Kullanıcı oluşturma, düzenleme ve yetkilendirme
- Sistem konfigürasyonu ve veritabanı yönetimi
- Log kayıtlarını görüntüleme ve dışa aktarma
- Yedekleme ve geri yükleme işlemleri
- **Not:** Bu rol, varsayılan olarak sistemde bulunan ve silinemeyen `1111111111` kullanıcısına atanmıştır

### Admin (Yönetici)
- Araç ve personel kayıtlarını oluşturma/düzenleme
- Tüm görevleri ve kademe işlemlerini yönetme
- Raporları görüntüleme ve dışa aktarma
- Standart kullanıcı hesaplarını yönetme

### Supervisor (Denetleyici)
- Görev atama ve onaylama
- Araç ve personel bilgilerini görüntüleme
- Raporları görüntüleme ve filtreleme
- Kademe işlemlerini başlatma ve takip etme

### Operator (Operatör)
- Görevleri görüntüleme ve güncelleme
- Kendisine atanan araçlar için işlemler yapma
- Temel raporları görüntüleme
- Kendi kullanıcı bilgilerini güncelleme

Her kullanıcı rolü, Angular Router Guards ve JWT payload doğrulaması ile güvence altına alınmıştır. Yetkisiz erişim denemeleri engellenmekte ve otomatik olarak loglanmaktadır.

## Sistem Gereksinimleri

### Sunucu
- İşletim Sistemi: Windows 10/11, Linux Server, macOS
- RAM: En az 4GB
- Disk: En az 10GB boş alan
- İşlemci: 2 çekirdek veya üzeri

### İstemci (Kullanıcı Bilgisayarı)
- Modern bir web tarayıcı (Google Chrome 90+, Firefox 90+, Edge 90+)
- Minimum 1366x768 ekran çözünürlüğü
- Stabil ağ bağlantısı (offline kullanım için yerel ağ yeterli)



## Güvenlik ve Şifreleme

Araç Sevk Merkezi, askeri ortamlarda da kullanılabilecek şekilde gelişmiş güvenlik önlemleri içermektedir:

### Şifreleme ve Kimlik Doğrulama
- Tüm kullanıcı şifreleri veritabanında **bcrypt** algoritması ile hash'lenerek saklanmaktadır
- Hash'leme işlemi 10 tur (salt rounds) ile gerçekleştirilmekte, bu da brute-force saldırılarına karşı koruma sağlamaktadır
- Oturum yönetimi için **JWT (JSON Web Tokens)** kullanılmakta, tokenler 24 saat sonra otomatik olarak geçersiz olmaktadır
- API isteklerinde CSRF koruması uygulanmaktadır

### Veritabanı Güvenliği
- Kritik sistem kullanıcıları, veritabanı seviyesinde silme işlemlerine karşı **trigger** mekanizması ile korunmaktadır
- Veritabanı bağlantıları havuzlanarak (connection pooling) yönetilmekte, bu da SQL injection saldırılarına karşı ek koruma sağlamaktadır
- Tüm kullanıcı işlemleri, IP adresi ve zaman damgası ile birlikte loglanmaktadır

### İletişim Güvenliği
- Üretim ortamında HTTPS protokolü kullanılması önerilmektedir
- API istekleri rate limiting ile korunmaktadır
- Backend üzerinden proxy ile iletilen tüm istekler sanitize edilmektedir
