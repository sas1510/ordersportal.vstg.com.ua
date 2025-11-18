import React, { useState } from "react";

export const ClampedText = ({ text, lines = 2 }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(prev => !prev);

  const style = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    WebkitLineClamp: expanded ? 'none' : lines,
    lineHeight: '1.2em',
  };

  return (
    <div>
      <div style={style} title={text}>
        {text}
      </div>
      <button 
        onClick={toggleExpanded} 
        style={{ fontSize: '12px', color: '#007bff', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        {expanded ? 'Згорнути' : '...Показати більше'}
      </button>
    </div>
  );
};
