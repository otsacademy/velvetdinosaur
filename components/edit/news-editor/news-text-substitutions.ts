/*
The MIT License (MIT)

Copyright (c) Ziad Beyens, Dylan Schiemann, Joe Anderson, Felix Feng

Unless otherwise specified in a LICENSE file within an individual package directory,
this license applies to all files in this repository outside of those package directories.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
// Text substitutions retained from the MIT-licensed Plate 52 autoformat rules.
import type { TextSubstitutionPattern } from 'platejs';
export const NEWS_TEXT_SUBSTITUTIONS: TextSubstitutionPattern[] = [
  {
    "match": "\"",
    "format": [
      "“",
      "”"
    ]
  },
  {
    "match": "'",
    "format": [
      "‘",
      "’"
    ]
  },
  {
    "match": "--",
    "format": "—"
  },
  {
    "match": "...",
    "format": "…"
  },
  {
    "match": ">>",
    "format": "»"
  },
  {
    "match": "<<",
    "format": "«"
  },
  {
    "match": [
      "(tm)",
      "(TM)"
    ],
    "format": "™"
  },
  {
    "match": [
      "(r)",
      "(R)"
    ],
    "format": "®"
  },
  {
    "match": [
      "(c)",
      "(C)"
    ],
    "format": "©"
  },
  {
    "match": "&trade;",
    "format": "™"
  },
  {
    "match": "&reg;",
    "format": "®"
  },
  {
    "match": "&copy;",
    "format": "©"
  },
  {
    "match": "&sect;",
    "format": "§"
  },
  {
    "match": "->",
    "format": "→"
  },
  {
    "match": "<-",
    "format": "←"
  },
  {
    "match": "=>",
    "format": "⇒"
  },
  {
    "match": [
      "<=",
      "≤="
    ],
    "format": "⇐"
  },
  {
    "match": "!>",
    "format": "≯"
  },
  {
    "match": "!<",
    "format": "≮"
  },
  {
    "match": ">=",
    "format": "≥"
  },
  {
    "match": "<=",
    "format": "≤"
  },
  {
    "match": "!>=",
    "format": "≱"
  },
  {
    "match": "!<=",
    "format": "≰"
  },
  {
    "match": "!=",
    "format": "≠"
  },
  {
    "match": "==",
    "format": "≡"
  },
  {
    "match": [
      "!==",
      "≠="
    ],
    "format": "≢"
  },
  {
    "match": "~=",
    "format": "≈"
  },
  {
    "match": "!~=",
    "format": "≉"
  },
  {
    "match": "+-",
    "format": "±"
  },
  {
    "match": "%%",
    "format": "‰"
  },
  {
    "match": [
      "%%%",
      "‰%"
    ],
    "format": "‱"
  },
  {
    "match": "//",
    "format": "÷"
  },
  {
    "match": "1/2",
    "format": "½"
  },
  {
    "match": "1/3",
    "format": "⅓"
  },
  {
    "match": "1/4",
    "format": "¼"
  },
  {
    "match": "1/5",
    "format": "⅕"
  },
  {
    "match": "1/6",
    "format": "⅙"
  },
  {
    "match": "1/7",
    "format": "⅐"
  },
  {
    "match": "1/8",
    "format": "⅛"
  },
  {
    "match": "1/9",
    "format": "⅑"
  },
  {
    "match": "1/10",
    "format": "⅒"
  },
  {
    "match": "2/3",
    "format": "⅔"
  },
  {
    "match": "2/5",
    "format": "⅖"
  },
  {
    "match": "3/4",
    "format": "¾"
  },
  {
    "match": "3/5",
    "format": "⅗"
  },
  {
    "match": "3/8",
    "format": "⅜"
  },
  {
    "match": "4/5",
    "format": "⅘"
  },
  {
    "match": "5/6",
    "format": "⅚"
  },
  {
    "match": "5/8",
    "format": "⅝"
  },
  {
    "match": "7/8",
    "format": "⅞"
  },
  {
    "match": "^o",
    "format": "°"
  },
  {
    "match": "^+",
    "format": "⁺"
  },
  {
    "match": "^-",
    "format": "⁻"
  },
  {
    "match": "~+",
    "format": "₊"
  },
  {
    "match": "~-",
    "format": "₋"
  },
  {
    "match": "^0",
    "format": "⁰"
  },
  {
    "match": "^1",
    "format": "¹"
  },
  {
    "match": "^2",
    "format": "²"
  },
  {
    "match": "^3",
    "format": "³"
  },
  {
    "match": "^4",
    "format": "⁴"
  },
  {
    "match": "^5",
    "format": "⁵"
  },
  {
    "match": "^6",
    "format": "⁶"
  },
  {
    "match": "^7",
    "format": "⁷"
  },
  {
    "match": "^8",
    "format": "⁸"
  },
  {
    "match": "^9",
    "format": "⁹"
  },
  {
    "match": "~0",
    "format": "₀"
  },
  {
    "match": "~1",
    "format": "₁"
  },
  {
    "match": "~2",
    "format": "₂"
  },
  {
    "match": "~3",
    "format": "₃"
  },
  {
    "match": "~4",
    "format": "₄"
  },
  {
    "match": "~5",
    "format": "₅"
  },
  {
    "match": "~6",
    "format": "₆"
  },
  {
    "match": "~7",
    "format": "₇"
  },
  {
    "match": "~8",
    "format": "₈"
  },
  {
    "match": "~9",
    "format": "₉"
  }
];
