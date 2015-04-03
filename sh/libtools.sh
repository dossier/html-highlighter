#!/bin/bash

function message () {
  echo -e "\033[32m$1\033[0m"
}

function info () {
  message "I: $1"
}

function error () {
  >&2 echo -e "\033[31mE: $1\033[0m"
  exit 1
}
