/* Thư viện chess.js 0.10.3: kiểm tra luật cờ, dùng được ngoại tuyến.
Copyright (c) 2020, Jeff Hlywa (jhlywa@gmail.com)
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.

*/
var Chess = function (r) {
  var u = "b",
    s = "w",
    l = -1,
    _ = "p",
    A = "n",
    S = "b",
    m = "r",
    y = "q",
    p = "k",
    t = "pnbrqkPNBRQK",
    e = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    g = ["1-0", "0-1", "1/2-1/2", "*"],
    C = { b: [16, 32, 17, 15], w: [-16, -32, -17, -15] },
    T = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1],
    },
    c = [
      20, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0,
      24, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0, 20, 0,
      0, 0, 0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 20,
      0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 24, 2, 20, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 53, 56, 53, 2, 0, 0, 0, 0, 0, 0, 24, 24, 24,
      24, 24, 24, 56, 0, 56, 24, 24, 24, 24, 24, 24, 0, 0, 0, 0, 0, 0, 2, 53,
      56, 53, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 24, 2, 20, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 20, 0, 0, 24, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0,
      0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 24, 0, 0, 0, 0,
      20, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 20, 0, 0, 20, 0, 0,
      0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 20,
    ],
    v = [
      17, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 15, 0, 0, 17, 0, 0, 0, 0, 0,
      16, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 17, 0, 0, 0, 0, 16, 0, 0, 0, 0, 15, 0,
      0, 0, 0, 0, 0, 17, 0, 0, 0, 16, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 17,
      0, 0, 16, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 16, 0, 15, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 16, 15, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, -15, -16,
      -17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -15, 0, -16, 0, -17, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, -15, 0, 0, -16, 0, 0, -17, 0, 0, 0, 0, 0, 0, 0, 0, -15,
      0, 0, 0, -16, 0, 0, 0, -17, 0, 0, 0, 0, 0, 0, -15, 0, 0, 0, 0, -16, 0, 0,
      0, 0, -17, 0, 0, 0, 0, -15, 0, 0, 0, 0, 0, -16, 0, 0, 0, 0, 0, -17, 0, 0,
      -15, 0, 0, 0, 0, 0, 0, -16, 0, 0, 0, 0, 0, 0, -17,
    ],
    h = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 },
    o = {
      NORMAL: "n",
      CAPTURE: "c",
      BIG_PAWN: "b",
      EP_CAPTURE: "e",
      PROMOTION: "p",
      KSIDE_CASTLE: "k",
      QSIDE_CASTLE: "q",
    },
    I = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64,
    },
    P = 7,
    w = 6,
    L = 1,
    R = 0,
    N = {
      a8: 0,
      b8: 1,
      c8: 2,
      d8: 3,
      e8: 4,
      f8: 5,
      g8: 6,
      h8: 7,
      a7: 16,
      b7: 17,
      c7: 18,
      d7: 19,
      e7: 20,
      f7: 21,
      g7: 22,
      h7: 23,
      a6: 32,
      b6: 33,
      c6: 34,
      d6: 35,
      e6: 36,
      f6: 37,
      g6: 38,
      h6: 39,
      a5: 48,
      b5: 49,
      c5: 50,
      d5: 51,
      e5: 52,
      f5: 53,
      g5: 54,
      h5: 55,
      a4: 64,
      b4: 65,
      c4: 66,
      d4: 67,
      e4: 68,
      f4: 69,
      g4: 70,
      h4: 71,
      a3: 80,
      b3: 81,
      c3: 82,
      d3: 83,
      e3: 84,
      f3: 85,
      g3: 86,
      h3: 87,
      a2: 96,
      b2: 97,
      c2: 98,
      d2: 99,
      e2: 100,
      f2: 101,
      g2: 102,
      h2: 103,
      a1: 112,
      b1: 113,
      c1: 114,
      d1: 115,
      e1: 116,
      f1: 117,
      g1: 118,
      h1: 119,
    },
    E = {
      w: [
        { square: N.a1, flag: I.QSIDE_CASTLE },
        { square: N.h1, flag: I.KSIDE_CASTLE },
      ],
      b: [
        { square: N.a8, flag: I.QSIDE_CASTLE },
        { square: N.h8, flag: I.KSIDE_CASTLE },
      ],
    },
    O = new Array(128),
    k = { w: l, b: l },
    q = s,
    D = { w: 0, b: 0 },
    K = l,
    d = 0,
    b = 1,
    Q = [],
    U = {};
  function x(r) {
    (void 0 === r && (r = !1),
      (O = new Array(128)),
      (k = { w: l, b: l }),
      (q = s),
      (D = { w: 0, b: 0 }),
      (K = l),
      (d = 0),
      (b = 1),
      (Q = []),
      r || (U = {}),
      F(M()));
  }
  function j() {
    B(e);
  }
  function B(r, e) {
    void 0 === e && (e = !1);
    var n = r.split(/\s+/),
      t = n[0],
      o = 0;
    if (!$(r).valid) return !1;
    x(e);
    for (var i = 0; i < t.length; i++) {
      var f = t.charAt(i);
      if ("/" === f) o += 8;
      else if (-1 !== "0123456789".indexOf(f)) o += parseInt(f, 10);
      else {
        var a = f < "a" ? s : u;
        (W({ type: f.toLowerCase(), color: a }, fr(o)), o++);
      }
    }
    return (
      (q = n[1]),
      -1 < n[2].indexOf("K") && (D.w |= I.KSIDE_CASTLE),
      -1 < n[2].indexOf("Q") && (D.w |= I.QSIDE_CASTLE),
      -1 < n[2].indexOf("k") && (D.b |= I.KSIDE_CASTLE),
      -1 < n[2].indexOf("q") && (D.b |= I.QSIDE_CASTLE),
      (K = "-" === n[3] ? l : N[n[3]]),
      (d = parseInt(n[4], 10)),
      (b = parseInt(n[5], 10)),
      F(M()),
      !0
    );
  }
  function $(r) {
    var e = "No errors.",
      n = "FEN string must contain six space-delimited fields.",
      t = "6th field (move number) must be a positive integer.",
      o = "5th field (half move counter) must be a non-negative integer.",
      i = "4th field (en-passant square) is invalid.",
      f = "3rd field (castling availability) is invalid.",
      a = "2nd field (side to move) is invalid.",
      l = "1st field (piece positions) does not contain 8 '/'-delimited rows.",
      u = "1st field (piece positions) is invalid [consecutive numbers].",
      s = "1st field (piece positions) is invalid [invalid piece].",
      p = "1st field (piece positions) is invalid [row too large].",
      c = "Illegal en-passant square",
      v = r.split(/\s+/);
    if (6 !== v.length) return { valid: !1, error_number: 1, error: n };
    if (isNaN(v[5]) || parseInt(v[5], 10) <= 0)
      return { valid: !1, error_number: 2, error: t };
    if (isNaN(v[4]) || parseInt(v[4], 10) < 0)
      return { valid: !1, error_number: 3, error: o };
    if (!/^(-|[abcdefgh][36])$/.test(v[3]))
      return { valid: !1, error_number: 4, error: i };
    if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(v[2]))
      return { valid: !1, error_number: 5, error: f };
    if (!/^(w|b)$/.test(v[1])) return { valid: !1, error_number: 6, error: a };
    var g = v[0].split("/");
    if (8 !== g.length) return { valid: !1, error_number: 7, error: l };
    for (var h = 0; h < g.length; h++) {
      for (var E = 0, d = !1, b = 0; b < g[h].length; b++)
        if (isNaN(g[h][b])) {
          if (!/^[prnbqkPRNBQK]$/.test(g[h][b]))
            return { valid: !1, error_number: 9, error: s };
          ((E += 1), (d = !1));
        } else {
          if (d) return { valid: !1, error_number: 8, error: u };
          ((E += parseInt(g[h][b], 10)), (d = !0));
        }
      if (8 !== E) return { valid: !1, error_number: 10, error: p };
    }
    return ("3" == v[3][1] && "w" == v[1]) || ("6" == v[3][1] && "b" == v[1])
      ? { valid: !1, error_number: 11, error: c }
      : { valid: !0, error_number: 0, error: e };
  }
  function M() {
    for (var r = 0, e = "", n = N.a8; n <= N.h1; n++) {
      if (null == O[n]) r++;
      else {
        0 < r && ((e += r), (r = 0));
        var t = O[n].color,
          o = O[n].type;
        e += t === s ? o.toUpperCase() : o.toLowerCase();
      }
      (n + 1) & 136 &&
        (0 < r && (e += r), n !== N.h1 && (e += "/"), (r = 0), (n += 8));
    }
    var i = "";
    (D[s] & I.KSIDE_CASTLE && (i += "K"),
      D[s] & I.QSIDE_CASTLE && (i += "Q"),
      D[u] & I.KSIDE_CASTLE && (i += "k"),
      D[u] & I.QSIDE_CASTLE && (i += "q"),
      (i = i || "-"));
    var f = K === l ? "-" : fr(K);
    return [e, q, i, f, d, b].join(" ");
  }
  function G(r) {
    for (var e = 0; e < r.length; e += 2)
      "string" == typeof r[e] &&
        "string" == typeof r[e + 1] &&
        (U[r[e]] = r[e + 1]);
    return U;
  }
  function F(r) {
    0 < Q.length ||
      (r !== e
        ? ((U.SetUp = "1"), (U.FEN = r))
        : (delete U.SetUp, delete U.FEN));
  }
  function i(r) {
    var e = O[N[r]];
    return e ? { type: e.type, color: e.color } : null;
  }
  function W(r, e) {
    if (!("type" in r && "color" in r)) return !1;
    if (-1 === t.indexOf(r.type.toLowerCase())) return !1;
    if (!(e in N)) return !1;
    var n = N[e];
    return (
      (r.type != p || k[r.color] == l || k[r.color] == n) &&
      ((O[n] = { type: r.type, color: r.color }),
      r.type === p && (k[r.color] = n),
      F(M()),
      !0)
    );
  }
  function H(r, e, n, t, o) {
    var i = { color: q, from: e, to: n, flags: t, piece: r[e].type };
    return (
      o && ((i.flags |= I.PROMOTION), (i.promotion = o)),
      r[n] ? (i.captured = r[n].type) : t & I.EP_CAPTURE && (i.captured = _),
      i
    );
  }
  function Z(r) {
    function e(r, e, n, t, o) {
      if (r[n].type !== _ || (or(t) !== R && or(t) !== P))
        e.push(H(r, n, t, o));
      else
        for (var i = [y, m, S, A], f = 0, a = i.length; f < a; f++)
          e.push(H(r, n, t, o, i[f]));
    }
    var n = [],
      t = q,
      o = ar(t),
      i = { b: L, w: w },
      f = N.a8,
      a = N.h1,
      l = !1,
      u = !(void 0 !== r && "legal" in r) || r.legal;
    if (void 0 !== r && "square" in r) {
      if (!(r.square in N)) return [];
      ((f = a = N[r.square]), (l = !0));
    }
    for (var s = f; s <= a; s++)
      if (136 & s) s += 7;
      else {
        var p = O[s];
        if (null != p && p.color === t)
          if (p.type === _) {
            var c = s + C[t][0];
            if (null == O[c]) {
              e(O, n, s, c, I.NORMAL);
              c = s + C[t][1];
              i[t] === or(s) && null == O[c] && e(O, n, s, c, I.BIG_PAWN);
            }
            for (v = 2; v < 4; v++) {
              136 & (c = s + C[t][v]) ||
                (null != O[c] && O[c].color === o
                  ? e(O, n, s, c, I.CAPTURE)
                  : c === K && e(O, n, s, K, I.EP_CAPTURE));
            }
          } else
            for (var v = 0, g = T[p.type].length; v < g; v++) {
              var h = T[p.type][v];
              for (c = s; !(136 & (c += h));) {
                if (null != O[c]) {
                  if (O[c].color === t) break;
                  e(O, n, s, c, I.CAPTURE);
                  break;
                }
                if ((e(O, n, s, c, I.NORMAL), "n" === p.type || "k" === p.type))
                  break;
              }
            }
      }
    if (!l || a === k[t]) {
      if (D[t] & I.KSIDE_CASTLE) {
        var E = (d = k[t]) + 2;
        null != O[d + 1] ||
          null != O[E] ||
          V(o, k[t]) ||
          V(o, d + 1) ||
          V(o, E) ||
          e(O, n, k[t], E, I.KSIDE_CASTLE);
      }
      if (D[t] & I.QSIDE_CASTLE) {
        var d;
        E = (d = k[t]) - 2;
        null != O[d - 1] ||
          null != O[d - 2] ||
          null != O[d - 3] ||
          V(o, k[t]) ||
          V(o, d - 1) ||
          V(o, E) ||
          e(O, n, k[t], E, I.QSIDE_CASTLE);
      }
    }
    if (!u) return n;
    var b = [];
    for (s = 0, g = n.length; s < g; s++)
      (er(n[s]), X(t) || b.push(n[s]), nr());
    return b;
  }
  function z(r, e) {
    var n = "";
    if (r.flags & I.KSIDE_CASTLE) n = "O-O";
    else if (r.flags & I.QSIDE_CASTLE) n = "O-O-O";
    else {
      var t = (function (r, e) {
        for (
          var n = Z({ legal: !e }),
            t = r.from,
            o = r.to,
            i = r.piece,
            f = 0,
            a = 0,
            l = 0,
            u = 0,
            s = n.length;
          u < s;
          u++
        ) {
          var p = n[u].from,
            c = n[u].to,
            v = n[u].piece;
          i === v &&
            t !== p &&
            o === c &&
            (f++, or(t) === or(p) && a++, ir(t) === ir(p) && l++);
        }
        if (0 < f)
          return 0 < a && 0 < l
            ? fr(t)
            : 0 < l
              ? fr(t).charAt(1)
              : fr(t).charAt(0);
        return "";
      })(r, e);
      (r.piece !== _ && (n += r.piece.toUpperCase() + t),
        r.flags & (I.CAPTURE | I.EP_CAPTURE) &&
          (r.piece === _ && (n += fr(r.from)[0]), (n += "x")),
        (n += fr(r.to)),
        r.flags & I.PROMOTION && (n += "=" + r.promotion.toUpperCase()));
    }
    return (er(r), f() && (a() ? (n += "#") : (n += "+")), nr(), n);
  }
  function J(r) {
    return r.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
  }
  function V(r, e) {
    for (var n = N.a8; n <= N.h1; n++)
      if (136 & n) n += 7;
      else if (null != O[n] && O[n].color === r) {
        var t = O[n],
          o = n - e,
          i = 119 + o;
        if (c[i] & (1 << h[t.type])) {
          if (t.type === _) {
            if (0 < o) {
              if (t.color === s) return !0;
            } else if (t.color === u) return !0;
            continue;
          }
          if ("n" === t.type || "k" === t.type) return !0;
          for (var f = v[i], a = n + f, l = !1; a !== e;) {
            if (null != O[a]) {
              l = !0;
              break;
            }
            a += f;
          }
          if (!l) return !0;
        }
      }
    return !1;
  }
  function X(r) {
    return V(ar(r), k[r]);
  }
  function f() {
    return X(q);
  }
  function a() {
    return f() && 0 === Z().length;
  }
  function n() {
    return !f() && 0 === Z().length;
  }
  function Y() {
    for (var r = {}, e = [], n = 0, t = 0, o = N.a8; o <= N.h1; o++)
      if (((t = (t + 1) % 2), 136 & o)) o += 7;
      else {
        var i = O[o];
        i &&
          ((r[i.type] = i.type in r ? r[i.type] + 1 : 1),
          i.type === S && e.push(t),
          n++);
      }
    if (2 === n) return !0;
    if (3 === n && (1 === r[S] || 1 === r[A])) return !0;
    if (n === r[S] + 2) {
      var f = 0,
        a = e.length;
      for (o = 0; o < a; o++) f += e[o];
      if (0 === f || f === a) return !0;
    }
    return !1;
  }
  function rr() {
    for (var r = [], e = {}, n = !1; ;) {
      var t = nr();
      if (!t) break;
      r.push(t);
    }
    for (;;) {
      var o = M().split(" ").slice(0, 4).join(" ");
      if (((e[o] = o in e ? e[o] + 1 : 1), 3 <= e[o] && (n = !0), !r.length))
        break;
      er(r.pop());
    }
    return n;
  }
  function er(r) {
    var e,
      n = q,
      t = ar(n);
    if (
      ((e = r),
      Q.push({
        move: e,
        kings: { b: k.b, w: k.w },
        turn: q,
        castling: { b: D.b, w: D.w },
        ep_square: K,
        half_moves: d,
        move_number: b,
      }),
      (O[r.to] = O[r.from]),
      (O[r.from] = null),
      r.flags & I.EP_CAPTURE &&
        (q === u ? (O[r.to - 16] = null) : (O[r.to + 16] = null)),
      r.flags & I.PROMOTION && (O[r.to] = { type: r.promotion, color: n }),
      O[r.to].type === p)
    ) {
      if (((k[O[r.to].color] = r.to), r.flags & I.KSIDE_CASTLE)) {
        var o = r.to - 1,
          i = r.to + 1;
        ((O[o] = O[i]), (O[i] = null));
      } else if (r.flags & I.QSIDE_CASTLE) {
        ((o = r.to + 1), (i = r.to - 2));
        ((O[o] = O[i]), (O[i] = null));
      }
      D[n] = "";
    }
    if (D[n])
      for (var f = 0, a = E[n].length; f < a; f++)
        if (r.from === E[n][f].square && D[n] & E[n][f].flag) {
          D[n] ^= E[n][f].flag;
          break;
        }
    if (D[t])
      for (f = 0, a = E[t].length; f < a; f++)
        if (r.to === E[t][f].square && D[t] & E[t][f].flag) {
          D[t] ^= E[t][f].flag;
          break;
        }
    ((K = r.flags & I.BIG_PAWN ? ("b" === q ? r.to - 16 : r.to + 16) : l),
      r.piece === _ || r.flags & (I.CAPTURE | I.EP_CAPTURE) ? (d = 0) : d++,
      q === u && b++,
      (q = ar(q)));
  }
  function nr() {
    var r = Q.pop();
    if (null == r) return null;
    var e = r.move;
    ((k = r.kings),
      (q = r.turn),
      (D = r.castling),
      (K = r.ep_square),
      (d = r.half_moves),
      (b = r.move_number));
    var n,
      t,
      o = q,
      i = ar(q);
    if (
      ((O[e.from] = O[e.to]),
      (O[e.from].type = e.piece),
      (O[e.to] = null),
      e.flags & I.CAPTURE)
    )
      O[e.to] = { type: e.captured, color: i };
    else if (e.flags & I.EP_CAPTURE) {
      var f;
      ((f = o === u ? e.to - 16 : e.to + 16), (O[f] = { type: _, color: i }));
    }
    e.flags & (I.KSIDE_CASTLE | I.QSIDE_CASTLE) &&
      (e.flags & I.KSIDE_CASTLE
        ? ((n = e.to + 1), (t = e.to - 1))
        : e.flags & I.QSIDE_CASTLE && ((n = e.to - 2), (t = e.to + 1)),
      (O[n] = O[t]),
      (O[t] = null));
    return e;
  }
  function tr(r, e) {
    var n = J(r);
    if (e) {
      var t = n.match(
        /([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/,
      );
      if (t)
        var o = t[1],
          i = t[2],
          f = t[3],
          a = t[4];
    }
    for (var l = Z(), u = 0, s = l.length; u < s; u++) {
      if (n === J(z(l[u])) || (e && n === J(z(l[u], !0)))) return l[u];
      if (
        t &&
        (!o || o.toLowerCase() == l[u].piece) &&
        N[i] == l[u].from &&
        N[f] == l[u].to &&
        (!a || a.toLowerCase() == l[u].promotion)
      )
        return l[u];
    }
    return null;
  }
  function or(r) {
    return r >> 4;
  }
  function ir(r) {
    return 15 & r;
  }
  function fr(r) {
    var e = ir(r),
      n = or(r);
    return "abcdefgh".substring(e, e + 1) + "87654321".substring(n, n + 1);
  }
  function ar(r) {
    return r === s ? u : s;
  }
  function lr(r) {
    var e = (function r(e) {
      var n = e instanceof Array ? [] : {};
      for (var t in e) n[t] = "object" == typeof t ? r(e[t]) : e[t];
      return n;
    })(r);
    ((e.san = z(e, !1)), (e.to = fr(e.to)), (e.from = fr(e.from)));
    var n = "";
    for (var t in I) I[t] & e.flags && (n += o[t]);
    return ((e.flags = n), e);
  }
  function ur(r) {
    return r.replace(/^\s+|\s+$/g, "");
  }
  return (
    B(void 0 === r ? e : r),
    {
      WHITE: s,
      BLACK: u,
      PAWN: _,
      KNIGHT: A,
      BISHOP: S,
      ROOK: m,
      QUEEN: y,
      KING: p,
      SQUARES: (function () {
        for (var r = [], e = N.a8; e <= N.h1; e++)
          136 & e ? (e += 7) : r.push(fr(e));
        return r;
      })(),
      FLAGS: o,
      load: function (r) {
        return B(r);
      },
      reset: function () {
        return j();
      },
      moves: function (r) {
        for (var e = Z(r), n = [], t = 0, o = e.length; t < o; t++)
          void 0 !== r && "verbose" in r && r.verbose
            ? n.push(lr(e[t]))
            : n.push(z(e[t], !1));
        return n;
      },
      in_check: function () {
        return f();
      },
      in_checkmate: function () {
        return a();
      },
      in_stalemate: function () {
        return n();
      },
      in_draw: function () {
        return 100 <= d || n() || Y() || rr();
      },
      insufficient_material: function () {
        return Y();
      },
      in_threefold_repetition: function () {
        return rr();
      },
      game_over: function () {
        return 100 <= d || a() || n() || Y() || rr();
      },
      validate_fen: function (r) {
        return $(r);
      },
      fen: function () {
        return M();
      },
      board: function () {
        for (var r = [], e = [], n = N.a8; n <= N.h1; n++)
          (null == O[n]
            ? e.push(null)
            : e.push({ type: O[n].type, color: O[n].color }),
            (n + 1) & 136 && (r.push(e), (e = []), (n += 8)));
        return r;
      },
      pgn: function (r) {
        var e =
            "object" == typeof r && "string" == typeof r.newline_char
              ? r.newline_char
              : "\n",
          n =
            "object" == typeof r && "number" == typeof r.max_width
              ? r.max_width
              : 0,
          t = [],
          o = !1;
        for (var i in U) (t.push("[" + i + ' "' + U[i] + '"]' + e), (o = !0));
        o && Q.length && t.push(e);
        for (var f = []; 0 < Q.length;) f.push(nr());
        for (var a = [], l = ""; 0 < f.length;) {
          var u = f.pop();
          (Q.length || "b" !== u.color
            ? "w" === u.color && (l.length && a.push(l), (l = b + "."))
            : (l = b + ". ..."),
            (l = l + " " + z(u, !1)),
            er(u));
        }
        if (
          (l.length && a.push(l),
          void 0 !== U.Result && a.push(U.Result),
          0 === n)
        )
          return t.join("") + a.join(" ");
        var s = 0;
        for (i = 0; i < a.length; i++)
          (s + a[i].length > n && 0 !== i
            ? (" " === t[t.length - 1] && t.pop(), t.push(e), (s = 0))
            : 0 !== i && (t.push(" "), s++),
            t.push(a[i]),
            (s += a[i].length));
        return t.join("");
      },
      load_pgn: function (r, e) {
        var n = void 0 !== e && "sloppy" in e && e.sloppy;
        function l(r) {
          return r.replace(/\\/g, "\\");
        }
        var t =
            "object" == typeof e && "string" == typeof e.newline_char
              ? e.newline_char
              : "\r?\n",
          o = new RegExp("^(\\[((?:" + l(t) + ")|.)*\\])(?:" + l(t) + "){2}"),
          i = o.test(r) ? o.exec(r)[1] : "";
        j();
        var f = (function (r, e) {
          for (
            var n =
                "object" == typeof e && "string" == typeof e.newline_char
                  ? e.newline_char
                  : "\r?\n",
              t = {},
              o = r.split(new RegExp(l(n))),
              i = "",
              f = "",
              a = 0;
            a < o.length;
            a++
          )
            ((i = o[a].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, "$1")),
              (f = o[a].replace(/^\[[A-Za-z]+\s"(.*)"\]$/, "$1")),
              0 < ur(i).length && (t[i] = f));
          return t;
        })(i, e);
        for (var a in f) G([a, f[a]]);
        if ("1" === f.SetUp && !("FEN" in f && B(f.FEN, !0))) return !1;
        var u = r.replace(i, "").replace(new RegExp(l(t), "g"), " ");
        u = u.replace(/(\{[^}]+\})+?/g, "");
        for (var s = /(\([^\(\)]+\))+?/g; s.test(u);) u = u.replace(s, "");
        var p = ur(
          (u = (u = (u = u.replace(/\d+\.(\.\.)?/g, "")).replace(
            /\.\.\./g,
            "",
          )).replace(/\$\d+/g, "")),
        ).split(new RegExp(/\s+/));
        p = p.join(",").replace(/,,+/g, ",").split(",");
        for (var c = "", v = 0; v < p.length - 1; v++) {
          if (null == (c = tr(p[v], n))) return !1;
          er(c);
        }
        if (((c = p[p.length - 1]), -1 < g.indexOf(c)))
          !(function (r) {
            for (var e in r) return 1;
          })(U) ||
            void 0 !== U.Result ||
            G(["Result", c]);
        else {
          if (null == (c = tr(c, n))) return !1;
          er(c);
        }
        return !0;
      },
      header: function () {
        return G(arguments);
      },
      ascii: function () {
        return (function () {
          for (
            var r = "   +------------------------+\n", e = N.a8;
            e <= N.h1;
            e++
          ) {
            if (
              (0 === ir(e) && (r += " " + "87654321"[or(e)] + " |"),
              null == O[e])
            )
              r += " . ";
            else {
              var n = O[e].type;
              r +=
                " " +
                (O[e].color === s ? n.toUpperCase() : n.toLowerCase()) +
                " ";
            }
            (e + 1) & 136 && ((r += "|\n"), (e += 8));
          }
          return (
            (r += "   +------------------------+\n"),
            (r += "     a  b  c  d  e  f  g  h\n")
          );
        })();
      },
      turn: function () {
        return q;
      },
      move: function (r, e) {
        var n = void 0 !== e && "sloppy" in e && e.sloppy,
          t = null;
        if ("string" == typeof r) t = tr(r, n);
        else if ("object" == typeof r)
          for (var o = Z(), i = 0, f = o.length; i < f; i++)
            if (!(
              r.from !== fr(o[i].from) ||
              r.to !== fr(o[i].to) ||
              ("promotion" in o[i] && r.promotion !== o[i].promotion)
            )) {
              t = o[i];
              break;
            }
        if (!t) return null;
        var a = lr(t);
        return (er(t), a);
      },
      undo: function () {
        var r = nr();
        return r ? lr(r) : null;
      },
      clear: function () {
        return x();
      },
      put: function (r, e) {
        return W(r, e);
      },
      get: function (r) {
        return i(r);
      },
      remove: function (r) {
        return (
          (n = i((e = r))),
          (O[N[e]] = null),
          n && n.type === p && (k[n.color] = l),
          F(M()),
          n
        );
        var e, n;
      },
      perft: function (r) {
        return (function r(e) {
          for (
            var n = Z({ legal: !1 }), t = 0, o = q, i = 0, f = n.length;
            i < f;
            i++
          )
            (er(n[i]), X(o) || (0 < e - 1 ? (t += r(e - 1)) : t++), nr());
          return t;
        })(r);
      },
      square_color: function (r) {
        if (r in N) {
          var e = N[r];
          return (or(e) + ir(e)) % 2 == 0 ? "light" : "dark";
        }
        return null;
      },
      history: function (r) {
        for (
          var e = [], n = [], t = void 0 !== r && ("verbose" in r) && r.verbose;
          0 < Q.length;
        )
          e.push(nr());
        for (; 0 < e.length;) {
          var o = e.pop();
          (t ? n.push(lr(o)) : n.push(z(o)), er(o));
        }
        return n;
      },
    }
  );
};
("undefined" != typeof exports && (exports.Chess = Chess),
  "undefined" != typeof define &&
    define(function () {
      return Chess;
    }));

