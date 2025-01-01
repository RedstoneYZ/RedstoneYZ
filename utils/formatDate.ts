export default function formatDate(date: number | string | Date, locale = "zh-tw") {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};