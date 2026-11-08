"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// node_modules/mdurl/build/index.cjs.js
var require_index_cjs = __commonJS({
  "node_modules/mdurl/build/index.cjs.js"(exports2) {
    "use strict";
    var decodeCache = {};
    function getDecodeCache(exclude) {
      let cache = decodeCache[exclude];
      if (cache) {
        return cache;
      }
      cache = decodeCache[exclude] = [];
      for (let i = 0; i < 128; i++) {
        const ch = String.fromCharCode(i);
        cache.push(ch);
      }
      for (let i = 0; i < exclude.length; i++) {
        const ch = exclude.charCodeAt(i);
        cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
      }
      return cache;
    }
    function decode(string, exclude) {
      if (typeof exclude !== "string") {
        exclude = decode.defaultChars;
      }
      const cache = getDecodeCache(exclude);
      return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
        let result = "";
        for (let i = 0, l = seq.length; i < l; i += 3) {
          const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
          if (b1 < 128) {
            result += cache[b1];
            continue;
          }
          if ((b1 & 224) === 192 && i + 3 < l) {
            const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
            if ((b2 & 192) === 128) {
              const chr = b1 << 6 & 1984 | b2 & 63;
              if (chr < 128) {
                result += "\uFFFD\uFFFD";
              } else {
                result += String.fromCharCode(chr);
              }
              i += 3;
              continue;
            }
          }
          if ((b1 & 240) === 224 && i + 6 < l) {
            const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
            const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
            if ((b2 & 192) === 128 && (b3 & 192) === 128) {
              const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
              if (chr < 2048 || chr >= 55296 && chr <= 57343) {
                result += "\uFFFD\uFFFD\uFFFD";
              } else {
                result += String.fromCharCode(chr);
              }
              i += 6;
              continue;
            }
          }
          if ((b1 & 248) === 240 && i + 9 < l) {
            const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
            const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
            const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
            if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
              let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
              if (chr < 65536 || chr > 1114111) {
                result += "\uFFFD\uFFFD\uFFFD\uFFFD";
              } else {
                chr -= 65536;
                result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
              }
              i += 9;
              continue;
            }
          }
          result += "\uFFFD";
        }
        return result;
      });
    }
    decode.defaultChars = ";/?:@&=+$,#";
    decode.componentChars = "";
    var encodeCache = {};
    function getEncodeCache(exclude) {
      let cache = encodeCache[exclude];
      if (cache) {
        return cache;
      }
      cache = encodeCache[exclude] = [];
      for (let i = 0; i < 128; i++) {
        const ch = String.fromCharCode(i);
        if (/^[0-9a-z]$/i.test(ch)) {
          cache.push(ch);
        } else {
          cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
        }
      }
      for (let i = 0; i < exclude.length; i++) {
        cache[exclude.charCodeAt(i)] = exclude[i];
      }
      return cache;
    }
    function encode(string, exclude, keepEscaped) {
      if (typeof exclude !== "string") {
        keepEscaped = exclude;
        exclude = encode.defaultChars;
      }
      if (typeof keepEscaped === "undefined") {
        keepEscaped = true;
      }
      const cache = getEncodeCache(exclude);
      let result = "";
      for (let i = 0, l = string.length; i < l; i++) {
        const code = string.charCodeAt(i);
        if (keepEscaped && code === 37 && i + 2 < l) {
          if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
            result += string.slice(i, i + 3);
            i += 2;
            continue;
          }
        }
        if (code < 128) {
          result += cache[code];
          continue;
        }
        if (code >= 55296 && code <= 57343) {
          if (code >= 55296 && code <= 56319 && i + 1 < l) {
            const nextCode = string.charCodeAt(i + 1);
            if (nextCode >= 56320 && nextCode <= 57343) {
              result += encodeURIComponent(string[i] + string[i + 1]);
              i++;
              continue;
            }
          }
          result += "%EF%BF%BD";
          continue;
        }
        result += encodeURIComponent(string[i]);
      }
      return result;
    }
    encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
    encode.componentChars = "-_.!~*'()";
    function format(url) {
      let result = "";
      result += url.protocol || "";
      result += url.slashes ? "//" : "";
      result += url.auth ? url.auth + "@" : "";
      if (url.hostname && url.hostname.indexOf(":") !== -1) {
        result += "[" + url.hostname + "]";
      } else {
        result += url.hostname || "";
      }
      result += url.port ? ":" + url.port : "";
      result += url.pathname || "";
      result += url.search || "";
      result += url.hash || "";
      return result;
    }
    function Url() {
      this.protocol = null;
      this.slashes = null;
      this.auth = null;
      this.port = null;
      this.hostname = null;
      this.hash = null;
      this.search = null;
      this.pathname = null;
    }
    var protocolPattern = /^([a-z0-9.+-]+:)/i;
    var portPattern = /:[0-9]*$/;
    var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
    var delims = ["<", ">", '"', "`", " ", "\r", "\n", "	"];
    var unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);
    var autoEscape = ["'"].concat(unwise);
    var nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
    var hostEndingChars = ["/", "?", "#"];
    var hostnameMaxLen = 255;
    var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
    var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
    var hostlessProtocol = {
      javascript: true,
      "javascript:": true
    };
    var slashedProtocol = {
      http: true,
      https: true,
      ftp: true,
      gopher: true,
      file: true,
      "http:": true,
      "https:": true,
      "ftp:": true,
      "gopher:": true,
      "file:": true
    };
    function urlParse(url, slashesDenoteHost) {
      if (url && url instanceof Url) return url;
      const u = new Url();
      u.parse(url, slashesDenoteHost);
      return u;
    }
    Url.prototype.parse = function(url, slashesDenoteHost) {
      let lowerProto, hec, slashes;
      let rest = url;
      rest = rest.trim();
      if (!slashesDenoteHost && url.split("#").length === 1) {
        const simplePath = simplePathPattern.exec(rest);
        if (simplePath) {
          this.pathname = simplePath[1];
          if (simplePath[2]) {
            this.search = simplePath[2];
          }
          return this;
        }
      }
      let proto = protocolPattern.exec(rest);
      if (proto) {
        proto = proto[0];
        lowerProto = proto.toLowerCase();
        this.protocol = proto;
        rest = rest.substr(proto.length);
      }
      if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        slashes = rest.substr(0, 2) === "//";
        if (slashes && !(proto && hostlessProtocol[proto])) {
          rest = rest.substr(2);
          this.slashes = true;
        }
      }
      if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
        let hostEnd = -1;
        for (let i = 0; i < hostEndingChars.length; i++) {
          hec = rest.indexOf(hostEndingChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
            hostEnd = hec;
          }
        }
        let auth, atSign;
        if (hostEnd === -1) {
          atSign = rest.lastIndexOf("@");
        } else {
          atSign = rest.lastIndexOf("@", hostEnd);
        }
        if (atSign !== -1) {
          auth = rest.slice(0, atSign);
          rest = rest.slice(atSign + 1);
          this.auth = auth;
        }
        hostEnd = -1;
        for (let i = 0; i < nonHostChars.length; i++) {
          hec = rest.indexOf(nonHostChars[i]);
          if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
            hostEnd = hec;
          }
        }
        if (hostEnd === -1) {
          hostEnd = rest.length;
        }
        if (rest[hostEnd - 1] === ":") {
          hostEnd--;
        }
        const host = rest.slice(0, hostEnd);
        rest = rest.slice(hostEnd);
        this.parseHost(host);
        this.hostname = this.hostname || "";
        const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
        if (!ipv6Hostname) {
          const hostparts = this.hostname.split(/\./);
          for (let i = 0, l = hostparts.length; i < l; i++) {
            const part = hostparts[i];
            if (!part) {
              continue;
            }
            if (!part.match(hostnamePartPattern)) {
              let newpart = "";
              for (let j = 0, k = part.length; j < k; j++) {
                if (part.charCodeAt(j) > 127) {
                  newpart += "x";
                } else {
                  newpart += part[j];
                }
              }
              if (!newpart.match(hostnamePartPattern)) {
                const validParts = hostparts.slice(0, i);
                const notHost = hostparts.slice(i + 1);
                const bit = part.match(hostnamePartStart);
                if (bit) {
                  validParts.push(bit[1]);
                  notHost.unshift(bit[2]);
                }
                if (notHost.length) {
                  rest = notHost.join(".") + rest;
                }
                this.hostname = validParts.join(".");
                break;
              }
            }
          }
        }
        if (this.hostname.length > hostnameMaxLen) {
          this.hostname = "";
        }
        if (ipv6Hostname) {
          this.hostname = this.hostname.substr(1, this.hostname.length - 2);
        }
      }
      const hash = rest.indexOf("#");
      if (hash !== -1) {
        this.hash = rest.substr(hash);
        rest = rest.slice(0, hash);
      }
      const qm = rest.indexOf("?");
      if (qm !== -1) {
        this.search = rest.substr(qm);
        rest = rest.slice(0, qm);
      }
      if (rest) {
        this.pathname = rest;
      }
      if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
        this.pathname = "";
      }
      return this;
    };
    Url.prototype.parseHost = function(host) {
      let port = portPattern.exec(host);
      if (port) {
        port = port[0];
        if (port !== ":") {
          this.port = port.substr(1);
        }
        host = host.substr(0, host.length - port.length);
      }
      if (host) {
        this.hostname = host;
      }
    };
    exports2.decode = decode;
    exports2.encode = encode;
    exports2.format = format;
    exports2.parse = urlParse;
  }
});

// node_modules/uc.micro/build/index.cjs.js
var require_index_cjs2 = __commonJS({
  "node_modules/uc.micro/build/index.cjs.js"(exports2) {
    "use strict";
    var Any = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var Cc = /[\0-\x1F\x7F-\x9F]/;
    var Cf = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
    var P = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/;
    var S = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/;
    var Z = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
    exports2.Any = Any;
    exports2.Cc = Cc;
    exports2.Cf = Cf;
    exports2.P = P;
    exports2.S = S;
    exports2.Z = Z;
  }
});

// node_modules/linkify-it/build/index.cjs.js
var require_index_cjs3 = __commonJS({
  "node_modules/linkify-it/build/index.cjs.js"(exports2) {
    Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
    var uc_micro = require_index_cjs2();
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function toPropertyKey(t) {
      var i = toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    function _defineProperty(e, r, t) {
      return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r] = t, e;
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          _defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    var REBuilder = class {
      constructor(opts = {}) {
        _defineProperty(this, "src_Any", uc_micro.Any.source);
        _defineProperty(this, "src_Cc", uc_micro.Cc.source);
        _defineProperty(this, "src_Z", uc_micro.Z.source);
        _defineProperty(this, "src_P", uc_micro.P.source);
        _defineProperty(this, "src_ZPCc", [
          this.src_Z,
          this.src_P,
          this.src_Cc
        ].join("|"));
        _defineProperty(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|"));
        _defineProperty(this, "cache", {});
        _defineProperty(this, "opts", {
          maxLength: 1e4,
          urlAuth: false,
          schema_names: []
        });
        this.opts = _objectSpread2(_objectSpread2({}, this.opts), opts);
      }
      set(opts = {}) {
        this.opts = _objectSpread2(_objectSpread2({}, this.opts), opts);
        this.cache = {};
        return this;
      }
      escapeRE(str) {
        return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
      }
      nestedPairRE(open, close, depth = 4) {
        const openRE = this.escapeRE(open);
        const closeRE = this.escapeRE(close);
        const atom = `(?:(?!${this.src_ZCc}|${openRE}|${closeRE}).)`;
        let pair = `${openRE}${atom}{0,1000}${closeRE}`;
        for (let level = 2; level <= depth; level++) pair = `${openRE}(?:${atom}|${pair}){0,1000}${closeRE}`;
        return pair;
      }
      get_text_separators() {
        var _this$cache, _this$cache$text_sepa;
        return (_this$cache$text_sepa = (_this$cache = this.cache).text_separators) !== null && _this$cache$text_sepa !== void 0 ? _this$cache$text_sepa : _this$cache.text_separators = /[><\uff5c]/;
      }
      get_pseudo_letter() {
        var _this$cache2, _this$cache2$src_pseu;
        return (_this$cache2$src_pseu = (_this$cache2 = this.cache).src_pseudo_letter) !== null && _this$cache2$src_pseu !== void 0 ? _this$cache2$src_pseu : _this$cache2.src_pseudo_letter = new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`);
      }
      get_ipv4_addr() {
        var _this$cache3, _this$cache3$src_ip;
        return (_this$cache3$src_ip = (_this$cache3 = this.cache).src_ip4) !== null && _this$cache3$src_ip !== void 0 ? _this$cache3$src_ip : _this$cache3.src_ip4 = /* @__PURE__ */ new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])");
      }
      get_ipv6_addr() {
        var _this$cache4, _this$cache4$src_ip6_;
        const h16 = "[0-9A-Fa-f]{1,4}";
        const ls32 = `(?:(?:${h16}:${h16})|${this.get_ipv4_addr().source})`;
        return (_this$cache4$src_ip6_ = (_this$cache4 = this.cache).src_ip6_addr) !== null && _this$cache4$src_ip6_ !== void 0 ? _this$cache4$src_ip6_ : _this$cache4.src_ip6_addr = new RegExp(`(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::${h16}:${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`);
      }
      get_ipv6_url_host() {
        var _this$cache5, _this$cache5$src_ip6_;
        return (_this$cache5$src_ip6_ = (_this$cache5 = this.cache).src_ip6_host) !== null && _this$cache5$src_ip6_ !== void 0 ? _this$cache5$src_ip6_ : _this$cache5.src_ip6_host = new RegExp(`\\[${this.get_ipv6_addr().source}\\]`);
      }
      get_ipv6_mail_host() {
        var _this$cache6, _this$cache6$src_ipv;
        return (_this$cache6$src_ipv = (_this$cache6 = this.cache).src_ipv6_mail_host) !== null && _this$cache6$src_ipv !== void 0 ? _this$cache6$src_ipv : _this$cache6.src_ipv6_mail_host = new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`);
      }
      get_auth() {
        var _this$cache7, _this$cache7$src_auth;
        return (_this$cache7$src_auth = (_this$cache7 = this.cache).src_auth) !== null && _this$cache7$src_auth !== void 0 ? _this$cache7$src_auth : _this$cache7.src_auth = new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`);
      }
      get_port() {
        var _this$cache8, _this$cache8$src_port;
        return (_this$cache8$src_port = (_this$cache8 = this.cache).src_port) !== null && _this$cache8$src_port !== void 0 ? _this$cache8$src_port : _this$cache8.src_port = /* @__PURE__ */ new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?");
      }
      get_host_terminator() {
        var _this$cache9, _this$cache9$src_host;
        return (_this$cache9$src_host = (_this$cache9 = this.cache).src_host_terminator) !== null && _this$cache9$src_host !== void 0 ? _this$cache9$src_host : _this$cache9.src_host_terminator = new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`);
      }
      get_path_terminator() {
        var _this$cache10, _this$cache10$src_pat;
        return (_this$cache10$src_pat = (_this$cache10 = this.cache).src_path_terminator) !== null && _this$cache10$src_pat !== void 0 ? _this$cache10$src_pat : _this$cache10.src_path_terminator = new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`);
      }
      get_path() {
        var _this$cache11, _this$cache11$src_pat;
        return (_this$cache11$src_pat = (_this$cache11 = this.cache).src_path) !== null && _this$cache11$src_pat !== void 0 ? _this$cache11$src_pat : _this$cache11.src_path = new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`);
      }
      get_mail_name() {
        var _this$cache12, _this$cache12$src_mai;
        return (_this$cache12$src_mai = (_this$cache12 = this.cache).src_mail_name) !== null && _this$cache12$src_mai !== void 0 ? _this$cache12$src_mai : _this$cache12.src_mail_name = /* @__PURE__ */ new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}");
      }
      get_xn() {
        var _this$cache13, _this$cache13$src_xn;
        return (_this$cache13$src_xn = (_this$cache13 = this.cache).src_xn) !== null && _this$cache13$src_xn !== void 0 ? _this$cache13$src_xn : _this$cache13.src_xn = /* @__PURE__ */ new RegExp("xn--[a-z0-9\\-]{1,59}");
      }
      get_tld() {
        if (this.cache.tld) return this.cache.tld;
        const tlds_src = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
        this.cache.tld = new RegExp(`${tlds_src || "$#none#$"}|${this.get_xn().source}`);
        return this.cache.tld;
      }
      get_domain_root() {
        var _this$cache14, _this$cache14$src_dom;
        return (_this$cache14$src_dom = (_this$cache14 = this.cache).src_domain_root) !== null && _this$cache14$src_dom !== void 0 ? _this$cache14$src_dom : _this$cache14.src_domain_root = new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`);
      }
      get_domain() {
        var _this$cache15, _this$cache15$src_dom;
        return (_this$cache15$src_dom = (_this$cache15 = this.cache).src_domain) !== null && _this$cache15$src_dom !== void 0 ? _this$cache15$src_dom : _this$cache15.src_domain = new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`);
      }
      get_url_host_port() {
        var _this$cache16, _this$cache16$url_hos;
        return (_this$cache16$url_hos = (_this$cache16 = this.cache).url_host_port) !== null && _this$cache16$url_hos !== void 0 ? _this$cache16$url_hos : _this$cache16.url_host_port = new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source);
      }
      get_fuzzy_url_host_port() {
        var _this$cache17, _this$cache17$fuzzy_u;
        return (_this$cache17$fuzzy_u = (_this$cache17 = this.cache).fuzzy_url_host_port) !== null && _this$cache17$fuzzy_u !== void 0 ? _this$cache17$fuzzy_u : _this$cache17.fuzzy_url_host_port = new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source);
      }
      get_mail_host() {
        var _this$cache18, _this$cache18$src_mai;
        return (_this$cache18$src_mai = (_this$cache18 = this.cache).src_mail_host) !== null && _this$cache18$src_mai !== void 0 ? _this$cache18$src_mai : _this$cache18.src_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source);
      }
      get_fuzzy_mail_host() {
        var _this$cache19, _this$cache19$src_fuz;
        return (_this$cache19$src_fuz = (_this$cache19 = this.cache).src_fuzzy_mail_host) !== null && _this$cache19$src_fuz !== void 0 ? _this$cache19$src_fuz : _this$cache19.src_fuzzy_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source);
      }
      get_path_extra() {
        var _this$cache20, _this$cache20$src_pat;
        return (_this$cache20$src_pat = (_this$cache20 = this.cache).src_path_extra) !== null && _this$cache20$src_pat !== void 0 ? _this$cache20$src_pat : _this$cache20.src_path_extra = /* @__PURE__ */ new RegExp("");
      }
      get_fuzzy_mail_host_search() {
        var _this$cache21, _this$cache21$mail_fu;
        return (_this$cache21$mail_fu = (_this$cache21 = this.cache).mail_fuzzy_host_search) !== null && _this$cache21$mail_fu !== void 0 ? _this$cache21$mail_fu : _this$cache21.mail_fuzzy_host_search = new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig");
      }
      get_fuzzy_link_search() {
        var _this$cache22, _this$cache22$link_fu;
        return (_this$cache22$link_fu = (_this$cache22 = this.cache).link_fuzzy_search) !== null && _this$cache22$link_fu !== void 0 ? _this$cache22$link_fu : _this$cache22.link_fuzzy_search = new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uFF5C])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig");
      }
      get_http_validator() {
        var _this$cache23, _this$cache23$http_va;
        return (_this$cache23$http_va = (_this$cache23 = this.cache).http_validator) !== null && _this$cache23$http_va !== void 0 ? _this$cache23$http_va : _this$cache23.http_validator = new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy");
      }
      get_relative_proto_validator() {
        var _this$cache24, _this$cache24$relativ;
        return (_this$cache24$relativ = (_this$cache24 = this.cache).relative_proto_validator) !== null && _this$cache24$relativ !== void 0 ? _this$cache24$relativ : _this$cache24.relative_proto_validator = new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy");
      }
      get_mail_name_validator() {
        var _this$cache25, _this$cache25$mail_na;
        return (_this$cache25$mail_na = (_this$cache25 = this.cache).mail_name_validator) !== null && _this$cache25$mail_na !== void 0 ? _this$cache25$mail_na : _this$cache25.mail_name_validator = new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`);
      }
      get_mailto_validator() {
        var _this$cache26, _this$cache26$mailto_;
        return (_this$cache26$mailto_ = (_this$cache26 = this.cache).mailto_validator) !== null && _this$cache26$mailto_ !== void 0 ? _this$cache26$mailto_ : _this$cache26.mailto_validator = new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy");
      }
      get_schema_names() {
        var _this$cache27, _this$cache27$schema_;
        return (_this$cache27$schema_ = (_this$cache27 = this.cache).schema_names) !== null && _this$cache27$schema_ !== void 0 ? _this$cache27$schema_ : _this$cache27.schema_names = new RegExp((this.opts.schema_names || []).map((name) => this.escapeRE(name)).join("|"));
      }
      get_schema_search() {
        var _this$cache28, _this$cache28$schema_;
        return (_this$cache28$schema_ = (_this$cache28 = this.cache).schema_search) !== null && _this$cache28$schema_ !== void 0 ? _this$cache28$schema_ : _this$cache28.schema_search = new RegExp(`(^|(?!_)(?:[><\uFF5C]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig");
      }
      get_schema_at_start() {
        var _this$cache29, _this$cache29$schema_;
        return (_this$cache29$schema_ = (_this$cache29 = this.cache).schema_at_start) !== null && _this$cache29$schema_ !== void 0 ? _this$cache29$schema_ : _this$cache29.schema_at_start = new RegExp(`^${this.get_schema_search().source}`, "i");
      }
    };
    function _objectWithoutPropertiesLoose(r, e) {
      if (null == r) return {};
      var t = {};
      for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
        if (e.includes(n)) continue;
        t[n] = r[n];
      }
      return t;
    }
    function _objectWithoutProperties(e, t) {
      if (null == e) return {};
      var o, r, i = _objectWithoutPropertiesLoose(e, t);
      if (Object.getOwnPropertySymbols) {
        var s = Object.getOwnPropertySymbols(e);
        for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
      }
      return i;
    }
    var _excluded = ["rebuilder"];
    var web_schema = {
      validate: (text, pos, self) => {
        const re = self.re.get_http_validator();
        re.lastIndex = pos;
        const m = re.exec(text);
        return m ? m[0].length : 0;
      },
      normalize: (match, self) => self.normalize(match)
    };
    var defaultSchemas = {
      "http:": web_schema,
      "https:": web_schema,
      "ftp:": web_schema,
      "//": {
        validate: function(text, pos, self) {
          const re = self.re.get_relative_proto_validator();
          re.lastIndex = pos;
          const m = re.exec(text);
          if (m) {
            if (pos >= 3 && text[pos - 3] === ":") return 0;
            if (pos >= 3 && text[pos - 3] === "/") return 0;
            return m[0].length;
          }
          return 0;
        },
        normalize: (match, self) => self.normalize(match)
      },
      "mailto:": {
        validate: function(text, pos, self) {
          const re = self.re.get_mailto_validator();
          re.lastIndex = pos;
          const m = re.exec(text);
          return m ? m[0].length : 0;
        },
        normalize: (match, self) => self.normalize(match)
      }
    };
    var tlds_2ch = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw";
    var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444";
    function unpackTlds() {
      const result = tlds_default.split("|");
      tlds_2ch.split("|").forEach((item) => {
        const sep = item.indexOf(":");
        const prefix = item.slice(0, sep);
        for (const suffix of item.slice(sep + 1)) result.push(prefix + suffix);
      });
      return result;
    }
    var defaultOptions = {
      fuzzyLink: false,
      fuzzyEmail: true,
      fuzzyIP: false,
      "---": false,
      tlds: unpackTlds(),
      urlAuth: false,
      maxLength: 1e4
    };
    var Match = class {
      constructor(text, schema, index, lastIndex) {
        _defineProperty(
          this,
          /** Prefix (protocol) for matched string. Empty for fuzzy links. */
          "schema",
          void 0
        );
        _defineProperty(
          this,
          /** First position of matched string. */
          "index",
          void 0
        );
        _defineProperty(
          this,
          /** Next position after matched string. */
          "lastIndex",
          void 0
        );
        _defineProperty(
          this,
          /** Matched string. */
          "raw",
          void 0
        );
        _defineProperty(
          this,
          /** Normalized text of matched string. */
          "text",
          void 0
        );
        _defineProperty(
          this,
          /** Normalized URL of matched string. */
          "url",
          void 0
        );
        const raw = text.slice(index, lastIndex);
        this.schema = schema.toLowerCase();
        this.index = index;
        this.lastIndex = lastIndex;
        this.raw = raw;
        this.text = raw;
        this.url = raw;
      }
    };
    var LinkifyIt = class {
      /**
      * Creates new linkifier instance.
      *
      * By default understands:
      *
      * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
      * - "fuzzy" emails (foo@bar.com).
      *
      * See {@link LinkifyConstructorOptions} for available options.
      *
      * @param options Recognition options.
      *
      * @example
      * ```javascript
      * import { LinkifyIt } from 'linkify-it'
      *
      * const linkify = new LinkifyIt({ fuzzyLink: true })
      *
      * linkify
      *   .tlds(require('tlds'))       // Reload with full TLD list
      *   .tlds('onion', true)         // Add unofficial `.onion` domain
      *   .add('ftp:', null)           // Disable `ftp:` protocol
      *   .set({ fuzzyIP: true })      // Enable IPs in fuzzy links
      *
      * console.log(linkify.test('Site github.com!')) // true
      * console.log(linkify.match('Site github.com!'))
      * ```
      */
      constructor(options = {}) {
        _defineProperty(this, "__opts__", void 0);
        _defineProperty(this, "__schemas__", void 0);
        _defineProperty(this, "re", void 0);
        const { rebuilder } = options, linkifyOptions = _objectWithoutProperties(options, _excluded);
        this.__opts__ = _objectSpread2(_objectSpread2({}, defaultOptions), linkifyOptions);
        this.__schemas__ = _objectSpread2({}, defaultSchemas);
        this.re = rebuilder || new REBuilder();
        this.re.set(_objectSpread2(_objectSpread2({}, this.__opts__), {}, { schema_names: Object.keys(this.__schemas__) }));
      }
      /**
      * Add new rule definition.
      *
      * `schema` is a link prefix (usually, protocol name with `:` at the end,
      * `skype:` for example). `linkify-it` makes sure that prefix is not
      * preceded with alphanumeric char and symbols. Only whitespaces and
      * punctuation allowed.
      *
      * `definition` is a rule to check tail after link prefix. To disable an
      * existing rule, pass `null`.
      *
      * @param schema Rule name (fixed pattern prefix).
      * @param definition Schema definition, or `null` to disable the rule.
      *
      * See [twitter mentions example](https://github.com/markdown-it/linkify-it/blob/master/examples/twitter.mjs).
      */
      add(schema, definition = null) {
        if (!definition) delete this.__schemas__[schema];
        else {
          const def = _objectSpread2({ normalize: (match, self) => self.normalize(match) }, definition);
          this.__schemas__[schema] = def;
        }
        this.re.set(_objectSpread2(_objectSpread2({}, this.__opts__), {}, { schema_names: Object.keys(this.__schemas__) }));
        return this;
      }
      /**
      * Set recognition options for links without schema.
      *
      * @param options Recognition options.
      */
      set(options = {}) {
        this.__opts__ = _objectSpread2(_objectSpread2({}, this.__opts__), options);
        this.re.set(_objectSpread2(_objectSpread2({}, this.__opts__), {}, { schema_names: Object.keys(this.__schemas__) }));
        return this;
      }
      /**
      * Searches linkifiable pattern and returns `true` on success or `false` on fail.
      *
      * @param text Text to scan.
      */
      test(text) {
        if (!text.length) return false;
        let m, re;
        re = this.re.get_schema_search();
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) if (this.testSchemaAt(text, m[2], re.lastIndex)) return true;
        if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
          re = this.re.get_fuzzy_link_search();
          re.lastIndex = 0;
          if (re.exec(text) !== null) return true;
        }
        if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
          if (text.indexOf("@") >= 0) {
            const mailHostRe = this.re.get_fuzzy_mail_host_search();
            const mailNameRe = this.re.get_mail_name_validator();
            mailHostRe.lastIndex = 0;
            while ((m = mailHostRe.exec(text)) !== null) {
              const name = text.slice(Math.max(0, m.index - 65), m.index);
              if (mailNameRe.test(name)) return true;
            }
          }
        }
        return false;
      }
      /**
      * Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
      * at given position. Returns length of found pattern (0 on fail).
      *
      * @param text Text to scan.
      * @param schema Rule (schema) name.
      * @param pos Text offset to check from.
      */
      testSchemaAt(text, schema, pos) {
        if (!this.__schemas__[schema.toLowerCase()]) return 0;
        return this.__schemas__[schema.toLowerCase()].validate(text.slice(0, pos + this.__opts__.maxLength), pos, this);
      }
      /**
      * Returns array of found link descriptions or `null` on fail. We strongly
      * recommend to use {@link LinkifyIt.test} first, for best speed.
      *
      * @param text Text to scan.
      */
      match(text) {
        const result = [];
        const schemaRe = this.re.get_schema_search();
        let fuzzyLinkRe;
        let mailHostRe;
        let mailNameRe;
        let fuzzyLinkCandidate;
        let fuzzyEmailCandidate;
        let schemaPrefix;
        let schemaDone = false;
        let fuzzyLinkDone = false;
        let fuzzyEmailDone = false;
        let pos = 0;
        if (!text.length) return null;
        schemaRe.lastIndex = 0;
        if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
          fuzzyLinkRe = this.re.get_fuzzy_link_search();
          fuzzyLinkRe.lastIndex = 0;
        }
        if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
          mailHostRe = this.re.get_fuzzy_mail_host_search();
          mailHostRe.lastIndex = 0;
          mailNameRe = this.re.get_mail_name_validator();
        }
        for (; ; ) {
          const scanFrom = Math.max(pos - 1, 0);
          if (mailHostRe && mailNameRe && !fuzzyEmailDone && (!fuzzyEmailCandidate || fuzzyEmailCandidate.index < pos)) {
            if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
            for (; ; ) {
              const m = mailHostRe.exec(text);
              if (!m) {
                fuzzyEmailDone = true;
                fuzzyEmailCandidate = void 0;
                break;
              }
              const name = mailNameRe.exec(text.slice(Math.max(0, m.index - 65), m.index));
              if (!name) continue;
              fuzzyEmailCandidate = {
                schema: "mailto:",
                index: m.index - name[1].length,
                lastIndex: m.index + m[0].length
              };
              if (fuzzyEmailCandidate.index >= pos) break;
              if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
            }
          }
          if (fuzzyLinkRe && !fuzzyLinkDone && (!fuzzyLinkCandidate || fuzzyLinkCandidate.index < pos)) {
            if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
            for (; ; ) {
              const m = fuzzyLinkRe.exec(text);
              if (!m) {
                fuzzyLinkDone = true;
                fuzzyLinkCandidate = void 0;
                break;
              }
              fuzzyLinkCandidate = {
                schema: "",
                index: m.index + m[1].length,
                lastIndex: m.index + m[0].length
              };
              if (fuzzyLinkCandidate.index >= pos) break;
              if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
            }
          }
          let fuzzyCandidate = fuzzyEmailCandidate;
          if (!fuzzyCandidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < fuzzyCandidate.index || fuzzyLinkCandidate.index === fuzzyCandidate.index && fuzzyLinkCandidate.lastIndex > fuzzyCandidate.lastIndex)) fuzzyCandidate = fuzzyLinkCandidate;
          let schemaCandidate;
          if (!schemaDone) for (; ; ) {
            if (!schemaPrefix) {
              if (schemaRe.lastIndex < scanFrom) schemaRe.lastIndex = scanFrom;
              const m = schemaRe.exec(text);
              if (!m) {
                schemaDone = true;
                break;
              }
              schemaPrefix = {
                schema: m[2],
                index: m.index + m[1].length,
                lastIndex: m.index + m[0].length
              };
            }
            if (schemaPrefix.index < pos) {
              schemaPrefix = void 0;
              continue;
            }
            if (fuzzyCandidate && schemaPrefix.index > fuzzyCandidate.index) break;
            const prefix = schemaPrefix;
            schemaPrefix = void 0;
            const len = this.testSchemaAt(text, prefix.schema, prefix.lastIndex);
            if (len) {
              schemaCandidate = {
                schema: prefix.schema,
                index: prefix.index,
                lastIndex: prefix.lastIndex + len
              };
              break;
            }
          }
          let candidate = schemaCandidate;
          if (!candidate || fuzzyEmailCandidate && (fuzzyEmailCandidate.index < candidate.index || fuzzyEmailCandidate.index === candidate.index && fuzzyEmailCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyEmailCandidate;
          if (!candidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < candidate.index || fuzzyLinkCandidate.index === candidate.index && fuzzyLinkCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyLinkCandidate;
          if (!candidate) break;
          if (candidate === fuzzyEmailCandidate) fuzzyEmailCandidate = void 0;
          else if (candidate === fuzzyLinkCandidate) fuzzyLinkCandidate = void 0;
          const match = new Match(text, candidate.schema, candidate.index, candidate.lastIndex);
          if (match.schema) this.__schemas__[match.schema].normalize(match, this);
          else this.normalize(match);
          result.push(match);
          pos = candidate.lastIndex;
        }
        if (result.length) return result;
        return null;
      }
      /**
      * Returns fully-formed (not fuzzy) link if it starts at the beginning
      * of the string, and null otherwise.
      *
      * @param text Text to scan.
      */
      matchAtStart(text) {
        if (!text.length) return null;
        const m = this.re.get_schema_at_start().exec(text);
        if (!m) return null;
        const len = this.testSchemaAt(text, m[2], m[0].length);
        if (!len) return null;
        const match = new Match(text, m[2], m.index + m[1].length, m.index + m[0].length + len);
        this.__schemas__[match.schema].normalize(match, this);
        return match;
      }
      /**
      * Load (or merge) new TLDs list. Those are used for fuzzy links (without
      * prefix) to avoid false positives. By default this algorithm is used:
      *
      * - hostname with any 2-letter root zones are ok.
      * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
      *   are ok.
      * - encoded (`xn--...`) root zones are ok.
      *
      * If list is replaced, then exact match for 2-chars root zones will be checked.
      *
      * @param list List of TLDs.
      * @param keepOld Merge with current list if `true` (`false` by default).
      */
      tlds(list, keepOld = false) {
        list = Array.isArray(list) ? list : [list];
        if (!keepOld) this.__opts__.tlds = list;
        else this.__opts__.tlds = this.__opts__.tlds.concat(list);
        this.re.set(_objectSpread2(_objectSpread2({}, this.__opts__), {}, { schema_names: Object.keys(this.__schemas__) }));
        return this;
      }
      /**
      * Default normalizer (if schema does not define its own).
      *
      * @param match Match to normalize.
      */
      normalize(match) {
        if (!match.schema) match.url = `http://${match.url}`;
        if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) match.url = `mailto:${match.url}`;
      }
    };
    function linkifyit(options = {}) {
      return new LinkifyIt(options);
    }
    exports2.LinkifyIt = LinkifyIt;
    exports2.REBuilder = REBuilder;
    exports2.linkifyit = linkifyit;
  }
});

