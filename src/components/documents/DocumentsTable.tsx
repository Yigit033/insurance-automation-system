import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal,
  FileText,
  Calendar,
  User
} from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  uploadDate: string;
  status: "completed" | "processing" | "error";
  customerName: string;
  nationalId: string;
  policyNumber: string;
  vehiclePlate?: string;
  amount: string;
  documentType: "policy" | "claim" | "report";
  confidence: number;
}

// Mock data - sigorta belgeleri
const mockDocuments: Document[] = [
  {
    id: "1",
    fileName: "kasko_police_2024_001.pdf",
    uploadDate: "2024-01-15",
    status: "completed",
    customerName: "Ahmet Yılmaz",
    nationalId: "12345678901",
    policyNumber: "POL-2024-001",
    vehiclePlate: "34 ABC 123",
    amount: "15.000 ₺",
    documentType: "policy",
    confidence: 96
  },
  {
    id: "2",
    fileName: "hasar_raporu_034.jpg",
    uploadDate: "2024-01-14",
    status: "completed",
    customerName: "Fatma Demir",
    nationalId: "98765432109",
    policyNumber: "POL-2024-002",
    vehiclePlate: "06 XYZ 789",
    amount: "8.500 ₺",
    documentType: "claim",
    confidence: 89
  },
  {
    id: "3",
    fileName: "ekspertiz_raporu.pdf",
    uploadDate: "2024-01-13",
    status: "processing",
    customerName: "Mehmet Kaya",
    nationalId: "55667788990",
    policyNumber: "POL-2024-003",
    amount: "12.750 ₺",
    documentType: "report",
    confidence: 0
  },
  {
    id: "4",
    fileName: "trafik_sigortasi.png",
    uploadDate: "2024-01-12",
    status: "completed",
    customerName: "Ayşe Özkan",
    nationalId: "11223344556",
    policyNumber: "TRF-2024-001",
    vehiclePlate: "35 DEF 456",
    amount: "2.300 ₺",
    documentType: "policy",
    confidence: 94
  }
];

const DocumentsTable = () => {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Tamamlandı</Badge>;
      case "processing":
        return <Badge className="bg-processing text-white">İşleniyor</Badge>;
      case "error":
        return <Badge variant="destructive">Hata</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: Document["documentType"]) => {
    switch (type) {
      case "policy":
        return <Badge variant="outline" className="border-policy-blue text-policy-blue">Poliçe</Badge>;
      case "claim":
        return <Badge variant="outline" className="border-claim-orange text-claim-orange">Hasar</Badge>;
      case "report":
        return <Badge variant="outline" className="border-report-purple text-report-purple">Rapor</Badge>;
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Dosya Adı", "Yüklenme Tarihi", "Durum", "Müşteri Adı", "TC Kimlik", "Poliçe No", "Plaka", "Tutar", "Güven Skoru"].join(","),
      ...filteredDocuments.map(doc => [
        doc.fileName,
        doc.uploadDate,
        doc.status === "completed" ? "Tamamlandı" : doc.status === "processing" ? "İşleniyor" : "Hata",
        doc.customerName,
        doc.nationalId,
        doc.policyNumber,
        doc.vehiclePlate || "",
        doc.amount,
        doc.confidence.toString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sigorta_belgeleri_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2 text-insurance-navy">
            <FileText className="w-5 h-5" />
            <span>İşlenmiş Belgeler</span>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-insurance-gray" />
              <Input
                placeholder="Belgeler, müşteriler, poliçe ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-insurance-blue text-insurance-blue">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Tüm Durumlar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  Tamamlandı
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
                  İşleniyor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("error")}>
                  Hata
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <Button 
              onClick={exportToCSV} 
              className="bg-gradient-primary text-primary-foreground hover:bg-primary-hover"
            >
              <Download className="w-4 h-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-insurance-light-gray">
                <TableHead className="font-semibold text-insurance-navy">Belge</TableHead>
                <TableHead className="font-semibold text-insurance-navy">Müşteri Bilgileri</TableHead>
                <TableHead className="font-semibold text-insurance-navy">Poliçe/Hasar</TableHead>
                <TableHead className="font-semibold text-insurance-navy">Durum</TableHead>
                <TableHead className="font-semibold text-insurance-navy">Güven Skoru</TableHead>
                <TableHead className="font-semibold text-insurance-navy">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-insurance-light-gray/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-insurance-navy">{doc.fileName}</div>
                      <div className="flex items-center space-x-2 text-xs text-insurance-gray">
                        <Calendar className="w-3 h-3" />
                        <span>{doc.uploadDate}</span>
                        {getDocumentTypeBadge(doc.documentType)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-insurance-gray" />
                        <span className="font-medium text-insurance-navy">{doc.customerName}</span>
                      </div>
                      <div className="text-xs text-insurance-gray">TC: {doc.nationalId}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-insurance-navy">{doc.policyNumber}</div>
                      {doc.vehiclePlate && (
                        <div className="text-xs text-insurance-gray">Plaka: {doc.vehiclePlate}</div>
                      )}
                      <div className="text-sm font-semibold text-accent">{doc.amount}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(doc.status)}
                  </TableCell>
                  
                  <TableCell>
                    {doc.status === "completed" && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-insurance-light-gray rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              doc.confidence >= 90 ? 'bg-success' :
                              doc.confidence >= 75 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${doc.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-insurance-gray">{doc.confidence}%</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          İndir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-insurance-gray">
          Toplam {filteredDocuments.length} belge gösteriliyor
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsTable;