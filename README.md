# Qur'anic Arabic — Kalimāt & Lisān

One app for Qur'anic vocabulary (Kalimāt), reading the Qur'an with full grammatical analysis,
and the Lisan ul Quran grammar course with lesson tests.

## Sign-in and class dashboard (optional)
To give each student their own account, with progress that follows them to any iPad and a Class view for you,
follow **SETUP-CLASS.md** before uploading. Without it, the app works as before with progress kept on each device.

## Put it online (GitHub Pages)
1. Create a public repository on github.com.
2. Upload **everything in this folder** (keep the `fonts`, `icons` and `vendor` folders as folders).
   `index.html` must be at the top level.
3. Settings → Pages → Deploy from a branch → `main`, `/ (root)` → Save.
4. Open the address GitHub shows (https://YOURNAME.github.io/REPO/).

Do **not** upload the Lisan ul Quran PDF or the Dream Textbook / Workbook PDFs. Each person adds their own
copies once (Book → "Books on this device", or the Add button inside any chapter); they stay on that device.
The Dream books are free from Bayyinah: https://explore.bayyinahtv.com/beginner-arabic/
Each Book chapter puts one topic in one place: the explanation, the Lisan ul Quran pages, the matching
Dream textbook pages, the Dream homework (answer key hidden until opened), then drills and the lesson test.

## Install it
- **iPad / iPhone:** Safari → Share → Add to Home Screen.
- **Windows:** Edge or Chrome → Install icon in the address bar.
- **Android:** Chrome → menu → Install app.

After the first visit everything works offline. Progress is stored on each device separately.

## Updating
Upload the changed files over the old ones. Also edit `sw.js` and raise the number in `VERSION='qa-v6'`
(e.g. to `qa-v7`) so installed copies fetch the new files.

## Test on your own PC before uploading
The app must be served over http, not opened by double-clicking. In this folder run:
`python -m http.server 8000` and open http://localhost:8000

## Credits
See **ATTRIBUTIONS.md** for the data, fonts and libraries this app uses and their licences. Licensed under GPL-3.0.