// node_modules/punycode.js/punycode.js
var require_punycode = __commonJS({
  "node_modules/punycode.js/punycode.js"(exports2, module2) {
    "use strict";
    var maxInt = 2147483647;
    var base = 36;
    var tMin = 1;
    var tMax = 26;
    var skew = 38;
    var damp = 700;
    var initialBias = 72;
    var initialN = 128;
    var delimiter = "-";
    var regexPunycode = /^xn--/;
    var regexNonASCII = /[^\0-\x7F]/;
    var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
    var errors = {
      "overflow": "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    };
    var baseMinusTMin = base - tMin;
    var floor = Math.floor;
    var stringFromCharCode = String.fromCharCode;
    function error(type) {
      throw new RangeError(errors[type]);
    }
    function map(array, callback) {
      const result = [];
      let length = array.length;
      while (length--) {
        result[length] = callback(array[length]);
      }
      return result;
    }
    function mapDomain(domain, callback) {
      const parts = domain.split("@");
      let result = "";
      if (parts.length > 1) {
        result = parts[0] + "@";
        domain = parts[1];
      }
      domain = domain.replace(regexSeparators, ".");
      const labels = domain.split(".");
      const encoded = map(labels, callback).join(".");
      return result + encoded;
    }
    function ucs2decode(string) {
      const output = [];
      let counter = 0;
      const length = string.length;
      while (counter < length) {
        const value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          const extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          } else {
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }
    var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
    var basicToDigit = function(codePoint) {
      if (codePoint >= 48 && codePoint < 58) {
        return 26 + (codePoint - 48);
      }
      if (codePoint >= 65 && codePoint < 91) {
        return codePoint - 65;
      }
      if (codePoint >= 97 && codePoint < 123) {
        return codePoint - 97;
      }
      return base;
    };
    var digitToBasic = function(digit, flag) {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    };
    var adapt = function(delta, numPoints, firstTime) {
      let k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for (; delta > baseMinusTMin * tMax >> 1; k += base) {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    };
    var decode = function(input) {
      const output = [];
      const inputLength = input.length;
      let i = 0;
      let n = initialN;
      let bias = initialBias;
      let basic = input.lastIndexOf(delimiter);
      if (basic < 0) {
        basic = 0;
      }
      for (let j = 0; j < basic; ++j) {
        if (input.charCodeAt(j) >= 128) {
          error("not-basic");
        }
        output.push(input.charCodeAt(j));
      }
      for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
        const oldi = i;
        for (let w = 1, k = base; ; k += base) {
          if (index >= inputLength) {
            error("invalid-input");
          }
          const digit = basicToDigit(input.charCodeAt(index++));
          if (digit >= base) {
            error("invalid-input");
          }
          if (digit > floor((maxInt - i) / w)) {
            error("overflow");
          }
          i += digit * w;
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (digit < t) {
            break;
          }
          const baseMinusT = base - t;
          if (w > floor(maxInt / baseMinusT)) {
            error("overflow");
          }
          w *= baseMinusT;
        }
        const out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0);
        if (floor(i / out) > maxInt - n) {
          error("overflow");
        }
        n += floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
      }
      return String.fromCodePoint(...output);
    };
    var encode = function(input) {
      const output = [];
      input = ucs2decode(input);
      const inputLength = input.length;
      let n = initialN;
      let delta = 0;
      let bias = initialBias;
      for (const currentValue of input) {
        if (currentValue < 128) {
          output.push(stringFromCharCode(currentValue));
        }
      }
      const basicLength = output.length;
      let handledCPCount = basicLength;
      if (basicLength) {
        output.push(delimiter);
      }
      while (handledCPCount < inputLength) {
        let m = maxInt;
        for (const currentValue of input) {
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        }
        const handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (const currentValue of input) {
          if (currentValue < n && ++delta > maxInt) {
            error("overflow");
          }
          if (currentValue === n) {
            let q = delta;
            for (let k = base; ; k += base) {
              const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
              if (q < t) {
                break;
              }
              const qMinusT = q - t;
              const baseMinusT = base - t;
              output.push(
                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
              );
              q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }
        ++delta;
        ++n;
      }
      return output.join("");
    };
    var toUnicode = function(input) {
      return mapDomain(input, function(string) {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    };
    var toASCII = function(input) {
      return mapDomain(input, function(string) {
        return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
      });
    };
    var punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      "version": "2.3.1",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      "ucs2": {
        "decode": ucs2decode,
        "encode": ucs2encode
      },
      "decode": decode,
      "encode": encode,
      "toASCII": toASCII,
      "toUnicode": toUnicode
    };
    module2.exports = punycode;
  }
});

// node_modules/markdown-it/dist/markdown-it.cjs.js
var require_markdown_it_cjs = __commonJS({
  "node_modules/markdown-it/dist/markdown-it.cjs.js"(exports2, module2) {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __exportAll = (all, no_symbols) => {
      let target = {};
      for (var name in all) __defProp(target, name, {
        get: all[name],
        enumerable: true
      });
      if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
      return target;
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
        key = keys[i];
        if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
      value: mod,
      enumerable: true
    }) : target, mod));
    var mdurl = require_index_cjs();
    mdurl = __toESM(mdurl, 1);
    var uc_micro = require_index_cjs2();
    uc_micro = __toESM(uc_micro, 1);
    var linkify_it = require_index_cjs3();
    var punycode_js = require_punycode();
    punycode_js = __toESM(punycode_js, 1);
    var c1 = [
      8364,
      0,
      8218,
      402,
      8222,
      8230,
      8224,
      8225,
      710,
      8240,
      352,
      8249,
      338,
      0,
      381,
      0,
      0,
      8216,
      8217,
      8220,
      8221,
      8226,
      8211,
      8212,
      732,
      8482,
      353,
      8250,
      339,
      0,
      382,
      376
    ];
    function isInvalidCodePoint(codePoint) {
      return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
    }
    function replaceCodePoint(codePoint) {
      if (isInvalidCodePoint(codePoint)) return 65533;
      if (codePoint >= 128 && codePoint <= 159) return c1[codePoint - 128] || codePoint;
      return codePoint;
    }
    function codePointToString(codePoint) {
      return codePoint - 1 >>> 0 < 127 || codePoint - 160 >>> 0 < 55136 ? String.fromCharCode(codePoint) : String.fromCodePoint(replaceCodePoint(codePoint));
    }
    var BASE91_INVERSE = /* @__PURE__ */ (() => {
      const table2 = /* @__PURE__ */ new Uint8Array(127);
      let code2 = 0;
      for (let char = 33; char <= 126; char++) if (char !== 34 && char !== 36 && char !== 92) table2[char] = code2++;
      return table2;
    })();
    function decodeTrieDict(input, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
      const base = 91;
      const inputLength = input.length;
      const twoCharBias = dictSize * 90;
      let pos = 0;
      const readSlotCode = () => {
        const c12 = BASE91_INVERSE[input.charCodeAt(pos++)];
        return c12 < dictSize ? c12 : c12 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
      };
      const dict2AtomCount = atomCount - dict1AtomCount;
      const slotCount = atomCount + ngramCount;
      const single = new Int32Array(slotCount);
      single.fill(-1, dict1AtomCount, dictSize);
      single.fill(-1, dictSize + dict2AtomCount, slotCount);
      const start = new Int32Array(slotCount);
      const length = new Int32Array(slotCount);
      function decodeDelta(count, off) {
        let previous = 0;
        let slot = off;
        const end = off + count;
        while (slot < end) {
          const code2 = BASE91_INVERSE[input.charCodeAt(pos++)];
          if (code2 < 89) {
            previous += code2;
            single[slot++] = previous;
          } else if (code2 === 89) {
            let runLength = BASE91_INVERSE[input.charCodeAt(pos++)] + 2;
            while (runLength--) single[slot++] = ++previous;
          } else {
            const next = BASE91_INVERSE[input.charCodeAt(pos++)];
            previous += 89 + (next < 90 ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)] : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input.charCodeAt(pos++)] * base + BASE91_INVERSE[input.charCodeAt(pos++)]);
            single[slot++] = previous;
          }
        }
      }
      decodeDelta(dict1AtomCount, 0);
      decodeDelta(dict2AtomCount, dictSize);
      const references = new Int32Array(ngramCount * 2);
      let poolSize = 0;
      let ngramIndex = 0;
      function readNgramReferences(count, startSlot) {
        for (let index = 0; index < count; index++) {
          const slot = startSlot + index;
          const a = readSlotCode();
          const b = readSlotCode();
          references[ngramIndex * 2] = a;
          references[ngramIndex * 2 + 1] = b;
          ngramIndex += 1;
          start[slot] = poolSize;
          const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b] < 0 ? length[b] : 1);
          length[slot] = entryLength;
          poolSize += entryLength;
        }
      }
      readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
      readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
      const pool = new Uint16Array(poolSize);
      let write = 0;
      for (let index = 0; index < ngramIndex; index++) for (let half = 0; half < 2; half++) {
        const source = references[index * 2 + half];
        const value = single[source];
        if (value < 0) {
          let read = start[source];
          const readEnd = read + length[source];
          while (read < readEnd) pool[write++] = pool[read++];
        } else pool[write++] = value;
      }
      const out = new Uint16Array(resultLength);
      let outIndex = 0;
      while (pos < inputLength) {
        let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
        if (slot >= dictSize) slot = slot * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
        const value = single[slot];
        if (value < 0) {
          let read = start[slot];
          const readEnd = read + length[slot];
          while (read < readEnd) out[outIndex++] = pool[read++];
        } else out[outIndex++] = value;
      }
      return out;
    }
    var htmlDecodeTree = /* @__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
    var BinTrieFlags;
    (function(BinTrieFlags2) {
      BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
      BinTrieFlags2[BinTrieFlags2["FLAG13"] = 8192] = "FLAG13";
      BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
      BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
      BinTrieFlags2[BinTrieFlags2["VALUE_MASK"] = 8191] = "VALUE_MASK";
    })(BinTrieFlags || (BinTrieFlags = {}));
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function toPropertyKey(t) {
      var i = toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    function _defineProperty(e, r, t) {
      return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r] = t, e;
    }
    var CharCodes;
    (function(CharCodes2) {
      CharCodes2[CharCodes2["AMP"] = 38] = "AMP";
      CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
      CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
      CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
      CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
      CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
      CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
      CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
    })(CharCodes || (CharCodes = {}));
    var TO_LOWER_BIT = 32;
    var CONSUMED_SHIFT = 21;
    var CODE_POINT_MASK = 2097151;
    var CONSUMED_OVERFLOW = 2047;
    var longNumericConsumed = 0;
    function unpackConsumed(packed) {
      const consumed = packed >>> CONSUMED_SHIFT;
      return consumed === CONSUMED_OVERFLOW ? longNumericConsumed : consumed;
    }
    function isNumber(code2) {
      return code2 - CharCodes.ZERO >>> 0 <= 9;
    }
    function isHexadecimalCharacter(code2) {
      return (code2 | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
    }
    function isAlpha(code2) {
      return (code2 | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
    }
    function isEntityInAttributeInvalidEnd(code2) {
      return code2 === CharCodes.EQUALS || isAlpha(code2) || isNumber(code2);
    }
    var EntityDecoderState;
    (function(EntityDecoderState2) {
      EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
      EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
      EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
      EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
      EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
    })(EntityDecoderState || (EntityDecoderState = {}));
    var DecodingMode;
    (function(DecodingMode2) {
      DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
      DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
      DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
    })(DecodingMode || (DecodingMode = {}));
    function determineBranch(decodeTree, current, nodeIndex, char) {
      const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
      const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
      if (jumpOffset) {
        if (branchCount === 0) return char === jumpOffset ? nodeIndex : -1;
        const slot = char - jumpOffset;
        if (slot >>> 0 >= branchCount) return -1;
        const stored = decodeTree[nodeIndex + slot];
        return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
      }
      if (branchCount === 0) return -1;
      const packedKeySlots = branchCount + 1 >> 1;
      const branchEnd = nodeIndex + packedKeySlots + branchCount;
      for (let index = 0; index < branchCount; index++) {
        const key = decodeTree[nodeIndex + (index >> 1)] >> ((index & 1) << 3) & 255;
        if (key === char) return branchEnd + decodeTree[nodeIndex + packedKeySlots + index] & 65535;
        if (key > char) return -1;
      }
      return -1;
    }
    function readTrieValue(decodeTree, nodeIndex, valueLength) {
      if (valueLength === 1) return String.fromCharCode(decodeTree[nodeIndex] & BinTrieFlags.VALUE_MASK);
      if (valueLength === 2) return String.fromCharCode(decodeTree[nodeIndex + 1]);
      return String.fromCharCode(decodeTree[nodeIndex + 1], decodeTree[nodeIndex + 2]);
    }
    function parseNumericEntity(input, numberStart, inputLength) {
      let offset = numberStart + 1;
      let cp = 0;
      let digitStart = offset;
      if (offset < inputLength && (input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
        offset += 1;
        digitStart = offset;
        while (offset < inputLength) {
          const char = input.charCodeAt(offset);
          if (isNumber(char)) cp = cp * 16 + (char - CharCodes.ZERO);
          else if (isHexadecimalCharacter(char)) cp = cp * 16 + ((char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10);
          else break;
          offset += 1;
        }
      } else while (offset < inputLength) {
        const digit = input.charCodeAt(offset) - CharCodes.ZERO;
        if (digit >>> 0 > 9) break;
        cp = cp * 10 + digit;
        offset += 1;
      }
      if (offset === digitStart) return 0;
      if (offset < inputLength && input.charCodeAt(offset) === CharCodes.SEMI) offset += 1;
      if (cp > 1114111) cp = 1114112;
      let consumed = offset - numberStart;
      if (consumed >= CONSUMED_OVERFLOW) {
        longNumericConsumed = consumed;
        consumed = CONSUMED_OVERFLOW;
      }
      return consumed << CONSUMED_SHIFT | cp;
    }
    function decodeWithTrie(input, isStrict, isAttribute) {
      const decodeTree = htmlDecodeTree;
      let offset = input.indexOf("&");
      if (offset < 0) return input;
      const inputLength = input.length;
      let chunkStart = 0;
      let result = "";
      const root = decodeTree[0];
      const rootJumpOffset = root & BinTrieFlags.JUMP_TABLE;
      const rootBranchCount = (root & BinTrieFlags.BRANCH_LENGTH) >> 7;
      do {
        const entityStart = offset + 1;
        const firstChar = input.charCodeAt(entityStart);
        let consumed;
        let value;
        if (firstChar === CharCodes.NUM) {
          const packed = parseNumericEntity(input, entityStart, inputLength);
          consumed = unpackConsumed(packed);
          if (isStrict && consumed > 0 && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI) consumed = 0;
          value = consumed === 0 ? "" : codePointToString(packed & CODE_POINT_MASK);
        } else if (isAlpha(firstChar)) {
          consumed = 0;
          value = "";
          const rootSlotIndex = firstChar - rootJumpOffset;
          let nodeIndex;
          if (rootSlotIndex >>> 0 < rootBranchCount) {
            const stored = decodeTree[1 + rootSlotIndex];
            nodeIndex = stored === 0 ? -1 : rootBranchCount + stored & 65535;
          } else nodeIndex = -1;
          let bestNodeIndex = 0;
          let bestValueLength = 0;
          let current = nodeIndex < 0 ? 0 : decodeTree[nodeIndex];
          let index = entityStart + 1;
          trie: while (index < inputLength) {
            while ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0) {
              const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
              const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
              if (branchCount === 0) {
                if (input.charCodeAt(index) !== jumpOffset) break trie;
                nodeIndex += 1;
              } else {
                const slot = input.charCodeAt(index) - jumpOffset;
                if (slot >>> 0 >= branchCount) break trie;
                const stored = decodeTree[nodeIndex + 1 + slot];
                if (stored === 0) break trie;
                nodeIndex = nodeIndex + branchCount + stored & 65535;
              }
              current = decodeTree[nodeIndex];
              index += 1;
              if (index >= inputLength) break trie;
            }
            if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
              const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
              if (input.charCodeAt(index) !== (current & BinTrieFlags.JUMP_TABLE)) break;
              index += 1;
              const remaining = runLength - 1;
              let wordIndex = nodeIndex + 1;
              let charIndexInPacked = 0;
              for (; charIndexInPacked + 1 < remaining; charIndexInPacked += 2) {
                const packed = decodeTree[wordIndex];
                if (input.charCodeAt(index) !== (packed & 255)) break trie;
                index += 1;
                if (input.charCodeAt(index) !== (packed >> 8 & 255)) break trie;
                index += 1;
                wordIndex += 1;
              }
              if (charIndexInPacked < remaining) {
                if (input.charCodeAt(index) !== (decodeTree[wordIndex] & 255)) break;
                index += 1;
              }
              nodeIndex += 1 + (runLength >> 1);
              current = decodeTree[nodeIndex];
              continue;
            }
            const valueLength = current >>> 14;
            const char = input.charCodeAt(index);
            if (valueLength !== 0) {
              if (char === CharCodes.SEMI) {
                consumed = index - entityStart + 1;
                value = valueLength === 1 ? String.fromCharCode(current & BinTrieFlags.VALUE_MASK) : readTrieValue(decodeTree, nodeIndex, valueLength);
                break;
              }
              if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
                consumed = index - entityStart;
                bestNodeIndex = nodeIndex;
                bestValueLength = valueLength;
              }
              if (valueLength === 1) break;
            }
            const next = determineBranch(decodeTree, current, nodeIndex + (valueLength || 1), char);
            if (next < 0) break;
            nodeIndex = next;
            current = decodeTree[nodeIndex];
            index += 1;
          }
          if (value === "") {
            const finalVL = current >>> 14;
            if (finalVL !== 0 && !isStrict && (current & BinTrieFlags.FLAG13) === 0) {
              consumed = index - entityStart;
              bestNodeIndex = nodeIndex;
              bestValueLength = finalVL;
            }
            if (consumed > 0) value = readTrieValue(decodeTree, bestNodeIndex, bestValueLength);
          }
        } else {
          consumed = 0;
          value = "";
        }
        if (consumed === 0 || isAttribute && firstChar !== CharCodes.NUM && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI && entityStart + consumed < inputLength && isEntityInAttributeInvalidEnd(input.charCodeAt(entityStart + consumed))) offset = entityStart;
        else {
          if (chunkStart < offset) result += input.slice(chunkStart, offset);
          result += value;
          offset = chunkStart = entityStart + consumed;
        }
        if (input.charCodeAt(offset) !== CharCodes.AMP) offset = input.indexOf("&", offset);
      } while (offset >= 0);
      return result + input.slice(chunkStart);
    }
    function decodeHTMLStrict(htmlString) {
      return decodeWithTrie(htmlString, true, false);
    }
    var utils_exports = /* @__PURE__ */ __exportAll({
      arrayReplaceAt: () => arrayReplaceAt,
      asciiTrim: () => asciiTrim,
      callable: () => callable,
      escapeHtml: () => escapeHtml,
      escapeRE: () => escapeRE,
      fromCodePoint: () => fromCodePoint,
      isMdAsciiPunct: () => isMdAsciiPunct,
      isPunctChar: () => isPunctChar,
      isPunctCharCode: () => isPunctCharCode,
      isSpace: () => isSpace,
      isValidEntityCode: () => isValidEntityCode,
      isWhiteSpace: () => isWhiteSpace,
      lib: () => lib,
      normalizeReference: () => normalizeReference,
      unescapeAll: () => unescapeAll,
      unescapeMd: () => unescapeMd
    });
    function callable(cls) {
      const wrapper = function(...args) {
        return Reflect.construct(cls, args, new.target && new.target !== wrapper ? new.target : cls);
      };
      Object.defineProperty(wrapper, "name", { value: cls.name });
      Object.setPrototypeOf(wrapper, cls);
      wrapper.prototype = cls.prototype;
      return wrapper;
    }
    function arrayReplaceAt(src, pos, newElements) {
      return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
    }
    function isValidEntityCode(c) {
      if (c >= 55296 && c <= 57343) return false;
      if (c >= 64976 && c <= 65007) return false;
      if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
      if (c >= 0 && c <= 8) return false;
      if (c === 11) return false;
      if (c >= 14 && c <= 31) return false;
      if (c >= 127 && c <= 159) return false;
      if (c > 1114111) return false;
      return true;
    }
    function fromCodePoint(c) {
      if (c > 65535) {
        c -= 65536;
        const surrogate1 = 55296 + (c >> 10);
        const surrogate2 = 56320 + (c & 1023);
        return String.fromCharCode(surrogate1, surrogate2);
      }
      return String.fromCharCode(c);
    }
    var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
    var UNESCAPE_ALL_RE = new RegExp(`${UNESCAPE_MD_RE.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
    var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
    function replaceEntityPattern(match, name) {
      if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
        const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        if (isValidEntityCode(code2)) return fromCodePoint(code2);
        return match;
      }
      const decoded = decodeHTMLStrict(match);
      if (decoded !== match) return decoded;
      return match;
    }
    function unescapeMd(str) {
      if (str.indexOf("\\") < 0) return str;
      return str.replace(UNESCAPE_MD_RE, "$1");
    }
    function unescapeAll(str) {
      if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
      return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity2) {
        if (escaped) return escaped;
        return replaceEntityPattern(match, entity2);
      });
    }
    var HTML_ESCAPE_TEST_RE = /[&<>"]/;
    var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
    var HTML_REPLACEMENTS = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    function replaceUnsafeChar(ch) {
      return HTML_REPLACEMENTS[ch];
    }
    function escapeHtml(str) {
      if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
      return str;
    }
    var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
    function escapeRE(str) {
      return str.replace(REGEXP_ESCAPE_RE, "\\$&");
    }
    function isSpace(code2) {
      switch (code2) {
        case 9:
        case 32:
          return true;
      }
      return false;
    }
    function isWhiteSpace(code2) {
      if (code2 >= 8192 && code2 <= 8202) return true;
      switch (code2) {
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 32:
        case 160:
        case 5760:
        case 8239:
        case 8287:
        case 12288:
          return true;
      }
      return false;
    }
    function isPunctChar(ch) {
      return uc_micro.P.test(ch) || uc_micro.S.test(ch);
    }
    function isPunctCharCode(code2) {
      return isPunctChar(fromCodePoint(code2));
    }
    function isMdAsciiPunct(ch) {
      switch (ch) {
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38:
        case 39:
        case 40:
        case 41:
        case 42:
        case 43:
        case 44:
        case 45:
        case 46:
        case 47:
        case 58:
        case 59:
        case 60:
        case 61:
        case 62:
        case 63:
        case 64:
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:
        case 96:
        case 123:
        case 124:
        case 125:
        case 126:
          return true;
        default:
          return false;
      }
    }
    function normalizeReference(str) {
      str = str.trim().replace(/\s+/g, " ");
      return str.toLowerCase().toUpperCase();
    }
    function isAsciiTrimmable(c) {
      return c === 32 || c === 9 || c === 10 || c === 13;
    }
    function asciiTrim(str) {
      let start = 0;
      for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
      let end = str.length - 1;
      for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
      return str.slice(start, end + 1);
    }
    var lib = {
      mdurl,
      ucmicro: uc_micro
    };
    function parseLinkLabel(state, start, disableNested) {
      let level, found, marker, prevPos;
      const max = state.posMax;
      const oldPos = state.pos;
      state.pos = start + 1;
      level = 1;
      while (state.pos < max) {
        marker = state.src.charCodeAt(state.pos);
        if (marker === 93) {
          level--;
          if (level === 0) {
            found = true;
            break;
          }
        }
        prevPos = state.pos;
        state.md.inline.skipToken(state);
        if (marker === 91) {
          if (prevPos === state.pos - 1) level++;
          else if (disableNested) {
            state.pos = oldPos;
            return -1;
          }
        }
      }
      let labelEnd = -1;
      if (found) labelEnd = state.pos;
      state.pos = oldPos;
      return labelEnd;
    }
    function parseLinkDestination(str, start, max) {
      let code2;
      let pos = start;
      const result = {
        ok: false,
        pos: 0,
        str: ""
      };
      if (str.charCodeAt(pos) === 60) {
        pos++;
        while (pos < max) {
          code2 = str.charCodeAt(pos);
          if (code2 === 10) return result;
          if (code2 === 60) return result;
          if (code2 === 62) {
            result.pos = pos + 1;
            result.str = unescapeAll(str.slice(start + 1, pos));
            result.ok = true;
            return result;
          }
          if (code2 === 92 && pos + 1 < max) {
            pos += 2;
            continue;
          }
          pos++;
        }
        return result;
      }
      let level = 0;
      while (pos < max) {
        code2 = str.charCodeAt(pos);
        if (code2 === 32) break;
        if (code2 < 32 || code2 === 127) break;
        if (code2 === 92 && pos + 1 < max) {
          if (str.charCodeAt(pos + 1) === 32) {
            pos++;
            continue;
          }
          pos += 2;
          continue;
        }
        if (code2 === 40) {
          level++;
          if (level > 32) return result;
        }
        if (code2 === 41) {
          if (level === 0) break;
          level--;
        }
        pos++;
      }
      if (start === pos) return result;
      if (level !== 0) return result;
      result.str = unescapeAll(str.slice(start, pos));
      result.pos = pos;
      result.ok = true;
      return result;
    }
    function parseLinkTitle(str, start, max, prev_state) {
      let code2;
      let pos = start;
      const state = {
        ok: false,
        can_continue: false,
        pos: 0,
        str: "",
        marker: 0
      };
      if (prev_state) {
        state.str = prev_state.str;
        state.marker = prev_state.marker;
      } else {
        if (pos >= max) return state;
        let marker = str.charCodeAt(pos);
        if (marker !== 34 && marker !== 39 && marker !== 40) return state;
        start++;
        pos++;
        if (marker === 40) marker = 41;
        state.marker = marker;
      }
      while (pos < max) {
        code2 = str.charCodeAt(pos);
        if (code2 === state.marker) {
          state.pos = pos + 1;
          state.str += unescapeAll(str.slice(start, pos));
          state.ok = true;
          return state;
        } else if (code2 === 40 && state.marker === 41) return state;
        else if (code2 === 92 && pos + 1 < max) pos++;
        pos++;
      }
      state.can_continue = true;
      state.str += unescapeAll(str.slice(start, pos));
      return state;
    }
    var helpers_exports = /* @__PURE__ */ __exportAll({
      parseLinkDestination: () => parseLinkDestination,
      parseLinkLabel: () => parseLinkLabel,
      parseLinkTitle: () => parseLinkTitle
    });
    var Token = class {
      constructor(type, tag, nesting) {
        _defineProperty(
          this,
          /**
          * Source map info. Format: `[ line_begin, line_end ]`
          */
          "map",
          null
        );
        _defineProperty(
          this,
          /**
          * nesting level, the same as `state.level`
          */
          "level",
          0
        );
        _defineProperty(
          this,
          /**
          * An array of child nodes (inline and img tokens)
          */
          "children",
          null
        );
        _defineProperty(
          this,
          /**
          * In a case of self-closing tag (code, html, fence, etc.),
          * it has contents of this tag.
          */
          "content",
          ""
        );
        _defineProperty(
          this,
          /**
          * '*' or '_' for emphasis, fence string for fence, etc.
          */
          "markup",
          ""
        );
        _defineProperty(
          this,
          /**
          * Additional information:
          *
          * - Info string for "fence" tokens
          * - The value "auto" for autolink "link_open" and "link_close" tokens
          * - The string value of the item marker for ordered-list "list_item_open" tokens
          */
          "info",
          ""
        );
        _defineProperty(
          this,
          /**
          * True for block-level tokens, false for inline tokens.
          * Used in renderer to calculate line breaks
          */
          "block",
          false
        );
        _defineProperty(
          this,
          /**
          * If it's true, ignore this element when rendering. Used for tight lists
          * to hide paragraphs.
          */
          "hidden",
          false
        );
        this.type = type;
        this.tag = tag;
        this.attrs = null;
        this.nesting = nesting;
        this.meta = null;
      }
      /**
      * Search attribute index by name.
      */
      attrIndex(name) {
        if (!this.attrs) return -1;
        const attrs = this.attrs;
        for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
        return -1;
      }
      /**
      * Add `[ name, value ]` attribute to list. Init attrs if necessary
      */
      attrPush(attrData) {
        if (this.attrs) this.attrs.push(attrData);
        else this.attrs = [attrData];
      }
      /**
      * Set `name` attribute to `value`. Override old value if exists.
      */
      attrSet(name, value) {
        const idx = this.attrIndex(name);
        const attrData = [name, value];
        if (idx < 0) this.attrPush(attrData);
        else this.attrs[idx] = attrData;
      }
      /**
      * Get the value of attribute `name`, or null if it does not exist.
      */
      attrGet(name) {
        const idx = this.attrIndex(name);
        let value = null;
        if (idx >= 0) value = this.attrs[idx][1];
        return value;
      }
      /**
      * Join value to existing attribute via space. Or create new attribute if not
      * exists. Useful to operate with token classes.
      */
      attrJoin(name, value) {
        const idx = this.attrIndex(name);
        if (idx < 0) this.attrPush([name, value]);
        else this.attrs[idx][1] = `${this.attrs[idx][1]} ${value}`;
      }
    };
    var Ruler = class {
      constructor() {
        _defineProperty(
          this,
          /** @internal */
          "__rules__",
          []
        );
        _defineProperty(
          this,
          /** @internal */
          "__cache__",
          null
        );
      }
      /** @internal */
      __find__(name) {
        for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
        return -1;
      }
      /** @internal */
      __compile__() {
        const chains = /* @__PURE__ */ new Set();
        this.__rules__.forEach((rule) => {
          if (!rule.enabled) return;
          rule.alt.forEach((altName) => {
            if (altName) chains.add(altName);
          });
        });
        this.__cache__ = /* @__PURE__ */ Object.create(null);
        this.__cache__[""] = [];
        this.__rules__.forEach((rule) => {
          if (rule.enabled) this.__cache__[""].push(rule.fn);
        });
        chains.forEach((chain) => {
          this.__cache__[chain] = [];
          this.__rules__.forEach((rule) => {
            if (rule.enabled && rule.alt.indexOf(chain) >= 0) this.__cache__[chain].push(rule.fn);
          });
        });
      }
      /**
      * Replace rule by name with new function & options. Throws error if name not
      * found.
      *
      * @example Replace existing typographer replacement rule with new one
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.core.ruler.at('replacements', function replace(state) {
      *   //...
      * });
      * ```
      */
      at(name, fn, options = {}) {
        const index = this.__find__(name);
        if (index === -1) throw new Error(`Parser rule not found: ${name}`);
        this.__rules__[index].fn = fn;
        this.__rules__[index].alt = options.alt || [];
        this.__cache__ = null;
      }
      /**
      * Add new rule to chain before one with given name. See also
      * {@link Ruler.after}, {@link Ruler.push}.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
      *   //...
      * });
      * ```
      */
      before(beforeName, ruleName, fn, options = {}) {
        const index = this.__find__(beforeName);
        if (index === -1) throw new Error(`Parser rule not found: ${beforeName}`);
        this.__rules__.splice(index, 0, {
          name: ruleName,
          enabled: true,
          fn,
          alt: options.alt || []
        });
        this.__cache__ = null;
      }
      /**
      * Add new rule to chain after one with given name. See also
      * {@link Ruler.before}, {@link Ruler.push}.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.inline.ruler.after('text', 'my_rule', function replace(state) {
      *   //...
      * });
      * ```
      */
      after(afterName, ruleName, fn, options = {}) {
        const index = this.__find__(afterName);
        if (index === -1) throw new Error(`Parser rule not found: ${afterName}`);
        this.__rules__.splice(index + 1, 0, {
          name: ruleName,
          enabled: true,
          fn,
          alt: options.alt || []
        });
        this.__cache__ = null;
      }
      /**
      * Push new rule to the end of chain. See also
      * {@link Ruler.before}, {@link Ruler.after}.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.core.ruler.push('my_rule', function replace(state) {
      *   //...
      * });
      * ```
      */
      push(ruleName, fn, options = {}) {
        this.__rules__.push({
          name: ruleName,
          enabled: true,
          fn,
          alt: options.alt || []
        });
        this.__cache__ = null;
      }
      /**
      * Enable rules with given names. If any rule name not found - throw Error.
      * Errors can be disabled by second param.
      *
      * See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
      *
      * Returns list of found rule names (if no exception happened).
      */
      enable(list2, ignoreInvalid = false) {
        if (!Array.isArray(list2)) list2 = [list2];
        const result = [];
        list2.forEach((name) => {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) return;
            throw new Error(`Rules manager: invalid rule name ${name}`);
          }
          this.__rules__[idx].enabled = true;
          result.push(name);
        });
        this.__cache__ = null;
        return result;
      }
      /**
      * Enable rules with given names, and disable everything else. If any rule name
      * not found - throw Error. Errors can be disabled by second param.
      *
      * See also {@link Ruler.disable}, {@link Ruler.enable}.
      */
      enableOnly(list2, ignoreInvalid = false) {
        if (!Array.isArray(list2)) list2 = [list2];
        this.__rules__.forEach((rule) => {
          rule.enabled = false;
        });
        this.enable(list2, ignoreInvalid);
      }
      /**
      * Disable rules with given names. If any rule name not found - throw Error.
      * Errors can be disabled by second param.
      *
      * See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
      *
      * Returns list of found rule names (if no exception happened).
      */
      disable(list2, ignoreInvalid = false) {
        if (!Array.isArray(list2)) list2 = [list2];
        const result = [];
        list2.forEach((name) => {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) return;
            throw new Error(`Rules manager: invalid rule name ${name}`);
          }
          this.__rules__[idx].enabled = false;
          result.push(name);
        });
        this.__cache__ = null;
        return result;
      }
      /**
      * Return array of active functions (rules) for given chain name. It analyzes
      * rules configuration, compiles caches if not exists and returns result.
      *
      * Default chain name is `''` (empty string). It can't be skipped. That's
      * done intentionally, to keep signature monomorphic for high speed.
      */
      getRules(chainName) {
        if (!this.__cache__) this.__compile__();
        return this.__cache__[chainName] || [];
      }
    };
    var default_rules = {};
    default_rules.code_inline = function(tokens, idx, options, env, slf) {
      const token = tokens[idx];
      return `<code${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
    };
    default_rules.code_block = function(tokens, idx, options, env, slf) {
      const token = tokens[idx];
      return `<pre${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>
`;
    };
    default_rules.fence = function(tokens, idx, options, env, slf) {
      const token = tokens[idx];
      const info = token.info ? unescapeAll(token.info).trim() : "";
      let langName = "";
      let langAttrs = "";
      if (info) {
        const arr = info.split(/(\s+)/g);
        langName = arr[0];
        langAttrs = arr.slice(2).join("");
      }
      let highlighted;
      if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
      else highlighted = escapeHtml(token.content);
      if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
      if (info) {
        const i = token.attrIndex("class");
        const tmpAttrs = token.attrs ? token.attrs.slice() : [];
        if (i < 0) tmpAttrs.push(["class", `${options.langPrefix}${langName}`]);
        else {
          tmpAttrs[i] = [tmpAttrs[i][0], tmpAttrs[i][1]];
          tmpAttrs[i][1] += ` ${options.langPrefix}${langName}`;
        }
        const tmpToken = { attrs: tmpAttrs };
        return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>
`;
      }
      return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>
`;
    };
    default_rules.image = function(tokens, idx, options, env, slf) {
      const token = tokens[idx];
      token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
      return slf.renderToken(tokens, idx, options);
    };
    default_rules.hardbreak = function(tokens, idx, options) {
      return options.xhtmlOut ? "<br />\n" : "<br>\n";
    };
    default_rules.softbreak = function(tokens, idx, options) {
      return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
    };
    default_rules.text = function(tokens, idx) {
      return escapeHtml(tokens[idx].content);
    };
    default_rules.html_block = function(tokens, idx) {
      return tokens[idx].content;
    };
    default_rules.html_inline = function(tokens, idx) {
      return tokens[idx].content;
    };
    var Renderer = class {
      constructor() {
        _defineProperty(
          this,
          /**
          * Contains render rules for tokens. Can be updated and extended.
          *
          * See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
          * for more details and examples.
          *
          * @example Custom render rules
          * ```javascript
          * import MarkdownIt from 'markdown-it'
          * const md = new MarkdownIt()
          *
          * md.renderer.rules.strong_open  = function () { return '<b>'; };
          * md.renderer.rules.strong_close = function () { return '</b>'; };
          *
          * const result = md.renderInline(...);
          * ```
          *
          * @example Each rule is called as independent static function with fixed signature
          * ```javascript
          * function my_token_render(tokens, idx, options, env, renderer) {
          *   // ...
          *   return renderedHTML;
          * }
          * ```
          */
          "rules",
          Object.assign({}, default_rules)
        );
      }
      /**
      * Render token attributes to string.
      */
      renderAttrs(token) {
        let i, l, result;
        if (!token.attrs) return "";
        result = "";
        for (i = 0, l = token.attrs.length; i < l; i++) result += ` ${escapeHtml(token.attrs[i][0])}="${escapeHtml(String(token.attrs[i][1]))}"`;
        return result;
      }
      /**
      * Default token renderer. Can be overriden by custom function
      * in {@link Renderer.rules}.
      */
      renderToken(tokens, idx, options) {
        const token = tokens[idx];
        let result = "";
        if (token.hidden) return "";
        let prev = idx - 1;
        while (prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === 0) prev--;
        if (token.block && token.nesting !== -1 && prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === -1) result += "\n";
        result += (token.nesting === -1 ? "</" : "<") + token.tag;
        result += this.renderAttrs(token);
        if (token.nesting === 0 && options.xhtmlOut) result += " /";
        let needLf = false;
        if (token.block) {
          needLf = true;
          if (token.nesting === 1) {
            let next = idx + 1;
            while (next < tokens.length && tokens[next].hidden && tokens[next].nesting === 0) next++;
            if (next < tokens.length) {
              const nextToken = tokens[next];
              if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
              else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
            }
          }
        }
        result += needLf ? ">\n" : ">";
        return result;
      }
      /**
      * The same as {@link Renderer.render}, but for single token of `inline` type.
      */
      renderInline(tokens, options, env) {
        let result = "";
        const rules = this.rules;
        for (let i = 0, len = tokens.length; i < len; i++) {
          const type = tokens[i].type;
          if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
          else result += this.renderToken(tokens, i, options);
        }
        return result;
      }
      /**
      * Special kludge for image `alt` attributes to conform CommonMark spec.
      * Don't try to use it! Spec requires to show `alt` content with stripped markup,
      * instead of simple escaping.
      */
      renderInlineAsText(tokens, options, env) {
        let result = "";
        for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
          case "text":
          case "code_inline":
            result += tokens[i].content;
            break;
          case "image":
            result += this.renderInlineAsText(tokens[i].children, options, env);
            break;
          case "html_inline":
          case "html_block":
            result += tokens[i].content;
            break;
          case "softbreak":
          case "hardbreak":
            result += "\n";
        }
        return result;
      }
      /**
      * Takes token stream and generates HTML. Probably, you will never need to call
      * this method directly.
      */
      render(tokens, options, env) {
        let result = "";
        const rules = this.rules;
        for (let i = 0, len = tokens.length; i < len; i++) {
          const type = tokens[i].type;
          if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
          else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
          else result += this.renderToken(tokens, i, options);
        }
        return result;
      }
    };
    var StateCore = class {
      constructor(src, md, env) {
        _defineProperty(this, "tokens", []);
        _defineProperty(this, "inlineMode", false);
        _defineProperty(this, "Token", Token);
        this.src = src;
        this.env = env;
        this.md = md;
      }
    };
    var UNNORMALIZED_NEWLINE_RE = /\r\n?/g;
    var NULL_RE = /\0/g;
    function normalize(state) {
      let str;
      str = state.src.replace(UNNORMALIZED_NEWLINE_RE, "\n");
      str = str.replace(NULL_RE, "\uFFFD");
      state.src = str;
    }
    function block(state) {
      let token;
      if (state.inlineMode) {
        token = new state.Token("inline", "", 0);
        token.content = state.src;
        token.map = [0, 1];
        token.children = [];
        state.tokens.push(token);
      } else state.md.block.parse(state.src, state.md, state.env, state.tokens);
    }
    function strip_references(state) {
      const tokens = state.tokens;
      let last = 0;
      for (let curr = 0; curr < tokens.length; curr++) {
        if (tokens[curr].type === "reference_definition") continue;
        if (curr !== last) tokens[last] = tokens[curr];
        last++;
      }
      if (tokens.length !== last) tokens.length = last;
    }
    function inline(state) {
      const tokens = state.tokens;
      for (let i = 0, l = tokens.length; i < l; i++) {
        const tok = tokens[i];
        if (tok.type === "inline") state.md.inline.parse(tok.content, state.md, state.env, tok.children);
      }
    }
    function isLinkOpen$1(str) {
      return /^<a[>\s]/i.test(str);
    }
    function isLinkClose$1(str) {
      return /^<\/a\s*>/i.test(str);
    }
    function linkify$1(state) {
      const blockTokens = state.tokens;
      if (!state.md.options.linkify) return;
      for (let j = 0, l = blockTokens.length; j < l; j++) {
        if (blockTokens[j].type !== "inline" || !state.md.linkify.test(blockTokens[j].content)) continue;
        const tokens = blockTokens[j].children;
        const replacements = [];
        let htmlLinkLevel = 0;
        for (let i = tokens.length - 1; i >= 0; i--) {
          const currentToken = tokens[i];
          if (currentToken.type === "link_close") {
            i--;
            while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
            continue;
          }
          if (currentToken.type === "html_inline") {
            if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
            if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
          }
          if (htmlLinkLevel > 0) continue;
          if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
            const text2 = currentToken.content;
            let links = state.md.linkify.match(text2);
            const nodes = [];
            let level = currentToken.level;
            let lastPos = 0;
            if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
            for (let ln = 0; ln < links.length; ln++) {
              const url = links[ln].url;
              const fullUrl = state.md.normalizeLink(url);
              if (!state.md.validateLink(fullUrl)) continue;
              let urlText = links[ln].text;
              if (!links[ln].schema) urlText = state.md.normalizeLinkText(`http://${urlText}`).replace(/^http:\/\//, "");
              else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state.md.normalizeLinkText(`mailto:${urlText}`).replace(/^mailto:/, "");
              else urlText = state.md.normalizeLinkText(urlText);
              const pos = links[ln].index;
              if (pos > lastPos) {
                const token = new state.Token("text", "", 0);
                token.content = text2.slice(lastPos, pos);
                token.level = level;
                nodes.push(token);
              }
              const token_o = new state.Token("link_open", "a", 1);
              token_o.attrs = [["href", fullUrl]];
              token_o.level = level++;
              token_o.markup = "linkify";
              token_o.info = "auto";
              nodes.push(token_o);
              const token_t = new state.Token("text", "", 0);
              token_t.content = urlText;
              token_t.level = level;
              nodes.push(token_t);
              const token_c = new state.Token("link_close", "a", -1);
              token_c.level = --level;
              token_c.markup = "linkify";
              token_c.info = "auto";
              nodes.push(token_c);
              lastPos = links[ln].lastIndex;
            }
            if (lastPos < text2.length) {
              const token = new state.Token("text", "", 0);
              token.content = text2.slice(lastPos);
              token.level = level;
              nodes.push(token);
            }
            replacements.push({
              index: i,
              nodes
            });
          }
        }
        if (replacements.length > 0) {
          let newTokensLength = tokens.length;
          for (const replacement of replacements) newTokensLength += replacement.nodes.length - 1;
          const newTokens = new Array(newTokensLength);
          let replacementIndex = 0;
          let newTokenIndex = 0;
          replacements.reverse();
          for (let i = 0; i < tokens.length; i++) {
            const replacement = replacements[replacementIndex];
            if ((replacement === null || replacement === void 0 ? void 0 : replacement.index) === i) {
              for (const node of replacement.nodes) newTokens[newTokenIndex++] = node;
              replacementIndex++;
            } else newTokens[newTokenIndex++] = tokens[i];
          }
          blockTokens[j].children = newTokens;
        }
      }
    }
    var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
    var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
    var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
    var SCOPED_ABBR = {
      c: "\xA9",
      r: "\xAE",
      tm: "\u2122"
    };
    function replaceFn(match, name) {
      return SCOPED_ABBR[name.toLowerCase()];
    }
    function replace_scoped(inlineTokens) {
      let inside_autolink = 0;
      for (let i = inlineTokens.length - 1; i >= 0; i--) {
        const token = inlineTokens[i];
        if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
        if (token.type === "link_open" && token.info === "auto") inside_autolink--;
        if (token.type === "link_close" && token.info === "auto") inside_autolink++;
      }
    }
    function replace_rare(inlineTokens) {
      let inside_autolink = 0;
      for (let i = inlineTokens.length - 1; i >= 0; i--) {
        const token = inlineTokens[i];
        if (token.type === "text" && !inside_autolink) {
          if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1\u2014").replace(/(^|\s)--(?=\s|$)/gm, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1\u2013");
        }
        if (token.type === "link_open" && token.info === "auto") inside_autolink--;
        if (token.type === "link_close" && token.info === "auto") inside_autolink++;
      }
    }
    function replace(state) {
      let blkIdx;
      if (!state.md.options.typographer) return;
      for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
        if (state.tokens[blkIdx].type !== "inline") continue;
        if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) replace_scoped(state.tokens[blkIdx].children);
        if (RARE_RE.test(state.tokens[blkIdx].content)) replace_rare(state.tokens[blkIdx].children);
      }
    }
    var QUOTE_TEST_RE = /['"]/;
    var QUOTE_RE = /['"]/g;
    var APOSTROPHE = "\u2019";
    var MAX_OPENERS = 1e3;
    function truncateStack(stack, heads, length) {
      while (stack.length > length) {
        const item = stack.pop();
        if (item.isSingleQuote) heads.single = item.prevSameQuoteIdx;
        else heads.double = item.prevSameQuoteIdx;
      }
    }
    function addReplacement(replacements, tokenIdx, pos, ch) {
      if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
      replacements[tokenIdx].push({
        pos,
        ch
      });
    }
    function applyReplacements(str, replacements) {
      let result = "";
      let lastPos = 0;
      replacements.sort((a, b) => a.pos - b.pos);
      for (let i = 0; i < replacements.length; i++) {
        const replacement = replacements[i];
        result += str.slice(lastPos, replacement.pos) + replacement.ch;
        lastPos = replacement.pos + 1;
      }
      return result + str.slice(lastPos);
    }
    function process_inlines(tokens, state) {
      let j;
      const stack = [];
      const heads = {
        single: -1,
        double: -1
      };
      const replacements = {};
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const thisLevel = tokens[i].level;
        for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
        truncateStack(stack, heads, j + 1);
        if (token.type !== "text") continue;
        const text2 = token.content;
        let pos = 0;
        const max = text2.length;
        OUTER: while (pos < max) {
          QUOTE_RE.lastIndex = pos;
          const t = QUOTE_RE.exec(text2);
          if (!t) break;
          let canOpen = true;
          let canClose = true;
          pos = t.index + 1;
          const isSingle = t[0] === "'";
          let lastChar = 32;
          if (t.index - 1 >= 0) lastChar = text2.charCodeAt(t.index - 1);
          else for (j = i - 1; j >= 0; j--) {
            if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
            if (!tokens[j].content) continue;
            lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
            break;
          }
          let nextChar = 32;
          if (pos < max) nextChar = text2.charCodeAt(pos);
          else for (j = i + 1; j < tokens.length; j++) {
            if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
            if (!tokens[j].content) continue;
            nextChar = tokens[j].content.charCodeAt(0);
            break;
          }
          const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
          const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
          const isLastWhiteSpace = isWhiteSpace(lastChar);
          const isNextWhiteSpace = isWhiteSpace(nextChar);
          if (isNextWhiteSpace) canOpen = false;
          else if (isNextPunctChar) {
            if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
          }
          if (isLastWhiteSpace) canClose = false;
          else if (isLastPunctChar) {
            if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
          }
          if (nextChar === 34 && t[0] === '"') {
            if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
          }
          if (canOpen && canClose) {
            canOpen = isLastPunctChar;
            canClose = isNextPunctChar;
          }
          if (!canOpen && !canClose) {
            if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
            continue;
          }
          if (canClose) {
            j = isSingle ? heads.single : heads.double;
            if (j >= 0 && stack[j].level === thisLevel) {
              const item = stack[j];
              let openQuote;
              let closeQuote;
              if (isSingle) {
                openQuote = state.md.options.quotes[2];
                closeQuote = state.md.options.quotes[3];
              } else {
                openQuote = state.md.options.quotes[0];
                closeQuote = state.md.options.quotes[1];
              }
              addReplacement(replacements, i, t.index, closeQuote);
              addReplacement(replacements, item.tokenIdx, item.contentPos, openQuote);
              truncateStack(stack, heads, j);
              continue OUTER;
            }
          }
          if (canOpen) {
            if (stack.length >= MAX_OPENERS) return;
            stack.push({
              tokenIdx: i,
              contentPos: t.index,
              isSingleQuote: isSingle,
              level: thisLevel,
              prevSameQuoteIdx: isSingle ? heads.single : heads.double
            });
            if (isSingle) heads.single = stack.length - 1;
            else heads.double = stack.length - 1;
          } else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
        }
      }
      Object.keys(replacements).forEach(function(tokenIdx) {
        const idx = Number(tokenIdx);
        tokens[idx].content = applyReplacements(tokens[idx].content, replacements[tokenIdx]);
      });
    }
    function smartquotes(state) {
      if (!state.md.options.typographer) return;
      for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
        if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) continue;
        process_inlines(state.tokens[blkIdx].children, state);
      }
    }
    function join_alt(tokens) {
      let curr, last;
      const max = tokens.length;
      for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
      for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
      else {
        if (curr !== last) tokens[last] = tokens[curr];
        last++;
      }
      if (curr !== last) tokens.length = last;
    }
    function text_join(state) {
      let curr, last;
      const blockTokens = state.tokens;
      const l = blockTokens.length;
      for (let j = 0; j < l; j++) {
        if (blockTokens[j].type !== "inline") continue;
        const tokens = blockTokens[j].children;
        const max = tokens.length;
        for (curr = 0; curr < max; curr++) {
          if (tokens[curr].type === "text_special") tokens[curr].type = "text";
          if (tokens[curr].children) join_alt(tokens[curr].children);
        }
        for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
        else {
          if (curr !== last) tokens[last] = tokens[curr];
          last++;
        }
        if (curr !== last) tokens.length = last;
      }
    }
    var _rules$2 = [
      ["normalize", normalize],
      ["block", block],
      ["strip_references", strip_references],
      ["inline", inline],
      ["linkify", linkify$1],
      ["replacements", replace],
      ["smartquotes", smartquotes],
      ["text_join", text_join]
    ];
    var ParserCore = class {
      constructor() {
        _defineProperty(
          this,
          /**
          * {@link Ruler} instance. Keep configuration of core rules.
          */
          "ruler",
          new Ruler()
        );
        _defineProperty(this, "State", StateCore);
        for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
      }
      /**
      * Executes core chain rules.
      */
      process(state) {
        const rules = this.ruler.getRules("");
        for (let i = 0, l = rules.length; i < l; i++) rules[i](state);
      }
    };
    var StateBlock = class {
      constructor(src, md, env, tokens) {
        _defineProperty(this, "bMarks", []);
        _defineProperty(this, "eMarks", []);
        _defineProperty(this, "tShift", []);
        _defineProperty(this, "sCount", []);
        _defineProperty(this, "bsCount", []);
        _defineProperty(this, "blkIndent", 0);
        _defineProperty(this, "line", 0);
        _defineProperty(this, "lineMax", 0);
        _defineProperty(this, "tight", false);
        _defineProperty(this, "listIndent", -1);
        _defineProperty(this, "parentType", "root");
        _defineProperty(this, "level", 0);
        _defineProperty(this, "Token", Token);
        this.src = src;
        this.md = md;
        this.env = env;
        this.tokens = tokens;
        const s = this.src;
        for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
          const ch = s.charCodeAt(pos);
          if (!indent_found) {
            if (isSpace(ch)) {
              indent++;
              if (ch === 9) offset += 4 - offset % 4;
              else offset++;
              continue;
            } else indent_found = true;
          }
          if (ch === 10 || pos === len - 1) {
            if (ch !== 10) pos++;
            this.bMarks.push(start);
            this.eMarks.push(pos);
            this.tShift.push(indent);
            this.sCount.push(offset);
            this.bsCount.push(0);
            indent_found = false;
            indent = 0;
            offset = 0;
            start = pos + 1;
          }
        }
        this.bMarks.push(s.length);
        this.eMarks.push(s.length);
        this.tShift.push(0);
        this.sCount.push(0);
        this.bsCount.push(0);
        this.lineMax = this.bMarks.length - 1;
      }
      push(type, tag, nesting) {
        const token = new Token(type, tag, nesting);
        token.block = true;
        if (nesting < 0) this.level--;
        token.level = this.level;
        if (nesting > 0) this.level++;
        this.tokens.push(token);
        return token;
      }
      isEmpty(line) {
        return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
      }
      skipEmptyLines(from) {
        for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
        return from;
      }
      skipSpaces(pos) {
        for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
        return pos;
      }
      skipSpacesBack(pos, min) {
        if (pos <= min) return pos;
        while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
        return pos;
      }
      skipChars(pos, code2) {
        for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code2) break;
        return pos;
      }
      skipCharsBack(pos, code2, min) {
        if (pos <= min) return pos;
        while (pos > min) if (code2 !== this.src.charCodeAt(--pos)) return pos + 1;
        return pos;
      }
      getLines(begin, end, indent, keepLastLF) {
        if (begin >= end) return "";
        const queue = new Array(end - begin);
        for (let i = 0, line = begin; line < end; line++, i++) {
          let lineIndent = 0;
          const lineStart = this.bMarks[line];
          let first = lineStart;
          let last;
          if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
          else last = this.eMarks[line];
          while (first < last && lineIndent < indent) {
            const ch = this.src.charCodeAt(first);
            if (isSpace(ch)) {
              if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
              else lineIndent++;
            } else if (first - lineStart < this.tShift[line]) lineIndent++;
            else break;
            first++;
          }
          if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
          else queue[i] = this.src.slice(first, last);
        }
        return queue.join("");
      }
    };
    var MAX_AUTOCOMPLETED_CELLS = 65536;
    function getLine(state, line) {
      const pos = state.bMarks[line] + state.tShift[line];
      const max = state.eMarks[line];
      return state.src.slice(pos, max);
    }
    function escapedSplit(str) {
      const result = [];
      const max = str.length;
      let pos = 0;
      let ch = str.charCodeAt(pos);
      let isEscaped = false;
      let lastPos = 0;
      let current = "";
      while (pos < max) {
        if (ch === 124) {
          if (!isEscaped) {
            result.push(current + str.substring(lastPos, pos));
            current = "";
            lastPos = pos + 1;
          } else {
            current += str.substring(lastPos, pos - 1);
            lastPos = pos;
          }
        }
        isEscaped = ch === 92;
        pos++;
        ch = str.charCodeAt(pos);
      }
      result.push(current + str.substring(lastPos));
      return result;
    }
    function table(state, startLine, endLine, silent) {
      if (startLine + 2 > endLine) return false;
      let nextLine = startLine + 1;
      if (state.sCount[nextLine] < state.blkIndent) return false;
      if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
      let pos = state.bMarks[nextLine] + state.tShift[nextLine];
      if (pos >= state.eMarks[nextLine]) return false;
      const firstCh = state.src.charCodeAt(pos++);
      if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
      if (pos >= state.eMarks[nextLine]) return false;
      const secondCh = state.src.charCodeAt(pos++);
      if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
      if (firstCh === 45 && isSpace(secondCh)) return false;
      while (pos < state.eMarks[nextLine]) {
        const ch = state.src.charCodeAt(pos);
        if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
        pos++;
      }
      let lineText = getLine(state, startLine + 1);
      let columns = lineText.split("|");
      const aligns = [];
      for (let i = 0; i < columns.length; i++) {
        const t = columns[i].trim();
        if (!t) {
          if (i === 0 || i === columns.length - 1) continue;
          else return false;
        }
        if (!/^:?-+:?$/.test(t)) return false;
        if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
        else if (t.charCodeAt(0) === 58) aligns.push("left");
        else aligns.push("");
      }
      lineText = getLine(state, startLine).trim();
      if (lineText.indexOf("|") === -1) return false;
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      columns = escapedSplit(lineText);
      if (columns.length && columns[0] === "") columns.shift();
      if (columns.length && columns[columns.length - 1] === "") columns.pop();
      const columnCount = columns.length;
      if (columnCount === 0 || columnCount !== aligns.length) return false;
      if (silent) return true;
      const oldParentType = state.parentType;
      state.parentType = "table";
      const terminatorRules = state.md.block.ruler.getRules("blockquote");
      const token_to = state.push("table_open", "table", 1);
      const tableLines = [startLine, 0];
      token_to.map = tableLines;
      const token_tho = state.push("thead_open", "thead", 1);
      token_tho.map = [startLine, startLine + 1];
      const token_htro = state.push("tr_open", "tr", 1);
      token_htro.map = [startLine, startLine + 1];
      for (let i = 0; i < columns.length; i++) {
        const token_ho = state.push("th_open", "th", 1);
        if (aligns[i]) token_ho.attrs = [["style", `text-align:${aligns[i]}`]];
        const token_il = state.push("inline", "", 0);
        token_il.content = columns[i].trim();
        token_il.children = [];
        state.push("th_close", "th", -1);
      }
      state.push("tr_close", "tr", -1);
      state.push("thead_close", "thead", -1);
      let tbodyLines;
      let autocompletedCells = 0;
      for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
        if (state.sCount[nextLine] < state.blkIndent) break;
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        if (terminate) break;
        lineText = getLine(state, nextLine).trim();
        if (!lineText) break;
        if (state.sCount[nextLine] - state.blkIndent >= 4) break;
        columns = escapedSplit(lineText);
        if (columns.length && columns[0] === "") columns.shift();
        if (columns.length && columns[columns.length - 1] === "") columns.pop();
        autocompletedCells += columnCount - columns.length;
        if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
        if (nextLine === startLine + 2) {
          const token_tbo = state.push("tbody_open", "tbody", 1);
          token_tbo.map = tbodyLines = [startLine + 2, 0];
        }
        const token_tro = state.push("tr_open", "tr", 1);
        token_tro.map = [nextLine, nextLine + 1];
        for (let i = 0; i < columnCount; i++) {
          const token_tdo = state.push("td_open", "td", 1);
          if (aligns[i]) token_tdo.attrs = [["style", `text-align:${aligns[i]}`]];
          const token_il = state.push("inline", "", 0);
          token_il.content = columns[i] ? columns[i].trim() : "";
          token_il.children = [];
          state.push("td_close", "td", -1);
        }
        state.push("tr_close", "tr", -1);
      }
      if (tbodyLines) {
        state.push("tbody_close", "tbody", -1);
        tbodyLines[1] = nextLine;
      }
      state.push("table_close", "table", -1);
      tableLines[1] = nextLine;
      state.parentType = oldParentType;
      state.line = nextLine;
      return true;
    }
    function code(state, startLine, endLine) {
      if (state.sCount[startLine] - state.blkIndent < 4) return false;
      let nextLine = startLine + 1;
      let last = nextLine;
      while (nextLine < endLine) {
        if (state.isEmpty(nextLine)) {
          nextLine++;
          continue;
        }
        if (state.sCount[nextLine] - state.blkIndent >= 4) {
          nextLine++;
          last = nextLine;
          continue;
        }
        break;
      }
      state.line = last;
      const token = state.push("code_block", "code", 0);
      token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
      token.map = [startLine, state.line];
      return true;
    }
    function fence(state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      if (pos + 3 > max) return false;
      const marker = state.src.charCodeAt(pos);
      if (marker !== 126 && marker !== 96) return false;
      let mem = pos;
      pos = state.skipChars(pos, marker);
      let len = pos - mem;
      if (len < 3) return false;
      const markup = state.src.slice(mem, pos);
      const params = state.src.slice(pos, max);
      if (marker === 96) {
        if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
      }
      if (silent) return true;
      let nextLine = startLine;
      let haveEndMarker = false;
      for (; ; ) {
        nextLine++;
        if (nextLine >= endLine) break;
        pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
        if (state.src.charCodeAt(pos) !== marker) continue;
        if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
        pos = state.skipChars(pos, marker);
        if (pos - mem < len) continue;
        pos = state.skipSpaces(pos);
        if (pos < max) continue;
        haveEndMarker = true;
        break;
      }
      len = state.sCount[startLine];
      state.line = nextLine + (haveEndMarker ? 1 : 0);
      const token = state.push("fence", "code", 0);
      token.info = params;
      token.content = state.getLines(startLine + 1, nextLine, len, true);
      token.markup = markup;
      token.map = [startLine, state.line];
      return true;
    }
    function blockquote(state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];
      const oldLineMax = state.lineMax;
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      if (state.src.charCodeAt(pos) !== 62) return false;
      if (silent) return true;
      const oldBMarks = [];
      const oldBSCount = [];
      const oldSCount = [];
      const oldTShift = [];
      const terminatorRules = state.md.block.ruler.getRules("blockquote");
      const oldParentType = state.parentType;
      state.parentType = "blockquote";
      let lastLineEmpty = false;
      let nextLine;
      for (nextLine = startLine; nextLine < endLine; nextLine++) {
        const isOutdented = state.sCount[nextLine] < state.blkIndent;
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        if (pos >= max) break;
        if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
          let initial = state.sCount[nextLine] + 1;
          let spaceAfterMarker;
          let adjustTab;
          if (state.src.charCodeAt(pos) === 32) {
            pos++;
            initial++;
            adjustTab = false;
            spaceAfterMarker = true;
          } else if (state.src.charCodeAt(pos) === 9) {
            spaceAfterMarker = true;
            if ((state.bsCount[nextLine] + initial) % 4 === 3) {
              pos++;
              initial++;
              adjustTab = false;
            } else adjustTab = true;
          } else spaceAfterMarker = false;
          let offset = initial;
          oldBMarks.push(state.bMarks[nextLine]);
          state.bMarks[nextLine] = pos;
          while (pos < max) {
            const ch = state.src.charCodeAt(pos);
            if (isSpace(ch)) {
              if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
              else offset++;
            } else break;
            pos++;
          }
          lastLineEmpty = pos >= max;
          oldBSCount.push(state.bsCount[nextLine]);
          state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
          oldSCount.push(state.sCount[nextLine]);
          state.sCount[nextLine] = offset - initial;
          oldTShift.push(state.tShift[nextLine]);
          state.tShift[nextLine] = pos - state.bMarks[nextLine];
          continue;
        }
        if (lastLineEmpty) break;
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        if (terminate) {
          state.lineMax = nextLine;
          if (state.blkIndent !== 0) {
            oldBMarks.push(state.bMarks[nextLine]);
            oldBSCount.push(state.bsCount[nextLine]);
            oldTShift.push(state.tShift[nextLine]);
            oldSCount.push(state.sCount[nextLine]);
            state.sCount[nextLine] -= state.blkIndent;
          }
          break;
        }
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] = -1;
      }
      const oldIndent = state.blkIndent;
      state.blkIndent = 0;
      const token_o = state.push("blockquote_open", "blockquote", 1);
      token_o.markup = ">";
      const lines = [startLine, 0];
      token_o.map = lines;
      state.md.block.tokenize(state, startLine, nextLine);
      const token_c = state.push("blockquote_close", "blockquote", -1);
      token_c.markup = ">";
      state.lineMax = oldLineMax;
      state.parentType = oldParentType;
      lines[1] = state.line;
      for (let i = 0; i < oldTShift.length; i++) {
        state.bMarks[i + startLine] = oldBMarks[i];
        state.tShift[i + startLine] = oldTShift[i];
        state.sCount[i + startLine] = oldSCount[i];
        state.bsCount[i + startLine] = oldBSCount[i];
      }
      state.blkIndent = oldIndent;
      return true;
    }
    function hr(state, startLine, endLine, silent) {
      const max = state.eMarks[startLine];
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      const marker = state.src.charCodeAt(pos++);
      if (marker !== 42 && marker !== 45 && marker !== 95) return false;
      let cnt = 1;
      while (pos < max) {
        const ch = state.src.charCodeAt(pos++);
        if (ch !== marker && !isSpace(ch)) return false;
        if (ch === marker) cnt++;
      }
      if (cnt < 3) return false;
      if (silent) return true;
      state.line = startLine + 1;
      const token = state.push("hr", "hr", 0);
      token.map = [startLine, state.line];
      token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
      return true;
    }
    function skipBulletListMarker(state, startLine) {
      const max = state.eMarks[startLine];
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      const marker = state.src.charCodeAt(pos++);
      if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
      if (pos < max) {
        if (!isSpace(state.src.charCodeAt(pos))) return -1;
      }
      return pos;
    }
    function skipOrderedListMarker(state, startLine) {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      let pos = start;
      if (pos + 1 >= max) return -1;
      let ch = state.src.charCodeAt(pos++);
      if (ch < 48 || ch > 57) return -1;
      for (; ; ) {
        if (pos >= max) return -1;
        ch = state.src.charCodeAt(pos++);
        if (ch >= 48 && ch <= 57) {
          if (pos - start >= 10) return -1;
          continue;
        }
        if (ch === 41 || ch === 46) break;
        return -1;
      }
      if (pos < max) {
        ch = state.src.charCodeAt(pos);
        if (!isSpace(ch)) return -1;
      }
      return pos;
    }
    function markTightParagraphs(state, idx) {
      const level = state.level + 2;
      for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
        state.tokens[i + 2].hidden = true;
        state.tokens[i].hidden = true;
        i += 2;
      }
    }
    function list(state, startLine, endLine, silent) {
      let max, pos, start, token;
      let nextLine = startLine;
      let tight = true;
      if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
      if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) return false;
      let isTerminatingParagraph = false;
      if (silent && state.parentType === "paragraph") {
        if (state.sCount[nextLine] >= state.blkIndent) isTerminatingParagraph = true;
      }
      let isOrdered;
      let markerValue;
      let posAfterMarker;
      if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
        isOrdered = true;
        start = state.bMarks[nextLine] + state.tShift[nextLine];
        markerValue = Number(state.src.slice(start, posAfterMarker - 1));
        if (isTerminatingParagraph && markerValue !== 1) return false;
      } else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) isOrdered = false;
      else return false;
      if (isTerminatingParagraph) {
        if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
      }
      if (silent) return true;
      const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
      const listTokIdx = state.tokens.length;
      if (isOrdered) {
        token = state.push("ordered_list_open", "ol", 1);
        if (markerValue !== 1) token.attrs = [["start", markerValue]];
      } else token = state.push("bullet_list_open", "ul", 1);
      const listLines = [nextLine, 0];
      token.map = listLines;
      token.markup = String.fromCharCode(markerCharCode);
      let prevEmptyEnd = false;
      const terminatorRules = state.md.block.ruler.getRules("list");
      const oldParentType = state.parentType;
      state.parentType = "list";
      while (nextLine < endLine) {
        pos = posAfterMarker;
        max = state.eMarks[nextLine];
        const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
        let offset = initial;
        while (pos < max) {
          const ch = state.src.charCodeAt(pos);
          if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine]) % 4;
          else if (ch === 32) offset++;
          else break;
          pos++;
        }
        const contentStart = pos;
        let indentAfterMarker;
        if (contentStart >= max) indentAfterMarker = 1;
        else indentAfterMarker = offset - initial;
        if (indentAfterMarker > 4) indentAfterMarker = 1;
        const indent = initial + indentAfterMarker;
        token = state.push("list_item_open", "li", 1);
        token.markup = String.fromCharCode(markerCharCode);
        const itemLines = [nextLine, 0];
        token.map = itemLines;
        if (isOrdered) token.info = state.src.slice(start, posAfterMarker - 1);
        const oldTight = state.tight;
        const oldTShift = state.tShift[nextLine];
        const oldSCount = state.sCount[nextLine];
        const oldListIndent = state.listIndent;
        state.listIndent = state.blkIndent;
        state.blkIndent = indent;
        state.tight = true;
        state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
        state.sCount[nextLine] = offset;
        if (contentStart >= max && state.isEmpty(nextLine + 1)) state.line = Math.min(state.line + 2, endLine);
        else state.md.block.tokenize(state, nextLine, endLine);
        if (!state.tight || prevEmptyEnd) tight = false;
        prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
        state.blkIndent = state.listIndent;
        state.listIndent = oldListIndent;
        state.tShift[nextLine] = oldTShift;
        state.sCount[nextLine] = oldSCount;
        state.tight = oldTight;
        token = state.push("list_item_close", "li", -1);
        token.markup = String.fromCharCode(markerCharCode);
        nextLine = state.line;
        itemLines[1] = nextLine;
        if (nextLine >= endLine) break;
        if (state.sCount[nextLine] < state.blkIndent) break;
        if (state.sCount[nextLine] - state.blkIndent >= 4) break;
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        if (terminate) break;
        if (isOrdered) {
          posAfterMarker = skipOrderedListMarker(state, nextLine);
          if (posAfterMarker < 0) break;
          start = state.bMarks[nextLine] + state.tShift[nextLine];
        } else {
          posAfterMarker = skipBulletListMarker(state, nextLine);
          if (posAfterMarker < 0) break;
        }
        if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) break;
      }
      if (isOrdered) token = state.push("ordered_list_close", "ol", -1);
      else token = state.push("bullet_list_close", "ul", -1);
      token.markup = String.fromCharCode(markerCharCode);
      listLines[1] = nextLine;
      state.line = nextLine;
      state.parentType = oldParentType;
      if (tight) markTightParagraphs(state, listTokIdx);
      return true;
    }
    var MAX_LABEL_LENGTH = 999;
    function countCodePoints(str) {
      let length = str.length;
      for (let i = 0; i < str.length - 1; i++) {
        const high = str.charCodeAt(i);
        if (high < 55296 || high > 56319) continue;
        const low = str.charCodeAt(i + 1);
        if (low >= 56320 && low <= 57343) {
          length--;
          i++;
        }
      }
      return length;
    }
    function lineEnd(state, line) {
      return Math.min(state.eMarks[line] + 1, state.src.length);
    }
    function getNextLinePos(state, nextLine) {
      const endLine = state.lineMax;
      if (nextLine >= endLine || state.isEmpty(nextLine)) return -1;
      let isContinuation = false;
      if (state.sCount[nextLine] - state.blkIndent > 3) isContinuation = true;
      if (state.sCount[nextLine] < 0) isContinuation = true;
      if (!isContinuation) {
        const terminatorRules = state.md.block.ruler.getRules("reference");
        const oldParentType = state.parentType;
        state.parentType = "reference";
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        state.parentType = oldParentType;
        if (terminate) return -1;
      }
      return state.bMarks[nextLine] + state.tShift[nextLine];
    }
    function reference(state, startLine, _endLine, silent) {
      const src = state.src;
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let nextLine = startLine + 1;
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      if (src.charCodeAt(pos) !== 91) return false;
      let max = lineEnd(state, startLine);
      let rawLabel = "";
      let labelEnd = -1;
      let segmentStart = ++pos;
      while (pos < max) {
        if (rawLabel.length + pos - segmentStart > MAX_LABEL_LENGTH * 2) return false;
        let ch = src.charCodeAt(pos);
        if (ch === 91) return false;
        if (ch === 93) {
          labelEnd = pos;
          break;
        }
        if (ch === 92) ch = src.charCodeAt(++pos);
        if (ch === 10 && pos < max) {
          const nextPos = getNextLinePos(state, nextLine);
          if (nextPos < 0) return false;
          rawLabel += src.slice(segmentStart, max);
          pos = segmentStart = nextPos;
          max = lineEnd(state, nextLine++);
          continue;
        }
        pos++;
      }
      if (labelEnd < 0 || src.charCodeAt(labelEnd + 1) !== 58) return false;
      rawLabel += src.slice(segmentStart, labelEnd);
      if (rawLabel.length > MAX_LABEL_LENGTH && countCodePoints(rawLabel) > MAX_LABEL_LENGTH) return false;
      pos = labelEnd + 2;
      while (pos < max) {
        const ch = src.charCodeAt(pos);
        if (ch === 10) {
          const nextPos = getNextLinePos(state, nextLine);
          if (nextPos < 0) break;
          pos = nextPos;
          max = lineEnd(state, nextLine++);
        } else if (isSpace(ch)) pos++;
        else break;
      }
      const destRes = state.md.helpers.parseLinkDestination(src, pos, max);
      if (!destRes.ok) return false;
      const href = state.md.normalizeLink(destRes.str);
      if (!state.md.validateLink(href)) return false;
      pos = destRes.pos;
      const destEndPos = pos;
      const destEndMax = max;
      const destEndLineNo = nextLine;
      while (pos < max) {
        const ch = src.charCodeAt(pos);
        if (ch === 10) {
          const nextPos = getNextLinePos(state, nextLine);
          if (nextPos < 0) break;
          pos = nextPos;
          max = lineEnd(state, nextLine++);
        } else if (isSpace(ch)) pos++;
        else break;
      }
      const titleStart = pos;
      let titleRes = state.md.helpers.parseLinkTitle(src, pos, max);
      while (titleRes.can_continue) {
        const nextPos = getNextLinePos(state, nextLine);
        if (nextPos < 0) break;
        pos = nextPos;
        max = lineEnd(state, nextLine++);
        titleRes = state.md.helpers.parseLinkTitle(src, pos, max, titleRes);
      }
      let title;
      if (titleStart !== destEndPos && titleRes.ok) {
        title = titleRes.str;
        pos = titleRes.pos;
      } else {
        title = "";
        pos = destEndPos;
        max = destEndMax;
        nextLine = destEndLineNo;
      }
      while (pos < max) {
        if (!isSpace(src.charCodeAt(pos))) break;
        pos++;
      }
      if (pos < max && src.charCodeAt(pos) !== 10) {
        if (title) {
          title = "";
          pos = destEndPos;
          max = destEndMax;
          nextLine = destEndLineNo;
          while (pos < max) {
            if (!isSpace(src.charCodeAt(pos))) break;
            pos++;
          }
        }
      }
      if (pos < max && src.charCodeAt(pos) !== 10) return false;
      const label = normalizeReference(rawLabel);
      if (!label) return false;
      if (silent) return true;
      if (typeof state.env.references === "undefined") state.env.references = {};
      if (typeof state.env.references[label] === "undefined") state.env.references[label] = {
        title,
        href
      };
      const token = state.push("reference_definition", "", 0);
      token.map = [startLine, nextLine];
      token.hidden = true;
      const meta = /* @__PURE__ */ Object.create(null);
      meta.label = label;
      token.meta = meta;
      state.line = nextLine;
      return true;
    }
    var html_blocks_default = [
      "address",
      "article",
      "aside",
      "base",
      "basefont",
      "blockquote",
      "body",
      "caption",
      "center",
      "col",
      "colgroup",
      "dd",
      "details",
      "dialog",
      "dir",
      "div",
      "dl",
      "dt",
      "fieldset",
      "figcaption",
      "figure",
      "footer",
      "form",
      "frame",
      "frameset",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "head",
      "header",
      "hr",
      "html",
      "iframe",
      "legend",
      "li",
      "link",
      "main",
      "menu",
      "menuitem",
      "nav",
      "noframes",
      "ol",
      "optgroup",
      "option",
      "p",
      "param",
      "search",
      "section",
      "summary",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "title",
      "tr",
      "track",
      "ul"
    ];
    var open_tag = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
    var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
    new RegExp(`^(?:${open_tag}|${close_tag}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
    var HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag})`);
    var HTML_SEQUENCES = [
      [
        /^<(script|pre|style|textarea)(?=(\s|>|$))/i,
        /<\/(script|pre|style|textarea)>/i,
        true
      ],
      [
        /^<!--/,
        /-->/,
        true
      ],
      [
        /^<\?/,
        /\?>/,
        true
      ],
      [
        /^<![A-Za-z]/,
        />/,
        true
      ],
      [
        /^<!\[CDATA\[/,
        /\]\]>/,
        true
      ],
      [
        new RegExp(`^</?(${html_blocks_default.join("|")})(?=(\\s|/?>|$))`, "i"),
        /^$/,
        true
      ],
      [
        new RegExp(`${HTML_OPEN_CLOSE_TAG_RE.source}\\s*$`),
        /^$/,
        false
      ]
    ];
    function html_block(state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      if (!state.md.options.html) return false;
      if (state.src.charCodeAt(pos) !== 60) return false;
      let lineText = state.src.slice(pos, max);
      let i = 0;
      for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
      if (i === HTML_SEQUENCES.length) return false;
      if (silent) return HTML_SEQUENCES[i][2];
      let nextLine = startLine + 1;
      const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
      if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
        if (state.sCount[nextLine] < state.blkIndent) {
          if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
        }
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);
        if (HTML_SEQUENCES[i][1].test(lineText)) {
          if (lineText.length !== 0) nextLine++;
          break;
        }
      }
      state.line = nextLine;
      const token = state.push("html_block", "", 0);
      token.map = [startLine, nextLine];
      token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
      return true;
    }
    function heading(state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      let ch = state.src.charCodeAt(pos);
      if (ch !== 35 || pos >= max) return false;
      let level = 1;
      ch = state.src.charCodeAt(++pos);
      while (ch === 35 && pos < max && level <= 6) {
        level++;
        ch = state.src.charCodeAt(++pos);
      }
      if (level > 6 || pos < max && !isSpace(ch)) return false;
      if (silent) return true;
      max = state.skipSpacesBack(max, pos);
      const tmp = state.skipCharsBack(max, 35, pos);
      if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) max = tmp;
      state.line = startLine + 1;
      const token_o = state.push("heading_open", `h${level}`, 1);
      token_o.markup = "########".slice(0, level);
      token_o.map = [startLine, state.line];
      const token_i = state.push("inline", "", 0);
      token_i.content = asciiTrim(state.src.slice(pos, max));
      token_i.map = [startLine, state.line];
      token_i.children = [];
      const token_c = state.push("heading_close", `h${level}`, -1);
      token_c.markup = "########".slice(0, level);
      return true;
    }
    function lheading(state, startLine, endLine) {
      const terminatorRules = state.md.block.ruler.getRules("paragraph");
      if (state.sCount[startLine] - state.blkIndent >= 4) return false;
      const oldParentType = state.parentType;
      state.parentType = "paragraph";
      let level = 0;
      let marker;
      let nextLine = startLine + 1;
      for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
        if (state.sCount[nextLine] - state.blkIndent > 3) continue;
        if (state.sCount[nextLine] >= state.blkIndent) {
          let pos = state.bMarks[nextLine] + state.tShift[nextLine];
          const max = state.eMarks[nextLine];
          if (pos < max) {
            marker = state.src.charCodeAt(pos);
            if (marker === 45 || marker === 61) {
              pos = state.skipChars(pos, marker);
              pos = state.skipSpaces(pos);
              if (pos >= max) {
                level = marker === 61 ? 1 : 2;
                break;
              }
            }
          }
        }
        if (state.sCount[nextLine] < 0) continue;
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        if (terminate) break;
      }
      if (!level) {
        state.parentType = oldParentType;
        return false;
      }
      const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
      state.line = nextLine + 1;
      const token_o = state.push("heading_open", `h${level}`, 1);
      token_o.markup = String.fromCharCode(marker);
      token_o.map = [startLine, state.line];
      const token_i = state.push("inline", "", 0);
      token_i.content = content;
      token_i.map = [startLine, state.line - 1];
      token_i.children = [];
      const token_c = state.push("heading_close", `h${level}`, -1);
      token_c.markup = String.fromCharCode(marker);
      state.parentType = oldParentType;
      return true;
    }
    function paragraph(state, startLine, endLine) {
      const terminatorRules = state.md.block.ruler.getRules("paragraph");
      const oldParentType = state.parentType;
      let nextLine = startLine + 1;
      state.parentType = "paragraph";
      for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
        if (state.sCount[nextLine] - state.blkIndent > 3) continue;
        if (state.sCount[nextLine] < 0) continue;
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
        if (terminate) break;
      }
      const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
      state.line = nextLine;
      const token_o = state.push("paragraph_open", "p", 1);
      token_o.map = [startLine, state.line];
      const token_i = state.push("inline", "", 0);
      token_i.content = content;
      token_i.map = [startLine, state.line];
      token_i.children = [];
      state.push("paragraph_close", "p", -1);
      state.parentType = oldParentType;
      return true;
    }
    var _rules$1 = [
      [
        "table",
        table,
        ["paragraph", "reference"]
      ],
      ["code", code],
      [
        "fence",
        fence,
        [
          "paragraph",
          "reference",
          "blockquote",
          "list"
        ]
      ],
      [
        "blockquote",
        blockquote,
        [
          "paragraph",
          "reference",
          "blockquote",
          "list"
        ]
      ],
      [
        "hr",
        hr,
        [
          "paragraph",
          "reference",
          "blockquote",
          "list"
        ]
      ],
      [
        "list",
        list,
        [
          "paragraph",
          "reference",
          "blockquote"
        ]
      ],
      ["reference", reference],
      [
        "html_block",
        html_block,
        [
          "paragraph",
          "reference",
          "blockquote"
        ]
      ],
      [
        "heading",
        heading,
        [
          "paragraph",
          "reference",
          "blockquote"
        ]
      ],
      ["lheading", lheading],
      ["paragraph", paragraph]
    ];
    var ParserBlock = class {
      constructor() {
        _defineProperty(
          this,
          /**
          * {@link Ruler} instance. Keep configuration of block rules.
          */
          "ruler",
          new Ruler()
        );
        _defineProperty(this, "State", StateBlock);
        for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
      }
      tokenize(state, startLine, endLine) {
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const maxNesting = state.md.options.maxNesting;
        let line = startLine;
        let hasEmptyLines = false;
        while (line < endLine) {
          state.line = line = state.skipEmptyLines(line);
          if (line >= endLine) break;
          if (state.sCount[line] < state.blkIndent) break;
          if (state.level >= maxNesting) {
            state.line = endLine;
            break;
          }
          const prevLine = state.line;
          let ok = false;
          for (let i = 0; i < len; i++) {
            ok = rules[i](state, line, endLine, false);
            if (ok) {
              if (prevLine >= state.line) throw new Error("block rule didn't increment state.line");
              break;
            }
          }
          if (!ok) throw new Error("none of the block rules matched");
          state.tight = !hasEmptyLines;
          if (state.isEmpty(state.line - 1)) hasEmptyLines = true;
          line = state.line;
          if (line < endLine && state.isEmpty(line)) {
            hasEmptyLines = true;
            line++;
            state.line = line;
          }
        }
      }
      /**
      * Process input string and push block tokens into `outTokens`
      */
      parse(src, md, env, outTokens) {
        if (!src) return;
        const state = new this.State(src, md, env, outTokens);
        this.tokenize(state, state.line, state.lineMax);
      }
    };
    var StateInline = class {
      constructor(src, md, env, outTokens) {
        _defineProperty(this, "pos", 0);
        _defineProperty(this, "level", 0);
        _defineProperty(this, "pending", "");
        _defineProperty(this, "pendingLevel", 0);
        _defineProperty(this, "cache", {});
        _defineProperty(this, "backticks", {});
        _defineProperty(this, "backticksScanned", false);
        _defineProperty(this, "skipHtmlSpecial", false);
        _defineProperty(this, "linkLevel", 0);
        _defineProperty(this, "delimiters", []);
        _defineProperty(this, "_prev_delimiters", []);
        _defineProperty(this, "Token", Token);
        this.src = src;
        this.env = env;
        this.md = md;
        this.tokens = outTokens;
        this.tokens_meta = Array(outTokens.length);
        this.posMax = this.src.length;
      }
      pushPending() {
        const token = new Token("text", "", 0);
        token.content = this.pending;
        token.level = this.pendingLevel;
        this.tokens.push(token);
        this.pending = "";
        return token;
      }
      push(type, tag, nesting) {
        if (this.pending) this.pushPending();
        const token = new Token(type, tag, nesting);
        let token_meta = void 0;
        if (nesting < 0) {
          this.level--;
          this.delimiters = this._prev_delimiters.pop();
        }
        token.level = this.level;
        if (nesting > 0) {
          this.level++;
          this._prev_delimiters.push(this.delimiters);
          this.delimiters = [];
          token_meta = { delimiters: this.delimiters };
        }
        this.pendingLevel = this.level;
        this.tokens.push(token);
        this.tokens_meta.push(token_meta);
        return token;
      }
      scanDelims(start, canSplitWord) {
        const max = this.posMax;
        const marker = this.src.charCodeAt(start);
        let lastChar;
        if (start === 0) lastChar = 32;
        else if (start === 1) {
          lastChar = this.src.charCodeAt(0);
          if ((lastChar & 63488) === 55296) lastChar = 65533;
        } else {
          lastChar = this.src.charCodeAt(start - 1);
          if ((lastChar & 64512) === 56320) {
            const highSurr = this.src.charCodeAt(start - 2);
            lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
          } else if ((lastChar & 64512) === 55296) lastChar = 65533;
        }
        let pos = start;
        while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
        const count = pos - start;
        let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
        if ((nextChar & 64512) === 55296) {
          const lowSurr = this.src.charCodeAt(pos + 1);
          nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
        } else if ((nextChar & 64512) === 56320) nextChar = 65533;
        const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
        const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
        const isLastWhiteSpace = isWhiteSpace(lastChar);
        const isNextWhiteSpace = isWhiteSpace(nextChar);
        const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
        const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
        return {
          can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
          can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
          length: count
        };
      }
    };
    function isTerminatorChar(ch) {
      switch (ch) {
        case 10:
        case 33:
        case 35:
        case 36:
        case 37:
        case 38:
        case 42:
        case 43:
        case 45:
        case 58:
        case 60:
        case 61:
        case 62:
        case 64:
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:
        case 96:
        case 123:
        case 125:
        case 126:
          return true;
        default:
          return false;
      }
    }
    function text(state, silent) {
      let pos = state.pos;
      while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) pos++;
      if (pos === state.pos) return false;
      if (!silent) state.pending += state.src.slice(state.pos, pos);
      state.pos = pos;
      return true;
    }
    function isAsciiAlpha(code2) {
      return code2 >= 65 && code2 <= 90 || code2 >= 97 && code2 <= 122;
    }
    function isSchemeChar(code2) {
      return code2 >= 65 && code2 <= 90 || code2 >= 97 && code2 <= 122 || code2 >= 48 && code2 <= 57 || code2 === 43 || code2 === 45 || code2 === 46;
    }
    function linkify(state, silent) {
      if (!state.md.options.linkify) return false;
      if (state.linkLevel > 0) return false;
      const pos = state.pos;
      const max = state.posMax;
      if (pos + 3 > max) return false;
      if (state.src.charCodeAt(pos) !== 58) return false;
      if (state.src.charCodeAt(pos + 1) !== 47) return false;
      if (state.src.charCodeAt(pos + 2) !== 47) return false;
      const protoMin = pos - Math.min(10, state.pending.length, pos);
      let protoStart = pos;
      while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) protoStart--;
      if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;
      const protoLength = pos - protoStart;
      const link2 = state.md.linkify.matchAtStart(state.src.slice(protoStart));
      if (!link2) return false;
      let url = link2.url;
      if (url.length <= protoLength) return false;
      let urlEnd = url.length;
      while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
      if (urlEnd !== url.length) url = url.slice(0, urlEnd);
      const fullUrl = state.md.normalizeLink(url);
      if (!state.md.validateLink(fullUrl)) return false;
      if (!silent) {
        state.pending = state.pending.slice(0, -protoLength);
        const token_o = state.push("link_open", "a", 1);
        token_o.attrs = [["href", fullUrl]];
        token_o.markup = "linkify";
        token_o.info = "auto";
        const token_t = state.push("text", "", 0);
        token_t.content = state.md.normalizeLinkText(url);
        const token_c = state.push("link_close", "a", -1);
        token_c.markup = "linkify";
        token_c.info = "auto";
      }
      state.pos += url.length - protoLength;
      return true;
    }
    function newline(state, silent) {
      let pos = state.pos;
      if (state.src.charCodeAt(pos) !== 10) return false;
      const pmax = state.pending.length - 1;
      const max = state.posMax;
      if (!silent) {
        if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
          if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
            let ws = pmax - 1;
            while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
            state.pending = state.pending.slice(0, ws);
            state.push("hardbreak", "br", 0);
          } else {
            state.pending = state.pending.slice(0, -1);
            state.push("softbreak", "br", 0);
          }
        } else state.push("softbreak", "br", 0);
      }
      pos++;
      while (pos < max && isSpace(state.src.charCodeAt(pos))) pos++;
      state.pos = pos;
      return true;
    }
    var ESCAPED = [];
    for (let i = 0; i < 256; i++) ESCAPED.push(0);
    "\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
      ESCAPED[ch.charCodeAt(0)] = 1;
    });
    function escape(state, silent) {
      let pos = state.pos;
      const max = state.posMax;
      if (state.src.charCodeAt(pos) !== 92) return false;
      pos++;
      if (pos >= max) return false;
      let ch1 = state.src.charCodeAt(pos);
      if (ch1 === 10) {
        if (!silent) state.push("hardbreak", "br", 0);
        pos++;
        while (pos < max) {
          ch1 = state.src.charCodeAt(pos);
          if (!isSpace(ch1)) break;
          pos++;
        }
        state.pos = pos;
        return true;
      }
      if (ch1 === 32) {
        if (!silent) {
          const token = state.push("text_special", "", 0);
          token.content = "\\";
          token.markup = "\\";
          token.info = "escape";
        }
        state.pos = pos;
        return true;
      }
      let escapedStr = state.src[pos];
      if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
        const ch2 = state.src.charCodeAt(pos + 1);
        if (ch2 >= 56320 && ch2 <= 57343) {
          escapedStr += state.src[pos + 1];
          pos++;
        }
      }
      const origStr = "\\" + escapedStr;
      if (!silent) {
        const token = state.push("text_special", "", 0);
        if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
        else token.content = origStr;
        token.markup = origStr;
        token.info = "escape";
      }
      state.pos = pos + 1;
      return true;
    }
    function buildLastRuns(src) {
      const lastRuns = {};
      let pos = 0;
      while ((pos = src.indexOf("`", pos)) !== -1) {
        const start = pos;
        while (src.charCodeAt(++pos) === 96) ;
        lastRuns[pos - start] = start;
      }
      return lastRuns;
    }
    function backtick(state, silent) {
      var _state$backticks$open;
      const start = state.pos;
      if (state.src.charCodeAt(start) !== 96) return false;
      const max = state.posMax;
      let pos = start + 1;
      while (pos < max && state.src.charCodeAt(pos) === 96) pos++;
      const marker = state.src.slice(start, pos);
      const openerLength = marker.length;
      if (!state.backticksScanned) {
        state.backticks = buildLastRuns(state.src);
        state.backticksScanned = true;
      }
      if (((_state$backticks$open = state.backticks[openerLength]) !== null && _state$backticks$open !== void 0 ? _state$backticks$open : -1) >= pos) {
        let matchEnd = pos;
        let matchStart;
        while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1 && matchStart < max) {
          matchEnd = matchStart + 1;
          while (state.src.charCodeAt(matchEnd) === 96) matchEnd++;
          if (matchEnd > max) break;
          if (matchEnd - matchStart === openerLength) {
            if (!silent) {
              const token = state.push("code_inline", "code", 0);
              token.markup = marker;
              let content = state.src.slice(pos, matchStart).replace(/\n/g, " ");
              if (content.startsWith(" ") && content.endsWith(" ") && /[^ ]/.test(content)) content = content.slice(1, -1);
              token.content = content;
            }
            state.pos = matchEnd;
            return true;
          }
        }
      }
      if (!silent) state.pending += marker;
      state.pos = pos;
      return true;
    }
    function strikethrough_tokenize(state, silent) {
      const start = state.pos;
      const marker = state.src.charCodeAt(start);
      if (silent) return false;
      if (marker !== 126) return false;
      const scanned = state.scanDelims(state.pos, true);
      let len = scanned.length;
      const ch = String.fromCharCode(marker);
      if (len < 2) return false;
      let token;
      if (len % 2) {
        token = state.push("text", "", 0);
        token.content = ch;
        len--;
      }
      for (let i = 0; i < len; i += 2) {
        token = state.push("text", "", 0);
        token.content = ch + ch;
        state.delimiters.push({
          marker,
          length: 0,
          token: state.tokens.length - 1,
          end: -1,
          open: scanned.can_open,
          close: scanned.can_close
        });
      }
      state.pos += scanned.length;
      return true;
    }
    function postProcess$1(state, delimiters) {
      let token;
      const loneMarkers = [];
      const max = delimiters.length;
      for (let i = 0; i < max; i++) {
        const startDelim = delimiters[i];
        if (startDelim.marker !== 126) continue;
        if (startDelim.end === -1) continue;
        const endDelim = delimiters[startDelim.end];
        token = state.tokens[startDelim.token];
        token.type = "s_open";
        token.tag = "s";
        token.nesting = 1;
        token.markup = "~~";
        token.content = "";
        token = state.tokens[endDelim.token];
        token.type = "s_close";
        token.tag = "s";
        token.nesting = -1;
        token.markup = "~~";
        token.content = "";
        if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
      }
      while (loneMarkers.length) {
        const i = loneMarkers.pop();
        let j = i + 1;
        while (j < state.tokens.length && state.tokens[j].type === "s_close") j++;
        j--;
        if (i !== j) {
          token = state.tokens[j];
          state.tokens[j] = state.tokens[i];
          state.tokens[i] = token;
        }
      }
    }
    function strikethrough_postProcess(state) {
      const tokens_meta = state.tokens_meta;
      const max = state.tokens_meta.length;
      postProcess$1(state, state.delimiters);
      for (let curr = 0; curr < max; curr++) {
        var _tokens_meta$curr;
        const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
        if (delimiters) postProcess$1(state, delimiters);
      }
    }
    var strikethrough_default = {
      tokenize: strikethrough_tokenize,
      postProcess: strikethrough_postProcess
    };
    function emphasis_tokenize(state, silent) {
      const start = state.pos;
      const marker = state.src.charCodeAt(start);
      if (silent) return false;
      if (marker !== 95 && marker !== 42) return false;
      const scanned = state.scanDelims(state.pos, marker === 42);
      for (let i = 0; i < scanned.length; i++) {
        const token = state.push("text", "", 0);
        token.content = String.fromCharCode(marker);
        state.delimiters.push({
          marker,
          length: scanned.length,
          token: state.tokens.length - 1,
          end: -1,
          open: scanned.can_open,
          close: scanned.can_close
        });
      }
      state.pos += scanned.length;
      return true;
    }
    function postProcess(state, delimiters) {
      const max = delimiters.length;
      for (let i = max - 1; i >= 0; i--) {
        const startDelim = delimiters[i];
        if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
        if (startDelim.end === -1) continue;
        const endDelim = delimiters[startDelim.end];
        const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
        const ch = String.fromCharCode(startDelim.marker);
        const token_o = state.tokens[startDelim.token];
        token_o.type = isStrong ? "strong_open" : "em_open";
        token_o.tag = isStrong ? "strong" : "em";
        token_o.nesting = 1;
        token_o.markup = isStrong ? ch + ch : ch;
        token_o.content = "";
        const token_c = state.tokens[endDelim.token];
        token_c.type = isStrong ? "strong_close" : "em_close";
        token_c.tag = isStrong ? "strong" : "em";
        token_c.nesting = -1;
        token_c.markup = isStrong ? ch + ch : ch;
        token_c.content = "";
        if (isStrong) {
          state.tokens[delimiters[i - 1].token].content = "";
          state.tokens[delimiters[startDelim.end + 1].token].content = "";
          i--;
        }
      }
    }
    function emphasis_post_process(state) {
      const tokens_meta = state.tokens_meta;
      const max = state.tokens_meta.length;
      postProcess(state, state.delimiters);
      for (let curr = 0; curr < max; curr++) {
        var _tokens_meta$curr;
        const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
        if (delimiters) postProcess(state, delimiters);
      }
    }
    var emphasis_default = {
      tokenize: emphasis_tokenize,
      postProcess: emphasis_post_process
    };
    function link(state, silent) {
      let code2, label, res, ref;
      let href = "";
      let title = "";
      let start = state.pos;
      let parseReference = true;
      if (state.src.charCodeAt(state.pos) !== 91) return false;
      const oldPos = state.pos;
      const max = state.posMax;
      const labelStart = state.pos + 1;
      const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
      if (labelEnd < 0) return false;
      let pos = labelEnd + 1;
      if (pos < max && state.src.charCodeAt(pos) === 40) {
        parseReference = false;
        pos++;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) break;
        }
        if (pos >= max) return false;
        start = pos;
        res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
        if (res.ok) {
          href = state.md.normalizeLink(res.str);
          if (state.md.validateLink(href)) pos = res.pos;
          else href = "";
          start = pos;
          for (; pos < max; pos++) {
            code2 = state.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) break;
          }
          res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
          if (pos < max && start !== pos && res.ok) {
            title = res.str;
            pos = res.pos;
            for (; pos < max; pos++) {
              code2 = state.src.charCodeAt(pos);
              if (!isSpace(code2) && code2 !== 10) break;
            }
          }
        }
        if (pos >= max || state.src.charCodeAt(pos) !== 41) parseReference = true;
        pos++;
      }
      if (parseReference) {
        if (typeof state.env.references === "undefined") return false;
        if (pos < max && state.src.charCodeAt(pos) === 91) {
          start = pos + 1;
          pos = state.md.helpers.parseLinkLabel(state, pos);
          if (pos >= 0) label = state.src.slice(start, pos++);
          else pos = labelEnd + 1;
        } else pos = labelEnd + 1;
        if (!label) label = state.src.slice(labelStart, labelEnd);
        label = normalizeReference(label);
        ref = state.env.references[label];
        if (!ref) {
          state.pos = oldPos;
          return false;
        }
        href = ref.href;
        title = ref.title;
      }
      if (!silent) {
        state.pos = labelStart;
        state.posMax = labelEnd;
        const token_o = state.push("link_open", "a", 1);
        const attrs = [["href", href]];
        token_o.attrs = attrs;
        if (title) attrs.push(["title", title]);
        if (label) {
          const meta = /* @__PURE__ */ Object.create(null);
          meta.label = label;
          token_o.meta = meta;
        }
        state.linkLevel++;
        state.md.inline.tokenize(state);
        state.linkLevel--;
        state.push("link_close", "a", -1);
      }
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    function image(state, silent) {
      let code2, content, label, pos, ref, res, title, start;
      let href = "";
      const oldPos = state.pos;
      const max = state.posMax;
      if (state.src.charCodeAt(state.pos) !== 33) return false;
      if (state.src.charCodeAt(state.pos + 1) !== 91) return false;
      const labelStart = state.pos + 2;
      const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
      if (labelEnd < 0) return false;
      pos = labelEnd + 1;
      if (pos < max && state.src.charCodeAt(pos) === 40) {
        pos++;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) break;
        }
        if (pos >= max) return false;
        start = pos;
        res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
        if (res.ok) {
          href = state.md.normalizeLink(res.str);
          if (state.md.validateLink(href)) pos = res.pos;
          else href = "";
        }
        start = pos;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) break;
        }
        res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
        if (pos < max && start !== pos && res.ok) {
          title = res.str;
          pos = res.pos;
          for (; pos < max; pos++) {
            code2 = state.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) break;
          }
        } else title = "";
        if (pos >= max || state.src.charCodeAt(pos) !== 41) {
          state.pos = oldPos;
          return false;
        }
        pos++;
      } else {
        if (typeof state.env.references === "undefined") return false;
        if (pos < max && state.src.charCodeAt(pos) === 91) {
          start = pos + 1;
          pos = state.md.helpers.parseLinkLabel(state, pos);
          if (pos >= 0) label = state.src.slice(start, pos++);
          else pos = labelEnd + 1;
        } else pos = labelEnd + 1;
        if (!label) label = state.src.slice(labelStart, labelEnd);
        label = normalizeReference(label);
        ref = state.env.references[label];
        if (!ref) {
          state.pos = oldPos;
          return false;
        }
        href = ref.href;
        title = ref.title;
      }
      if (!silent) {
        content = state.src.slice(labelStart, labelEnd);
        const tokens = [];
        state.md.inline.parse(content, state.md, state.env, tokens);
        const token = state.push("image", "img", 0);
        const attrs = [["src", href], ["alt", ""]];
        token.attrs = attrs;
        token.children = tokens;
        token.content = content;
        if (title) attrs.push(["title", title]);
        if (label) {
          const meta = /* @__PURE__ */ Object.create(null);
          meta.label = label;
          token.meta = meta;
        }
      }
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
    var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
    function autolink(state, silent) {
      let pos = state.pos;
      if (state.src.charCodeAt(pos) !== 60) return false;
      const start = state.pos;
      const max = state.posMax;
      for (; ; ) {
        if (++pos >= max) return false;
        const ch = state.src.charCodeAt(pos);
        if (ch === 60) return false;
        if (ch === 62) break;
      }
      const url = state.src.slice(start + 1, pos);
      if (AUTOLINK_RE.test(url)) {
        const fullUrl = state.md.normalizeLink(url);
        if (!state.md.validateLink(fullUrl)) return false;
        if (!silent) {
          const token_o = state.push("link_open", "a", 1);
          token_o.attrs = [["href", fullUrl]];
          token_o.markup = "autolink";
          token_o.info = "auto";
          const token_t = state.push("text", "", 0);
          token_t.content = state.md.normalizeLinkText(url);
          const token_c = state.push("link_close", "a", -1);
          token_c.markup = "autolink";
          token_c.info = "auto";
        }
        state.pos += url.length + 2;
        return true;
      }
      if (EMAIL_RE.test(url)) {
        const fullUrl = state.md.normalizeLink(`mailto:${url}`);
        if (!state.md.validateLink(fullUrl)) return false;
        if (!silent) {
          const token_o = state.push("link_open", "a", 1);
          token_o.attrs = [["href", fullUrl]];
          token_o.markup = "autolink";
          token_o.info = "auto";
          const token_t = state.push("text", "", 0);
          token_t.content = state.md.normalizeLinkText(url);
          const token_c = state.push("link_close", "a", -1);
          token_c.markup = "autolink";
          token_c.info = "auto";
        }
        state.pos += url.length + 2;
        return true;
      }
      return false;
    }
    function isLinkOpen(str) {
      return /^<a[>\s]/i.test(str);
    }
    function isLinkClose(str) {
      return /^<\/a\s*>/i.test(str);
    }
    function isLetter(ch) {
      const lc = ch | 32;
      return lc >= 97 && lc <= 122;
    }
    function scanSpecial(state, pos) {
      const src = state.src;
      let start;
      let terminator;
      if (src.startsWith("<!--", pos)) {
        if (src.startsWith(">", pos + 4)) return pos + 5;
        if (src.startsWith("->", pos + 4)) return pos + 6;
        start = pos + 4;
        terminator = "-->";
      } else if (src.startsWith("<![CDATA[", pos)) {
        start = pos + 9;
        terminator = "]]>";
      } else if (src.charCodeAt(pos + 1) === 63) {
        start = pos + 2;
        terminator = "?>";
      } else if (isLetter(src.charCodeAt(pos + 2))) {
        start = pos + 3;
        terminator = ">";
      } else return -1;
      if (state.skipHtmlSpecial) return -1;
      const end = src.indexOf(terminator, start);
      if (end < 0) {
        state.skipHtmlSpecial = true;
        return -1;
      }
      return end + terminator.length;
    }
    function html_inline(state, silent) {
      if (!state.md.options.html) return false;
      const max = state.posMax;
      const pos = state.pos;
      if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
      let end;
      const ch = state.src.charCodeAt(pos + 1);
      if (ch === 33 || ch === 63) end = scanSpecial(state, pos);
      else if (ch === 47 || isLetter(ch)) {
        const match = state.src.slice(pos).match(HTML_OPEN_CLOSE_TAG_RE);
        end = match ? pos + match[0].length : -1;
      } else return false;
      if (end < 0) return false;
      if (!silent) {
        const token = state.push("html_inline", "", 0);
        token.content = state.src.slice(pos, end);
        if (isLinkOpen(token.content)) state.linkLevel++;
        if (isLinkClose(token.content)) state.linkLevel--;
      }
      state.pos = end;
      return true;
    }
    var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
    var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
    function entity(state, silent) {
      const pos = state.pos;
      const max = state.posMax;
      if (state.src.charCodeAt(pos) !== 38) return false;
      if (pos + 1 >= max) return false;
      if (state.src.charCodeAt(pos + 1) === 35) {
        const match = state.src.slice(pos).match(DIGITAL_RE);
        if (match) {
          if (!silent) {
            const code2 = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
            const token = state.push("text_special", "", 0);
            token.content = isValidEntityCode(code2) ? fromCodePoint(code2) : fromCodePoint(65533);
            token.markup = match[0];
            token.info = "entity";
          }
          state.pos += match[0].length;
          return true;
        }
      } else {
        const match = state.src.slice(pos).match(NAMED_RE);
        if (match) {
          const decoded = decodeHTMLStrict(match[0]);
          if (decoded !== match[0]) {
            if (!silent) {
              const token = state.push("text_special", "", 0);
              token.content = decoded;
              token.markup = match[0];
              token.info = "entity";
            }
            state.pos += match[0].length;
            return true;
          }
        }
      }
      return false;
    }
    function processDelimiters(delimiters) {
      const openersBottom = {};
      const max = delimiters.length;
      if (!max) return;
      let headerIdx = 0;
      let lastTokenIdx = -2;
      const jumps = [];
      for (let closerIdx = 0; closerIdx < max; closerIdx++) {
        const closer = delimiters[closerIdx];
        jumps.push(0);
        if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
        lastTokenIdx = closer.token;
        closer.length = closer.length || 0;
        if (!closer.close) continue;
        if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1
        ];
        const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
        let openerIdx = headerIdx - jumps[headerIdx] - 1;
        let newMinOpenerIdx = openerIdx;
        for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
          const opener = delimiters[openerIdx];
          if (opener.marker !== closer.marker) continue;
          if (opener.open && opener.end < 0) {
            let isOddMatch = false;
            if (opener.close || closer.open) {
              if ((opener.length + closer.length) % 3 === 0) {
                if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
              }
            }
            if (!isOddMatch) {
              const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
              jumps[closerIdx] = closerIdx - openerIdx + lastJump;
              jumps[openerIdx] = lastJump;
              closer.open = false;
              opener.end = closerIdx;
              opener.close = false;
              newMinOpenerIdx = -1;
              lastTokenIdx = -2;
              break;
            }
          }
        }
        if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
      }
    }
    function link_pairs(state) {
      const tokens_meta = state.tokens_meta;
      const max = state.tokens_meta.length;
      processDelimiters(state.delimiters);
      for (let curr = 0; curr < max; curr++) {
        var _tokens_meta$curr;
        const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
        if (delimiters) processDelimiters(delimiters);
      }
    }
    function fragments_join(state) {
      let curr, last;
      let level = 0;
      const tokens = state.tokens;
      const max = state.tokens.length;
      for (curr = last = 0; curr < max; curr++) {
        if (tokens[curr].nesting < 0) level--;
        tokens[curr].level = level;
        if (tokens[curr].nesting > 0) level++;
        if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
        else {
          if (curr !== last) tokens[last] = tokens[curr];
          last++;
        }
      }
      if (curr !== last) tokens.length = last;
    }
    var _rules = [
      ["text", text],
      ["linkify", linkify],
      ["newline", newline],
      ["escape", escape],
      ["backticks", backtick],
      ["strikethrough", strikethrough_default.tokenize],
      ["emphasis", emphasis_default.tokenize],
      ["link", link],
      ["image", image],
      ["autolink", autolink],
      ["html_inline", html_inline],
      ["entity", entity]
    ];
    var _rules2 = [
      ["balance_pairs", link_pairs],
      ["strikethrough", strikethrough_default.postProcess],
      ["emphasis", emphasis_default.postProcess],
      ["fragments_join", fragments_join]
    ];
    var ParserInline = class {
      constructor() {
        _defineProperty(
          this,
          /**
          * {@link Ruler} instance. Keep configuration of inline rules.
          */
          "ruler",
          new Ruler()
        );
        _defineProperty(
          this,
          /**
          * {@link Ruler} instance. Second ruler used for post-processing
          * (e.g. in emphasis-like rules).
          */
          "ruler2",
          new Ruler()
        );
        _defineProperty(this, "State", StateInline);
        for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
        for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
      }
      skipToken(state) {
        const pos = state.pos;
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const maxNesting = state.md.options.maxNesting;
        const cache = state.cache;
        if (typeof cache[pos] !== "undefined") {
          state.pos = cache[pos];
          return;
        }
        let ok = false;
        if (state.level < maxNesting) for (let i = 0; i < len; i++) {
          state.level++;
          ok = rules[i](state, true);
          state.level--;
          if (ok) {
            if (pos >= state.pos) throw new Error("inline rule didn't increment state.pos");
            break;
          }
        }
        else state.pos = state.posMax;
        if (!ok) state.pos++;
        cache[pos] = state.pos;
      }
      tokenize(state) {
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const end = state.posMax;
        const maxNesting = state.md.options.maxNesting;
        while (state.pos < end) {
          const prevPos = state.pos;
          let ok = false;
          if (state.level < maxNesting) for (let i = 0; i < len; i++) {
            ok = rules[i](state, false);
            if (ok) {
              if (prevPos >= state.pos) throw new Error("inline rule didn't increment state.pos");
              break;
            }
          }
          if (ok) {
            if (state.pos >= end) break;
            continue;
          }
          state.pending += state.src[state.pos++];
        }
        if (state.pending) state.pushPending();
      }
      /**
      * Process input string and push inline tokens into `outTokens`
      */
      parse(str, md, env, outTokens) {
        const state = new this.State(str, md, env, outTokens);
        this.tokenize(state);
        const rules = this.ruler2.getRules("");
        const len = rules.length;
        for (let i = 0; i < len; i++) rules[i](state);
      }
    };
    var default_default = {
      options: {
        html: false,
        xhtmlOut: false,
        breaks: false,
        langPrefix: "language-",
        linkify: false,
        typographer: false,
        quotes: "\u201C\u201D\u2018\u2019",
        highlight: null,
        maxNesting: 100
      },
      components: {
        core: {},
        block: {},
        inline: {}
      }
    };
    var zero_default = {
      options: {
        html: false,
        xhtmlOut: false,
        breaks: false,
        langPrefix: "language-",
        linkify: false,
        typographer: false,
        quotes: "\u201C\u201D\u2018\u2019",
        highlight: null,
        maxNesting: 20
      },
      components: {
        core: { rules: [
          "normalize",
          "block",
          "strip_references",
          "inline",
          "text_join"
        ] },
        block: { rules: ["paragraph"] },
        inline: {
          rules: ["text"],
          rules2: ["balance_pairs", "fragments_join"]
        }
      }
    };
    var commonmark_default = {
      options: {
        html: true,
        xhtmlOut: true,
        breaks: false,
        langPrefix: "language-",
        linkify: false,
        typographer: false,
        quotes: "\u201C\u201D\u2018\u2019",
        highlight: null,
        maxNesting: 20
      },
      components: {
        core: { rules: [
          "normalize",
          "block",
          "strip_references",
          "inline",
          "text_join"
        ] },
        block: { rules: [
          "blockquote",
          "code",
          "fence",
          "heading",
          "hr",
          "html_block",
          "lheading",
          "list",
          "reference",
          "paragraph"
        ] },
        inline: {
          rules: [
            "autolink",
            "backticks",
            "emphasis",
            "entity",
            "escape",
            "html_inline",
            "image",
            "link",
            "newline",
            "text"
          ],
          rules2: [
            "balance_pairs",
            "emphasis",
            "fragments_join"
          ]
        }
      }
    };
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          _defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    var config = {
      default: default_default,
      zero: zero_default,
      commonmark: commonmark_default
    };
    var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
    var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
    var RECODE_HOSTNAME_FOR = [
      "http:",
      "https:",
      "mailto:"
    ];
    var MarkdownIt = class {
      /**
      * Link validation function. CommonMark allows too much in links. By default
      * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
      * except some embedded image types.
      *
      * You can change this behaviour:
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * // enable everything
      * md.validateLink = function () { return true; }
      * ```
      */
      validateLink(url) {
        const str = url.trim().toLowerCase();
        return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
      }
      /**
      * Function used to encode link url to a machine-readable format,
      * which includes url-encoding, punycode, etc.
      */
      normalizeLink(url) {
        const parsed = mdurl.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
            parsed.hostname = punycode_js.default.toASCII(parsed.hostname);
          } catch (er) {
          }
        }
        if (parsed.auth) parsed.auth = mdurl.encode(parsed.auth);
        if (parsed.hostname) parsed.hostname = mdurl.encode(parsed.hostname);
        if (parsed.pathname) parsed.pathname = mdurl.encode(parsed.pathname);
        if (parsed.search) parsed.search = mdurl.encode(parsed.search);
        if (parsed.hash) parsed.hash = mdurl.encode(parsed.hash);
        return mdurl.format(parsed);
      }
      /**
      * Function used to decode link url to a human-readable format`
      */
      normalizeLinkText(url) {
        const parsed = mdurl.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
            parsed.hostname = punycode_js.default.toUnicode(parsed.hostname);
          } catch (er) {
          }
        }
        return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + "%");
      }
      constructor(...args) {
        _defineProperty(
          this,
          /**
          * Instance of {@link ParserInline}. You may need it to add new rules when
          * writing plugins. For simple rules control use {@link MarkdownIt.disable}
          * and {@link MarkdownIt.enable}.
          */
          "inline",
          new ParserInline()
        );
        _defineProperty(
          this,
          /**
          * Instance of {@link ParserBlock}. You may need it to add new rules when
          * writing plugins. For simple rules control use {@link MarkdownIt.disable}
          * and {@link MarkdownIt.enable}.
          */
          "block",
          new ParserBlock()
        );
        _defineProperty(
          this,
          /**
          * Instance of {@link ParserCore} chain executor. You may need it to add new
          * rules when writing plugins. For simple rules control use
          * {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
          */
          "core",
          new ParserCore()
        );
        _defineProperty(
          this,
          /**
          * Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
          * rules for new token types, generated by plugins.
          *
          * See {@link Renderer} docs and
          * [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
          *
          * @example
          * ```javascript
          * import MarkdownIt from 'markdown-it'
          * const md = new MarkdownIt()
          *
          * function myToken(tokens, idx, options, env, self) {
          *   //...
          *   return result;
          * };
          *
          * md.renderer.rules['my_token'] = myToken
          * ```
          */
          "renderer",
          new Renderer()
        );
        _defineProperty(
          this,
          /**
          * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
          * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
          * rule.
          */
          "linkify",
          new linkify_it.LinkifyIt()
        );
        _defineProperty(
          this,
          /**
          * Assorted utility functions, useful to write plugins. See details
          * [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
          */
          "utils",
          utils_exports
        );
        _defineProperty(
          this,
          /**
          * Link components parser functions, useful to write plugins. See details
          * [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
          */
          "helpers",
          Object.assign({}, helpers_exports)
        );
        const [presetNameOrOptions, options] = args;
        if (typeof presetNameOrOptions === "string") {
          this.configure(presetNameOrOptions);
          if (options) this.set(options);
        } else {
          this.configure("default");
          this.set(presetNameOrOptions || {});
        }
      }
      /**
      * Set parser options (in the same format as in constructor). Probably, you
      * will never need it, but you can change options after constructor call.
      *
      * __Note:__ To achieve the best possible performance, don't modify a
      * `markdown-it` instance options on the fly. If you need multiple configurations
      * it's best to create multiple instances and initialize each with separate
      * config.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      *
      * const md = new MarkdownIt()
      *   .set({ html: true, breaks: true })
      *   .set({ typographer: true })
      * ```
      */
      set(options) {
        Object.assign(this.options, options);
        return this;
      }
      /**
      * Batch load of all options and compenent settings. This is internal method,
      * and you probably will not need it. But if you will - see available presets
      * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
      *
      * We strongly recommend to use presets instead of direct config loads. That
      * will give better compatibility with next versions.
      */
      configure(presets) {
        let p;
        if (typeof presets === "string") {
          const presetName = presets;
          p = config[presetName];
          if (!p) throw new Error(`Wrong 'markdown-it' preset "${presetName}", check name`);
        } else p = presets;
        if (!p) throw new Error("Wrong `markdown-it` preset, can't be empty");
        if (p.options) this.options = _objectSpread2({}, p.options);
        const components = p.components;
        if (components) {
          var _components$inline;
          [
            "core",
            "block",
            "inline"
          ].forEach((name) => {
            var _components$name;
            const rules = (_components$name = components[name]) === null || _components$name === void 0 ? void 0 : _components$name.rules;
            if (rules) this[name].ruler.enableOnly(rules);
          });
          const rules2 = (_components$inline = components.inline) === null || _components$inline === void 0 ? void 0 : _components$inline.rules2;
          if (rules2) this.inline.ruler2.enableOnly(rules2);
        }
        return this;
      }
      /**
      * Enable list or rules. It will automatically find appropriate components,
      * containing rules with given names. If rule not found, and `ignoreInvalid`
      * not set - throws exception.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      *
      * const md = new MarkdownIt()
      *   .enable(['sub', 'sup'])
      *   .disable('smartquotes')
      * ```
      */
      enable(list2, ignoreInvalid = false) {
        let result = [];
        if (!Array.isArray(list2)) list2 = [list2];
        [
          "core",
          "block",
          "inline"
        ].forEach((chain) => {
          result = result.concat(this[chain].ruler.enable(list2, true));
        });
        result = result.concat(this.inline.ruler2.enable(list2, true));
        const missed = list2.filter((name) => result.indexOf(name) < 0);
        if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${missed}`);
        return this;
      }
      /**
      * The same as {@link MarkdownIt.enable}, but turn specified rules off.
      */
      disable(list2, ignoreInvalid = false) {
        let result = [];
        if (!Array.isArray(list2)) list2 = [list2];
        [
          "core",
          "block",
          "inline"
        ].forEach((chain) => {
          result = result.concat(this[chain].ruler.disable(list2, true));
        });
        result = result.concat(this.inline.ruler2.disable(list2, true));
        const missed = list2.filter((name) => result.indexOf(name) < 0);
        if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${missed}`);
        return this;
      }
      /**
      * Load specified plugin with given params into current parser instance.
      * It's just a sugar to call `plugin(md, params)` with curring.
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * import iterator from 'markdown-it-for-inline'
      *
      * const md = new MarkdownIt()
      *   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
      *     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
      *   })
      * ```
      */
      use(plugin, ...params) {
        plugin.apply(plugin, [this, ...params]);
        return this;
      }
      /**
      * Parse input string and return list of block tokens (special token type
      * "inline" will contain list of inline tokens). You should not call this
      * method directly, until you write custom renderer (for example, to produce
      * AST).
      *
      * `env` is used to pass data between "distributed" rules and return additional
      * metadata like reference info, needed for the renderer. It also can be used to
      * inject data in specific cases. Usually, you will be ok to pass `{}`,
      * and then pass updated object to renderer.
      */
      parse(src, env) {
        if (typeof src !== "string") throw new Error("Input data should be a String");
        const state = new this.core.State(src, this, env);
        this.core.process(state);
        return state.tokens;
      }
      /**
      * Render markdown string into html. It does all magic for you :).
      *
      * `env` can be used to inject additional metadata (`{}` by default).
      * But you will not need it with high probability. See also comment
      * in {@link MarkdownIt.parse}.
      */
      render(src, env = {}) {
        return this.renderer.render(this.parse(src, env), this.options, env);
      }
      /**
      * The same as {@link MarkdownIt.parse} but skip all block rules. It returns
      * the block tokens list with the single `inline` element, containing parsed
      * inline tokens in `children` property. Also updates `env` object.
      */
      parseInline(src, env) {
        const state = new this.core.State(src, this, env);
        state.inlineMode = true;
        this.core.process(state);
        return state.tokens;
      }
      /**
      * Similar to {@link MarkdownIt.render} but for single paragraph content.
      * Result will NOT be wrapped into `<p>` tags.
      */
      renderInline(src, env = {}) {
        return this.renderer.render(this.parseInline(src, env), this.options, env);
      }
    };
    _defineProperty(MarkdownIt, "Token", Token);
    _defineProperty(MarkdownIt, "Ruler", Ruler);
    _defineProperty(MarkdownIt, "Renderer", Renderer);
    _defineProperty(MarkdownIt, "ParserCore", ParserCore);
    _defineProperty(MarkdownIt, "StateCore", StateCore);
    _defineProperty(MarkdownIt, "ParserBlock", ParserBlock);
    _defineProperty(MarkdownIt, "StateBlock", StateBlock);
    _defineProperty(MarkdownIt, "ParserInline", ParserInline);
    _defineProperty(MarkdownIt, "StateInline", StateInline);
    var MarkdownItCallable = callable(MarkdownIt);
    module2.exports = MarkdownItCallable;
  }
});

