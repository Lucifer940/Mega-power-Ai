/* ============================================================
   MEGA POWER AI — auth.js  |  animated login / signup
   Local accounts + social (device) sign-in + phone OTP flow
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
['Ukraine','UA','380'],['United Arab Emirates','AE','971'],['United Kingdom','GB','44'],['United States','US','1'],['Uruguay','UY','598'],['Uzbekistan','UZ','998'],['Vanuatu','VU','678'],['Vatican City','VA','39'],['Venezuela','VE','58'],['Vietnam','VN','84'],
['Yemen','YE','967'],['Zambia','ZM','260'],['Zimbabwe','ZW','263']
];
Mega.auth.flag = (iso) => iso.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

/* simple hash (SHA-256 where available, fallback FNV) */
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

Mega.auth.users = () => Mega.store.get('users', {});
Mega.auth.saveUser = async (email, name, pass) => {
  const users = Mega.auth.users();
  users[email.toLowerCase()] = { name, hash: await Mega.auth.hash(pass + '::mega'), at: Date.now() };
  Mega.store.set('users', users);
};

/* ---------------- render ---------------- */
Mega.authOpen = () => {
  Mega.store.set('seenAuth', true);
  let el = Mega.$('#authScreen');
  if (!el) { el = document.createElement('div'); el.id = 'authScreen'; document.body.appendChild(el); }
  el.innerHTML = `
  <div class="auth-card">
    <img class="auth-logo" src="assets/icons/icon-192.png" alt="Mega Power AI">
    <div style="text-align:center">
      <div style="font-size:23px;font-weight:800;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent">MEGA POWER AI</div>
      <div style="font-size:11px;letter-spacing:.3em;color:var(--text2);font-weight:700;margin-top:4px">NO LIMITS · FREE · FOREVER</div>
    </div>
    <div class="auth-tabs">
      <button class="auth-tab on" data-t="login">Log in</button>
      <button class="auth-tab" data-t="signup">Sign up</button>
      <div class="auth-slider"></div>
    </div>

    <div data-panel="login signup">
      <button class="social-btn" data-social="google">
        <svg viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5H1.4v3C3.4 21.3 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4v-3H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l3.8-3z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.8 3c.9-2.9 3.6-4.8 6.8-4.8z"/></svg>
        Continue with Google
      </button>
      <button class="social-btn" data-social="facebook">
        <svg viewBox="0 0 24 24" width="19" height="19"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg>
        Continue with Facebook
      </button>
      <div class="auth-div">OR WITH EMAIL</div>
      <div data-form="signup" style="display:none">
        <label class="lbl">FULL NAME</label><input class="inp" id="auName" placeholder="Umesh Chaudhary" autocomplete="name">
      </div>
      <label class="lbl">EMAIL</label><input class="inp" id="auEmail" placeholder="you@example.com" autocomplete="email">
      <label class="lbl">PASSWORD</label><input class="inp" type="password" id="auPass" placeholder="••••••••" autocomplete="current-password">
      <button class="btn primary" id="auSubmit" style="width:100%;margin-top:18px;padding:13px">Log in ⚡</button>
    </div>

    <div class="auth-div" style="margin:18px 0 14px">OR WITH MOBILE</div>
    <div class="phone-row">
      <div class="country-sel">
        <button class="country-btn" id="auCountry">🇮🇳 +91</button>
        <div class="country-menu" id="auCountryMenu">
          <input class="inp" id="auCountrySearch" placeholder="Search country…" style="margin:8px;width:calc(100% - 16px)">
          <div id="auCountryList"></div>
        </div>
      </div>
      <input class="inp" id="auPhone" placeholder="98765 43210" inputmode="tel" style="flex:1">
    </div>
    <button class="btn" id="auPhoneBtn" style="width:100%;margin-top:12px">📱 Send code</button>

    <div style="text-align:center;margin-top:18px">
      <button class="btn ghost sm" id="auGuest">Continue as guest →</button>
    </div>
    <p style="text-align:center;font-size:10.5px;color:var(--text3);margin-top:14px;line-height:1.6">
      Accounts are stored privately on this device.<br>Cloud sync + real Google/Facebook/SMS sign-in activate when you connect your own keys.<br>🔒 Mega Power AI — a secret project by Umesh Chaudhary
    </p>
  </div>`;
  el.classList.add('open');

  /* tabs */
  let mode = 'login';
  const setMode = (m) => {
    mode = m;
    Mega.$$('.auth-tab', el).forEach(t => t.classList.toggle('on', t.dataset.t === m));
    Mega.$('[data-form="signup"]', el).style.display = m === 'signup' ? '' : 'none';
    Mega.$('#auSubmit', el).textContent = m === 'signup' ? 'Create account 🚀' : 'Log in ⚡';
  };
  el.onclick = (e) => {
    const t = e.target.closest('[data-t]');
    if (t) setMode(t.dataset.t);
  };

  /* social */
  Mega.$$('[data-social]', el).forEach(b => b.onclick = async () => {
    const which = b.dataset.social;
    b.innerHTML = '⏳ Connecting…';
    await Mega.sleep(900);
    const name = which === 'google' ? 'Google User' : 'Facebook User';
    Mega.setUser({ name, email: which + '.user@device', via: which, at: Date.now() });
    Mega.authClose();
    Mega.toast('Welcome, ' + name + '!', 'Signed in with ' + which.capitalize_() + ' (secure device account).', 'ok');
    b.innerHTML = which === 'google' ? 'Continue with Google' : 'Continue with Facebook';
  });

  /* email login/signup */
  Mega.$('#auSubmit', el).onclick = async () => {
    const email = Mega.$('#auEmail', el).value.trim();
    const pass = Mega.$('#auPass', el).value;
    const name = Mega.$('#auName', el)?.value.trim() || email.split('@')[0];
    if (!/^\S+@\S+\.\S+$/.test(email)) return Mega.toast('Check email', 'Please enter a valid email address.', 'warn');
    if (pass.length < 4) return Mega.toast('Check password', 'Password needs at least 4 characters.', 'warn');
    const users = Mega.auth.users();
    const k = email.toLowerCase();
    if (mode === 'signup') {
      if (users[k]) return Mega.toast('Already registered', 'This email exists — switch to Log in.', 'warn');
      await Mega.auth.saveUser(email, name, pass);
      Mega.setUser({ name, email: k, via: 'email', at: Date.now() });
      Mega.authClose(); Mega.toast('Account created 🎉', 'Welcome to Mega Power AI, ' + name + '!', 'ok');
    } else {
      if (!users[k]) { Mega.setUser({ name: name, email: k, via: 'email-local', at: Date.now() }); Mega.authClose(); return Mega.toast('Instant account ⚡', 'No account existed — created one on this device.', 'ok'); }
      const h = await Mega.auth.hash(pass + '::mega');
      if (h !== users[k].hash) return Mega.toast('Wrong password', 'Try again or use another method.', 'err');
      Mega.setUser({ name: users[k].name, email: k, via: 'email', at: Date.now() });
      Mega.authClose(); Mega.toast('Welcome back 👋', 'Logged in as ' + users[k].name, 'ok');
    }
  };

  /* country picker */
  const cBtn = Mega.$('#auCountry', el), cMenu = Mega.$('#auCountryMenu', el), cList = Mega.$('#auCountryList', el), cSearch = Mega.$('#auCountrySearch', el);
  let selC = ['India', 'IN', '91'];
  const renderCountries = (f = '') => {
    cList.innerHTML = Mega.auth.countries
      .filter(c => c[0].toLowerCase().includes(f) || c[2].includes(f))
      .map((c, i) => `<div class="country-item" data-c="${Mega.esc(c.join('|'))}"><span>${Mega.auth.flag(c[1])}</span> ${Mega.esc(c[0])}<span class="cd">+${c[2]}</span></div>`).join('');
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
  document.addEventListener('click', (e) => { if (!e.target.closest('.country-sel')) cMenu.classList.remove('open'); }, { once: false });

  /* phone OTP flow */
  Mega.$('#auPhoneBtn', el).onclick = async () => {
    const phone = Mega.$('#auPhone', el).value.replace(/\D/g, '');
    if (phone.length < 6) return Mega.toast('Check number', 'Enter a valid mobile number for ' + selC[0] + '.', 'warn');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    Mega._phoneOTP = otp;
    Mega.modal('📱 Verify ' + Mega.auth.flag(selC[1]) + ' +' + selC[2] + ' ' + Mega.esc(phone),
      'We sent a 6-digit code by SMS. (Demo mode: no SMS gateway is connected yet — here is your code.)',
      `<div style="text-align:center;padding:10px 0 4px"><div class="pill ok" style="font-size:15px;padding:8px 18px">🔑 ${otp}</div></div>
       <div class="otp-boxes">${[0,1,2,3,4,5].map(i => `<input class="otp-box" maxlength="1" inputmode="numeric" data-otp="${i}">`).join('')}</div>
       <button class="btn primary" id="otpVerify" style="width:100%">Verify & log in ✅</button>`,
      { onMount(w, close) {
          const boxes = Mega.$$('.otp-box', w);
          boxes[0].focus();
          boxes.forEach((b, i) => {
            b.oninput = () => { b.value = b.value.replace(/\D/g, ''); if (b.value && i < 5) boxes[i + 1].focus(); };
            b.onkeydown = (e) => { if (e.key === 'Backspace' && !b.value && i > 0) boxes[i - 1].focus(); };
          });
          Mega.$('#otpVerify', w).onclick = () => {
            const code = boxes.map(b => b.value).join('');
            if (code === Mega._phoneOTP) {
              close(true);
              Mega.setUser({ name: '+' + selC[2] + ' user', email: '+' + selC[2] + phone, via: 'phone', country: selC[0], at: Date.now() });
              Mega.authClose();
              Mega.toast('Phone verified 🎉', 'Logged in with +' + selC[2] + ' ' + phone, 'ok');
            } else Mega.toast('Wrong code', 'Check the 6 digits and try again.', 'err');
          };
        } });
  };

  Mega.$('#auGuest', el).onclick = () => { Mega.setUser({ name: 'Guest', email: 'guest@device', via: 'guest', at: Date.now() }); Mega.authClose(); Mega.toast('Guest mode', 'Everything works — log in any time.', 'ok'); };
};

Mega.authClose = () => { Mega.$('#authScreen')?.classList.remove('open'); };
String.prototype.capitalize_ = function () { return this.charAt(0).toUpperCase() + this.slice(1); };

/* sidebar user chip */
Mega.authRender = () => {
  const chip = Mega.$('#sbUser'); if (!chip) return;
  const u = Mega.user;
  const label = u ? (u.name || u.email || 'User') : '?';
  chip.innerHTML = `<div class="av">${Mega.esc(String(label).trim().charAt(0).toUpperCase() || 'U')}</div>
    <div class="grow" style="min-width:0"><div class="un">${Mega.esc(u ? (u.name || 'User') : 'Sign in / Sign up')}</div>
    <div class="ue">${u ? Mega.esc(u.email || '') : 'Google · Facebook · Mobile'}</div></div>`;
};
