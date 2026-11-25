

var COOLDOWN_MS = 60000; // لازم يمر دقيقة بين قصة وقصة من نفس الجهاز

// التحقق من الحقول
var PHONE_RE = /^(?:\+963|00963|0)?9\d{8}$/;                      
var NAME_RE  = /^[\p{L}\p{M}]{2,}(?: [\p{L}\p{M}]{2,}){2,5}$/u;    // اسم من 3 كلمات وحروف فقط
var CITY_RE  = /^[\p{L}\p{M}]{2,}(?: [\p{L}\p{M}]{2,}){0,2}$/u;    // اسم مدينة حروف فقط
var SOCIAL_HOSTS = ["facebook.com", "fb.com", "fb.me", "instagram.com", "linkedin.com", "lnkd.in"];

function cleanLetters(v) { 
  return v.replace(/[^\p{L}\p{M}\s]/gu, "").replace(/\s{2,}/g, " ").replace(/^\s/, "");
}
function cleanPhone(v) { 
  v = v.replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 1632; });
  return v.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 14);
}
function cleanText(v) { return v.replace(/\s{2,}/g, " ").replace(/^\s/, ""); }
function cleanLink(v) { return v.replace(/\s/g, ""); }

// بيضيف https:// إذا نسي المستخدم يكتبها
function normalizeLink(v) {
  v = v.trim();
  return /^https?:\/\//i.test(v) ? v : "https://" + v;
}
// رابط حساب فعلي على فيسبوك أو انستغرام أو لينكد ان 
function validSocial(v) {
  try {
    var u = new URL(normalizeLink(v));
    var host = u.hostname.toLowerCase().replace(/^(www|m|web|mobile)\./, "");
    var ok = SOCIAL_HOSTS.some(function (s) { return host === s || host.endsWith("." + s); });
    return ok && u.pathname.length > 1;
  } catch (e) { return false; }
}


var RULES = {
  name:    { max: 60,  clean: cleanLetters, test: function (v) { return NAME_RE.test(v); },
             msg: "اكتب اسمك الثلاثي (الاسم والأب والكنية) بالحروف فقط، بدون أرقام أو رموز." },
  phone:   { max: 14,  clean: cleanPhone,   test: function (v) { return PHONE_RE.test(v); },
             msg: "اكتب رقم موبايل سوري صحيح" },
  city:    { max: 30,  clean: cleanLetters, test: function (v) { return CITY_RE.test(v); },
             msg: "اكتب اسم المدينة بالحروف فقط بدون أرقام أو رموز." },
  social:  { max: 200, clean: cleanLink,    test: validSocial,
             msg: "اكتب رابط حسابك الفعلي على فيسبوك أو انستغرام أو لينكد ان." },
  project: { max: 80,  clean: cleanText,    test: function (v) { return v.length >= 2; },
             msg: "اكتب اسم المشروع (حرفين على الأقل)." },
  story:   { max: 1500, clean: null,        test: function (v) { return v.length >= 20; },
             msg: "اكتب قصتك بشكل أوضح (20 حرف على الأقل)." }
};

var f = document.getElementById("f");
var err = document.getElementById("err");
var btn = document.getElementById("send");
var sendText = btn.textContent; 
var openedAt = Date.now(); 

//  رسالة الخطأ تحت كل حقل 
function showError(el, msg) {
  clearError(el);
  var p = document.createElement("p");
  p.className = "field-err";
  p.textContent = msg;
  p.style.cssText = "color:#d4204a;font-size:.85rem;font-weight:600;margin:6px 0 0";
  (el.closest(".in") || el).insertAdjacentElement("afterend", p);
  el.classList.add("bad");
}
function clearError(el) {
  el.classList.remove("bad");
  var n = (el.closest(".in") || el).nextElementSibling;
  if (n && n.classList.contains("field-err")) n.remove();
}

//  ربط القواعد بالحقول 
Object.keys(RULES).forEach(function (id) {
  var el = document.getElementById(id), r = RULES[id];
  el.maxLength = r.max;

  el.addEventListener("input", function () {
    if (r.clean) { var c = r.clean(el.value); if (c !== el.value) el.value = c; }
    clearError(el);
  });
  el.addEventListener("blur", function () {
    var v = el.value.trim();
    if (v && !r.test(v)) showError(el, r.msg);
  });
});

// عداد الأحرف
document.getElementById("story").addEventListener("input", function (e) {
  document.getElementById("n").textContent = e.target.value.length;
});

function setSending(on) {
  btn.disabled = on;
  btn.classList.toggle("loading", on);
  btn.textContent = on ? "عم نرسل قصتك..." : sendText;
  f.classList.toggle("sending", on);
}

// حفظ وقت آخر إرسال بالجهاز
function lastSent() { try { return Number(localStorage.getItem("sanadLastSent")) || 0; } catch (e) { return 0; } }
function markSent() { try { localStorage.setItem("sanadLastSent", Date.now()); } catch (e) {} }

f.addEventListener("submit", function (e) {
  e.preventDefault();
  err.textContent = "";

  // التحقق من كل الحقول: بنوقف عند أول حقل غلط
  var firstBad = null;
  Object.keys(RULES).forEach(function (id) {
    var el = document.getElementById(id), v = el.value.trim();
    if (!v) { showError(el, "هالحقل مطلوب."); firstBad = firstBad || el; }
    else if (!RULES[id].test(v)) { showError(el, RULES[id].msg); firstBad = firstBad || el; }
  });
  if (firstBad) {
    err.textContent = "في حقول لازم تتصحح قبل الإرسال.";
    firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    firstBad.focus({ preventScroll: true });
    return;
  }

  // منع الإرسال المتكرر من نفس الجهاز
  if (Date.now() - lastSent() < COOLDOWN_MS) {
    err.textContent = "وصلتنا قصتك قبل شوي. استنى دقيقة قبل ما ترسل غيرها.";
    return;
  }

  var data = Object.fromEntries(new FormData(f).entries());
  data.name = data.name.trim();
  data.social = normalizeLink(data.social);
  data.took = Date.now() - openedAt;
  setSending(true);

  function done() {
    // بعد الإرسال بنخفي كل شي وبنظهر شاشة الشكر بس
    document.querySelector(".top").style.display = "none";
    document.getElementById("share").style.display = "none";
    document.getElementById("foot").style.display = "none";
    document.getElementById("thanks").hidden = false;
    window.scrollTo(0, 0);
  }

  var url = window.ENDPOINT || "";
  if (!url) { done(); return; } // وضع التجربة

  fetch(url, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) { markSent(); done(); return; }
      setSending(false);
      err.textContent = res.limited ? "وصلت للحد الأقصى من المشاركات اليوم. جرب بكرا."
        : res.invalid ? "في معلومة مو صحيحة. راجع الحقول وجرب مرة تانية."
        : "ما انرسلت القصة. جرب مرة تانية بعد شوي.";
    })
    .catch(function () {
      setSending(false);
      err.textContent = "ما انرسلت القصة. جرب مرة تانية بعد شوي.";
    });
});

//  زر "شارك قصة النجاح" بيطلع الفورم المخفي وينزل الصفحة لعندو 
var share = document.getElementById("share");
document.getElementById("open").addEventListener("click", function () {
  share.hidden = false; // إظهار الفورم
  document.getElementById("foot").hidden = false; // وإظهار الفوتر معو
  openedAt = Date.now();
  share.scrollIntoView({ behavior: "smooth" });
  setTimeout(function () { document.getElementById("name").focus({ preventScroll: true }); }, 600);
});