MCPATH=$1
JSONPATH="./public/json"
TEXPATH="./public/images/textures"

for file in $JSONPATH/blocks/*
do
  cp $MCPATH/models/block/$(basename "$file") $file
done

for file in $JSONPATH/states/*
do
  cp $MCPATH/blockstates/$(basename "$file") $file
done

for file in $TEXPATH/block/*
do
  cp $MCPATH/textures/block/$(basename "$file") $file
done

for file in $TEXPATH/environment/*
do
  cp $MCPATH/textures/environment/$(basename "$file") $file
done