// import React from 'react';

// const InstagramProfileIframe = ({ username = 'viknastyle' }) => {
//   // Додаємо /embed в кінець посилання — це офіційний шлях для вбудовування
//   const embedUrl = `https://www.instagram.com/${username}/embed`;

//   return (
//     <div style={{ 
//       width: '100%', 
//       display: 'flex', 
//       flexDirection: 'column', 
//       alignItems: 'center',
//       margin: '20px 0' 
//     }}>
//       <div style={{
//         width: '100%',
//         maxWidth: '500px',
//         height: '600px',
//         border: '1px solid #dbdbdb',
//         borderRadius: '8px',
//         overflow: 'hidden',
//         position: 'relative'
//       }}>
//         <iframe
//           src={embedUrl}
//           width="100%"
//           height="100%"
//           frameBorder="0"
//           scrolling="yes"
//           allowTransparency="true"
//           title="Instagram Profile"
//           style={{ position: 'absolute', top: 0, left: 0 }}
//         ></iframe>
//       </div>
      
//       <p style={{ marginTop: '10px', fontSize: '14px' }}>
//         Не бачите профілю? 
//         <a 
//           href={`https://www.instagram.com/${username}`} 
//           target="_blank" 
//           rel="noopener noreferrer"
//           style={{ marginLeft: '5px', color: '#0095f6', fontWeight: 'bold' }}
//         >
//           Перейти в Instagram
//         </a>
//       </p>
//     </div>
//   );
// };

// export default InstagramProfileIframe;


import React, { useState } from 'react';

const InstagramProfileIframe = ({ username = 'viknastyle' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const embedUrl = `https://www.instagram.com/viknastyle/embed`;

  return (
    <div  className='w-full ' style={{display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        height: '500px',
        border: '1px solid #dbdbdb',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#fafafa'
      }}>
      
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#8e8e8e'
          }}>
            <p>Завантаження профілю...</p>
          </div>
        )}

        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="yes"
          allowTransparency="true"
          title="Instagram Profile"
          onLoad={() => setIsLoading(false)} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            opacity: isLoading ? 0 : 1, 
            transition: 'opacity 0.3s ease-in'
          }}
        ></iframe>
      </div>
      
      <p style={{ marginTop: '10px', fontSize: '14px' }}>
        <a 
          href={`https://www.instagram.com/${username}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#0095f6', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Відкрити @{username} у новому вікні
        </a>
      </p>
    </div>
  );
};

export default InstagramProfileIframe;