// src/core.js
var require_core = __commonJS({
  "src/core.js"(exports2, module2) {
    "use strict";
    var markdown = require_markdown_it_cjs()({ html: false });
    function readable(text) {
      const out = [];
      function visit(tokens) {
        for (const token of tokens) {
          if (token.type === "inline") visit(token.children || []);
          else if (token.type === "text" || token.type === "code_inline" || token.type === "fence" || token.type === "code_block")
            out.push(token.content);
          else if (token.type === "image") out.push(token.content);
          else if (token.type === "softbreak" || token.type === "hardbreak" || token.type.endsWith("_close") && token.block)
            out.push(" ");
        }
      }
      visit(markdown.parse(text, {}));
      return out.join("").replace(/\s+/g, " ").trim();
    }
    var MARKER = /<span data-text-reference="([^"]+)"><\/span>/g;
    function encode(record) {
      return encodeURIComponent(JSON.stringify(record)).replace(/'/g, "%27");
    }
    function decode(value) {
      try {
        const r = JSON.parse(decodeURIComponent(value));
        if (r.v !== 1 || typeof r.id !== "string" || typeof r.source !== "string" || typeof r.quote !== "string" || !r.quote || typeof r.prefix !== "string" || typeof r.suffix !== "string")
          return null;
        return r;
      } catch (e) {
        return null;
      }
    }
    function capture(text, start, end, source, settings = {}) {
      if (start < 0 || end > text.length || end <= start)
        throw new Error("\u8BF7\u9009\u62E9\u9700\u8981\u5F15\u7528\u7684\u6587\u5B57");
      return {
        v: 1,
        id: globalThis.crypto.randomUUID(),
        source,
        quote: text.slice(start, end),
        prefix: text.slice(Math.max(0, start - 64), start),
        suffix: text.slice(end, end + 64),
        layout: settings.layout === "split" ? "split" : "inline",
        limit: limit(settings.limit),
        created: Date.now()
      };
    }
    function limit(n) {
      return Number.isFinite(Number(n)) ? Math.max(0, Math.min(1e4, Math.floor(Number(n)))) : 30;
    }
    function preview(text, n) {
      const chars = typeof Intl.Segmenter === "function" ? Array.from(
        new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(
          text
        ),
        (s) => s.segment
      ) : Array.from(text);
      return n && chars.length > n ? chars.slice(0, n).join("") + "\u2026" : text;
    }
    function locate(text, r) {
      const hits = [];
      let at = 0;
      while ((at = text.indexOf(r.quote, at)) !== -1) {
        hits.push(at);
        at += Math.max(1, r.quote.length);
      }
      if (!hits.length) return { status: "missing" };
      if (hits.length === 1)
        return { status: "found", start: hits[0], end: hits[0] + r.quote.length };
      const contextual = hits.filter(
        (i) => (!r.prefix || text.slice(Math.max(0, i - r.prefix.length), i) === r.prefix) && (!r.suffix || text.slice(i + r.quote.length, i + r.quote.length + r.suffix.length) === r.suffix)
      );
      if (contextual.length === 1)
        return {
          status: "found",
          start: contextual[0],
          end: contextual[0] + r.quote.length
        };
      return { status: "ambiguous" };
    }
    function render(r, link) {
      var _a;
      return "> [!text-reference] \u5F15\u7528\n" + ((_a = r.snapshot) != null ? _a : r.quote).split("\n").map((line) => "> " + line).join("\n") + "\n>\n> \u2014 " + link + '\n> <span data-text-reference="' + encode(r) + '"></span>\n';
    }
    function records(text) {
      const found = [];
      const re = new RegExp(MARKER.source, "g");
      let m;
      while (m = re.exec(text)) {
        const r = decode(m[1]);
        if (!r) continue;
        let start = text.lastIndexOf("\n", m.index) + 1;
        while (start > 0) {
          const prevEnd = start - 1;
          const prevStart = text.lastIndexOf("\n", prevEnd - 1) + 1;
          if (!/^>/.test(text.slice(prevStart, prevEnd).replace(/\r$/, ""))) break;
          start = prevStart;
        }
        let end = text.indexOf("\n", m.index);
        if (end < 0) end = text.length;
        else end++;
        const block = text.slice(start, end);
        if (!/^> \[!text-reference\] 引用\r?\n/.test(block)) continue;
        const lines = block.replace(/\r\n/g, "\n").trimEnd().split("\n");
        if (lines.length < 5 || !lines.at(-2).startsWith("> \u2014 ") || lines.at(-3) !== ">")
          continue;
        const link = lines.at(-2).slice(4);
        const body = lines.slice(1, -3).map((l) => l.replace(/^> ?/, "")).join("\n");
        found.push({ r, start, end, block, link, body, encoded: m[1] });
      }
      return found;
    }
    function replaceRecord(text, id, transform) {
      const matches = records(text).filter((x) => x.r.id === id);
      if (matches.length !== 1)
        throw new Error("\u5F15\u7528\u5DF2\u88AB\u4FEE\u6539\u6216\u590D\u5236\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u64CD\u4F5C");
      const item = matches[0];
      return text.slice(0, item.start) + transform(item) + text.slice(item.end);
    }
    module2.exports = {
      encode,
      decode,
      capture,
      limit,
      preview,
      locate,
      render,
      records,
      replaceRecord
    };
    function inlineLink(path, text, name) {
      const label = text.replace(/\r?\n/g, " ") + "\uFF08" + name + "\uFF09";
      if (!/[\[\]|\\*_`<>]/.test(label) && !/[\[\]|#^]/.test(path))
        return "[[" + path + "|" + label + "]]";
      const escaped = label.replace(/[\\\[\]*_`<>]/g, (c) => "\\" + c);
      const url = path.split("/").map(
        (part) => encodeURIComponent(part).replace(
          /[()]/g,
          (c) => "%" + c.charCodeAt(0).toString(16)
        )
      ).join("/");
      return "[" + escaped + "](" + url + ")";
    }
    function bind(r, target, token, text, at) {
      return {
        ...r,
        id: globalThis.crypto.randomUUID(),
        target,
        token,
        at,
        before: text.slice(Math.max(0, at - 48), at),
        after: text.slice(at + token.length, at + token.length + 48)
      };
    }
    function binding(text, r) {
      var _a, _b;
      const hits = [];
      let at = 0;
      while ((at = text.indexOf(r.token, at)) >= 0) {
        hits.push(at);
        at += r.token.length || 1;
      }
      if (hits.length === 1) return hits[0];
      const scored = hits.map((at2) => ({
        at: at2,
        score: (r.before && text.slice(Math.max(0, at2 - r.before.length), at2) === r.before ? 1 : 0) + (r.after && text.slice(
          at2 + r.token.length,
          at2 + r.token.length + r.after.length
        ) === r.after ? 1 : 0)
      })).sort((a, b) => b.score - a.score);
      return ((_a = scored[0]) == null ? void 0 : _a.score) > 0 && scored[0].score > (((_b = scored[1]) == null ? void 0 : _b.score) || 0) ? scored[0].at : -1;
    }
    Object.assign(module2.exports, { inlineLink, bind, binding });
    function activeBindings(refs, text, path) {
      const items = refs.filter((r) => r.target === path && !r.repair && r.status !== "unused").map((r) => {
        reconcile(text, r);
        return { r, at: binding(text, r) };
      }).filter((x) => x.at >= 0);
      return items.filter((x) => items.filter((y) => y.at === x.at).length === 1);
    }
    Object.assign(module2.exports, { activeBindings });
    Object.assign(module2.exports, { readable });
    function visibleToken(token) {
      if (token.startsWith("[[") && token.endsWith("]]")) {
        const pipe = token.indexOf("|");
        return pipe >= 0 ? token.slice(pipe + 1, -2) : token.slice(2, -2);
      }
      return readable(token);
    }
    Object.assign(module2.exports, { visibleToken });
    function referenceLinks(text) {
      if (!/[)）]\s*(?:\]\]|\]\()/.test(text)) return [];
      const starts = [0, ...Array.from(text.matchAll(/\n/g), (m) => m.index + 1)];
      const ignored = markdown.parse(text, {}).filter((block) => block.type === "fence" || block.type === "code_block").map(({ map: [start, end] }) => {
        var _a;
        return [starts[start], (_a = starts[end]) != null ? _a : text.length];
      });
      const frontmatter = /^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?^---[ \t]*(?:\r?\n|$)/m.exec(text);
      if ((frontmatter == null ? void 0 : frontmatter.index) === 0) ignored.unshift([0, frontmatter[0].length]);
      const parts = [];
      let from = 0;
      for (const [start, end] of ignored) {
        if (end <= from) continue;
        parts.push(text.slice(from, start), text.slice(Math.max(from, start), end).replace(/[^\r\n]/g, " "));
        from = end;
      }
      parts.push(text.slice(from));
      const pattern = /<!--[^]*?(?:-->|$)|%%[^]*?(?:%%|$)|(`+)(?:(?!\n[ \t\r]*\n)[^])*?\1(?!`)|\\[^\r\n]|!?(?:\[\[([^\[\]|\r\n]+)\|([^\[\]\r\n]+)\]\]|\[((?:\\.|[^\[\]\\\r\n])+)\]\(([^()\s]+)\))/g;
      const links = [];
      for (const match of parts.join("").matchAll(pattern)) {
        const [token, , wikiPath, wikiLabel, , markdownPath] = match;
        if (!wikiPath && !markdownPath || token.startsWith("!")) continue;
        let path = (wikiPath != null ? wikiPath : markdownPath).trim();
        try {
          if (markdownPath) path = decodeURIComponent(path);
        } catch (e) {
          continue;
        }
        if (!path || /[#^]/.test(path) || /^(?:[\w+.-]+:|\/\/)/.test(path)) continue;
        const label = (wikiLabel != null ? wikiLabel : visibleToken(token)).trimEnd();
        if (label.endsWith("\uFF09") || label.endsWith(")"))
          links.push({ at: match.index, token, path, label });
      }
      return links;
    }
    module2.exports.referenceLinks = referenceLinks;
    function recover(text, r) {
      const exact = locate(text, r);
      if (exact.status === "found") {
        const left = r.prefix && text.slice(Math.max(0, exact.start - r.prefix.length), exact.start) === r.prefix;
        const right = r.suffix && text.slice(exact.end, exact.end + r.suffix.length) === r.suffix;
        if ((!r.prefix || left) && (!r.suffix || right)) return exact;
      }
      if (r.prefix && r.suffix)
        for (const n of [24, 48, 64]) {
          const l = r.prefix.slice(-n), rr = r.suffix.slice(0, n);
          if (l.trim().length < 4 || rr.trim().length < 4) continue;
          const a = text.indexOf(l), b = text.indexOf(rr);
          if (a < 0 || b < 0 || text.indexOf(l, a + 1) >= 0 || text.indexOf(rr, b + 1) >= 0)
            continue;
          const start = a + l.length, end = b;
          if (end <= start || end - start > Math.max(512, r.quote.length * 4))
            continue;
          return {
            status: text.slice(start, end) === r.quote ? "found" : "changed",
            start,
            end
          };
        }
      return { status: exact.status === "ambiguous" ? "ambiguous" : "missing" };
    }
    module2.exports.recover = recover;
    function same(a, b) {
      return a.replace(/\r\n/g, "\n") === b.replace(/\r\n/g, "\n");
    }
    function pieces(a, b) {
      const split = (s) => typeof Intl.Segmenter === "function" ? Array.from(
        new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(s),
        (x2) => x2.segment
      ) : Array.from(s);
      const x = split(a), y = split(b), out = [];
      const add = (type, text) => {
        if (!text) return;
        const last = out.at(-1);
        if ((last == null ? void 0 : last.type) === type) last.text += text;
        else out.push({ type, text });
      };
      if (x.length * y.length > 1e6 && (a.slice(0, -1).includes("\n") || b.slice(0, -1).includes("\n"))) {
        const aa = a.split(/(?<=\n)/), bb = b.split(/(?<=\n)/);
        let i2 = 0, j2 = 0;
        while (i2 < aa.length || j2 < bb.length) {
          if (i2 < aa.length && j2 < bb.length && aa[i2] === bb[j2]) {
            add("equal", aa[i2++]);
            j2++;
            continue;
          }
          const nextA = i2 < aa.length ? bb.indexOf(aa[i2], j2 + 1) : -1;
          const nextB = j2 < bb.length ? aa.indexOf(bb[j2], i2 + 1) : -1;
          if (nextA >= 0 && (nextB < 0 || nextA - j2 < nextB - i2)) {
            while (j2 < nextA) add("insert", bb[j2++]);
          } else if (nextB >= 0) {
            while (i2 < nextB) add("delete", aa[i2++]);
          } else if (i2 < aa.length && j2 < bb.length) {
            for (const part of pieces(aa[i2++], bb[j2++])) add(part.type, part.text);
          } else if (i2 < aa.length) add("delete", aa[i2++]);
          else add("insert", bb[j2++]);
        }
        return out;
      }
      if (x.length * y.length > 1e6) {
        let i2 = 0, j2 = x.length, k = y.length;
        while (i2 < j2 && i2 < k && x[i2] === y[i2]) i2++;
        while (j2 > i2 && k > i2 && x[j2 - 1] === y[k - 1]) {
          j2--;
          k--;
        }
        add("equal", x.slice(0, i2).join(""));
        add("delete", x.slice(i2, j2).join(""));
        add("insert", y.slice(i2, k).join(""));
        add("equal", x.slice(j2).join(""));
        return out;
      }
      const rows = Array.from(
        { length: x.length + 1 },
        () => new Uint32Array(y.length + 1)
      );
      for (let i2 = x.length - 1; i2 >= 0; i2--)
        for (let j2 = y.length - 1; j2 >= 0; j2--)
          rows[i2][j2] = x[i2] === y[j2] ? 1 + rows[i2 + 1][j2 + 1] : Math.max(rows[i2 + 1][j2], rows[i2][j2 + 1]);
      let i = 0, j = 0;
      while (i < x.length || j < y.length) {
        if (i < x.length && j < y.length && x[i] === y[j]) {
          add("equal", x[i++]);
          j++;
        } else if (i < x.length && (j === y.length || rows[i + 1][j] >= rows[i][j + 1]))
          add("delete", x[i++]);
        else add("insert", y[j++]);
      }
      return out;
    }
    var recoverContexts = recover;
    function recoverEdges(text, r) {
      if (text.includes("\r\n") || r.quote.includes("\r\n") || r.prefix.includes("\r\n") || r.suffix.includes("\r\n")) {
        const offsets = [];
        let normalized = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === "\r" && text[i + 1] === "\n") continue;
          offsets.push(text[i] === "\n" && text[i - 1] === "\r" ? i - 1 : i);
          normalized += text[i];
        }
        offsets.push(text.length);
        const norm = (x) => x.replace(/\r\n/g, "\n");
        const found2 = recoverEdges(normalized, {
          ...r,
          quote: norm(r.quote),
          prefix: norm(r.prefix),
          suffix: norm(r.suffix)
        });
        return found2.start === void 0 ? found2 : { ...found2, start: offsets[found2.start], end: offsets[found2.end] };
      }
      const found = recoverContexts(text, r);
      if (found.status !== "missing") return found;
      let start, end;
      if (!r.prefix) {
        start = 0;
        if (!r.suffix) end = text.length;
        else {
          end = text.indexOf(r.suffix);
          if (end < 0 || text.indexOf(r.suffix, end + 1) >= 0) return found;
        }
      } else if (!r.suffix) {
        end = text.length;
        const at = text.indexOf(r.prefix);
        if (at < 0 || text.indexOf(r.prefix, at + 1) >= 0) return found;
        start = at + r.prefix.length;
      } else return found;
      const quote = text.slice(start, end);
      if (!quote.trim() || quote.length > Math.max(512, r.quote.length * 2))
        return found;
      const old = r.quote.replace(/\r\n/g, "\n"), next = quote.replace(/\r\n/g, "\n");
      const matches = pieces(old, next).filter((x) => x.type === "equal").reduce((n, x) => n + x.text.length, 0);
      if (matches < 4 || matches / Math.max(old.length, next.length) < 0.75)
        return found;
      return { status: same(quote, r.quote) ? "found" : "changed", start, end };
    }
    Object.assign(module2.exports, { same, pieces, recover: recoverEdges });
    function reconcile(text, r) {
      if (!r.renameToken) return;
      if (binding(text, r) >= 0) return;
      const next = { ...r, token: r.renameToken };
      if (binding(text, next) >= 0) {
        r.token = r.renameToken;
        delete r.renameToken;
      }
    }
    Object.assign(module2.exports, { reconcile });
    function contentSame(a, b) {
      return same(a, b) || readable(a) === readable(b);
    }
    Object.assign(module2.exports, { contentSame });
    var recoverBase = module2.exports.recover;
    function recoverBlocks(text, r) {
      const found = recoverBase(text, r);
      if (found.status !== "missing" || !r.quote.includes("\n")) return found;
      if (r.prefix && !r.prefix.endsWith("\n") || r.suffix && !r.suffix.startsWith("\n"))
        return found;
      const old = r.quote.split(/\r?\n/).map(readable).filter(Boolean);
      if (old.length < 2) return found;
      const lines = text.split("\n");
      let offset = 0;
      const blocks = lines.map((line) => {
        const b = {
          text: readable(line),
          start: offset,
          end: offset + line.length
        };
        offset += line.length + 1;
        return b;
      });
      const first = blocks.filter((x) => x.text === old[0]), last = blocks.filter((x) => x.text === old.at(-1));
      if (first.length !== 1 || last.length !== 1 || first[0].start >= last[0].start)
        return found;
      const start = first[0].start, end = last[0].end;
      const left = !r.prefix ? start === 0 : readable(text.slice(Math.max(0, start - r.prefix.length), start)) === readable(r.prefix);
      const right = !r.suffix ? end === text.length : readable(text.slice(end, end + r.suffix.length)) === readable(r.suffix);
      if (!left || !right) return found;
      return {
        status: contentSame(text.slice(start, end), r.quote) ? "found" : "changed",
        start,
        end
      };
    }
    module2.exports.recover = recoverBlocks;
    function managedBindings(refs, text, path) {
      const items = refs.filter(
        (r) => r.target === path && r.status !== "unused" && (!r.repair || /^(\[\[[\s\S]*\]\]|\[[\s\S]*\]\([^\n]*\))$/.test(r.token))
      ).map((r) => ({ r, at: binding(text, r) })).filter((x) => x.at >= 0);
      return items.filter((x) => items.filter((y) => y.at === x.at).length === 1);
    }
    function referenceText(r) {
      const label = visibleToken(r.token), ending = "\uFF08" + r.name + "\uFF09";
      return label.endsWith(ending) ? label.slice(0, -ending.length) : label;
    }
    Object.assign(module2.exports, { managedBindings, referenceText });
  }
});

