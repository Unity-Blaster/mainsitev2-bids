#!/bin/bash

git log -1 --pretty=oneline --abbrev-commit | grep -w "PROD" && exit 1 || exit 0
