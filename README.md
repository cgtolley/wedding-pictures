# Event photo site

Two pages:

- **index.html**: full-screen slideshow that shows photos in random order
- **gallery.html**: grid of every photo. Tap one to view it large and download it, or use **Download all** to get a .zip

## 1. Preview it

Double-click `index.html` to open it in your browser.
(**Download all** only works once the site is online.)

## 2. Set the name, date and color

Open `config.js` in any text editor (TextEdit works) and change the values.

## 3. Add your real photos

1. Put your original photos in any folder, for example `~/Downloads/event-originals`.
2. Open **Terminal**, drag this site folder onto it after typing `cd `, and press Enter.
3. Run:

   ```
   ./prepare-photos.sh ~/Downloads/event-originals
   ```

This resizes every photo to 2048 px on the long edge, makes thumbnails, removes the
stand-in photos, and updates `photos.js`. Your originals are not changed.
If you add more photos later, run it again. Only new ones get processed.

## 4. Publish free on GitHub Pages

1. Create a free account at github.com and install **GitHub Desktop** (desktop.github.com).
2. In GitHub Desktop, choose **File → Add Local Repository**, pick this folder, and click
   "create a repository" when it asks.
3. Click **Publish repository**. Untick "Keep this code private", then click Publish.
4. On github.com, open the repository and go to **Settings → Pages**. Under "Branch", choose
   **main** and **/ (root)**, then click **Save**.
5. After a minute or two your site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

To update the site later (after adding photos or editing `config.js`), open GitHub Desktop,
type a short summary, click **Commit**, then click **Push origin**.

Limits: GitHub Pages sites can be up to 1 GB, which is about 2,000 photos at this size.
