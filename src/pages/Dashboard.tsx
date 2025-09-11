import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Upload,
  Users,
  Target,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  // Mock günlük işlem verileri
  const dailyProcessing = [
    { time: "09:00", processed: 12 },
    { time: "10:00", processed: 18 },
    { time: "11:00", processed: 25 },
    { time: "12:00", processed: 31 },
    { time: "13:00", processed: 28 },
    { time: "14:00", processed: 35 },
    { time: "15:00", processed: 42 },
    { time: "16:00", processed: 38 },
  ];

  const recentDocuments = [
    { name: "kasko_police_2024_001.pdf", customer: "Ahmet Yılmaz", status: "completed", time: "2 dk önce" },
    { name: "hasar_raporu_034.jpg", customer: "Fatma Demir", status: "processing", time: "5 dk önce" },
    { name: "ekspertiz_raporu.pdf", customer: "Mehmet Kaya", status: "completed", time: "8 dk önce" },
    { name: "trafik_sigortasi.png", customer: "Ayşe Özkan", status: "completed", time: "12 dk önce" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-insurance-navy">
            Sigorta OCR Dashboard
          </h1>
          <p className="text-insurance-gray mt-2">
            Belge işleme sistemine hoş geldiniz. Günlük performansınızı takip edin.
          </p>
        </div>
        <Button 
          className="bg-gradient-primary text-primary-foreground hover:bg-primary-hover shadow-card"
          onClick={() => window.location.href = '/upload'}
        >
          <Upload className="w-4 h-4 mr-2" />
          Yeni Belge Yükle
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Bugün İşlenen"
          value="127"
          description="↗︎ 23% geçen haftaya göre"
          icon={FileText}
          trend="up"
          color="primary"
        />
        <StatsCard
          title="İşleme Kuyruğu"
          value="8"
          description="Ortalama 3dk bekleme"
          icon={Clock}
          trend="neutral"
          color="warning"
        />
        <StatsCard
          title="Başarı Oranı"
          value="94.2%"
          description="↗︎ 2.1% artış"
          icon={CheckCircle}
          trend="up"
          color="success"
        />
        <StatsCard
          title="Zaman Tasarrufu"
          value="18.5 saat"
          description="Bu hafta otomatik işlem"
          icon={Zap}
          trend="up"
          color="accent"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing Chart */}
        <Card className="lg:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <TrendingUp className="w-5 h-5" />
              <span>Günlük İşlem Grafiği</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyProcessing.map((data, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <span className="text-xs font-medium text-insurance-gray w-12">
                    {data.time}
                  </span>
                  <div className="flex-1">
                    <Progress 
                      value={(data.processed / 50) * 100} 
                      className="h-3"
                    />
                  </div>
                  <span className="text-xs font-semibold text-insurance-navy w-8">
                    {data.processed}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-insurance-gray">Toplam Bugün:</span>
                <span className="font-semibold text-insurance-navy">
                  {dailyProcessing.reduce((sum, data) => sum + data.processed, 0)} belge
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Clock className="w-5 h-5" />
              <span>Son İşlemler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-background rounded-lg border border-border">
                  <div className="flex-shrink-0">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-insurance-navy truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-insurance-gray">
                      {doc.customer}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span 
                        className={`text-xs px-2 py-1 rounded-full ${
                          doc.status === 'completed' 
                            ? 'bg-success-light text-success' 
                            : 'bg-processing-light text-processing'
                        }`}
                      >
                        {doc.status === 'completed' ? 'Tamamlandı' : 'İşleniyor'}
                      </span>
                      <span className="text-xs text-insurance-gray">
                        {doc.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary hover:bg-insurance-light-blue"
            >
              Tümünü Görüntüle
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Target className="w-5 h-5" />
              <span>OCR Doğruluk</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-insurance-gray">TC Kimlik</span>
                <span className="text-sm font-semibold text-insurance-navy">98.5%</span>
              </div>
              <Progress value={98.5} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-insurance-gray">Poliçe No</span>
                <span className="text-sm font-semibold text-insurance-navy">96.2%</span>
              </div>
              <Progress value={96.2} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-insurance-gray">Plaka</span>
                <span className="text-sm font-semibold text-insurance-navy">94.8%</span>
              </div>
              <Progress value={94.8} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Users className="w-5 h-5" />
              <span>Kullanıcı Aktivitesi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-insurance-gray">Aktif Kullanıcılar</span>
                <span className="text-2xl font-bold text-insurance-navy">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-insurance-gray">Bu Hafta Yeni</span>
                <span className="text-lg font-semibold text-success">+3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-insurance-gray">Toplam İşlem</span>
                <span className="text-lg font-semibold text-insurance-navy">2,847</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Zap className="w-5 h-5" />
              <span>Sistem Performansı</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-insurance-gray">Ortalama İşlem Süresi</span>
                <span className="text-lg font-semibold text-insurance-navy">24s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-insurance-gray">Sistem Kullanımı</span>
                <span className="text-lg font-semibold text-accent">68%</span>
              </div>
              <Progress value={68} className="h-2" />
              <div className="text-xs text-success">↗︎ Performans optimal</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;