(function () {
  const Element_lang = {
    "en-us": "en",
    "zh-cn": "zhCN",
    "zh-hk": "zhTW",
  };
  const cfg = window.__LANG_CONFIG__ || {};
  const jwt = localStorage.getItem("jwt");
  const validLangs = ["en-us", "zh-cn", "zh-hk"];
  const normalize = (lang) => (validLangs.includes(lang) ? lang : "zh-cn");

  let DEFAULT_LANG;
  if (jwt) {
    DEFAULT_LANG = normalize(localStorage.getItem("lang") || cfg.lang_home || "zh-cn");
  } else if (Number(cfg.lang_home_follow_browser) === 1) {
    DEFAULT_LANG = getBrowserLanguage();
  } else if (Number(cfg.lang_home_open) === 1 && localStorage.getItem("lang")) {
    DEFAULT_LANG = normalize(localStorage.getItem("lang"));
  } else {
    DEFAULT_LANG = normalize(cfg.lang_home || "zh-cn");
  }

  if (!jwt) {
    localStorage.setItem("lang", DEFAULT_LANG);
  }

  document.writeln(
    `<script src="${url}lang/${DEFAULT_LANG}/element-lang.js"><\/script>`
  );
  document.writeln(
    `<script src="${url}lang/${DEFAULT_LANG}/index.js?v=${system_version}"><\/script>`
  );
  document.writeln(
    `<script>ELEMENT.locale(ELEMENT.lang.${Element_lang[DEFAULT_LANG]})<\/script>`
  );
})();
