import React from 'react';
import type { ConnectionLineComponentProps } from '@xyflow/react';

export const ConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps) => {
  // const { fromHandle } = useConnection();

  let stroke = '#b1b1b7'; // Default gray
  let strokeDasharray = '5,5'; // Dashed by default while dragging

  if (connectionStatus === 'valid') {
    stroke = '#22c55e'; // Green
    strokeDasharray = 'none'; // Solid for valid
  } else if (connectionStatus === 'invalid') {
    stroke = '#ef4444'; // Red
    strokeDasharray = '5,5'; // Dashed for invalid
  }

  return (
    <g>
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        className="animated"
        d={`M${fromX},${fromY} C${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
        strokeDasharray={strokeDasharray}
      />
      <circle cx={toX} cy={toY} fill="#fff" r={3} stroke={stroke} strokeWidth={2} />
    </g>
  );
};