// 12 khai cuộc theo tài liệu. Mỗi phần tử gồm tên và dãy nước SAN.
const DATA = [
  [
    "Scottland",
    "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nc3 Bb4 Nxc6 bxc6 Bd3 d5 exd5 cxd5 O-O O-O Bg5 Be6",
  ],
  [
    "Italia",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 Qb3 Ne7 O-O O-O Rfe1 c6 a4 Qc7",
  ],
  [
    "Defense 2 Mã",
    "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5 Qc7 Ng4 Bxg4 Bxg4 Bc5 Be2 Rd8 c3 Nb7 O-O h5",
  ],
  [
    "Russian Chess",
    "e4 e5 Nf3 Nf6 d4 exd4 e5 Ne4 Qxd4 d5 exd6 Nxd6 Bd3 Qe7+ Be3 Nf5 Bxf5 Bxf5 Nc3 Qb4 Qe5+ Be6 O-O Nc6",
  ],
  ["Pháp", "e4 e6 d4 d5 exd5 exd5 Bd3 Nc6 Nf3 Bg4 c3 Qd7 O-O O-O-O Re1 Bd6"],
  [
    "Caro Kann",
    "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 Nf3 Nd7 h4 h6 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Qc7 O-O-O O-O-O",
  ],
  ["Alekhine", "e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 c4 Nb6 exd6 cxd6"],
  [
    "Sicilian",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 Nc6 Qd2 O-O O-O-O",
  ],
  ["Ấn Độ cổ", "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5 O-O-O"],
  [
    "Gambit",
    "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 Qe2 b5 Bb3 Bb7 Rd1 Nbd7",
  ],
  [
    "Grunfeld",
    "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Bc4 c5 Ne2 Nc6 Be3 O-O O-O",
  ],
  [
    "Slav",
    "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7",
  ],
];

