import React from 'react';
import { useParams, Routes, Route } from 'react-router-dom';
import ManagerDashboard from '../pages/ManagerDashboard';
import SDRDashboard from '../pages/SDRDashboard';
import ClientDashboard from '../pages/ClientDashboard';

// Demo token - a base64 encoded demo token that will work for demo mode
// This is just a placeholder - in real usage, you'd generate a proper token
const DEMO_TOKEN = btoa(JSON.stringify({ demo: true, type: 'demo' }));

// Wrapper for SDR Dashboard that provides demo token
export function DemoSDRDashboard() {
  return (
    <Routes>
      <Route path="*" element={<SDRDashboard />} />
    </Routes>
  );
}

// Wrapper for Client Dashboard that provides demo token
export function DemoClientDashboard() {
  return (
    <Routes>
      <Route path="*" element={<ClientDashboard />} />
    </Routes>
  );
}

// For Manager Dashboard, no token needed
export function DemoManagerDashboard() {
  return <ManagerDashboard />;
}








