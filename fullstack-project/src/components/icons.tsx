import React from 'react';

const createIcon = (path: string) => (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-10 h-10"
    {...props}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

export const HomeIcon = createIcon(
  "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V19a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1v-8.586l.293.293a1 1 0 001.414-1.414l-7-7z"
);
export const MealIcon = createIcon(
  "M5 3a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h14v10H5V5zm2 2a1 1 0 011 1v1a1 1 0 11-2 0V8a1 1 0 011-1zm3 0a1 1 0 011 1v1a1 1 0 11-2 0V8a1 1 0 011-1zm3 0a1 1 0 011 1v1a1 1 0 11-2 0V8a1 1 0 011-1z"
);
export const PalIcon = createIcon(
  "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
);
export const DiaryIcon = createIcon(
    "M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H6zm2 4h8v2H8V6zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"
);
export const ResourcesIcon = createIcon(
  "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zM8 9h8v2H8V9zm0 4h5v2H8v-2z"
);
