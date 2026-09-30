# heyid.me

Statyczna strona (bez frameworków i bez zależności npm). Wymaga tylko Node.js 20+.

## Uruchomienie lokalnie (Windows, folder E:\heyid-me)
```
npm run dev
```
Otwórz http://localhost:8080. Po każdej zmianie uruchom polecenie ponownie.
Żeby zobaczyć artykuły z przyszłą datą: `set DRAFTS=1&& npm run dev` (PowerShell: `$env:DRAFTS=1; npm run dev`).

## Publikacja
1. `git init`, `git add .`, `git commit -m "start"`, podłącz repozytorium `heyid-me` i `git push -u origin main`.
2. GitHub → Settings → Pages → **Source: GitHub Actions**.
3. W tych samych ustawieniach wpisz Custom domain `heyid.me` i zaznacz **Enforce HTTPS**.
4. U rejestratora domeny ustaw DNS według aktualnej dokumentacji GitHub Pages (rekordy A dla domeny głównej, CNAME dla www).

Każdy push na `main` przebudowuje stronę. Dodatkowo strona przebudowuje się codziennie o 05:15 UTC, więc artykuły z przyszłą datą (`date:`) same pojawią się w dniu publikacji.

## Nowy artykuł (co tydzień)
Skopiuj `SZABLON-ARTYKULU.md` do `src/blog/nazwa-artykulu.md`, uzupełnij i zrób push.
Przy budowaniu skrypt wypisze ostrzeżenia: za długi tytuł, zły opis, za mało słów, brak CTA, puste linki „related” i Twoje notatki `{{todo: ...}}`.

## Reklamy AdSense
Po akceptacji wpisz w `site.json` swój `client` (ca-pub-...) oraz `slots`. Dopóki pole jest puste, na stronie nie ma ani skryptu, ani miejsc na reklamy.
Zgody na cookies skonfiguruj w AdSense → Privacy & messaging (komunikat Google zgodny z TCF).

## Języki interfejsu
`public/i18n/*.json`. Żeby dodać język, skopiuj `en.json`, przetłumacz wartości i dopisz kod języka w `SUPPORTED` w `public/js/app.js` oraz opcję w stopce (`lib/templates.mjs`).
