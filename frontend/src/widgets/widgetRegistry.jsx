import React from "react";

const DummyWidget = () => {
  return React.createElement(
    "div",
    { style: { padding: 20 } },
    React.createElement("p", null, "Тестовий віджет")
  );
};

export const widgetRegistry = {
  efficiency: {
    title: "Ефективність",
    component: DummyWidget
  }
};