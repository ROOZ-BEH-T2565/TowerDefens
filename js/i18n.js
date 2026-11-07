// Persian + English dictionaries and language logic.
const D = {
  en: { gold:'Gold', wave:'Wave', next:'Start wave now (+bonus)', nextin:'Next wave in', s:'s', inwave:'Wave in progress',
    cannon:'Cannon', sniper:'Sniper', freezer:'Freezer', build:'Build', upgrade:'Upgrade', sell:'Sell', max:'MAX',
    dmg:'Damage', range:'Range', rate:'Rate', level:'Level', over:'Game Over', win:'Victory!', reached:'You reached wave',
    restart:'Play again', how:'How to play', start:"Let's go!",
    h1:'Tap a tile off the path to build a tower.', h2:'Tap a tower to upgrade it or sell it (50% refund).',
    h3:'Kill enemies for gold. Each one that reaches the base costs HP.', h4:'Start waves early for bonus gold. Survive 20 waves!' },
  fa: { gold:'طلا', wave:'موج', next:'شروع موج (جایزه)', nextin:'موج بعدی تا', s:'ثانیه', inwave:'موج در جریان است',
    cannon:'توپ', sniper:'تک‌تیرانداز', freezer:'منجمدکننده', build:'ساخت', upgrade:'ارتقا', sell:'فروش', max:'حداکثر',
    dmg:'آسیب', range:'برد', rate:'سرعت', level:'سطح', over:'باختی!', win:'پیروزی!', reached:'رسیدی به موج',
    restart:'بازی دوباره', how:'راهنما', start:'بزن بریم!',
    h1:'روی یک خانهٔ خارج از مسیر بزن تا برج بسازی.', h2:'روی برج بزن تا ارتقا بدهی یا بفروشی (۵۰٪ بازگشت).',
    h3:'با کشتن دشمنان طلا بگیر. هر دشمنی که به پایگاه برسد جان کم می‌کند.', h4:'موج‌ها را زودتر شروع کن تا جایزه بگیری. ۲۰ موج دوام بیاور!' },
};
export const i18n = {
  lang: localStorage.getItem('td_lang') || (navigator.language.startsWith('fa') ? 'fa' : 'en'),
  t(k) { return D[this.lang][k] ?? k; },
  set(l) { this.lang = l; localStorage.setItem('td_lang', l); this.apply(); },
  apply() { // updates dir/lang and all static [data-i18n] elements
    const h = document.documentElement; h.lang = this.lang; h.dir = this.lang === 'fa' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = this.t(e.dataset.i18n));
    const b = document.getElementById('lang'); if (b) b.textContent = this.lang === 'fa' ? 'EN' : 'FA';
  },
};
export const t = k => i18n.t(k);