// src/source-tracking.js
var require_source_tracking = __commonJS({
  "src/source-tracking.js"(exports2, module2) {
    "use strict";
    var { ChangeSet } = require("@codemirror/state");
    var core2 = require_core();
    function init(p) {
      p.sourceVersions = /* @__PURE__ */ new Map();
      p.sourceEpochs = /* @__PURE__ */ new Map();
      p.sourceReadRequests = /* @__PURE__ */ new Map();
      p.sourceHashes = /* @__PURE__ */ new Map();
      p.sourceDrafts = /* @__PURE__ */ new Map();
      p.sourceAnchors = /* @__PURE__ */ new Map();
      p.sourceStatus = /* @__PURE__ */ new Map();
      p.sourceTimers = /* @__PURE__ */ new Map();
      p.sourceNotices = /* @__PURE__ */ new Map();
      p.sourceRequests = /* @__PURE__ */ new Map();
    }
    function locate(p, text, r) {
      var _a;
      const anchor2 = (_a = p.sourceAnchors) == null ? void 0 : _a.get(r.id);
      if (anchor2 && anchor2.baseQuote === r.quote && anchor2.source === r.source && anchor2.text === text)
        return { status: "found", start: anchor2.start, end: anchor2.end };
      return core2.recover(text, r);
    }
    function anchor(p, text, r, range) {
      p.sourceAnchors.set(r.id, {
        source: r.source,
        baseQuote: r.quote,
        text,
        start: range.start,
        end: range.end
      });
    }
    function editorDocument(p, file) {
      var _a, _b;
      for (const view of p.editorViews || [])
        if (((_b = (_a = view.state.field(p.Obsidian.editorInfoField, false)) == null ? void 0 : _a.file) == null ? void 0 : _b.path) === file.path)
          return view.state.doc;
    }
    function read(p, file) {
      var _a;
      const doc = editorDocument(p, file);
      if (doc) return Promise.resolve(doc.toString());
      (_a = p.sourceReadRequests) != null ? _a : p.sourceReadRequests = /* @__PURE__ */ new Map();
      if (p.sourceReadRequests.has(file.path))
        return p.sourceReadRequests.get(file.path);
      const promise = Promise.resolve(p.app.vault.read(file));
      p.sourceReadRequests.set(file.path, promise);
      const done = () => {
        if (p.sourceReadRequests.get(file.path) === promise)
          p.sourceReadRequests.delete(file.path);
      };
      promise.then(done, done);
      return promise;
    }
    function previewSource(p, file, path = file.path) {
      var _a, _b, _c;
      const cache = (_a = p.previewSources) != null ? _a : p.previewSources = /* @__PURE__ */ new Map();
      const doc = editorDocument(p, file);
      const mtime = (_b = file.stat) == null ? void 0 : _b.mtime;
      let entry = cache.get(path);
      if (entry && entry.doc === doc && entry.mtime === mtime) {
        cache.delete(path);
        cache.set(path, entry);
        return entry;
      }
      if (entry && entry.mtime !== mtime) (_c = p.sourceReadRequests) == null ? void 0 : _c.delete(file.path);
      entry = {
        doc,
        mtime,
        size: 0,
        users: 0,
        ranges: /* @__PURE__ */ new Map(),
        current: () => {
          var _a2;
          return cache.get(path) === entry && editorDocument(p, file) === doc && ((_a2 = file.stat) == null ? void 0 : _a2.mtime) === mtime;
        },
        release: () => {
          entry.users--;
          if (!entry.users && entry.size > 4e6 && cache.get(path) === entry)
            cache.delete(path);
        }
      };
      cache.set(path, entry);
      while (cache.size > 8) cache.delete(cache.keys().next().value);
      entry.text = read(p, file).then(
        (text) => {
          entry.size = text.length;
          if (!entry.users && entry.size > 4e6 && cache.get(path) === entry)
            cache.delete(path);
          let total = [...cache.values()].reduce((n, item) => n + item.size, 0);
          for (const [key, item] of cache) {
            if (total <= 4e6) break;
            if (item === entry) continue;
            total -= item.size;
            cache.delete(key);
          }
          return text;
        },
        (error) => {
          if (cache.get(path) === entry) cache.delete(path);
          throw error;
        }
      );
      return entry;
    }
    function previewRange(p, entry, text, r, key) {
      var _a, _b;
      if (r.automatic) {
        if ((_a = p.refs) == null ? void 0 : _a.some((saved) => saved.source === r.source)) return resolve(p, text, r);
        key = JSON.stringify(["syntax", r.quote]);
      }
      const anchor2 = (_b = p.sourceAnchors) == null ? void 0 : _b.get(r.id);
      if ((anchor2 == null ? void 0 : anchor2.text) === text) key += JSON.stringify([anchor2.start, anchor2.end]);
      if (!entry.ranges.has(key)) {
        const pending = resolve(p, text, r);
        entry.ranges.set(key, pending);
        if (entry.ranges.size > 64) entry.ranges.delete(entry.ranges.keys().next().value);
        pending.catch(() => entry.ranges.delete(key));
      }
      return entry.ranges.get(key);
    }
    function diff(before, after) {
      const changes = [];
      let at = 0, pending = null;
      const flush = () => {
        if (pending) {
          changes.push(pending);
          pending = null;
        }
      };
      for (const part of core2.pieces(before, after)) {
        if (part.type === "equal") {
          flush();
          at += part.text.length;
        } else {
          pending != null ? pending : pending = { from: at, to: at, insert: "" };
          if (part.type === "delete") {
            at += part.text.length;
            pending.to = at;
          } else pending.insert += part.text;
        }
      }
      flush();
      return ChangeSet.of(changes, before.length);
    }
    function observe(p, path, before, after, changes) {
      p.sourceRequests.delete(path);
      for (const r of p.refs.filter((x) => x.source === path)) {
        const found = locate(p, before, r);
        let range;
        if (found.status === "found") {
          let unsafe = false, startInsertion = false, endInsertion = false;
          changes.iterChangedRanges((from, to) => {
            if (from < found.end && to > found.start && (from < found.start || to > found.end))
              unsafe = true;
            if (from === to && from === found.start) startInsertion = true;
            if (from === to && from === found.end) endInsertion = true;
          });
          if (!unsafe) {
            const start = changes.mapPos(found.start, startInsertion ? 1 : -1);
            const end = changes.mapPos(found.end, endInsertion ? -1 : 1);
            const quote = after.slice(start, end);
            if (quote.trim()) {
              range = {
                status: core2.contentSame(quote, r.quote) ? "found" : "changed",
                start,
                end
              };
              anchor(p, after, r, range);
              if (range.status === "changed")
                p.sourceDrafts.set(r.id, {
                  source: path,
                  text: after,
                  start,
                  end,
                  quote,
                  prefix: after.slice(Math.max(0, start - 64), start),
                  suffix: after.slice(end, end + 64)
                });
            } else range = { status: "missing" };
          }
        }
        range != null ? range : range = core2.recover(after, r);
        if (range.status === "changed") remember(p, after, r, range);
        if (range.status !== "changed") {
          p.sourceDrafts.delete(r.id);
          if (range.status === "found") anchor(p, after, r, range);
          else p.sourceAnchors.delete(r.id);
        }
        p.sourceStatus.set(r.id, range.status);
      }
      p.sourceVersions.set(path, after);
    }
    function schedule(p, path) {
      clearTimeout(p.sourceTimers.get(path));
      p.sourceTimers.set(
        path,
        setTimeout(() => {
          p.sourceTimers.delete(path);
          const file = p.app.vault.getAbstractFileByPath(path);
          if (file) p.run(() => check(p, file));
        }, 900)
      );
    }
    function transaction(p, tr, path) {
      if (!p.settings.notifySourceChanges || !p.refs.some((r) => r.source === path))
        return;
      observe(
        p,
        path,
        tr.startState.doc.toString(),
        tr.state.doc.toString(),
        tr.changes
      );
      schedule(p, path);
    }
    async function check(p, file, notify = true) {
      if (p.trackingStopped || !p.settings.notifySourceChanges || !p.refs.some((r) => r.source === file.path))
        return;
      const generation = p.trackingGeneration;
      const request = {};
      p.sourceRequests.set(file.path, request);
      const text = await read(p, file);
      const hash = await fingerprint(text);
      if (!p.settings.notifySourceChanges || generation !== p.trackingGeneration || p.sourceRequests.get(file.path) !== request)
        return;
      const previous = p.sourceVersions.get(file.path);
      if (previous !== void 0 && previous !== text) {
        observe(p, file.path, previous, text, diff(previous, text));
        p.sourceRequests.set(file.path, request);
      } else {
        for (const r of p.refs.filter((x) => x.source === file.path)) {
          const draft = p.sourceDrafts.get(r.id);
          const valid = (draft == null ? void 0 : draft.text) === text && draft.source === r.source && !core2.contentSame(draft.quote, r.quote);
          const found = await resolve(p, text, r, hash);
          if (generation !== p.trackingGeneration || p.sourceRequests.get(file.path) !== request)
            return;
          p.sourceStatus.set(r.id, valid ? "changed" : found.status);
          if (!valid && found.status === "changed") remember(p, text, r, found);
          else if (!valid) {
            p.sourceDrafts.delete(r.id);
            if (found.status === "found") anchor(p, text, r, found);
            else p.sourceAnchors.delete(r.id);
          }
        }
        p.sourceVersions.set(file.path, text);
      }
      if (generation !== p.trackingGeneration || p.sourceRequests.get(file.path) !== request)
        return;
      let dirty = false;
      for (const r of p.refs.filter((r2) => r2.source === file.path)) {
        const range = p.sourceAnchors.get(r.id);
        if ((range == null ? void 0 : range.text) === text) {
          const locator = {
            source: r.source,
            hash,
            start: range.start,
            end: range.end
          };
          if (JSON.stringify(r.locator) !== JSON.stringify(locator)) {
            r.locator = locator;
            dirty = true;
          }
        }
      }
      if (dirty) p.schedulePersist();
      p.refreshDisplays();
      const pending = p.refs.filter(
        (r) => r.source === file.path && p.sourceStatus.get(r.id) !== "found"
      );
      const key = JSON.stringify(
        pending.map((r) => [r.id, p.sourceStatus.get(r.id)])
      );
      if (!pending.length) p.sourceNotices.delete(file.path);
      else if (notify && p.sourceNotices.get(file.path) !== key) {
        p.sourceNotices.set(file.path, key);
      }
    }
    async function checkAll(p, notify = false) {
      if (p.trackingStopped || !p.settings.notifySourceChanges) return;
      for (const path of new Set(p.refs.map((r) => r.source))) {
        const file = p.app.vault.getAbstractFileByPath(path);
        if (file) await check(p, file, notify);
        else
          for (const r of p.refs.filter((x) => x.source === path))
            p.sourceStatus.set(r.id, "missing");
      }
      p.refreshDisplays();
    }
    function reset(p) {
      var _a;
      (_a = p.previewSources) == null ? void 0 : _a.clear();
      p.trackingGeneration = (p.trackingGeneration || 0) + 1;
      for (const timer of p.sourceTimers.values()) clearTimeout(timer);
      for (const key of [
        "sourceEpochs",
        "sourceReadRequests",
        "sourceHashes",
        "sourceTimers",
        "sourceVersions",
        "sourceDrafts",
        "sourceAnchors",
        "sourceStatus",
        "sourceNotices",
        "sourceRequests"
      ])
        p[key].clear();
    }
    function prune(p) {
      const ids = new Set(p.refs.map((r) => r.id));
      const paths = new Set(p.refs.map((r) => r.source));
      for (const map of [p.sourceAnchors, p.sourceDrafts, p.sourceStatus])
        for (const id of map.keys()) if (!ids.has(id)) map.delete(id);
      for (const map of [
        p.sourceEpochs,
        p.sourceReadRequests,
        p.sourceHashes,
        p.sourceVersions,
        p.sourceRequests,
        p.sourceNotices,
        p.sourceTimers
      ])
        for (const path of map.keys())
          if (!paths.has(path)) {
            if (map === p.sourceTimers) clearTimeout(map.get(path));
            map.delete(path);
          }
    }
    module2.exports = {
      init,
      locate,
      read,
      observe,
      transaction,
      schedule,
      check,
      checkAll,
      reset,
      prune
    };
    function remember(p, text, r, range) {
      anchor(p, text, r, range);
      p.sourceDrafts.set(r.id, {
        source: r.source,
        text,
        start: range.start,
        end: range.end,
        quote: text.slice(range.start, range.end),
        prefix: text.slice(Math.max(0, range.start - 64), range.start),
        suffix: text.slice(range.end, range.end + 64)
      });
    }
    async function fingerprint(text) {
      const bytes = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text)
      );
      return Array.from(
        new Uint8Array(bytes),
        (b) => b.toString(16).padStart(2, "0")
      ).join("");
    }
    async function resolve(p, text, r, hash) {
      var _a, _b;
      if (r.automatic) return resolveAutomatic(p, text, r, hash);
      const anchored = (_a = p.sourceAnchors) == null ? void 0 : _a.get(r.id);
      if (anchored && anchored.source === r.source && anchored.baseQuote === r.quote && anchored.text === text)
        return {
          status: core2.contentSame(
            text.slice(anchored.start, anchored.end),
            r.quote
          ) ? "found" : "changed",
          start: anchored.start,
          end: anchored.end
        };
      (_b = p.sourceHashes) != null ? _b : p.sourceHashes = /* @__PURE__ */ new Map();
      const cached = p.sourceHashes.get(r.source);
      const getHash = () => {
        if ((cached == null ? void 0 : cached.text) === text) return cached.promise;
        const promise = fingerprint(text);
        p.sourceHashes.set(r.source, { text, promise });
        return promise;
      };
      const saved = r.locator;
      if (saved && saved.source === r.source && Number.isInteger(saved.start) && Number.isInteger(saved.end) && saved.start >= 0 && saved.end <= text.length && saved.end > saved.start && saved.hash === (hash != null ? hash : await getHash())) {
        return {
          status: core2.contentSame(text.slice(saved.start, saved.end), r.quote) ? "found" : "changed",
          start: saved.start,
          end: saved.end
        };
      }
      const found = locate(p, text, r);
      return found.start !== void 0 && core2.contentSame(text.slice(found.start, found.end), r.quote) ? { ...found, status: "found" } : found;
    }
    async function resolveAutomatic(p, text, r, hash) {
      var _a, _b;
      const pattern = r.quote.split(/\s+/u).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
      const search = new RegExp(pattern, "g");
      const hit = search.exec(text);
      let exact;
      if (hit) {
        search.lastIndex = hit.index + 1;
        if (search.test(text)) return { status: "ambiguous" };
        exact = { status: "found", start: hit.index, end: hit.index + hit[0].length };
      }
      let known;
      const label = r.quote.replace(/\s+/gu, " ");
      for (const saved of p.refs || []) {
        if (saved.source !== r.source || saved.status === "unused" || core2.readable((_a = saved.snapshot) != null ? _a : saved.quote) !== label)
          continue;
        const found = await resolve(p, text, saved, hash);
        if (found.start === void 0) continue;
        const other = known != null ? known : exact;
        if (other && (other.start !== found.start || other.end !== found.end)) {
          if (known || !exact || found.status !== "found" || exact.start < found.start || exact.end > found.end)
            return { status: "ambiguous" };
        }
        known = { ...found, basis: saved };
      }
      return (_b = known != null ? known : exact) != null ? _b : { status: "missing" };
    }
    module2.exports.resolve = resolve;
    module2.exports.fingerprint = fingerprint;
    module2.exports.sourceFile = (p, r) => {
      var _a, _b;
      return (_b = p.app.vault.getAbstractFileByPath(r.source)) != null ? _b : r.automatic ? (_a = p.app.metadataCache) == null ? void 0 : _a.getFirstLinkpathDest(r.linkPath, r.target) : null;
    };
    function invalidate(p, path) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      (_a = p.previewSources) == null ? void 0 : _a.delete(path);
      if (p.refs && !p.refs.some((r) => r.source === path) && !((_b = p.sourceReadRequests) == null ? void 0 : _b.has(path)) && !((_c = p.sourceHashes) == null ? void 0 : _c.has(path)) && !((_d = p.sourceEpochs) == null ? void 0 : _d.has(path)))
        return;
      (_e = p.sourceReadRequests) == null ? void 0 : _e.delete(path);
      (_f = p.sourceHashes) == null ? void 0 : _f.delete(path);
      (_g = p.sourceRequests) == null ? void 0 : _g.delete(path);
      (_h = p.sourceEpochs) != null ? _h : p.sourceEpochs = /* @__PURE__ */ new Map();
      p.sourceEpochs.set(path, (p.sourceEpochs.get(path) || 0) + 1);
    }
    module2.exports.invalidate = invalidate;
    module2.exports.previewSource = previewSource;
    module2.exports.previewRange = previewRange;
  }
});

