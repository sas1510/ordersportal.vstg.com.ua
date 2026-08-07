import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { AppIcon } from "../Icons/AppIcon";

const CATEGORY_COLORS = {
  Вікна: "#5e83bf",
  Двері: "#76b448",
  Додатки: "#d3c527",
  Інше: "#aaaaaa",
};

export default function ComplexityDonut({
  data = [],
  onSectorClick,
  isDetail = false,
  height = "500px",
  colors,
  centerLabel,
  centerUnit,
  showLegend = true,
  showLabels = true,
  hoverScale = true,
  showTooltip = true,
  selectedName,
  labelFormatter,
  labelNameSize = 12,
  labelValueSize = 11,
  labelLineColor,
  startAngle = 90,
  centerValue,
  centerIconName,

  // Налаштування розміру кільця
  innerRadius = "30%",
  outerRadius = "50%",
  centerY = "42%",

  // Розмір центрального кола
  centerBadgeSize = 115,

  // Розмір іконки біля центрального числа
  centerIconWidth = 26,
  centerIconHeight = 30,
}) {
  const chartRef = useRef(null);
  const wrapperRef = useRef(null);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") {
      return false;
    }

    return document.body.classList.contains("dark-theme");
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark-theme"));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();

    if (!chartInstance) {
      return undefined;
    }

    const resizeChart = () => {
      chartInstance.resize();
    };

    resizeChart();

    const frameId = requestAnimationFrame(resizeChart);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    height,
    innerRadius,
    outerRadius,
    centerY,
    centerBadgeSize,
  ]);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    const wrapperElement = wrapperRef.current;

    if (!chartInstance || !wrapperElement) {
      return undefined;
    }

    const resizeChart = () => {
      chartInstance.resize();
    };

    let observer;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        resizeChart();
      });
      observer.observe(wrapperElement);
    }

    window.addEventListener("resize", resizeChart);
    const frameId = requestAnimationFrame(resizeChart);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener("resize", resizeChart);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const normalizedData = useMemo(() => {
    return Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          value: Number(item.value || 0),
        }))
      : [];
  }, [data]);

  const total = useMemo(() => {
    return normalizedData.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0,
    );
  }, [normalizedData]);

  const chartColors = useMemo(() => {
    if (Array.isArray(colors) && colors.length) {
      return colors;
    }

    return normalizedData.map(
      (item) => CATEGORY_COLORS[item.name] || "#aaaaaa",
    );
  }, [colors, normalizedData]);

  const textColor = isDark ? "#aaaaaa" : "#606060";
  const labelColor = isDark ? "#eeeeee" : "#606060";

  const tooltipBackground = isDark
    ? "rgba(33, 33, 33, 0.95)"
    : "rgba(255, 255, 255, 0.95)";

  const chartBorderColor = isDark ? "#33312f" : "#ffffff";

  const option = useMemo(() => {
    return {
      color: chartColors,

      tooltip: {
        show: showTooltip,
        trigger: "item",
        backgroundColor: tooltipBackground,
        borderRadius: 8,
        padding: 0,
        borderColor: isDark ? "#444444" : "#95959563",

        extraCssText: `
          box-shadow: 0 4px 12px ${
            isDark
              ? "rgba(0, 0, 0, 0.6)"
              : "rgba(0, 0, 0, 0.3)"
          };
          z-index: 1001;
        `,

        formatter: (params) => {
          const value = Number(params.value || 0);

          const percentage =
            total > 0
              ? ((value / total) * 100).toFixed(1)
              : "0.0";

          return `
            <div
              style="
                min-width: 140px;
                padding: 12px;
                color: ${isDark ? "#eeeeee" : "#606060"};
                font-family: Inter, sans-serif;
              "
            >
              <div
                style="
                  margin-bottom: 8px;
                  padding-bottom: 4px;
                  border-bottom: 1px solid ${
                    isDark ? "#444444" : "#95959563"
                  };
                  font-size: 13px;
                  font-weight: 700;
                "
              >
                ${params.name}
              </div>

              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  gap: 12px;
                  margin-bottom: 4px;
                  font-size: 12px;
                "
              >
                <span>Кількість:</span>
                <strong>${value.toLocaleString("uk-UA")} шт.</strong>
              </div>

              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  gap: 12px;
                  font-size: 12px;
                "
              >
                <span>Частка:</span>
                <strong>${percentage}%</strong>
              </div>
            </div>
          `;
        },
      },

      legend: {
        show: showLegend,
        orient: "horizontal",
        bottom: 10,
        left: "center",
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20,

        textStyle: {
          color: textColor,
          fontSize: 12,
          fontFamily: "Inter, sans-serif",
        },
      },

      series: [
        {
          name: "Complexity",
          type: "pie",

          // Однакова товщина по всій окружності
          radius: isDetail
            ? [0, "35%"]
            : [innerRadius, outerRadius],

          center: [
            "50%",
            isDetail ? "50%" : centerY,
          ],

          startAngle,
          clockwise: true,
          avoidLabelOverlap: true,
          stillShowZeroSum: false,

          itemStyle: {
            // Без округлення, щоб ширина секторів виглядала однаковою
            borderRadius: 0,
            borderColor: chartBorderColor,
            borderWidth: isDetail ? 0 : 2,
          },

          label: {
            show: !isDetail && showLabels,
            position: "outside",

            formatter: (params) => {
              if (labelFormatter) {
                return labelFormatter(params, total);
              }

              return (
                `{name|${params.name}}\n` +
                `{val|${Number(params.value || 0).toLocaleString(
                  "uk-UA",
                )} шт. (${Number(params.percent || 0).toFixed(1)}%)}`
              );
            },

            rich: {
              name: {
                fontSize: labelNameSize,
                fontWeight: 700,
                color: labelColor,
                padding: [0, 0, 4, 0],
                fontFamily: "Inter, sans-serif",
              },

              val: {
                fontSize: labelValueSize,
                color: isDark ? "#eeeeee" : "#606060",
                fontFamily: "Inter, sans-serif",
              },
            },
          },

          labelLine: {
            show: !isDetail && showLabels,
            length: 15,
            length2: 20,

            lineStyle: {
              color:
                labelLineColor ||
                (isDark ? "#444444" : "#95959563"),
            },
          },

          selectedMode: selectedName ? "single" : false,
          selectedOffset: 0,

          select: {
            scale: Boolean(selectedName),
            scaleSize: 4,
          },

          data: normalizedData.map((item) => ({
            ...item,
            selected: item.name === selectedName,
          })),

          emphasis: hoverScale
            ? {
                scale: true,
                scaleSize: 8,

                itemStyle: {
                  shadowBlur: 8,
                  shadowOffsetX: 0,
                  shadowOffsetY: 2,
                  shadowColor: "rgba(0, 0, 0, 0.25)",
                },
              }
            : {
                disabled: true,
              },

          animation: true,
          animationType: "expansion",
          animationDuration: 1000,
        },
      ],
    };
  }, [
    chartColors,
    chartBorderColor,
    normalizedData,
    total,
    isDark,
    isDetail,
    textColor,
    labelColor,
    tooltipBackground,
    showLegend,
    showLabels,
    hoverScale,
    showTooltip,
    selectedName,
    labelFormatter,
    labelNameSize,
    labelValueSize,
    labelLineColor,
    startAngle,
    innerRadius,
    outerRadius,
    centerY,
  ]);

  const onEvents = useMemo(
    () => ({
      click: (params) => {
        onSectorClick?.(params.name);
      },
    }),
    [onSectorClick],
  );

  const displayedValue = Number(centerValue ?? total);

  return (
    <div
      ref={wrapperRef}
      className="donut-wrapper complexity-donut"
      style={{
        width: "100%",
        height,
      }}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{
          width: "100%",
          height: "100%",
        }}
        onEvents={onEvents}
        notMerge
        lazyUpdate={false}
      />

      {!isDetail ? (
        <div
          className="donut-center-badge"
          style={{
            top: centerY,
            width: `${centerBadgeSize}px`,
            height: `${centerBadgeSize}px`,
          }}
        >
          <div className="badge-label">
            {centerLabel || "Всього за рік"}
          </div>

          <div className="badge-main-row">
            {centerIconName ? (
              <span
                className="badge-icon"
                style={{
                  width: `${centerIconWidth}px`,
                  height: `${centerIconHeight}px`,
                  flexBasis: `${centerIconWidth}px`,
                }}
              >
                <AppIcon name={centerIconName} />
              </span>
            ) : null}

            <strong className="badge-value">
              {displayedValue.toLocaleString("uk-UA")}
            </strong>
          </div>

          <div className="badge-unit">
            {centerUnit || "одиниць"}
          </div>
        </div>
      ) : null}

      <style>{`
        .complexity-donut {
          position: relative;
          min-width: 0;
          animation: complexityDonutFadeIn 0.6s ease-out;
        }

        .complexity-donut .donut-center-badge {
          position: absolute;
          z-index: 5;
          left: 50%;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 10px;

          overflow: hidden;
          pointer-events: none;

          border: 5px solid ${
            isDark ? "#33312f" : "#ffffff"
          };
          border-radius: 50%;

          background: ${
            isDark ? "#eeeeee" : "#ffffff"
          };

          box-shadow: none;
          color: #44403e;
          text-align: center;

          transform: translate(-50%, -50%);
          box-sizing: border-box;
        }

        .complexity-donut .badge-label {
          position: relative;
          z-index: 2;

          margin: 0 0 2px;

          color: #44403e;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 15px;
        }

        .complexity-donut .badge-main-row {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;

          width: 100%;
          min-height: 39px;
        }

        .complexity-donut .badge-icon {
          display: inline-flex;
          flex-grow: 0;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;

          min-width: 0;
          max-width: none;

          margin: 0;
          padding: 0;

          overflow: hidden;
          color: #44403e;
        }

        .complexity-donut .badge-icon svg,
        .complexity-donut .badge-icon img {
          display: block !important;

          width: 100% !important;
          height: 100% !important;

          max-width: 100% !important;
          max-height: 100% !important;

          object-fit: contain;
        }

        .complexity-donut .badge-icon > *,
        .complexity-donut .badge-icon > * > * {
          max-width: 100% !important;
          max-height: 100% !important;
        }

        .complexity-donut .badge-value {
          display: block;

          margin: 0;
          padding: 0;

          color: #44403e;
          font-family: Inter, sans-serif;
          font-size: 32px;
          font-weight: 700;
          line-height: 39px;
          white-space: nowrap;
        }

        .complexity-donut .badge-unit {
          position: relative;
          z-index: 2;

          margin: 0;

          color: #44403e;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 15px;
        }

        @keyframes complexityDonutFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
