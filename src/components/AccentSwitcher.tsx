import React, { useState, useEffect } from 'react';

const AccentSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const accentColors = [
    { name: 'Purple', value: 'rgb(138,5,255)' },
    { name: 'Blue', value: 'rgb(59,130,246)' },
    { name: 'Green', value: 'rgb(34,197,94)' },
    { name: 'Red', value: 'rgb(239,68,68)' },
    { name: 'Orange', value: 'rgb(249,115,22)' },
    { name: 'Pink', value: 'rgb(236,72,153)' },
    { name: 'Cyan', value: 'rgb(6,182,212)' },
    { name: 'Yellow', value: 'rgb(234,179,8)' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('accent-color');
    const defaultColor = 'rgb(59,130,246)'; // blue
    document.documentElement.style.setProperty('--color-accent', saved || defaultColor);
    if (!saved) {
      localStorage.setItem('accent-color', defaultColor);
    }
  }, []);

  const changeAccentColor = (color: string) => {
    document.documentElement.style.setProperty('--color-accent', color);
    localStorage.setItem('accent-color', color);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div style={{ position: 'relative' }}>
        {isOpen && (
          <div
            className="bg-white border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1"
            style={{
              position: 'absolute',
              bottom: '110%', // slightly above the button
              right: 0,
              zIndex: 100,
              minWidth: 120,
            }}
          >
            {accentColors.map((color) => (
              <button
                key={color.name}
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color.value }}
                onClick={() => changeAccentColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
        )}
        <button
          className="w-8 h-8 rounded-full border-2 hover:border-gray-500 transition-colors flex items-center justify-center text-xs font-bold text-white shadow-lg"
          style={{ borderColor: 'var(--color-accent)' }}
          onClick={() => setIsOpen((v) => !v)}
          title="Change Accent Color"
        >
          A
        </button>
      </div>
    </div>
  );
};

export default AccentSwitcher;
