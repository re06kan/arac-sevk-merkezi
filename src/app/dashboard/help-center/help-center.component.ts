import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

// FAQ öğesi için arayüz tanımı
interface FaqItem {
  question: string;
  answer: string;
  expanded?: boolean;
}

// Yardım kategorisi için arayüz tanımı
interface HelpCategory {
  title: string;
  icon: string;
  faqs: FaqItem[];
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule
  ],
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss']
})
export class HelpCenterComponent implements OnInit {
  // Tüm kullanıcıların görebileceği kategoriler
  helpCategories: HelpCategory[] = [
    {
      title: 'Görev Yönetimi',
      icon: 'assignment',
      faqs: [
        {
          question: 'Anasayfadan görev kaydı nasıl açılır?',
          answer: `Anasayfadan görev kaydı açmak için:
                  <ol>
                    <li>Ana sayfada bir araca tıklayın</li>
                    <li>"Yeni Görev Oluştur" butonuna tıklayın</li>
                    <li>Gerekli bilgileri doldurun: Sürücü, Tahsisli Makam, Görev Tipi, vs.</li>
                    <li>Başlangıç kilometresini girin</li>
                    <li>"Görevi Başlat" butonuna tıklayarak görevi başlatın</li>
                  </ol>`
        },
        {
          question: 'Görev nasıl kapatılır?',
          answer: `Aktif bir görevi kapatmak için:
                  <ol>
                    <li>Anasayfada ilgili araca tıklayın</li>
                    <li>"Aktif Görev" sekmesine geçin</li>
                    <li>Bitiş kilometresini girin</li>
                    <li>Dönüş mesajını girin (isteğe bağlı)</li>
                    <li>"Görevi Kapat" butonuna tıklayın</li>
                  </ol>
                  <p>Not: Kapatılan görevler "Geçmiş Görevler" sekmesinde görüntülenebilir.</p>`
        },
        {
          question: 'Uzun yol görevi nasıl oluşturulur?',
          answer: `Uzun yol görevi oluşturmak için:
                  <ol>
                    <li>Ana sayfada bir araca tıklayın</li>
                    <li>"Yeni Görev Oluştur" butonuna tıklayın</li>
                    <li>Görev tipi olarak "UZUN YOL" seçeneğini işaretleyin</li>
                    <li>Gerekli bilgileri eksiksiz doldurun</li>
                    <li>Rotayı detaylı bir şekilde belirtin</li>
                    <li>"Uzun Yol Görevini Başlat" butonuna tıklayın</li>
                  </ol>`
        }
      ]
    },
    {
      title: 'Kademe İşlemleri',
      icon: 'build',
      faqs: [
        {
          question: 'Araç kademede nasıl işlem görür?',
          answer: `Araç kademe işlemleri şu şekilde yapılır:
                  <ol>
                    <li>Ana sayfada ilgili araca tıklayın</li>
                    <li>"Kademeye Al" butonuna tıklayın</li>
                    <li>Arıza türünü seçin ve arıza açıklaması girin</li>
                    <li>Öncelik durumunu ve tahmini süreyi belirleyin</li>
                    <li>Sorumlu teknisyen bilgisini ekleyin</li>
                    <li>"Kaydet" butonuna tıklayarak kademe kaydını oluşturun</li>
                  </ol>`
        },
        {
          question: 'Kademe çıkışı nasıl yapılır?',
          answer: `Kademe çıkışı yapmak için:
                  <ol>
                    <li>Ana sayfada kademe durumundaki araca tıklayın</li>
                    <li>"Kademeden Çıkar" butonuna tıklayın</li>
                    <li>Yapılan işlemleri açıklayın</li>
                    <li>Sonuç bilgisini girin (Örn: "Arıza giderildi")</li>
                    <li>Değişen parçaları belirtin (varsa)</li>
                    <li>Güncel kilometre bilgisini girin</li>
                    <li>"Tamamla" butonuna tıklayarak çıkış işlemini tamamlayın</li>
                  </ol>`
        }
      ]
    },
    {
      title: 'Yeni Kullanıcı Rehberi',
      icon: 'school',
      faqs: [
        {
          question: 'Sisteme ilk giriş yapıldığında nelere dikkat edilmeli?',
          answer: `Sisteme ilk kez giriş yapıyorsanız:
                  <ol>
                    <li>Sol menüdeki modülleri inceleyerek sistemin yapısını tanıyın</li>
                    <li>İlk olarak "Ana Sayfa" kısmındaki araç durumlarını kontrol edin</li>
                    <li>Yönetici iseniz, "Araç Kayıt" ve "Sürücü Kayıt" bölümlerini kullanarak verileri güncelleyin</li>
                    <li>Sisteme yeni kullanıcı eklemek için "Kullanıcı Yönetimi" bölümüne gidin</li>
                    <li>Raporlama işlemleri için "Raporlar" bölümünü kullanın</li>
                  </ol>`
        },
        {
          question: 'Görev takibi nasıl yapılır?',
          answer: `Görevlerin takibi için:
                  <ol>
                    <li>Ana sayfada araçların durumlarını renkli kartlarla görebilirsiniz:
                      <ul>
                        <li><strong>Yeşil:</strong> Müsait</li>
                        <li><strong>Kırmızı:</strong> Görevde</li>
                        <li><strong>Mavi:</strong> Uzun Yolda</li>
                        <li><strong>Turuncu:</strong> Kademede</li>
                      </ul>
                    </li>
                    <li>Detaylı görev bilgisi için ilgili araca tıklayın</li>
                    <li>"Geçmiş Görevler" sekmesinden tamamlanan görevleri görüntüleyebilirsiniz</li>
                    <li>"Raporlar" bölümünden tarih aralığı ve araç bazlı filtreler uygulayarak toplu görev takibi yapabilirsiniz</li>
                  </ol>`
        },
        {
          question: 'Şifre değiştirme nasıl yapılır?',
          answer: `Şifrenizi değiştirmek için:
                  <ol>
                    <li>Kullanıcı adınızla sisteme giriş yapın</li>
                    <li>"Şifre Değiştir" seçeneğine tıklayın</li>
                    <li>Mevcut şifrenizi ve yeni şifrenizi girin</li>
                    <li>Yeni şifrenizi doğrulayın</li>
                    <li>"Kaydet" butonuna tıklayarak şifrenizi güncelleyin</li>
                  </ol>
                  <p><strong>Not:</strong> Şifrenizi unuttuysanız, sistem yöneticisiyle iletişime geçin.</p>`
        }
      ]
    }
  ];

