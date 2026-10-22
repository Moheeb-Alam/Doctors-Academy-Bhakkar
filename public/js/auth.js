const SUPABASE_URL = window.ACADEMY_SUPABASE_URL || "";
const SUPABASE_KEY = window.ACADEMY_SUPABASE_ANON_KEY || "";
const form = document.getElementById("login-form");
const errorBox = document.getElementById("login-error");
const button = document.getElementById("login-button");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  errorBox.textContent = "Setup required: add your Supabase URL and anon/publishable key in public/js/config.js.";
  button.disabled = true;
} else {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  client.auth.getSession().then(({ data }) => {
    if (data.session) location.href = "/";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      const { error } = await client.auth.signInWithPassword({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      });
      if (error) throw error;
      location.href = "/";
    } catch (error) {
      errorBox.textContent = error.message || "Unable to sign in.";
    } finally {
      button.disabled = false;
      button.innerHTML = 'Sign in <span>→</span>';
    }
  });
}
