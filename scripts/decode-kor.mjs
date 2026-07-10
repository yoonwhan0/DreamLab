const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅣ";
const JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";
const KEY = {
  q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
  a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
  z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ",
};

function compose(cho, jung, jong = " ") {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const ki = JONG.indexOf(jong);
  if (ci < 0 || ji < 0 || ki < 0) return "";
  return String.fromCodePoint(0xac00 + ci * 588 + ji * 28 + ki);
}

function decode(str) {
  let res = "";
  let cho, jung, jong;
  const flush = () => {
    if (cho && jung) res += compose(cho, jung, jong ?? " ");
    cho = jung = jong = undefined;
  };
  for (const c of str.toLowerCase()) {
    if (c === " ") {
      flush();
      res += " ";
      continue;
    }
    const j = KEY[c];
    if (!j) {
      flush();
      res += c;
      continue;
    }
    if (CHO.includes(j)) {
      if (cho && jung) flush();
      cho = j;
    } else if (JUNG.includes(j)) {
      if (jung) flush();
      jung = j;
    } else if (JONG.includes(j)) {
      jong = j;
      flush();
    }
  }
  flush();
  return res;
}

const msg = "whawnfduwnj qkrtmemfdlsjan zjrj sjan qnfvlfdygks rhdrksehckwlgka";
console.log(msg.split(" ").map(decode).join("\n"));
console.log("---");
console.log(decode(msg.replace(/ /g, "")));
