window.AcademyAPI = (() => {
  const URL = window.ACADEMY_SUPABASE_URL || "";
  const KEY = window.ACADEMY_SUPABASE_ANON_KEY || "";
  const client = URL && KEY ? window.supabase.createClient(URL, KEY) : null;
  async function session() {
    if (!client) throw new Error("Setup required: add your Supabase URL and anon/publishable key in public/js/config.js.");
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) { location.href = "/login.html"; throw new Error("Please sign in."); }
    return data.session;
  }
  async function request(path, options = {}) {
    const s = await session();
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.access_token}`, ...(options.headers || {}) }
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) { await client.auth.signOut(); location.href = "/login.html"; }
      throw new Error(body.error || "Request failed.");
    }
    return body;
  }
  return {
    client, session, get: p => request(p),
    post: (p, data) => request(p, { method: "POST", body: JSON.stringify(data) }),
    put: (p, data) => request(p, { method: "PUT", body: JSON.stringify(data) }),
    del: p => request(p, { method: "DELETE" })
  };
})();
