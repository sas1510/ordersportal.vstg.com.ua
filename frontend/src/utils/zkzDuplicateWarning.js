export function zkzDuplicateWarning({ matches = [], unchecked = [] }) {
  const lines = matches.slice(0, 5).map(item => `№ ${item.number} — ${new Date(item.date).toLocaleString("uk-UA")}`);
  return [matches.length ? "Файл з такою назвою та розміром уже є у заявках за останні 7 днів:" : "", ...lines,
    matches.length > 5 ? `Та ще ${matches.length - 5} заявок.` : "",
    unchecked.length ? "Також є файли з такою назвою, розмір яких не вдалося перевірити." : "",
  ].filter(Boolean).join("\n");
}