// src/automatic.js
var require_automatic = __commonJS({
  "src/automatic.js"(exports2, module2) {
    "use strict";
    var core2 = require_core();
    var tracking2 = require_source_tracking();
    function bindings(p, text, path, includeRepair = false) {
      var _a, _b;
      if (!path) return [];
      const refs = p.refs.filter((r) => r.target === path);
      for (const r of refs) core2.reconcile(text, r);
      const saved = core2.managedBindings(refs, text, path);
      const positions = new Map(saved.map(({ r, at }) => [at, r]));
      let entry = p.automaticNotes.get(path);
      if ((entry == null ? void 0 : entry.text) !== text) {
        clearTimeout(entry == null ? void 0 : entry.timer);
        entry = { text, links: core2.referenceLinks(text), sources: /* @__PURE__ */ new Set() };
        p.automaticNotes.set(path, entry);
        if (p.automaticNotes.size > 32) {
          const first = p.automaticNotes.keys().next().value;
          clearTimeout(p.automaticNotes.get(first).timer);
          p.automaticNotes.delete(first);
        }
      }
      const destinations = /* @__PURE__ */ new Map();
      const inferred = [];
      for (const link of entry.links) {
        const prior = positions.get(link.at);
        if (prior && !prior.repair) continue;
        if (!destinations.has(link.path))
          destinations.set(
            link.path,
            p.app.metadataCache.getFirstLinkpathDest(link.path, path)
          );
        const file = destinations.get(link.path);
        if (file && !/\.md$/i.test(file.path)) continue;
        const name = (_a = file == null ? void 0 : file.basename) != null ? _a : link.path.split("/").at(-1).replace(/\.md$/i, "");
        const suffix = [`\uFF08${name}\uFF09`, `(${name})`].find(
          (ending) => link.label.endsWith(ending)
        );
        const quote = suffix && link.label.slice(0, -suffix.length).trim();
        if (!quote) continue;
        positions.delete(link.at);
        inferred.push({
          at: link.at,
          r: {
            id: JSON.stringify([path, link.at, link.token]),
            automatic: true,
            at: link.at,
            target: path,
            source: (_b = file == null ? void 0 : file.path) != null ? _b : link.path,
            linkPath: link.path,
            token: link.token,
            quote,
            name,
            reviewId: prior && prior.source === (file == null ? void 0 : file.path) ? prior.id : void 0
          },
          file: prior ? void 0 : file
        });
      }
      queue(p, path, entry, inferred);
      return [
        ...saved.filter(
          ({ r, at }) => !r.repair || includeRepair && positions.has(at)
        ),
        ...inferred
      ];
    }
    function queue(p, path, entry, inferred) {
      entry.sources = new Set(inferred.map(({ r }) => r.source));
      const links = p.settings.notifySourceChanges ? inferred.filter(({ file }) => file) : [];
      const attempt = JSON.stringify(links.map(({ at, file }) => [at, file.path]));
      if (entry.attempt === attempt) return;
      clearTimeout(entry.timer);
      entry.attempt = attempt;
      const check = {};
      entry.check = check;
      if (!links.length || p.trackingStopped) return;
      entry.timer = setTimeout(
        () => p.run(() => verify(p, path, entry, check, links)),
        250
      );
    }
    async function verify(p, path, entry, check, links) {
      var _a;
      const isCurrent = () => !p.trackingStopped && p.settings.notifySourceChanges && p.automaticNotes.get(path) === entry && entry.check === check;
      if (!isCurrent()) return;
      const file = p.app.vault.getAbstractFileByPath(path);
      if (!file) return;
      const sources = /* @__PURE__ */ new Map();
      const verified = [];
      for (const { r, at, file: source } of links) {
        if (!isCurrent()) return;
        if (!sources.has(source.path)) {
          const text2 = await tracking2.read(p, source).catch(() => null);
          sources.set(source.path, { text: text2 });
        }
        const item = sources.get(source.path);
        if (typeof item.text !== "string") continue;
        const found = await tracking2.resolve(p, item.text, r, item.hash);
        if (found.start === void 0) continue;
        (_a = item.hash) != null ? _a : item.hash = await tracking2.fingerprint(item.text);
        verified.push(recordAt(r, item.text, found, item.hash, entry.text, at));
      }
      if (!verified.length || !isCurrent()) return;
      const text = await tracking2.read(p, file).catch(() => null);
      if (text !== entry.text || !isCurrent()) return;
      const occupied = /* @__PURE__ */ new Set();
      const uncertain = /* @__PURE__ */ new Set();
      for (const r of p.refs.filter((r2) => r2.target === path)) {
        const at = core2.binding(text, r);
        if (at < 0) uncertain.add(r.token);
        else occupied.add(at);
      }
      const added = verified.filter(
        (r) => !occupied.has(r.at) && !uncertain.has(r.token) && core2.binding(text, r) === r.at
      );
      if (!added.length) return;
      p.refs.push(...added);
      p.schedulePersist();
      if (p.settings.notifySourceChanges)
        for (const source of new Set(added.map((r) => r.source)))
          tracking2.schedule(p, source);
      await p.rebindReading();
      p.refreshDisplays();
    }
    function recordAt(r, source, { start, end, basis }, hash, target, at) {
      const captured = basis != null ? basis : core2.capture(source, start, end, r.source);
      const { v, quote, prefix, suffix } = captured;
      return core2.bind({
        v,
        quote,
        prefix,
        suffix,
        source: r.source,
        name: r.name,
        snapshot: r.quote,
        locator: { source: r.source, hash, start, end }
      }, r.target, r.token, target, at);
    }
    async function promote(p, r, source, found) {
      const file = p.app.vault.getAbstractFileByPath(r.target);
      if (!file || found.start === void 0) return null;
      const hash = await tracking2.fingerprint(source);
      const text = await tracking2.read(p, file);
      if (text.slice(r.at, r.at + r.token.length) !== r.token) return null;
      for (const saved of p.refs.filter((x) => x.target === r.target)) {
        const at = core2.binding(text, saved);
        if (at === r.at) return saved.source === r.source ? saved : null;
        if (at < 0 && saved.token === r.token) return null;
      }
      const record = recordAt(r, source, found, hash, text, r.at);
      if (core2.binding(text, record) !== r.at) return null;
      p.refs.push(record);
      p.schedulePersist();
      if (p.settings.notifySourceChanges) tracking2.schedule(p, r.source);
      await p.rebindReading();
      p.refreshDisplays();
      return record;
    }
    function invalidate(p, path) {
      const filename = path.split("/").at(-1);
      const basename = filename.replace(/\.md$/i, "");
      let changed = false;
      for (const entry of p.automaticNotes.values()) {
        if (!entry.sources.has(path) && !entry.sources.has(filename) && !entry.sources.has(basename))
          continue;
        clearTimeout(entry.timer);
        entry.attempt = null;
        entry.check = null;
        changed = true;
      }
      return changed;
    }
    module2.exports = { bindings, invalidate, promote };
  }
});

