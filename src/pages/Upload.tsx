import FileUpload from "@/components/upload/FileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  FileText, 
  Image, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const Upload = () => {
  const supportedFormats = [
    { extension: "PDF", description: "Sigorta poliçeleri, hasar raporları", icon: FileText },
    { extension: "JPG/JPEG", description: "Fotoğraflanmış belgeler", icon: Image },
    { extension: "PNG", description: "Ekran görüntüleri, taranmış belgeler", icon: Image },
    { extension: "TIFF", description: "Yüksek kaliteli taranmış belgeler", icon: Image },
  ];

  const extractedFields = [
    "Müşteri Adı/Soyadı",
    "TC Kimlik Numarası",
    "Poliçe Numarası", 
    "Başlangıç/Bitiş Tarihleri",
    "Tutar (₺)",
    "Araç Plaka Numarası",
    "Şasi/Motor Numarası",
    "Eksper/Doktor/Noter Adı"
  ];

  const processingSteps = [
    { 
      step: 1, 
      title: "Dosya Yükleme", 
      description: "Belgeleriniz güvenli olarak sisteme yüklenir",
      icon: UploadIcon 
    },
    { 
      step: 2, 
      title: "OCR İşleme", 
      description: "Türkçe karakterler desteklenerek metin çıkarılır",
      icon: FileText 
    },
    { 
      step: 3, 
      title: "NLP Analiz", 
      description: "Önemli alanlar otomatik olarak tespit edilir",
      icon: Clock 
    },
    { 
      step: 4, 
      title: "Doğrulama", 
      description: "Çıkarılan veriler format kontrolünden geçer",
      icon: CheckCircle 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-insurance-navy">
          Belge Yükleme
        </h1>
        <p className="text-insurance-gray mt-2">
          Sigorta belgelerinizi yükleyin ve otomatik veri çıkarma işlemini başlatın
        </p>
      </div>

      {/* Main Upload Area */}
      <FileUpload />

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supported Formats */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <FileText className="w-5 h-5" />
              <span>Desteklenen Formatlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supportedFormats.map((format, index) => {
                const Icon = format.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                    <Icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-primary text-primary">
                          {format.extension}
                        </Badge>
                        <span className="text-sm font-medium text-insurance-navy">
                          {format.description}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-insurance-light-blue rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-xs text-insurance-navy">
                  <strong>Maksimum dosya boyutu:</strong> 10MB<br />
                  <strong>Toplu yükleme:</strong> Aynı anda birden fazla dosya yükleyebilirsiniz
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Fields */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <CheckCircle className="w-5 h-5" />
              <span>Çıkarılan Veriler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {extractedFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-background rounded border border-border">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-insurance-navy">{field}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-success-light rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                <div className="text-xs text-success">
                  <strong>AI destekli:</strong> Türkçe NLP modeli ile %90+ doğruluk oranı
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Steps */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Clock className="w-5 h-5" />
            <span>İşlem Adımları</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {processingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-3 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="mb-2">
                    <Badge className="bg-insurance-blue text-primary-foreground mb-2">
                      Adım {step.step}
                    </Badge>
                    <h3 className="font-semibold text-insurance-navy">{step.title}</h3>
                  </div>
                  <p className="text-xs text-insurance-gray">{step.description}</p>
                  
                  {/* Connection line */}
                  {index < processingSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-border transform translate-x-4" 
                         style={{position: 'relative', marginTop: '1rem'}} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <AlertCircle className="w-5 h-5" />
            <span>En İyi Sonuçlar İçin İpuçları</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-insurance-navy">Görüntü Kalitesi</h4>
              <ul className="text-sm text-insurance-gray space-y-1">
                <li>• Belgelerin net ve okunaklı olduğundan emin olun</li>
                <li>• Gölge ve parlamaları minimize edin</li>
                <li>• Minimum 300 DPI çözünürlük kullanın</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-insurance-navy">Belge Formatı</h4>
              <ul className="text-sm text-insurance-gray space-y-1">
                <li>• Belgenin tamamının görünür olduğundan emin olun</li>
                <li>• Çok sayfalı belgeler için PDF formatını tercih edin</li>
                <li>• Düz bir yüzeyde tarama yapın</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;