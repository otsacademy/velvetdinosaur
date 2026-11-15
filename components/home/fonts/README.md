# Letter design fonts

Self-hosted copies of the three faces used by the public pages, loaded through
`next/font/local` in `../letter-fonts.ts`. Keeping them in the repository means
a build never has to fetch them, and each file is only as large as it needs to
be.

| File | Face | Notes |
| --- | --- | --- |
| `newsreader-opsz60-roman.woff2` | Newsreader, upright | Weights 400 to 700, optical size fixed at 60 |
| `newsreader-opsz60-italic.woff2` | Newsreader, italic | Weights 400 to 700, optical size fixed at 60 |
| `source-sans-3.woff2` | Source Sans 3 | Weights 400 to 700 |
| `caveat-600.woff2` | Caveat | Weight 600 only |

All are the Latin subset from Google Fonts, under the SIL Open Font License 1.1.

Newsreader has an optical-size axis. Shipping the whole axis costs about 280 KB
for the two styles; fixing it at 60 costs about 125 KB and looks almost the
same at the sizes this design uses, so the files here are fixed. To change it,
download a new instance from the Google Fonts CSS API, for example
`family=Newsreader:ital,opsz,wght@0,60,400..700;1,60,400..700`.
