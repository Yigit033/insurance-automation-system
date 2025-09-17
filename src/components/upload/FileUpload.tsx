import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  extractedData?: any;
}

const FileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { uploadDocument } = useDocuments();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "uploading",
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload and process files
    newFiles.forEach(async (fileData) => {
      try {
        await uploadDocument(fileData.file);
        updateFileStatus(fileData.id, "completed", 100);
      } catch (error) {
        console.error('Upload error:', error);
        updateFileStatus(fileData.id, "error", 0);
      }
    });

    toast({
      title: "Dosyalar yüklendi",
      description: `${acceptedFiles.length} dosya işleme kuyruğuna eklendi`,
    });
  }, []);

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        clearInterval(uploadInterval);
        updateFileStatus(fileId, "processing", 100);
        
        // Simulate OCR processing
        setTimeout(() => {
          updateFileStatus(fileId, "completed", 100, {
            customerName: "Ahmet Yılmaz",
            nationalId: "12345678901",
            policyNumber: "POL-2024-001",
            vehiclePlate: "34 ABC 123",
            amount: "15.000 ₺"
          });
        }, Math.random() * 3000 + 2000);
      } else {
        updateFileStatus(fileId, "uploading", progress);
      }
    }, 200);
  };

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile["status"], 
    progress: number, 
    extractedData?: any
  ) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, status, progress, extractedData }
          : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Upload className="w-4 h-4 text-accent animate-pulse" />;
      case "processing":
        return <Clock className="w-4 h-4 text-processing animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Yükleniyor...";
      case "processing":
        return "OCR işleniyor...";
      case "completed":
        return "Tamamlandı";
      case "error":
        return "Hata";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth",
              isDragActive 
                ? "border-primary bg-insurance-light-blue" 
                : "border-border hover:border-primary hover:bg-insurance-light-blue/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-insurance-navy mb-2">
                  {isDragActive ? "Dosyaları bırakın..." : "Sigorta belgelerini yükleyin"}
                </h3>
                <p className="text-insurance-gray mb-4">
                  PDF, JPG, PNG, TIFF formatları desteklenir (Maks. 10MB)
                </p>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Dosya Seç
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-insurance-navy mb-4">
              Yüklenen Dosyalar ({uploadedFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((fileData) => {
                const isImage = fileData.file.type.startsWith('image/');
                return (
                  <div 
                    key={fileData.id}
                    className="flex items-center space-x-4 p-4 bg-background rounded-lg border border-border"
                  >
                    <div className="flex-shrink-0">
                      {isImage ? (
                        <Image className="w-8 h-8 text-accent" />
                      ) : (
                        <FileText className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-insurance-navy truncate">
                          {fileData.file.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(fileData.status)}
                          <span className="text-xs text-insurance-gray">
                            {getStatusText(fileData.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Progress 
                          value={fileData.progress} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-insurance-gray min-w-0">
                          {Math.round(fileData.progress)}%
                        </span>
                      </div>

                      {/* Extracted Data Preview */}
                      {fileData.extractedData && (
                        <div className="mt-2 p-3 bg-success-light rounded-lg text-xs">
                          <div className="font-semibold text-success mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Çıkarılan Veriler
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {fileData.extractedData.customer_name && (
                              <span><strong>Müşteri:</strong> {fileData.extractedData.customer_name}</span>
                            )}
                            {fileData.extractedData.national_id && (
                              <span><strong>TC:</strong> {fileData.extractedData.national_id}</span>
                            )}
                            {fileData.extractedData.policy_number && (
                              <span><strong>Poliçe:</strong> {fileData.extractedData.policy_number}</span>
                            )}
                            {fileData.extractedData.vehicle_plate && (
                              <span><strong>Plaka:</strong> {fileData.extractedData.vehicle_plate}</span>
                            )}
                            {fileData.extractedData.amount && (
                              <span><strong>Tutar:</strong> {fileData.extractedData.amount}</span>
                            )}
                            {fileData.extractedData.document_type && (
                              <span><strong>Tür:</strong> {fileData.extractedData.document_type}</span>
                            )}
                            {fileData.extractedData.insurance_company && (
                              <span><strong>Şirket:</strong> {fileData.extractedData.insurance_company}</span>
                            )}
                            {fileData.extractedData.vehicle_brand && fileData.extractedData.vehicle_model && (
                              <span><strong>Araç:</strong> {fileData.extractedData.vehicle_brand} {fileData.extractedData.vehicle_model}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      className="flex-shrink-0 text-insurance-gray hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;