import React, { useState } from 'react';
import { Layout } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ExamBuilder } from './components/ExamBuilder';
import { ResultViewer } from './components/ResultViewer';
import { FileText, Upload, Plus, Download } from 'lucide-react';

type View = 'dashboard' | 'create-exam' | 'view-results';

export default function TeacherApp() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <Layout>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Offline CBT Admin</h1>
            <p className="text-xs text-gray-500">Secure Examination System</p>
          </div>
        </div>
        <nav className="flex gap-4">
          <Button
            variant={view === 'dashboard' ? 'primary' : 'ghost'}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={view === 'create-exam' ? 'primary' : 'ghost'}
            onClick={() => setView('create-exam')}
          >
            Create Exam
          </Button>
          <Button
            variant={view === 'view-results' ? 'primary' : 'ghost'}
            onClick={() => setView('view-results')}
          >
            View Results
          </Button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer border-dashed border-2" onClick={() => setView('create-exam')}>
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Plus size={48} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Create New Exam</h2>
              <p className="text-gray-500 max-w-sm">
                Design a secure exam with multiple choice questions, set time limits, and encrypt for distribution.
              </p>
            </Card>

            <Card className="p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer border-dashed border-2" onClick={() => setView('view-results')}>
              <div className="bg-green-50 p-4 rounded-full mb-4">
                <Upload size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Process Results</h2>
              <p className="text-gray-500 max-w-sm">
                Import student result files from flash drives, verify digital signatures, and generate reports.
              </p>
            </Card>

            <Card className="p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer border-dashed border-2" onClick={() => {
              if (import.meta.env.DEV) {
                alert("🚧 DEVELOPMENT MODE DETECTED 🚧\n\nThe 'Offline Student App' is generated only during the Production Build process.\n\nIn this Preview environment, the file has not been built yet.\n\nPlease deploy to Netlify/GitHub. The build process there will generate the correct 'student.html' file.");
                return;
              }
              const link = document.createElement('a');
              link.href = '/student.html';
              link.download = 'student.html';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <div className="bg-purple-50 p-4 rounded-full mb-4">
                <Download size={48} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Get Student App</h2>
              <p className="text-gray-500 max-w-sm">
                Download the offline exam console (student.html) to put on flash drives for students.
              </p>
              {import.meta.env.DEV && (
                <span className="mt-2 inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                  Requires Production Build
                </span>
              )}
            </Card>
          </div>
        )}

        {view === 'create-exam' && <ExamBuilder onCancel={() => setView('dashboard')} />}
        {view === 'view-results' && <ResultViewer />}
      </main>
    </Layout>
  );
}
