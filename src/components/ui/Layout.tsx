import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {children}
    </div>
  );
};
