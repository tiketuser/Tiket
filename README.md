# Tiket

Tiket is a website that allows costumers resell their tickets and buy resold one.

### Installation

make sure you have:

- Visual Studio Code
- git installed
- nodejs installed (npm should be included in this installation)

on VS Code's terminal:

```bash
  git clone <project url>
  npm install next@latest react@latest react-dom@latest
  cd <project dir>
  git checkout <your branch>
```

#### Extensions in VS Code (not required)

Extensions that can make ease of usage:

- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- vscode-icons

###  Getting Started with Development
To ensure smooth collaboration and avoid branch conflicts, follow these steps whenever you start working on a new feature or fix:

1. Pull the Latest Changes from dev
Before creating a new branch, make sure you have the latest code from the dev branch:

```bash
git checkout dev
git pull origin dev
```
2. Create a New Feature or Bug Branch
Always create a new branch off the latest dev branch. Use a descriptive branch name that follows your team's naming conventions:

For a feature: feature/your-feature-name
For a bug fix: bugfix/your-bug-description
Run:

```bash
git checkout -b feature/your-feature-name
```
or

```bash
git checkout -b bugfix/your-bug-description
```

3. Regularly Sync Your Branch with dev
To minimize conflicts, keep your branch up-to-date with the latest changes from dev:

```bash
git fetch origin
git merge origin/dev
```
Do this periodically while working on your branch, especially if the dev branch is actively updated.

4. Resolve Merge Conflicts (If Any)
If there are conflicts while merging, resolve them manually in your editor. After resolving, run:
```bash
git add .
git commit -m "Resolve merge conflicts with dev"
```-

5. Push Your Branch to Remote
Once your work is ready or when you want to share progress, push your branch to the remote repository:

```bash
git push origin feature/your-feature-name
```
or

```bash
git push origin bugfix/your-bug-description
```

6. Create a Pull Request (PR)
- Go to the repository on GitHub.
- Create a Pull Request from your branch into the dev branch.
- Add a descriptive title and a detailed description of your changes.
- Assign reviewers if needed and submit the PR.
  
###  Keeping Your Branch Conflict-Free
Always pull the latest changes from dev before starting or continuing work:

```bash
git pull origin dev
```
Avoid working directly on the dev branch. Always create a feature or bug branch for your work.

