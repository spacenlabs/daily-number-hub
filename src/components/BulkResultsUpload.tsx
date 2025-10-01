import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText } from "lucide-react";

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
    const headers = ["date", "game_name", "result"];
    const sampleData = games.slice(0, 2).map(game => 
      `01/01/2024,${game.name},05`
    );
    const csv = [headers.join(","), ...sampleData].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_results_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): Array<{ game_name: string; date: string; result: number }> => {
    const lines = text.trim().split("\n");
    const data: Array<{ game_name: string; date: string; result: number }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(",");
      if (parts.length !== 3) {
        throw new Error(`Invalid CSV format at line ${i + 1}: Expected 3 columns (date, game_name, result)`);
      }
      
      const [dateStr, game_name, resultStr] = parts.map(p => p.trim());
      
      // Validate game name
      if (!game_name || game_name.length === 0) {
        throw new Error(`Invalid game name at line ${i + 1}: Cannot be empty`);
      }
      
      // Validate result
      const result = parseInt(resultStr);
      if (isNaN(result) || result < 0 || result > 99) {
        throw new Error(`Invalid result at line ${i + 1}: Must be a number between 0-99`);
      }
      
      // Validate and convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
      const dateParts = dateStr.includes("/") ? dateStr.split("/") : dateStr.split("-");
      if (dateParts.length !== 3) {
        throw new Error(`Invalid date format at line ${i + 1}: Expected DD/MM/YYYY or DD-MM-YYYY (e.g., 13/09/2025 or 13-09-2025)`);
      }
      
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      // Validate date components
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error(`Invalid date at line ${i + 1}: Day, month, and year must be numbers`);
      }
      
      if (day < 1 || day > 31) {
        throw new Error(`Invalid day at line ${i + 1}: Must be between 1-31`);
      }
      
      if (month < 1 || month > 12) {
        throw new Error(`Invalid month at line ${i + 1}: Must be between 1-12`);
      }
      
      if (year < 1900 || year > 2100) {
        throw new Error(`Invalid year at line ${i + 1}: Must be between 1900-2100`);
      }
      
      // Validate the date is actually valid (e.g., not 31/02/2025)
      const testDate = new Date(year, month - 1, day);
      if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
        throw new Error(`Invalid date at line ${i + 1}: ${dateStr} is not a valid calendar date`);
      }
      
      const date = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      
      data.push({ game_name, date, result });
    }
    
    return data;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const records = parseCSV(text);
      
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
          Upload historical results in CSV format. CSV should have columns: date (DD/MM/YYYY or DD-MM-YYYY), game_name, result (0-99)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-upload-input">CSV File</Label>
          <Input
            id="bulk-upload-input"
            type="file"
            accept=".csv"
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