// src/storage.js
var require_storage = __commonJS({
  "src/storage.js"(exports2, module2) {
    "use strict";
    var core2 = require_core();
    function canonicalToken(r) {
      var _a;
      const label = ((_a = r.snapshot) != null ? _a : r.quote).replace(/\s+/g, " ").trim();
      return core2.inlineLink(r.source, label, r.name);
    }
    function pack(settings, refs) {
      const anchors = [];
      const index = /* @__PURE__ */ new Map();
      const bindings = refs.map((r) => {
        const { source, name, quote, prefix, suffix, locator } = r;
        const anchor = { source, name, quote, prefix, suffix, locator };
        const key = JSON.stringify(anchor);
        if (!index.has(key)) {
          index.set(key, anchors.length);
          anchors.push(anchor);
        }
        const { id, target, at, before, after, repair, originalToken, renameToken, status } = r;
        return {
          id,
          target,
          anchor: index.get(key),
          at,
          before: before || void 0,
          after: after || void 0,
          token: r.token === canonicalToken(r) ? void 0 : r.token,
          snapshot: r.snapshot === quote ? void 0 : r.snapshot,
          repair: repair || void 0,
          originalToken,
          renameToken,
          status
        };
      });
      return { schemaVersion: 4, settings, anchors, refs: bindings };
    }
    function unpack(data) {
      var _a, _b;
      if (!Array.isArray(data == null ? void 0 : data.refs)) return [];
      const valid = (r) => r && [
        "id",
        "target",
        "source",
        "name",
        "quote",
        "prefix",
        "suffix"
      ].every((k) => typeof r[k] === "string");
      if (data.schemaVersion !== 4)
        return data.refs.filter((r) => valid(r) && typeof r.token === "string" && r.token);
      const refs = [];
      for (const binding of data.refs) {
        if (!binding || !Number.isInteger(binding.anchor) || binding.anchor < 0) continue;
        const anchor = (_a = data.anchors) == null ? void 0 : _a[binding.anchor];
        if (!anchor) continue;
        const { anchor: _, ...target } = binding;
        const r = { v: 1, before: "", after: "", ...anchor, ...target };
        if (!valid(r)) continue;
        (_b = r.token) != null ? _b : r.token = canonicalToken(r);
        if (typeof r.token === "string" && r.token) refs.push(r);
      }
      return refs;
    }
    module2.exports = { pack, unpack };
  }
});

