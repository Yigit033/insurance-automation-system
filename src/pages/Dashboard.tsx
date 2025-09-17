import StatsCard from "@/components/dashboard/StatsCard";
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import { DataExport } from '@/components/export/DataExport';
import { QueueMonitor } from '@/components/queue/QueueMonitor';
import { ProcessingLogs } from '@/components/queue/ProcessingLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Upload,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    totalDocuments, 
    todayProcessed, 
    inQueue, 
    successRate, 
    recentDocuments, 
    loading: statsLoading 
  } = useDashboardStats();
  const { analytics, loading: analyticsLoading } = useAnalytics();

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

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-insurance-gray">Yükleniyor...</div>
      </div>
    );
  }

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
          title="Toplam Belge"
          value={totalDocuments.toString()}
          description="Sistemde kayıtlı belgeler"
          icon={FileText}
          trend="neutral"
          color="primary"
        />
        <StatsCard
          title="Bugün İşlenen"
          value={todayProcessed.toString()}
          description="Bugün tamamlanan işlemler"
          icon={CheckCircle}
          trend="up"
          color="success"
        />
        <StatsCard
          title="İşleme Kuyruğu"
          value={inQueue.toString()}
          description="Bekleyen belgeler"
          icon={Clock}
          trend="neutral"
          color="warning"
        />
        <StatsCard
          title="Başarı Oranı"
          value={`${successRate}%`}
          description="Başarıyla işlenen belgeler"
          icon={TrendingUp}
          trend="up"
          color="accent"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analitik
          </TabsTrigger>
          <TabsTrigger value="logs">İşlem Logları</TabsTrigger>
          <TabsTrigger value="export">Dışa Aktarım</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

            {/* Queue Monitor */}
            <QueueMonitor />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-80 bg-gradient-card animate-pulse rounded-lg"></div>
              <div className="h-80 bg-gradient-card animate-pulse rounded-lg"></div>
              <div className="h-80 bg-gradient-card animate-pulse rounded-lg"></div>
              <div className="h-80 bg-gradient-card animate-pulse rounded-lg"></div>
            </div>
          ) : analytics ? (
            <AnalyticsCharts analytics={analytics} />
          ) : (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center text-insurance-gray">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-insurance-navy mb-2">
                  Analitik verileri yüklenemiyor
                </h3>
                <p>Lütfen daha sonra tekrar deneyin</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <div className="grid gap-6">
            <ProcessingLogs />
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-insurance-navy">Dışa Aktarım Özeti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {analytics?.total_documents || 0}
                        </div>
                        <div className="text-sm text-insurance-gray">Toplam Belge</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {analytics?.processed_documents || 0}
                        </div>
                        <div className="text-sm text-insurance-gray">İşlenmiş Belge</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {analytics ? Object.keys(analytics.documents_by_type).length : 0}
                        </div>
                        <div className="text-sm text-insurance-gray">Farklı Tür</div>
                      </div>
                    </div>
                    <div className="text-sm text-insurance-gray">
                      Tüm belgeleriniz ve OCR ile çıkarılan veriler dışa aktarılabilir.
                      Bu, yedekleme, analiz veya başka sistemlere aktarım için idealdir.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DataExport />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;