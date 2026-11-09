/* Prayer times by the Umm al-Qura calendar method (ummulqura.org.sa):
   Fajr at 18.5° below the horizon, Asr by the standard shadow (1x),
   Isha 90 minutes after Maghrib (120 minutes during Ramadan). */
(function () {
  const D = Math.PI / 180;
  const sin = d => Math.sin(d * D), cos = d => Math.cos(d * D), tan = d => Math.tan(d * D);
  const asin = x => Math.asin(x) / D, acos = x => Math.acos(x) / D, atan2 = (y, x) => Math.atan2(y, x) / D, acot = x => Math.atan(1 / x) / D;
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    const D2 = jd - 2451545.0, g = fix(357.529 + 0.98560028 * D2, 360), q = fix(280.459 + 0.98564736 * D2, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D2;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  }
  // offset (hours) of an IANA zone on a given date
  function tzOffset(tz, date) {
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
      return (asUTC - Math.floor(date.getTime() / 60000) * 60000) / 3600000;
    } catch (_) { return -date.getTimezoneOffset() / 60; }
  }

  function compute(date, lat, lng, tz, ramadan) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const off = tzOffset(tz, new Date(Date.UTC(y, m - 1, d, 12)));
    const jd = julian(y, m, d) - lng / 360;
    const at = (t) => sunPos(jd + t / 24);
    const noon = t => { const s = at(t); return fix(12 - s.eqt, 24); };
    const angleTime = (angle, t, ccw) => {
      const s = at(t), n = noon(t);
      const v = acos((-sin(angle) - sin(s.decl) * sin(lat)) / (cos(s.decl) * cos(lat))) / 15;
      return n + (ccw ? -v : v);
    };
    const asrTime = (t) => {
      const s = at(t), ang = -acot(1 + tan(Math.abs(lat - s.decl)));
      return angleTime(ang, t);
    };
    // two refinement passes with day-fraction estimates
    let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18 };
    for (let i = 0; i < 2; i++) {
      T = {
        fajr: angleTime(18.5, T.fajr, true),
        sunrise: angleTime(0.833, T.sunrise, true),
        dhuhr: noon(T.dhuhr),
        asr: asrTime(T.asr),
        maghrib: angleTime(0.833, T.maghrib)
      };
    }
    const adj = h => h + off - lng / 15;
    const out = {};
    for (const k in T) out[k] = adj(T[k]);
    out.dhuhr += 1 / 60;
    out.isha = out.maghrib + (ramadan ? 120 : 90) / 60;
    const toDate = h => {
      const mins = Math.round(h * 60);
      // build the instant: local wall time in tz -> UTC
      return new Date(Date.UTC(y, m - 1, d, 0, mins) - off * 3600000);
    };
    const res = {};
    for (const k in out) res[k] = toDate(out[k]);
    return res;
  }

  window.PrayerTimes = { compute, tzOffset };
  window.CITIES = [
    ['مكة المكرمة', 21.4225, 39.8262, 'Asia/Riyadh'],
    ['المدينة المنورة', 24.4672, 39.6024, 'Asia/Riyadh'],
    ['الرياض', 24.7136, 46.6753, 'Asia/Riyadh'],
    ['جدة', 21.4858, 39.1925, 'Asia/Riyadh'],
    ['الدمام', 26.4207, 50.0888, 'Asia/Riyadh'],
    ['بريدة', 26.3592, 43.9818, 'Asia/Riyadh'],
    ['أبها', 18.2164, 42.5053, 'Asia/Riyadh'],
    ['تبوك', 28.3835, 36.5662, 'Asia/Riyadh'],
    ['حائل', 27.5114, 41.7208, 'Asia/Riyadh'],
    ['جازان', 16.8892, 42.5511, 'Asia/Riyadh'],
    ['الطائف', 21.2703, 40.4158, 'Asia/Riyadh'],
    ['نجران', 17.4924, 44.1277, 'Asia/Riyadh'],
    ['الكويت', 29.3759, 47.9774, 'Asia/Kuwait'],
    ['الدوحة', 25.2854, 51.5310, 'Asia/Qatar'],
    ['دبي', 25.2048, 55.2708, 'Asia/Dubai'],
    ['المنامة', 26.2285, 50.5860, 'Asia/Bahrain'],
    ['مسقط', 23.5880, 58.3829, 'Asia/Muscat'],
    ['عمّان', 31.9454, 35.9284, 'Asia/Amman'],
    ['القاهرة', 30.0444, 31.2357, 'Africa/Cairo']
  ];
})();
