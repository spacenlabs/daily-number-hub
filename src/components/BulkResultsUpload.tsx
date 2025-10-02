import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText } from "lucide-react";
import * as XLSX from 'xlsx';

interface BulkResultsUploadProps {
  games: Array<{ id: string; name: string; short_code: string }>;
}

export const BulkResultsUpload = ({ games }: BulkResultsUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const data = games.map(game => ({
      date: "01/01/2024",
      game_name: game.name,
      result: 5
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    
    XLSX.writeFile(wb, "bulk_results_template.xlsx");
    toast.success("Template downloaded");
  };

  const parseExcel = (file: File): Promise<Array<{ game_name: string; date: string; result: number }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const results: Array<{ game_name: string; date: string; result: number }> = [];
          
          jsonData.forEach((row: any, index: number) => {
            const lineNum = index + 2; // +2 because of header and 0-indexing
            
            // Validate game name
            if (!row.game_name || typeof row.game_name !== 'string' || row.game_name.trim().length === 0) {
              throw new Error(`Invalid game name at row ${lineNum}: Cannot be empty`);
            }
            
            // Validate result
            const result = parseInt(String(row.result));
            if (isNaN(result) || result < 0 || result > 99) {
              throw new Error(`Invalid result at row ${lineNum}: Must be a number between 0-99`);
            }
            
            // Parse date
            let dateStr = String(row.date);
            const dateParts = dateStr.includes("/") ? dateStr.split("/") : dateStr.split("-");
            if (dateParts.length !== 3) {
              throw new Error(`Invalid date format at row ${lineNum}: Expected DD/MM/YYYY or DD-MM-YYYY`);
            }
            
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
              throw new Error(`Invalid date at row ${lineNum}: Day, month, and year must be numbers`);
            }
            
            if (day < 1 || day > 31) {
              throw new Error(`Invalid day at row ${lineNum}: Must be between 1-31`);
            }
            
            if (month < 1 || month > 12) {
              throw new Error(`Invalid month at row ${lineNum}: Must be between 1-12`);
            }
            
            if (year < 1900 || year > 2100) {
              throw new Error(`Invalid year at row ${lineNum}: Must be between 1900-2100`);
            }
            
            const testDate = new Date(year, month - 1, day);
            if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
              throw new Error(`Invalid date at row ${lineNum}: ${dateStr} is not a valid calendar date`);
            }
            
            const date = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            
            results.push({ game_name: row.game_name.trim(), date, result });
          });
          
          resolve(results);
        } catch (error: any) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const records = await parseExcel(file);
      
      if (records.length === 0) {
        toast.error("No valid records found in CSV");
        setUploading(false);
        return;
      }

      // Match game names to IDs
      const gameMap = new Map(games.map(g => [g.name.toLowerCase(), g.id]));
      const updates: Array<{ game_id: string; date: string; result: number }> = [];
      
      for (const record of records) {
        const gameId = gameMap.get(record.game_name.toLowerCase());
        if (!gameId) {
          toast.error(`Game not found: ${record.game_name}`);
          setUploading(false);
          return;
        }
        updates.push({ game_id: gameId, date: record.date, result: record.result });
      }

      // Call edge function to process bulk upload
      const session = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('bulk-results-upload', {
        body: { updates },
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Successfully uploaded ${records.length} results`);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload results");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Results History Upload
        </CardTitle>
        <CardDescription>
          Upload historical results in Excel format. File should have columns: date (DD/MM/YYYY or DD-MM-YYYY), game_name, result (0-99)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-upload-input">Excel File</Label>
          <Input
            id="bulk-upload-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          {file && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload Results"}
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