  // Admin rolüne sahip kullanıcıların görebileceği kategoriler
  adminHelpCategories: HelpCategory[] = [
    {
      title: 'Araç İşlemleri',
      icon: 'directions_car',
      faqs: [
        {
          question: 'Nasıl yeni araç ekleyebilirim?',
          answer: `Yeni araç eklemek için:
                  <ol>
                    <li>Sol menüden "Araç Kayıt" bölümüne tıklayın</li>
                    <li>"Yeni Araç Ekle" formunu doldurun:
                      <ul>
                        <li>Askeri plaka, sivil plaka bilgilerini girin</li>
                        <li>Şasi numarası ve motor numarası bilgilerini girin</li>
                        <li>Marka, model ve araç tipini seçin</li>
                        <li>Tahsis makamını belirtin</li>
                      </ul>
                    </li>
                    <li>"Kaydet" butonuna tıklayarak aracı sisteme ekleyin</li>
                  </ol>
                  <p><strong>Not:</strong> Plaka, şasi numarası ve motor numarası bilgileri sistemde tekil olmalıdır.</p>`
        },
        {
          question: 'Araç bilgilerini nasıl güncelleyebilirim?',
          answer: `Araç bilgilerini güncellemek için:
                  <ol>
                    <li>Sol menüden "Araç Kayıt" bölümüne tıklayın</li>
                    <li>Araç listesinden güncellemek istediğiniz aracın yanındaki kalem ikonuna tıklayın</li>
                    <li>Açılan formda gerekli değişiklikleri yapın</li>
                    <li>"Güncelle" butonuna tıklayarak değişiklikleri kaydedin</li>
                  </ol>`
        },
        {
          question: 'Araçları nasıl aktif/pasif yapabilirim?',
          answer: `Araçları aktif veya pasif duruma getirmek için:
                  <ol>
                    <li>"Araç Kayıt" bölümünde, araç listesindeki "Durum" sütununda bulunan göz ikonuna tıklayın</li>
                    <li>Göz açık ise araç aktif, kapalı ise pasiftir</li>
                    <li>İkona her tıklandığında araç durumu değişecektir</li>
                  </ol>
                  <p><strong>Önemli:</strong> Pasif araçlar sevk işlemlerinde ve raporlarda görüntülenmez!</p>`
        }
      ]
    },
    {
      title: 'Sürücü İşlemleri',
      icon: 'person_add',
      faqs: [
        {
          question: 'Yeni sürücü nasıl eklerim?',
          answer: `Yeni sürücü eklemek için:
                  <ol>
                    <li>Sol menüden "Sürücü Kayıt" bölümüne tıklayın</li>
                    <li>Açılan formda sürücü bilgilerini doldurun:
                      <ul>
                        <li>TC kimlik numarası (11 karakter)</li>
                        <li>Ad soyad bilgileri</li>
                        <li>Telefon numarası</li>
                        <li>Rütbe bilgisi</li>
                        <li>Sicil numarası</li>
                        <li>Doğum tarihi ve doğum yeri</li>
                      </ul>
                    </li>
                    <li>"Kaydet" butonuna tıklayın</li>
                  </ol>
                  <p><strong>Not:</strong> TC kimlik numarası, telefon numarası ve sicil numarası sistemdeki diğer sürücülerle aynı olamaz.</p>`
        },
        {
          question: 'Sürücü bilgilerini nasıl güncellerim?',
          answer: `Sürücü bilgilerini güncellemek için:
                  <ol>
                    <li>Sol menüden "Sürücü Kayıt" bölümüne tıklayın</li>
                    <li>Sürücü listesinde güncellemek istediğiniz kişinin yanındaki kalem ikonuna tıklayın</li>
                    <li>Açılan formda gerekli değişiklikleri yapın</li>
                    <li>"Güncelle" butonuna tıklayarak değişiklikleri kaydedin</li>
                  </ol>
                  <p><strong>Not:</strong> TC kimlik numarası değiştirilemez.</p>`
        },
        {
          question: 'Sürücü durumunu nasıl değiştiririm?',
          answer: `Sürücüleri aktif veya pasif duruma getirmek için:
                  <ol>
                    <li>"Sürücü Kayıt" bölümünde, sürücü listesindeki "Durum" sütununda bulunan göz ikonuna tıklayın</li>
                    <li>Göz açık ise sürücü aktif, kapalı ise pasiftir</li>
                    <li>İkona her tıklandığında sürücü durumu değişecektir</li>
                  </ol>
                  <p><strong>Önemli:</strong> Pasif sürücüler görev atamasında ve raporlarda görünmez!</p>`
        }
      ]
    },
    {
      title: 'Personel İşlemleri',
      icon: 'people',
      faqs: [
        {
          question: 'Personel kayıtları nasıl oluşturulur?',
          answer: `Personel kaydı oluşturmak için:
                  <ol>
                    <li>Sol menüden "Personel İşlemleri" bölümüne tıklayın</li>
                    <li>"Yeni Personel Ekle" formunda:
                      <ul>
                        <li>İsim alanına personelin adını ve rütbesini girin (örn: ALBAY AHMET YILMAZ)</li>
                        <li>Rütbe/Makam alanına personelin görevini girin (örn: TABUR KOMUTANI)</li>
                      </ul>
                    </li>
                    <li>"Kaydet" butonuna tıklayarak personel kaydını oluşturun</li>
                  </ol>
                  <p><strong>Not:</strong> Personel kayıtları, araç görevlendirmelerinde "Tahsisli Makam" olarak kullanılır.</p>`
        },
        {
          question: 'Personel bilgileri nasıl güncellenir?',
          answer: `Personel bilgilerini güncellemek için:
                  <ol>
                    <li>"Personel İşlemleri" sayfasında, personel listesindeki düzenlemek istediğiniz kişinin kalem ikonuna tıklayın</li>
                    <li>Form alanlarında gerekli değişiklikleri yapın</li>
                    <li>"Güncelle" butonuna tıklayarak bilgileri kaydedin</li>
                  </ol>`
        }
      ]
    },
    {
      title: 'Rapor İşlemleri',
      icon: 'assessment',
      faqs: [
        {
          question: 'Raporlar nasıl oluşturulur?',
          answer: `Rapor oluşturmak için:
                  <ol>
                    <li>Sol menüden "Raporlar" bölümüne tıklayın</li>
                    <li>Filtreleme seçeneklerini kullanarak istediğiniz raporu oluşturun:
                      <ul>
                        <li>Araç seçimi yaparak belirli araçların raporlarını görebilirsiniz</li>
                        <li>Araç tipi seçerek belirli tipteki araçların raporlarını görebilirsiniz</li>
                        <li>Sürücü seçerek belirli sürücülerin görevlerini görebilirsiniz</li>
                        <li>Görev tipi ve tarih aralığı seçebilirsiniz</li>
                      </ul>
                    </li>
                    <li>"Filtrele" butonuna tıklayarak raporu oluşturun</li>
                  </ol>`
        },
        {
          question: 'Rapor dışa aktarma işlemleri nasıl yapılır?',
          answer: `Raporları dışa aktarmak için:
                  <ol>
                    <li>Öncelikle istediğiniz filtreleri uygulayarak rapor verilerini hazırlayın</li>
                    <li>Sayfanın alt kısmındaki "Excel'e Aktar" butonuna tıklayarak Excel formatında dışa aktarabilirsiniz</li>
                    <li>"PDF'e Aktar" butonuyla PDF formatında dışa aktarabilirsiniz</li>
                    <li>"Yazdır" butonuyla raporu doğrudan yazıcıya gönderebilirsiniz</li>
                  </ol>
                  <p><strong>İpucu:</strong> Dışa aktarılan raporlarda başlık ve tarih bilgileri otomatik olarak eklenir.</p>`
        }
      ]
    },
    {
      title: 'Kullanıcı Yönetimi',
      icon: 'manage_accounts',
      faqs: [
        {
          question: 'Yeni kullanıcı nasıl oluşturulur?',
          answer: `Yeni kullanıcı oluşturmak için:
                  <ol>
                    <li>Sol menüden "Kullanıcı Yönetimi" bölümüne tıklayın</li>
                    <li>"Yeni Kullanıcı Ekle" formunu doldurun:
                      <ul>
                        <li>Kullanıcı adı olarak 11 haneli TC kimlik numarası girin</li>
                        <li>Şifre belirleyin (en az 12 karakter, 1 büyük harf, 1 rakam, 1 özel karakter içermeli)</li>
                        <li>Ad soyad bilgisini girin</li>
                        <li>Kullanıcı rolünü seçin: "Yönetici" veya "Kullanıcı"</li>
                      </ul>
                    </li>
                    <li>"Kaydet" butonuna tıklayın</li>
                  </ol>
                  <p><strong>Önemli:</strong> Yönetici rolündeki kullanıcılar tüm işlemleri yapabilirken, normal kullanıcılar sadece görev oluşturma işlemlerini yapabilir.</p>`
        },
        {
          question: 'Kullanıcı şifresi nasıl değiştirilir?',
          answer: `Kullanıcı şifresini değiştirmek için:
                  <ol>
                    <li>"Kullanıcı Yönetimi" sayfasında, şifresini değiştirmek istediğiniz kullanıcının kalem ikonuna tıklayın</li>
                    <li>"Şifre Değiştir" checkboxını işaretleyin</li>
                    <li>Yeni şifreyi belirleyin (en az 12 karakter, 1 büyük harf, 1 rakam, 1 özel karakter)</li>
                    <li>"Güncelle" butonuna tıklayarak şifreyi değiştirin</li>
                  </ol>
                  <p><strong>Not:</strong> Şifre değişikliği yapıldığında kullanıcı bir sonraki girişinde yeni şifreyle giriş yapmalıdır.</p>`
        },
        {
          question: 'Kullanıcı hesabı nasıl devre dışı bırakılır?',
          answer: `Kullanıcıyı devre dışı bırakmak için:
                  <ol>
                    <li>"Kullanıcı Yönetimi" sayfasında, devre dışı bırakmak istediğiniz kullanıcının "Durum" sütunundaki göz ikonuna tıklayın</li>
                    <li>Göz kapalı duruma geldiğinde kullanıcı pasif hale getirilmiş olur</li>
                    <li>Pasif kullanıcılar sisteme giriş yapamaz</li>
                  </ol>
                  <p><strong>İpucu:</strong> Geçici olarak devre dışı bırakılan kullanıcıları aynı yöntemle tekrar aktif edebilirsiniz.</p>`
        }
      ]
    },
    {
      title: 'Yazılım Hakkında',
      icon: 'code',
      faqs: [
        {
          question: 'Uygulama hangi teknolojilerle geliştirildi?',
          answer: `
            <div class="tech-details">
              <h4>Geliştirme Teknolojileri</h4>
              <ul>
                <li><strong>Frontend:</strong> Angular 19.2</li>
                <li><strong>UI Framework:</strong> Angular Material</li>
                <li><strong>Backend:</strong> Node.js Express</li>
                <li><strong>Veritabanı:</strong> PostgreSQL</li>
                <li><strong>Kimlik Doğrulama:</strong> JSON Web Tokens (JWT)</li>
                <li><strong>Şifreleme:</strong> Bcrypt</li>
              </ul>
              
              <h4>Performans & Güvenlik</h4>
              <ul>
                <li>Özel tasarlanmış hafif bileşenler</li>
                <li>Client-side önbellek optimizasyonu</li>
                <li>Güvenli şifre politikası (12+ karakter, büyük/küçük harf, rakam, özel karakter)</li>
                <li>Role dayalı erişim kontrolü (RBAC)</li>
                <li>Girdi güvenliği (SQL Injection'a karşı)</li>
              </ul>
              
              <h4>Diğer Özellikler</h4>
              <ul>
                <li>Responsive tasarım (mobil cihaz uyumu)</li>
                <li>PDF ve Excel rapor alınabilmesi</li>
                <li>Otomatik oturum kontrolü</li>
                <li>Veritabanı işlemleri için hata yönetimi</li>
              </ul>
            </div>
          `
        },
        {
          question: 'Sistem gereksinimleri nelerdir?',
          answer: `
            <div class="system-requirements">
              <h4>Sunucu Gereksinimleri</h4>
              <ul>
                <li>Node.js 20.x veya üzeri</li>
                <li>PostgreSQL 14.x veya üzeri</li>
                <li>En az 2GB RAM</li>
                <li>5GB disk alanı</li>
                <li>Desteklenen İşletim Sistemleri: Linux, Windows Server, macOS</li>
              </ul>
              
              <h4>İstemci Gereksinimleri</h4>
              <ul>
                <li>Modern web tarayıcısı:
                  <ul>
                    <li>Google Chrome 92+</li>
                    <li>Firefox 90+</li>
                    <li>Edge 92+</li>
                    <li>Safari 15+</li>
                  </ul>
                </li>
                <li>JavaScript aktivasyonu</li>
                <li>Çerezlerin aktif olması</li>
              </ul>
              
              <p><strong>Not:</strong> Bu uygulama backend ve frontend mimarisi ayrı olacak şekilde geliştirilmiş olup, tek bir sunucuda veya ayrı sunucularda çalıştırılabilir.</p>
            </div>
          `
        },
        {
          question: 'Yazılım versiyonu ve güncellemeler',
          answer: `
            <div class="version-info">
              <h4>Mevcut Sürüm</h4>
              <p>v1.0.0 (Mart 2025)</p>
              
              </div>
          `
        },
        {
          question: 'Uygulama hakkında teknik destek',
          answer: `
            <div class="tech-support">
              
              <h4>Bilinen Sorunlar</h4>
              <ul>
                <li>Çok yüksek veri hacminde rapor oluşturma zaman aşımına uğrayabilir. Bu durumda, daha küçük tarih aralıkları seçilerek raporlar oluşturulabilir.</li>
                <li>Bazı tarayıcılarda sayfalar arası geçişlerde geçici yükleme gecikmeleri gözlemlenebilir.</li>
              </ul>
              
              <p><strong>İpucu:</strong> Herhangi bir teknik sorun yaşandığında, tarayıcı önbelleğini temizlemek ve sayfayı yenilemek çoğu sorunu çözecektir.</p>
            </div>
          `
        }
      ]
    }
  ];

  isAdmin: boolean = false;

  constructor(private authService: AuthService) {
    console.log('HelpCenter component constructor çalıştı');
  }

  ngOnInit(): void {
    console.log('HelpCenter component initialized');
    // Kullanıcı rolünü kontrol et
    this.isAdmin = this.authService.getUserRole() === 'admin';
  }
}
