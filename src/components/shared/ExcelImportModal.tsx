import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, Loader2, FileCheck } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateName: string;
  templateHeaders: string[];
  onImport: (data: any[]) => Promise<void>;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  title,
  templateName,
  templateHeaders,
  onImport
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Create an empty worksheet with headers
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Save to file
    XLSX.writeFile(wb, `${templateName}_Template.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      readExcel(selectedFile);
    }
  };

  const readExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setDataPreview(json);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (dataPreview.length === 0) return;
    try {
      setIsProcessing(true);
      await onImport(dataPreview);
      setFile(null);
      setDataPreview([]);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setFile(null);
    setDataPreview([]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your data, and upload it back here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          {/* Step 1: Download */}
          <div className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary/40">
            <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
              1
            </div>
            <FileSpreadsheet className="h-12 w-12 text-primary mb-4 transition-transform group-hover:scale-110 duration-300" />
            <h3 className="text-lg font-semibold mb-2">Get the Template</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-[280px]">
              Download the exact Excel format required to ensure a smooth data import.
            </p>
            <Button onClick={downloadTemplate} className="w-full sm:w-auto shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload */}
          <div className={`group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-muted-foreground/20 bg-muted/30 hover:bg-muted/50'}`}>
            <div className={`absolute top-4 left-4 h-8 w-8 rounded-full flex items-center justify-center font-bold ${file ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
              2
            </div>
            
            {!file ? (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4 transition-transform group-hover:-translate-y-1 duration-300" />
                <h3 className="text-lg font-semibold mb-2">Upload Data</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-[280px]">
                  Fill out the template and upload the completed file here.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={triggerFileInput} className="w-full sm:w-auto shadow-sm border-muted-foreground/30 hover:bg-muted">
                  Select Excel File
                </Button>
              </>
            ) : (
              <>
                <FileCheck className="h-12 w-12 text-emerald-500 mb-4 animate-in zoom-in duration-300" />
                <h3 className="text-lg font-semibold text-emerald-700 mb-1 line-clamp-1 text-center w-full px-8">{file.name}</h3>
                <p className="text-sm font-medium text-emerald-600/80 mb-6">
                  {dataPreview.length} records ready for import.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setFile(null)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                    Change File
                  </Button>
                  <Button onClick={handleImport} disabled={isProcessing || dataPreview.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Start Import
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
