import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell,
  Database,
  Eye,
  Download,
  Zap,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [ocrAccuracy, setOcrAccuracy] = useState(85);
  const [autoProcessing, setAutoProcessing] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSaveSettings = () => {
    toast({
      title: "Ayarlar kaydedildi",
      description: "Tüm değişiklikler başarıyla uygulandı.",
    });
  };

  const systemStats = [
    { label: "OCR Modeli Versiyonu", value: "v2.4.1", status: "güncel" },
    { label: "NLP Dil Modeli", value: "Türkçe-TR", status: "aktif" },
    { label: "Son Güncelleme", value: "15.01.2024", status: "güncel" },
    { label: "Veri Saklama Süresi", value: "30 gün", status: "ayarlı" },
  ];

  const apiSettings = [
    { name: "OCR API Anahtarı", status: "configured", description: "Google Vision API bağlantısı aktif" },
    { name: "Veritabanı Bağlantısı", status: "connected", description: "PostgreSQL bağlantısı sağlıklı" },
    { name: "Dosya Depolama", status: "configured", description: "Supabase Storage bağlantısı aktif" },
    { name: "Yedekleme Sistemi", status: "enabled", description: "Günlük otomatik yedekleme aktif" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-insurance-navy">
          Sistem Ayarları
        </h1>
        <p className="text-insurance-gray mt-2">
          OCR ve NLP ayarlarını yapılandırın, sistem performansını optimizasyonu
        </p>
      </div>

      {/* User Profile Settings */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <User className="w-5 h-5" />
            <span>Kullanıcı Profili</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-insurance-navy">Ad Soyad</label>
              <Input defaultValue="Admin Kullanıcı" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-insurance-navy">E-posta</label>
              <Input defaultValue="admin@sirket.com" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-insurance-navy">Şirket/Organizasyon</label>
            <Input defaultValue="Sigorta Şirketi A.Ş." className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* OCR & NLP Settings */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Eye className="w-5 h-5" />
            <span>OCR ve NLP Ayarları</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-insurance-navy">
                Minimum OCR Doğruluk Oranı (%)
              </label>
              <span className="text-sm font-semibold text-accent">{ocrAccuracy}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              value={ocrAccuracy}
              onChange={(e) => setOcrAccuracy(Number(e.target.value))}
              className="w-full h-2 bg-insurance-light-gray rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-insurance-gray mt-1">
              <span>70% (Hızlı)</span>
              <span>95% (Hassas)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
            <div>
              <h4 className="font-medium text-insurance-navy">Otomatik İşleme</h4>
              <p className="text-sm text-insurance-gray">Belgeler yüklendikten hemen sonra otomatik olarak işlenir</p>
            </div>
            <Switch checked={autoProcessing} onCheckedChange={setAutoProcessing} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-insurance-navy">Desteklenen Diller</label>
              <div className="mt-2 space-y-2">
                <Badge className="bg-success text-success-foreground mr-2">Türkçe</Badge>
                <Badge variant="outline" className="border-insurance-gray text-insurance-gray mr-2">İngilizce</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-insurance-navy">Görüntü Ön İşleme</label>
              <div className="mt-2 space-y-1 text-sm text-insurance-gray">
                <div>✓ Gürültü giderme</div>
                <div>✓ Kontrast ayarlama</div>
                <div>✓ Çarpıklık düzeltme</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Database className="w-5 h-5" />
            <span>Sistem Durumu</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div>
                  <h4 className="font-medium text-insurance-navy">{stat.label}</h4>
                  <p className="text-sm text-insurance-gray">{stat.value}</p>
                </div>
                <Badge className="bg-success text-success-foreground">
                  {stat.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Shield className="w-5 h-5" />
            <span>API ve Entegrasyonlar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiSettings.map((api, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-insurance-navy">{api.name}</h4>
                    <Badge 
                      className={`${
                        api.status === 'configured' || api.status === 'connected' || api.status === 'enabled'
                          ? 'bg-success text-success-foreground'
                          : 'bg-warning text-warning-foreground'
                      }`}
                    >
                      {api.status === 'configured' ? 'Yapılandırıldı' :
                       api.status === 'connected' ? 'Bağlı' :
                       api.status === 'enabled' ? 'Etkin' : 'Beklemede'}
                    </Badge>
                  </div>
                  <p className="text-sm text-insurance-gray mt-1">{api.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  Yapılandır
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Bell className="w-5 h-5" />
            <span>Bildirim Ayarları</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
            <div>
              <h4 className="font-medium text-insurance-navy">E-posta Bildirimleri</h4>
              <p className="text-sm text-insurance-gray">İşlem tamamlandığında e-posta gönder</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-insurance-navy">Bildirim E-postası</label>
              <Input defaultValue="admin@sirket.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-insurance-navy">Rapor Sıklığı</label>
              <select className="w-full mt-1 p-2 border border-border rounded-md bg-background">
                <option>Günlük</option>
                <option>Haftalık</option>
                <option>Aylık</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export & Backup */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Download className="w-5 h-5" />
            <span>Veri Yönetimi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Verileri Dışa Aktar
            </Button>
            <Button 
              variant="outline" 
              className="border-success text-success hover:bg-success hover:text-success-foreground"
            >
              <Database className="w-4 h-4 mr-2" />
              Yedek Oluştur
            </Button>
            <Button 
              variant="outline" 
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Verileri Temizle
            </Button>
          </div>
          <p className="text-xs text-insurance-gray mt-4">
            Veri yedekleme 30 gün saklanır. Kritik veriler için düzenli dışa aktarma önerilir.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          className="bg-gradient-primary text-primary-foreground hover:bg-primary-hover shadow-card px-8"
        >
          <Zap className="w-4 h-4 mr-2" />
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
};

export default Settings;