import DocumentsTable from "@/components/documents/DocumentsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Filter,
  Download,
  Plus
} from "lucide-react";

const Documents = () => {
  const quickStats = [
    { label: "Toplam Belge", value: "2,847", trend: "+127 bu hafta", color: "primary" },
    { label: "İşlem Bekleyen", value: "8", trend: "2 dk ortalama", color: "warning" },
    { label: "Hatalı", value: "23", trend: "-5 geçen haftaya göre", color: "destructive" },
  ];

  const documentTypes = [
    { type: "Kasko Poliçeleri", count: 1247, percentage: 44, color: "policy-blue" },
    { type: "Hasar Raporları", count: 892, percentage: 31, color: "claim-orange" },
    { type: "Ekspertiz Raporları", count: 534, percentage: 19, color: "report-purple" },
    { type: "Trafik Sigorta", count: 174, percentage: 6, color: "accent" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-insurance-navy">
            Belge Yönetimi
          </h1>
          <p className="text-insurance-gray mt-2">
            İşlenmiş belgeleri görüntüleyin, filtreleyin ve dışa aktarın
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="border-insurance-blue text-insurance-blue hover:bg-insurance-light-blue"
          >
            <Filter className="w-4 h-4 mr-2" />
            Gelişmiş Filtre
          </Button>
          <Button 
            className="bg-gradient-primary text-primary-foreground hover:bg-primary-hover shadow-card"
            onClick={() => window.location.href = '/upload'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Belge
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-insurance-gray">{stat.label}</p>
                  <p className="text-2xl font-bold text-insurance-navy">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.color === 'primary' ? 'text-success' :
                    stat.color === 'warning' ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'primary' ? 'bg-insurance-light-blue' :
                  stat.color === 'warning' ? 'bg-warning-light' :
                  'bg-destructive/10'
                }`}>
                  {stat.color === 'primary' && <FileText className="w-6 h-6 text-primary" />}
                  {stat.color === 'warning' && <Clock className="w-6 h-6 text-warning" />}
                  {stat.color === 'destructive' && <AlertTriangle className="w-6 h-6 text-destructive" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Types Distribution */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <TrendingUp className="w-5 h-5" />
            <span>Belge Türü Dağılımı</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentTypes.map((docType, index) => (
              <div key={index} className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="mb-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {docType.percentage}%
                  </div>
                </div>
                <h3 className="font-semibold text-insurance-navy mb-1">{docType.type}</h3>
                <p className="text-sm text-insurance-gray mb-2">{docType.count.toLocaleString()} belge</p>
                <Badge 
                  variant="outline" 
                  className="border-primary text-primary"
                >
                  {docType.percentage}% toplam
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Documents Table */}
      <DocumentsTable />

      {/* Export Options */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <Download className="w-5 h-5" />
            <span>Toplu Dışa Aktarma</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="border-success text-success hover:bg-success hover:text-success-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel (XLSX)
            </Button>
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
          <p className="text-xs text-insurance-gray mt-4">
            Seçili filtrelere göre veriler dışa aktarılacaktır. Büyük veri setleri için işlem tamamlanana kadar bekleyin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;