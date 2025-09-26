import React from 'react';

const Menu = ({ menuContent }) => {
  return (
    <>
      {menuContent.map((item, index) => (
        <li key={index} className={`row align-center w-100 menu-item ${item.active ? 'active' : ''}`}>
          <span className={`icon ${item.icon} font-size-24`}></span>
          <span>{item.label}</span>
        </li>
      ))}
    </>
  );
};

export default Menu;
