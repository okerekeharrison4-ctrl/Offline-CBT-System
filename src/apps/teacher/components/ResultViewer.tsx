import React, { useState, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Upload, CheckCircle, XCircle, AlertTriangle, FileJson, FileText } from 'lucide-react';
import { SignedResultPackage, StudentResult } from '../../../lib/types';
import { verifySignature } from '../../../lib/crypto';
import { cn, formatDuration, formatDate } from '../../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ValidatedResult extends StudentResult {
  isValid: boolean;
  fileName: string;
}

export const ResultViewer = () => {
  const [passcode, setPasscode] = useState('');
  const [results, setResults] = useState<ValidatedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (!passcode) {
      alert('Please enter the exam passcode first to verify signatures.');
      return;
    }

    setIsProcessing(true);
    const newResults: ValidatedResult[] = [];

    const files: File[] = Array.from(e.target.files);
    for (const file of files) {
      try {
        const text = await file.text();
        const data: SignedResultPackage = JSON.parse(text);
        
        // Verify Signature
        const isValid = await verifySignature(data.payload, data.signature, passcode, data.salt);
        
        newResults.push({
          ...data.payload,
          isValid,
          fileName: file.name,
        });
      } catch (err) {
        console.error(`Error processing ${file.name}`, err);
      }
    }

    setResults((prev) => [...prev, ...newResults]);
    setIsProcessing(false);
  };

  const handleExportPDF = () => {
    if (results.length === 0) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Exam Results Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary Stats
    const totalStudents = results.length;
    const avgScore = Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length);
    const integrityFlags = results.filter(r => r.integrityLogs.length > 0 || !r.isValid).length;

    doc.text(`Total Students: ${totalStudents}`, 14, 40);
    doc.text(`Average Score: ${avgScore}%`, 14, 46);
    doc.text(`Integrity Flags: ${integrityFlags}`, 14, 52);

    // Table
    const tableColumn = ["Student Name", "ID", "Score", "Max", "%", "Time", "Flags", "Status"];
    const tableRows = results.map(r => [
      r.studentName,
      r.studentId,
      r.score,
      r.maxScore,
      `${r.percentage}%`,
      formatDuration(r.timeTakenSeconds),
      r.integrityLogs.length,
      r.isValid ? 'Verified' : 'TAMPERED'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 135, 245] },
    });

    doc.save(`Exam_Results_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Result Processor</h2>
        <div className="flex items-center gap-4">
          <Input
            type="password"
            placeholder="Exam Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-64"
          />
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={!passcode}
              />
              <Button disabled={!passcode}>
                <Upload size={16} className="mr-2" /> Import Results
              </Button>
            </div>
            {results.length > 0 && (
              <Button variant="secondary" onClick={handleExportPDF}>
                <FileText size={16} className="mr-2" /> Export PDF
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* ... (rest of the component) */}

      {results.length === 0 ? (
        <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center text-gray-500">
          <FileJson size={48} className="mb-4 opacity-50" />
          <p>No results loaded.</p>
          <p className="text-sm">Enter passcode and upload .json result files from student flash drives.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-100">
              <div className="text-sm text-blue-600 font-medium">Total Students</div>
              <div className="text-3xl font-bold text-blue-900">{results.length}</div>
            </Card>
            <Card className="p-4 bg-green-50 border-green-100">
              <div className="text-sm text-green-600 font-medium">Average Score</div>
              <div className="text-3xl font-bold text-green-900">
                {Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)}%
              </div>
            </Card>
            <Card className="p-4 bg-red-50 border-red-100">
              <div className="text-sm text-red-600 font-medium">Integrity Flags</div>
              <div className="text-3xl font-bold text-red-900">
                {results.filter(r => r.integrityLogs.length > 0 || !r.isValid).length}
              </div>
            </Card>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Student</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Score</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Time</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Integrity</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {result.studentName}
                      <div className="text-xs text-gray-500">{result.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        result.percentage >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDuration(result.timeTakenSeconds)}
                    </td>
                    <td className="px-6 py-4">
                      {result.integrityLogs.length > 0 ? (
                        <div className="flex items-center text-amber-600">
                          <AlertTriangle size={16} className="mr-1" />
                          {result.integrityLogs.length} Events
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {result.isValid ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle size={16} className="mr-1" /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 font-bold">
                          <XCircle size={16} className="mr-1" /> TAMPERED
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
