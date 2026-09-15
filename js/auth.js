/* ============================================================
   MEGA POWER AI — auth.js  |  real accounts: separate Login &
   Sign-up pages, multi-step Google/Facebook flow (NO auto-login),
   email+password with hashed verification, phone OTP, guest.
   Accounts live privately on this device. Session persists —
   log in once, stay logged in.
   Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.auth = {};

/* full country list: [name, iso2, dial code] — flag emoji derived from iso2 */
Mega.auth.countries = [
['Afghanistan','AF','93'],['Albania','AL','355'],['Algeria','DZ','213'],['Andorra','AD','376'],['Angola','AO','244'],['Argentina','AR','54'],['Armenia','AM','374'],['Australia','AU','61'],['Austria','AT','43'],['Azerbaijan','AZ','994'],
['Bahamas','BS','1'],['Bahrain','BH','973'],['Bangladesh','BD','880'],['Barbados','BB','1'],['Belarus','BY','375'],['Belgium','BE','32'],['Belize','BZ','501'],['Benin','BJ','229'],['Bhutan','BT','975'],['Bolivia','BO','591'],
['Bosnia & Herzegovina','BA','387'],['Botswana','BW','267'],['Brazil','BR','55'],['Brunei','BN','673'],['Bulgaria','BG','359'],['Burkina Faso','BF','226'],['Burundi','BI','257'],['Cambodia','KH','855'],['Cameroon','CM','237'],['Canada','CA','1'],
['Cape Verde','CV','238'],['Central African Rep.','CF','236'],['Chad','TD','235'],['Chile','CL','56'],['China','CN','86'],['Colombia','CO','57'],['Comoros','KM','269'],['Congo','CG','242'],['Costa Rica','CR','506'],['Croatia','HR','385'],
['Cuba','CU','53'],['Cyprus','CY','357'],['Czechia','CZ','420'],['Denmark','DK','45'],['Djibouti','DJ','253'],['Dominica','DM','1'],['Dominican Rep.','DO','1'],['Ecuador','EC','593'],['Egypt','EG','20'],['El Salvador','SV','503'],
['Equatorial Guinea','GQ','240'],['Eritrea','ER','291'],['Estonia','EE','372'],['Eswatini','SZ','268'],['Ethiopia','ET','251'],['Fiji','FJ','679'],['Finland','FI','358'],['France','FR','33'],['Gabon','GA','241'],['Gambia','GM','220'],
['Georgia','GE','995'],['Germany','DE','49'],['Ghana','GH','233'],['Greece','GR','30'],['Greenland','GL','299'],['Grenada','GD','1'],['Guatemala','GT','502'],['Guinea','GN','224'],['Guinea-Bissau','GW','245'],['Guyana','GY','592'],
['Haiti','HT','509'],['Honduras','HN','504'],['Hong Kong','HK','852'],['Hungary','HU','36'],['Iceland','IS','354'],['India','IN','91'],['Indonesia','ID','62'],['Iran','IR','98'],['Iraq','IQ','964'],['Ireland','IE','353'],
['Israel','IL','972'],['Italy','IT','39'],['Ivory Coast','CI','225'],['Jamaica','JM','1'],['Japan','JP','81'],['Jordan','JO','962'],['Kazakhstan','KZ','7'],['Kenya','KE','254'],['Kiribati','KI','686'],['Korea (North)','KP','850'],
['Korea (South)','KR','82'],['Kuwait','KW','965'],['Kyrgyzstan','KG','996'],['Laos','LA','856'],['Latvia','LV','371'],['Lebanon','LB','961'],['Lesotho','LS','266'],['Liberia','LR','231'],['Libya','LY','218'],['Liechtenstein','LI','423'],
['Lithuania','LT','370'],['Luxembourg','LU','352'],['Madagascar','MG','261'],['Malawi','MW','265'],['Malaysia','MY','60'],['Maldives','MV','960'],['Mali','ML','223'],['Malta','MT','356'],['Marshall Islands','MH','692'],['Mauritania','MR','222'],
['Mauritius','MU','230'],['Mexico','MX','52'],['Micronesia','FM','691'],['Moldova','MD','373'],['Monaco','MC','377'],['Mongolia','MN','976'],['Montenegro','ME','382'],['Morocco','MA','212'],['Mozambique','MZ','258'],['Myanmar','MM','95'],
['Namibia','NA','264'],['Nauru','NR','674'],['Nepal','NP','977'],['Netherlands','NL','31'],['New Zealand','NZ','64'],['Nicaragua','NI','505'],['Niger','NE','227'],['Nigeria','NG','234'],['North Macedonia','MK','389'],['Norway','NO','47'],
['Oman','OM','968'],['Pakistan','PK','92'],['Palau','PW','680'],['Palestine','PS','970'],['Panama','PA','507'],['Papua New Guinea','PG','675'],['Paraguay','PY','595'],['Peru','PE','51'],['Philippines','PH','63'],['Poland','PL','48'],
['Portugal','PT','351'],['Qatar','QA','974'],['Romania','RO','40'],['Russia','RU','7'],['Rwanda','RW','250'],['Samoa','WS','685'],['San Marino','SM','378'],['São Tomé & Príncipe','ST','239'],['Saudi Arabia','SA','966'],['Senegal','SN','221'],
['Serbia','RS','381'],['Seychelles','SC','248'],['Sierra Leone','SL','232'],['Singapore','SG','65'],['Slovakia','SK','421'],['Slovenia','SI','386'],['Solomon Islands','SB','677'],['Somalia','SO','252'],['South Africa','ZA','27'],['South Sudan','SS','211'],
['Spain','ES','34'],['Sri Lanka','LK','94'],['Sudan','SD','249'],['Suriname','SR','597'],['Sweden','SE','46'],['Switzerland','CH','41'],['Syria','SY','963'],['Taiwan','TW','886'],['Tajikistan','TJ','992'],['Tanzania','TZ','255'],
['Thailand','TH','66'],['Timor-Leste','TL','670'],['Togo','TG','228'],['Tonga','TO','676'],['Trinidad & Tobago','TT','1'],['Tunisia','TN','216'],['Turkey','TR','90'],['Turkmenistan','TM','993'],['Tuvalu','TV','688'],['Uganda','UG','256'],
['Ukraine','UA','380'],['United Arab Emirates','AE','971'],['United Kingdom','GB','44'],['United States','US','1'],['Uruguay','UY','598'],['Uzbekistan','UZ','998'],['Vanuatu','VU','678'],['Vatican City','VA','379'],['Venezuela','VE','58'],['Vietnam','VN','84'],
['Yemen','YE','967'],['Zambia','ZM','260'],['Zimbabwe','ZW','263']
];
Mega.auth.flag = (iso) => iso.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

