import React, { useEffect, useState } from "react";

const FacebookPageWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [size, setSize] = useState({ width: 500, height: 600 });

  const pageUrl = "https://www.facebook.com/viknastyletraiding";


  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;

      if (w < 480) {
        setSize({ width: w - 20, height: 500 }); 
      } else if (w < 768) {
        setSize({ width: 400, height: 550 }); 
      } else if (w < 1200) {
        setSize({ width: 500, height: 600 }); 
      } else {
        setSize({ width: 600, height: 700 }); 
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    pageUrl
  )}&tabs=timeline&width=${size.width}&height=${size.height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
       <div className="flex flex-col items-center justify-center  bg-white rounded-lg shadow-sm w-full  min-h-[400px] relative ">  
      <div style={{ width: size.width, position: "relative" }}>
        {!isLoaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafc",
            }}
          >
            Завантаження Facebook...
          </div>
        )}

        <iframe
          src={iframeSrc}
          width={size.width}
          height={size.height}
          style={{
            border: "none",
            overflow: "hidden",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          scrolling="no"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      </div>
    </div>
  );
};

export default FacebookPageWidget;