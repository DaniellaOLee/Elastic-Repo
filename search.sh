#!/bin/sh

if [ "$1" = '' ]
then
	echo "Please enter a search parameter"
else
	curl -XGET 'https://search-qacelasticrepo-kyotxaszaawzpupboj3xpgoi7m.us-west-2.es.amazonaws.com/_search?&pretty' -d '{"query" : {"match_phrase_prefix": {"_all": '"\"$1\""'}}}' | jq '.hits.hits[]._source.location'
fi
