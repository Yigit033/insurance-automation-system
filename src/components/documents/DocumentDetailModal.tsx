import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  User,
  Car,
  Phone,
  MapPin,
  Shield,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Copy
} from 'lucide-react';
import { Document } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';
import { getFieldValue, hasFieldValue, getFieldLabel, getAvailableFields } from '@/utils/fieldMapping';

interface DocumentDetailModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentDetailModal = ({ document, isOpen, onClose }: DocumentDetailModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'raw'>('overview');

  if (!document) return null;

  const extractedData = document.extracted_data as any;
  const processingTime = document.processing_time ? (document.processing_time / 1000).toFixed(1) : 'N/A';
  
  // Debug log'ları
  console.log('🔍 Debug - extractedData:', extractedData);
  console.log('🔍 Debug - extractedData.extracted_fields:', extractedData?.extracted_fields);
  
  // extractedFields'i doğru şekilde al
  let extractedFields = extractedData?.extracted_fields || {};
  
  // Eğer extractedFields boşsa, extractedData'dan direkt al
  if (Object.keys(extractedFields).length === 0 && extractedData) {
    extractedFields = extractedData;
  }
  
  // Belge türü ve mevcut alanları al
  const documentType = extractedData?.document_type || 'insurance_policy';
  const availableFields = getAvailableFields(extractedFields, documentType);
  
  console.log('🔍 Debug - extractedFields (final):', extractedFields);
  console.log('🔍 Debug - extractedFields keys:', Object.keys(extractedFields));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Metin panoya kopyalandı",
    });
  };

  const downloadDocument = () => {
    // This would typically download the original file
    toast({
      title: "İndirme",
      description: "Belge indirme özelliği yakında eklenecek",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <FileText className="w-6 h-6" />
            <span>Belge Detayları</span>
            <Badge className={`${getStatusColor(document.status)} text-sm px-3 py-1`}>
              {document.status === 'completed' ? 'Tamamlandı' :
               document.status === 'processing' ? 'İşleniyor' :
               document.status === 'failed' ? 'Hata' :
               document.status === 'uploading' ? 'Yükleniyor' : document.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            {document.original_filename} - {formatDate(document.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-56 space-y-3">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="w-full justify-start h-12 text-base"
              onClick={() => setActiveTab('overview')}
            >
              <FileText className="w-5 h-5 mr-3" />
              Genel Bakış
            </Button>
            <Button
              variant={activeTab === 'fields' ? 'default' : 'ghost'}
              className="w-full justify-start h-12 text-base"
              onClick={() => setActiveTab('fields')}
            >
              <User className="w-5 h-5 mr-3" />
              Çıkarılan Alanlar
            </Button>
            <Button
              variant={activeTab === 'raw' ? 'default' : 'ghost'}
              className="w-full justify-start h-12 text-base"
              onClick={() => setActiveTab('raw')}
            >
              <FileText className="w-5 h-5 mr-3" />
              Ham Veri
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[70vh]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Document Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Belge Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Dosya Adı:</span>
                        </div>
                        <p className="text-sm text-gray-600 break-all">{document.original_filename}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Yüklenme Tarihi:</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(document.created_at)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">İşlem Süresi:</span>
                        </div>
                        <p className="text-sm text-gray-600">{processingTime} saniye</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Güven Skoru:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 w-16">
                            %{(document.ocr_confidence * 100).toFixed(1).replace(/\.0$/, '')}
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{
                                width: `${(document.ocr_confidence * 100).toFixed(1)}%`,
                                backgroundColor: document.ocr_confidence > 0.7 ? '#10B981' : 
                                               document.ocr_confidence > 0.4 ? '#F59E0B' : '#EF4444'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Key Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Önemli Bilgiler</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {extractedData?.customer_name && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <User className="w-4 h-4 text-blue-500" />
                          <div>
                            <span className="text-sm font-medium">Müşteri Adı:</span>
                            <p className="text-sm text-gray-600">{extractedData.customer_name}</p>
                          </div>
                        </div>
                      )}
                      {extractedData?.policy_number && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Shield className="w-4 h-4 text-green-500" />
                          <div>
                            <span className="text-sm font-medium">Poliçe Numarası:</span>
                            <p className="text-sm text-gray-600">{extractedData.policy_number}</p>
                          </div>
                        </div>
                      )}
                      {extractedData?.vehicle_plate && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Car className="w-4 h-4 text-purple-500" />
                          <div>
                            <span className="text-sm font-medium">Araç Plakası:</span>
                            <p className="text-sm text-gray-600">{extractedData.vehicle_plate}</p>
                          </div>
                        </div>
                      )}
                      {extractedData?.amount && (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <div>
                            <span className="text-sm font-medium">Tutar:</span>
                            <p className="text-sm text-gray-600">{extractedData.amount}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {document.error_message && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-red-600">Hata Mesajı</h3>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">{document.error_message}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'fields' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {extractedData?.document_type === 'trafik' ? 'Çıkarılan Trafik Sigortası Alanları' :
                     extractedData?.document_type === 'kasko' ? 'Çıkarılan Kasko Sigortası Alanları' :
                     extractedData?.document_type === 'deprem' ? 'Çıkarılan Deprem Sigortası Alanları' :
                     extractedData?.document_type === 'hasar' ? 'Çıkarılan Hasar Raporu Alanları' :
                     extractedData?.document_type === 'ekspertiz' ? 'Çıkarılan Ekspertiz Raporu Alanları' :
                     'Çıkarılan Sigorta Poliçesi Alanları'}
                  </h3>
                  
                  {/* Insurance Policy Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {/* Customer Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-blue-600 border-b-2 border-blue-200 pb-3 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Müşteri Bilgileri
                      </h4>
                      
                      {hasFieldValue('customerName', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">{getFieldLabel('customerName', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('customerName', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('customerName', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {(extractedFields.insured_tc_number || extractedFields.tc_number) && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">TC Kimlik No:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.insured_tc_number || extractedFields.tc_number}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.insured_tc_number || extractedFields.tc_number)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {(extractedFields.policyholderStatus || extractedFields.policyholder_status) && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Sigorta Ettiren Sıfatı:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.policyholderStatus || extractedFields.policyholder_status}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.policyholderStatus || extractedFields.policyholder_status)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {(extractedFields.policyholderPhone || extractedFields.policyholder_phone) && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Telefon:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.policyholderPhone || extractedFields.policyholder_phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.policyholderPhone || extractedFields.policyholder_phone)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.insured_address && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Adres:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.insured_address}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.insured_address)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.insured_phone && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Telefon:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.insured_phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.insured_phone)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Policy Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-green-600 border-b-2 border-green-200 pb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Poliçe Bilgileri
                      </h4>
                      
                      {extractedFields.policy_number && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Poliçe No:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.policy_number}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.policy_number)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.amount && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Tutar:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.amount} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.amount)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vehicle Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-purple-600 border-b-2 pb-3 flex items-center">Araç Bilgileri</h4>
                      
                      {hasFieldValue('vehiclePlate', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{getFieldLabel('vehiclePlate', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{getFieldValue('vehiclePlate', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('vehiclePlate', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {hasFieldValue('vehicleBrand', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{getFieldLabel('vehicleBrand', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('vehicleBrand', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('vehicleBrand', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {hasFieldValue('vehicleModel', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{getFieldLabel('vehicleModel', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('vehicleModel', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('vehicleModel', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.vehicle_year && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Model Yılı:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.vehicle_year}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.vehicle_year)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.vehicle_value && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Araç Değeri:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.vehicle_value} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.vehicle_value)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.chassis_number && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Şasi No:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.chassis_number}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.chassis_number)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.motor_number && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Motor No:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.motor_number}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.motor_number)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dates and Other Info */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-orange-600 border-b-2 pb-3 flex items-center">Tarih ve Diğer Bilgiler</h4>
                      
                      {hasFieldValue('startDate', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{getFieldLabel('startDate', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('startDate', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('startDate', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {hasFieldValue('endDate', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{getFieldLabel('endDate', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('endDate', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('endDate', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {hasFieldValue('issueDate', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{getFieldLabel('issueDate', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('issueDate', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('issueDate', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.expert_info && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Eksper/Doktor/Noter:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.expert_info}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.expert_info)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Company Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-indigo-600 border-b-2 pb-3 flex items-center">Sigorta Şirketi Bilgileri</h4>
                      
                      {hasFieldValue('insuranceCompany', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">Şirket Adı:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{getFieldValue('insuranceCompany', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('insuranceCompany', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.company_address && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">Adres:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.company_address}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.company_address)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.company_phone && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">Telefon:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.company_phone}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.company_phone)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.agent_code && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">Acente Kodu:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.agent_code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.agent_code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coverage Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-orange-600 border-b-2 pb-3 flex items-center">Teminat Bilgileri</h4>
                      
                      {hasFieldValue('coverageType', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{getFieldLabel('coverageType', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{getFieldValue('coverageType', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('coverageType', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {hasFieldValue('coverageAmount', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">{getFieldLabel('coverageAmount', documentType)}:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{getFieldValue('coverageAmount', extractedFields)} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('coverageAmount', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.mali_sorumluluk && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Mali Sorumluluk:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.mali_sorumluluk} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.mali_sorumluluk)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.ferdi_kaza && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Ferdi Kaza:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.ferdi_kaza} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.ferdi_kaza)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.hukuksal_koruma && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Hukuksal Koruma:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.hukuksal_koruma} ₺</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.hukuksal_koruma)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discount Information */}
                    <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-pink-600 border-b-2 pb-3 flex items-center">İndirim Bilgileri</h4>
                      
                      {hasFieldValue('discountInfo', extractedFields) && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium">İndirim Bilgileri:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{getFieldValue('discountInfo', extractedFields)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(getFieldValue('discountInfo', extractedFields))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.hasarsizlik_kademesi && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium">Hasarsızlık Kademesi:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">{extractedFields.hasarsizlik_kademesi}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.hasarsizlik_kademesi)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.baglanti_indirimi && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium">Bağlantı İndirimi:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-semibold">%{extractedFields.baglanti_indirimi}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.baglanti_indirimi)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.tramer_belge_no && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium">Tramer Belge No:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 font-mono">{extractedFields.tramer_belge_no}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.tramer_belge_no)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {extractedFields.tramer_belge_tarihi && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium">Tramer Belge Tarihi:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{extractedFields.tramer_belge_tarihi}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(extractedFields.tramer_belge_tarihi)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trafik Sigortası Specific Fields */}
                    {extractedData?.document_type === 'trafik' && (
                      <>
                        {/* Teminat Limitleri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-cyan-600 border-b-2 pb-3 flex items-center">Teminat Limitleri</h4>
                          
                          {extractedFields.vehicleMaterialDamage && (
                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-medium">Araç Başına Maddi Giderler:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.vehicleMaterialDamage} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.vehicleMaterialDamage)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.accidentMaterialDamage && (
                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-medium">Kaza Başına Maddi Giderler:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.accidentMaterialDamage} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.accidentMaterialDamage)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.personHealthExpenses && (
                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-medium">Kişi Başına Sağlık Giderleri:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.personHealthExpenses} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.personHealthExpenses)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.accidentHealthExpenses && (
                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-medium">Kaza Başına Sağlık Giderleri:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.accidentHealthExpenses} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.accidentHealthExpenses)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prim Detayları */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-teal-600 border-b-2 pb-3 flex items-center">Prim Detayları</h4>
                          
                          {extractedFields.damageStep && (
                            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-teal-500" />
                                <span className="text-sm font-medium">Hasar Basamağı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.damageStep}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damageStep)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.premiumAmount && (
                            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-teal-500" />
                                <span className="text-sm font-medium">Prim Tutarı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.premiumAmount} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.premiumAmount)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Hasar Raporu Specific Fields */}
                    {extractedData?.document_type === 'hasar' && (
                      <>
                        {/* Hasar Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-red-600 border-b-2 pb-3 flex items-center">Hasar Bilgileri</h4>
                          
                          {extractedFields.damageDate && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Hasar Tarihi ve Saati:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.damageDate}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damageDate)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.damageLocation && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Hasar Yeri:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.damageLocation}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damageLocation)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.damageDescription && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Hasar Tanımı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.damageDescription}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damageDescription)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Maliyet Analizi */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-amber-600 border-b-2 pb-3 flex items-center">Maliyet Analizi</h4>
                          
                          {extractedFields.sparePartsCost && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">Yedek Parça Maliyeti:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.sparePartsCost} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.sparePartsCost)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.laborCost && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">İşçilik Maliyeti:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.laborCost} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.laborCost)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.totalRepairCost && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">Toplam Onarım Maliyeti:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.totalRepairCost} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.totalRepairCost)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.valueLoss && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">Değer Kaybı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.valueLoss} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.valueLoss)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Deprem Sigortası Specific Fields */}
                    {extractedData?.document_type === 'deprem' && (
                      <>
                        {/* DASK Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-red-600 border-b-2 pb-3 flex items-center">DASK Bilgileri</h4>
                          
                          {extractedFields.daskPolicyNumber && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">DASK Poliçe No:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-mono">{extractedFields.daskPolicyNumber}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.daskPolicyNumber)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.addressCode && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Adres Kodu:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-mono">{extractedFields.addressCode}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.addressCode)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.buildingCode && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Bina Kodu:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-mono">{extractedFields.buildingCode}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.buildingCode)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sigorta Ettiren Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-blue-600 border-b-2 pb-3 flex items-center">
                            Sigorta Ettiren Bilgileri
                          </h4>

                          {extractedFields.policyholderName && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Ad Soyad/Unvan:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                  {extractedFields.policyholderName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.policyholderName)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {(extractedFields.tc_number || extractedFields.tcNumber) && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">TC Kimlik No:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-mono">
                                  {extractedFields.tc_number || extractedFields.tcNumber}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(extractedFields.tc_number || extractedFields.tcNumber)
                                  }
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.policyholderStatus && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Sıfatı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.policyholderStatus}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.policyholderStatus)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.policyholderPhone && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Sabit Telefon:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.policyholderPhone}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.policyholderPhone)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.policyholderMobile && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Cep Telefonu:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.policyholderMobile}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.policyholderMobile)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sigortalı Yer Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-green-600 border-b-2 pb-3 flex items-center">Sigortalı Yer Bilgileri</h4>
                          
                          {extractedFields.province && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">İl/İlçe/Bucak-Köy:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.province}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.province)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.address && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Adres:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.address}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.address)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.buildingType && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Bina Yapı Tarzı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.buildingType}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.buildingType)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.buildingYear && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Bina İnşa Yılı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.buildingYear}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.buildingYear)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.apartmentUsage && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Daire Kullanım Şekli:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.apartmentUsage}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.apartmentUsage)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.apartmentArea && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Daire Brüt Yüzölçümü:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.apartmentArea} m²</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.apartmentArea)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.totalFloors && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Toplam Kat Sayısı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.totalFloors}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.totalFloors)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.floorLocated && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Bulunduğu Kat:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.floorLocated}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.floorLocated)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.damageStatus && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Hasar Durumu:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.damageStatus}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damageStatus)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prim ve Teminat Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-purple-600 border-b-2 pb-3 flex items-center">Prim ve Teminat Bilgileri</h4>
                          
                          {extractedFields.policyPremium && (
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium">Poliçe Primi:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.policyPremium} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.policyPremium)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.buildingCoverage && (
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium">Bina Teminatı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.buildingCoverage}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.buildingCoverage)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.buildingCoverageAmount && (
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium">Bina Teminat Bedeli:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-semibold">{extractedFields.buildingCoverageAmount} ₺</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.buildingCoverageAmount)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* İndirim/Sürprim Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-amber-600 border-b-2 pb-3 flex items-center">İndirim/Sürprim Bilgileri</h4>
                          
                          {extractedFields.discountSurchargeInfo && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">İndirim/Sürprim Detayları:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.discountSurchargeInfo}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.discountSurchargeInfo)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Ekspertiz Raporu Specific Fields */}
                    {extractedData?.document_type === 'ekspertiz' && (
                      <>
                        {/* Eksper Bilgileri */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-violet-600 border-b-2 pb-3 flex items-center">Eksper Bilgileri</h4>
                          
                          {extractedFields.expertName && (
                            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-medium">Eksper Adı Soyadı:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.expertName}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.expertName)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.expertRegistry && (
                            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-medium">Sicil No:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 font-mono">{extractedFields.expertRegistry}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.expertRegistry)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tespitler ve Değerlendirmeler */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-indigo-600 border-b-2 pb-3 flex items-center">Tespitler ve Değerlendirmeler</h4>
                          
                          {extractedFields.damagedParts && (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium">Hasarlı Parçalar:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.damagedParts}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.damagedParts)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.repairParts && (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium">Onarılacak Parçalar:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.repairParts}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.repairParts)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {extractedFields.replaceParts && (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium">Değiştirilecek Parçalar:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.replaceParts}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.replaceParts)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sonuç ve Kanaat */}
                        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="text-lg font-bold text-emerald-600 border-b-2 pb-3 flex items-center">Sonuç ve Kanaat</h4>
                          
                          {extractedFields.expertOpinion && (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium">Eksper Görüşü:</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">{extractedFields.expertOpinion}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(extractedFields.expertOpinion)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Raw Extracted Data */}
                  {extractedData && Object.keys(extractedData).length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-600">Ham Çıkarılan Veri</h4>
                        <div className="space-y-2">
                          {Object.entries(extractedData).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 max-w-md truncate">
                                  {typeof value === 'object' && value !== null 
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)
                                  }
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(
                                    typeof value === 'object' && value !== null 
                                      ? JSON.stringify(value, null, 2)
                                      : String(value)
                                  )}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {(!extractedFields || Object.keys(extractedFields).length === 0) && (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">Çıkarılan alan bulunamadı</p>
                      <p className="text-xs text-gray-400 mt-2">Belge işlenirken herhangi bir alan tespit edilemedi</p>
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-700">
                          Debug: extractedFields = {JSON.stringify(extractedFields, null, 2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ham Veri</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Belge Verisi (JSON):</h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-64">
                        {JSON.stringify(document, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={downloadDocument}>
            <Download className="w-4 h-4 mr-2" />
            İndir
          </Button>
          <Button onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
