import React from 'react';
import { createRoot } from 'react-dom/client';
import DemoSunny from '../components/ui/doodle-crew-footer-sunny-demo';

const container = document.getElementById('footer-root');
if (container) {
  const root = createRoot(container);
  root.render(<DemoSunny />);
}
