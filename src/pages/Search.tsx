import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search as SearchIcon, 
  Filter, 
  Calendar,
  User,
  FileText,
  Car,
  CreditCard,
  Eye,
  Download
} from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults] = useState([
    {
      id: "1",
      fileName: "kasko_police_2024_001.pdf",
      customerName: "Ahmet Yılmaz",
      nationalId: "12345678901",
      policyNumber: "POL-2024-001",
      vehiclePlate: "34 ABC 123",
      amount: "15.000 ₺",
      uploadDate: "2024-01-15",
      documentType: "policy",
      match: "customer"
    },
    {
      id: "2", 
      fileName: "hasar_raporu_034.jpg",
      customerName: "Fatma Demir",
      nationalId: "98765432109",
      policyNumber: "POL-2024-002",
      vehiclePlate: "06 XYZ 789",
      amount: "8.500 ₺",
      uploadDate: "2024-01-14",
      documentType: "claim",
      match: "policy"
    }
  ]);

  const searchFilters = [
    { label: "Müşteri Adı", icon: User, active: true },
    { label: "TC Kimlik", icon: CreditCard, active: false },
    { label: "Poliçe No", icon: FileText, active: false },
    { label: "Plaka", icon: Car, active: false },
  ];

  const recentSearches = [
    "Ahmet Yılmaz",
    "POL-2024-001", 
    "34 ABC 123",
    "12345678901"
  ];

  const quickFilters = [
    { label: "Bugün", period: "today" },
    { label: "Bu Hafta", period: "week" },
    { label: "Bu Ay", period: "month" },
    { label: "Son 3 Ay", period: "quarter" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-insurance-navy">
          Gelişmiş Arama
        </h1>
        <p className="text-insurance-gray mt-2">
          Belgelerde detaylı arama yapın ve ihtiyacınız olan verileri hızlıca bulun
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-insurance-gray" />
              <Input
                placeholder="Müşteri adı, TC kimlik, poliçe numarası, plaka..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button 
              className="bg-gradient-primary text-primary-foreground hover:bg-primary-hover shadow-card h-12 px-8"
            >
              <SearchIcon className="w-5 h-5 mr-2" />
              Ara
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Filters and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Filter className="w-5 h-5" />
              <span>Arama Filtreleri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchFilters.map((filter, index) => {
                const Icon = filter.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border hover:bg-insurance-light-gray/50 cursor-pointer">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm font-medium text-insurance-navy">
                      {filter.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      filter.active 
                        ? 'bg-primary border-primary' 
                        : 'border-insurance-gray'
                    }`} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Time Filters */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <Calendar className="w-5 h-5" />
              <span>Zaman Filtresi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-insurance-blue text-insurance-blue hover:bg-insurance-light-blue"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex space-x-2">
                <Input type="date" className="flex-1" />
                <Input type="date" className="flex-1" />
              </div>
              <p className="text-xs text-insurance-gray">Özel tarih aralığı seçin</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Searches */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-insurance-navy">
              <SearchIcon className="w-5 h-5" />
              <span>Son Aramalar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded border border-border hover:bg-insurance-light-gray/50 cursor-pointer"
                >
                  <span className="text-sm text-insurance-navy">{search}</span>
                  <SearchIcon className="w-4 h-4 text-insurance-gray" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-insurance-navy">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Arama Sonuçları</span>
              <Badge className="bg-primary text-primary-foreground">
                {searchResults.length} sonuç
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-success text-success hover:bg-success hover:text-success-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Sonuçları Dışa Aktar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div 
                key={result.id}
                className="p-4 bg-background rounded-lg border border-border hover:shadow-card transition-smooth"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-insurance-navy">{result.fileName}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${
                          result.documentType === 'policy' ? 'border-policy-blue text-policy-blue' :
                          result.documentType === 'claim' ? 'border-claim-orange text-claim-orange' :
                          'border-report-purple text-report-purple'
                        }`}
                      >
                        {result.documentType === 'policy' ? 'Poliçe' :
                         result.documentType === 'claim' ? 'Hasar' : 'Rapor'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-insurance-gray">Müşteri: </span>
                        <span className="font-medium text-insurance-navy">{result.customerName}</span>
                      </div>
                      <div>
                        <span className="text-insurance-gray">TC: </span>
                        <span className="font-medium text-insurance-navy">{result.nationalId}</span>
                      </div>
                      <div>
                        <span className="text-insurance-gray">Poliçe: </span>
                        <span className="font-medium text-insurance-navy">{result.policyNumber}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                      {result.vehiclePlate && (
                        <div>
                          <span className="text-insurance-gray">Plaka: </span>
                          <span className="font-medium text-insurance-navy">{result.vehiclePlate}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-insurance-gray">Tutar: </span>
                        <span className="font-medium text-accent">{result.amount}</span>
                      </div>
                      <div>
                        <span className="text-insurance-gray">Tarih: </span>
                        <span className="font-medium text-insurance-navy">{result.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm" 
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Görüntüle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      İndir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {searchResults.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-insurance-gray mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-insurance-navy mb-2">
                Sonuç bulunamadı
              </h3>
              <p className="text-insurance-gray">
                Arama kriterlerinizi değiştirip tekrar deneyin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Search;