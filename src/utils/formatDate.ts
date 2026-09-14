export const formatDate = (date: Date) =>
  date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