// src/comparison.js
var require_comparison = __commonJS({
  "src/comparison.js"(exports2, module2) {
    "use strict";
    function rows(old, next) {
      const a = old.replace(/\r\n/g, "\n").split("\n");
      const b = next.replace(/\r\n/g, "\n").split("\n");
      const result = [], removed = [], added = [];
      const flush = () => {
        var _a, _b;
        for (let n = 0; n < Math.max(removed.length, added.length); n++)
          result.push({ old: (_a = removed[n]) != null ? _a : null, next: (_b = added[n]) != null ? _b : null });
        removed.length = added.length = 0;
      };
      let dp;
      if (a.length * b.length <= 1e5) {
        dp = Array.from(
          { length: a.length + 1 },
          () => new Uint32Array(b.length + 1)
        );
        for (let i2 = a.length - 1; i2 >= 0; i2--)
          for (let j2 = b.length - 1; j2 >= 0; j2--)
            dp[i2][j2] = a[i2] === b[j2] ? 1 + dp[i2 + 1][j2 + 1] : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
      }
      let i = 0, j = 0;
      while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) {
          flush();
          result.push({ old: a[i++], next: b[j++] });
        } else if (i === a.length) added.push(b[j++]);
        else if (j === b.length) removed.push(a[i++]);
        else if (dp ? dp[i + 1][j] >= dp[i][j + 1] : b.indexOf(a[i], j) < 0)
          removed.push(a[i++]);
        else added.push(b[j++]);
      }
      flush();
      return result;
    }
    function render(parent, old, next, zh, core2) {
      const panel = parent.createEl("div", { cls: "tr-diff" });
      const header = panel.createEl("div", { cls: "tr-diff-header" });
      for (const text of zh ? ["\u73B0\u6709\u6458\u5F55", "\u65B0\u539F\u6587"] : ["Snapshot", "New source"])
        header.createEl("div", { text });
      for (const pair of rows(old, next)) {
        const row = panel.createEl("div", { cls: "tr-diff-row" });
        const changes = pair.old !== null && pair.next !== null ? core2.pieces(pair.old, pair.next) : null;
        for (const [side, skip, tag, label] of [
          ["old", "insert", "del", zh ? "\u73B0\u6709\u6458\u5F55" : "Snapshot"],
          ["next", "delete", "ins", zh ? "\u65B0\u539F\u6587" : "New source"]
        ]) {
          const cell = row.createEl("div", { cls: "tr-comparison tr-diff-cell" });
          cell.setAttribute("data-label", label);
          const value = pair[side];
          if (value === null) {
            cell.classList.add("tr-diff-gap");
            cell.createEl("span", {
              text: zh ? side === "old" ? "\u65B0\u589E\u6BB5\u843D" : "\u5DF2\u5220\u9664" : side === "old" ? "Added paragraph" : "Removed",
              cls: "tr-muted"
            });
          } else if (!changes) {
            cell.classList.add(
              side === "old" ? "tr-diff-removed" : "tr-diff-added"
            );
            cell.appendText(value || "\xA0");
          } else {
            for (const part of changes) {
              if (part.type === skip) continue;
              if (part.type === "equal") cell.appendText(part.text);
              else
                cell.createEl(tag, {
                  text: part.text,
                  cls: part.text.length > 24 || part.text.includes("\n") ? "tr-long-change" : ""
                });
            }
            if (!value) cell.appendText("\xA0");
          }
        }
      }
      return panel;
    }
    module2.exports = { rows, render };
  }
});

// src/document-events.js
var require_document_events = __commonJS({
  "src/document-events.js"(exports2, module2) {
    "use strict";
    var documents = /* @__PURE__ */ new WeakMap();
    function listen(doc, type, handler, capture = false) {
      let types = documents.get(doc);
      if (!types) documents.set(doc, types = /* @__PURE__ */ new Map());
      const key = type + ":" + capture;
      let group = types.get(key);
      if (!group) {
        group = {
          handlers: /* @__PURE__ */ new Set(),
          dispatch: (event) => {
            for (const fn of [...group.handlers]) if (fn(event) === false) break;
          }
        };
        types.set(key, group);
        doc.addEventListener(type, group.dispatch, capture);
      }
      group.handlers.add(handler);
      return () => {
        group.handlers.delete(handler);
        if (!group.handlers.size) {
          doc.removeEventListener(type, group.dispatch, capture);
          types.delete(key);
        }
      };
    }
    module2.exports = { listen };
  }
});

// src/hover.js
var require_hover = __commonJS({
  "src/hover.js"(exports2, module2) {
    "use strict";
    var tracking2 = require_source_tracking();
    var { listen } = require_document_events();
    function position(text, offset) {
      const prefix = text.slice(0, offset);
      return { line: prefix.split("\n").length - 1, col: offset - prefix.lastIndexOf("\n") - 1 };
    }
    function closePopover(popover) {
      var _a, _b;
      if (!popover) return;
      try {
        if (typeof popover.hide === "function") popover.hide();
        else (_a = popover.unload) == null ? void 0 : _a.call(popover);
      } finally {
        (_b = popover.hoverEl) == null ? void 0 : _b.remove();
      }
    }
    function install(p, anchor, r) {
      const doc = anchor.ownerDocument;
      const win = doc.defaultView;
      const current = () => r.automatic || !p.refs ? r : p.refs.find((x) => x.id === r.id);
      let pointer = null, pending = false, generation = 0;
      let releaseSource, visiblePopup;
      const contains = (element, target) => Boolean((target == null ? void 0 : target.nodeType) && (element == null ? void 0 : element.contains(target)));
      const blur = () => {
        pointer = null;
        cancel();
      };
      function cancel(dispose = false) {
        generation++;
        pending = false;
        if (p.previewClose === cancel) p.previewClose = null;
        win.removeEventListener("blur", blur);
        releaseSource == null ? void 0 : releaseSource();
        releaseSource = void 0;
        if (dispose) {
          const popup = visiblePopup;
          visiblePopup = void 0;
          closePopover(popup);
        }
      }
      function popupOwner(turn) {
        let popup;
        return {
          get hoverPopover() {
            return popup != null ? popup : null;
          },
          set hoverPopover(next) {
            if (next === popup) return;
            if (visiblePopup === popup) visiblePopup = void 0;
            popup = next;
            if (turn !== generation) {
              if (next) queueMicrotask(() => closePopover(next));
              return;
            }
            visiblePopup = next != null ? next : void 0;
          }
        };
      }
      function request(event) {
        var _a, _b, _c;
        if (!pointer || pending || ((_a = visiblePopup == null ? void 0 : visiblePopup.hoverEl) == null ? void 0 : _a.isConnected) || ((_b = anchor.trDragging) == null ? void 0 : _b.call(anchor))) return;
        (_c = p.previewClose) == null ? void 0 : _c.call(p);
        p.previewClose = cancel;
        pending = true;
        win.addEventListener("blur", blur, { once: true });
        const turn = ++generation;
        p.run(async () => {
          var _a2;
          if (turn !== generation) return;
          const reference = current();
          const file = reference && tracking2.sourceFile(p, reference);
          if (!file) {
            cancel();
            return;
          }
          const source = (_a2 = file.path) != null ? _a2 : reference.source;
          const entry = tracking2.previewSource(p, file, source);
          entry.users++;
          releaseSource = entry.release;
          let text, found;
          try {
            text = await entry.text;
            if (turn !== generation) return;
            const latest2 = current();
            if (latest2 && latest2.source === reference.source) {
              const key = JSON.stringify([latest2.id, latest2.quote, latest2.prefix, latest2.suffix, latest2.locator]);
              found = await tracking2.previewRange(p, entry, text, { ...latest2, source }, key);
            }
          } catch (e) {
          }
          if (turn !== generation) return;
          const latest = current();
          if (!anchor.isConnected || !latest || latest.source !== reference.source) {
            cancel();
            return;
          }
          const startLoc = entry.current() && latest.quote === reference.quote && (found == null ? void 0 : found.start) !== void 0 ? position(text, found.start) : void 0;
          p.app.workspace.trigger("hover-link", {
            event,
            source: "text-reference",
            hoverParent: popupOwner(turn),
            targetEl: anchor,
            linktext: source,
            sourcePath: latest.target,
            state: startLoc ? { scroll: startLoc.line, startLoc, endLoc: position(text, found.end) } : void 0
          });
        });
      }
      const move = (event) => {
        pointer = event;
        event.stopPropagation();
        if (event.ctrlKey || event.metaKey) request(event);
      };
      const leave = (event) => {
        if (contains(anchor, event.relatedTarget)) return;
        pointer = null;
        cancel();
      };
      anchor.addEventListener("mouseover", move);
      anchor.addEventListener("mousemove", move);
      anchor.addEventListener("mouseout", leave);
      const offDown = listen(doc, "keydown", (event) => {
        if (!pointer || !(event.ctrlKey || event.metaKey || event.key === "Control" || event.key === "Meta"))
          return;
        request(new doc.defaultView.MouseEvent("mouseover", {
          clientX: pointer.clientX,
          clientY: pointer.clientY,
          ctrlKey: event.ctrlKey || event.key === "Control",
          metaKey: event.metaKey || event.key === "Meta"
        }));
      }, true);
      const offUp = listen(doc, "keyup", (event) => {
        if (!event.ctrlKey && !event.metaKey && p.previewClose === cancel) cancel();
      }, true);
      return () => {
        cancel(true);
        offDown();
        offUp();
        anchor.removeEventListener("mouseover", move);
        anchor.removeEventListener("mousemove", move);
        anchor.removeEventListener("mouseout", leave);
      };
    }
    module2.exports = { install };
  }
});

// src/interaction.js
var require_interaction = __commonJS({
  "src/interaction.js"(exports2, module2) {
    "use strict";
    function bind(p, a, r) {
      const doc = a.ownerDocument, win = doc.defaultView;
      let down = null, moved = false, held = false;
      const current = () => r.automatic ? r : p.refs.find((x) => x.id === r.id);
      const open = (e) => {
        const reference = current();
        if (!reference) return;
        const newTab = e.ctrlKey || e.metaKey;
        p.run(() => p.open(reference, newTab));
      };
      a.removeAttribute("title");
      a.draggable = false;
      a.setAttribute("contenteditable", "false");
      const on = (target, type, fn, options) => {
        target.addEventListener(type, fn, options);
        return () => target.removeEventListener(type, fn, options);
      };
      const ownsSelection = () => {
        const s = win.getSelection();
        if (!s || s.isCollapsed || !s.rangeCount) return false;
        try {
          return s.getRangeAt(0).intersectsNode(a);
        } catch (e) {
          return false;
        }
      };
      let pointerOff = () => {
      };
      const startPointer = () => {
        pointerOff();
        const move = require_document_events().listen(
          doc,
          "mousemove",
          (e) => {
            if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4)
              moved = true;
          },
          true
        );
        const up = require_document_events().listen(doc, "mouseup", () => {
          down = null;
          held = ownsSelection();
          pointerOff();
        });
        pointerOff = () => {
          move();
          up();
        };
      };
      const listeners = [
        on(a, "mousedown", (e) => {
          if (e.button !== 0) return;
          down = { x: e.clientX, y: e.clientY };
          moved = false;
          held = true;
          startPointer();
        }),
        on(a, "click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (moved || held || e.shiftKey || ownsSelection()) {
            moved = false;
            return;
          }
          open(e);
        }),
        on(a, "keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            open(e);
          }
        }),
        on(a, "contextmenu", (e) => {
          if (ownsSelection()) return;
          e.preventDefault();
          e.stopPropagation();
          if (current()) p.menu(current(), e, a);
        }),
        require_document_events().listen(
          doc,
          "copy",
          (e) => {
            var _a, _b;
            if (!ownsSelection()) return;
            const selection = win.getSelection();
            const text = selection.toString();
            const reference = current();
            const whole = text === a.textContent;
            if (!whole && !(a.contains(selection.anchorNode) && a.contains(selection.focusNode)))
              return;
            if (text && e.clipboardData) {
              p.pending = whole && reference && !reference.automatic && !reference.repair ? (_b = (_a = p.referenceClipboard) == null ? void 0 : _a.call(p, reference)) != null ? _b : null : null;
              e.clipboardData.setData("text/plain", whole && (reference == null ? void 0 : reference.token) ? reference.token : text);
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }
          },
          true
        )
      ];
      const removeHover = require_hover().install(p, a, r);
      a.trDragging = () => Boolean(down);
      a.trSelection = () => Boolean(down) || ownsSelection();
      return () => {
        pointerOff();
        removeHover();
        for (const off of listeners) off();
        delete a.trDragging;
        delete a.trSelection;
      };
    }
    module2.exports = { bind };
  }
});

// src/updates.js
var require_updates = __commonJS({
  "src/updates.js"(exports2, module2) {
    "use strict";
    function signature(r) {
      return JSON.stringify([
        r.token,
        r.quote,
        r.snapshot,
        r.source,
        r.target,
        r.prefix,
        r.suffix
      ]);
    }
    async function apply(p, r, selected, mode, expected) {
      var _a, _b, _c, _d, _e, _f, _g;
      if (!p.refs.includes(r) || signature(r) !== signature(expected))
        throw Object.assign(new Error(p.t("changed")), { code: "target-changed" });
      const next = {
        ...r,
        quote: selected.quote,
        prefix: selected.prefix,
        suffix: selected.suffix,
        locator: selected.locator,
        snapshot: mode === "update" ? selected.quote : (_a = r.snapshot) != null ? _a : r.quote,
        repair: false,
        originalToken: void 0
      };
      if (mode === "update") next.token = p.token(next);
      const operation = {
        id: r.id,
        target: r.target,
        before: { ...r },
        after: { ...next }
      };
      (_b = p.referenceEdits) != null ? _b : p.referenceEdits = [];
      p.referenceEdits.push(operation);
      try {
        const result = mode === "update" ? await p.change(r, () => next.token) : null;
        const actual = (_c = result == null ? void 0 : result.text) != null ? _c : "";
        if (!p.refs.includes(r) || ![expected.token, next.token].includes(r.token) || mode === "update" && require_core().binding(actual, next) < 0)
          throw Object.assign(new Error(p.t("changed")), {
            code: "target-changed"
          });
        Object.assign(r, next);
        (_d = p.fullQuotes) == null ? void 0 : _d.delete(r.id);
        (_e = p.sourceAnchors) == null ? void 0 : _e.delete(r.id);
        (_f = p.sourceStatus) == null ? void 0 : _f.delete(r.id);
        (_g = p.sourceDrafts) == null ? void 0 : _g.delete(r.id);
        try {
          await p.save();
        } catch (error) {
          operation.pendingSave = true;
        }
      } catch (error) {
        p.referenceEdits = p.referenceEdits.filter((x) => x !== operation);
        throw error;
      }
      if (p.referenceEdits.length > 30) p.referenceEdits.shift();
      return operation;
    }
    async function revert(p, op) {
      var _a;
      const r = p.refs.find((x) => x.id === op.id);
      if (!r || signature(r) !== signature(op.after))
        throw Object.assign(new Error(p.t("changed")), { code: "target-changed" });
      const inverse = {
        id: r.id,
        target: r.target,
        before: { ...r },
        after: { ...op.before }
      };
      p.referenceEdits.push(inverse);
      try {
        if (r.token !== op.before.token) await p.change(r, () => op.before.token);
        if (!p.refs.includes(r))
          throw Object.assign(new Error(p.t("changed")), {
            code: "target-changed"
          });
        for (const key of Object.keys(r))
          if (!Object.hasOwn(op.before, key)) delete r[key];
        Object.assign(r, op.before);
        (_a = p.sourceAnchors) == null ? void 0 : _a.delete(r.id);
        try {
          await p.save();
        } catch (error) {
          inverse.pendingSave = true;
        }
      } catch (e) {
        p.referenceEdits = p.referenceEdits.filter((x) => x !== inverse);
        throw e;
      }
      return inverse;
    }
    function handleTransaction(p, tr, path) {
      const handled = /* @__PURE__ */ new Set();
      const before = tr.startState.doc.toString(), after = tr.state.doc.toString();
      for (const op of [...p.referenceEdits || []].reverse()) {
        if (op.target !== path || handled.has(op.id) || op.before.token === op.after.token)
          continue;
        const undo = tr.isUserEvent("undo");
        const from = undo ? op.after : op.before, to = undo ? op.before : op.after;
        const at = before.indexOf(from.token);
        if (at < 0 || before.indexOf(from.token, at + 1) >= 0) continue;
        const mapped = tr.changes.mapPos(at, -1);
        if (after.slice(mapped, mapped + to.token.length) !== to.token) continue;
        let touched = false;
        tr.changes.iterChangedRanges((a, b) => {
          if (a < at + from.token.length && b > at || a === b && a >= at && a <= at + from.token.length)
            touched = true;
        });
        if (!touched) continue;
        const r = p.refs.find((x) => x.id === op.id);
        if (!r) continue;
        Object.assign(r, to);
        if (!to.repair) {
          delete r.repair;
          delete r.originalToken;
        }
        r.updatedAt = Date.now();
        handled.add(r.id);
      }
      return handled;
    }
    module2.exports = { apply, revert, signature, handleTransaction };
  }
});

// src/maintenance.js
var require_maintenance = __commonJS({
  "src/maintenance.js"(exports2, module2) {
    "use strict";
    var core2 = require_core();
    function retire(p, r) {
      var _a;
      (_a = p.removedRefs) != null ? _a : p.removedRefs = /* @__PURE__ */ new Map();
      p.removedRefs.set(r.id, { ...r });
      p.refs = p.refs.filter((x) => x.id !== r.id);
    }
    function transaction(p, tr, path) {
      var _a, _b;
      const managed = require_updates().handleTransaction(p, tr, path);
      const before = tr.startState.doc.toString(), after = tr.state.doc.toString();
      let changed = managed.size > 0;
      for (const r of [...p.refs].filter((r2) => r2.target === path)) {
        if (managed.has(r.id)) continue;
        const at = core2.binding(before, r);
        if (at < 0) continue;
        const renamedAt = tr.changes.mapPos(at, -1);
        if (r.renameToken && after.slice(renamedAt, renamedAt + r.renameToken.length) === r.renameToken) {
          r.token = r.renameToken;
          delete r.renameToken;
          delete r.originalToken;
          delete r.repair;
          r.at = renamedAt;
          r.before = after.slice(Math.max(0, renamedAt - 48), renamedAt);
          r.after = after.slice(
            renamedAt + r.token.length,
            renamedAt + r.token.length + 48
          );
          changed = true;
          continue;
        }
        const start = tr.changes.mapPos(at, 1), end = tr.changes.mapPos(at + r.token.length, -1);
        let fullyRemoved = false;
        tr.changes.iterChangedRanges((from, to) => {
          if (from <= at && to >= at + r.token.length) fullyRemoved = true;
        });
        if (fullyRemoved && after.slice(start, end) !== r.token) {
          retire(p, r);
          changed = true;
          continue;
        }
        const token = after.slice(start, end);
        if (token !== r.token) {
          (_a = r.originalToken) != null ? _a : r.originalToken = r.token;
          r.token = token;
          r.repair = token !== r.originalToken;
          if (!token) {
            retire(p, r);
            changed = true;
            continue;
          }
        }
        const prefix = after.slice(Math.max(0, start - 48), start), suffix = after.slice(end, end + 48);
        if (r.at !== start || r.before !== prefix || r.after !== suffix || r.originalToken) {
          Object.assign(r, {
            at: start,
            before: prefix,
            after: suffix,
            updatedAt: Date.now()
          });
          changed = true;
        }
      }
      if (tr.isUserEvent("undo") || tr.isUserEvent("redo")) {
        const archived = [...((_b = p.removedRefs) == null ? void 0 : _b.values()) || []].filter((r) => r.target === path).reverse();
        for (const r of archived) {
          const at = core2.binding(after, r);
          if (at < 0 || p.refs.some((x) => x.target === path && core2.binding(after, x) === at))
            continue;
          let inserted = false;
          tr.changes.iterChangedRanges((a, b, from, to) => {
            if (from <= at && to >= at + r.token.length) inserted = true;
          });
          if (!inserted) continue;
          p.refs.push({ ...r, updatedAt: Date.now() });
          p.removedRefs.delete(r.id);
          changed = true;
        }
      }
      if (changed) p.schedulePersist();
    }
    function register(p, r, text) {
      for (const old of [...p.refs])
        if (old.target === r.target && core2.binding(text, old) === r.at)
          retire(p, old);
      r.updatedAt = Date.now();
      p.refs.push(r);
    }
    module2.exports = { transaction, register };
  }
});

// src/editor.js
var require_editor = __commonJS({
  "src/editor.js"(exports2, module2) {
    "use strict";
    var { StateField, StateEffect, Prec } = require("@codemirror/state");
    var {
      EditorView,
      ViewPlugin,
      Decoration,
      WidgetType
    } = require("@codemirror/view");
    function install(p, O2) {
      p.editorViews = /* @__PURE__ */ new Set();
      p.refreshEffect = StateEffect.define();
      class QuoteWidget extends WidgetType {
        constructor(r) {
          var _a;
          super();
          this.r = r;
          this.signature = JSON.stringify([
            r.id,
            r.source,
            r.token,
            p.display(r),
            r.name,
            p.fullQuotes.has(r.id) ? 0 : p.settings.limit,
            p.settings.layout,
            p.settings.style,
            (_a = p.sourceStatus) == null ? void 0 : _a.get(r.id)
          ]);
        }
        eq(other) {
          return this.signature === other.signature;
        }
        get lineBreaks() {
          return p.settings.layout === "split" ? 1 : 0;
        }
        toDOM(view) {
          var _a, _b;
          const a = view.dom.ownerDocument.createElement("a");
          a.className = "internal-link";
          a.href = (_a = this.r.linkPath) != null ? _a : this.r.source;
          a.dataset.href = (_b = this.r.linkPath) != null ? _b : this.r.source;
          a.tabIndex = 0;
          p.paint(a, this.r);
          this.cleanup = require_interaction().bind(p, a, this.r);
          a.dataset.referenceId = this.r.id;
          return a;
        }
        destroy() {
          var _a;
          (_a = this.cleanup) == null ? void 0 : _a.call(this);
        }
        ignoreEvent() {
          return true;
        }
      }
      function build(state, previous = state) {
        var _a, _b, _c, _d;
        const ranges = [];
        if (!state.field(O2.editorLivePreviewField, false)) return Decoration.none;
        const path = (_b = (_a = state.field(O2.editorInfoField, false)) == null ? void 0 : _a.file) == null ? void 0 : _b.path, text = state.doc.toString();
        const view = [...p.editorViews].find((v) => v.state === previous);
        const selected = /* @__PURE__ */ new Set();
        for (const anchor of (_c = view == null ? void 0 : view.dom.querySelectorAll("[data-reference-id]")) != null ? _c : [])
          if ((_d = anchor.trSelection) == null ? void 0 : _d.call(anchor)) selected.add(anchor.dataset.referenceId);
        for (const { r, at } of p.referenceBindings(text, path)) {
          const end = at + r.token.length;
          if (!selected.has(r.id) && state.selection.ranges.some(
            (s) => s.empty ? s.head > at && s.head <= end : s.from < end && s.to > at
          ))
            continue;
          ranges.push(
            Decoration.replace({ widget: new QuoteWidget(r) }).range(
              at,
              end
            )
          );
        }
        return Decoration.set(ranges, true);
      }
      const field = StateField.define({
        create: build,
        update: (old, tr) => {
          var _a, _b, _c, _d;
          if (tr.docChanged) {
            require_source_tracking().transaction(
              p,
              tr,
              (_b = (_a = tr.state.field(O2.editorInfoField, false)) == null ? void 0 : _a.file) == null ? void 0 : _b.path
            );
            require_maintenance().transaction(
              p,
              tr,
              (_d = (_c = tr.state.field(O2.editorInfoField, false)) == null ? void 0 : _c.file) == null ? void 0 : _d.path
            );
          }
          return tr.docChanged || tr.selection || tr.effects.some((e) => e.is(p.refreshEffect)) ? build(tr.state, tr.startState) : old;
        },
        provide: (f) => Prec.highest(EditorView.decorations.from(f))
      });
      const tracking2 = ViewPlugin.fromClass(
        class {
          constructor(view) {
            this.view = view;
            p.editorViews.add(view);
          }
          destroy() {
            p.editorViews.delete(this.view);
          }
        }
      );
      const menus = EditorView.domEventHandlers({
        contextmenu(event, view) {
          var _a, _b, _c, _d;
          if (event.defaultPrevented || ((_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, ".tr-reference")))
            return false;
          const at = event.clientX || event.clientY ? view.posAtCoords({ x: event.clientX, y: event.clientY }) : view.state.selection.main.head;
          if (at == null || !view.state.selection.main.empty) return false;
          const path = (_d = (_c = view.state.field(O2.editorInfoField, false)) == null ? void 0 : _c.file) == null ? void 0 : _d.path;
          const hit = p.referenceBindings(view.state.doc.toString(), path, true).filter((x) => at >= x.at && at < x.at + x.r.token.length);
          if (hit.length !== 1) return false;
          event.preventDefault();
          p.menu(hit[0].r, event, null);
          return true;
        }
      });
      p.registerEditorExtension([field, tracking2, menus]);
    }
    module2.exports = { install };
  }
});

