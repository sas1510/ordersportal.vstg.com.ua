import React from "react";

export function OrderTimeline({ steps, activeIndex, onStepClick }) {
  return (
    <div className="flex items-center mt-4">
      {steps.map((step, i) => (
        <div key={i} className="flex-1 flex items-center">
          <div className="flex flex-col items-center cursor-pointer" onClick={() => onStepClick(i)}>
            <div className={
              "w-8 h-8 rounded-full flex items-center justify-center " +
              (step.done ? "bg-green-500 text-white" : (activeIndex===i ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"))
            }>
              {i+1}
            </div>
            <div className="text-sm mt-1 text-center">{step.name}</div>
            {step.date && <div className="text-xs text-gray-500">{step.date}</div>}
          </div>

          {i < steps.length - 1 && (
            <div className={"h-1 flex-1 mx-3 " + (steps[i+1].done ? "bg-green-400" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}
