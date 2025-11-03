const BB_BASE = 'https://api.bestbuy.com/v1';

export async function findCatId(name) {
  const filter = `name="${name}*"`;
  const params = {
    show: 'id,name',
    format:'json',
    apiKey:API_KEY
  };
  const { data } = await http.get(`${BB_BASE}/categories(${filter})`, { params });
  const cats = data?.categories || [];
  if (!cats.length) {
      return null;
  }

  const canon = s => {
    const base = (s ?? '').toString();
    const lower = base.toLowerCase();
    const trimmed = lower.trim();
    const normal= trimmed.replace(/\s+/g, ' ');
    return normal;
  };

  const q = canon(name);
  
  // Looks for match between user's normalized input and normalized name
  const exact = cats.find(c => canon(c.name) === q);
  if (exact) {
    return exact.id;
  }
  
  // Looks for match between users normalized input starts with the entire query string
  const starts = cats.find(c => canon(c.name).startsWith(q));
  if (starts) {
    return starts.id;
  }

  return cats[0].id;
}