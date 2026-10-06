# Setting up sign-in and the class dashboard

You do this once. It takes about 15 minutes. Everything here is free on Supabase's free plan.

## 1. Create the Supabase project
1. Go to **supabase.com** → Start your project → sign in (GitHub account works).
2. **New project**. Name: `quranic-arabic`. Set a database password (save it somewhere). Pick the region nearest you (e.g. East US). Create.
3. Wait a minute for it to finish setting up.

## 2. Create the tables
1. Left sidebar → **SQL Editor** → **New query**.
2. Open `setup-class.sql` from this folder, copy everything, paste, click **Run**. It should say "Success".

## 3. Turn off public sign-ups (so only people you add can sign in)
1. Left sidebar → **Authentication** → **Sign In / Providers** (or **Providers**) → **Email**.
2. Keep Email enabled. Turn **off** "Allow new users to sign up". Turn **off** "Confirm email". Save.

## 4. Create accounts (you + 3 students)
Students sign in with **just a name** (e.g. `ahmed`) and a password. In Supabase each name is stored
as an email ending in `@example.com` — nobody ever sees or receives email.
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: the student's name + `@example.com`, all lowercase, no spaces — e.g. `ahmed@example.com`.
   Password: something they can type (at least 6 characters). Tick **Auto Confirm User**, create.
3. Repeat for each student. Give each one a card with their **name** (`ahmed`) and password.
4. Make your own account the same way (e.g. `uzair@example.com`), or use your real email — both work.

## 5. Connect the app
1. **Project Settings** (gear icon) → **API** (or **Data API**).
2. Copy the **Project URL** and the **anon / publishable** key.
3. Open `config.js` in this folder and paste them between the quotes:
   ```
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseAnonKey: 'eyJ…'
   ```
   (The anon key is meant to be public; the table rules from step 2 are what keep data private.)
4. Upload the folder to GitHub Pages as before.

## 6. Make yourself the teacher
1. Open the app, sign in with **your** account, enter your name.
2. Back in Supabase → SQL Editor → run (with your email):
   ```
   update public.profiles set role = 'teacher' where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Reload the app. A **Class** tab appears for you only.

## How it behaves
- Students sign in once per iPad; they stay signed in, and it works offline after that.
- Progress saves to the cloud every 30 seconds while online, and when the app is closed.
- Any student can use any iPad: signing out saves their work; the next student signs in and gets their own.
  If a student forgets to sign out, nothing is lost — their unsaved work is kept aside on that iPad and
  merged into their account next time they sign in there.
- If a student studies on two iPads while offline, both sets of progress are merged when they reconnect.
- The book PDF stays on each iPad and is shared by everyone who uses that iPad.
- Forgot a password? Supabase → Authentication → Users → the student → reset / set a new password.
