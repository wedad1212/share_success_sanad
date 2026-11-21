// ===== إرسال القصة إلى الإيميل =====
// حطي هون رابط خدمة الإيميل (مثلاً Formspree) أو رابط الباك إند تبعك.
// إذا تُرك فاضي: الصفحة بشتغل بوضع التجربة ولا ترسل شي.
var ENDPOINT = "https://script.google.com/macros/s/AKfycbwiDsAQT9HTvTvIwYs3_UN6FOESVPyX6Uas0VXCF75GUcOD4SoGSyRADX--xSwfxqAZ-Q/exec";

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
  
  var data = Object.fromEntries(new FormData(f).entries());
  btn.disabled = true;

  function done() {
    f.style.display = "none";
    var ok = document.getElementById("ok");
    ok.classList.add("show");
    ok.scrollIntoView();
  }

  if (!ENDPOINT) { done(); return; } // وضع التجربة
  fetch(ENDPOINT, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); })
    .then(function (res) { if (!res.success) throw 0; done(); })
    .catch(function () {
      btn.disabled = false;
      err.textContent = "ما انرسلت القصة. جرّبي مرة تانية بعد شوي.";
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