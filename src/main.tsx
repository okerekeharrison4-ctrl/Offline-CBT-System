import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import TeacherApp from './apps/teacher/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeacherApp />
  </StrictMode>,
);
