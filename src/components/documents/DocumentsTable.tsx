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
  User,
  Car,
  Phone,
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { DocumentDetailModal } from "./DocumentDetailModal";

const DocumentsTable = () => {
  const { documents, loading, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredDocuments = documents.filter(doc => {
    const extractedData = doc.extracted_data as any;
    const matchesSearch = 
      doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (extractedData?.customer_name && extractedData.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (extractedData?.policy_number && extractedData.policy_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground flex items-center gap-1"><CheckCircle className="w-3 h-3" />Tamamlandı</Badge>;
      case "processing":
        return <Badge className="bg-processing text-white flex items-center gap-1"><Clock className="w-3 h-3" />İşleniyor</Badge>;
      case "failed":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Hata</Badge>;
      case "uploading":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Yükleniyor</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Bilinmeyen</Badge>;
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const getDocumentTypeBadge = (documentType: string) => {
    switch (documentType) {
      case "kasko":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Kasko Sigortası</Badge>;
      case "trafik":
        return <Badge variant="outline" className="border-green-500 text-green-500">Trafik Sigortası</Badge>;
      case "deprem":
        return <Badge variant="outline" className="border-red-500 text-red-500">Deprem Sigortası</Badge>;
      case "hasar":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Hasar Raporu</Badge>;
      case "ekspertiz":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Ekspertiz Raporu</Badge>;
      case "insurance_policy":
        return <Badge variant="outline" className="border-indigo-500 text-indigo-500">Sigorta Poliçesi</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Bilinmeyen</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Dosya Adı", "Yüklenme Tarihi", "Durum", "Müşteri Adı", "TC Kimlik", "Poliçe No", "Plaka", "Tutar", "Güven Skoru", "Belge Türü"].join(","),
      ...filteredDocuments.map(doc => {
        const extractedData = doc.extracted_data as any;
        return [
          doc.original_filename,
          formatDate(doc.created_at),
          doc.status === "completed" ? "Tamamlandı" : doc.status === "processing" ? "İşleniyor" : "Hata",
          extractedData?.customer_name || "",
          extractedData?.national_id || "",
          extractedData?.policy_number || "",
          extractedData?.vehicle_plate || "",
          extractedData?.amount || "",
          doc.ocr_confidence ? `${doc.ocr_confidence}%` : "0%",
          extractedData?.document_type || "bilinmeyen"
        ].join(",");
      })
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

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-insurance-gray">Belgeler yükleniyor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Belgeler ({filteredDocuments.length})
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV İndir
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Belge, müşteri veya poliçe numarası ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="completed">Tamamlandı</option>
              <option value="processing">İşleniyor</option>
              <option value="failed">Hata</option>
              <option value="uploading">Yükleniyor</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Belge</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Poliçe Bilgileri</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Güven</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz belge bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => {
                  const extractedData = doc.extracted_data as any;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{doc.original_filename}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(doc.created_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {extractedData?.customer_name ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{extractedData.customer_name}</div>
                              {extractedData.national_id && (
                                <div className="text-xs text-muted-foreground">
                                  TC: {extractedData.national_id}
                                </div>
                              )}
                              {extractedData.phone && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {extractedData.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {extractedData?.policy_number ? (
                          <div>
                            <div className="font-medium">{extractedData.policy_number}</div>
                            {extractedData.insurance_company && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {extractedData.insurance_company}
                              </div>
                            )}
                            {extractedData.start_date && (
                              <div className="text-xs text-muted-foreground">
                                Başlangıç: {extractedData.start_date}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {extractedData?.vehicle_plate ? (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{extractedData.vehicle_plate}</div>
                              {extractedData.vehicle_brand && extractedData.vehicle_model && (
                                <div className="text-xs text-muted-foreground">
                                  {extractedData.vehicle_brand} {extractedData.vehicle_model}
                                  {extractedData.vehicle_year && ` (${extractedData.vehicle_year})`}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {extractedData?.amount ? (
                          <div className="font-medium text-green-600">{extractedData.amount}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(doc.status)}
                          {extractedData?.document_type && getDocumentTypeBadge(extractedData.document_type)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {doc.ocr_confidence !== undefined ? (
                          <div className="flex items-center gap-2 w-24">
                            <span className="text-sm font-medium">
                              %{(doc.ocr_confidence * 100).toFixed(1).replace(/\.0$/, '')}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{
                                  width: `${(doc.ocr_confidence * 100).toFixed(1)}%`,
                                  backgroundColor: doc.ocr_confidence > 0.7 ? '#10B981' : 
                                                 doc.ocr_confidence > 0.4 ? '#F59E0B' : '#EF4444'
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              İndir
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Document Detail Modal */}
    <DocumentDetailModal
      document={selectedDocument}
      isOpen={isModalOpen}
      onClose={handleCloseModal}
    />
    </>
  );
};

export default DocumentsTable;