// Giao diện và logic luyện tập
("use strict");
const $ = (s) => document.querySelector(s),
  app = $("#app"),
  files = "abcdefgh";
/* Pieces: Colin M. L. Burnett (cburnett), GPL-2.0-or-later.
Source: https://github.com/lichess-org/lila/tree/master/public/piece/cburnett
Modified palette: warm white and charcoal.
                    GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc.,
 <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it.  (Some other Free Software Foundation software is covered by
the GNU Lesser General Public License instead.)  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
this service if you wish), that you receive source code or can get it
if you want it, that you can change the software or use pieces of it
in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must give the recipients all the rights that
you have.  You must make sure that they, too, receive or can get the
source code.  And you must show them these terms so they know their
rights.

  We protect your rights with two steps: (1) copyright the software, and
(2) offer you this license which gives you legal permission to copy,
distribute and/or modify the software.

  Also, for each author's protection and ours, we want to make certain
that everyone understands that there is no warranty for this free
software.  If the software is modified by someone else and passed on, we
want its recipients to know that what they have is not the original, so
that any problems introduced by others will not reflect on the original
authors' reputations.

  Finally, any free program is threatened constantly by software
patents.  We wish to avoid the danger that redistributors of a free
program will individually obtain patent licenses, in effect making the
program proprietary.  To prevent this, we have made it clear that any
patent must be licensed for everyone's free use or not licensed at all.

  The precise terms and conditions for copying, distribution and
modification follow.

                    GNU GENERAL PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. This License applies to any program or other work which contains
a notice placed by the copyright holder saying it may be distributed
under the terms of this General Public License.  The "Program", below,
refers to any such program or work, and a "work based on the Program"
means either the Program or any derivative work under copyright law:
that is to say, a work containing the Program or a portion of it,
either verbatim or with modifications and/or translated into another
language.  (Hereinafter, translation is included without limitation in
the term "modification".)  Each licensee is addressed as "you".

Activities other than copying, distribution and modification are not
covered by this License; they are outside its scope.  The act of
running the Program is not restricted, and the output from the Program
is covered only if its contents constitute a work based on the
Program (independent of having been made by running the Program).
Whether that is true depends on what the Program does.

  1. You may copy and distribute verbatim copies of the Program's
source code as you receive it, in any medium, provided that you
conspicuously and appropriately publish on each copy an appropriate
copyright notice and disclaimer of warranty; keep intact all the
notices that refer to this License and to the absence of any warranty;
and give any other recipients of the Program a copy of this License
along with the Program.

You may charge a fee for the physical act of transferring a copy, and
you may at your option offer warranty protection in exchange for a fee.

  2. You may modify your copy or copies of the Program or any portion
of it, thus forming a work based on the Program, and copy and
distribute such modifications or work under the terms of Section 1
above, provided that you also meet all of these conditions:

    a) You must cause the modified files to carry prominent notices
    stating that you changed the files and the date of any change.

    b) You must cause any work that you distribute or publish, that in
    whole or in part contains or is derived from the Program or any
    part thereof, to be licensed as a whole at no charge to all third
    parties under the terms of this License.

    c) If the modified program normally reads commands interactively
    when run, you must cause it, when started running for such
    interactive use in the most ordinary way, to print or display an
    announcement including an appropriate copyright notice and a
    notice that there is no warranty (or else, saying that you provide
    a warranty) and that users may redistribute the program under
    these conditions, and telling the user how to view a copy of this
    License.  (Exception: if the Program itself is interactive but
    does not normally print such an announcement, your work based on
    the Program is not required to print an announcement.)

These requirements apply to the modified work as a whole.  If
identifiable sections of that work are not derived from the Program,
and can be reasonably considered independent and separate works in
themselves, then this License, and its terms, do not apply to those
sections when you distribute them as separate works.  But when you
distribute the same sections as part of a whole which is a work based
on the Program, the distribution of the whole must be on the terms of
this License, whose permissions for other licensees extend to the
entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest
your rights to work written entirely by you; rather, the intent is to
exercise the right to control the distribution of derivative or
collective works based on the Program.

In addition, mere aggregation of another work not based on the Program
with the Program (or with a work based on the Program) on a volume of
a storage or distribution medium does not bring the other work under
the scope of this License.

  3. You may copy and distribute the Program (or a work based on it,
under Section 2) in object code or executable form under the terms of
Sections 1 and 2 above provided that you also do one of the following:

    a) Accompany it with the complete corresponding machine-readable
    source code, which must be distributed under the terms of Sections
    1 and 2 above on a medium customarily used for software interchange; or,

    b) Accompany it with a written offer, valid for at least three
    years, to give any third party, for a charge no more than your
    cost of physically performing source distribution, a complete
    machine-readable copy of the corresponding source code, to be
    distributed under the terms of Sections 1 and 2 above on a medium
    customarily used for software interchange; or,

    c) Accompany it with the information you received as to the offer
    to distribute corresponding source code.  (This alternative is
    allowed only for noncommercial distribution and only if you
    received the program in object code or executable form with such
    an offer, in accord with Subsection b above.)

The source code for a work means the preferred form of the work for
making modifications to it.  For an executable work, complete source
code means all the source code for all modules it contains, plus any
associated interface definition files, plus the scripts used to
control compilation and installation of the executable.  However, as a
special exception, the source code distributed need not include
anything that is normally distributed (in either source or binary
form) with the major components (compiler, kernel, and so on) of the
operating system on which the executable runs, unless that component
itself accompanies the executable.

If distribution of executable or object code is made by offering
access to copy from a designated place, then offering equivalent
access to copy the source code from the same place counts as
distribution of the source code, even though third parties are not
compelled to copy the source along with the object code.

  4. You may not copy, modify, sublicense, or distribute the Program
except as expressly provided under this License.  Any attempt
otherwise to copy, modify, sublicense or distribute the Program is
void, and will automatically terminate your rights under this License.
However, parties who have received copies, or rights, from you under
this License will not have their licenses terminated so long as such
parties remain in full compliance.

  5. You are not required to accept this License, since you have not
signed it.  However, nothing else grants you permission to modify or
distribute the Program or its derivative works.  These actions are
prohibited by law if you do not accept this License.  Therefore, by
modifying or distributing the Program (or any work based on the
Program), you indicate your acceptance of this License to do so, and
all its terms and conditions for copying, distributing or modifying
the Program or works based on it.

  6. Each time you redistribute the Program (or any work based on the
Program), the recipient automatically receives a license from the
original licensor to copy, distribute or modify the Program subject to
these terms and conditions.  You may not impose any further
restrictions on the recipients' exercise of the rights granted herein.
You are not responsible for enforcing compliance by third parties to
this License.

  7. If, as a consequence of a court judgment or allegation of patent
infringement or for any other reason (not limited to patent issues),
conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot
distribute so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you
may not distribute the Program at all.  For example, if a patent
license would not permit royalty-free redistribution of the Program by
all those who receive copies directly or indirectly through you, then
the only way you could satisfy both it and this License would be to
refrain entirely from distribution of the Program.

If any portion of this section is held invalid or unenforceable under
any particular circumstance, the balance of the section is intended to
apply and the section as a whole is intended to apply in other
circumstances.

It is not the purpose of this section to induce you to infringe any
patents or other property right claims or to contest validity of any
such claims; this section has the sole purpose of protecting the
integrity of the free software distribution system, which is
implemented by public license practices.  Many people have made
generous contributions to the wide range of software distributed
through that system in reliance on consistent application of that
system; it is up to the author/donor to decide if he or she is willing
to distribute software through any other system and a licensee cannot
impose that choice.

This section is intended to make thoroughly clear what is believed to
be a consequence of the rest of this License.

  8. If the distribution and/or use of the Program is restricted in
certain countries either by patents or by copyrighted interfaces, the
original copyright holder who places the Program under this License
may add an explicit geographical distribution limitation excluding
those countries, so that distribution is permitted only in or among
countries not thus excluded.  In such case, this License incorporates
the limitation as if written in the body of this License.

  9. The Free Software Foundation may publish revised and/or new versions
of the General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

Each version is given a distinguishing version number.  If the Program
specifies a version number of this License which applies to it and "any
later version", you have the option of following the terms and conditions
either of that version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number of
this License, you may choose any version ever published by the Free Software
Foundation.

  10. If you wish to incorporate parts of the Program into other free
programs whose distribution conditions are different, write to the author
to ask for permission.  For software which is copyrighted by the Free
Software Foundation, write to the Free Software Foundation; we sometimes
make exceptions for this.  Our decision will be guided by the two goals
of preserving the free status of all derivatives of our free software and
of promoting the sharing and reuse of software generally.

                            NO WARRANTY

  11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY
FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.  EXCEPT WHEN
OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  THE ENTIRE RISK AS
TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.  SHOULD THE
PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING,
REPAIR OR CORRECTION.

  12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR
REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES,
INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING
OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED
TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY
YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER
PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGES.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
convey the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    <one line to give the program's name and a brief idea of what it does.>
    Copyright (C) <year>  <name of author>

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, see <https://www.gnu.org/licenses/>.

Also add information on how to contact you by electronic and paper mail.

If the program is interactive, make it output a short notice like this
when it starts in an interactive mode:

    Gnomovision version 69, Copyright (C) year name of author
    Gnomovision comes with ABSOLUTELY NO WARRANTY; for details type `show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type `show c' for details.

The hypothetical commands `show w' and `show c' should show the appropriate
parts of the General Public License.  Of course, the commands you use may
be called something other than `show w' and `show c'; they could even be
mouse-clicks or menu items--whatever suits your program.

You should also get your employer (if you work as a programmer) or your
school, if any, to sign a "copyright disclaimer" for the program, if
necessary.  Here is a sample; alter the names:

  Yoyodyne, Inc., hereby disclaims all copyright interest in the program
  `Gnomovision' (which makes passes at compilers) written by James Hacker.

  <signature of Moe Ghoul>, 1 April 1989
  Moe Ghoul, President of Vice

This General Public License does not permit incorporating your program into
proprietary programs.  If your program is a subroutine library, you may
consider it more useful to permit linking proprietary applications with the
library.  If this is what you want to do, use the GNU Lesser General
Public License instead of this License.

*/
const PIECES = {
  wp: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><path fill="#f8f8f6" stroke="#3b3b39" stroke-linecap="round" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/></svg>',
  wr: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="#f8f8f6" fill-rule="evenodd" stroke="#3b3b39" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5"/><path d="m34 14-3 3H14l-3-3"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M31 17v12.5H14V17"/><path d="m31 29.5 1.5 2.5h-20l1.5-2.5"/><path fill="none" stroke-linejoin="miter" d="M11 14h23"/></g></svg>',
  wn: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#3b3b39" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#f8f8f6" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#f8f8f6" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/><path fill="#3b3b39" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5"/></g></svg>',
  wb: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#3b3b39" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#f8f8f6" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g></svg>',
  wq: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="#f8f8f6" fill-rule="evenodd" stroke="#3b3b39" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0M33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0"/><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0"/></g></svg>',
  wk: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#3b3b39" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/><path fill="#f8f8f6" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#f8f8f6" d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>',
  bp: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><path stroke="#454440" stroke-linecap="round" stroke-width="1.5" d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-.87-10.65A4.01 4.01 0 0 0 22.5 9z"/></svg>',
  br: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#454440" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="butt" d="M9 39h27v-3H9zm3.5-7 1.5-2.5h17l1.5 2.5zm-.5 4v-4h21v4z"/><path stroke-linecap="butt" stroke-linejoin="miter" d="M14 29.5v-13h17v13z"/><path stroke-linecap="butt" d="M14 16.5 11 14h23l-3 2.5zM11 14V9h4v2h5V9h5v2h5V9h4v5z"/><path fill="none" stroke="#ececec" stroke-linejoin="miter" stroke-width="1" d="M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23"/></g></svg>',
  bn: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#454440" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path fill="#454440" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#454440" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-2 2.5-3c1 0 1 3 1 3"/><path fill="#ececec" stroke="#ececec" d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.43-9.75a.5 1.5 30 1 1-.86-.5.5 1.5 30 1 1 .86.5"/><path fill="#ececec" stroke="none" d="m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34s-5.79-6.64-9.19-7.16z"/></g></svg>',
  bb: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#454440" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g fill="#454440" stroke-linecap="butt"><path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-2 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path stroke="#ececec" stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/></g></svg>',
  bq: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#454440" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path stroke-linecap="butt" d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5z"/><path stroke-linecap="butt" d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path fill="none" stroke-linecap="butt" d="M11 38.5a35 35 1 0 0 23 0"/><path fill="none" stroke="#ececec" d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"/></g></svg>',
  bk: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#454440" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path stroke-linejoin="miter" d="M22.5 11.6V6"/><path fill="#454440" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="#454440" d="M11.5 37a22.3 22.3 0 0 0 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"/><path stroke-linejoin="miter" d="M20 8h5"/><path stroke="#ececec" d="M32 29.5s8.5-4 6-9.7C34.1 14 25 18 22.5 24.6v2.1-2.1C20 18 9.9 14 7 19.9c-2.5 5.6 4.8 9 4.8 9"/><path stroke="#ececec" d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>',
};
function svg(p) {
  return PIECES[p.color + p.type];
}

