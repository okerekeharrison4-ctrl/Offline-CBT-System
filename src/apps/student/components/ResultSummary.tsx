import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { StudentResult } from '../../../lib/types';
import { CheckCircle, AlertTriangle, Download } from 'lucide-react';

export const ResultSummary = ({ result }: { result: StudentResult }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 text-center space-y-6">
        <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Submitted!</h1>
          <p className="text-gray-500 mt-2">Your answers have been securely recorded.</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-gray-500">Student Name</span>
            <span className="font-medium">{result.studentName}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-gray-500">Exam</span>
            <span className="font-medium">{result.examTitle}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-gray-500">Score</span>
            <span className="font-bold text-xl text-blue-600">{result.score} / {result.maxScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Percentage</span>
            <span className="font-bold text-xl text-blue-600">{result.percentage}%</span>
          </div>
        </div>

        {result.integrityLogs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-left text-sm text-amber-800">
            <div className="flex items-center font-bold mb-1">
              <AlertTriangle size={16} className="mr-2" />
              Integrity Report
            </div>
            <p>The system detected {result.integrityLogs.length} instances of focus loss or window switching during the exam. These have been logged for teacher review.</p>
          </div>
        )}

        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            A result file has been downloaded to your flash drive. Please ensure it is saved.
          </p>
          <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">
            Return to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};