// src/plugin.js
var O = require("obsidian");
var core = require_core();
var tracking = require_source_tracking();
var automatic = require_automatic();
var storage = require_storage();
var words = {
  send: ["\u5F15\u7528\u5230", "Reference to"],
  copy: ["\u590D\u5236\u5F15\u7528", "Copy reference"],
  copied: ["\u5DF2\u590D\u5236\u5F15\u7528", "Reference copied"],
  choose: ["\u9009\u62E9\u7B14\u8BB0", "Choose a note"],
  empty: ["\u8BF7\u9009\u62E9\u6587\u5B57", "Select text first"],
  missing: [
    "\u65E0\u6CD5\u786E\u5B9A\u539F\u53E5\uFF0C\u8BF7\u91CD\u65B0\u5B9A\u4F4D\u3002\u6458\u5F55\u5DF2\u4FDD\u7559\u3002",
    "Cannot locate passage. Snapshot preserved."
  ],
  full: ["\u5168\u6587\uFF0F\u9884\u89C8", "Full text / Preview"],
  split: ["\u5207\u6362\u5168\u5C40\u6765\u6E90\u4F4D\u7F6E", "Toggle global source position"],
  unlink: ["\u53D6\u6D88\u6587\u5B57\u5173\u8054", "Remove text association"],
  update: ["\u7528\u9009\u533A\u66F4\u65B0\u5F15\u6587", "Update reference from selection"],
  relocate: ["\u7528\u9009\u533A\u91CD\u65B0\u5B9A\u4F4D", "Relocate reference from selection"],
  confirm: ["\u786E\u8BA4", "Confirm"],
  cancel: ["\u53D6\u6D88", "Cancel"],
  changed: ["\u7B14\u8BB0\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u64CD\u4F5C", "Note changed. Please try again."],
  migrate: ["\u5907\u4EFD\u5E76\u8FC1\u79FB\u65E7\u7248\u5F15\u7528", "Back up and migrate legacy references"],
  done: ["\u5DF2\u5B8C\u6210", "Done"],
  style: ["\u5F15\u7528\u6837\u5F0F", "Reference style"],
  native: ["\u539F\u751F\u94FE\u63A5", "Native link"],
  body: ["\u8DDF\u968F\u6B63\u6587", "Inherit paragraph"],
  layout: ["\u6765\u6E90\u4F4D\u7F6E", "Source position"],
  inline: ["\u8DDF\u968F\u5F15\u6587", "Inline"],
  separate: ["\u53E6\u8D77\u4E00\u884C", "New line"],
  length: ["\u5F15\u6587\u663E\u793A\u957F\u5EA6", "Preview length"],
  help: [
    "0 \u4E3A\u5168\u6587\u3002\u5B8C\u6574\u6458\u5F55\u4FDD\u5B58\u5728\u7B14\u8BB0\u4E2D\uFF1B\u7CBE\u51C6\u5B9A\u4F4D\u9700\u8981\u5907\u4EFD\u3001\u540C\u6B65\u63D2\u4EF6\u6570\u636E\u3002",
    "0 shows all. Full text stays in your note; back up and sync plugin data for passage navigation."
  ],
  review: [
    "\u8BF7\u6838\u5BF9\u73B0\u6709\u6458\u5F55\u4E0E\u65B0\u9009\u533A\uFF1A",
    "Review the existing text and new selection:"
  ],
  undo: ["\u64A4\u9500", "Undo"],
  open: ["\u6253\u5F00", "Open"],
  error: ["\u64CD\u4F5C\u5931\u8D25", "Operation failed"]
};
var Picker = class extends O.SuggestModal {
  constructor(p, items, choose) {
    super(p.app);
    this.p = p;
    this.items = items;
    this.choose = choose;
    this.setPlaceholder(p.t("choose"));
  }
  getSuggestions(q) {
    return this.items.filter(
      (x) => x.label.toLowerCase().includes(q.toLowerCase())
    );
  }
  renderSuggestion(x, el) {
    el.createDiv({ text: x.label });
    if (x.detail) el.createDiv({ text: x.detail, cls: "tr-muted" });
  }
  onChooseSuggestion(x) {
    this.p.run(() => this.choose(x));
  }
};
var Confirm = class extends O.Modal {
  constructor(p, text, action, review = false) {
    super(p.app);
    this.p = p;
    this.text = text;
    this.action = action;
    this.review = review;
  }
  onOpen() {
    var _a, _b, _c, _d, _e;
    if (this.review) {
      const old = (_b = (_a = this.review.old) != null ? _a : this.text.split("\n\n")[1]) != null ? _b : "";
      const next = (_c = this.review.next) != null ? _c : this.text.split("\n\n").slice(2).join("\n\n").replace(/^→ /, "");
      (_d = this.modalEl) == null ? void 0 : _d.classList.add("tr-review-modal");
      this.contentEl.createEl("h2", {
        text: this.p.zh ? "\u6838\u5BF9\u5F15\u6587" : "Review reference"
      });
      require_comparison().render(
        this.contentEl,
        old,
        next,
        this.p.zh,
        core
      );
    } else
      this.contentEl.createEl("p", { text: this.text, cls: "tr-confirm-text" });
    if ((_e = this.review) == null ? void 0 : _e.openSource)
      new O.Setting(this.contentEl).addButton(
        (b) => b.setButtonText(this.p.zh ? "\u6253\u5F00\u6765\u6E90" : "Open source").onClick(() => this.p.run(() => this.review.openSource(() => this.close())))
      );
    this.errorEl = this.contentEl.createEl("p", { cls: "tr-inline-error" });
    this.errorEl.hidden = true;
    new O.Setting(this.contentEl).addButton(
      (b) => b.setButtonText(
        this.review ? this.p.zh ? "\u6682\u4E0D\u66F4\u65B0" : "Not now" : this.p.t("cancel")
      ).onClick(() => this.close())
    ).addButton(
      (b) => b.setButtonText(
        this.review ? this.p.zh ? "\u66F4\u65B0\u5F15\u6587" : "Update reference" : this.p.t("confirm")
      ).setCta().onClick(() => {
        b.setDisabled(true);
        b.setButtonText(this.p.zh ? "\u66F4\u65B0\u4E2D\u2026" : "Updating\u2026");
        this.errorEl.hidden = true;
        this.p.run(async () => {
          try {
            await this.action();
            this.close();
          } catch (error) {
            console.error("Text Reference update", error);
            const messages = {
              "source-changed": [
                "\u539F\u6587\u518D\u6B21\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6838\u5BF9\u3002",
                "Source changed. Close and review again."
              ],
              "target-changed": [
                "\u76EE\u6807\u5F15\u6587\u5DF2\u88AB\u6539\u52A8\uFF0C\u5DF2\u505C\u6B62\u66F4\u65B0\u3002",
                "Target reference changed. Update stopped."
              ],
              "editor-sync": [
                "\u7F16\u8F91\u5668\u6B63\u5728\u540C\u6B65\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
                "Editors are synchronizing. Please retry shortly."
              ],
              "write-failed": [
                "\u65E0\u6CD5\u5199\u5165\u7B14\u8BB0\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u8BD5\u3002",
                "Could not write the note. Please retry."
              ]
            };
            this.errorEl.textContent = (messages[error.code] || [
              "\u66F4\u65B0\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5\u3002",
              "Update did not complete. Please retry."
            ])[this.p.zh ? 0 : 1];
            this.errorEl.hidden = false;
          } finally {
            b.setDisabled(false);
            b.setButtonText(this.p.zh ? "\u66F4\u65B0\u5F15\u6587" : "Update reference");
          }
        });
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var Review = class extends O.Modal {
  constructor(p, r, text, verified) {
    super(p.app);
    this.p = p;
    this.r = r;
    this.text = text;
    this.verified = verified;
  }
  onOpen() {
    this.contentEl.createEl("p", { text: this.text });
    this.contentEl.createEl("blockquote", { text: this.p.display(this.r) });
    new O.Setting(this.contentEl).addButton(
      (b) => b.setButtonText(this.p.zh ? "\u6253\u5F00\u6765\u6E90" : "Open source").onClick(
        () => this.p.run(() => this.p.open(this.r, false, {
          verified: this.verified,
          onOpened: () => this.close()
        }))
      )
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
module.exports = class TextReference extends O.Plugin {
  t(key) {
    var _a;
    return ((_a = words[key]) == null ? void 0 : _a[this.zh ? 0 : 1]) || key;
  }
  run(fn) {
    return Promise.resolve().then(fn).catch((e) => {
      console.error("Text Reference", e);
      new O.Notice(this.t("error") + ": " + e.message);
    });
  }
  async onload() {
    var _a, _b, _c;
    this.core = core;
    this.Obsidian = O;
    this.fullQuotes = /* @__PURE__ */ new Set();
    this.readingLinks = /* @__PURE__ */ new Map();
    this.readingBindings = /* @__PURE__ */ new WeakMap();
    this.readingRoots = /* @__PURE__ */ new Map();
    this.automaticNotes = /* @__PURE__ */ new Map();
    (_a = this.registerHoverLinkSource) == null ? void 0 : _a.call(this, "text-reference", {
      display: "Text Reference",
      defaultMod: true
    });
    this.zh = (((_b = O.getLanguage) == null ? void 0 : _b.call(O)) || "en").startsWith("zh");
    const data = await this.loadData() || {};
    this.settings = {
      layout: "inline",
      limit: 30,
      style: "native",
      notifySourceChanges: true,
      recent: [],
      ...data.settings || {
        layout: data.layout || "inline",
        limit: (_c = data.limit) != null ? _c : 30
      }
    };
    this.refs = storage.unpack(data);
    this.removedRefs = /* @__PURE__ */ new Map();
    tracking.init(this);
    this.saving = Promise.resolve();
    this.settingsTab = new Settings(this.app, this);
    this.addSettingTab(this.settingsTab);
    for (const id of ["copy", "send"])
      this.addCommand({
        id,
        name: this.t(id),
        ...id === "copy" ? { hotkeys: [{ modifiers: ["Mod", "Shift"], key: "C" }] } : {},
        editorCallback: (editor, view) => this.run(
          () => id === "copy" ? this.copy(editor, view) : this.send(editor, view)
        )
      });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        if (editor.somethingSelected())
          for (const id of ["send", "copy"])
            menu.addItem(
              (i) => i.setTitle(this.t(id)).setIcon(id === "copy" ? "copy" : "link").onClick(
                () => this.run(
                  () => id === "copy" ? this.copy(editor, view) : this.send(editor, view)
                )
              )
            );
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor, view) => {
        var _a2, _b2;
        if (event.defaultPrevented || (((_a2 = editor.listSelections) == null ? void 0 : _a2.call(editor).length) || 1) > 1 || !view.file || !this.pending || ((_b2 = event.clipboardData) == null ? void 0 : _b2.getData("text/plain")) !== this.pending.token)
          return;
        event.preventDefault();
        const { r, anchor } = this.pending, token = this.pending.token, at = editor.posToOffset(editor.getCursor("from"));
        editor.replaceSelection(token);
        const record = this.registerReference(
          r,
          view.file.path,
          token,
          editor.getValue(),
          at
        );
        if (anchor) this.sourceAnchors.set(record.id, { ...anchor });
        if (this.settings.notifySourceChanges) tracking.schedule(this, record.source);
        this.run(() => this.save());
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => this.invalidateAutomatic(file.path))
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, old) => {
        this.invalidateAutomatic(old);
        this.invalidateAutomatic(file.path);
        tracking.invalidate(this, old);
        tracking.invalidate(this, file.path);
        clearTimeout(this.sourceTimers.get(old));
        this.sourceTimers.delete(old);
        this.sourceRequests.delete(old);
        if (this.sourceVersions.has(old)) {
          this.sourceVersions.set(file.path, this.sourceVersions.get(old));
          this.sourceVersions.delete(old);
        }
        for (const r of this.refs) {
          if (r.source === old) {
            r.source = file.path;
            r.renameToken = this.token(r);
            for (const map of [this.sourceDrafts, this.sourceAnchors]) {
              const item = map.get(r.id);
              if (item) item.source = file.path;
            }
          }
          if (r.target === old) r.target = file.path;
        }
        this.run(() => this.save());
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.invalidateAutomatic(file.path);
        tracking.invalidate(this, file.path);
        for (const r of [...this.refs])
          if (r.target === file.path) {
            this.removedRefs.set(r.id, r);
            this.refs = this.refs.filter((x) => x.id !== r.id);
          }
        clearTimeout(this.sourceTimers.get(file.path));
        this.sourceTimers.delete(file.path);
        this.sourceRequests.delete(file.path);
        this.sourceVersions.delete(file.path);
        const missing = this.refs.filter((r) => r.source === file.path);
        for (const r of missing) {
          this.sourceDrafts.delete(r.id);
          this.sourceAnchors.delete(r.id);
          if (this.settings.notifySourceChanges)
            this.sourceStatus.set(r.id, "missing");
        }
        this.run(() => this.save());
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        this.invalidateAutomatic(file.path);
        tracking.invalidate(this, file.path);
        if (this.settings.notifySourceChanges && this.refs.some((r) => r.source === file.path))
          tracking.schedule(this, file.path);
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!file || !this.settings.notifySourceChanges) return;
        for (const path of new Set(
          this.refs.filter((r) => r.target === file.path || r.source === file.path).map((r) => r.source)
        ))
          tracking.schedule(this, path);
      })
    );
    this.registerMarkdownPostProcessor((el, ctx) => this.bindReading(el, ctx));
    this.installEditor();
    await tracking.checkAll(this);
    this.registerDomEvent(document, "copy", () => {
      this.pending = null;
    });
    this.registerDomEvent(document, "cut", () => {
      this.pending = null;
    });
  }
  referenceBindings(text, path, includeRepair) {
    return automatic.bindings(this, text, path, includeRepair);
  }
  invalidateAutomatic(path) {
    if (!automatic.invalidate(this, path)) return;
    clearTimeout(this.automaticRefreshTimer);
    this.automaticRefreshTimer = setTimeout(() => this.run(async () => {
      await this.rebindReading();
      this.refreshDisplays();
    }), 50);
  }
  async bindReading(el, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (!el.querySelector("a.internal-link")) return;
    if (!this.readingRoots.has(el)) {
      this.readingRoots.set(el, ctx);
      const owner = new O.MarkdownRenderChild(el);
      ctx.addChild(owner);
      const retry = setTimeout(() => {
        if (this.readingRoots.has(el) && el.isConnected)
          this.run(() => this.bindReading(el, ctx));
      }, 0);
      owner.register(() => {
        clearTimeout(retry);
        this.readingRoots.delete(el);
      });
    }
    const path = ctx.sourcePath;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) {
      for (const a of el.querySelectorAll("a.internal-link"))
        (_a = this.readingBindings.get(a)) == null ? void 0 : _a.release();
      return;
    }
    const text = await tracking.read(this, file);
    if (!this.readingRoots.has(el)) return;
    const bindings = this.referenceBindings(text, path, true);
    const entry = this.automaticNotes.get(path);
    const section = (_b = ctx.getSectionInfo) == null ? void 0 : _b.call(ctx, el);
    let start = 0, end = text.length;
    if (section) {
      const lines = (_c = entry.lineStarts) != null ? _c : entry.lineStarts = [0, ...Array.from(text.matchAll(/\n/g), (m) => m.index + 1)];
      if (lines[section.lineStart] === void 0) return;
      start = lines[section.lineStart];
      end = (_d = lines[section.lineEnd + 1]) != null ? _d : text.length;
    }
    const key = (source, label) => JSON.stringify([source, label]);
    const groups = /* @__PURE__ */ new Map();
    for (const { r, at } of bindings) {
      if (at < start || at + r.token.length > end) continue;
      const id = key(r.source, core.visibleToken(r.token));
      if (!groups.has(id))
        groups.set(id, { refs: /* @__PURE__ */ new Map(), anchors: [], tokens: /* @__PURE__ */ new Set() });
      const group = groups.get(id);
      group.refs.set(at, r);
      group.tokens.add(r.token);
    }
    const syntax = /* @__PURE__ */ new Map();
    for (const { at, token } of entry.links) {
      if (at < start || at + token.length > end) continue;
      if (!syntax.has(token)) syntax.set(token, []);
      syntax.get(token).push(at);
    }
    const anchors = el.querySelectorAll("a.internal-link");
    for (const a of anchors) {
      const href = a.getAttribute("data-href");
      if (!href) continue;
      const source = this.app.metadataCache.getFirstLinkpathDest(href, path);
      const label = (_f = (_e = this.readingBindings.get(a)) == null ? void 0 : _e.label) != null ? _f : a.textContent;
      let group = groups.get(key((_g = source == null ? void 0 : source.path) != null ? _g : href, label));
      if (!group && !source && href.includes("%")) {
        try {
          group = groups.get(key(decodeURIComponent(href), label));
        } catch (e) {
        }
      }
      group == null ? void 0 : group.anchors.push(a);
    }
    const desired = /* @__PURE__ */ new Map();
    for (const { refs, anchors: anchors2, tokens } of groups.values()) {
      const offsets = new Set(refs.keys());
      for (const token of tokens)
        for (const at of (_h = syntax.get(token)) != null ? _h : []) offsets.add(at);
      const positions = [...offsets];
      if (positions.length !== anchors2.length) continue;
      positions.sort((a, b) => a - b);
      anchors2.forEach((a, i) => desired.set(a, refs.get(positions[i])));
    }
    for (const a of anchors) {
      const r = desired.get(a);
      const bound = this.readingBindings.get(a);
      if (r && (bound == null ? void 0 : bound.id) === r.id && bound.source === r.source && bound.reviewId === r.reviewId && bound.repair === Boolean(r.repair)) continue;
      if ((_i = a.trSelection) == null ? void 0 : _i.call(a)) continue;
      bound == null ? void 0 : bound.release();
      if (!r) continue;
      const label = a.textContent;
      const attributes = ["contenteditable", "draggable", "title"].map(
        (name) => [name, a.getAttribute(name)]
      );
      const child = new O.MarkdownRenderChild(a);
      const cleanup = require_interaction().bind(this, a, r);
      const release = () => {
        var _a2;
        if (((_a2 = this.readingBindings.get(a)) == null ? void 0 : _a2.release) !== release) return;
        cleanup();
        this.readingBindings.delete(a);
        this.readingLinks.delete(a);
        a.textContent = label;
        a.classList.remove("tr-reference", "tr-body");
        delete a.trPaint;
        for (const [name, value] of attributes)
          if (value === null) a.removeAttribute(name);
          else a.setAttribute(name, value);
      };
      this.readingBindings.set(a, {
        id: r.id,
        source: r.source,
        reviewId: r.reviewId,
        repair: Boolean(r.repair),
        label,
        release
      });
      this.readingLinks.set(a, r);
      if (!r.repair) this.paint(a, r);
      child.register(release);
      ctx.addChild(child);
    }
  }
  refreshDisplays() {
    var _a;
    this.refreshEditors();
    for (const [a, r] of this.readingLinks || [])
      if (a.isConnected && !((_a = a.trSelection) == null ? void 0 : _a.call(a))) {
        const current = !r.target || r.automatic ? r : this.refs.find((x) => x.id === r.id);
        if (current && !current.repair) this.paint(a, current);
      }
  }
  schedulePersist() {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.run(() => this.persist()), 250);
  }
  onunload() {
    var _a;
    (_a = this.previewClose) == null ? void 0 : _a.call(this, true);
    clearTimeout(this.persistTimer);
    clearTimeout(this.automaticRefreshTimer);
    for (const entry of this.automaticNotes.values()) clearTimeout(entry.timer);
    this.automaticNotes.clear();
    this.trackingStopped = true;
    tracking.reset(this);
    this.persist();
  }
  async rebindReading() {
    for (const [el, ctx] of this.readingRoots)
      if (el.isConnected) await this.bindReading(el, ctx);
  }
  async save() {
    await this.rebindReading();
    this.refreshDisplays();
    return this.persist();
  }
  persist() {
    tracking.prune(this);
    const value = JSON.parse(JSON.stringify(storage.pack(this.settings, this.refs)));
    this.saving = this.saving.catch(() => {
    }).then(() => this.saveData(value));
    return this.saving;
  }
  selection(editor, view) {
    var _a;
    if (!view.file) throw Error(this.t("empty"));
    if (!((_a = editor.getSelection) == null ? void 0 : _a.call(editor).trim())) throw Error(this.t("empty"));
    const r = core.capture(
      editor.getValue(),
      editor.posToOffset(editor.getCursor("from")),
      editor.posToOffset(editor.getCursor("to")),
      view.file.path,
      this.settings
    );
    if (!r.quote.trim()) throw Error(this.t("empty"));
    r.name = view.file.basename;
    if (this.settings.notifySourceChanges && !this.sourceVersions.has(r.source))
      this.sourceVersions.set(r.source, editor.getValue());
    return r;
  }
  token(r) {
    return core.inlineLink(r.source, this.display(r), r.name);
  }
  display(r) {
    var _a;
    return r.automatic ? r.quote : core.readable((_a = r.snapshot) != null ? _a : r.quote);
  }
  refreshEditors() {
    for (const view of this.editorViews || [])
      view.dispatch({ effects: this.refreshEffect.of(null) });
  }
  async copy(editor, view) {
    const r = this.selection(editor, view);
    const token = this.token(r);
    await navigator.clipboard.writeText(token);
    this.pending = { r, token };
    new O.Notice(this.t("copied"), 1500);
  }
  referenceClipboard(r) {
    const { v, source, name, quote, snapshot, prefix, suffix, locator } = r;
    return {
      r: { v, source, name, quote, snapshot, prefix, suffix, locator },
      token: r.token,
      anchor: this.sourceAnchors.get(r.id)
    };
  }
  registerReference(r, path, token, text, at) {
    const record = core.bind(r, path, token, text, at);
    require_maintenance().register(this, record, text);
    this.refreshEditors();
    return record;
  }
  async send(editor, view) {
    const r = this.selection(editor, view);
    new Picker(
      this,
      this.app.vault.getMarkdownFiles().filter((f) => f.path !== r.source).map((file) => ({ label: file.basename, detail: file.path, file })),
      async ({ file }) => {
        const token = this.token(r);
        let at, after;
        await this.app.vault.process(file, (text) => {
          at = text.length + (text.endsWith("\n") ? 0 : 1);
          after = text + (text.endsWith("\n") ? "" : "\n") + token;
          return after;
        });
        const record = this.registerReference(r, file.path, token, after, at);
        await this.save();
        const message = document.createDocumentFragment();
        message.append(this.t("done") + " ");
        for (const [key, fn] of [
          ["open", () => this.app.workspace.getLeaf("tab").openFile(file)],
          [
            "undo",
            async () => {
              await this.change(record, () => "");
              this.refs = this.refs.filter((x) => x.id !== record.id);
              await this.save();
            }
          ]
        ]) {
          const a = document.createElement("a");
          a.textContent = this.t(key);
          a.href = "#";
          a.onclick = (e) => {
            e.preventDefault();
            this.run(fn);
          };
          message.append(a, " ");
        }
        new O.Notice(message, 4e3);
      }
    ).open();
  }
  paint(a, r) {
    var _a, _b;
    const signature = JSON.stringify([
      this.display(r),
      r.name,
      this.settings.style,
      this.settings.layout,
      this.settings.limit,
      this.fullQuotes.has(r.id),
      (_a = this.sourceStatus) == null ? void 0 : _a.get(r.id)
    ]);
    if (a.trPaint === signature) return;
    a.trPaint = signature;
    a.classList.add("tr-reference");
    a.classList.toggle("tr-body", this.settings.style === "body");
    a.removeAttribute("title");
    a.textContent = "";
    a.appendText(
      core.preview(
        this.display(r),
        core.limit(this.fullQuotes.has(r.id) ? 0 : this.settings.limit)
      )
    );
    const source = a.createSpan({ text: "\uFF08" + r.name + "\uFF09" });
    if (this.settings.layout === "split") source.classList.add("tr-newline");
    const status = (_b = this.sourceStatus) == null ? void 0 : _b.get(r.id);
    if (this.settings.notifySourceChanges && status && status !== "found")
      source.createSpan({
        text: this.zh ? status === "changed" ? " \xB7 \u539F\u6587\u5DF2\u53D8\u5316" : " \xB7 \u5F85\u6838\u5BF9" : status === "changed" ? " \xB7 Source changed" : " \xB7 Review",
        cls: "tr-review-hint"
      });
  }
  menu(r, event, a) {
    var _a;
    const menu = new O.Menu();
    const review = r.reviewId ? (_a = this.refs.find((x) => x.id === r.reviewId)) != null ? _a : r : r;
    menu.addItem(
      (i) => i.setTitle(this.zh ? "\u6838\u5BF9\u539F\u6587\u2026" : "Review source\u2026").setIcon("scan-text").onClick(() => this.run(() => this.reviewSource(review)))
    );
    menu.addItem(
      (i) => i.setTitle(
        this.zh ? this.fullQuotes.has(r.id) ? "\u6536\u8D77\u5168\u6587" : "\u663E\u793A\u5168\u6587" : this.fullQuotes.has(r.id) ? "Collapse text" : "Show full text"
      ).onClick(() => {
        if (this.fullQuotes.has(r.id)) this.fullQuotes.delete(r.id);
        else this.fullQuotes.add(r.id);
        if (a) this.paint(a, r);
        this.refreshDisplays();
      })
    );
    menu.showAtMouseEvent(event);
  }
  async open(r, newTab, { verified, onOpened } = {}) {
    var _a, _b, _c, _d, _e;
    const file = tracking.sourceFile(this, r);
    if (!file) {
      if (!onOpened && r.automatic && this.app.workspace.openLinkText)
        return this.app.workspace.openLinkText(r.linkPath, r.target, newTab);
      new O.Notice(this.t("missing"));
      return;
    }
    if (r.automatic && file.path !== r.source) r = { ...r, source: file.path };
    const workspace = this.app.workspace;
    const leaf = !newTab && ((_a = workspace.getLeavesOfType) == null ? void 0 : _a.call(workspace, "markdown").find((l) => {
      var _a2, _b2;
      return ((_b2 = (_a2 = l.view) == null ? void 0 : _a2.file) == null ? void 0 : _b2.path) === r.source;
    })) || workspace.getLeaf(newTab ? "tab" : false);
    await leaf.openFile(file, { active: true, state: { mode: "source" } });
    await ((_b = leaf.loadIfDeferred) == null ? void 0 : _b.call(leaf));
    onOpened == null ? void 0 : onOpened();
    await ((_c = workspace.revealLeaf) == null ? void 0 : _c.call(workspace, leaf));
    const view = leaf.view;
    const editor = view instanceof O.MarkdownView && ((_d = view.file) == null ? void 0 : _d.path) === file.path ? view.editor : null;
    if (editor) {
      const text = editor.getValue();
      const found = (verified == null ? void 0 : verified.text) === text ? verified : await tracking.resolve(this, text, r);
      if (leaf.view === view && ((_e = view.file) == null ? void 0 : _e.path) === file.path && view.editor === editor && editor.getValue() === text && found.start !== void 0) {
        const from = editor.offsetToPos(found.start);
        const to = editor.offsetToPos(found.end);
        editor.setSelection(from, to);
        editor.scrollIntoView({ from, to }, true);
        editor.focus();
        return { leaf, located: true };
      }
    }
    new O.Notice(this.zh ? "\u5DF2\u6253\u5F00\u6765\u6E90\uFF0C\u6682\u65E0\u6CD5\u786E\u5B9A\u539F\u53E5\u4F4D\u7F6E\u3002" : "Source opened, but the passage could not be located.");
    return { leaf, located: false };
  }
  async change(r, fn) {
    const fail = () => Object.assign(new Error(this.t("changed")), { code: "target-changed" });
    const file = this.app.vault.getAbstractFileByPath(r.target);
    if (!file) throw fail();
    const opened = [...this.editorViews || []].filter(
      (v) => {
        var _a, _b;
        return ((_b = (_a = v.state.field(O.editorInfoField, false)) == null ? void 0 : _a.file) == null ? void 0 : _b.path) === r.target;
      }
    );
    const originalToken = r.token;
    const replacement = fn();
    if (opened.length) {
      const view = opened.find((v) => v.hasFocus) || opened[0], text = view.state.doc.toString();
      if (opened.some((v) => v.state.doc.toString() !== text))
        throw Object.assign(fail(), { code: "editor-sync" });
      const at = core.binding(text, r);
      if (at < 0) throw fail();
      view.dispatch({
        changes: {
          from: at,
          to: at + originalToken.length,
          insert: replacement
        }
      });
      const result = view.state.doc.toString();
      if (result !== text.slice(0, at) + replacement + text.slice(at + originalToken.length))
        throw fail();
      return { text: result, kind: "editor" };
    }
    try {
      await this.app.vault.process(file, (text) => {
        const at = core.binding(text, r);
        if (at < 0) throw fail();
        return text.slice(0, at) + replacement + text.slice(at + originalToken.length);
      });
      return { text: await this.app.vault.read(file), kind: "file" };
    } catch (error) {
      if (error.code === "target-changed") throw error;
      throw Object.assign(new Error("Cannot write reference"), {
        code: "write-failed",
        cause: error
      });
    }
  }
  hotkeyLabel() {
    var _a, _b, _c, _d, _e, _f;
    const id = "text-reference:copy";
    const keys = (_e = (_b = (_a = this.app.hotkeyManager) == null ? void 0 : _a.getHotkeys) == null ? void 0 : _b.call(_a, id)) != null ? _e : (_d = (_c = this.app.hotkeyManager) == null ? void 0 : _c.getDefaultHotkeys) == null ? void 0 : _d.call(_c, id);
    if (keys)
      return keys.length ? keys.map(
        (k) => k.modifiers.map(
          (m) => {
            var _a2;
            return m === "Mod" ? ((_a2 = O.Platform) == null ? void 0 : _a2.isMacOS) ? "Cmd" : "Ctrl" : m;
          }
        ).join("+") + "+" + k.key
      ).join(" / ") : this.zh ? "\u672A\u8BBE\u7F6E" : "Unassigned";
    return ((_f = O.Platform) == null ? void 0 : _f.isMacOS) ? "Cmd+Shift+C" : "Ctrl+Shift+C";
  }
  customizeHotkey() {
    var _a, _b, _c, _d, _e;
    (_b = (_a = this.app.setting) == null ? void 0 : _a.open) == null ? void 0 : _b.call(_a);
    const tab = (_d = (_c = this.app.setting) == null ? void 0 : _c.openTabById) == null ? void 0 : _d.call(_c, "hotkeys");
    const target = tab || ((_e = this.app.setting) == null ? void 0 : _e.activeTab);
    if (target == null ? void 0 : target.setQuery) target.setQuery("Text Reference");
    else
      new O.Notice(
        this.zh ? "\u8BF7\u5728\u8BBE\u7F6E\u2192\u5FEB\u6377\u952E\u4E2D\u641C\u7D22 Text Reference" : "Search Text Reference in Settings \u2192 Hotkeys"
      );
  }
  checkSource(file) {
    return tracking.check(this, file);
  }
  async reviewSource(r) {
    if (!r.automatic && !this.refs.includes(r)) throw Error(this.t("changed"));
    const file = tracking.sourceFile(this, r);
    if (!file) {
      new Review(this, r, this.t("missing")).open();
      return;
    }
    if (r.automatic && file.path !== r.source) r = { ...r, source: file.path };
    const text = await tracking.read(this, file);
    const draft = this.sourceDrafts.get(r.id);
    if ((draft == null ? void 0 : draft.source) === r.source && draft.text === text && draft.quote !== r.quote) {
      await this.confirmReference(r, draft, "update");
      return;
    }
    const found = await tracking.resolve(this, text, r);
    if (found.status === "changed" || r.repair && found.status === "found") {
      if (r.automatic) {
        const saved = await automatic.promote(this, r, text, found);
        if (!saved) throw Error(this.t("changed"));
        r = saved;
      }
      await this.confirmReference(
        r,
        {
          source: r.source,
          text,
          start: found.start,
          end: found.end,
          quote: text.slice(found.start, found.end),
          prefix: text.slice(Math.max(0, found.start - 64), found.start),
          suffix: text.slice(found.end, found.end + 64)
        },
        "update"
      );
      return;
    }
    new Review(
      this,
      r,
      found.status === "found" ? this.zh ? "\u539F\u6587\u672A\u53D8\u5316\u3002" : "Source is unchanged." : this.zh ? "\u6682\u65F6\u65E0\u6CD5\u786E\u5B9A\u539F\u6587\u8303\u56F4\uFF0C\u5DF2\u4FDD\u7559\u6458\u5F55\u3002\u9700\u8981\u66F4\u6362\u65F6\uFF0C\u8BF7\u91CD\u65B0\u590D\u5236\u5F15\u7528\u3002" : "Cannot determine passage. Snapshot preserved. Copy a new reference to replace it.",
      found.start === void 0 ? void 0 : { ...found, text }
    ).open();
  }
  async confirmReference(r, selected, mode = "update") {
    var _a;
    const expected = { ...r };
    const file = this.app.vault.getAbstractFileByPath(r.source);
    if (!file || selected.source !== r.source) throw Error(this.t("changed"));
    const sourceText = await tracking.read(this, file);
    if (selected.text !== void 0 ? selected.text !== sourceText : core.locate(sourceText, selected).status !== "found")
      throw Error(this.t("changed"));
    if (Number.isInteger(selected.start) && Number.isInteger(selected.end) && sourceText.slice(selected.start, selected.end) === selected.quote) {
      selected = { ...selected, locator: {
        source: r.source,
        start: selected.start,
        end: selected.end,
        hash: await tracking.fingerprint(sourceText)
      } };
    }
    new Confirm(
      this,
      (this.zh ? mode === "update" ? "\u66F4\u65B0\u6B64\u5904\u5F15\u6587\uFF1F" : "\u4EC5\u4FEE\u590D\u4F4D\u7F6E\uFF0C\u4FDD\u7559\u73B0\u6709\u6458\u5F55\uFF1F" : mode === "update" ? "Update this reference?" : "Repair location and keep the snapshot?") + "\n\n" + this.display(r) + "\n\n\u2192 " + core.readable(selected.quote),
      async () => {
        if (await tracking.read(this, file) !== sourceText)
          throw Object.assign(new Error(this.t("changed")), {
            code: "source-changed"
          });
        const op = await require_updates().apply(
          this,
          r,
          selected,
          mode,
          expected
        );
        const message = document.createDocumentFragment();
        message.append(
          op.pendingSave ? this.zh ? "\u6B63\u6587\u5DF2\u66F4\u65B0\uFF0C\u5173\u8054\u6570\u636E\u5C1A\u672A\u4FDD\u5B58\u3002 " : "Text updated; association save pending. " : this.t("done") + " "
        );
        if (op.pendingSave) {
          const retry = document.createElement("a");
          retry.textContent = this.zh ? "\u91CD\u8BD5\u4FDD\u5B58" : "Retry save";
          retry.href = "#";
          retry.onclick = (e) => {
            e.preventDefault();
            this.run(async () => {
              await this.persist();
              op.pendingSave = false;
              retry.textContent = this.zh ? "\u5DF2\u4FDD\u5B58" : "Saved";
            });
          };
          message.append(retry, " ");
        }
        const undo = document.createElement("a");
        undo.textContent = this.t("undo");
        undo.href = "#";
        undo.onclick = (e) => {
          e.preventDefault();
          this.run(async () => {
            await require_updates().revert(this, op);
            if (this.settings.notifySourceChanges) await this.checkSource(file);
          });
        };
        message.append(undo);
        new O.Notice(message, op.pendingSave ? 0 : 4e3);
      },
      {
        old: r.repair ? core.referenceText(r) : (_a = r.snapshot) != null ? _a : r.quote,
        next: selected.quote,
        openSource: (onOpened) => this.open(r, false, {
          verified: selected.locator ? { ...selected.locator, text: sourceText } : void 0,
          onOpened
        })
      }
    ).open();
  }
  async migrate() {
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (file.path.startsWith("Text Reference Backups/")) continue;
      const original = await this.app.vault.read(file), old = core.records(original);
      if (!old.length) continue;
      const folder = "Text Reference Backups";
      if (!this.app.vault.getAbstractFileByPath(folder))
        await this.app.vault.createFolder(folder);
      await this.app.vault.create(
        folder + "/" + Date.now() + "-" + globalThis.crypto.randomUUID() + ".txt",
        original
      );
      let text = original;
      const added = [];
      for (const item of [...old].reverse()) {
        const wiki = item.link.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
        const markdown = item.link.match(/\]\((.+)\)$/);
        let path = (wiki == null ? void 0 : wiki[1]) || (markdown == null ? void 0 : markdown[1]) || item.r.source;
        if (markdown) {
          try {
            path = decodeURIComponent(path.replace(/^<|>$/g, ""));
          } catch (e) {
          }
        }
        const source = this.app.metadataCache.getFirstLinkpathDest(
          path,
          file.path
        );
        if (!source) throw Error(this.t("missing"));
        const r = {
          ...item.r,
          source: source.path,
          snapshot: item.body,
          name: source.basename
        }, token = this.token(r);
        text = text.slice(0, item.start) + token + text.slice(item.end);
        added.push({ r, token });
      }
      await this.app.vault.process(file, (current) => {
        if (current !== original) throw Error(this.t("changed"));
        return text;
      });
      for (const { r, token } of added)
        this.refs.push(
          core.bind(r, file.path, token, text, text.indexOf(token))
        );
      await this.save();
    }
    new O.Notice(this.t("done"));
  }
  installEditor() {
    require_editor().install(this, O);
  }
  async onExternalSettingsChange() {
    await this.saving;
    const data = await this.loadData();
    if (!data || !Array.isArray(data.refs)) return;
    this.refs = storage.unpack(data).filter((r) => !this.removedRefs.has(r.id));
    tracking.reset(this);
    await this.rebindReading();
    this.refreshDisplays();
    if (this.settings.notifySourceChanges) await tracking.checkAll(this);
  }
};
var Settings = class extends O.PluginSettingTab {
  constructor(app, p) {
    super(app, p);
    this.p = p;
  }
  display() {
    const p = this.p, e = this.containerEl;
    for (const a of p.readingLinks.keys())
      if (e.contains(a)) p.readingLinks.delete(a);
    e.empty();
    e.createEl("h2", { text: "Text Reference" });
    for (const [key, options] of [
      ["layout", ["inline", "split"]],
      ["style", ["native", "body"]]
    ])
      new O.Setting(e).setName(p.t(key)).addDropdown((d) => {
        for (const option of options)
          d.addOption(option, p.t(option === "split" ? "separate" : option));
        d.setValue(p.settings[key]).onChange((value) => {
          p.fullQuotes.clear();
          p.settings[key] = value;
          p.run(() => p.save());
        });
      });
    new O.Setting(e).setName(p.t("length")).setDesc(
      p.zh ? "0 \u4E3A\u5168\u6587\uFF0C\u4EC5\u5F71\u54CD\u663E\u793A\u3002" : "0 shows the full text. Presentation only."
    ).addText(
      (t) => t.setValue(String(p.settings.limit)).onChange((value) => {
        if (/^\d+$/.test(value)) {
          p.fullQuotes.clear();
          p.settings.limit = core.limit(value);
          p.run(() => p.save());
        }
      })
    );
    e.createEl("div", {
      text: p.zh ? "\u663E\u793A\u793A\u4F8B" : "Display example",
      cls: "tr-muted"
    });
    const example = e.createEl("p", { cls: "tr-settings-example" });
    const sample = {
      id: "settings-example",
      quote: p.zh ? "\u5F15\u7528\u4E00\u53E5\u8BDD\uFF0C\u8BA9\u60F3\u6CD5\u81EA\u7136\u878D\u5165\u6587\u7AE0\uFF1B\u6765\u6E90\u7B14\u8BB0\u4FDD\u6301\u539F\u6837\uFF0C\u968F\u65F6\u56DE\u5230\u51FA\u5904\u67E5\u770B\u4E0A\u4E0B\u6587\u3002" : "Text Reference brings passages into your writing while preserving source notes and linking back to their context.",
      name: p.zh ? "\u4F7F\u7528\u6307\u5357" : "User guide"
    };
    p.paint(example, sample);
    p.readingLinks.set(example, sample);
    e.createEl("p", {
      cls: "tr-help",
      text: p.zh ? "\u9009\u4E2D\u6587\u5B57\uFF0C\u53F3\u952E\u590D\u5236\u5F15\u7528\u540E\u7C98\u8D34\uFF1B\u6216\u7528\u5F15\u7528\u5230\u76F4\u63A5\u6DFB\u52A0\u3002\n\u8F93\u5165\u6216\u7C98\u8D34 [[\u7B14\u8BB0|\u5F15\u6587\uFF08\u7B14\u8BB0\uFF09]] \u4F1A\u81EA\u52A8\u5E94\u7528\u5F15\u7528\u6837\u5F0F\u3002\nCtrl\uFF08Mac \u7528 Cmd\uFF09\uFF0B\u60AC\u505C\u9884\u89C8\u4E0A\u4E0B\u6587\uFF1B\u5355\u51FB\u8DF3\u8F6C\uFF0C\u62D6\u52A8\u9009\u5B57\u3002\n\u53F3\u952E\u5F15\u6587\u2192\u6838\u5BF9\u539F\u6587\uFF0C\u5BF9\u6BD4\u540E\u786E\u8BA4\u66F4\u65B0\u3002\n\u663E\u793A\u8BBE\u7F6E\u5373\u65F6\u5E94\u7528\u4E8E\u5DF2\u6709\u5F15\u7528\u3002\u6765\u6E90\u7B14\u8BB0\u4FDD\u6301\u4E0D\u53D8\uFF1B\u8DE8\u8BBE\u5907\u8BF7\u540C\u6B65\u63D2\u4EF6\u6570\u636E\u3002" : "Select text, copy a reference and paste; or use Reference to.\nTyping or pasting [[Note|Passage (Note)]] applies reference styling automatically.\nCtrl/Cmd + hover previews context; click navigates; drag selects text.\nRight-click a reference \u2192 Review source to compare and update.\nDisplay settings apply to existing references. Source notes stay untouched; sync plugin data across devices."
    });
    new O.Setting(e).setName(p.zh ? "\u590D\u5236\u5F15\u7528\u5FEB\u6377\u952E" : "Copy reference shortcut").setDesc(p.hotkeyLabel()).addButton(
      (b) => b.setButtonText(p.zh ? "\u81EA\u5B9A\u4E49" : "Customize").onClick(() => p.customizeHotkey())
    );
    new O.Setting(e).setName(p.zh ? "\u8FFD\u8E2A\u539F\u6587\u53D8\u5316" : "Track source changes").setDesc(
      p.zh ? "\u81EA\u52A8\u68C0\u67E5\u88AB\u5F15\u7528\u7684\u539F\u6587\uFF1B\u53D8\u5316\u65F6\u5728\u5F15\u6587\u65C1\u6807\u8BB0\uFF0C\u6838\u5BF9\u540E\u66F4\u65B0\u3002" : "Review source changes before updating snapshots. Checks referenced notes only."
    ).addToggle(
      (t) => t.setValue(p.settings.notifySourceChanges !== false).onChange((value) => {
        p.settings.notifySourceChanges = value;
        tracking.reset(p);
        p.refreshDisplays();
        p.run(async () => {
          await p.save();
          if (value) await tracking.checkAll(p, true);
        });
      })
    );
    new O.Setting(e).setName(p.zh ? "\u6062\u590D\u9ED8\u8BA4\u663E\u793A" : "Restore display defaults").addButton(
      (b) => b.setButtonText(p.zh ? "\u6062\u590D" : "Restore").onClick(() => {
        Object.assign(p.settings, {
          style: "native",
          layout: "inline",
          limit: 30
        });
        p.fullQuotes.clear();
        p.run(() => p.save());
        this.display();
      })
    );
  }
};
/*! Bundled license information:

markdown-it/dist/markdown-it.cjs.js:
  (*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT *)
*/
