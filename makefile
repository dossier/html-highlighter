# makefile --- Master make file
#
# Copyright (c) 2015 Diffeo
#
# Comments:
#


DIR_OUTPUT=out
DIR_OUTPUT_DOC=$(DIR_OUTPUT)/doc
DIR_OUTPUT_SRC=$(DIR_OUTPUT)/src


all: build man

help:
	echo "Usage: make [ clean | deps ]"

clean:
	echo "I: removing output directory"
	rm -vfr "$(DIR_OUTPUT)"
	echo "I: deleting extraneous files"
	find -type f \( -name '*~' -or -name '\#*' -or -name '.\#*' \) -exec rm -fv {} +

deps:
	echo "I: updating dependencies"
	sh/update-deps

.SILENT:
