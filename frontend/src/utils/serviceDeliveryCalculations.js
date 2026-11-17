// Reclamation records and additional-order records use different API shapes.
export function serviceDeliveryCalculations(additional, complaints) {
  return [...additional, ...complaints.map(item => ({
    number: item.ComplaintNumber || item.NumberWEB || "",
    mainOrderNumber: item.OrderNumber,
    dateRaw: item.ComplaintDate || item.DateInWork,
    dealer: item.Customer || item.OrganizationName || "",
    orders: [{
      number: String(item.ClaimOrderNumber || "").trim(),
      idGuid: item.DeliveryOrderGuid,
      plannedDeliveryDateTime: item.PlannedDeliveryDateTime,
      // A complaint's workflow status does not describe its linked order.
      status: ({ "Отказ": "Відмова", "Подтверждено": "Підтверджений", "Отгружен": "Відвантажений", "Отгружено": "Відвантажений" })[item.DeliveryOrderStatus] || item.DeliveryOrderStatus || "",
      count: item.DeliveryOrderCount ?? null,
      amount: item.DeliveryOrderAmount ?? null,
      paid: item.DeliveryOrderPaid ?? null,
      currency: item.DeliveryOrderCurrency || "",
    }],
  }))];
}
