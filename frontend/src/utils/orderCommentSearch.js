export function matchesCalculationComment(calculation, query) {
  const needle = String(query || "").trim().toLocaleLowerCase("uk-UA");
  if (!needle) return false;
  return [calculation.firstMessage, calculation.sourceComment, calculation.message,
    ...(calculation.orders || []).flatMap((order) => [order.firstMessage, order.sourceComment, order.message])]
    .some((value) => String(value || "").toLocaleLowerCase("uk-UA").includes(needle));
}
