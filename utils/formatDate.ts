export default function formatDate(date: number | string | Date, locale = "en-US") {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};