// ===== إرسال القصة إلى الإيميل =====
// حطي هون رابط خدمة الإيميل (مثلاً Formspree) أو رابط الباك إند تبعك.
// إذا تُرك فاضي: الصفحة بتشتغل بوضع التجربة ولا ترسل شي.
var ENDPOINT = ""; // مثال: "https://formspree.io/f/xxxxxxx"

var f = document.getElementById("f");
var err = document.getElementById("err");
var btn = document.getElementById("send");
var story = document.getElementById("story");

// عدّاد الأحرف
story.addEventListener("input", function () {
  document.getElementById("n").textContent = story.value.length;
});

// إزالة الإطار الأحمر أول ما المستخدم يكتب
f.addEventListener("input", function (e) { e.target.classList.remove("bad"); });

function fail(el, msg) {
  err.textContent = msg;
  if (el.type !== "checkbox") el.classList.add("bad");
  el.focus();
}

f.addEventListener("submit", function (e) {
  e.preventDefault();
  err.textContent = "";

  var fields = f.querySelectorAll("input[type=text],input[type=tel],input[type=url],textarea");
  for (var i = 0; i < fields.length; i++) {
    if (!fields[i].value.trim()) { fail(fields[i], "عبّي كل الحقول لو سمحت."); return; }
  }
  if (!f.social.checkValidity()) { fail(f.social, "الرابط لازم يبدأ بـ https://"); return; }
  if (!f.consent.checked) { fail(f.consent, "لازم توافق على النشر والتواصل حتى نقدر نستلم قصتك."); return; }

  var data = Object.fromEntries(new FormData(f).entries());
  data.consent = true;
  btn.disabled = true;

  function done() {
    f.style.display = "none";
    var ok = document.getElementById("ok");
    ok.classList.add("show");
    ok.scrollIntoView();
  }

  if (!ENDPOINT) { done(); return; } // وضع التجربة

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(data)
  })
    .then(function (r) { if (!r.ok) throw 0; done(); })
    .catch(function () {
      btn.disabled = false;
      err.textContent = "ما انرسلت القصة. جرّب مرة تانية بعد شوي.";
    });
});

// ===== زر "شارك قصة النجاح": بيطلّع الفورم المخفي وينزّل الصفحة لعندو =====
var share = document.getElementById("share");
document.getElementById("open").addEventListener("click", function () {
  share.hidden = false; // إظهار الفورم
  document.getElementById("foot").hidden = false; // وإظهار الفوتر معو
  share.scrollIntoView({ behavior: "smooth" });
  setTimeout(function () { document.getElementById("name").focus({ preventScroll: true }); }, 600);
});