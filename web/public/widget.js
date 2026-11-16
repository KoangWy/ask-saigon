/* Ask Saigon chat box for partner websites.
   <script src="https://ask-saigon.vercel.app/widget.js" data-partner="tour-cua-ban" data-name="Tour Của Bạn" data-lang="vi" async></script>
   Optional: data-color (button colour), data-open="true" (start open). */
(function () {
  var script = document.currentScript;
  if (!script || window.__askSaigonWidget) return;
  window.__askSaigonWidget = true;
  var base = new URL(script.src).origin;
  var d = script.dataset;
  var lang = d.lang === 'en' ? 'en' : 'vi';
  var color = /^#[0-9a-f]{3,8}$/i.test(d.color || '') ? d.color : '#123f32';
  var src = base + '/embed?' + new URLSearchParams({ partner: d.partner || '', name: d.name || '', lang: lang }).toString();
  var label = lang === 'vi' ? 'Hỏi trợ lý về Sài Gòn' : 'Ask about Saigon';

  var frame = document.createElement('iframe');
  frame.title = d.name ? (lang === 'vi' ? 'Trợ lý ' : 'Assistant ') + d.name : 'Ask Saigon';
  frame.src = src;
  frame.loading = 'lazy';
  frame.allow = 'geolocation';
  frame.style.cssText = 'position:fixed;z-index:2147483646;right:20px;bottom:92px;width:min(400px,calc(100vw - 24px));height:min(640px,calc(100vh - 120px));border:0;border-radius:18px;box-shadow:0 18px 50px rgba(13,42,34,.35);background:#f8f6ec;display:none;';

  var button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-expanded', 'false');
  button.style.cssText = 'position:fixed;z-index:2147483647;right:20px;bottom:20px;height:56px;padding:0 20px 0 16px;border:0;border-radius:999px;background:' + color + ';color:#f8f6ec;font:600 15px/1 system-ui,sans-serif;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(13,42,34,.35);cursor:pointer;';
  button.innerHTML = '<svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24Zm0 192a87.87 87.87 0 0 1-44.06-11.81 8 8 0 0 0-6.54-.67L40 216l12.47-37.4a8 8 0 0 0-.66-6.54A88 88 0 1 1 128 216Z"/></svg><span></span>';
  button.querySelector('span').textContent = label;

  function toggle(open) {
    frame.style.display = open ? 'block' : 'none';
    button.setAttribute('aria-expanded', String(open));
  }
  button.addEventListener('click', function () { toggle(frame.style.display === 'none'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  document.body.appendChild(frame);
  document.body.appendChild(button);
  if (d.open === 'true') toggle(true);
})();