/* password hash: SHA-256 (salted per email), FNV fallback for insecure contexts */
Mega.auth.hash = async (s) => {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ('fnv' + (h >>> 0).toString(16));
  }
};

/* ---------- account store (this device, private) ---------- */
Mega.auth.users = () => Mega.store.get('users', {});
Mega.auth.saveUsers = (users) => Mega.store.set('users', users);
Mega.auth.createAccount = async (email, name, pass, via) => {
  const users = Mega.auth.users();
  const k = email.toLowerCase();
  if (users[k]) return { ok: false, err: 'This email is already registered. Log in instead.' };
  users[k] = { name: name || email.split('@')[0], hash: await Mega.auth.hash(k + '::' + pass), via: via || 'email', at: Date.now() };
  Mega.auth.saveUsers(users);
  return { ok: true, user: { name: users[k].name, email: k, via: users[k].via, at: users[k].at } };
};
Mega.auth.verify = async (email, pass) => {
  const users = Mega.auth.users();
  const k = email.toLowerCase();
  if (!users[k]) return { ok: false, err: 'notfound' };
  const h = await Mega.auth.hash(k + '::' + pass);
  if (h !== users[k].hash) return { ok: false, err: 'wrongpass' };
  return { ok: true, user: { name: users[k].name, email: k, via: users[k].via, at: Date.now() } };
};
Mega.auth.socialAccounts = (via) => Object.entries(Mega.auth.users()).filter(([, u]) => u.via === via).map(([email, u]) => Object.assign({}, u, { email }));
Mega.auth.avColor = (s) => 'hsl(' + (Math.abs([...s].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)) % 360) + ',55%,45%)';