// Kiểm tra dữ liệu khai cuộc khi trang được mở
const openings = DATA.map(([name, line], id) => {
  let c = new Chess(),
    moves = [],
    fens = [c.fen()];
  line.split(" ").forEach((san, i) => {
    let m = c.move(san);
    if (!m) {
      console.error(
        `Khai cuộc ${name}, nước thứ ${i + 1}: ${san} không hợp lệ`,
      );
      throw Error(`${name}: nước ${i + 1} (${san}) không hợp lệ`);
    }
    moves.push(m);
    fens.push(c.fen());
  });
  return { id, name, moves, fens };
});
console.info("Đã kiểm tra thành công 12 khai cuộc bằng chess.js.");

// Lưu thống kê học tập trên thiết bị
let stats = {};
try {
  stats = JSON.parse(localStorage.getItem("khai-cuoc-v1") || "{}");
} catch {}
let state = null,
  modeChoice = "learn",
  timer,
  sound = true,
  ctx,
  pieceNodes = {},
  drag = null;
function save() {
  try {
    localStorage.setItem("khai-cuoc-v1", JSON.stringify(stats));
  } catch {}
}
function stat() {
  let key = state.o.id + ":" + state.mode;
  return stats[key] || (stats[key] = { completed: 0, mistakes: 0 });
}

