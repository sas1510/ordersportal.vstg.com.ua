import React from 'react';
import Menu from './Menu';

const RootHeader = ({ user, menuContent }) => {
  const numToUAMoneyFormat = (num) =>
    num ? num.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH' }) : '0 грн';

  return (
    <div className="portal-header row">
      <div className="logo w-15 align-center"></div>
      <div className="row menu w-100 align-center">
        <ul>
          <Menu menuContent={menuContent} />
        </ul>
      </div>
      <div className="row profile w-25 left">
        <div className="column w-100 gap-3">
          <div className="row w-100 gap-14 border-bottom align-center">
            <div className="icon icon-user right font-size-20 text-info"></div>
            <div className="name w-100 no-wrap">{user.CustomerName}</div>
          </div>
          <div className="row w-100 gap-14 align-center">
            <div className="icon icon-coin-dollar right font-size-20 text-success"></div>
            <div className="balance w-100 text-warning font-size-20 no-wrap">
              {numToUAMoneyFormat(user.БалансНаАвансовомСчету)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootHeader;
