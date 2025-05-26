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
8. [Kullanıcı Rolleri ve Erişim](#kullanıcı-rolleri-ve-erişim)
9. [Sistem Gereksinimleri](#sistem-gereksinimleri)
10. [Kullanım Kılavuzu Görselleri](#kullanım-kılavuzu-görselleri)

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

### Yeni Veritabanı Oluşturma

1. PostgreSQL'i başlatın:
```bash
# Linux
sudo service postgresql start

# Windows
# Hizmetler üzerinden PostgreSQL hizmetini başlatın
```

2. PostgreSQL komut satırına giriş yapın:
```bash
psql -U postgres
```

3. Veritabanını oluşturun:
```sql
CREATE DATABASE arac_sevk_db;
```

4. Veritabanına bağlanın:
```sql
\c arac_sevk_db
```

5. Proje dizinindeki SQL dosyalarını çalıştırın:
```bash
# Terminal'e dönün (PostgreSQL CLI'dan çıkın)
psql -U postgres -d arac_sevk_db -f db/create_users_table.sql
psql -U postgres -d arac_sevk_db -f db/create_vehicles_table.sql
psql -U postgres -d arac_sevk_db -f db/create_drivers_table.sql
psql -U postgres -d arac_sevk_db -f db/create_personnel_table.sql
psql -U postgres -d arac_sevk_db -f db/create_tasks_table.sql
psql -U postgres -d arac_sevk_db -f db/create_maintenance_table.sql
psql -U postgres -d arac_sevk_db -f db/create_logs_table.sql
```

### Windows'ta PostgreSQL Kurulumu ve Yapılandırması

1. PostgreSQL İndirme ve Kurulum:
   - [PostgreSQL resmi sitesi](https://www.postgresql.org/download/windows/)nden en son sürümü indirin
   - İndirilen kurulum dosyasını çalıştırın ve adımları takip edin:
     - Kurulum dizini: `C:\Program Files\PostgreSQL\14` (sürüm numarası değişebilir)
     - Şifrenizi belirleyin ve not alın (veritabanı yöneticisi için gerekecektir)
     - Port: 5432 (varsayılan)
     - Locale: Turkish, Turkey
   - StackBuilder eklentisini kurmanız isteğe bağlıdır

2. Windows Hizmetlerinde PostgreSQL'i Başlatma:
   - Windows tuşu + R tuşlarına basın, "services.msc" yazıp Enter'a basın
   - Listede "postgresql-x64-14" (sürüm numarası değişebilir) hizmetini bulun
   - Hizmete sağ tıklayıp "Başlat" seçeneğini seçin
   - Hizmetin "Çalışıyor" durumunda olduğundan emin olun

3. pgAdmin Aracını Kullanma:
   - Başlat menüsünden "pgAdmin 4" programını açın
   - Sunucuya bağlanmak için sizden şifre istenecektir (kurulumda belirlediğiniz şifre)
   - Bağlandıktan sonra sol panelde "Servers > PostgreSQL 14" yolunu takip edin

4. Veritabanı Oluşturma (pgAdmin ile):
   - "Databases" üzerine sağ tıklayın ve "Create > Database" seçeneğini seçin
   - Veritabanı adı: `arac_sevk_`
   - Owner: postgres (varsayılan)
   - "Save" butonuna tıklayın

5. Veritabanı Oluşturma (Komut Satırı ile):
   - Windows Başlat menüsünden "SQL Shell (psql)" programını açın
   - İstenen bilgileri girin (server, database, port, username varsayılan olarak kalabilir, şifre ise kurulum sırasında belirlediğiniz şifre)
   - Aşağıdaki komutu yazın ve Enter'a basın:
   ```sql
   CREATE DATABASE arac_sevk;
   ```

### Veritabanı Yedeği ve Geri Yükleme

#### Yedek Alma (Export)

Mevcut veritabanının yedeğini almak için:

```bash
# Tam veritabanı yedeği (yapısal ve veri)
pg_dump -U postgres -d arac_sevk_db > arac_sevk_backup.sql

# Sadece verinin yedeği (yapı olmadan)
pg_dump -U postgres -d arac_sevk_db --data-only > arac_sevk_data_backup.sql

# Sadece yapı yedeği (veri olmadan)
pg_dump -U postgres -d arac_sevk_db --schema-only > arac_sevk_schema_backup.sql
```

#### Yedeği Geri Yükleme (Import)

Yedekten veritabanını geri yüklemek için:

```bash
# Önce boş bir veritabanı oluşturun (eğer yoksa)
psql -U postgres -c "CREATE DATABASE arac_sevk_db;"

# Tam yedeği geri yükleyin
psql -U postgres -d arac_sevk_db < arac_sevk_backup.sql

# Veya: Önce şemayı, sonra verileri yükleyin
psql -U postgres -d arac_sevk_db < arac_sevk_schema_backup.sql
psql -U postgres -d arac_sevk_db < arac_sevk_data_backup.sql
```

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

## Kullanıcı Rolleri ve Erişim

Sistemde iki temel kullanıcı rolü bulunur:

### Admin
- Tüm modüllere tam erişim
- Kullanıcı yönetimi
- Araç kayıt ve düzenleme
- Sürücü kayıt ve düzenleme
- Raporlama
- Sistem ayarları

### Kullanıcı
- Görev oluşturma ve takip
- Araç durumlarını görüntüleme
- Görev raporlama

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

## Kullanım Kılavuzu Görselleri

Aşağıda sistemin temel özelliklerine ilişkin ekran görüntüleri bulunmaktadır:

### Giriş Ekranı
![Giriş Ekranı](src/assets/klavuz/giris-ekrani.png)

### Ana Sayfa
![Ana Sayfa](src/assets/klavuz/ana-sayfa.png)

### Araç Kayıt İşlemleri
![Araç Kayıt](src/assets/klavuz/arac-kayit.png)

### Görev Oluşturma
![Görev Oluşturma](src/assets/klavuz/gorev-olusturma.png)

### Kademe İşlemleri
![Kademe İşlemleri](src/assets/klavuz/kademe-islemleri.png)

### Raporlar
![Raporlar](src/assets/klavuz/raporlar.png)

### Sistem Logları
![Sistem Logları](src/assets/klavuz/sistem-loglari.png)

> Not: Görseller, eğitim amaçlı olup gerçek verileri içermemektedir.
````