// Âm thanh bằng Web Audio
function audio(type) {
  if (!sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    let o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = type === "wrong" ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(
      type === "wrong" ? 150 : type === "capture" ? 330 : 520,
      ctx.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(
      type === "wrong" ? 70 : 220,
      ctx.currentTime + 0.13,
    );
    g.gain.setValueAtTime(0.065, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  } catch {}
}
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = `♪ Âm thanh: ${sound ? "bật" : "tắt"}`;
};
function vi(s) {
  return s.replace(
    /[KQRBN]/g,
    (c) => ({ K: "V", Q: "H", R: "X", B: "T", N: "M" })[c],
  );
}
function mini(fen) {
  let c = new Chess(fen);
  return `<div class="mini" aria-hidden="true">${c
    .board()
    .flat()
    .map(
      (p, i) =>
        `<div class="${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"}">${p ? svg(p) : ""}</div>`,
    )
    .join("")}</div>`;
}

// Màn hình chọn khai cuộc
function home() {
  clearTimeout(timer);
  state = null;
  let total = Object.values(stats).reduce((n, s) => n + s.completed, 0);
  app.innerHTML = `<div class="intro"><div><div class="eyebrow">HỌC TỪ NHỮNG NƯỚC ĐẦU TIÊN</div><h1>Mỗi ván cờ hay,<br>bắt đầu từ một khai cuộc.</h1><p>Chọn khai cuộc. Luyện từng nước. Ghi nhớ bằng thực hành.</p></div><div class="counter"><strong>${total}</strong>lượt hoàn thành<br>12 khai cuộc · 4 cách học</div></div>${[
    "Khai cuộc thoáng",
    "Khai cuộc nửa thoáng",
    "Khai cuộc kín",
  ]
    .map(
      (g, j) =>
        `<section class="group"><div class="group-title"><h2>${g}</h2><span>04 khai cuộc</span></div><div class="cards">${openings
          .slice(j * 4, j * 4 + 4)
          .map((o) => {
            let n = ["w", "b", "both", "learn"].reduce(
              (a, m) => a + (stats[o.id + ":" + m]?.completed || 0),
              0,
            );
            return `<button class="card" data-open="${o.id}">${mini(o.fens.at(-1))}<h3>${o.name}</h3><div class="card-foot"><span>${Math.ceil(o.moves.length / 2)} nước · ${o.moves.length} lượt</span><span>${n ? "✓ " + n + " lần" : "Luyện ngay →"}</span></div></button>`;
          })
          .join("")}</div></section>`,
    )
    .join(
      "",
    )}<footer>Thực hành theo đúng dãy nước trong tài liệu · Hoạt động ngoại tuyến · Tiến độ lưu trên thiết bị</footer>`;
  app
    .querySelectorAll("[data-open]")
    .forEach((b) => (b.onclick = () => choose(+b.dataset.open)));
}

// Màn hình chọn chế độ
function choose(id) {
  clearTimeout(timer);
  state = null;
  const o = openings[id];
  app.innerHTML = `<button class="back" id="back">← Tất cả khai cuộc</button><div class="mode"><div class="eyebrow">CHỌN CÁCH LUYỆN TẬP</div><h1>${o.name}</h1><p>${o.moves.length} lượt đi. Xem từng bước trước, rồi tự luyện để ghi nhớ.</p><div class="mode-options">${[
    ["learn", "▶", "Học từng bước", "Bấm tiếp tục để xem"],
    ["w", "♙", "Chơi Trắng", "1 phía · bạn đi trước"],
    ["b", "♟", "Chơi Đen", "1 phía · máy đi trước"],
    ["both", "♙♟", "Cả hai phía", "2 phía · tự đi tất cả"],
  ]
    .map(
      ([m, icon, t, d]) =>
        `<button class="mode-option ${modeChoice === m ? "active" : ""}" data-mode="${m}"><span>${icon}</span><b>${t}</b><small>${d}</small></button>`,
    )
    .join(
      "",
    )}</div><button class="primary" id="start">Bắt đầu luyện tập →</button><p class="note">Học từng bước: mỗi lần bấm Tiếp tục chỉ đi một lượt.<br>Tự luyện: bấm chọn hoặc kéo thả quân cờ.</p></div>`;
  $("#back").onclick = home;
  app.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        modeChoice = b.dataset.mode;
        choose(id);
      }),
  );
  $("#start").onclick = () => start(id, modeChoice);
}

// Khởi tạo một buổi học
function start(id, mode) {
  clearTimeout(timer);
  drag = null;
  state = {
    o: openings[id],
    mode,
    c: new Chess(),
    index: 0,
    view: 0,
    errors: 0,
    flip: mode === "b",
    selected: null,
    hint: false,
    badge: null,
    done: false,
    showAll: false,
    reveal: true,
  };
  pieceNodes = {};
  app.innerHTML = `<button id="back" class="back">← Đổi khai cuộc</button><div class="study"><div><div class="player"><b><span class="avatar">♟</span><span id="top-player"></span></b><span class="sub">LUYỆN KHAI CUỘC</span></div><div class="board ${mode === "learn" ? "learning-board" : ""}" id="board" aria-label="Bàn cờ luyện khai cuộc"><div class="squares"></div><div class="pieces"></div><svg class="arrows" viewBox="0 0 800 800"></svg><div class="badges"></div></div><div class="player bottom"><b><span class="avatar">♙</span><span id="bottom-player"></span></b><span class="sub" id="turn"></span></div>${mode === "learn" ? `<section class="lesson" aria-label="Điều khiển học từng bước"><div id="lesson-text" aria-live="polite"></div><div class="lesson-actions"><button class="secondary" id="lesson-prev">← Quay lại</button><button class="primary" id="continue">Tiếp tục →</button></div></section>` : ""}<div class="note">Kéo thả hoặc bấm quân rồi bấm ô đích · M = Mã, T = Tượng, X = Xe, H = Hậu, V = Vua</div></div><aside class="panel"><div class="panel-head"><div class="eyebrow">PHÒNG LUYỆN TẬP</div><h2 style="margin-top:8px">${state.o.name}</h2><span class="tag">${mode === "learn" ? "Học từng bước · Bấm để đi từng lượt" : mode === "both" ? "2 phía · Tự đi Trắng và Đen" : "1 phía · Bạn chơi " + (mode === "w" ? "Trắng" : "Đen")}</span></div><div class="panel-body"><div class="progress-info"><span id="progress-text"></span><span id="errors"></span></div><div class="progress"><div id="bar"></div></div><div class="moves" id="moves"></div><div class="feedback" id="feedback" role="status" aria-live="polite"></div><label class="switch">Hiện toàn bộ dãy nước<input id="all" type="checkbox"></label>${mode === "both" ? '<label class="switch">Hiện nước đúng khi sai<input id="reveal" type="checkbox" checked></label>' : ""}<div class="review"><button class="secondary" id="prev" aria-label="Xem nước trước">← Trước</button><button class="secondary" id="next" aria-label="Xem nước sau">Sau →</button></div><button class="secondary hidden" id="resume" style="width:100%;margin-top:8px">Trở lại vị trí đang học</button><div class="controls"><button id="hint" class="primary">✦ Gợi ý nước đi</button><button id="restart" class="secondary">↻ Làm lại</button><button id="flip" class="secondary">⇅ Lật bàn</button></div><div id="finish"></div><p class="note" id="history"></p></div></aside></div>`;
  if (mode === "learn") {
    $("#continue").onclick = continueLesson;
    $("#lesson-prev").onclick = () => review(state.view - 1);
  }
  $("#back").onclick = home;
  $("#restart").onclick = () => start(id, mode);
  $("#flip").onclick = () => {
    state.flip = !state.flip;
    render();
  };
  $("#hint").onclick = () => {
    if (state.view !== state.index || state.done) return;
    state.hint = true;
    feedback("Gợi ý", expectedText());
    renderBoard();
  };
  $("#all").onchange = (e) => {
    state.showAll = e.target.checked;
    renderPanel();
    renderLesson();
  };
  if ($("#reveal"))
    $("#reveal").onchange = (e) => (state.reveal = e.target.checked);
  $("#prev").onclick = () => review(state.view - 1);
  $("#next").onclick = () => review(state.view + 1);
  $("#resume").onclick = () => review(state.index);
  $("#board").onpointerdown = pointerDown;
  $("#board").onpointermove = pointerMove;
  $("#board").onpointerup = pointerUp;
  $("#board").onpointercancel = () => {
    drag = null;
    renderBoard();
  };
  render();
  feedback(
    mode === "learn" ? "Học từng bước" : "Sẵn sàng luyện tập",
    mode === "learn"
      ? "Bấm Tiếp tục bên dưới bàn cờ để xem nước đầu tiên."
      : mode === "b"
        ? "Trắng đang chuẩn bị nước đầu tiên…"
        : "Hãy đi nước đầu tiên của khai cuộc.",
  );
  schedule();
}
function expectedText() {
  let m = state.o.moves[state.index];
  return m ? `Nước đúng: ${m.san} (${vi(m.san)}) · ${m.from} → ${m.to}` : "";
}
function feedback(t, d, wrong = false) {
  $("#feedback").className = "feedback" + (wrong ? " wrong" : "");
  $("#feedback").innerHTML = `<strong>${t}</strong><small>${d}</small>`;
}
function xy(s) {
  let x = files.indexOf(s[0]),
    y = 8 - Number(s[1]);
  return state.flip ? [7 - x, 7 - y] : [x, y];
}
function sq(x, y) {
  return files[state.flip ? 7 - x : x] + (state.flip ? y + 1 : 8 - y);
}
function canPlay() {
  return (
    state &&
    state.mode !== "learn" &&
    !state.done &&
    state.view === state.index &&
    (state.mode === "both" || state.c.turn() === state.mode)
  );
}

// Vẽ bàn cờ, quân cờ và các dấu gợi ý
function renderBoard() {
  let s = state,
    c = s.view === s.index ? s.c : new Chess(s.o.fens[s.view]),
    last = s.o.moves[s.view - 1],
    legal =
      s.selected && canPlay()
        ? c.moves({ square: s.selected, verbose: true })
        : [];
  $(".squares").innerHTML = Array.from({ length: 64 }, (_, i) => {
    let x = i % 8,
      y = Math.floor(i / 8),
      q = sq(x, y),
      p = c.get(q),
      mark = q === s.selected || (last && (q === last.from || q === last.to)),
      m = legal.find((m) => m.to === q);
    return `<button tabindex="0" aria-label="${q}${p ? " " + (p.color === "w" ? "Trắng " : "Đen ") + { p: "Tốt", r: "Xe", n: "Mã", b: "Tượng", q: "Hậu", k: "Vua" }[p.type] : ""}" data-square="${q}" class="square ${(x + y) % 2 ? "dark" : "light"}${mark ? " mark" : ""}${m ? (p ? " capture" : " dot") : ""}">${x === 0 ? `<span class="coord rank">${q[1]}</span>` : ""}${y === 7 ? `<span class="coord file">${q[0]}</span>` : ""}</button>`;
  }).join("");
  $(".squares")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = (e) => {
          if (e.detail === 0) select(b.dataset.square);
        }),
    );
  let active = {};
  c.board()
    .flat()
    .map((p, i) =>
      p ? { ...p, square: files[i % 8] + (8 - Math.floor(i / 8)) } : null,
    )
    .filter(Boolean)
    .forEach((p) => {
      let q = p.square,
        key = q,
        el = pieceNodes[key];
      if (!el || el.dataset.kind !== p.color + p.type) {
        el = document.createElement("div");
        el.className = "piece";
        el.dataset.kind = p.color + p.type;
        el.innerHTML = svg(p);
        $(".pieces").appendChild(el);
      }
      let [x, y] = xy(q);
      el.style.left = x * 12.5 + "%";
      el.style.top = y * 12.5 + "%";
      el.classList.remove("dragging");
      active[key] = el;
    });
  Object.values(pieceNodes).forEach((el) => {
    if (!Object.values(active).includes(el)) el.remove();
  });
  pieceNodes = active;
  $(".arrows").innerHTML = "";
  if (s.hint && s.view === s.index && !s.done) {
    let m = s.o.moves[s.index],
      [x, y] = xy(m.from),
      [a, b] = xy(m.to);
    $(".arrows").innerHTML =
      `<defs><marker id="head" markerWidth="3" markerHeight="3" refX="2.2" refY="1.5" orient="auto"><path d="M0 0L3 1.5L0 3Z" fill="#4b9f34"/></marker></defs><line x1="${x * 100 + 50}" y1="${y * 100 + 50}" x2="${a * 100 + 50}" y2="${b * 100 + 50}" stroke="#4b9f34" stroke-width="15" stroke-linecap="round" opacity=".88" marker-end="url(#head)"/>`;
  }
  $(".badges").innerHTML =
    s.badge && s.view === s.index
      ? (() => {
          let [x, y] = xy(s.badge.square);
          return `<div class="badge ${s.badge.good ? "good" : ""}" style="left:${(x + 1) * 12.5 - 5}%;top:${y * 12.5}%">${s.badge.good ? "✓" : "??"}</div>`;
        })()
      : "";
  $("#top-player").textContent = s.flip ? "Trắng" : "Đen";
  $("#bottom-player").textContent = s.flip ? "Đen" : "Trắng";
  $("#turn").textContent =
    s.view < s.index
      ? "Đang xem lại"
      : s.done
        ? "Đã hoàn thành"
        : (c.turn() === "w" ? "Trắng" : "Đen") +
          " đến lượt" +
          (c.in_check() ? " · Đang bị chiếu" : "");
}

// Cập nhật tiến độ và danh sách nước đi
function renderPanel() {
  let s = state,
    total = s.o.moves.length;
  $("#progress-text").textContent = `Nước ${s.index}/${total} lượt đi`;
  $("#errors").textContent = s.errors + " lần sai";
  $("#bar").style.width = (s.index / total) * 100 + "%";
  let end = s.showAll ? total : s.index;
  $("#moves").innerHTML = end
    ? Array.from(
        { length: Math.ceil(end / 2) },
        (_, r) =>
          `<div class="move-row"><span>${r + 1}.</span>${[r * 2, r * 2 + 1].map((i) => (i < end ? `<button data-view="${i + 1}" ${i >= s.index ? "disabled" : ""} class="${s.view === i + 1 ? "current" : ""}">${s.o.moves[i].san}<small>${vi(s.o.moves[i].san)}</small></button>` : "<div></div>")).join("")}</div>`,
      ).join("")
    : '<div class="empty">Các nước đã đi sẽ xuất hiện ở đây.<br>Ký hiệu quốc tế · Ký hiệu tiếng Việt</div>';
  $("#moves")
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => review(+b.dataset.view)));
  $("#prev").disabled = s.view === 0;
  $("#next").disabled = s.view === s.index;
  $("#resume").classList.toggle("hidden", s.view === s.index);
  $("#hint").disabled = s.done || s.view !== s.index;
  $("#history").textContent =
    `Chế độ này: ${stat().completed} lượt hoàn thành · ${stat().mistakes} lần sai tích lũy`;
}
function render() {
  renderBoard();
  renderPanel();
  renderLesson();
}

// Xem lại những nước đã học
function review(n) {
  clearTimeout(timer);
  state.view = Math.max(0, Math.min(n, state.index));
  state.selected = null;
  state.hint = false;
  render();
  feedback(
    state.view < state.index ? "Đang xem lại" : "Tiếp tục luyện tập",
    state.view < state.index
      ? "Trở lại vị trí đang học để tiếp tục."
      : state.done
        ? "Bạn đã hoàn thành dãy nước."
        : "Hãy đi nước tiếp theo.",
  );
  if (state.view === state.index) schedule();
}
function select(q) {
  if (!canPlay()) return;
  let p = state.c.get(q);
  if (
    state.selected &&
    q !== state.selected &&
    (!p || p.color !== state.c.turn())
  ) {
    attempt(state.selected, q);
    return;
  }
  state.selected = p && p.color === state.c.turn() ? q : null;
  renderBoard();
}

// Đổi vị trí chạm hoặc chuột thành ô cờ
function target(e) {
  let r = $("#board").getBoundingClientRect(),
    x = Math.floor(((e.clientX - r.left) / r.width) * 8),
    y = Math.floor(((e.clientY - r.top) / r.height) * 8);
  return x < 0 || y < 0 || x > 7 || y > 7 ? null : sq(x, y);
}
function pointerDown(e) {
  if (e.button !== 0 || !canPlay()) return;
  let q = target(e),
    p = state.c.get(q);
  drag = {
    from: q,
    x: e.clientX,
    y: e.clientY,
    moved: false,
    own: p && p.color === state.c.turn(),
  };
  $("#board").setPointerCapture(e.pointerId);
  if (drag.own) {
    state.selected = q;
    renderBoard();
  }
}
function pointerMove(e) {
  if (!drag || !drag.own) return;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
  if (!drag.moved) return;
  let el = pieceNodes[drag.from],
    r = $("#board").getBoundingClientRect();
  el.classList.add("dragging");
  el.style.left = ((e.clientX - r.left) / r.width) * 100 - 6.25 + "%";
  el.style.top = ((e.clientY - r.top) / r.height) * 100 - 6.25 + "%";
}
function pointerUp(e) {
  if (!drag) return;
  let d = drag;
  drag = null;
  let q = target(e);
  if (d.moved && q && q !== d.from) attempt(d.from, q);
  else if (!d.own && q) select(q);
  else renderBoard();
}

// Kiểm tra nước người chơi vừa thực hiện
function attempt(from, to) {
  if (!canPlay()) return false;
  let legal = state.c
      .moves({ square: from, verbose: true })
      .find((m) => m.to === to),
    expected = state.o.moves[state.index];
  state.selected = null;
  if (!legal) {
    renderBoard();
    feedback("Nước đi không hợp lệ", "Hãy chọn một ô được đánh dấu.");
    audio("wrong");
    return false;
  }
  if (from !== expected.from || to !== expected.to) {
    state.errors++;
    stat().mistakes++;
    save();
    state.hint = state.mode !== "both" || state.reveal;
    state.badge = { square: to, good: false };
    render();
    feedback(
      "Sai rồi — hãy thử lại",
      state.hint
        ? expectedText()
        : "Nước này chưa đúng dãy khai cuộc. Bạn có thể dùng Gợi ý.",
      true,
    );
    audio("wrong");
    return false;
  }
  advance();
  return true;
}

// Thực hiện nước tiếp theo trong khai cuộc
function advance() {
  if (!state || state.done) return;
  let s = state,
    m = s.o.moves[s.index],
    el = pieceNodes[m.from];
  if (pieceNodes[m.to]) {
    pieceNodes[m.to].remove();
    delete pieceNodes[m.to];
  }
  if (el) {
    delete pieceNodes[m.from];
    pieceNodes[m.to] = el;
  }
  if (m.flags.includes("k") || m.flags.includes("q")) {
    let rank = m.from[1],
      a = (m.flags.includes("k") ? "h" : "a") + rank,
      b = (m.flags.includes("k") ? "f" : "d") + rank;
    pieceNodes[b] = pieceNodes[a];
    delete pieceNodes[a];
  }
  s.c.move({ from: m.from, to: m.to, promotion: m.promotion });
  s.index++;
  s.view = s.index;
  s.selected = null;
  s.hint = false;
  s.badge = { square: m.to, good: true };
  audio(m.captured ? "capture" : "move");
  if (s.index === s.o.moves.length) {
    s.done = true;
    stat().completed++;
    save();
  }
  render();
  $("#moves").scrollTop = $("#moves").scrollHeight;
  feedback(
    s.mode === "learn" ? "Quan sát nước vừa đi" : "Chính xác!",
    `${m.san} (${vi(m.san)}) · ${s.done ? "Bạn đã hoàn thành toàn bộ dãy nước." : "Tiếp tục phát triển thế cờ."}`,
  );
  if (s.done) {
    $("#finish").innerHTML =
      `<div class="finish"><div style="font-size:34px">★</div><h2>Hoàn thành khai cuộc!</h2><p>${s.o.name} · ${s.errors} lần sai</p><button class="primary" id="again">Học lại</button><br><button class="secondary" id="change">Chuyển chế độ</button><button class="secondary" id="other">Chọn khai cuộc khác</button></div>`;
    $("#again").onclick = () => start(s.o.id, s.mode);
    $("#change").onclick = () => choose(s.o.id);
    $("#other").onclick = home;
  } else schedule();
}

// Tự đi phía đối phương ở chế độ một phía
function schedule() {
  clearTimeout(timer);
  if (
    state &&
    !state.done &&
    state.view === state.index &&
    state.mode !== "both" &&
    state.mode !== "learn" &&
    state.c.turn() !== state.mode
  ) {
    let s = state;
    timer = setTimeout(() => {
      if (state === s && s.view === s.index) advance();
    }, 600);
  }
}

// Nội dung và điều khiển chế độ học từng bước
function moveExplanation(m) {
  const names = { p: "Tốt", n: "Mã", b: "Tượng", r: "Xe", q: "Hậu", k: "Vua" };
  let action = m.flags.includes("k")
    ? "Nhập thành cánh vua: vua và xe cùng di chuyển."
    : m.flags.includes("q")
      ? "Nhập thành cánh hậu: vua và xe cùng di chuyển."
      : m.flags.includes("e")
        ? "Bắt tốt qua đường: tốt đối phương vừa đi hai ô bị bắt."
        : `${names[m.piece]} từ ${m.from} đến ${m.to}${m.captured ? ", bắt " + names[m.captured].toLowerCase() + " đối phương" : ""}.`;
  return (
    action + (m.san.includes("+") ? " Nước này chiếu vua đối phương." : "")
  );
}
function renderLesson() {
  if (!state || state.mode !== "learn") return;
  let s = state,
    m = s.o.moves[s.view - 1];
  $("#lesson-text").innerHTML = m
    ? `<span class="eyebrow">BƯỚC ${s.view} / ${s.o.moves.length} · ${m.color === "w" ? "TRẮNG" : "ĐEN"}</span><h2>${m.san} <small>(${vi(m.san)})</small></h2><p>${moveExplanation(m)}</p>`
    : `<span class="eyebrow">QUAN SÁT & GHI NHỚ</span><h2>Bắt đầu từ thế cờ ban đầu</h2><p>Bấm Tiếp tục để xem từng lượt Trắng và Đen. Bạn có thể quay lại bất cứ lúc nào.</p>`;
  $("#lesson-prev").disabled = s.view === 0;
  $("#continue").disabled = s.done && s.view === s.index;
  $("#continue").textContent =
    s.done && s.view === s.index ? "Đã học xong ✓" : "Tiếp tục →";
  $("#hint").classList.add("hidden");
  $("#errors").textContent = "Học từng bước";
  $("#progress-text").textContent = `Bước ${s.view}/${s.o.moves.length}`;
  $("#bar").style.width = (s.view / s.o.moves.length) * 100 + "%";
}
function continueLesson() {
  if (!state || state.mode !== "learn") return;
  if (state.view < state.index) review(state.view + 1);
  else if (!state.done) advance();
}
home();