/* ============================================================
   AUTH PAGES — login & signup are two DIFFERENT screens
   ============================================================ */
Mega.authOpen = (page = 'login') => {
  Mega.store.set('seenAuth', true);
  let el = Mega.$('#authScreen');
  if (!el) { el = document.createElement('div'); el.id = 'authScreen'; document.body.appendChild(el); }
  el.classList.add('open');
  el.dataset.page = page;
  (page === 'signup') ? Mega.auth.signupPage(el) : Mega.auth.loginPage(el);
};

Mega.auth.errBox = (msg) => `<div class="auth-err ${msg ? 'show' : ''}" id="auErr">${msg ? Mega.esc(msg) : ''}</div>`;
Mega.auth.showErr = (msg) => { const e = Mega.$('#auErr'); if (e) { e.textContent = msg; e.classList.add('show'); } };

Mega.auth.googleIcon = `<svg viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5H1.4v3C3.4 21.3 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4v-3H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.8-3z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.8 3c.9-2.9 3.6-4.8 6.8-4.8z"/></svg>`;
Mega.auth.fbIcon = `<svg viewBox="0 0 24 24" width="19" height="19"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg>`;

/* ================= PAGE 1 — LOG IN ================= */
Mega.auth.loginPage = (el) => {
  el.innerHTML = `
  <div class="auth-page">
    <img class="auth-logo" src="assets/icons/icon-192.png" alt="Mega Power AI">
    <div class="auth-title">Welcome back 👋</div>
    <div class="auth-sub">Log in to Mega Power AI — your chats, projects &amp; keys are waiting.</div>
    ${Mega.auth.errBox('')}
    <div class="auth-form">
      <input class="inp" id="auEmail" type="email" placeholder="Email address" autocomplete="email">
      <input class="inp" id="auPass" type="password" placeholder="Password" autocomplete="current-password">
      <button class="btn primary auth-big" id="auLogin">Log in ⚡</button>
    </div>
    <div class="auth-div">OR CONTINUE WITH</div>
    <button class="social-btn" id="auGoogle">${Mega.auth.googleIcon} Continue with Google</button>
    <button class="social-btn" id="auFacebook">${Mega.auth.fbIcon} Continue with Facebook</button>
    <div class="auth-div">OR WITH MOBILE</div>
    <div class="phone-row">
      <div class="country-sel">
        <button class="country-btn" id="auCountry">🇦🇪 +971</button>
        <div class="country-menu" id="auCountryMenu">
          <input class="inp" id="auCountrySearch" placeholder="Search country…" style="margin:8px;width:calc(100% - 16px)">
          <div id="auCountryList"></div>
        </div>
      </div>
      <input class="inp" id="auPhone" placeholder="50 123 4567" inputmode="tel" style="flex:1">
    </div>
    <button class="btn auth-big" id="auPhoneBtn" style="background:transparent">📱 Send code</button>
    <div class="auth-switch">Don't have an account? <a id="auGoSignup">Create one</a></div>
    <div class="auth-foot"><span class="guest" id="auGuest">Skip for now →</span></div>
    <p style="text-align:center;font-size:10px;color:var(--text3);margin-top:16px;line-height:1.6">Accounts &amp; passwords are stored privately on this device.<br>🔒 Mega Power AI — created by Umesh Chaudhary</p>
  </div>`;

  Mega.$('#auGoSignup', el).onclick = () => Mega.auth.signupPage(el);
  Mega.$('#auLogin', el).onclick = async () => {
    const email = Mega.$('#auEmail', el).value.trim();
    const pass = Mega.$('#auPass', el).value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return Mega.auth.showErr('Please enter a valid email address.');
    if (!pass) return Mega.auth.showErr('Please enter your password.');
    const btn = Mega.$('#auLogin', el); btn.disabled = true; btn.textContent = 'Logging in…';
    const r = await Mega.auth.verify(email, pass);
    if (!r.ok) {
      btn.disabled = false; btn.textContent = 'Log in ⚡';
      return Mega.auth.showErr(r.err === 'notfound' ? 'No account found with this email — create one first (link below).' : 'Incorrect password. Please try again.');
    }
    Mega.setUser(r.user); Mega.authClose();
    Mega.toast('Welcome back, ' + r.user.name + ' 👋', 'Logged in successfully.', 'ok');
  };
  Mega.$('#auPass', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') Mega.$('#auLogin', el).click(); });
  Mega.$('#auGoogle', el).onclick = () => Mega.auth.socialFlow(el, 'google');
  Mega.$('#auFacebook', el).onclick = () => Mega.auth.socialFlow(el, 'facebook');
  Mega.auth.bindPhone(el);
  Mega.$('#auGuest', el).onclick = () => {
    Mega.setUser({ name: 'Guest', email: 'guest@device', via: 'guest', at: Date.now() });
    Mega.authClose(); Mega.toast('Guest mode', 'Everything works — create an account any time.', 'ok');
  };
  setTimeout(() => Mega.$('#auEmail', el)?.focus(), 80);
};

/* ================= PAGE 2 — SIGN UP ================= */
Mega.auth.signupPage = (el) => {
  el.innerHTML = `
  <div class="auth-page">
    <img class="auth-logo" src="assets/icons/icon-192.png" alt="Mega Power AI">
    <div class="auth-title">Create your account 🚀</div>
    <div class="auth-sub">Free forever · no limits · your data stays on your device.</div>
    ${Mega.auth.errBox('')}
    <div class="auth-form">
      <input class="inp" id="asName" placeholder="Full name" autocomplete="name">
      <input class="inp" id="asEmail" type="email" placeholder="Email address" autocomplete="email">
      <input class="inp" id="asPass" type="password" placeholder="Password (min 6 characters)" autocomplete="new-password">
      <input class="inp" id="asPass2" type="password" placeholder="Confirm password" autocomplete="new-password">
      <button class="btn primary auth-big" id="asCreate">Create account 🚀</button>
    </div>
    <div class="auth-div">OR SIGN UP WITH</div>
    <button class="social-btn" id="asGoogle">${Mega.auth.googleIcon} Sign up with Google</button>
    <button class="social-btn" id="asFacebook">${Mega.auth.fbIcon} Sign up with Facebook</button>
    <div class="auth-switch">Already have an account? <a id="asGoLogin">Log in</a></div>
    <p style="text-align:center;font-size:10px;color:var(--text3);margin-top:16px;line-height:1.6">By creating an account you agree to keep it private on this device.<br>🔒 Mega Power AI — created by Umesh Chaudhary</p>
  </div>`;

  Mega.$('#asGoLogin', el).onclick = () => Mega.auth.loginPage(el);
  Mega.$('#asCreate', el).onclick = async () => {
    const name = Mega.$('#asName', el).value.trim();
    const email = Mega.$('#asEmail', el).value.trim();
    const pass = Mega.$('#asPass', el).value;
    const pass2 = Mega.$('#asPass2', el).value;
    if (name.length < 2) return Mega.auth.showErr('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return Mega.auth.showErr('Please enter a valid email address.');
    if (pass.length < 6) return Mega.auth.showErr('Password needs at least 6 characters.');
    if (pass !== pass2) return Mega.auth.showErr('Passwords do not match.');
    const btn = Mega.$('#asCreate', el); btn.disabled = true; btn.textContent = 'Creating…';
    const r = await Mega.auth.createAccount(email, name, pass, 'email');
    if (!r.ok) { btn.disabled = false; btn.textContent = 'Create account 🚀'; return Mega.auth.showErr(r.err); }
    Mega.setUser(r.user); Mega.authClose();
    Mega.toast('Account created 🎉', 'Welcome to Mega Power AI, ' + r.user.name + '!', 'ok');
  };
  Mega.$('#asPass2', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') Mega.$('#asCreate', el).click(); });
  Mega.$('#asGoogle', el).onclick = () => Mega.auth.socialFlow(el, 'google');
  Mega.$('#asFacebook', el).onclick = () => Mega.auth.socialFlow(el, 'facebook');
  setTimeout(() => Mega.$('#asName', el)?.focus(), 80);
};

/* ============================================================
   SOCIAL FLOW — the FULL process (choose account → verify /
   create). Never an instant login.
   ============================================================ */
Mega.auth.socialFlow = (el, brand) => {
  const B = brand === 'google'
    ? { name: 'Google', logo: Mega.auth.googleIcon, color: '#1a73e8' }
    : { name: 'Facebook', logo: Mega.auth.fbIcon, color: '#1877F2' };

  /* ---- step 1: choose an account ---- */
  const choose = () => {
    const accs = Mega.auth.socialAccounts(brand);
    el.innerHTML = `
    <div class="gflow">
      <div class="glogo">${B.logo.replace('width="19" height="19"', 'width="40" height="40"')}</div>
      <h3>Choose an account</h3>
      <div class="gsub">to continue to <b>Mega Power AI</b></div>
      ${accs.map(a => `
        <button class="gacc" data-e="${Mega.esc(a.email)}">
          <span class="gav" style="background:${Mega.auth.avColor(a.email)}">${Mega.esc((a.name || '?').charAt(0).toUpperCase())}</span>
          <span><span class="gn">${Mega.esc(a.name)}</span><br><span class="ge">${Mega.esc(a.email)}</span></span>
        </button>`).join('')}
      <button class="gacc" id="gOther" style="border-top:1px solid #e8eaed;border-radius:0;margin-top:4px">
        <span class="gav" style="background:#fff;color:#5f6368;border:1px dashed #dadce0;font-size:18px">＋</span>
        <span><span class="gn">Use another account</span></span>
      </button>
      <div class="gnote">To continue, Mega Power AI will verify your identity on this device. This simulates the ${B.name} sign-in flow locally — no data leaves your device.</div>
      <div class="grow2">
        <button class="gback" id="gBack">← Back</button>
      </div>
    </div>`;
    Mega.$$('#authScreen .gacc[data-e]').forEach(b => b.onclick = () => passwordStep(b.dataset.e));
    Mega.$('#gOther', el).onclick = emailStep;
    Mega.$('#gBack', el).onclick = () => Mega.authOpen('login');
  };

  /* ---- step 2: enter email ---- */
  const emailStep = () => {
    el.innerHTML = `
    <div class="gflow">
      <div class="glogo">${B.logo.replace('width="19" height="19"', 'width="40" height="40"')}</div>
      <h3>Sign in</h3>
      <div class="gsub">to continue to <b>Mega Power AI</b></div>
      <input class="ginp" id="gEmail" type="email" placeholder="Your email address" autocomplete="email">
      <div class="gerr" id="gErr"></div>
      <div class="grow2">
        <button class="gback" id="gBack">← Back</button>
        <button class="gbtn" id="gNext">Next</button>
      </div>
    </div>`;
    Mega.$('#gBack', el).onclick = choose;
    const go = async () => {
      const email = Mega.$('#gEmail', el).value.trim();
      const err = Mega.$('#gErr', el);
      if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Enter a valid email address.'; err.classList.add('show'); return; }
      const users = Mega.auth.users();
      users[email.toLowerCase()] ? passwordStep(email) : createStep(email);
    };
    Mega.$('#gNext', el).onclick = go;
    Mega.$('#gEmail', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => Mega.$('#gEmail', el)?.focus(), 80);
  };

  /* ---- step 3a: existing account → password ---- */
  const passwordStep = (email) => {
    el.innerHTML = `
    <div class="gflow">
      <div class="glogo">${B.logo.replace('width="19" height="19"', 'width="40" height="40"')}</div>
      <h3>Welcome</h3>
      <div class="gsub">Enter the password for <b>${Mega.esc(email)}</b></div>
      <input class="ginp" id="gPass" type="password" placeholder="Password" autocomplete="current-password">
      <div class="gerr" id="gErr"></div>
      <div class="grow2">
        <button class="gback" id="gBack">← Back</button>
        <button class="gbtn" id="gGo">Verify &amp; continue</button>
      </div>
    </div>`;
    Mega.$('#gBack', el).onclick = choose;
    const go = async () => {
      const btn = Mega.$('#gGo', el); btn.disabled = true; btn.textContent = 'Verifying…';
      const r = await Mega.auth.verify(email, Mega.$('#gPass', el).value);
      if (!r.ok) {
        btn.disabled = false; btn.textContent = 'Verify & continue';
        const err = Mega.$('#gErr', el);
        err.textContent = 'Wrong password. Try again.'; err.classList.add('show');
        return;
      }
      Mega.setUser(r.user); Mega.authClose();
      Mega.toast('Signed in with ' + B.name + ' ✅', 'Welcome, ' + r.user.name + '!', 'ok');
    };
    Mega.$('#gGo', el).onclick = go;
    Mega.$('#gPass', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => Mega.$('#gPass', el)?.focus(), 80);
  };

  /* ---- step 3b: new account → create ---- */
  const createStep = (email) => {
    el.innerHTML = `
    <div class="gflow">
      <div class="glogo">${B.logo.replace('width="19" height="19"', 'width="40" height="40"')}</div>
      <h3>Create your ${B.name} account</h3>
      <div class="gsub">for <b>${Mega.esc(email)}</b> — used only on this device</div>
      <input class="ginp" id="gcName" placeholder="Full name">
      <input class="ginp" id="gcPass" type="password" placeholder="Choose a password (min 6 characters)">
      <input class="ginp" id="gcPass2" type="password" placeholder="Confirm password">
      <div class="gerr" id="gErr"></div>
      <div class="grow2">
        <button class="gback" id="gBack">← Back</button>
        <button class="gbtn" id="gGo">Create &amp; continue</button>
      </div>
    </div>`;
    Mega.$('#gBack', el).onclick = () => emailStep();
    const go = async () => {
      const name = Mega.$('#gcName', el).value.trim();
      const p1 = Mega.$('#gcPass', el).value, p2 = Mega.$('#gcPass2', el).value;
      const err = Mega.$('#gErr', el);
      if (name.length < 2) { err.textContent = 'Enter your full name.'; err.classList.add('show'); return; }
      if (p1.length < 6) { err.textContent = 'Password needs at least 6 characters.'; err.classList.add('show'); return; }
      if (p1 !== p2) { err.textContent = 'Passwords do not match.'; err.classList.add('show'); return; }
      const btn = Mega.$('#gGo', el); btn.disabled = true; btn.textContent = 'Creating…';
      const r = await Mega.auth.createAccount(email, name, p1, brand);
      if (!r.ok) { btn.disabled = false; btn.textContent = 'Create & continue'; err.textContent = r.err; err.classList.add('show'); return; }
      Mega.setUser(r.user); Mega.authClose();
      Mega.toast('Account created with ' + B.name + ' 🎉', 'Welcome, ' + r.user.name + '!', 'ok');
    };
    Mega.$('#gGo', el).onclick = go;
    setTimeout(() => Mega.$('#gcName', el)?.focus(), 80);
  };

  choose();
};

/* ---------- phone OTP (device verification) ---------- */
Mega.auth.bindPhone = (el) => {
  const cBtn = Mega.$('#auCountry', el), cMenu = Mega.$('#auCountryMenu', el), cList = Mega.$('#auCountryList', el), cSearch = Mega.$('#auCountrySearch', el);
  if (!cBtn) return;
  let selC = ['United Arab Emirates', 'AE', '971'];
  const renderCountries = (f = '') => {
    cList.innerHTML = Mega.auth.countries
      .filter(c => c[0].toLowerCase().includes(f) || c[2].includes(f))
      .map(c => `<div class="country-item" data-c="${Mega.esc(c.join('|'))}"><span>${Mega.auth.flag(c[1])}</span> ${Mega.esc(c[0])}<span class="cd">+${c[2]}</span></div>`).join('');
  };
  renderCountries();
  cBtn.onclick = (e) => { e.stopPropagation(); cMenu.classList.toggle('open'); cSearch.focus(); };
  cSearch.oninput = () => renderCountries(cSearch.value.toLowerCase());
  cList.onclick = (e) => {
    const it = e.target.closest('[data-c]'); if (!it) return;
    selC = it.dataset.c.split('|');
    cBtn.innerHTML = `${Mega.auth.flag(selC[1])} +${selC[2]}`;
    cMenu.classList.remove('open');
  };
  document.addEventListener('click', (e) => { if (!e.target.closest('.country-sel')) cMenu.classList.remove('open'); });

  Mega.$('#auPhoneBtn', el).onclick = async () => {
    const phone = Mega.$('#auPhone', el).value.replace(/\D/g, '');
    if (phone.length < 6) return Mega.auth.showErr('Enter a valid mobile number for ' + selC[0] + '.');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    Mega._phoneOTP = otp;
    Mega.modal('📱 Verify ' + Mega.auth.flag(selC[1]) + ' +' + selC[2] + ' ' + Mega.esc(phone),
      'Enter the 6-digit verification code. (No SMS gateway is connected — your device code is shown below.)',
      `<div style="text-align:center;padding:8px 0 4px"><div class="pill ok" style="font-size:15px;padding:8px 18px">🔑 ${otp}</div></div>
       <div class="otp-boxes">${[0, 1, 2, 3, 4, 5].map(i => `<input class="otp-box" maxlength="1" inputmode="numeric" data-otp="${i}">`).join('')}</div>
       <button class="btn primary" id="otpVerify" style="width:100%">Verify &amp; log in ✅</button>`,
      { onMount(w, close) {
          const boxes = Mega.$$('.otp-box', w);
          boxes[0].focus();
          boxes.forEach((b, i) => {
            b.oninput = () => { b.value = b.value.replace(/\D/g, ''); if (b.value && i < 5) boxes[i + 1].focus(); };
            b.onkeydown = (e) => { if (e.key === 'Backspace' && !b.value && i > 0) boxes[i - 1].focus(); };
          });
          Mega.$('#otpVerify', w).onclick = async () => {
            const code = boxes.map(b => b.value).join('');
            if (code === Mega._phoneOTP) {
              close(true);
              const email = '+' + selC[2] + phone;
              const users = Mega.auth.users();
              if (!users[email]) users[email] = { name: '+' + selC[2] + ' user', hash: '', via: 'phone', at: Date.now() }, Mega.auth.saveUsers(users);
              Mega.setUser({ name: users[email].name, email, via: 'phone', country: selC[0], at: Date.now() });
              Mega.authClose();
              Mega.toast('Phone verified 🎉', 'Logged in with +' + selC[2] + ' ' + phone, 'ok');
            } else Mega.toast('Wrong code', 'Check the 6 digits and try again.', 'err');
          };
        } });
  };
};

Mega.authClose = () => Mega.$('#authScreen')?.classList.remove('open');

/* sidebar user chip */
Mega.authRender = () => {
  const chip = Mega.$('#sbUser'); if (!chip) return;
  const u = Mega.user;
  if (u) {
    chip.innerHTML = `<div class="av">${Mega.esc(String(u.name || 'U').trim().charAt(0).toUpperCase())}</div>
      <div class="grow" style="min-width:0"><div class="un">${Mega.esc(u.name || 'User')}</div>
      <div class="ue">${Mega.esc(u.email || '')}</div></div>`;
  } else {
    chip.innerHTML = `<div class="av" style="background:var(--glass2);color:var(--text2)">?</div>
      <div class="grow" style="min-width:0"><div class="un">Sign in</div>
      <div class="ue">Log in or create an account</div></div>`;
  }
};
