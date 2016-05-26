#! /bin/bash
echo "##############################################################  username of last commit "
echo $CIRCLE_USERNAME
if [[ $CIRCLE_USERNAME = "quezx" ]] ;
	then
	echo "##############################################################  last commit by quezx, So skipped"
	exit 1 ;
fi
#if [[ ! -Z $CIRCLE_USERNAME ]] ; then exit 0;
echo "##############################################################  remoted"
git remote -v
echo "##############################################################  Setting git config user.email(noble@quetzal.in) and user.name"
git config --global user.email "noble@quetzal.in"
git config --global user.name "Quezx CI"
echo "##############################################################  qqapi: Listing branches"
git branch -a
echo "##############################################################  qqapi: git checkout origin/dev"
git reset --hard
echo "##############################################################  qqapi: Listing branches"
git remote update
echo "##############################################################  qqapi: git checkout origin/dev"
git checkout origin/dev
echo "##############################################################  qqapi: git checkout -b dev"
git checkout -b dev
echo "##############################################################  qqapi: git checkout staging"
git checkout staging
echo "##############################################################  qqapi: Rebasing dev on staging"
git rebase dev
echo "##############################################################  qqapi: git checkout dev"
git checkout dev
echo "##############################################################  Merging staging with dev"
git merge staging
echo "##############################################################  Deleting Staging"
git branch -D staging
git push origin --delete staging
echo "##############################################################  qqapi: git push origin dev"
git push origin dev
echo "##############################################################  qqapi: git checkout -b staging"
git checkout -b staging
echo "##############################################################  qqapi: git push origin staging"
git push origin staging

echo "##############################################################  Creating folder dist"
mkdir dist

echo "##############################################################  Changing PWD to folderdist"
cd dist

echo "##############################################################  Git Init"
git init

echo "##############################################################  Adding dist remote "
git remote add origin https://github.com/quezx/qapi.dist

echo "##############################################################  Pulling staging "
ls

echo "##############################################################  Listing file in dist with brach staging "
git pull origin staging

echo "##############################################################  git checkout origin/staging "
git checkout origin/staging

echo "##############################################################  git checkout origin/staging "
git checkout -b staging

echo "##############################################################  dist branches "
git branch -a

echo "##############################################################  Changing PWD to back to root folder  <--"
cd ..
pwd

echo "##############################################################  Pruning npm modules"
npm prune

echo "##############################################################  Installing npm modules"
npm install

echo "##############################################################  Installing grunt-cli and bower"
npm install -g grunt-cli bower

echo "##############################################################  Listing npm modules"
npm list --depth=0

echo "##############################################################  Installing bower components"
bower install --force-latest

echo "##############################################################  Starting build with -f (force)"
grunt build -f

echo "##############################################################  Changing Directory to ./dist ==>"
cd dist
pwd

echo "##############################################################  dist branches "
git branch -a

echo "##############################################################  Adding files to git"
git add --all

echo "##############################################################  git status"
git status

echo "##############################################################  Listing file in dist staging "
ls

echo "##############################################################  Commiting..."
COMMIT_MSG=$(git log --format=oneline -n 1 $CIRCLE_SHA1)
git commit -m "$COMMIT_MSG"

echo "##############################################################  git status after commit"
git status

echo "##############################################################  Listing file in dist staging "
ls

echo "##############################################################  Started deploying"
git push origin staging

echo "##############################################################  Deployed Successfully!"
exit 0
